import { useState, useEffect, useMemo } from 'react';
import {
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  collection,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebaseConfig';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Order, OrderStatus } from '../types/schema';

// Initial mock fallback active order for customer live preview
const MOCK_ACTIVE_ORDER: Order = {
  id: 'ORD-1048',
  customerId: 'cust_user_001',
  customerName: 'Mrs. Sharma',
  customerPhone: '+919811223344',
  deliveryAddress: {
    id: 'addr_1',
    userId: 'cust_user_001',
    label: 'Home',
    streetAddress: 'Flat 302, Green Valley Apartments, Pocket 2',
    landmark: 'Near Community Center',
    pincode: '110001',
    isDefault: true,
  },
  items: [
    {
      id: 'item_1',
      productId: 'prod-milk-04',
      productName: 'Amul Taaza Toned Fresh Milk',
      unit: '500 ml',
      quantity: 2,
      unitPrice: 27,
      totalPrice: 54,
    },
    {
      id: 'item_2',
      productId: 'prod-bread-06',
      productName: 'Harvest Gold White Bread',
      unit: '400 g',
      quantity: 1,
      unitPrice: 42,
      totalPrice: 42,
    },
    {
      id: 'item_3',
      productId: 'prod-butter-05',
      productName: 'Amul Salted Butter',
      unit: '100 g',
      quantity: 1,
      unitPrice: 56,
      totalPrice: 56,
    },
  ],
  itemTotal: 152,
  deliveryFee: 0,
  discountAmount: 0,
  finalTotal: 152,
  paymentMethod: 'UPI',
  paymentStatus: 'COMPLETED',
  transactionRef: 'UPI-REF-98321094',
  status: 'PREPARING',
  statusTimeline: [
    {
      status: 'RECEIVED',
      timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      note: 'Order placed by customer',
    },
    {
      status: 'PREPARING',
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      note: 'Shopkeeper is packing your items',
    },
  ],
  shopkeeperNotes: 'Pack chilled milk',
  createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
};

function normalizeOrder(data: any, id: string): Order {
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
      productName: item.name || item.productName || 'Item',
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
 * useCustomerLiveOrderRealtime
 * ----------------------------
 * Listens in real-time to active orders placed by a specific customer.
 * As the shopkeeper changes status in the Admin Kanban board, this hook
 * triggers instant reactive updates to the customer's visual stepper and ETA.
 */
export function useCustomerLiveOrderRealtime(
  customerUid: string = 'cust_user_001',
  orderId?: string
) {
  const [activeOrder, setActiveOrder] = useState<Order | null>(MOCK_ACTIVE_ORDER);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let supabaseChannel: any = null;

    // 1. Firebase Firestore Realtime Subscription
    if (isFirebaseConfigured()) {
      try {
        setLoading(true);

        if (orderId) {
          // Listen to specific order
          const docRef = doc(db, 'orders', orderId);
          unsubscribeFirestore = onSnapshot(
            docRef,
            (docSnap) => {
              if (docSnap.exists()) {
                setActiveOrder(normalizeOrder(docSnap.data(), docSnap.id));
                setIsLiveBackend(true);
              } else {
                setActiveOrder(null);
              }
              setLoading(false);
            },
            (err) => {
              console.warn('[Firestore] Customer order listener error:', err);
              setError(err.message);
              setLoading(false);
            }
          );
        } else {
          // Customer Active Order Tracker Query:
          // customer_uid == customerUid, status in ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY']
          const q = query(
            collection(db, 'orders'),
            where('customer_uid', '==', customerUid),
            where('status', 'in', ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY']),
            orderBy('created_at', 'desc'),
            limit(1)
          );

          unsubscribeFirestore = onSnapshot(
            q,
            (snapshot) => {
              if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                setActiveOrder(normalizeOrder(docSnap.data(), docSnap.id));
                setIsLiveBackend(true);
              } else {
                // No active unfulfilled orders
                setActiveOrder(null);
              }
              setLoading(false);
            },
            (err) => {
              console.warn('[Firestore] Customer query error:', err);
              setError(err.message);
              setLoading(false);
            }
          );
        }
      } catch (err: any) {
        console.warn('[Firestore] Setup error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    // 2. Supabase Realtime Subscription
    else if (isSupabaseConfigured()) {
      try {
        setLoading(true);
        const fetchOrder = async () => {
          let queryBuilder = supabase
            .from('orders')
            .select('*')
            .eq('customer_id', customerUid);

          if (orderId) {
            queryBuilder = queryBuilder.eq('id', orderId);
          } else {
            queryBuilder = queryBuilder
              .in('status', ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY'])
              .order('created_at', { ascending: false })
              .limit(1);
          }

          const { data, error: sbErr } = await queryBuilder;
          if (sbErr) {
            setError(sbErr.message);
          } else if (data && data.length > 0) {
            setActiveOrder(normalizeOrder(data[0], data[0].id));
            setIsLiveBackend(true);
          } else {
            setActiveOrder(null);
          }
          setLoading(false);
        };

        fetchOrder();

        // Subscribe to real-time events for this customer's orders
        supabaseChannel = supabase
          .channel(`customer-order-${customerUid}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `customer_id=eq.${customerUid}`,
            },
            () => {
              fetchOrder();
            }
          )
          .subscribe();
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    } else {
      // 3. Fallback demo mode
      setLoading(false);
      setIsLiveBackend(false);
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (supabaseChannel) supabase.removeChannel(supabaseChannel);
    };
  }, [customerUid, orderId]);

  // Derive Current Step Index (0: Received, 1: Preparing, 2: Out for Delivery, 3: Delivered)
  const currentStep = useMemo(() => {
    if (!activeOrder) return 0;
    switch (activeOrder.status) {
      case 'RECEIVED':
        return 0;
      case 'PREPARING':
        return 1;
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  }, [activeOrder?.status]);

  // Dynamic ETA Calculation
  const etaText = useMemo(() => {
    if (!activeOrder) return 'No active delivery';
    switch (activeOrder.status) {
      case 'RECEIVED':
        return 'Arriving in 25-30 mins';
      case 'PREPARING':
        return 'Arriving in 15-20 mins';
      case 'OUT_FOR_DELIVERY':
        return 'Arriving in 5-10 mins (Nearby)';
      case 'DELIVERED':
        return 'Delivered at your door';
      case 'CANCELLED':
        return 'Order Cancelled';
      default:
        return 'Arriving soon';
    }
  }, [activeOrder?.status]);

  return {
    activeOrder,
    currentStep,
    etaText,
    loading,
    error,
    isLiveBackend,
    hasActiveDelivery: activeOrder !== null && activeOrder.status !== 'DELIVERED' && activeOrder.status !== 'CANCELLED',
  };
}
