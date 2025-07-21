import { Router } from 'express';
import { supabase } from '../index';

const router = Router();

// Get all songs
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('original_artist', { ascending: true })
    .order('title', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get a single song by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      return res.status(404).json({ error: 'Song not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// Create a new song
router.post('/', async (req, res) => {
  const { original_artist, title, key_signature, lyrics } = req.body;

  if (!original_artist || !title || !lyrics) {
    return res.status(400).json({ error: 'Artist, Title, and Lyrics are required.' });
  }

  // Check for duplicate song (title + artist)
  const { data: existingSong, error: existingError } = await supabase
    .from('songs')
    .select('id')
    .eq('original_artist', original_artist)
    .eq('title', title)
    .single();

  if (existingSong) {
    return res.status(409).json({ error: 'A song with this title and artist already exists.' });
  }
  if (existingError && existingError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
    return res.status(500).json({ error: existingError.message });
  }

  const { data, error } = await supabase
    .from('songs')
    .insert([{ original_artist, title, key_signature, lyrics }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Update a song
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { original_artist, title, key_signature, lyrics } = req.body;

  if (!original_artist || !title || !lyrics) {
    return res.status(400).json({ error: 'Artist, Title, and Lyrics are required.' });
  }

  // Check for duplicate song (title + artist) excluding the current song being updated
  const { data: existingSong, error: existingError } = await supabase
    .from('songs')
    .select('id')
    .eq('original_artist', original_artist)
    .eq('title', title)
    .neq('id', id)
    .single();

  if (existingSong) {
    return res.status(409).json({ error: 'Another song with this title and artist already exists.' });
  }
  if (existingError && existingError.code !== 'PGRST116') {
    return res.status(500).json({ error: existingError.message });
  }

  const { data, error } = await supabase
    .from('songs')
    .update({ original_artist, title, key_signature, lyrics })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete a song
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
