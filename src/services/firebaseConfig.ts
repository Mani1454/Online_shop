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

// Read configuration from environment variables (supports Vite, Create-React-App, & Expo)
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`]!;
    if (process.env[`REACT_APP_${key}`]) return process.env[`REACT_APP_${key}`]!;
    if (process.env[`EXPO_PUBLIC_${key}`]) return process.env[`EXPO_PUBLIC_${key}`]!;
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY', 'demo-api-key-apna-kirana'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'apna-kirana.firebaseapp.com'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'apna-kirana-store'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'apna-kirana-store.appspot.com'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '1029384756'),
  appId: getEnvVar('FIREBASE_APP_ID', '1:1029384756:web:abcd1234efgh5678'),
};

export const isFirebaseConfigured = (): boolean => {
  const key = getEnvVar('FIREBASE_API_KEY', '');
  return key !== '' && key !== 'demo-api-key-apna-kirana';
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
