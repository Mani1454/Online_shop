/**
 * Store Config Updater for Production
 * ------------------------------------
 * Sets default store profile and delivery rules in Cloud Firestore:
 * - Store Name: Apna Kirana & Daily Needs
 * - Phone: +919876543210
 * - Physical Address: Sitamarhi, Bihar
 * - UPI VPA: apnakirana@upi
 * - Delivery: Free above ₹150, Fee ₹20, Radius 3km, Est 1 hr
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'apna-general-store-6c6d5',
  appId: '1:1077742866985:web:6b1513518fff9d50330238',
  storageBucket: 'apna-general-store-6c6d5.firebasestorage.app',
  apiKey: 'AIzaSyBST9eGtBYajBeFU2ONiEDQ0cukwwsoWv0',
  authDomain: 'apna-general-store-6c6d5.firebaseapp.com',
  messagingSenderId: '1077742866985'
};

async function syncConfig() {
  console.log('🔄 Initializing Firebase & syncing store config...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const storeData = {
    store_id: 'default_store',
    store_name: 'Apna Kirana & Daily Needs',
    contact_phone: '+919876543210',
    physical_address: 'Sitamarhi, Bihar',
    upi_vpa: 'apnakirana@upi',
    min_order_free_delivery: 150,
    min_free_delivery: 150,
    standard_delivery_fee: 20,
    delivery_radius_km: 3,
    estimated_delivery_time: '1 hr',
    is_store_open: true,
    is_open: true,
    currency: 'INR',
    coordinates: {
      latitude: 26.5975,
      longitude: 85.4897
    },
    updated_at: new Date().toISOString()
  };

  try {
    const configRef = doc(db, 'store_config', 'default_store');
    await setDoc(configRef, storeData, { merge: true });
    console.log('✅ Store configuration saved to Firestore collection store_config/default_store!');
    
    const readSnap = await getDoc(configRef);
    console.log('📄 Current Firestore Store Config:', JSON.stringify(readSnap.data(), null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to update store config:', err.message);
    process.exit(1);
  }
}

syncConfig();
