import { supabase } from '../supabaseClient';
import { songsService } from './songsService';
import { setlistsService } from './setlistsService';
import { setsService } from './setsService';

// Performance mode storage keys
const STORAGE_KEYS = {
  SETLIST_DATA: 'performanceMode_setlistData',
  SONGS_DATA: 'performanceMode_songsData',
  SESSION_ID: 'performanceMode_sessionId'
};

export const performanceService = {
  // Prefetch and cache all setlist data
  async prefetchSetlistData(setlistId) {
    try {
      // Get full setlist with sets
      const setlistData = await setlistsService.getSetlistById(setlistId);
      
      // Get all songs for all sets
      const allSongs = {};
      for (const set of setlistData.sets || []) {
        const setData = await setsService.getSetById(set.id);
        for (const setSong of setData.set_songs || []) {
          if (!allSongs[setSong.songs.id]) {
            // Get full song data with lyrics
            const fullSong = await songsService.getSongById(setSong.songs.id);
            allSongs[setSong.songs.id] = fullSong;
          }
        }
      }
      
      // Store in browser storage
      localStorage.setItem(STORAGE_KEYS.SETLIST_DATA, JSON.stringify(setlistData));
      localStorage.setItem(STORAGE_KEYS.SONGS_DATA, JSON.stringify(allSongs));
      
      return { setlistData, songsData: allSongs };
    } catch (error) {
      console.error('Error prefetching setlist data:', error);
      throw error;
    }
  },

  // Get cached setlist data
  getCachedSetlistData() {
    try {
      const setlistData = localStorage.getItem(STORAGE_KEYS.SETLIST_DATA);
      const songsData = localStorage.getItem(STORAGE_KEYS.SONGS_DATA);
      
      return {
        setlistData: setlistData ? JSON.parse(setlistData) : null,
        songsData: songsData ? JSON.parse(songsData) : null
      };
    } catch (error) {
      console.error('Error reading cached data:', error);
      return { setlistData: null, songsData: null };
    }
  },

  // Clear performance mode cache
  clearCache() {
    localStorage.removeItem(STORAGE_KEYS.SETLIST_DATA);
    localStorage.removeItem(STORAGE_KEYS.SONGS_DATA);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  },

  // Create a new performance session
  async createSession(setlistId, userId) {
    // First, end any existing active sessions for this setlist
    await this.endActiveSessionsForSetlist(setlistId);

    // Get the first set from the setlist
    const { data: setlistData } = await supabase
      .from('setlists')
      .select(`
        *,
        sets (
          id,
          name,
          set_order,
          set_songs (
            song_order,
            songs (id, title, original_artist, key_signature)
          )
        )
      `)
      .eq('id', setlistId)
      .order('set_order', { foreignTable: 'sets', ascending: true })
      .order('song_order', { foreignTable: 'sets.set_songs', ascending: true })
      .single();

    if (!setlistData || !setlistData.sets || setlistData.sets.length === 0) {
      throw new Error('Setlist has no sets');
    }

    const firstSet = setlistData.sets[0];
    const firstSong = firstSet.set_songs && firstSet.set_songs.length > 0 
      ? firstSet.set_songs[0].songs 
      : null;

    const { data, error } = await supabase
      .from('performance_sessions')
      .insert({
        setlist_id: setlistId,
        leader_id: userId,
        current_set_id: firstSet.id,
        current_song_id: firstSong?.id || null,
        is_active: true
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    // Store session ID for reference
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.id);
    
    return data;
  },

  // Get active session for a setlist
  async getActiveSession(setlistId) {
    const { data, error } = await supabase
      .from('performance_sessions')
      .select(`
        *,
        setlists (name),
        users (name),
        sets (name),
        songs (title, original_artist)
      `)
      .eq('setlist_id', setlistId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return data;
  },

  // Update current song/set in session
  async updateSession(sessionId, updates) {
    const { data, error } = await supabase
      .from('performance_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // End a performance session
  async endSession(sessionId) {
    // Clear cache when ending session
    this.clearCache();
    
    const { error } = await supabase
      .from('performance_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
  },

  // End all active sessions for a setlist (cleanup)
  async endActiveSessionsForSetlist(setlistId) {
    const { error } = await supabase
      .from('performance_sessions')
      .update({ is_active: false })
      .eq('setlist_id', setlistId)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
  },

  // Subscribe to session changes
  subscribeToSession(sessionId, callback) {
    return supabase
      .channel(`performance_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'performance_sessions',
          filter: `id=eq.${sessionId}`
        },
        callback
      )
      .subscribe();
  }
};