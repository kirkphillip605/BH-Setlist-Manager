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
    if (!id) {
      throw new Error('Song ID is required.');
    }

    return apiService.executeQuery(() => {
      return supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    }).catch(error => {
      if (error.message?.includes('PGRST116') || error.message?.includes('0 rows')) {
        throw new Error('Song not found');
      }
      throw error;
    }).then(data => {
      if (!data) {
        throw new Error('Song not found');
      }
      return data;
    });
  },

  // Create a new song
  async createSong(songData) {
    const { original_artist, title, key_signature, lyrics, performance_note, tempo } = songData;

    const parsedTempo = tempo !== undefined && tempo !== null && tempo !== ''
      ? Number(tempo)
      : null;

    if (parsedTempo !== null && Number.isNaN(parsedTempo)) {
      throw new Error('Tempo must be a valid number.');
    }

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
      .insert([{ original_artist, title, key_signature, lyrics, performance_note, tempo: parsedTempo }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update a song
  async updateSong(id, songData) {
    const { original_artist, title, key_signature, lyrics, performance_note, tempo } = songData;

    const parsedTempo = tempo !== undefined && tempo !== null && tempo !== ''
      ? Number(tempo)
      : null;

    if (parsedTempo !== null && Number.isNaN(parsedTempo)) {
      throw new Error('Tempo must be a valid number.');
    }

    if (!original_artist || !title) {
      throw new Error('Artist and Title are required.');
    }

    if (!id) {
      throw new Error('Song ID is required.');
    }

    // Check if song exists first
    const { data: existingSong, error: checkError } = await supabase
      .from('songs')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (!existingSong) {
      throw new Error('Song not found.');
    }

    // Check for duplicate song (title + artist) excluding the current song being updated
    const { data: existingSongs, error: existingError } = await supabase
      .from('songs')
      .select('id')
      .eq('original_artist', original_artist)
      .eq('title', title)
      .neq('id', id);

    if (existingError) {
      throw new Error(existingError.message);
    }
    
    if (existingSongs && existingSongs.length > 0) {
      throw new Error('Another song with this title and artist already exists.');
    }

    const { data, error } = await supabase
      .from('songs')
      .update({ original_artist, title, key_signature, lyrics, performance_note, tempo: parsedTempo })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    
    if (!data) {
      throw new Error('Failed to update song - song may have been deleted.');
    }
    
    return data;
  },

  // Delete a song
  async deleteSong(id) {
    if (!id) {
      throw new Error('Song ID is required.');
    }

    // Check if song exists first
    const { data: existingSong, error: checkError } = await supabase
      .from('songs')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (!existingSong) {
      throw new Error('Song not found.');
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
};