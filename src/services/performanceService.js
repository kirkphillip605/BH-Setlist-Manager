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

class PerformanceService {
  constructor() {
    this.activeSubscriptions = new Map();
  }

  // Prefetch and cache all setlist data
  async prefetchSetlistData(setlistId) {
    try {
      const setlistData = await setlistsService.getSetlistById(setlistId);
      const allSongs = {};
      
      // Efficiently fetch all songs
      const allSongIds = new Set();
      for (const set of setlistData.sets || []) {
        const setData = await setsService.getSetById(set.id);
        for (const setSong of setData.set_songs || []) {
          allSongIds.add(setSong.songs.id);
        }
      }
      
      // Batch fetch songs
      const songIds = Array.from(allSongIds);
      for (const songId of songIds) {
        const fullSong = await songsService.getSongById(songId);
        allSongs[songId] = fullSong;
      }
      
      // Store in browser storage with error handling
      try {
        localStorage.setItem(STORAGE_KEYS.SETLIST_DATA, JSON.stringify(setlistData));
        localStorage.setItem(STORAGE_KEYS.SONGS_DATA, JSON.stringify(allSongs));
      } catch (storageError) {
        console.warn('Failed to cache data in localStorage:', storageError);
      }
      
      return { setlistData, songsData: allSongs };
    } catch (error) {
      console.error('Error prefetching setlist data:', error);
      throw error;
    }
  }

  // Get cached setlist data with error handling
  getCachedSetlistData() {
    try {
      const setlistData = localStorage.getItem(STORAGE_KEYS.SETLIST_DATA);
      const songsData = localStorage.getItem(STORAGE_KEYS.SONGS_DATA);
      
      return {
        setlistData: setlistData ? JSON.parse(setlistData) : null,
        songsData: songsData ? JSON.parse(songsData) : {}
      };
    } catch (error) {
      console.error('Error reading cached data:', error);
      return { setlistData: null, songsData: {} };
    }
  }

  // Clear performance mode cache
  clearCache() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  // Create a new performance session
  async createSession(setlistId, userId) {
    // End any existing sessions for this setlist
    await this.endActiveSessionsForSetlist(setlistId);

    // Get the first set and song
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

    if (!setlistData?.sets?.length) {
      throw new Error('Setlist has no sets');
    }

    const firstSet = setlistData.sets[0];
    const firstSong = firstSet.set_songs?.[0]?.songs || null;

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
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.id);
    } catch (storageError) {
      console.warn('Failed to store session ID:', storageError);
    }
    
    return data;
  }

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
  }

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
  }

  // End a performance session
  async endSession(sessionId) {
    this.clearCache();
    this.cleanupSubscriptions();
    
    const { error } = await supabase
      .from('performance_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
  }

  // End all active sessions for a setlist
  async endActiveSessionsForSetlist(setlistId) {
    const { error } = await supabase
      .from('performance_sessions')
      .update({ is_active: false })
      .eq('setlist_id', setlistId)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
  }

  // Subscribe to session changes with proper cleanup
  subscribeToSession(sessionId, callback) {
    // Clean up existing subscription if any
    this.unsubscribeFromSession(sessionId);
    
    const subscription = supabase
      .channel(`performance_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'performance_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          // Use setImmediate to defer callback execution
          setImmediate(() => callback(payload));
        }
      )
      .subscribe();

    this.activeSubscriptions.set(sessionId, subscription);
    return subscription;
  }

  // Unsubscribe from specific session
  unsubscribeFromSession(sessionId) {
    const subscription = this.activeSubscriptions.get(sessionId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.activeSubscriptions.delete(sessionId);
    }
  }

  // Clean up all subscriptions
  cleanupSubscriptions() {
    for (const [sessionId, subscription] of this.activeSubscriptions) {
      supabase.removeChannel(subscription);
    }
    this.activeSubscriptions.clear();
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();