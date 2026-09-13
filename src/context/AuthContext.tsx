import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
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
  // SILENT PROFILE PROVISIONING IN FIRESTORE
  // ---------------------------------------------------------------------------
  const syncOrCreateUserProfile = useCallback(async (uid: string, phoneNumber: string): Promise<UserProfile> => {
    // 1. Try Firebase Firestore if configured
    if (isFirebaseConfigured()) {
      try {
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          return userSnap.data() as UserProfile;
        } else {
          // Determine if test phone number should be granted admin role automatically
          const isAdminNumber = phoneNumber.includes('9876543210');
          const defaultProfile: UserProfile = {
            uid,
            phone_number: phoneNumber,
            name: isAdminNumber ? 'Shopkeeper (Counter)' : 'Neighborhood Customer',
            role: isAdminNumber ? 'admin' : 'customer',
            saved_addresses: [
              {
                id: `addr_${Date.now()}`,
                label: 'Home',
                street_address: 'Flat 302, Green Valley Apartments, Pocket 2',
                landmark: 'Near Community Center',
                pincode: '110001',
                is_default: true,
              },
            ],
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
    const isAdminNumber = phoneNumber.includes('9876543210');
    return {
      uid,
      phone_number: phoneNumber,
      name: isAdminNumber ? 'Shopkeeper (Counter)' : 'Neighborhood Customer',
      role: isAdminNumber ? 'admin' : 'customer',
      saved_addresses: [
        {
          id: 'addr_default_1',
          label: 'Home',
          street_address: 'Flat 302, Green Valley Apartments, Pocket 2',
          landmark: 'Near Community Center',
          pincode: '110001',
          is_default: true,
        },
      ],
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
  // SEND PHONE OTP
  // ---------------------------------------------------------------------------
  const sendPhoneOtp = useCallback(async (phoneNumber: string, recaptchaContainerId = 'recaptcha-container'): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setPendingPhone(phoneNumber);

    try {
      if (isFirebaseConfigured()) {
        // Initialize reCAPTCHA verifier if in browser environment
        let appVerifier: any = undefined;
        if (typeof window !== 'undefined' && document.getElementById(recaptchaContainerId)) {
          appVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
            size: 'invisible',
          });
        }

        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setLoading(false);
        return true;
      } else if (isSupabaseConfigured()) {
        const { error: sbError } = await supabase.auth.signInWithOtp({
          phone: phoneNumber,
        });
        if (sbError) throw sbError;
        setLoading(false);
        return true;
      } else {
        // Simulated Verification for testing and client demonstrations

        // Mock / Development Mode: Simulate SMS delivery
        await new Promise((res) => setTimeout(res, 600)); // Simulating network latency
        setConfirmationResult({
          confirm: async (otp: string) => {
            if (otp === '123456' || otp.length === 6) {
              const mockUid = `user_${Date.now()}`;
              const profile = await syncOrCreateUserProfile(mockUid, phoneNumber);
              setUserProfile(profile);
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
              }
              return { user: { uid: mockUid, phoneNumber } } as any;
            }
            throw new Error('Invalid OTP. For demo mode, enter 123456.');
          },
          verificationId: 'mock-verification-id',
        } as any);

        setLoading(false);
        return true;
      }
    } catch (err: any) {
      console.error('[AuthContext] sendPhoneOtp failed:', err);
      setError(err.message || 'Failed to send OTP. Please check the mobile number.');
      setLoading(false);
      return false;
    }
  }, [syncOrCreateUserProfile]);

  // ---------------------------------------------------------------------------
  // VERIFY 6-DIGIT OTP
  // ---------------------------------------------------------------------------
  const verifyOtp = useCallback(async (otpCode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(otpCode);
        if (result?.user) {
          const profile = await syncOrCreateUserProfile(result.user.uid, result.user.phoneNumber || pendingPhone);
          setUserProfile(profile);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          }
        }
        setLoading(false);
        return true;
      } else if (isSupabaseConfigured()) {
        const { data, error: sbErr } = await supabase.auth.verifyOtp({
          phone: pendingPhone,
          token: otpCode,
          type: 'sms',
        });
        if (sbErr) throw sbErr;
        if (data?.user) {
          const profile = await syncOrCreateUserProfile(data.user.id, pendingPhone);
          setUserProfile(profile);
        }
        setLoading(false);
        return true;
      } else {
        if (isProduction) {
          throw new Error('Production Security Lockdown: Verification provider not connected.');
        }

        // Fallback demo check
        if (otpCode === '123456' || otpCode.length === 6) {
          const mockUid = pendingPhone.includes('9876543210') ? 'admin_shop_01' : `cust_${Date.now()}`;
          const profile = await syncOrCreateUserProfile(mockUid, pendingPhone || '+919811223344');
          setUserProfile(profile);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
          }
          setLoading(false);
          return true;
        } else {
          throw new Error('Incorrect OTP. Please enter 123456.');
        }
      }
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
  // 1-CLICK QUICK DEMO LOGIN (For fast testing)
  // ---------------------------------------------------------------------------
  const quickLoginDemo = useCallback((asRole: 'customer' | 'admin') => {
    const isAdm = asRole === 'admin';
    const demoProfile: UserProfile = {
      uid: isAdm ? 'admin_shop_01' : 'cust_user_001',
      phone_number: isAdm ? '+919876543210' : '+919811223344',
      name: isAdm ? 'Apna Kirana Shopkeeper' : 'Mrs. Sharma',
      role: isAdm ? 'admin' : 'customer',
      saved_addresses: [
        {
          id: 'addr_1',
          label: 'Home',
          street_address: 'Flat 302, Green Valley Apartments, Pocket 2',
          landmark: 'Near Community Center',
          pincode: '110001',
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
