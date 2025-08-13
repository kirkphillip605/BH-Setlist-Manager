import { supabase } from '../supabaseClient';

// Performance mode storage keys
const STORAGE_KEYS = {
  SETLIST_DATA: 'performanceMode_setlistData',
  SONGS_DATA: 'performanceMode_songsData',
  SESSION_ID: 'performanceMode_sessionId',
  IS_LEADER: 'performanceMode_isLeader',
  CACHE_TIMESTAMP: 'performanceMode_cacheTimestamp',
  LAST_ACTIVITY: 'performanceMode_lastActivity'
};

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;
// Session stale timeout (2 minutes of inactivity)
const SESSION_STALE_TIMEOUT = 2 * 60 * 1000;

class PerformanceService {
  constructor() {
    this.activeSubscriptions = new Map();
    this.isInPerformanceMode = false;
    this.leadershipRequests = new Map();
    this.notificationCallbacks = new Map();
    this.lastNotifiedLeader = null;
    this.notifiedParticipants = new Set();
  }

  // Check if we're currently in performance mode
  isActive() {
    return this.isInPerformanceMode;
  }

  // Set performance mode status
  setActive(status) {
    this.isInPerformanceMode = status;
    if (status) {
      this.updateLastActivity();
    }
  }

  // Update last activity timestamp
  updateLastActivity() {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to update activity timestamp:', error);
    }
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

  // Check if session is stale based on last activity
  isSessionStale(sessionData) {
    try {
      if (!sessionData || !sessionData.created_at) return false;
      
      const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      const activityTime = lastActivity ? parseInt(lastActivity) : new Date(sessionData.created_at).getTime();
      
      return Date.now() - activityTime > SESSION_STALE_TIMEOUT;
    } catch (error) {
      return false;
    }
  }

