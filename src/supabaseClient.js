import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging to help troubleshoot
console.log('Environment check:', {
  supabaseUrl: supabaseUrl ? 'present' : 'missing',
  supabaseAnonKey: supabaseAnonKey ? 'present' : 'missing',
  NODE_ENV: import.meta.env.NODE_ENV,
  DEV: import.meta.env.DEV
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL ERROR: Supabase environment variables are missing!');
  console.error('Missing variables:', {
    VITE_SUPABASE_URL: !supabaseUrl ? 'MISSING' : 'OK',
    VITE_SUPABASE_ANON_KEY: !supabaseAnonKey ? 'MISSING' : 'OK'
  });
  console.error('Please ensure your .env file exists in the project root with:');
  console.error('VITE_SUPABASE_URL=your_url_here');
  console.error('VITE_SUPABASE_ANON_KEY=your_key_here');
  console.error('Then restart the development server with: npm run dev');
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
