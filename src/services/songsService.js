import { supabase } from '../supabaseClient';

export const songsService = {
  // Get all songs
  async getAllSongs() {
    // Add timeout and error handling for better performance feedback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('original_artist', { ascending: true })
      .order('title', { ascending: true })
      .abortSignal(controller.signal);

      clearTimeout(timeoutId);
    if (error) throw new Error(error.message);
    return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  },

  // Get a single song by ID
  async getSongById(id) {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Song not found');
      }
      throw new Error(error.message);
    }
    return data;
  },

  // Create a new song
  async createSong(songData) {
    const { original_artist, title, key_signature, lyrics, performance_note } = songData;

    if (!original_artist || !title) {
      throw new Error('Artist and Title are required.');
    }

    // Check for duplicate song (title + artist)
    const { data: existingSong, error: existingError } = await supabase
      .from('songs')
      .select('id')
      .eq('original_artist', original_artist)
      .eq('title', title)
      .single();

    if (existingSong) {
      throw new Error('A song with this title and artist already exists.');
    }
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    const { data, error } = await supabase
      .from('songs')
      .insert([{ original_artist, title, key_signature, lyrics, performance_note }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update a song
  async updateSong(id, songData) {
    const { original_artist, title, key_signature, lyrics, performance_note } = songData;

    if (!original_artist || !title) {
      throw new Error('Artist and Title are required.');
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
      throw new Error('Another song with this title and artist already exists.');
    }
    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message);
    }

    const { data, error } = await supabase
      .from('songs')
      .update({ original_artist, title, key_signature, lyrics, performance_note })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete a song
  async deleteSong(id) {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};