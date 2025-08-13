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
// Session stale timeout (10 minutes of inactivity)
const SESSION_STALE_TIMEOUT = 10 * 60 * 1000;

class PerformanceService {
  constructor() {
    this.activeSubscriptions = new Map();
    this.isInPerformanceMode = false;
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

  // Clean up all stale sessions for a setlist
  async cleanupStaleSessionsForSetlist(setlistId) {
    try {
      console.log(`🧹 Cleaning up stale sessions for setlist ${setlistId}`);
      
      // Get all sessions for this setlist
      const { data: sessions, error } = await supabase
        .from('performance_sessions')
        .select('*, users(id, name)')
        .eq('setlist_id', setlistId)
        .eq('is_active', true);

      if (error) {
        console.warn('Error fetching sessions for cleanup:', error);
        return;
      }

      if (!sessions || sessions.length === 0) {
        console.log('No sessions to clean up');
        return;
      }

      for (const session of sessions) {
        // Check if session is stale (created more than 10 minutes ago)
        const sessionAge = Date.now() - new Date(session.created_at).getTime();
        const isStale = sessionAge > SESSION_STALE_TIMEOUT;

        // Check if there are any active participants
        const { data: participants } = await supabase
          .from('session_participants')
          .select('user_id')
          .eq('session_id', session.id)
          .eq('is_active', true);

        const hasActiveParticipants = participants && participants.length > 0;

        if (isStale || !hasActiveParticipants) {
          console.log(`🧹 Marking stale session ${session.id} as inactive`);
          
          // Mark session as inactive
          await supabase
            .from('performance_sessions')
            .update({ is_active: false })
            .eq('id', session.id);

          // Mark all participants as inactive
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

  // Check if leader is still active (has recent activity)
  async isLeaderActive(leaderId, sessionId) {
    try {
      // Check if leader is still in session_participants (if they joined as follower first)
      const { data: leaderParticipant } = await supabase
        .from('session_participants')
        .select('joined_at, is_active')
        .eq('session_id', sessionId)
        .eq('user_id', leaderId)
        .eq('is_active', true)
        .single();

      // If leader is in participants, check their activity
      if (leaderParticipant) {
        const lastActivity = new Date(leaderParticipant.joined_at).getTime();
        const timeSinceActivity = Date.now() - lastActivity;
        return timeSinceActivity < SESSION_STALE_TIMEOUT;
      }

      // If leader is not in participants, assume they're active if session is recent
      return true;
    } catch (error) {
      console.warn('Error checking leader activity:', error);
      return true; // Default to assuming leader is active
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

  // Get active session for a setlist with full user data
  async getActiveSession(setlistId) {
    try {
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
    } catch (error) {
      console.error('Error getting active session:', error);
      throw error;
    }
  }

  // Create or join session with improved logic
  async getOrCreateSession(setlistId, userId, userLevel, role = 'follower') {
    try {
      // Step 1: Clean up any truly stale sessions
      await this.cleanupStaleSessionsForSetlist(setlistId);
      
      // Step 2: Check for existing active session
      let activeSession = await this.getActiveSession(setlistId);

      if (activeSession) {
        // Check if leader is still active
        const leaderStillActive = await this.isLeaderActive(activeSession.leader_id, activeSession.id);
        
        if (activeSession.leader_id === userId) {
          // User is rejoining as the same leader
          console.log(`👑 User ${userId} rejoining as existing leader`);
          
          // Update last activity
          await supabase
            .from('performance_sessions')
            .update({ created_at: new Date() })
            .eq('id', activeSession.id);
            
          return { session: activeSession, isLeader: true, needsChoice: false };
        } else if (!leaderStillActive || (role === 'leader' && userLevel >= 3)) {
          // Leader is inactive OR user has admin privileges and wants to take over
          console.log(`👑 Taking over leadership for inactive/admin takeover`);
          
          // Transfer leadership
          const { data: updatedSession, error } = await supabase
            .from('performance_sessions')
            .update({ 
              leader_id: userId,
              created_at: new Date() // Reset activity timestamp
            })
            .eq('id', activeSession.id)
            .select(`
              *,
              setlists (name),
              users (id, name, email, role),
              sets (name),
              songs (title, original_artist)
            `)
            .single();

          if (error) throw error;

          // Add old leader as participant if they were active
          if (leaderStillActive) {
            await supabase
              .from('session_participants')
              .upsert({
                session_id: activeSession.id,
                user_id: activeSession.leader_id,
                is_active: true
              }, {
                onConflict: 'session_id,user_id'
              });
          }

          return { session: updatedSession, isLeader: true, needsChoice: false };
        } else if (role === 'leader') {
          // Active leader exists and user wants leadership but doesn't have privilege
          return { session: activeSession, isLeader: false, needsChoice: true };
        } else {
          // User joining as follower
          console.log(`👥 User ${userId} joining existing session as follower`);
          
          // Add user as participant
          await supabase
            .from('session_participants')
            .upsert({
              session_id: activeSession.id,
              user_id: userId,
              is_active: true
            }, {
              onConflict: 'session_id,user_id'
            });

          return { session: activeSession, isLeader: false, needsChoice: false };
        }
      } else {
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
              users (id, name, email, role),
              sets (name),
              songs (title, original_artist)
            `)
            .single();

          if (error) throw new Error(error.message);
          
          console.log('🎭 New performance session created');
          return { session: newSession, isLeader: true, needsChoice: false };
        } else {
          // No session exists and user wants to be follower - need to choose
          return { session: null, isLeader: false, needsChoice: true };
        }
      }
    } catch (error) {
      console.error('Error in getOrCreateSession:', error);
      throw error;
    }
  }

  // Create new session as leader
  async createSession(setlistId, userId) {
    try {
      console.log(`🎭 Creating new session for setlist ${setlistId} with leader ${userId}`);
      
      // Clean up any stale sessions first
      await this.cleanupStaleSessionsForSetlist(setlistId);
      
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
          users (id, name, email, role),
          sets (name),
          songs (title, original_artist)
        `)
        .single();

      if (error) throw new Error(error.message);
      
      console.log('🎭 New performance session created');
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Take over leadership of existing session (admin override)
  async takeOverLeadership(sessionId, newLeaderId) {
    try {
      console.log(`👑 Taking over leadership of session ${sessionId} for user ${newLeaderId}`);
      
      // Get current session info
      const { data: currentSession, error: sessionError } = await supabase
        .from('performance_sessions')
        .select('leader_id')
        .eq('id', sessionId)
        .single();
        
      if (sessionError) throw sessionError;
      
      // Transfer leadership
      const { data: updatedSession, error } = await supabase
        .from('performance_sessions')
        .update({ 
          leader_id: newLeaderId,
          created_at: new Date() // Reset activity timestamp
        })
        .eq('id', sessionId)
        .select(`
          *,
          setlists (name),
          users (id, name, email, role),
          sets (name),
          songs (title, original_artist)
        `)
        .single();

      if (error) throw error;

      // Add old leader as participant
      if (currentSession.leader_id !== newLeaderId) {
        await supabase
          .from('session_participants')
          .upsert({
            session_id: sessionId,
            user_id: currentSession.leader_id,
            is_active: true
          }, {
            onConflict: 'session_id,user_id'
          });
      }

      console.log('👑 Leadership transferred successfully');
      return updatedSession;
    } catch (error) {
      console.error('Error taking over leadership:', error);
      throw error;
    }
  }

  // Join existing session as follower
  async joinAsFollower(sessionId, userId) {
    try {
      console.log(`👥 User ${userId} joining session ${sessionId} as follower`);
      
      // Add user as participant
      await supabase
        .from('session_participants')
        .upsert({
          session_id: sessionId,
          user_id: userId,
          is_active: true
        }, {
          onConflict: 'session_id,user_id'
        });
        
      this.updateLastActivity();
      return true;
    } catch (error) {
      console.error('Error joining as follower:', error);
      throw error;
    }
  }

  // Request leadership from current leader
  async requestLeadership(sessionId, userId, userName) {
    try {
      console.log(`🙋 User ${userId} requesting leadership for session ${sessionId}`);
      
      // Check if there's already a pending request from this user
      const { data: existingRequest } = await supabase
        .from('leadership_requests')
        .select('id')
        .eq('session_id', sessionId)
        .eq('requesting_user_id', userId)
        .eq('status', 'pending')
        .single();
        
      if (existingRequest) {
        throw new Error('You already have a pending leadership request');
      }
      
      // Create new leadership request
      const { data, error } = await supabase
        .from('leadership_requests')
        .insert({
          session_id: sessionId,
          requesting_user_id: userId,
          requesting_user_name: userName,
          status: 'pending',
          expires_at: new Date(Date.now() + 30000) // 30 seconds from now
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error requesting leadership:', error);
      throw error;
    }
  }

  // Approve leadership request and transfer leadership
  async approveLeadershipRequest(requestId, newLeaderId) {
    try {
      console.log(`✅ Approving leadership request ${requestId} for user ${newLeaderId}`);
      
      // Get the request details first
      const { data: request, error: requestError } = await supabase
        .from('leadership_requests')
        .select('session_id, requesting_user_id')
        .eq('id', requestId)
        .single();
        
      if (requestError) throw requestError;
      
      // Update request status
      await supabase
        .from('leadership_requests')
        .update({ 
          status: 'approved',
          responded_at: new Date()
        })
        .eq('id', requestId);
      
      // Transfer leadership
      const { data: updatedSession, error: sessionError } = await supabase
        .from('performance_sessions')
        .update({ leader_id: newLeaderId })
        .eq('id', request.session_id)
        .select(`
          *,
          setlists (name),
          users (id, name, email, role),
          sets (name),
          songs (title, original_artist)
        `)
        .single();
        
      if (sessionError) throw sessionError;
      
      console.log('👑 Leadership transferred successfully');
      return updatedSession;
    } catch (error) {
      console.error('Error approving leadership request:', error);
      throw error;
    }
  }

  // Reject leadership request
  async rejectLeadershipRequest(requestId) {
    try {
      console.log(`❌ Rejecting leadership request ${requestId}`);
      
      const { error } = await supabase
        .from('leadership_requests')
        .update({ 
          status: 'rejected',
          responded_at: new Date()
        })
        .eq('id', requestId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting leadership request:', error);
      throw error;
    }
  }

  // Subscribe to leadership requests (for leaders)
  subscribeToLeadershipRequests(sessionId, callback) {
    if (!sessionId || sessionId === 'standalone') return null;
    
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
          console.log('🙋 Leadership request received:', payload.new);
          setTimeout(() => callback(payload), 0);
        }
      )
      .subscribe();

    this.activeSubscriptions.set(`leadership_requests_${sessionId}`, subscription);
    console.log('🔔 Subscribed to leadership request updates');
    return subscription;
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