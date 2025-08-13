import { supabase } from '../supabaseClient';
import { apiService } from './apiService';

export const songsService = {
  // Get all songs
  async getAllSongs() {
    return apiService.executeQuery(() => {
      return supabase
        .from('songs')
        .select('*')
        .order('original_artist', { ascending: true })
        .order('title', { ascending: true });
    });
  },

  // Get a single song by ID
  async getSongById(id) {
    return apiService.executeQuery(() => {
      return supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();
    }).catch(error => {
      if (error.message?.includes('PGRST116')) {
        throw new Error('Song not found');
      }
      throw error;
    });
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