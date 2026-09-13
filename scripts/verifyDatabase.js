/**
 * Database Verification & Quick Seeder
 * ------------------------------------
 * Runs a lightweight probe against Cloud Firestore (apna-general-store-6c6d5).
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, collection } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'apna-general-store-6c6d5',
  appId: '1:1077742866985:web:6b1513518fff9d50330238',
  storageBucket: 'apna-general-store-6c6d5.firebasestorage.app',
  apiKey: 'AIzaSyBST9eGtBYajBeFU2ONiEDQ0cukwwsoWv0',
  authDomain: 'apna-general-store-6c6d5.firebaseapp.com',
  messagingSenderId: '1077742866985'
};

async function check() {
  console.log('🔍 Checking Cloud Firestore connectivity for apna-general-store-6c6d5...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const snap = await getDocs(collection(db, 'orders'));
    console.log(`✅ SUCCESS: Cloud Firestore is ACTIVE and ACCESSIBLE!`);
    console.log(`   Found ${snap.size} orders in database.`);
    process.exit(0);
  } catch (err) {
    if (err.message.includes('has not been used in project') || err.message.includes('disabled')) {
      console.log('⏳ Firestore is not yet activated.');
      console.log('👉 Please click "Create database" at:');
      console.log('   https://console.firebase.google.com/project/apna-general-store-6c6d5/firestore');
    } else {
      console.log('⚠️ Firestore response:', err.message);
    }
    process.exit(1);
  }
}

check();
