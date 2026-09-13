import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, ordersCol } from '../services/firebaseConfig';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAudioAlert } from './useAudioAlert';
import { Order, OrderStatus } from '../types/schema';

// Fallback seed orders when running offline or without live credentials
const MOCK_INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1048',
    customerId: 'cust_user_001',
    customerName: 'Rohit Kumar',
    customerPhone: '+919876543210',
    deliveryAddress: {
      id: 'addr_1',
      userId: 'cust_user_001',
      label: 'Home',
      streetAddress: 'Flat 302, Green Valley Apartments, Pocket 2',
      landmark: 'Near Community Park Gate 1',
      pincode: '110001',
      isDefault: true,
    },
    items: [
      {
        id: 'item_1',
        productId: 'prod-atta-01',
        productName: 'Aashirvaad Shudh Chakki Atta',
        unit: '5 kg',
        quantity: 1,
        unitPrice: 245,
        totalPrice: 245,
      },
      {
        id: 'item_2',
        productId: 'prod-milk-04',
        productName: 'Amul Taaza Toned Fresh Milk',
        unit: '500 ml',
        quantity: 2,
        unitPrice: 27,
        totalPrice: 54,
      },
    ],
    itemTotal: 299,
    deliveryFee: 0,
    discountAmount: 0,
    finalTotal: 299,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    status: 'RECEIVED',
    statusTimeline: [
      {
        status: 'RECEIVED',
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        note: 'Order placed by customer',
      },
    ],
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-1047',
    customerId: 'cust_user_002',
    customerName: 'Pooja Sharma',
    customerPhone: '+919811223344',
    deliveryAddress: {
      id: 'addr_2',
      userId: 'cust_user_002',
      label: 'Home',
      streetAddress: 'House 42, Sector 4, Pocket 1',
      landmark: 'Opposite Mother Dairy',
      pincode: '110001',
      isDefault: true,
    },
    items: [
      {
        id: 'item_3',
        productId: 'prod-tea-09',
        productName: 'Tata Tea Gold Leaf Tea',
        unit: '500 g',
        quantity: 1,
        unitPrice: 275,
        totalPrice: 275,
      },
    ],
    itemTotal: 275,
    deliveryFee: 0,
    discountAmount: 0,
    finalTotal: 275,
    paymentMethod: 'UPI',
    paymentStatus: 'COMPLETED',
    transactionRef: 'UPI-REF-98321094',
    status: 'PREPARING',
    statusTimeline: [
      {
        status: 'RECEIVED',
        timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      },
      {
        status: 'PREPARING',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        note: 'Shopkeeper started packing',
      },
    ],
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-1046',
    customerId: 'cust_user_003',
    customerName: 'Amit Verma',
    customerPhone: '+919877001122',
    deliveryAddress: {
      id: 'addr_3',
      userId: 'cust_user_003',
      label: 'Shop',
      streetAddress: 'Shop 18, Commercial Complex',
      landmark: 'Near SBI ATM',
      pincode: '110001',
      isDefault: false,
    },
    items: [
      {
        id: 'item_4',
        productId: 'prod-maggi-08',
        productName: 'Maggi 2-Minute Masala Instant Noodles',
        unit: '280 g',
        quantity: 2,
        unitPrice: 54,
        totalPrice: 108,
      },
    ],
    itemTotal: 108,
    deliveryFee: 20,
    discountAmount: 0,
    finalTotal: 128,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    status: 'OUT_FOR_DELIVERY',
    deliveryPartner: {
      name: 'Ramesh (Delivery Partner)',
      phone: '+919876001122',
    },
    statusTimeline: [
      {
        status: 'RECEIVED',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        status: 'PREPARING',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
      {
        status: 'OUT_FOR_DELIVERY',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

/**
 * Normalizes Firestore or Supabase database order record to the unified Order schema
 */
function normalizeOrderRecord(data: any, id: string): Order {
  return {
    id: data.order_id || id,
    customerId: data.customer_uid || data.customerId || '',
    customerName: data.customer_name || data.customerName || 'Customer',
    customerPhone: data.customer_phone || data.customerPhone || '',
    deliveryAddress: data.delivery_address || data.deliveryAddress || {
      id: 'addr-default',
      userId: data.customer_uid || '',
      label: 'Home',
      streetAddress: 'Neighborhood delivery',
      pincode: '110001',
      isDefault: true,
    },
    items: (data.items || []).map((item: any, idx: number) => ({
      id: item.id || `item_${idx}`,
      productId: item.product_id || item.productId || '',
      productName: item.name || item.productName || 'Grocery Item',
      unit: item.unit_size || item.unit || '1 unit',
      quantity: item.quantity || 1,
      unitPrice: item.selling_price || item.unitPrice || 0,
      totalPrice: item.subtotal || item.totalPrice || (item.selling_price || 0) * (item.quantity || 1),
      imageUrl: item.image_url || item.imageUrl,
    })),
    itemTotal: data.item_total || data.itemTotal || data.total_amount || 0,
    deliveryFee: data.delivery_fee || data.deliveryFee || 0,
    discountAmount: data.discount_amount || data.discountAmount || 0,
    finalTotal: data.final_total || data.total_amount || data.finalTotal || 0,
    paymentMethod: data.payment_method || data.paymentMethod || 'COD',
    paymentStatus: data.payment_status || data.paymentStatus || 'PENDING',
    transactionRef: data.transaction_ref || data.transactionRef,
    status: data.status || 'RECEIVED',
    statusTimeline: data.status_timeline || data.statusTimeline || [],
    shopkeeperNotes: data.shopkeeper_notes || data.shopkeeperNotes,
    deliveryPartner: data.delivery_partner || data.deliveryPartner,
    createdAt: data.created_at?.toDate
      ? data.created_at.toDate().toISOString()
      : typeof data.created_at === 'string'
      ? data.created_at
      : new Date().toISOString(),
    updatedAt: data.updated_at?.toDate
      ? data.updated_at.toDate().toISOString()
      : typeof data.updated_at === 'string'
      ? data.updated_at
      : new Date().toISOString(),
  };
}

/**
 * useAdminOrdersRealtime
 * -----------------------
 * Real-Time listener for the Shopkeeper Counter / Tablet Kanban dashboard.
 * - Queries active pipeline orders: status != 'DELIVERED' (or status in [RECEIVED, PREPARING, OUT_FOR_DELIVERY])
 * - Orders by created_at DESC for immediate visibility of newest customer requests
 * - Plays continuous notification chime via Web Audio API on new orders until accepted
 * - Provides 1-click fulfillment functions syncing directly with Firestore / Supabase
 */
export function useAdminOrdersRealtime() {
  const [orders, setOrders] = useState<Order[]>(MOCK_INITIAL_ORDERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [, setTick] = useState(0);

  // Periodic tick every 30s to update elapsed urgency timers
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter columns
  const newOrders = useMemo(
    () => orders.filter((o) => o.status === 'RECEIVED'),
    [orders]
  );
  const packingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PREPARING'),
    [orders]
  );
  const outOrders = useMemo(
    () => orders.filter((o) => o.status === 'OUT_FOR_DELIVERY'),
    [orders]
  );

  // Continuous audio chime hook: rings while there are unacknowledged NEW orders
  const shouldRingAlert = newOrders.length > 0;
  const { playChime, isMuted, toggleMute } = useAudioAlert(shouldRingAlert);

  // Connect to Real-Time Database (Firestore or Supabase)
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let supabaseChannel: any = null;

    // 1. Check Firebase Firestore
    if (isFirebaseConfigured()) {
      try {
        setLoading(true);
        // Shopkeeper Pipeline Query:
        // status in ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY'], ordered by created_at DESC
        const q = query(
          collection(db, 'orders'),
          where('status', 'in', ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY']),
          orderBy('created_at', 'desc')
        );

        unsubscribeFirestore = onSnapshot(
          q,
          (snapshot) => {
            const fetchedOrders: Order[] = snapshot.docs.map((docSnap) =>
              normalizeOrderRecord(docSnap.data(), docSnap.id)
            );
            setOrders(fetchedOrders);
            setIsLiveBackend(true);
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.warn('[Firestore] Realtime orders listener error:', err);
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.warn('[Firestore] Initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    // 2. Fallback to Supabase Realtime if configured
    else if (isSupabaseConfigured()) {
      try {
        setLoading(true);
        const fetchSupabaseOrders = async () => {
          const { data, error: sbError } = await supabase
            .from('orders')
            .select('*')
            .in('status', ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY'])
            .order('created_at', { ascending: false });

          if (sbError) {
            console.warn('[Supabase] Initial query error:', sbError);
            setError(sbError.message);
          } else if (data) {
            setOrders(data.map((row: any) => normalizeOrderRecord(row, row.id)));
            setIsLiveBackend(true);
          }
          setLoading(false);
        };

        fetchSupabaseOrders();

        // Subscribe to real-time changes
        supabaseChannel = supabase
          .channel('shopkeeper-active-orders')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              fetchSupabaseOrders();
            }
          )
          .subscribe();
      } catch (err: any) {
        console.warn('[Supabase] Realtime error:', err);
        setError(err.message);
        setLoading(false);
      }
    } else {
      // 3. Demo / Local Mock Mode
      setLoading(false);
      setIsLiveBackend(false);
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 1-CLICK FULFILLMENT MUTATIONS (Admin Actions)
  // ---------------------------------------------------------------------------

  /**
   * Accept Order: Moves from 'RECEIVED' -> 'PREPARING'
   * Stops audio alert for this order immediately
   */
  const acceptOrder = useCallback(
    async (orderId: string) => {
      const nowIso = new Date().toISOString();

      // Optimistic state update
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                status: 'PREPARING',
                updatedAt: nowIso,
                statusTimeline: [
                  ...ord.statusTimeline,
                  {
                    status: 'PREPARING',
                    timestamp: nowIso,
                    note: 'Accepted by shopkeeper. Preparing items.',
                  },
                ],
              }
            : ord
        )
      );

      // Live Firestore Sync
      if (isFirebaseConfigured()) {
        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, {
            status: 'PREPARING',
            updated_at: serverTimestamp(),
          });
        } catch (err) {
          console.error('[Firestore] Failed to accept order:', err);
        }
      } else if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('orders')
            .update({ status: 'PREPARING', updated_at: nowIso })
            .eq('id', orderId);
        } catch (err) {
          console.error('[Supabase] Failed to accept order:', err);
        }
      }
    },
    []
  );

  /**
   * Dispatch Order: Moves from 'PREPARING' -> 'OUT_FOR_DELIVERY'
   */
  const dispatchOrder = useCallback(
    async (orderId: string, riderName = 'Ramesh (Delivery Rider)') => {
      const nowIso = new Date().toISOString();

      // Optimistic state update
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                status: 'OUT_FOR_DELIVERY',
                deliveryPartner: {
                  name: riderName,
                  phone: '+919876001122',
                },
                updatedAt: nowIso,
                statusTimeline: [
                  ...ord.statusTimeline,
                  {
                    status: 'OUT_FOR_DELIVERY',
                    timestamp: nowIso,
                    note: `Dispatched with ${riderName}`,
                  },
                ],
              }
            : ord
        )
      );

      // Live Backend Sync
      if (isFirebaseConfigured()) {
        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, {
            status: 'OUT_FOR_DELIVERY',
            delivery_partner: {
              name: riderName,
              phone: '+919876001122',
            },
            updated_at: serverTimestamp(),
          });
        } catch (err) {
          console.error('[Firestore] Failed to dispatch order:', err);
        }
      } else if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('orders')
            .update({
              status: 'OUT_FOR_DELIVERY',
              delivery_partner: { name: riderName, phone: '+919876001122' },
              updated_at: nowIso,
            })
            .eq('id', orderId);
        } catch (err) {
          console.error('[Supabase] Failed to dispatch order:', err);
        }
      }
    },
    []
  );

  /**
   * Deliver Order: Moves from 'OUT_FOR_DELIVERY' -> 'DELIVERED'
   * Removes from active board pipeline
   */
  const markDelivered = useCallback(
    async (orderId: string) => {
      const nowIso = new Date().toISOString();

      // Optimistic state update: Filter out delivered orders from active Kanban
      setOrders((prev) => prev.filter((ord) => ord.id !== orderId));

      // Live Backend Sync
      if (isFirebaseConfigured()) {
        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, {
            status: 'DELIVERED',
            updated_at: serverTimestamp(),
          });
        } catch (err) {
          console.error('[Firestore] Failed to deliver order:', err);
        }
      } else if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('orders')
            .update({ status: 'DELIVERED', updated_at: nowIso })
            .eq('id', orderId);
        } catch (err) {
          console.error('[Supabase] Failed to mark delivered:', err);
        }
      }
    },
    []
  );

  /**
   * Cancel Order: Moves to 'CANCELLED'
   */
  const cancelOrder = useCallback(
    async (orderId: string, reason = 'Customer requested cancellation') => {
      const nowIso = new Date().toISOString();

      setOrders((prev) => prev.filter((ord) => ord.id !== orderId));

      if (isFirebaseConfigured()) {
        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, {
            status: 'CANCELLED',
            cancellation_reason: reason,
            updated_at: serverTimestamp(),
          });
        } catch (err) {
          console.error('[Firestore] Failed to cancel order:', err);
        }
      } else if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('orders')
            .update({ status: 'CANCELLED', updated_at: nowIso })
            .eq('id', orderId);
        } catch (err) {
          console.error('[Supabase] Failed to cancel order:', err);
        }
      }
    },
    []
  );

  /**
   * Simulate Incoming Order: Injects a new order into Firestore (or local state)
   * to test live sound chime and counter tablet updates.
   */
  const simulateIncomingOrder = useCallback(async () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${randomNum}`;
    const nowIso = new Date().toISOString();

    const mockOrder: Order = {
      id: orderId,
      customerId: `cust_${randomNum}`,
      customerName: 'Sunita Mehra',
      customerPhone: '+919810987654',
      deliveryAddress: {
        id: `addr_${randomNum}`,
        userId: `cust_${randomNum}`,
        label: 'Home',
        streetAddress: 'Block C, Flat 104, Royal Palms',
        landmark: 'Behind Post Office Gate',
        pincode: '110001',
        isDefault: true,
      },
      items: [
        {
          id: `item_${randomNum}_1`,
          productId: 'prod-bread-06',
          productName: 'Harvest Gold White Sandwich Bread',
          unit: '400 g',
          quantity: 1,
          unitPrice: 42,
          totalPrice: 42,
        },
        {
          id: `item_${randomNum}_2`,
          productId: 'prod-milk-04',
          productName: 'Amul Taaza Toned Fresh Milk',
          unit: '500 ml',
          quantity: 2,
          unitPrice: 27,
          totalPrice: 54,
        },
      ],
      itemTotal: 96,
      deliveryFee: 20,
      discountAmount: 0,
      finalTotal: 116,
      paymentMethod: Math.random() > 0.5 ? 'COD' : 'UPI',
      paymentStatus: 'PENDING',
      status: 'RECEIVED',
      statusTimeline: [
        {
          status: 'RECEIVED',
          timestamp: nowIso,
          note: 'New order incoming',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (isFirebaseConfigured()) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, {
          order_id: orderId,
          customer_uid: mockOrder.customerId,
          customer_name: mockOrder.customerName,
          customer_phone: mockOrder.customerPhone,
          items: mockOrder.items.map((it) => ({
            product_id: it.productId,
            name: it.productName,
            unit_size: it.unit,
            quantity: it.quantity,
            selling_price: it.unitPrice,
            subtotal: it.totalPrice,
          })),
          total_amount: mockOrder.finalTotal,
          payment_method: mockOrder.paymentMethod,
          status: 'RECEIVED',
          created_at: serverTimestamp(),
          delivery_address: mockOrder.deliveryAddress,
        });
      } catch (err) {
        console.error('[Firestore] Failed to simulate order write:', err);
        setOrders((prev) => [mockOrder, ...prev]);
      }
    } else {
      setOrders((prev) => [mockOrder, ...prev]);
    }
  }, []);

  return {
    orders,
    newOrders,
    packingOrders,
    outOrders,
    loading,
    error,
    isLiveBackend,
    // Audio controls
    isMuted,
    toggleMute,
    playChime,
    // Actions
    acceptOrder,
    dispatchOrder,
    markDelivered,
    cancelOrder,
    simulateIncomingOrder,
  };
}
