import { supabase } from '../supabaseClient';

// Performance mode storage keys
const STORAGE_KEYS = {
  SETLIST_DATA: 'performanceMode_setlistData',
  SONGS_DATA: 'performanceMode_songsData',
  SESSION_ID: 'performanceMode_sessionId',
  IS_LEADER: 'performanceMode_isLeader',
  CACHE_TIMESTAMP: 'performanceMode_cacheTimestamp'
};

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

class PerformanceService {
  constructor() {
    this.activeSubscriptions = new Map();
    this.isInPerformanceMode = false;
    this.leadershipRequests = new Map();
  }

  // Check if we're currently in performance mode
  isActive() {
    return this.isInPerformanceMode;
  }

  // Set performance mode status
  setActive(status) {
    this.isInPerformanceMode = status;
  }

  // Check if cached data is still valid
  isCacheValid(setlistId) {
    try {
      const timestamp = localStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);
      const cachedSetlistData = localStorage.getItem(STORAGE_KEYS.SETLIST_DATA);
      
      if (!timestamp || !cachedSetlistData) return false;
      
      const age = Date.now() - parseInt(timestamp);
      return age < CACHE_EXPIRY;
    } catch (error) {
      return false;
    }
  }

  // Optimized bulk data fetching with single queries
  async prefetchAndCacheSetlistData(setlistId) {
    try {
      console.log('🚀 Pre-fetching setlist data for performance mode...');
      
      // Single query to get complete setlist with all nested data
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlists')
        .select(`
          *,
          sets (
            id,
            name,
            set_order,
            created_at,
            set_songs (
              song_order,
              songs (
                id,
                title,
                original_artist,
                key_signature,
                performance_note,
                lyrics,
                created_at
              )
            )
          )
        `)
        .eq('id', setlistId)
        .order('set_order', { foreignTable: 'sets', ascending: true })
        .order('song_order', { foreignTable: 'sets.set_songs', ascending: true })
        .single();

      if (setlistError) throw setlistError;
      
      if (!setlistData.sets || setlistData.sets.length === 0) {
        throw new Error('Setlist has no sets');
      }

      // Create songs lookup for O(1) access
      const allSongs = {};
      setlistData.sets.forEach(set => {
        set.set_songs?.forEach(setSong => {
          if (setSong.songs) {
            allSongs[setSong.songs.id] = setSong.songs;
          }
        });
      });

      console.log(`✅ Fetched complete setlist with ${Object.keys(allSongs).length} songs in single query`);

      // Store in localStorage
      try {
        const dataToStore = {
          timestamp: Date.now(),
          setlistData,
          songsData: allSongs
        };
        
        localStorage.setItem(STORAGE_KEYS.SETLIST_DATA, JSON.stringify(setlistData));
        localStorage.setItem(STORAGE_KEYS.SONGS_DATA, JSON.stringify(allSongs));
        localStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
        
        console.log('✅ Performance data cached successfully');
      } catch (storageError) {
        console.warn('Failed to cache data in localStorage:', storageError);
      }
      
      return { setlistData, songsData: allSongs };
    } catch (error) {
      console.error('Error pre-fetching setlist data:', error);
      throw error;
    }
  }

  // Get cached setlist data with validation
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

  // Clear all performance mode cache and state
  clearCache() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🧹 Performance cache cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  // Create a new performance session (leader)
  async createSession(setlistId, userId) {
    try {
      // End any existing sessions for this setlist
      await this.endActiveSessionsForSetlist(setlistId);

      // Pre-fetch all data before creating session
      const { setlistData } = await this.prefetchAndCacheSetlistData(setlistId);

      if (!setlistData.sets || setlistData.sets.length === 0) {
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
      
      // Store session info
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, data.id);
        localStorage.setItem(STORAGE_KEYS.IS_LEADER, 'true');
      } catch (storageError) {
        console.warn('Failed to store session info:', storageError);
      }
      
      this.setActive(true);
      console.log('🎭 Performance session created as leader');
      return data;
    } catch (error) {
      console.error('Error creating performance session:', error);
      throw error;
    }
  }

  // Join existing session (follower)
  async joinSession(setlistId, userId) {
    try {
      // Check for existing active session
      const activeSession = await this.getActiveSession(setlistId);
      
      if (!activeSession) {
        throw new Error('No active performance session found');
      }

      // Check if cache is valid, otherwise refresh
      if (!this.isCacheValid(setlistId)) {
        await this.prefetchAndCacheSetlistData(setlistId);
      }

      // Store session info as follower
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, activeSession.id);
        localStorage.setItem(STORAGE_KEYS.IS_LEADER, 'false');
      } catch (storageError) {
        console.warn('Failed to store session info:', storageError);
      }

      this.setActive(true);
      console.log('🎭 Joined performance session as follower');
      return activeSession;
    } catch (error) {
      console.error('Error joining performance session:', error);
      throw error;
    }
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
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return data;
  }

  // Get all followers for a session
  async getSessionFollowers(sessionId) {
    // This would require a followers table, for now return empty array
    // In a real implementation, you'd track followers in a separate table
    return [];
  }

  // Request leadership transfer
  async requestLeadershipTransfer(sessionId, requestingUserId, requestingUserName) {
    try {
      // Create leadership request in database
      const { data, error } = await supabase
        .from('leadership_requests')
        .insert({
          session_id: sessionId,
          requesting_user_id: requestingUserId,
          requesting_user_name: requestingUserName,
          status: 'pending',
          expires_at: new Date(Date.now() + 30000) // 30 seconds
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error requesting leadership transfer:', error);
      throw error;
    }
  }

  // Respond to leadership request
  async respondToLeadershipRequest(requestId, response, currentLeaderId) {
    try {
      const { data, error } = await supabase
        .from('leadership_requests')
        .update({
          status: response,
          responded_at: new Date()
        })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;

      if (response === 'approved') {
        // Transfer leadership
        await supabase
          .from('performance_sessions')
          .update({
            leader_id: data.requesting_user_id
          })
          .eq('id', data.session_id);
      }

      return data;
    } catch (error) {
      console.error('Error responding to leadership request:', error);
      throw error;
    }
  }

  // Update current song/set in session (leader only)
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
    try {
      this.setActive(false);
      this.clearCache();
      this.cleanupSubscriptions();
      
      const { error } = await supabase
        .from('performance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw new Error(error.message);
      console.log('🎭 Performance session ended');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
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

  // Subscribe to session changes (only when in performance mode)
  subscribeToSession(sessionId, callback) {
    if (!this.isActive()) {
      console.warn('Attempted to subscribe while not in performance mode');
      return null;
    }

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
          setTimeout(() => callback(payload), 0);
        }
      )
      .subscribe();

    this.activeSubscriptions.set(sessionId, subscription);
    console.log('🔔 Subscribed to performance session updates');
    return subscription;
  }

  // Subscribe to leadership requests
  subscribeToLeadershipRequests(sessionId, callback) {
    const subscription = supabase
      .channel(`leadership_requests_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leadership_requests',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setTimeout(() => callback(payload), 0);
        }
      )
      .subscribe();

    this.activeSubscriptions.set(`leadership_${sessionId}`, subscription);
    return subscription;
  }

  // Unsubscribe from specific session
  unsubscribeFromSession(sessionId) {
    const subscription = this.activeSubscriptions.get(sessionId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.activeSubscriptions.delete(sessionId);
      console.log('🔕 Unsubscribed from performance session');
    }
    
    const leadershipSub = this.activeSubscriptions.get(`leadership_${sessionId}`);
    if (leadershipSub) {
      supabase.removeChannel(leadershipSub);
      this.activeSubscriptions.delete(`leadership_${sessionId}`);
    }
  }

  // Clean up all subscriptions and performance state
  cleanupSubscriptions() {
    for (const [sessionId, subscription] of this.activeSubscriptions) {
      supabase.removeChannel(subscription);
    }
    this.activeSubscriptions.clear();
    this.setActive(false);
    console.log('🧹 All performance subscriptions cleaned up');
  }

  // Get cached session info
  getCachedSessionInfo() {
    try {
      return {
        sessionId: localStorage.getItem(STORAGE_KEYS.SESSION_ID),
        isLeader: localStorage.getItem(STORAGE_KEYS.IS_LEADER) === 'true'
      };
    } catch (error) {
      return { sessionId: null, isLeader: false };
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();