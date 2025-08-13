import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, SkipBack, SkipForward, X, Music, Search, ZoomIn, ZoomOut, Crown, Users, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setlistsService } from '../services/setlistsService';
import { songsService } from '../services/songsService';
import { performanceService } from '../services/performanceService';
import MobilePerformanceLayout from '../components/MobilePerformanceLayout';
import FollowersModal from '../components/FollowersModal';

const PerformanceMode = () => {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setlistId = searchParams.get('setlist');

  // Selection state
  const [setlists, setSetlists] = useState([]);
  const [selectedSetlistId, setSelectedSetlistId] = useState(setlistId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const [existingSession, setExistingSession] = useState(null);

  // Performance state
  const [inPerformance, setInPerformance] = useState(false);
  const [session, setSession] = useState(null);
  const [setlistData, setSetlistData] = useState(null);
  const [songsData, setSongsData] = useState({});
  const [currentSet, setCurrentSet] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentSongLyrics, setCurrentSongLyrics] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [standaloneMode, setStandaloneMode] = useState(false);
  const mountedRef = useRef(true);

  // Search functionality
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allSongs, setAllSongs] = useState([]);
  const [isSearchSong, setIsSearchSong] = useState(false);
  const [previousSetSong, setPreviousSetSong] = useState(null);

  // Followers
  const [showFollowers, setShowFollowers] = useState(false);
  const [followers, setFollowers] = useState([]);

  // Zoom controls
  const [lyricsZoom, setLyricsZoom] = useState(1);

  useEffect(() => {
    mountedRef.current = true;
    setPageTitle('Performance Mode');
    
    // Always start with fetching setlists first
    fetchSetlists().then(() => {
      if (setlistId && mountedRef.current) {
        console.log('🔍 URL has setlist parameter, checking for existing session:', setlistId);
        checkExistingSession(setlistId);
      }
    });
    
    return () => {
      mountedRef.current = false;
      if (inPerformance && session?.id && session.id !== 'standalone') {
        performanceService.cleanupSubscriptions();
      }
    };
  }, [setlistId]);

  const fetchSetlists = async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('📋 Fetching setlists...');
      const data = await setlistsService.getAllSetlists();
      if (mountedRef.current) {
        setSetlists(data);
        console.log(`✅ Loaded ${data.length} setlists`);
      }
    } catch (err) {
      console.error('Error fetching setlists:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const checkExistingSession = async (targetSetlistId) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log(`🔍 Checking for existing session for setlist ${targetSetlistId}`);
      
      // Clean up any truly stale sessions first
      await performanceService.cleanupStaleSessionsForSetlist(targetSetlistId);
      
      // Check for active session
      const activeSession = await performanceService.getActiveSession(targetSetlistId);
      
      if (activeSession) {
        console.log('📡 Found existing session:', activeSession);
        setExistingSession(activeSession);
        setShowRoleChoice(true);
      } else {
        console.log('🆕 No existing session, showing role choice');
        setExistingSession(null);
        setShowRoleChoice(true);
      }
    } catch (err) {
      console.error('Error checking existing session:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleStartPerformance = async (targetSetlistId) => {
    if (!targetSetlistId) {
      setError('Please select a setlist');
      return;
    }
    
    if (mountedRef.current) {
      setSelectedSetlistId(targetSetlistId);
      // Update URL and trigger session check
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('setlist', targetSetlistId);
      window.history.replaceState({}, '', newUrl);
      
      // Check for existing session
      await checkExistingSession(targetSetlistId);
    }
  };

  const handleRoleChoice = async (role) => {
    if (!mountedRef.current) return;
    
    console.log(`🎭 Starting performance mode as ${role} for setlist ${selectedSetlistId || setlistId}`);
    
    setShowRoleChoice(false);
    await startPerformanceMode(selectedSetlistId || setlistId, role, existingSession);
  };

  const startPerformanceMode = async (targetSetlistId, role, existingSessionData = null) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🎭 Starting performance mode as ${role} for setlist ${targetSetlistId}`);
      
      let sessionData = existingSessionData;
      let isLeaderRole = false;
      let isStandalone = false;
      
      if (role === 'standalone') {
        console.log('🎵 Starting standalone mode');
        await performanceService.prefetchAndCacheSetlistData(targetSetlistId);
        sessionData = { id: 'standalone', setlist_id: targetSetlistId };
        isStandalone = true;
        isLeaderRole = true; // Standalone acts like leader for controls
      } else if (role === 'leader') {
        if (existingSessionData && existingSessionData.leader_id === user.id) {
          console.log('👑 Rejoining as existing leader');
          sessionData = existingSessionData;
        } else if (existingSessionData && user.user_level >= 3) {
          console.log('👑 Admin forcing leadership takeover');
          sessionData = await performanceService.takeOverLeadership(existingSessionData.id, user.id);
        } else if (!existingSessionData) {
          console.log('👑 Creating new session as leader');
          sessionData = await performanceService.createSession(targetSetlistId, user.id);
        } else {
          throw new Error('Cannot take leadership - another user is currently leading');
        }
        isLeaderRole = true;
      } else if (role === 'follower' && existingSessionData) {
        console.log('👥 Joining existing session as follower');
        await performanceService.joinAsFollower(existingSessionData.id, user.id);
        sessionData = existingSessionData;
        isLeaderRole = false;
      } else {
        throw new Error('Invalid role or missing session data');
      }

      if (mountedRef.current && sessionData) {
        setSession(sessionData);
        setIsLeader(isLeaderRole);
        setStandaloneMode(isStandalone);
        
        // Store session info
        try {
          localStorage.setItem('performanceMode_sessionId', sessionData.id);
          localStorage.setItem('performanceMode_isLeader', isLeaderRole.toString());
        } catch (storageError) {
          console.warn('Failed to store session info:', storageError);
        }
        
        await loadPerformanceData(targetSetlistId, sessionData);

        if (!isStandalone && sessionData.id !== 'standalone') {
          // Subscribe to real-time updates
          performanceService.subscribeToSession(sessionData.id, handleSessionUpdate);
          performanceService.subscribeToParticipants(sessionData.id, handleParticipantUpdate);
          
          // Load initial followers
          await loadFollowers(sessionData.id);
        }

        await fetchAllSongs();
        setInPerformance(true);
        performanceService.setActive(true);
      }

    } catch (err) {
      console.error('Error starting performance mode:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadPerformanceData = async (targetSetlistId, sessionData) => {
    if (!mountedRef.current) return;
    
    try {
      console.log('📚 Loading performance data for setlist:', targetSetlistId);
      const { setlistData: cachedSetlist, songsData: cachedSongs } = performanceService.getCachedSetlistData();
      
      if (cachedSetlist && Object.keys(cachedSongs).length > 0) {
        if (mountedRef.current) {
          setSetlistData(cachedSetlist);
          setSongsData(cachedSongs);
          console.log('📱 Using cached performance data');
        }
      } else {
        console.log('📥 Fetching fresh performance data');
        await performanceService.prefetchAndCacheSetlistData(targetSetlistId);
        const { setlistData: newSetlist, songsData: newSongs } = performanceService.getCachedSetlistData();
        if (mountedRef.current) {
          setSetlistData(newSetlist);
          setSongsData(newSongs);
        }
      }

      // Set current set and song based on session data
      const { setlistData: currentSetlistData } = performanceService.getCachedSetlistData();
      
      if (sessionData && sessionData.id !== 'standalone') {
        if (sessionData.current_set_id) {
          const currentSetData = currentSetlistData?.sets?.find(s => s.id === sessionData.current_set_id);
          if (mountedRef.current && currentSetData) {
            setCurrentSet(currentSetData);
          }
        }

        if (sessionData.current_song_id) {
          await loadCurrentSong(sessionData.current_song_id);
        }
      }
      
      // Default to first set and first song if none set
      if (mountedRef.current && !currentSet && currentSetlistData?.sets?.[0]) {
        setCurrentSet(currentSetlistData.sets[0]);
        
        if (currentSetlistData.sets[0].set_songs?.[0]) {
          await loadCurrentSong(currentSetlistData.sets[0].set_songs[0].songs.id);
        }
      }

    } catch (err) {
      console.error('Error loading performance data:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    }
  };

  const loadCurrentSong = async (songId) => {
    if (!mountedRef.current || !songId) return;
    
    try {
      const cachedSongs = performanceService.getCachedSetlistData().songsData;
      
      if (cachedSongs[songId]) {
        if (mountedRef.current) {
          setCurrentSong(cachedSongs[songId]);
          setCurrentSongLyrics(cachedSongs[songId].lyrics);
          setIsSearchSong(false);
        }
      } else {
        console.log(`🎵 Loading song ${songId} from database`);
        const songData = await songsService.getSongById(songId);
        if (mountedRef.current) {
          setCurrentSong(songData);
          setCurrentSongLyrics(songData.lyrics);
          setIsSearchSong(false);
        }
      }
    } catch (err) {
      console.error('Error loading current song:', err);
    }
  };

  const fetchAllSongs = async () => {
    try {
      const songs = await songsService.getAllSongs();
      if (mountedRef.current) {
        setAllSongs(songs);
      }
    } catch (err) {
      console.error('Error fetching all songs:', err);
    }
  };

  const loadFollowers = async (sessionId) => {
    if (!sessionId || sessionId === 'standalone') return;
    
    try {
      const followersData = await performanceService.getSessionFollowers(sessionId);
      if (mountedRef.current) {
        setFollowers(followersData);
      }
    } catch (err) {
      console.error('Error loading followers:', err);
    }
  };

  // Real-time event handlers
  const handleSessionUpdate = (payload) => {
    if (!mountedRef.current || !payload?.new || standaloneMode) return;
    
    const newSession = payload.new;
    console.log('📡 Session update received:', newSession);
    
    setTimeout(async () => {
      if (!mountedRef.current) return;
      
      setSession(prev => ({ ...prev, ...newSession }));
      
      // Handle leadership changes
      const wasLeader = session?.leader_id === user.id;
      const isNowLeader = newSession.leader_id === user.id;
      
      if (!wasLeader && isNowLeader) {
        console.log('👑 Gained leadership');
        setIsLeader(true);
        localStorage.setItem('performanceMode_isLeader', 'true');
      } else if (wasLeader && !isNowLeader) {
        console.log('👥 Lost leadership');
        setIsLeader(false);
        localStorage.setItem('performanceMode_isLeader', 'false');
      }
      
      // Update current song/set if changed
      if (newSession.current_song_id && newSession.current_song_id !== currentSong?.id) {
        await loadCurrentSong(newSession.current_song_id);
      }
      
      if (newSession.current_set_id && newSession.current_set_id !== currentSet?.id) {
        await loadCurrentSet(newSession.current_set_id);
      }
    }, 0);
  };

  const handleParticipantUpdate = async (payload) => {
    if (!mountedRef.current || !session || session.id === 'standalone') return;
    
    console.log('👥 Participant update:', payload);
    // Reload followers list
    await loadFollowers(session.id);
  };

  const loadCurrentSet = async (setId) => {
    if (!mountedRef.current) return;
    
    try {
      const cachedSetlist = performanceService.getCachedSetlistData().setlistData;
      const setData = cachedSetlist?.sets?.find(s => s.id === setId);
      
      if (mountedRef.current && setData) {
        setCurrentSet(setData);
      }
    } catch (err) {
      console.error('Error loading current set:', err);
    }
  };

  const loadSearchSong = async (song) => {
    if (!mountedRef.current) return;
    
    try {
      if (mountedRef.current) {
        setPreviousSetSong(currentSong);
      }
      
      let songData = songsData[song.id] || song;
      if (!songData.lyrics) {
        songData = await songsService.getSongById(song.id);
      }
      
      if ((isLeader || standaloneMode) && session && session.id !== 'standalone') {
        await performanceService.updateSession(session.id, {
          current_song_id: songData.id
        });
      }
      
      if (mountedRef.current) {
        setCurrentSong(songData);
        setCurrentSongLyrics(songData.lyrics);
        setIsSearchSong(true);
        setShowSearch(false);
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Error loading search song:', err);
      if (mountedRef.current) {
        setError('Failed to load selected song');
      }
    }
  };

  const handleSetChange = async (set) => {
    if ((!isLeader && !standaloneMode) || !session) return;

    try {
      const firstSong = set.set_songs?.[0]?.songs;

      if (session.id !== 'standalone') {
        await performanceService.updateSession(session.id, {
          current_set_id: set.id,
          current_song_id: firstSong?.id || null
        });
      }
      
      if (mountedRef.current) {
        setCurrentSet(set);
        setIsSearchSong(false);
        if (firstSong) {
          await loadCurrentSong(firstSong.id);
        }
      }
    } catch (err) {
      console.error('Error changing set:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    }
  };

  const handleSongSelect = async (song) => {
    if ((!isLeader && !standaloneMode) || !session) return;

    try {
      if (session.id !== 'standalone') {
        await performanceService.updateSession(session.id, {
          current_song_id: song.id
        });
      }
      
      if (mountedRef.current) {
        await loadCurrentSong(song.id);
        setIsSearchSong(false);
      }
    } catch (err) {
      console.error('Error selecting song:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    }
  };

  const getCurrentSongIndex = () => {
    if (!currentSet || !currentSong || isSearchSong) return -1;
    const songs = currentSet.set_songs
      ?.map(ss => ss.songs)
      .sort((a, b) => {
        const aOrder = currentSet.set_songs.find(ss => ss.songs.id === a.id)?.song_order || 0;
        const bOrder = currentSet.set_songs.find(ss => ss.songs.id === b.id)?.song_order || 0;
        return aOrder - bOrder;
      }) || [];
    return songs.findIndex(song => song.id === currentSong.id);
  };

  const handlePreviousSong = async () => {
    if ((!isLeader && !standaloneMode) || !session) return;

    if (isSearchSong && previousSetSong) {
      if (session.id !== 'standalone') {
        await performanceService.updateSession(session.id, {
          current_song_id: previousSetSong.id
        });
      }
      await loadCurrentSong(previousSetSong.id);
      setPreviousSetSong(null);
      return;
    }

    if (!currentSet) return;

    const songs = currentSet.set_songs
      ?.map(ss => ss.songs)
      .sort((a, b) => {
        const aOrder = currentSet.set_songs.find(ss => ss.songs.id === a.id)?.song_order || 0;
        const bOrder = currentSet.set_songs.find(ss => ss.songs.id === b.id)?.song_order || 0;
        return aOrder - bOrder;
      }) || [];

    const currentIndex = getCurrentSongIndex();
    if (currentIndex > 0) {
      const previousSong = songs[currentIndex - 1];
      if (session.id !== 'standalone') {
        await performanceService.updateSession(session.id, {
          current_song_id: previousSong.id
        });
      }
      await loadCurrentSong(previousSong.id);
    }
  };

  const handleNextSong = async () => {
    if ((!isLeader && !standaloneMode) || !session) return;

    if (isSearchSong && previousSetSong) {
      if (session.id !== 'standalone') {
        await performanceService.updateSession(session.id, {
          current_song_id: previousSetSong.id
        });
      }
      await loadCurrentSong(previousSetSong.id);
      setPreviousSetSong(null);
      return;
    }

    if (!currentSet) return;

    const songs = currentSet.set_songs
      ?.map(ss => ss.songs)
      .sort((a, b) => {
        const aOrder = currentSet.set_songs.find(ss => ss.songs.id === a.id)?.song_order || 0;
        const bOrder = currentSet.set_songs.find(ss => ss.songs.id === b.id)?.song_order || 0;
        return aOrder - bOrder;
      }) || [];

    const currentIndex = getCurrentSongIndex();
    if (currentIndex < songs.length - 1) {
      const nextSong = songs[currentIndex + 1];
      if (session.id !== 'standalone') {
        await performanceService.updateSession(session.id, {
          current_song_id: nextSong.id
        });
      }
      await loadCurrentSong(nextSong.id);
    }
  };

  const handleExitPerformance = async () => {
    try {
      if (isLeader && session && session.id !== 'standalone') {
        await performanceService.endSession(session.id);
      } else if (session && session.id !== 'standalone') {
        await performanceService.leaveSession(session.id, user.id);
      }
      
      performanceService.cleanupSubscriptions();
      navigate('/setlists');
    } catch (err) {
      console.error('Error exiting performance:', err);
      navigate('/setlists');
    }
  };

  const handleShowFollowers = async () => {
    if (session && session.id !== 'standalone') {
      await loadFollowers(session.id);
    }
    setShowFollowers(true);
  };

  const handleZoomIn = () => {
    setLyricsZoom(prev => Math.min(2, prev + 0.1));
  };

  const handleZoomOut = () => {
    setLyricsZoom(prev => Math.max(0.8, prev - 0.1));
  };

  const handleResetZoom = () => {
    setLyricsZoom(1);
  };

  const filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.original_artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show role choice modal
  if (showRoleChoice && !loading && (selectedSetlistId || setlistId)) {
    const targetSetlist = selectedSetlistId || setlistId;
    const hasActiveLeader = existingSession && existingSession.leader_id;
    const canForceLeadership = user.user_level >= 3;
    const leaderName = existingSession?.users?.name || 'Unknown';
    const isCurrentLeader = existingSession?.leader_id === user.id;

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="card-modern p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Performance Mode</h2>
            <p className="text-zinc-300 mt-2">
              How would you like to enter performance mode?
            </p>
            {existingSession && (
              <div className="mt-4 p-3 bg-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-400">
                  Current leader: <span className="text-zinc-300 font-medium">{leaderName}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Session started: {new Date(existingSession.created_at).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Show appropriate options based on session state */}
            {isCurrentLeader ? (
              /* Current leader - just rejoin */
              <button
                onClick={() => handleRoleChoice('leader')}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Crown size={20} className="mr-2" />
                Rejoin as Leader
              </button>
            ) : hasActiveLeader ? (
              /* Active session with different leader */
              <div className="space-y-3">
                <button
                  onClick={() => handleRoleChoice('follower')}
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  <Users size={20} className="mr-2" />
                  Join as Follower
                </button>
                
                {canForceLeadership && (
                  <button
                    onClick={() => handleRoleChoice('leader')}
                    className="w-full inline-flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                  >
                    <Crown size={20} className="mr-2" />
                    Take Over as Leader (Admin)
                  </button>
                )}
              </div>
            ) : (
              /* No active session */
              <div className="space-y-3">
                <button
                  onClick={() => handleRoleChoice('leader')}
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  <Crown size={20} className="mr-2" />
                  Start as Leader
                </button>
              </div>
            )}
            
            {/* Standalone mode always available */}
            <div className="pt-4 border-t border-zinc-700">
              <button
                onClick={() => handleRoleChoice('standalone')}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-zinc-600 text-white rounded-xl hover:bg-zinc-500 transition-colors font-medium"
              >
                <Music size={20} className="mr-2" />
                Standalone Mode
              </button>
              <p className="text-xs text-zinc-500 text-center mt-2">
                Practice mode without sharing with others
              </p>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowRoleChoice(false);
                  setSelectedSetlistId('');
                  setExistingSession(null);
                  const newUrl = new URL(window.location);
                  newUrl.searchParams.delete('setlist');
                  window.history.replaceState({}, '', newUrl);
                }}
                className="text-zinc-400 hover:text-zinc-300 transition-colors text-sm"
              >
                ← Choose Different Setlist
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-300">
            {setlistId ? 'Checking session status...' : 'Loading setlists...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 flex items-center justify-center">
        <div className="card-modern p-6 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Error</h2>
          <p className="text-zinc-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                setShowRoleChoice(false);
                if (setlistId) {
                  checkExistingSession(setlistId);
                } else {
                  fetchSetlists();
                }
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/setlists')}
              className="w-full text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              ← Back to Setlists
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setlist selection screen
  if (!inPerformance && !showRoleChoice) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => navigate('/setlists')}
                className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-all btn-animate"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Play className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-zinc-100">Performance Mode</h1>
                  <p className="text-zinc-400">Choose a setlist to perform</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-modern p-6">
            <div className="mb-6">
              <label htmlFor="setlist-select" className="block text-sm font-medium text-zinc-300 mb-3">
                Select Setlist
              </label>
              <select
                id="setlist-select"
                value={selectedSetlistId}
                onChange={(e) => setSelectedSetlistId(e.target.value)}
                className="input-modern"
              >
                <option value="">Choose a setlist...</option>
                {setlists.map((setlist) => (
                  <option key={setlist.id} value={setlist.id}>
                    {setlist.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleStartPerformance(selectedSetlistId)}
                disabled={!selectedSetlistId || loading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate shadow-lg font-medium"
              >
                <Play size={20} className="mr-2" />
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentSetSongs = currentSet?.set_songs
    ?.map(ss => ss.songs)
    .sort((a, b) => {
      const aOrder = currentSet.set_songs.find(ss => ss.songs.id === a.id)?.song_order || 0;
      const bOrder = currentSet.set_songs.find(ss => ss.songs.id === b.id)?.song_order || 0;
      return aOrder - bOrder;
    }) || [];

  const currentIndex = getCurrentSongIndex();
  const canGoPrevious = (currentIndex > 0 && !isSearchSong) || (isSearchSong && previousSetSong);
  const canGoNext = (currentIndex < currentSetSongs.length - 1 && !isSearchSong) || (isSearchSong && previousSetSong);

  // Sidebar content
  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Sets Navigation */}
      {(isLeader || standaloneMode) && setlistData?.sets && setlistData.sets.length > 1 && (
        <div className="p-4 border-b border-zinc-800">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Current Set</label>
          <select
            value={currentSet?.id || ''}
            onChange={(e) => {
              const set = setlistData.sets.find(s => s.id === e.target.value);
              if (set) handleSetChange(set);
            }}
            className="input-modern text-sm"
          >
            {setlistData.sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Songs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {currentSetSongs.map((song, index) => (
          <button
            key={song.id}
            onClick={() => (isLeader || standaloneMode) && !isSearchSong && handleSongSelect(song)}
            disabled={(!isLeader && !standaloneMode) || isSearchSong}
            className={`w-full text-left p-3 rounded-xl transition-all ${
              currentSong?.id === song.id && !isSearchSong
                ? 'bg-blue-600 text-white shadow-lg'
                : (isLeader || standaloneMode) && !isSearchSong
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
                  : 'bg-zinc-800 text-zinc-300 cursor-default'
            } ${isSearchSong ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentSong?.id === song.id && !isSearchSong
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-700 text-zinc-400'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs opacity-75 truncate">
                  {song.original_artist} {song.key_signature && `• ${song.key_signature}`}
                </p>
                {song.performance_note && (
                  <div className="flex items-center space-x-1 mt-1">
                    <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                    <span className="text-amber-300 text-xs">{song.performance_note}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Navigation Controls */}
      {(isLeader || standaloneMode) && (
        <div className="p-4 border-t border-zinc-800 space-y-3 safe-area-inset-bottom">
          <div className="flex space-x-2">
            <button
              onClick={handlePreviousSong}
              disabled={!canGoPrevious}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <SkipBack size={18} className="mr-2" />
              Previous
            </button>
            <button
              onClick={handleNextSong}
              disabled={!canGoNext}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
              <SkipForward size={18} className="ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Search content
  const searchContent = (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSearch(false)}
            className="p-2 text-zinc-400 hover:text-zinc-200"
          >
            <X size={20} />
          </button>
          <input
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredSongs.slice(0, 50).map((song) => (
            <button
              key={song.id}
              onClick={() => (isLeader || standaloneMode) && loadSearchSong(song)}
              disabled={!isLeader && !standaloneMode}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                (isLeader || standaloneMode)
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
                  : 'bg-zinc-800 text-zinc-300 cursor-default opacity-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs opacity-75 truncate">
                  {song.original_artist} {song.key_signature && `• ${song.key_signature}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Lyrics content
  const lyricsContent = (
    <div className="h-full flex flex-col">
      {currentSong ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div 
              className="prose prose-invert prose-lg max-w-none text-zinc-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentSongLyrics }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Music className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-xl text-zinc-400">No song selected</p>
          </div>
        </div>
      )}
    </div>
  );

  // Performance mode UI
  if (inPerformance) {
    return (
      <>
        <MobilePerformanceLayout
          sidebar={sidebarContent}
          currentSong={currentSong}
          currentSongLyrics={currentSongLyrics}
          isLeader={isLeader || standaloneMode}
          onExit={handleExitPerformance}
          onShowFollowers={handleShowFollowers}
          onShowSearch={() => setShowSearch(true)}
          showSearch={showSearch}
          searchContent={searchContent}
          setlistName={setlistData?.name}
          currentSetName={currentSet?.name}
          isSearchSong={isSearchSong}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          lyricsZoom={lyricsZoom}
        >
          {lyricsContent}
        </MobilePerformanceLayout>

        {/* Followers Modal */}
        <FollowersModal
          isOpen={showFollowers}
          onClose={() => setShowFollowers(false)}
          followers={followers}
          sessionData={session}
        />
      </>
    );
  }

  return null;
};

export default PerformanceMode;