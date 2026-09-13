import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  });
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Network] Connection restored.');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.warn('[Network] Internet connection lost. Entering offline resilient mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return { isOnline, wasOffline };
}

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>
        You are currently offline. Your cart and orders are preserved on this device.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#78350F', // Dark amber
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 9999,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default useNetworkStatus;
