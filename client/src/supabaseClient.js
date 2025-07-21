import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not defined in .env');
  // In a real app, you might want to display an error message to the user
  // or handle this more gracefully. For now, we'll just log.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
