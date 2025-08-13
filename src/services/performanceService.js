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
    this.notificationCallbacks = new Map();
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

  // Get or create unique session for setlist
  async getOrCreateSession(setlistId, userId, forceAsLeader = false) {
    try {
      // Check for existing active session
      let activeSession = await this.getActiveSession(setlistId);

      if (activeSession) {
        if (activeSession.leader_id === userId) {
          // User is the current leader or forcing leadership, return session
          console.log(`🎭 User ${userId} is leader of existing session`);
          return { session: activeSession, isNewSession: false, isLeader: true };
        } else {
          // Different leader exists
          console.log(`🎭 Different leader exists for session`);
          return { session: activeSession, isNewSession: false, isLeader: false };
        }
      }

      // Only create new session if forceAsLeader is true or no session exists
      if (!forceAsLeader && !activeSession) {
        return { session: null, isNewSession: false, isLeader: false };
      }

      // No active session exists, create new one
      console.log(`🎭 Creating new session for setlist ${setlistId}`);
      
      // Pre-fetch data before creating session
      const { setlistData } = await this.prefetchAndCacheSetlistData(setlistId);

      if (!setlistData.sets || setlistData.sets.length === 0) {
        throw new Error('Setlist has no sets');
      }

      const firstSet = setlistData.sets[0];
      const firstSong = firstSet.set_songs?.[0]?.songs || null;

      const { data: newSession, error } = await supabase
        .from('performance_sessions')
        .insert({
          setlist_id: setlistId,
          leader_id: userId,
          current_set_id: firstSet.id,
          current_song_id: firstSong?.id || null,
          is_active: true
        })
        .select(`
          *,
          setlists (name),
          users (name),
          sets (name),
          songs (title, original_artist)
        `)
        .single();

      if (error) throw new Error(error.message);
      
      console.log('🎭 New performance session created');
      return { session: newSession, isNewSession: true, isLeader: true };
    } catch (error) {
      console.error('Error getting/creating session:', error);
      throw error;
    }
  }

  // Create a new performance session (leader)
  async createSession(setlistId, userId) {
    try {
      const result = await this.getOrCreateSession(setlistId, userId, true);
      
      // Store session info
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, result.session.id);
        localStorage.setItem(STORAGE_KEYS.IS_LEADER, 'true');
      } catch (storageError) {
        console.warn('Failed to store session info:', storageError);
      }
      
      this.setActive(true);
      return result.session;
    } catch (error) {
      console.error('Error creating performance session:', error);
      throw error;
    }
  }

  // Join existing session (follower)
  async joinSession(setlistId, userId) {
    try {
      // Get the existing session without creating a new one
      const activeSession = await this.getActiveSession(setlistId);
      
      if (!activeSession) {
        throw new Error('No active performance session found');
      }

      // Add user as participant in the session
      const { error: participantError } = await supabase
        .from('session_participants')
        .upsert({
          session_id: activeSession.id,
          user_id: userId,
          is_active: true
        }, {
          onConflict: 'session_id,user_id'
        });

      if (participantError) {
        console.warn('Failed to add participant (may already exist):', participantError);
      }

      // Check if cache is valid, otherwise refresh
      if (!this.isCacheValid(setlistId)) {
        await this.prefetchAndCacheSetlistData(setlistId);
      }

      // Store session info as follower
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionResult.session.id);
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

  // Clean up expired sessions and leadership requests
  async cleanupExpiredSessions() {
    try {
      // Remove expired leadership requests
      await supabase
        .from('leadership_requests')
        .delete()
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString());

      // Note: We don't auto-expire sessions as they should remain active until manually ended
    } catch (error) {
      console.warn('Error cleaning up expired sessions:', error);
    }
  }

  // Get all followers for a session
  async getSessionFollowers(sessionId) {
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select(`
          *,
          users (
            id,
            name,
            email,
            role
          )
        `)
        .eq('session_id', sessionId)
        .eq('is_active', true);

      if (error) throw error;
      return data?.map(p => p.users).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching session followers:', error);
      return [];
    }
  }

  // Request leadership transfer
  async requestLeadershipTransfer(sessionId, requestingUserId, requestingUserName) {
    try {
      // Cancel any existing pending requests from this user for this session
      await supabase
        .from('leadership_requests')
        .update({ status: 'cancelled' })
        .eq('session_id', sessionId)
        .eq('requesting_user_id', requestingUserId)
        .eq('status', 'pending');

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
      console.log('🤝 Leadership transfer requested');
      return data;
    } catch (error) {
      console.error('Error requesting leadership transfer:', error);
      throw error;
    }
  }

  // Respond to leadership request
  async respondToLeadershipRequest(requestId, response, currentLeaderId) {
    try {
      const { data: request, error } = await supabase
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
        // Transfer leadership in the session
        const { error: transferError } = await supabase
          .from('performance_sessions')
          .update({
            leader_id: request.requesting_user_id
          })
          .eq('id', request.session_id);

        if (transferError) throw transferError;

        // Add the old leader as a participant
        await supabase
          .from('session_participants')
          .upsert({
            session_id: request.session_id,
            user_id: currentLeaderId,
            is_active: true
          }, {
            onConflict: 'session_id,user_id'
          });

        console.log('👑 Leadership transferred successfully');
      }

      return request;
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
      .select(`
        *,
        setlists (name),
        users (name),
        sets (name),
        songs (title, original_artist)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // End a performance session
  async endSession(sessionId) {
    try {
      this.setActive(false);
      this.cleanupSubscriptions();
      
      // Mark all participants as inactive
      await supabase
        .from('session_participants')
        .update({ is_active: false })
        .eq('session_id', sessionId);

      // Mark session as inactive
      const { error } = await supabase
        .from('performance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw new Error(error.message);
      
      this.clearCache();
      console.log('🎭 Performance session ended');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  // Leave session (for followers)
  async leaveSession(sessionId, userId) {
    try {
      await supabase
        .from('session_participants')
        .update({ is_active: false })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      console.log('🚪 Left performance session');
    } catch (error) {
      console.error('Error leaving session:', error);
      throw error;
    }
  }

  // Subscribe to session changes (for real-time updates)
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
          console.log('📡 Session update received:', payload.new);
          setTimeout(() => callback(payload), 0);
        }
      )
      .subscribe();

    this.activeSubscriptions.set(sessionId, subscription);
    console.log('🔔 Subscribed to performance session updates');
    return subscription;
  }

  // Subscribe to participant changes
  subscribeToParticipants(sessionId, callback) {
    const subscription = supabase
      .channel(`session_participants_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('👥 Participant change:', payload);
          setTimeout(() => callback(payload), 0);
        }
      )
      .subscribe();

    this.activeSubscriptions.set(`participants_${sessionId}`, subscription);
    console.log('🔔 Subscribed to participant updates');
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
          console.log('👑 Leadership request received:', payload.new);
          setTimeout(() => callback(payload), 0);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leadership_requests',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('👑 Leadership request updated:', payload.new);
          setTimeout(() => callback(payload), 0);
        }
      )
      .subscribe();

    this.activeSubscriptions.set(`leadership_${sessionId}`, subscription);
    console.log('🔔 Subscribed to leadership requests');
    return subscription;
  }

  // Register notification callback
  registerNotificationCallback(key, callback) {
    this.notificationCallbacks.set(key, callback);
  }

  // Unregister notification callback
  unregisterNotificationCallback(key) {
    this.notificationCallbacks.delete(key);
  }

  // Show notification to all registered callbacks
  showNotification(type, message) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(type, message);
      } catch (error) {
        console.warn('Error in notification callback:', error);
      }
    });
  }

  // Unsubscribe from specific session
  unsubscribeFromSession(sessionId) {
    const subscription = this.activeSubscriptions.get(sessionId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.activeSubscriptions.delete(sessionId);
      console.log('🔕 Unsubscribed from performance session');
    }
    
    const participantsSub = this.activeSubscriptions.get(`participants_${sessionId}`);
    if (participantsSub) {
      supabase.removeChannel(participantsSub);
      this.activeSubscriptions.delete(`participants_${sessionId}`);
    }
    
    const leadershipSub = this.activeSubscriptions.get(`leadership_${sessionId}`);
    if (leadershipSub) {
      supabase.removeChannel(leadershipSub);
      this.activeSubscriptions.delete(`leadership_${sessionId}`);
    }
  }

  // Clean up all subscriptions and performance state
  cleanupSubscriptions() {
    // Remove user from session participants when leaving
    const cachedSessionInfo = this.getCachedSessionInfo();
    if (cachedSessionInfo.sessionId && cachedSessionInfo.sessionId !== 'standalone') {
      // Asynchronously remove participant (don't await to avoid blocking cleanup)
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('session_participants')
            .update({ is_active: false })
            .eq('session_id', cachedSessionInfo.sessionId)
            .eq('user_id', user.id)
            .then(() => console.log('🚪 Removed from session participants'))
            .catch(err => console.warn('Failed to remove participant:', err));
        }
      });
    }

    for (const [sessionId, subscription] of this.activeSubscriptions) {
      try {
        supabase.removeChannel(subscription);
      } catch (error) {
        console.warn(`Failed to remove subscription ${sessionId}:`, error);
      }
    }
    this.activeSubscriptions.clear();
    this.notificationCallbacks.clear();
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