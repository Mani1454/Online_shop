import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import {
  getFirestore,
  Firestore,
  collection,
  CollectionReference,
  DocumentData,
  doc,
  DocumentReference,
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import {
  FirestoreUser,
  FirestoreProduct,
  FirestoreOrder,
  FirestoreStoreConfig,
} from '../../schema/firestore.init';

// Real project credentials for apna-general-store-6c6d5 with robust fallbacks
const firebaseConfig = {
  apiKey:
    (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY)) ||
    'AIzaSyBST9eGtBYajBeFU2ONiEDQ0cukwwsoWv0',
  authDomain:
    (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN)) ||
    'apna-general-store-6c6d5.firebaseapp.com',
  projectId:
    (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID)) ||
    'apna-general-store-6c6d5',
  storageBucket:
    (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET)) ||
    'apna-general-store-6c6d5.firebasestorage.app',
  messagingSenderId:
    (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID)) ||
    '1077742866985',
  appId:
    (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID)) ||
    '1:1077742866985:web:6b1513518fff9d50330238',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-api-key-apna-kirana');
};

export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Generic Firestore data converter for strict typing
const createConverter = <T extends DocumentData>() => ({
  toFirestore: (data: T): DocumentData => data,
  fromFirestore: (snapshot: any): T => snapshot.data() as T,
});

// Typed Collection References
export const usersCol = collection(db, 'users').withConverter(
  createConverter<FirestoreUser>()
);

export const productsCol = collection(db, 'products').withConverter(
  createConverter<FirestoreProduct>()
);

export const ordersCol = collection(db, 'orders').withConverter(
  createConverter<FirestoreOrder>()
);

export const storeConfigDoc = doc(db, 'store_config', 'default_store').withConverter(
  createConverter<FirestoreStoreConfig>()
);

export default { app, db, auth };
