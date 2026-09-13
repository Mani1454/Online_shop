/**
 * Firestore Database Initialization & Seed Script
 * ------------------------------------------------
 * Sets up collections:
 *  1. users: { uid, phone_number, role, saved_addresses }
 *  2. products: { product_id, name, name_localized, mrp, selling_price, unit_size, image_url, is_in_stock, category }
 *  3. store_config: { is_store_open, free_delivery_threshold, delivery_fee }
 *  4. orders: { order_id, customer_uid, customer_phone, items, total_amount, payment_method, status, created_at, delivery_address }
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

// Configuration can be provided via environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDev123456789",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "apna-kirana.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "apna-kirana-store",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "apna-kirana-store.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcd1234efgh5678",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export interface FirestoreUser {
  uid: string;
  phone_number: string;
  role: 'customer' | 'admin' | 'shopkeeper';
  saved_addresses: Array<{
    id: string;
    label: string;
    street_address: string;
    landmark?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    is_default: boolean;
  }>;
  created_at: Timestamp;
}

export interface FirestoreProduct {
  product_id: string;
  name: string;
  name_localized: string;
  mrp: number;
  selling_price: number;
  unit_size: string;
  image_url: string;
  is_in_stock: boolean;
  category: string;
  created_at: Timestamp;
}

export interface FirestoreStoreConfig {
  is_store_open: boolean;
  free_delivery_threshold: number;
  delivery_fee: number;
  store_name: string;
  contact_phone: string;
  upi_vpa: string;
  updated_at: Timestamp;
}

export interface FirestoreOrderItem {
  product_id: string;
  name: string;
  unit_size: string;
  quantity: number;
  selling_price: number;
  subtotal: number;
  image_url?: string;
}

export interface FirestoreOrder {
  order_id: string;
  customer_uid: string;
  customer_name: string;
  customer_phone: string;
  items: FirestoreOrderItem[];
  total_amount: number;
  payment_method: 'COD' | 'UPI';
  status: 'RECEIVED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  created_at: Timestamp;
  delivery_address: {
    label: string;
    street_address: string;
    landmark?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
}

// -----------------------------------------------------------------------------
// SEED DATA
// -----------------------------------------------------------------------------

export const SEED_STORE_CONFIG: FirestoreStoreConfig = {
  is_store_open: true,
  free_delivery_threshold: 150, // ₹150 for free delivery
  delivery_fee: 20, // ₹20 standard fee
  store_name: "Apna Kirana & Daily Needs",
  contact_phone: "+919876543210",
  upi_vpa: "apnakirana@okaxis",
  updated_at: Timestamp.now(),
};

export const SEED_PRODUCTS: FirestoreProduct[] = [
  {
    product_id: "prod-atta-01",
    name: "Aashirvaad Shudh Chakki Atta",
    name_localized: "आशीर्वाद चक्की आटा",
    mrp: 270,
    selling_price: 245,
    unit_size: "5 kg",
    image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80",
    is_in_stock: true,
    category: "groceries",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-rice-02",
    name: "India Gate Basmati Rice Rozzana",
    name_localized: "इंडिया गेट बासमती चावल",
    mrp: 125,
    selling_price: 99,
    unit_size: "1 kg",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    is_in_stock: true,
    category: "groceries",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-dal-03",
    name: "Tata Sampann Toor Dal",
    name_localized: "टाटा तूर दाल",
    mrp: 190,
    selling_price: 168,
    unit_size: "1 kg",
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    is_in_stock: true,
    category: "groceries",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-milk-04",
    name: "Amul Taaza Toned Milk",
    name_localized: "अमुल ताज़ा दूध",
    mrp: 27,
    selling_price: 27,
    unit_size: "500 ml",
    image_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
    is_in_stock: true,
    category: "dairy",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-butter-05",
    name: "Amul Salted Butter",
    name_localized: "अमुल मक्खन",
    mrp: 60,
    selling_price: 56,
    unit_size: "100 g",
    image_url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80",
    is_in_stock: true,
    category: "dairy",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-bread-06",
    name: "Harvest Gold White Bread",
    name_localized: "हार्वेस्ट गोल्ड ब्रेड",
    mrp: 45,
    selling_price: 42,
    unit_size: "400 g",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
    is_in_stock: true,
    category: "dairy",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-oil-07",
    name: "Fortune Refined Sunflower Oil",
    name_localized: "फॉर्च्यून सूरजमुखी तेल",
    mrp: 160,
    selling_price: 138,
    unit_size: "1 L Pouch",
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
    is_in_stock: true,
    category: "oils-masalas",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-maggi-08",
    name: "Maggi 2-Minute Masala Noodles",
    name_localized: "मैगी 2-मिनट नूडल्स",
    mrp: 60,
    selling_price: 54,
    unit_size: "280 g Pack of 4",
    image_url: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80",
    is_in_stock: true,
    category: "instant-food",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-tea-09",
    name: "Tata Tea Gold Leaf Tea",
    name_localized: "टाटा टी गोल्ड पत्ती चाय",
    mrp: 320,
    selling_price: 275,
    unit_size: "500 g",
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80",
    is_in_stock: true,
    category: "beverages",
    created_at: Timestamp.now(),
  },
  {
    product_id: "prod-surf-10",
    name: "Surf Excel Easy Wash Detergent",
    name_localized: "सर्फ एक्सेल वाशिंग पाउडर",
    mrp: 145,
    selling_price: 128,
    unit_size: "1 kg",
    image_url: "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=400&q=80",
    is_in_stock: true,
    category: "household",
    created_at: Timestamp.now(),
  },
];

export const SEED_USERS: FirestoreUser[] = [
  {
    uid: "admin_user_001",
    phone_number: "+919876543210",
    role: "admin",
    saved_addresses: [
      {
        id: "addr_shop_1",
        label: "Shop Counter",
        street_address: "Shop #4, Main Market, Sector 14",
        landmark: "Opposite Mother Dairy",
        pincode: "110001",
        latitude: 28.6139,
        longitude: 77.209,
        is_default: true,
      },
    ],
    created_at: Timestamp.now(),
  },
  {
    uid: "customer_user_001",
    phone_number: "+919811223344",
    role: "customer",
    saved_addresses: [
      {
        id: "addr_home_1",
        label: "Home",
        street_address: "Flat 302, Green Valley Apartments, Pocket 2",
        landmark: "Near Community Center",
        pincode: "110001",
        latitude: 28.6145,
        longitude: 77.2105,
        is_default: true,
      },
      {
        id: "addr_work_1",
        label: "Work",
        street_address: "Cabin 12, Tech Hub Plaza, 4th Floor",
        landmark: "Metro Gate #2",
        pincode: "110001",
        latitude: 28.618,
        longitude: 77.215,
        is_default: false,
      },
    ],
    created_at: Timestamp.now(),
  },
];

export const SEED_ORDERS: FirestoreOrder[] = [
  {
    order_id: "ORD-1048",
    customer_uid: "customer_user_001",
    customer_name: "Mrs. Sharma",
    customer_phone: "+919811223344",
    items: [
      {
        product_id: "prod-milk-04",
        name: "Amul Taaza Toned Milk",
        unit_size: "500 ml",
        quantity: 2,
        selling_price: 27,
        subtotal: 54,
        image_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
      },
      {
        product_id: "prod-bread-06",
        name: "Harvest Gold White Bread",
        unit_size: "400 g",
        quantity: 1,
        selling_price: 42,
        subtotal: 42,
        image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
      },
      {
        product_id: "prod-butter-05",
        name: "Amul Salted Butter",
        unit_size: "100 g",
        quantity: 1,
        selling_price: 56,
        subtotal: 56,
        image_url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80",
      },
    ],
    total_amount: 152, // >= 150 -> Free delivery
    payment_method: "UPI",
    status: "RECEIVED",
    created_at: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 1000)), // 3 mins ago
    delivery_address: {
      label: "Home",
      street_address: "Flat 302, Green Valley Apartments, Pocket 2",
      landmark: "Near Community Center",
      pincode: "110001",
      latitude: 28.6145,
      longitude: 77.2105,
    },
  },
  {
    order_id: "ORD-1047",
    customer_uid: "customer_user_001",
    customer_name: "Rajesh Kumar",
    customer_phone: "+919877665544",
    items: [
      {
        product_id: "prod-atta-01",
        name: "Aashirvaad Shudh Chakki Atta",
        unit_size: "5 kg",
        quantity: 1,
        selling_price: 245,
        subtotal: 245,
        image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80",
      },
      {
        product_id: "prod-dal-03",
        name: "Tata Sampann Toor Dal",
        unit_size: "1 kg",
        quantity: 1,
        selling_price: 168,
        subtotal: 168,
        image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
      },
    ],
    total_amount: 413,
    payment_method: "COD",
    status: "PREPARING",
    created_at: Timestamp.fromDate(new Date(Date.now() - 14 * 60 * 1000)), // 14 mins ago
    delivery_address: {
      label: "Home",
      street_address: "House #12, Pocket B",
      landmark: "Behind Gurudwara",
      pincode: "110001",
    },
  },
  {
    order_id: "ORD-1046",
    customer_uid: "customer_user_001",
    customer_name: "Anita Verma",
    customer_phone: "+919822334455",
    items: [
      {
        product_id: "prod-maggi-08",
        name: "Maggi 2-Minute Masala Noodles",
        unit_size: "280 g Pack of 4",
        quantity: 2,
        selling_price: 54,
        subtotal: 108,
        image_url: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80",
      },
    ],
    total_amount: 128, // 108 + 20 delivery fee
    payment_method: "UPI",
    status: "OUT_FOR_DELIVERY",
    created_at: Timestamp.fromDate(new Date(Date.now() - 25 * 60 * 1000)), // 25 mins ago
    delivery_address: {
      label: "Home",
      street_address: "B-44, Shivalik Enclave",
      landmark: "Near Water Tank",
      pincode: "110001",
    },
  },
];

/**
 * Initializes and populates Firestore database with seed data
 */
export async function initializeFirestoreDatabase() {
  console.log("Starting Firestore initialization...");
  const batch = writeBatch(db);

  // 1. Store Config Document
  const storeConfigRef = doc(db, 'store_config', 'default_store');
  batch.set(storeConfigRef, SEED_STORE_CONFIG);

  // 2. Users Collection
  for (const user of SEED_USERS) {
    const userRef = doc(db, 'users', user.uid);
    batch.set(userRef, user);
  }

  // 3. Products Collection
  for (const product of SEED_PRODUCTS) {
    const productRef = doc(db, 'products', product.product_id);
    batch.set(productRef, product);
  }

  // 4. Orders Collection
  for (const order of SEED_ORDERS) {
    const orderRef = doc(db, 'orders', order.order_id);
    batch.set(orderRef, order);
  }

  await batch.commit();
  console.log("Firestore initialized successfully with seed data!");
}

export { db, app };
