/**
 * Automated Firestore Disaster Recovery Backup Script
 * ----------------------------------------------------
 * Dumps all core collections (orders, products, users, store_config)
 * into a structured JSON backup archive.
 * 
 * Usage:
 *   node scripts/backupFirestore.js
 */

const fs = require('fs');
const path = require('path');
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

async function backup() {
  console.log('================================================================');
  console.log('💾 APNA KIRANA - FIRESTORE DISASTER RECOVERY BACKUP');
  console.log('================================================================');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const collectionsToBackup = ['products', 'orders', 'users', 'store_config'];
  const backupData = {
    projectId: firebaseConfig.projectId,
    exportedAt: new Date().toISOString(),
    collections: {}
  };

  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  for (const colName of collectionsToBackup) {
    try {
      console.log(`📦 Exporting collection: "${colName}"...`);
      const snap = await getDocs(collection(db, colName));
      const records = [];
      snap.forEach(docSnap => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      backupData.collections[colName] = records;
      console.log(`   ✓ Exported ${records.length} documents from "${colName}".`);
    } catch (err) {
      console.warn(`   ⚠️ Warning exporting "${colName}":`, err.message);
      backupData.collections[colName] = [];
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `firestore_backup_${firebaseConfig.projectId}_${timestamp}.json`;
  const targetPath = path.join(backupDir, filename);

  fs.writeFileSync(targetPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log('----------------------------------------------------------------');
  console.log(`✅ BACKUP COMPLETE: Saved to ${targetPath}`);
  console.log(`   Total size: ${(fs.statSync(targetPath).size / 1024).toFixed(2)} KB`);
  console.log('================================================================');
}

backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
