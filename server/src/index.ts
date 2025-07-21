import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import songsRoutes from './routes/songs';
import setTemplatesRoutes from './routes/setTemplates';
import setlistsRoutes from './routes/setlists';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not defined in .env');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    await supabase.from('songs').select('*').limit(0);
    console.log('Supabase connection successful!');
  } catch (error: any) { // Explicitly type error as 'any' or 'unknown'
    console.error('Supabase connection failed:', error.message);
    process.exit(1); // Exit if connection fails
  }
}

testSupabaseConnection();

// Routes
app.use('/api/songs', songsRoutes);
app.use('/api/set-templates', setTemplatesRoutes);
app.use('/api/setlists', setlistsRoutes);

app.get('/', (req, res) => {
  res.send('Music App Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
