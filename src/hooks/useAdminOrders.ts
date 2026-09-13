import { useState, useEffect, useMemo, useCallback } from 'react';
import { Order } from '../types/schema';

const INITIAL_ADMIN_ORDERS: Order[] = [
  {
    id: '#ORD-1048',
    customerId: 'cust_01',
    customerName: 'Rohit Kumar',
    customerPhone: '+919876543210',
    deliveryAddress: {
      id: 'addr_1',
      userId: 'cust_01',
      label: 'Home',
      streetAddress: 'Flat 302, Green Valley Apartments, Pocket 2',
      landmark: 'Near Community Park Gate 1',
      pincode: '110001',
      isDefault: true,
    },
    items: [
      {
        id: 'item_1',
        productId: 'prod_1',
        productName: 'Aashirvaad Shudh Chakki Atta',
        unit: '5 kg',
        quantity: 1,
        unitPrice: 245,
        totalPrice: 245,
      },
      {
        id: 'item_2',
        productId: 'prod_3',
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
    status: 'RECEIVED', // New Order
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
    id: '#ORD-1047',
    customerId: 'cust_02',
    customerName: 'Pooja Sharma',
    customerPhone: '+919811223344',
    deliveryAddress: {
      id: 'addr_2',
      userId: 'cust_02',
      label: 'Home',
      streetAddress: 'House 42, Sector 4, Pocket 1',
      landmark: 'Opposite Mother Dairy',
      pincode: '110001',
      isDefault: true,
    },
    items: [
      {
        id: 'item_3',
        productId: 'prod_5',
        productName: 'Maggi 2-Minute Masala Noodles',
        unit: 'Pack of 4',
        quantity: 2,
        unitPrice: 54,
        totalPrice: 108,
      },
      {
        id: 'item_4',
        productId: 'prod_6',
        productName: 'Tata Tea Gold Leaf Blend',
        unit: '500 g',
        quantity: 1,
        unitPrice: 275,
        totalPrice: 275,
      },
    ],
    itemTotal: 383,
    deliveryFee: 0,
    discountAmount: 0,
    finalTotal: 383,
    paymentMethod: 'UPI',
    paymentStatus: 'COMPLETED',
    transactionRef: 'UPI-9827392182',
    status: 'PREPARING', // Packing
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
    id: '#ORD-1046',
    customerId: 'cust_03',
    customerName: 'Amit Verma',
    customerPhone: '+919955887766',
    deliveryAddress: {
      id: 'addr_3',
      userId: 'cust_03',
      label: 'Shop',
      streetAddress: 'Shop 8, Commercial Complex',
      landmark: 'Next to Medical Store',
      pincode: '110001',
      isDefault: true,
    },
    items: [
      {
        id: 'item_5',
        productId: 'prod_2',
        productName: 'India Gate Basmati Rice Rozzana',
        unit: '1 kg',
        quantity: 2,
        unitPrice: 99,
        totalPrice: 198,
      },
    ],
    itemTotal: 198,
    deliveryFee: 0,
    discountAmount: 0,
    finalTotal: 198,
    paymentMethod: 'UPI',
    paymentStatus: 'COMPLETED',
    transactionRef: 'UPI-7738291029',
    status: 'OUT_FOR_DELIVERY', // Out for Delivery
    deliveryPartner: {
      name: 'Ramesh (Delivery Rider)',
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

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ADMIN_ORDERS);
  const [, setTick] = useState(0);

  // Periodic tick to recalculate elapsed time & update urgency colors every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

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

  // Actions
  const acceptOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'PREPARING',
            updatedAt: new Date().toISOString(),
            statusTimeline: [
              ...ord.statusTimeline,
              {
                status: 'PREPARING',
                timestamp: new Date().toISOString(),
                note: 'Accepted by shopkeeper. Preparing items.',
              },
            ],
          };
        }
        return ord;
      })
    );
  }, []);

  const dispatchOrder = useCallback(
    (orderId: string, riderName = 'Ramesh (Delivery Rider)') => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === orderId) {
            return {
              ...ord,
              status: 'OUT_FOR_DELIVERY',
              deliveryPartner: {
                name: riderName,
                phone: '+919876001122',
              },
              updatedAt: new Date().toISOString(),
              statusTimeline: [
                ...ord.statusTimeline,
                {
                  status: 'OUT_FOR_DELIVERY',
                  timestamp: new Date().toISOString(),
                  note: `Dispatched with ${riderName}`,
                },
              ],
            };
          }
          return ord;
        })
      );
    },
    []
  );

  const markDelivered = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'DELIVERED',
            paymentStatus: 'COMPLETED',
            updatedAt: new Date().toISOString(),
            statusTimeline: [
              ...ord.statusTimeline,
              {
                status: 'DELIVERED',
                timestamp: new Date().toISOString(),
                note: 'Order successfully delivered to customer',
              },
            ],
          };
        }
        return ord;
      })
    );
  }, []);

  const simulateIncomingOrder = useCallback(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const mockOrder: Order = {
      id: `#ORD-${randomNum}`,
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
          productId: 'prod_4',
          productName: 'Harvest Gold White Sandwich Bread',
          unit: '400 g',
          quantity: 1,
          unitPrice: 42,
          totalPrice: 42,
        },
        {
          id: `item_${randomNum}_2`,
          productId: 'prod_3',
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
          timestamp: new Date().toISOString(),
          note: 'New order incoming',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [mockOrder, ...prev]);
  }, []);

  return {
    orders,
    newOrders,
    packingOrders,
    outOrders,
    acceptOrder,
    dispatchOrder,
    markDelivered,
    simulateIncomingOrder,
  };
}

export { useAdminOrdersRealtime } from './useAdminOrdersRealtime';
