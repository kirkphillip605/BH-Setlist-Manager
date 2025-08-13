import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, SkipBack, SkipForward, X, Music, Search, ZoomIn, ZoomOut, Crown, Users, UserPlus } from 'lucide-react';
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
  const [needsChoice, setNeedsChoice] = useState(false);
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
    
    if (setlistId) {
      // If we have a setlist ID, check session status
      checkSessionStatus(setlistId);
    } else {
      // No setlist selected, show setlist selection
      fetchSetlists();
    }
    
    return () => {
      mountedRef.current = false;
      if (inPerformance && session?.id && session.id !== 'standalone') {
        performanceService.cleanupSubscriptions();
      }
    };
  }, [setlistId]);

  const checkSessionStatus = async (setlistId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check session and determine what user should do
      const result = await performanceService.createOrJoinSession(setlistId, user.id, user.user_level, 'check');
      
      if (result.needsChoice) {
        // Show choice modal
        setExistingSession(result.session);
        setNeedsChoice(true);
      } else {
        // Can proceed directly
        await initializePerformanceMode(setlistId, result.isLeader ? 'leader' : 'follower', result.session);
      }
    } catch (err) {
      console.error('Error checking session status:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchSetlists = async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await setlistsService.getAllSetlists();
      if (mountedRef.current) {
        setSetlists(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const initializePerformanceMode = async (setlistId, role, existingSessionData = null) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let sessionResult;
      let isLeaderRole = false;
      let isStandalone = false;
      
      if (role === 'standalone') {
        // Standalone mode - no session interaction
        await performanceService.prefetchAndCacheSetlistData(setlistId);
        isStandalone = true;
        sessionResult = { session: { id: 'standalone', setlist_id: setlistId } };
      } else if (existingSessionData) {
        // Use existing session data
        sessionResult = { session: existingSessionData };
        isLeaderRole = role === 'leader';
        
        if (role === 'follower') {
          // Add as participant
          await supabase
            .from('session_participants')
            .upsert({
              session_id: existingSessionData.id,
              user_id: user.id,
              is_active: true
            }, {
              onConflict: 'session_id,user_id'
            });
        }
      } else {
        // Get session through service
        const result = await performanceService.createOrJoinSession(setlistId, user.id, user.user_level, role);
        sessionResult = result;
        isLeaderRole = result.isLeader;
      }

      if (mountedRef.current && sessionResult) {
        setSession(sessionResult.session);
        setIsLeader(isLeaderRole);
        setStandaloneMode(isStandalone);
        
        // Store session info
        try {
          localStorage.setItem('performanceMode_sessionId', sessionResult.session.id);
          localStorage.setItem('performanceMode_isLeader', isLeaderRole.toString());
        } catch (storageError) {
          console.warn('Failed to store session info:', storageError);
        }
        
        await loadPerformanceData(setlistId, sessionResult.session);

        if (!isStandalone && sessionResult.session.id !== 'standalone') {
          // Subscribe to session updates
          performanceService.subscribeToSession(
            sessionResult.session.id,
            handleSessionUpdate
          );

          // Subscribe to participant changes
          performanceService.subscribeToParticipants(
            sessionResult.session.id,
            handleParticipantChange
          );

          // Load followers
          await loadFollowers(sessionResult.session.id);
        }

        await fetchAllSongs();
        setInPerformance(true);
        setNeedsChoice(false);
      }

    } catch (err) {
      console.error('Error in initializePerformanceMode:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadPerformanceData = async (setlistId, sessionData) => {
    if (!mountedRef.current) return;
    
    try {
      const { setlistData: cachedSetlist, songsData: cachedSongs } = performanceService.getCachedSetlistData();
      
      if (cachedSetlist && Object.keys(cachedSongs).length > 0) {
        if (mountedRef.current) {
          setSetlistData(cachedSetlist);
          setSongsData(cachedSongs);
          console.log('📱 Using cached performance data');
        }
      } else {
        console.warn('No cached data available, fetching...');
        await performanceService.prefetchAndCacheSetlistData(setlistId);
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
          if (mountedRef.current) {
            setCurrentSet(currentSetData);
          }
        }

        if (sessionData.current_song_id) {
          await loadCurrentSong(sessionData.current_song_id);
        }
      } else {
        // Default to first set and first song for new sessions or standalone
        if (currentSetlistData?.sets?.[0]) {
          if (mountedRef.current) {
            setCurrentSet(currentSetlistData.sets[0]);
          }
          
          if (currentSetlistData.sets[0].set_songs?.[0]) {
            await loadCurrentSong(currentSetlistData.sets[0].set_songs[0].songs.id);
          }
        }
      }

    } catch (err) {
      console.error('Error loading performance data:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
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

  const loadCurrentSong = async (songId) => {
    if (!mountedRef.current) return;
    
    try {
      const cachedSongs = performanceService.getCachedSetlistData().songsData;
      
      if (cachedSongs[songId]) {
        if (mountedRef.current) {
          setCurrentSong(cachedSongs[songId]);
          setCurrentSongLyrics(cachedSongs[songId].lyrics);
          setIsSearchSong(false);
        }
      } else {
        console.warn(`Song ${songId} not found in cache, fetching...`);
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

  const handleSessionUpdate = (payload) => {
    if (!mountedRef.current || !payload?.new || standaloneMode) return;
    
    const newSession = payload.new;
    
    setTimeout(async () => {
      if (!mountedRef.current) return;
      
      setSession(prev => ({ ...prev, ...newSession }));
      
      // Check if leadership changed
      if (newSession.leader_id !== session?.leader_id) {
        const wasLeader = session?.leader_id === user.id;
        const isNowLeader = newSession.leader_id === user.id;
        
        if (!wasLeader && isNowLeader) {
          // We gained leadership
          setIsLeader(true);
          localStorage.setItem('performanceMode_isLeader', 'true');
        } else if (wasLeader && !isNowLeader) {
          // We lost leadership
          setIsLeader(false);
          localStorage.setItem('performanceMode_isLeader', 'false');
        }
      }
      
      // Update current song/set if changed
      if (newSession.current_song_id !== currentSong?.id) {
        await loadCurrentSong(newSession.current_song_id);
      }
      
      if (newSession.current_set_id !== currentSet?.id) {
        await loadCurrentSet(newSession.current_set_id);
      }
    }, 0);
  };

  const handleParticipantChange = async (payload) => {
    if (!mountedRef.current || !session || session.id === 'standalone') return;
    
    // Reload followers list
    await loadFollowers(session.id);
  };

  const loadCurrentSet = async (setId) => {
    if (!mountedRef.current) return;
    
    try {
      const cachedSetlist = performanceService.getCachedSetlistData().setlistData;
      const setData = cachedSetlist?.sets?.find(s => s.id === setId);
      
      if (mountedRef.current) {
        setCurrentSet(setData);
      }
    } catch (err) {
      console.error('Error loading current set:', err);
    }
  };

  const handleStartPerformance = async (selectedSetlistId) => {
    if (!selectedSetlistId) {
      setError('Please select a setlist');
      return;
    }
    
    navigate(`/performance?setlist=${selectedSetlistId}`);
  };

  const handleRoleChoice = async (choice) => {
    if (choice === 'force_leader' && user.user_level >= 3) {
      // Force take over leadership
      await initializePerformanceMode(setlistId, 'leader');
    } else {
      await initializePerformanceMode(setlistId, choice);
    }
  };

  const handleSetChange = async (set) => {
    if ((!isLeader && !standaloneMode) || !session) return;

    try {
      const setData = set;
      const firstSong = setData.set_songs?.[0]?.songs;

      if (session.id !== 'standalone') {
        await performanceService.updateSession(session.id, {
          current_set_id: set.id,
          current_song_id: firstSong?.id || null
        });
      }
      
      if (mountedRef.current) {
        setCurrentSet(setData);
        setIsSearchSong(false);
        if (firstSong) {
          await loadCurrentSong(firstSong.id);
        }
      }
    } catch (err) {
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
        performanceService.cleanupSubscriptions();
      } else {
        performanceService.cleanupSubscriptions();
      }
      
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

  // Role choice modal
  if (setlistId && needsChoice && !loading && existingSession) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="card-modern p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Join Performance</h2>
            <p className="text-zinc-300 mt-2">
              How would you like to join this session?
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              Current leader: {existingSession?.users?.name || 'Unknown'}
            </p>
          </div>

          <div className="space-y-4">
            {user.user_level >= 3 && (
              <button
                onClick={() => handleRoleChoice('force_leader')}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                <Crown size={20} className="mr-2" />
                Take Over Leadership (Admin)
              </button>
            )}
            
            <button
              onClick={() => handleRoleChoice('follower')}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Users size={20} className="mr-2" />
              Join as Follower
            </button>
            
            <button
              onClick={() => handleRoleChoice('standalone')}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-zinc-600 text-white rounded-xl hover:bg-zinc-500 transition-colors font-medium"
            >
              <Music size={20} className="mr-2" />
              Standalone Mode
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/setlists')}
              className="text-zinc-400 hover:text-zinc-300 transition-colors text-sm"
            >
              ← Back to Setlists
            </button>
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
            {setlistId ? 'Initializing performance mode...' : 'Loading setlists...'}
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
                setNeedsChoice(false);
                if (setlistId) {
                  checkSessionStatus(setlistId);
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

  if (!inPerformance) {
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
                Enter Performance Mode
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
              onClick={() => loadSearchSong(song)}
              className="w-full text-left p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <p className="text-base font-medium text-zinc-100">{song.title}</p>
              <p className="text-sm text-zinc-400">{song.original_artist}</p>
            </button>
          ))}
          {filteredSongs.length === 0 && searchQuery && (
            <p className="text-center text-zinc-400 py-8">No songs found</p>
          )}
        </div>
      </div>
    </div>
  );

  // Lyrics content with improved zoom controls
  const lyricsContent = (
    <div className="h-full relative">
      {currentSong ? (
        <div className="max-w-4xl mx-auto">
          {/* Zoom Controls - Desktop */}
          <div className="hidden lg:block absolute top-4 right-4 flex flex-col space-y-2 z-10">
            <button
              onClick={handleZoomIn}
              className="p-3 bg-zinc-800/90 backdrop-blur text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-3 bg-zinc-800/90 backdrop-blur text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-3 py-2 bg-zinc-800/90 backdrop-blur text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600 text-xs font-medium"
              title="Reset Zoom"
            >
              {Math.round(lyricsZoom * 100)}%
            </button>
          </div>

          <div style={{ zoom: lyricsZoom }}>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">{currentSong.title}</h1>
              <div className="flex items-center space-x-2">
                <p className="text-lg sm:text-xl text-zinc-400">
                  {currentSong.original_artist} {currentSong.key_signature && `• ${currentSong.key_signature}`}
                </p>
                {isSearchSong && (
                  <span className="px-2 py-1 bg-amber-600 text-white text-xs font-medium rounded-full">
                    Search Song
                  </span>
                )}
              </div>
              {currentSong.performance_note && (
                <div className="flex items-center space-x-2 mt-2">
                  <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <p className="text-base sm:text-lg text-amber-300 font-medium">{currentSong.performance_note}</p>
                </div>
              )}
            </div>
            <div 
              className="prose prose-invert prose-lg max-w-none text-zinc-200 leading-relaxed text-base sm:text-lg"
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
};

export default PerformanceMode;