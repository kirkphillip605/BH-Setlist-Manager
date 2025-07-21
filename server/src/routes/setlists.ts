import { Router } from 'express';
import { supabase } from '../index';

const router = Router();

// Get all setlists
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('setlists')
    .select('*')
    .order('name', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get a single setlist by ID with its songs
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('setlists')
    .select(`
      *,
      setlist_songs (
        song_order,
        songs (
          id,
          original_artist,
          title,
          key_signature,
          lyrics
        )
      )
    `)
    .eq('id', id)
    .order('song_order', { foreignTable: 'setlist_songs', ascending: true })
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// Create a new setlist
router.post('/', async (req, res) => {
  const { name, songs, user_id } = req.body; // songs is an array of { song_id, song_order }

  if (!name || !user_id) {
    return res.status(400).json({ error: 'Setlist name and user_id are required.' });
  }

  // Check for duplicate setlist name for this user
  const { data: existingSetlist, error: existingError } = await supabase
    .from('setlists')
    .select('id')
    .eq('name', name)
    .eq('user_id', user_id)
    .single();

  if (existingSetlist) {
    return res.status(409).json({ error: 'A setlist with this name already exists.' });
  }
  if (existingError && existingError.code !== 'PGRST116') {
    return res.status(500).json({ error: existingError.message });
  }

  const { data: newSetlist, error: setlistError } = await supabase
    .from('setlists')
    .insert([{ name, user_id }])
    .select()
    .single();

  if (setlistError) return res.status(500).json({ error: setlistError.message });

  if (songs && songs.length > 0) {
    const setlistSongsToInsert = songs.map((s: { song_id: string; song_order: number }) => ({
      setlist_id: newSetlist.id,
      song_id: s.song_id,
      song_order: s.song_order,
    }));

    const { error: setlistSongsError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongsToInsert);

    if (setlistSongsError) {
      await supabase.from('setlists').delete().eq('id', newSetlist.id); // Rollback
      return res.status(500).json({ error: setlistSongsError.message });
    }
  }

  res.status(201).json(newSetlist);
});

// Update a setlist
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, songs } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Setlist name is required.' });
  }

  // Get the setlist to check ownership
  const { data: setlist, error: setlistFetchError } = await supabase
    .from('setlists')
    .select('user_id')
    .eq('id', id)
    .single();

  if (setlistFetchError) {
    return res.status(404).json({ error: 'Setlist not found' });
  }

  // Check for duplicate setlist name for this user, excluding the current setlist
  const { data: existingSetlist, error: existingError } = await supabase
    .from('setlists')
    .select('id')
    .eq('name', name)
    .eq('user_id', setlist.user_id)
    .neq('id', id)
    .single();

  if (existingSetlist) {
    return res.status(409).json({ error: 'Another setlist with this name already exists.' });
  }
  if (existingError && existingError.code !== 'PGRST116') {
    return res.status(500).json({ error: existingError.message });
  }

  const { data: updatedSetlist, error: setlistError } = await supabase
    .from('setlists')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (setlistError) return res.status(500).json({ error: setlistError.message });

  // Update associated songs
  if (songs !== undefined) {
    // Delete existing setlist_songs for this setlist
    const { error: deleteError } = await supabase
      .from('setlist_songs')
      .delete()
      .eq('setlist_id', id);

    if (deleteError) return res.status(500).json({ error: deleteError.message });

    if (songs.length > 0) {
      const setlistSongsToInsert = songs.map((s: { song_id: string; song_order: number }) => ({
        setlist_id: id,
        song_id: s.song_id,
        song_order: s.song_order,
      }));

      const { error: insertError } = await supabase
        .from('setlist_songs')
        .insert(setlistSongsToInsert);

      if (insertError) return res.status(500).json({ error: insertError.message });
    }
  }

  res.json(updatedSetlist);
});

// Delete a setlist
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('setlists')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;