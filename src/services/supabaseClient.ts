import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`]!;
    if (process.env[`REACT_APP_${key}`]) return process.env[`REACT_APP_${key}`]!;
    if (process.env[`EXPO_PUBLIC_${key}`]) return process.env[`EXPO_PUBLIC_${key}`]!;
  }
  return fallback;
};

const supabaseUrl = getEnvVar('SUPABASE_URL', 'https://apna-kirana-demo.supabase.co');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY', 'demo-anon-key-apna-kirana-12345');

export const isSupabaseConfigured = (): boolean => {
  const key = getEnvVar('SUPABASE_ANON_KEY', '');
  return key !== '' && key !== 'demo-anon-key-apna-kirana-12345';
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
