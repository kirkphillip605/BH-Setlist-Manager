/* eslint-env browser */

import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from './utils/env';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

const envSource = typeof window !== 'undefined' && window.__ENV__ ? 'runtime' : 'build';

// Debug logging to help troubleshoot
console.log('Environment check:', {
  supabaseUrl: supabaseUrl ? 'present' : 'missing',
  supabaseAnonKey: supabaseAnonKey ? 'present' : 'missing',
  source: envSource,
  NODE_ENV: import.meta.env?.NODE_ENV,
  DEV: import.meta.env?.DEV
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL ERROR: Supabase environment variables are missing!');
  console.error('Missing variables:', {
    VITE_SUPABASE_URL: !supabaseUrl ? 'MISSING' : 'OK',
    VITE_SUPABASE_ANON_KEY: !supabaseAnonKey ? 'MISSING' : 'OK'
  });
  console.error('Ensure the variables are provided either via your .env file during development');
  console.error('or as CapRover environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) in production.');
}

let supabase = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.error('❌ Cannot create Supabase client - missing environment variables');
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
}

export { supabase };
