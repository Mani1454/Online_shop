import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, Product, Category, StoreConfig } from '../../types/schema';
import { soundEffects } from '../audio/soundEffects';

// Seed Initial Orders for Admin Display
const INITIAL_ORDERS: Order[] = [
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
        productName: 'Amul Taaza Toned Milk',
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
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago
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
    status: 'PREPARING', // In Packing
    statusTimeline: [
      {
        status: 'RECEIVED',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
      {
        status: 'PREPARING',
        timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        note: 'Shopkeeper accepted & started packing',
      },
    ],
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
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
    status: 'OUT_FOR_DELIVERY', // With delivery boy
    deliveryPartner: {
      name: 'Ramesh (Delivery Boy)',
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
        note: 'Handed to Ramesh',
      },
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    categoryId: 'groceries',
    name: 'Aashirvaad Shudh Chakki Atta',
    nameLocalized: 'आशीर्वाद चक्की आटा',
    description: '100% whole wheat flour for soft rotis',
    unit: '5 kg',
    mrp: 270,
    sellingPrice: 245,
    discountPercent: 9,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    tags: ['Daily Essential', 'Bestseller'],
    isActive: true,
  },
  {
    id: 'prod_2',
    categoryId: 'groceries',
    name: 'India Gate Basmati Rice Rozzana',
    nameLocalized: 'इंडिया गेट बासमती चावल',
    description: 'Aromatic long grain basmati rice',
    unit: '1 kg',
    mrp: 125,
    sellingPrice: 99,
    discountPercent: 21,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    tags: ['Daily Essential'],
    isActive: true,
  },
  {
    id: 'prod_3',
    categoryId: 'dairy',
    name: 'Amul Taaza Toned Fresh Milk',
    nameLocalized: 'अमुल ताज़ा दूध',
    description: 'Fresh pasteurized toned milk pouch',
    unit: '500 ml',
    mrp: 27,
    sellingPrice: 27,
    discountPercent: 0,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    tags: ['Daily Essential'],
    isActive: true,
  },
  {
    id: 'prod_4',
    categoryId: 'dairy',
    name: 'Harvest Gold White Sandwich Bread',
    nameLocalized: 'सफेद ब्रेड',
    description: 'Soft baked bread for breakfast',
    unit: '400 g',
    mrp: 45,
    sellingPrice: 42,
    discountPercent: 7,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    tags: ['Breakfast'],
    isActive: true,
  },
  {
    id: 'prod_5',
    categoryId: 'instant-food',
    name: 'Maggi 2-Minute Masala Noodles',
    nameLocalized: 'मैगी मसाला नूडल्स',
    description: 'India’s favorite instant spiced noodles',
    unit: 'Pack of 4',
    mrp: 60,
    sellingPrice: 54,
    discountPercent: 10,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80',
    tags: ['Bestseller'],
    isActive: true,
  },
  {
    id: 'prod_6',
    categoryId: 'beverages',
    name: 'Tata Tea Gold Leaf Blend',
    nameLocalized: 'टाटा टी गोल्ड पत्ती चाय',
    description: 'Rich aroma tea leaves for authentic kadak chai',
    unit: '500 g',
    mrp: 320,
    sellingPrice: 275,
    discountPercent: 14,
    isInStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
    tags: ['Daily Essential'],
    isActive: true,
  },
  {
    id: 'prod_7',
    categoryId: 'household',
    name: 'Surf Excel Easy Wash Detergent Powder',
    nameLocalized: 'सर्फ एक्सेल पाउडर',
    description: 'Tough stain remover powder for bucket wash',
    unit: '1 kg',
    mrp: 145,
    sellingPrice: 128,
    discountPercent: 12,
    isInStock: false, // Initially out of stock for testing
    imageUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=400&q=80',
    tags: ['Cleaning'],
    isActive: true,
  },
];

interface StoreContextType {
  isStoreOpen: boolean;
  toggleStoreOpen: () => void;
  orders: Order[];
  products: Product[];
  isAudioRinging: boolean;
  isAudioMuted: boolean;
  toggleMuteAudio: () => void;
  acceptOrder: (orderId: string) => void;
  dispatchOrder: (orderId: string, deliveryPartnerName?: string) => void;
  markDelivered: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  toggleProductStock: (productId: string) => void;
  updateProductPrices: (productId: string, mrp: number, sellingPrice: number) => void;
  simulateIncomingOrder: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isAudioRinging, setIsAudioRinging] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Check if any order is currently in 'RECEIVED' status requiring attention
  useEffect(() => {
    const hasUnacceptedNewOrders = orders.some((o) => o.status === 'RECEIVED');
    if (hasUnacceptedNewOrders && !isAudioMuted) {
      soundEffects.startOrderAlertLoop();
      setIsAudioRinging(true);
    } else {
      soundEffects.stopOrderAlertLoop();
      setIsAudioRinging(false);
    }
  }, [orders, isAudioMuted]);

  const toggleStoreOpen = () => {
    setIsStoreOpen((prev) => !prev);
  };

  const toggleMuteAudio = () => {
    const muted = soundEffects.toggleMute();
    setIsAudioMuted(muted);
  };

  // Order Actions
  const acceptOrder = (orderId: string) => {
    soundEffects.stopOrderAlertLoop();
    setIsAudioRinging(false);

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
  };

  const dispatchOrder = (
    orderId: string,
    deliveryPartnerName: string = 'Ramesh (Delivery Boy)'
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'OUT_FOR_DELIVERY',
            deliveryPartner: {
              name: deliveryPartnerName,
              phone: '+919876001122',
            },
            updatedAt: new Date().toISOString(),
            statusTimeline: [
              ...ord.statusTimeline,
              {
                status: 'OUT_FOR_DELIVERY',
                timestamp: new Date().toISOString(),
                note: `Handed over to ${deliveryPartnerName}`,
              },
            ],
          };
        }
        return ord;
      })
    );
  };

  const markDelivered = (orderId: string) => {
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
  };

  const rejectOrder = (orderId: string) => {
    soundEffects.stopOrderAlertLoop();
    setIsAudioRinging(false);

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'CANCELLED',
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );
  };

  // Inventory Actions
  const toggleProductStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, isInStock: !p.isInStock };
        }
        return p;
      })
    );
  };

  const updateProductPrices = (
    productId: string,
    mrp: number,
    sellingPrice: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const discountPercent =
            mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
          return { ...p, mrp, sellingPrice, discountPercent };
        }
        return p;
      })
    );
  };

  // Simulation: Drops a test order into 'New Orders' and starts the audio chime
  const simulateIncomingOrder = () => {
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
        landmark: 'Behind Main Market Post Office',
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
          note: 'New incoming order from neighborhood app',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [mockOrder, ...prev]);
    soundEffects.startOrderAlertLoop();
    setIsAudioRinging(true);
  };

  return (
    <StoreContext.Provider
      value={{
        isStoreOpen,
        toggleStoreOpen,
        orders,
        products,
        isAudioRinging,
        isAudioMuted,
        toggleMuteAudio,
        acceptOrder,
        dispatchOrder,
        markDelivered,
        rejectOrder,
        toggleProductStock,
        updateProductPrices,
        simulateIncomingOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
