/**
 * Vercel Serverless Function: /api/verify-otp
 * -------------------------------------------
 * Validates 6-digit OTP against active Cloud Firestore session.
 * On success, grants user profile and marks role ('admin' for 9876543210, else 'customer').
 */

const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDoc, deleteDoc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'apna-general-store-6c6d5',
  appId: '1:1077742866985:web:6b1513518fff9d50330238',
  storageBucket: 'apna-general-store-6c6d5.firebasestorage.app',
  apiKey: 'AIzaSyBST9eGtBYajBeFU2ONiEDQ0cukwwsoWv0',
  authDomain: 'apna-general-store-6c6d5.firebaseapp.com',
  messagingSenderId: '1077742866985'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { phoneNumber, otpCode } = req.body || {};
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({ error: 'Phone number and verification code are required' });
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, '').slice(-10);
    const code = String(otpCode).trim();
    const isStoreOwner = cleanPhone === '9876543210';
    const uid = isStoreOwner ? 'admin_shop_01' : `cust_${cleanPhone}`;

    const userProfile = {
      uid,
      phone_number: `+91${cleanPhone}`,
      name: isStoreOwner ? 'Shopkeeper (Apna Kirana)' : 'Neighborhood Customer',
      role: isStoreOwner ? 'admin' : 'customer',
      saved_addresses: [
        {
          id: `addr_${cleanPhone}`,
          label: 'Home',
          street_address: 'Sitamarhi, Bihar',
          landmark: 'City Center',
          pincode: '843302',
          is_default: true
        }
      ]
    };

    // 1. Universal demo/reviewer bypass
    if (code === '123456') {
      try {
        await setDoc(doc(db, 'users', uid), {
          ...userProfile,
          last_login: serverTimestamp()
        }, { merge: true });
      } catch (e) {}

      return res.status(200).json({
        success: true,
        user: userProfile
      });
    }

    // 2. Cloud Firestore session check
    const sessionRef = doc(db, 'otp_sessions', cleanPhone);
    const snap = await getDoc(sessionRef);

    if (!snap.exists()) {
      return res.status(400).json({ error: 'No active verification session found. Please request a new OTP.' });
    }

    const session = snap.data();
    if (Date.now() > session.expires_at) {
      await deleteDoc(sessionRef);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (session.otp !== code) {
      return res.status(400).json({ error: 'Incorrect verification code. Please enter the 6-digit code received.' });
    }

    // Code matched! Delete the one-time session
    await deleteDoc(sessionRef);

    // Save profile to Firestore
    try {
      await setDoc(doc(db, 'users', uid), {
        ...userProfile,
        last_login: serverTimestamp()
      }, { merge: true });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      user: userProfile
    });
  } catch (err) {
    console.error('verify-otp server error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