  // Clean up stale sessions
  async cleanupStaleSessions(setlistId, currentUserId) {
    try {
      const { data: staleSessions, error } = await supabase
        .from('performance_sessions')
        .select('*')
        .eq('setlist_id', setlistId)
        .eq('is_active', true);

      if (error || !staleSessions) return;

      for (const session of staleSessions) {
        // Check if session is stale (created more than 10 minutes ago with no recent updates)
        const sessionAge = Date.now() - new Date(session.created_at).getTime();
        const isOld = sessionAge > 10 * 60 * 1000; // 10 minutes

        if (isOld || this.isSessionStale(session)) {
          console.log(`🧹 Cleaning up stale session ${session.id}`);
          
          // Mark session as inactive
          await supabase
            .from('performance_sessions')
            .update({ is_active: false })
            .eq('id', session.id);

          // Mark participants as inactive
          await supabase
            .from('session_participants')
            .update({ is_active: false })
            .eq('session_id', session.id);
        }
      }
    } catch (error) {
      console.warn('Error cleaning up stale sessions:', error);
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
      this.lastNotifiedLeader = null;
      this.notifiedParticipants.clear();
      console.log('🧹 Performance cache cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  // Get or create session with improved logic
  async getOrCreateSession(setlistId, userId, role = 'follower') {
    try {
      // Clean up stale sessions first
      await this.cleanupStaleSessions(setlistId, userId);
      
      // Check for existing active session
      let activeSession = await this.getActiveSession(setlistId);

      if (activeSession) {
        if (activeSession.leader_id === userId) {
          // User is rejoining as the same leader
          console.log(`👑 User ${userId} rejoining as existing leader`);
          return { session: activeSession, isNewSession: false, isLeader: true };
        } else if (role === 'leader') {
          // Different leader exists, user wants to request leadership
          console.log(`🤝 Different leader exists, leadership transfer required`);
          return { session: activeSession, isNewSession: false, isLeader: false, needsTransfer: true };
        } else {
          // User joining as follower
          console.log(`👥 User ${userId} joining as follower`);
          return { session: activeSession, isNewSession: false, isLeader: false };
        }
      }

      // No active session exists
      if (role === 'leader') {
        // Create new session as leader
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
      } else {
        // No session exists and user wants to be follower
        return { session: null, isNewSession: false, isLeader: false };
      }
    } catch (error) {
      console.error('Error getting/creating session:', error);
      throw error;
    }
  }

  // Create a new performance session (leader)
  async createSession(setlistId, userId) {
    try {
      const result = await this.getOrCreateSession(setlistId, userId, 'leader');
      
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
      // Get the existing session
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
        console.warn('Failed to add participant:', participantError);
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

  // Get active session for a setlist with full user data
  async getActiveSession(setlistId) {
    const { data, error } = await supabase
      .from('performance_sessions')
      .select(`
        *,
        setlists (name),
        users (id, name, email, role),
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

  // Request leadership transfer with auto-timeout
  async requestLeadershipTransfer(sessionId, requestingUserId, requestingUserName) {
    try {
      // Check if current leader is active (has recent activity)
      const { data: session } = await supabase
        .from('performance_sessions')
        .select('leader_id, created_at')
        .eq('id', sessionId)
        .single();

      if (!session) {
        throw new Error('Session not found');
      }

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
      
      // Set up auto-approval after timeout
      setTimeout(async () => {
        try {
          const { data: request } = await supabase
            .from('leadership_requests')
            .select('status')
            .eq('id', data.id)
            .single();

          if (request && request.status === 'pending') {
            console.log('⏰ Auto-approving leadership request due to timeout');
            await this.respondToLeadershipRequest(data.id, 'approved', session.leader_id);
          }
        } catch (autoError) {
          console.warn('Error in auto-approval:', autoError);
        }
      }, 30000);

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
    this.updateLastActivity();
    
    const { data, error } = await supabase
      .from('performance_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select(`
        *,
        setlists (name),
        users (id, name, email, role),
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

      this.setActive(false);
      this.cleanupSubscriptions();
      console.log('🚪 Left performance session');
    } catch (error) {
      console.error('Error leaving session:', error);
      throw error;
    }
  }

  // Subscribe to session changes (for real-time updates)
  subscribeToSession(sessionId, callback) {
    if (!sessionId || sessionId === 'standalone') return null;
    
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

    this.activeSubscriptions.set(`session_${sessionId}`, subscription);
    console.log('🔔 Subscribed to performance session updates');
    return subscription;
  }

  // Subscribe to participant changes
  subscribeToParticipants(sessionId, callback) {
    if (!sessionId || sessionId === 'standalone') return null;
    
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
    if (!sessionId || sessionId === 'standalone') return null;
    
    const subscription = supabase
      .channel(`leadership_requests_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leadership_requests',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('👑 Leadership request event:', payload);
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

  // Show notification to all registered callbacks (with deduplication)
  showNotification(type, message, userId = null) {
    // Prevent duplicate notifications
    if (type === 'leadership' && this.lastNotifiedLeader === userId) {
      return;
    }
    if (type === 'participant_join' && userId && this.notifiedParticipants.has(userId)) {
      return;
    }

    // Track notifications to prevent duplicates
    if (type === 'leadership') {
      this.lastNotifiedLeader = userId;
    }
    if (type === 'participant_join' && userId) {
      this.notifiedParticipants.add(userId);
      // Clear after 5 seconds to allow re-notification if user leaves and rejoins
      setTimeout(() => this.notifiedParticipants.delete(userId), 5000);
    }

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
    const sessionSub = this.activeSubscriptions.get(`session_${sessionId}`);
    if (sessionSub) {
      supabase.removeChannel(sessionSub);
      this.activeSubscriptions.delete(`session_${sessionId}`);
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

    for (const [key, subscription] of this.activeSubscriptions) {
      try {
        supabase.removeChannel(subscription);
      } catch (error) {
        console.warn(`Failed to remove subscription ${key}:`, error);
      }
    }
    this.activeSubscriptions.clear();
    this.setActive(false);
    this.lastNotifiedLeader = null;
    this.notifiedParticipants.clear();
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