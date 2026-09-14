import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Alert } from 'react-native';
import { auth, db, isFirebaseConfigured } from '../services/firebaseConfig';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export type UserRole = 'customer' | 'admin' | 'shopkeeper';

export interface UserProfile {
  uid: string;
  phone_number: string;
  name: string;
  role: UserRole;
  saved_addresses: Array<{
    id: string;
    label: string;
    street_address: string;
    landmark?: string;
    pincode: string;
    is_default: boolean;
  }>;
  fcm_token?: string;
  created_at?: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  confirmationResult: ConfirmationResult | null;
  sendPhoneOtp: (phoneNumber: string, recaptchaContainerId?: string) => Promise<boolean>;
  verifyOtp: (otpCode: string) => Promise<boolean>;
  loginWithPin: (phoneNumber: string, pin: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  quickLoginDemo: (asRole: 'customer' | 'admin') => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for persisting mock demo sessions across page reloads
const LOCAL_STORAGE_KEY = 'apna_kirana_session_user';

// Check if running in strict production mode
const isProduction =
  (typeof process !== 'undefined' && process.env && (process.env.NODE_ENV === 'production' || process.env.VITE_APP_ENV === 'production')) ||
  false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string>('');

  // ---------------------------------------------------------------------------
  // API BASE URL CONFIGURATION
  // ---------------------------------------------------------------------------
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.includes('vercel.app')) {
      return window.location.origin;
    }
    return 'https://apna-kirana-admin.vercel.app';
  };

  // ---------------------------------------------------------------------------
  // SILENT PROFILE PROVISIONING IN FIRESTORE
  // ---------------------------------------------------------------------------
  const syncOrCreateUserProfile = useCallback(async (uid: string, phoneNumber: string): Promise<UserProfile> => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const isAdminNumber = phoneNumber.includes('9876543210');
    const defaultAddress = {
      id: `addr_${cleanPhone || Date.now()}`,
      label: 'Home',
      street_address: 'Main Market, Sitamarhi, Bihar',
      landmark: 'City Center',
      pincode: '843302',
      is_default: true,
    };

    // 1. Try Firebase Firestore if configured
    if (isFirebaseConfigured()) {
      try {
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          return userSnap.data() as UserProfile;
        } else {
          const defaultProfile: UserProfile = {
            uid,
            phone_number: phoneNumber.startsWith('+91') ? phoneNumber : `+91${cleanPhone}`,
            name: isAdminNumber ? 'Shopkeeper (Apna Kirana)' : 'Neighborhood Customer',
            role: isAdminNumber ? 'admin' : 'customer',
            saved_addresses: [defaultAddress],
            created_at: serverTimestamp(),
          };

          // Silently create the profile in Firestore
          await setDoc(userDocRef, defaultProfile);
          return defaultProfile;
        }
      } catch (err: any) {
        console.warn('[AuthContext] Firestore profile sync error, falling back to local:', err);
      }
    }

    // 2. Local fallback profile
    return {
      uid,
      phone_number: phoneNumber.startsWith('+91') ? phoneNumber : `+91${cleanPhone}`,
      name: isAdminNumber ? 'Shopkeeper (Apna Kirana)' : 'Neighborhood Customer',
      role: isAdminNumber ? 'admin' : 'customer',
      saved_addresses: [defaultAddress],
    };
  }, []);

  // ---------------------------------------------------------------------------
  // AUTH STATE LISTENER
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let unsubscribeFirebase: (() => void) | null = null;

    if (isFirebaseConfigured()) {
      unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          const profile = await syncOrCreateUserProfile(firebaseUser.uid, firebaseUser.phoneNumber || '');
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });
    } else {
      // Offline / Local development session recovery
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setUserProfile(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  }, [syncOrCreateUserProfile]);

  // ---------------------------------------------------------------------------
  // SEND PHONE OTP (Production Gateway + Serverless API + Resilient Fallback)
  // ---------------------------------------------------------------------------
  const sendPhoneOtp = useCallback(async (phoneNumber: string, recaptchaContainerId = 'recaptcha-container'): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setPendingPhone(phoneNumber);

    const clean = phoneNumber.replace(/\D/g, '').slice(-10);

    // Call live Vercel Serverless Function /api/send-otp
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: clean }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        console.log('✅ OTP dispatched successfully:', data.message);
        Alert.alert(
          'Verification Code',
          `Your 6-digit verification code is: ${data.devOtp || '123456'}\n\n(Client demo code 123456 also accepted)`
        );
        setLoading(false);
        return true;
      } else if (!response.ok && data.error) {
        console.warn('⚠️ Server OTP notice:', data.error);
      }
    } catch (apiErr: any) {
      console.warn('⚠️ Live OTP API unreachable, falling back to direct auth:', apiErr.message);
    }

    // Check if Web Recaptcha is available
    const hasRecaptchaDom =
      typeof document !== 'undefined' &&
      typeof document.getElementById === 'function' &&
      !!document.getElementById(recaptchaContainerId);

    if (isFirebaseConfigured() && hasRecaptchaDom) {
      try {
        const appVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: 'invisible',
        });
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setLoading(false);
        return true;
      } catch (fbErr: any) {
        console.warn('[AuthContext] Firebase web Recaptcha notice:', fbErr?.message);
      }
    }

    // Mobile / Standalone APK verification session handler
    await new Promise((res) => setTimeout(res, 500));

    Alert.alert(
      'Verification Code',
      'Your 6-digit verification code is: 123456\n\n(Client demo code 123456 accepted)'
    );

    setConfirmationResult({
      confirm: async (otp: string) => {
        // Accept 123456 or 6-digit code
        if (otp === '123456' || otp.length === 6) {
          const isStoreOwner = clean === '9876543210';
          const uid = isStoreOwner ? 'admin_shop_01' : `cust_${clean || Date.now()}`;
          const profile = await syncOrCreateUserProfile(uid, `+91${clean}`);
          setUserProfile(profile);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          }
          return { user: { uid, phoneNumber: `+91${clean}` } } as any;
        }
        throw new Error('Invalid verification code. Please check your SMS or enter 123456.');
      },
      verificationId: `session_${Date.now()}`,
    } as any);

    setLoading(false);
    return true;
  }, [syncOrCreateUserProfile]);

  // ---------------------------------------------------------------------------
  // VERIFY 6-DIGIT OTP
  // ---------------------------------------------------------------------------
  const verifyOtp = useCallback(async (otpCode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const clean = pendingPhone.replace(/\D/g, '').slice(-10);
    const code = otpCode.trim();

    // 1. First try Live Serverless API /api/verify-otp
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: clean, otpCode: code }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.user) {
        setUserProfile(data.user);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.user));
        }
        setLoading(false);
        return true;
      } else if (!response.ok && data.error) {
        // If server explicitly returned an error (e.g., incorrect OTP)
        // Allow fallback only if code is 123456 (reviewer/demo bypass)
        if (code !== '123456') {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      if (code !== '123456') {
        setError(err.message || 'Invalid verification code.');
        setLoading(false);
        return false;
      }
    }

    // 2. Firebase confirmation result fallback
    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(code);
        if (result?.user) {
          const profile = await syncOrCreateUserProfile(result.user.uid, result.user.phoneNumber || pendingPhone);
          setUserProfile(profile);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          }
        }
        setLoading(false);
        return true;
      }

      // 3. Reviewer demo bypass (123456)
      if (code === '123456') {
        const isAdm = clean === '9876543210';
        const uid = isAdm ? 'admin_shop_01' : `cust_${clean || Date.now()}`;
        const profile = await syncOrCreateUserProfile(uid, `+91${clean || '9876543210'}`);
        setUserProfile(profile);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        }
        setLoading(false);
        return true;
      }

      throw new Error('Invalid verification code. Please enter the OTP sent or 123456.');
    } catch (err: any) {
      console.error('[AuthContext] verifyOtp failed:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
      setLoading(false);
      return false;
    }
  }, [confirmationResult, pendingPhone, syncOrCreateUserProfile]);

  // ---------------------------------------------------------------------------
  // SIGN OUT
  // ---------------------------------------------------------------------------
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        await firebaseSignOut(auth);
      }
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setUserProfile(null);
      setConfirmationResult(null);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (err: any) {
      console.error('[AuthContext] Sign out error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // SHOPKEEPER PIN CREDENTIAL LOGIN
  // ---------------------------------------------------------------------------
  const loginWithPin = useCallback(async (phoneNumber: string, pin: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((res) => setTimeout(res, 400));
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const validPins = ['8873', '1234', '0000'];

      if (!validPins.includes(pin.trim())) {
        throw new Error('Invalid Shopkeeper Security PIN. (Default PIN is 8873)');
      }

      const uid = 'admin_shop_01';
      const defaultPhone = `+91${cleanPhone.slice(-10) || '9876543210'}`;
      const profile = await syncOrCreateUserProfile(uid, defaultPhone);
      const adminProfile: UserProfile = {
        ...profile,
        role: 'admin',
        name: 'Shopkeeper (Apna Kirana)',
      };

      setUserProfile(adminProfile);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(adminProfile));
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Invalid shopkeeper credentials.');
      setLoading(false);
      return false;
    }
  }, [syncOrCreateUserProfile]);

  // ---------------------------------------------------------------------------
  // 1-CLICK QUICK DEMO LOGIN (For fast testing)
  // ---------------------------------------------------------------------------
  const quickLoginDemo = useCallback((asRole: 'customer' | 'admin') => {
    const isAdm = asRole === 'admin';
    const demoProfile: UserProfile = {
      uid: isAdm ? 'admin_shop_01' : 'cust_user_001',
      phone_number: isAdm ? '+919876543210' : '+919811223344',
      name: isAdm ? 'Apna Kirana Shopkeeper' : 'Neighborhood Customer',
      role: isAdm ? 'admin' : 'customer',
      saved_addresses: [
        {
          id: 'addr_1',
          label: 'Home',
          street_address: 'Main Market, Sitamarhi, Bihar',
          landmark: 'City Center',
          pincode: '843302',
          is_default: true,
        },
      ],
    };

    setUserProfile(demoProfile);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoProfile));
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const contextValue = useMemo(
    () => ({
      user,
      userProfile,
      role: userProfile?.role || 'customer',
      isAuthenticated: !!userProfile,
      loading,
      error,
      confirmationResult,
      sendPhoneOtp,
      verifyOtp,
      loginWithPin,
      signOut,
      quickLoginDemo,
      clearError,
    }),
    [
      user,
      userProfile,
      loading,
      error,
      confirmationResult,
      sendPhoneOtp,
      verifyOtp,
      loginWithPin,
      signOut,
      quickLoginDemo,
      clearError,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
