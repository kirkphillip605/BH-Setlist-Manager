import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, SkipBack, SkipForward, X, Music, Search, ChevronDown, Loader, Crown, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';
import { songsService } from '../services/songsService';
import { performanceService } from '../services/performanceService';
import MobilePerformanceLayout from '../components/MobilePerformanceLayout';
import LeadershipRequestModal from '../components/LeadershipRequestModal';
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
  const [leadershipChoice, setLeadershipChoice] = useState(null); // 'leader', 'follower', 'standalone'

  // Performance state
  const [inPerformance, setInPerformance] = useState(!!setlistId);
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

  // Leadership and followers
  const [showLeadershipRequest, setShowLeadershipRequest] = useState(false);
  const [leadershipRequestData, setLeadershipRequestData] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    mountedRef.current = true;
    
    const initialize = async () => {
      setPageTitle('Performance Mode');
      
      if (setlistId) {
        // Check if cache is valid and setlist data exists
        if (performanceService.isCacheValid(setlistId)) {
          const cached = performanceService.getCachedSetlistData();
          if (cached.setlistData) {
            await initializePerformanceMode(setlistId);
            return;
          }
        }
        // Fresh fetch needed
        await initializePerformanceMode(setlistId);
      } else {
        await fetchSetlists();
      }
    };
    
    initialize();
    
    return () => {
      mountedRef.current = false;
      if (inPerformance && session?.id) {
        performanceService.cleanupSubscriptions();
      }
    };
  }, [setlistId, leadershipChoice]);

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

  const initializePerformanceMode = async (setlistId) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check for existing active session first
      let activeSession;
      try {
        activeSession = await performanceService.getActiveSession(setlistId);
      } catch (err) {
        activeSession = null;
      }
      
      if (activeSession && !leadershipChoice) {
        // Show leadership choice modal
        setSession(activeSession);
        setLoading(false);
        return;
      }
      
      if (!leadershipChoice) {
        // No active session and no leadership choice - show modal
        setLoading(false);
        return;
      }

      let sessionData;
      let isLeaderRole = false;
      let isStandalone = false;
      
      if (leadershipChoice === 'leader') {
        if (activeSession && activeSession.leader_id !== user.id) {
          // Request leadership transfer
          await performanceService.requestLeadershipTransfer(
            activeSession.id, 
            user.id, 
            user.name
          );
          setError('Leadership transfer requested. Waiting for current leader response...');
          setLoading(false);
          return;
        } else {
          // Create new session or take over
          sessionData = await performanceService.createSession(setlistId, user.id);
          isLeaderRole = true;
        }
      } else if (leadershipChoice === 'follower') {
        if (!activeSession) {
          setError('No active session to join as follower');
          setLoading(false);
          return;
        }
        sessionData = await performanceService.joinSession(setlistId, user.id);
        isLeaderRole = false;
      } else if (leadershipChoice === 'standalone') {
        // Standalone mode - no session interaction
        await performanceService.prefetchAndCacheSetlistData(setlistId);
        isStandalone = true;
        sessionData = { id: 'standalone', setlist_id: setlistId };
      }

      if (mountedRef.current) {
        setSession(sessionData);
        setIsLeader(isLeaderRole);
        setStandaloneMode(isStandalone);
        await loadPerformanceData(setlistId, sessionData);

        if (!isStandalone && sessionData.id !== 'standalone') {
          // Subscribe to session updates
          performanceService.subscribeToSession(
            sessionData.id,
            handleSessionUpdate
          );

          if (isLeaderRole) {
            // Subscribe to leadership requests
            performanceService.subscribeToLeadershipRequests(
              sessionData.id,
              handleLeadershipRequest
            );
          }
        }

        await fetchAllSongs();
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
        console.warn('No cached data available, this should not happen in performance mode');
      }

      if (sessionData?.current_set_id) {
        const currentSetData = cachedSetlist?.sets?.find(s => s.id === sessionData.current_set_id);
        if (mountedRef.current) {
          setCurrentSet(currentSetData);
        }
      } else if (cachedSetlist?.sets?.[0]) {
        if (mountedRef.current) {
          setCurrentSet(cachedSetlist.sets[0]);
        }
      }

      if (sessionData?.current_song_id) {
        await loadCurrentSong(sessionData.current_song_id);
      } else if (cachedSetlist?.sets?.[0]?.set_songs?.[0]) {
        await loadCurrentSong(cachedSetlist.sets[0].set_songs[0].songs.id);
      }

      if (mountedRef.current) {
        setInPerformance(true);
      }
    } catch (err) {
      console.error('Error loading performance data:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
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
        console.warn(`Song ${songId} not found in cache`);
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
    
    setTimeout(() => {
      if (!mountedRef.current) return;
      
      setSession(newSession);
      
      if (newSession.current_song_id !== currentSong?.id) {
        loadCurrentSong(payload.new.current_song_id);
      }
      
      if (newSession.current_set_id !== currentSet?.id) {
        loadCurrentSet(payload.new.current_set_id);
      }
    }, 0);
  };

  const handleLeadershipRequest = (payload) => {
    if (!mountedRef.current || !isLeader) return;
    
    const request = payload.new;
    setLeadershipRequestData(request);
    setShowLeadershipRequest(true);
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

  const handleStartPerformance = async (choice) => {
    if (!selectedSetlistId) {
      setError('Please select a setlist');
      return;
    }
    
    setLeadershipChoice(choice);
    navigate(`/performance?setlist=${selectedSetlistId}`);
  };

  const handleSetChange = async (set) => {
    if ((!isLeader && !standaloneMode) || !session) return;

    try {
      const setData = set; // Already have full data from cache
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
      } else {
        performanceService.cleanupSubscriptions();
      }
      
      navigate('/setlists');
    } catch (err) {
      console.error('Error exiting performance:', err);
      navigate('/setlists');
    }
  };

  const handleLeadershipResponse = async (approved) => {
    try {
      await performanceService.respondToLeadershipRequest(
        leadershipRequestData.id,
        approved ? 'approved' : 'rejected',
        user.id
      );

      if (approved) {
        // Transfer leadership
        setIsLeader(false);
        localStorage.setItem(STORAGE_KEYS.IS_LEADER, 'false');
      }

      setShowLeadershipRequest(false);
      setLeadershipRequestData(null);
    } catch (err) {
      console.error('Error responding to leadership request:', err);
      setError('Failed to respond to leadership request');
    }
  };

  const filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.original_artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Leadership choice modal
  if (setlistId && !leadershipChoice && !standaloneMode && !loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="card-modern p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Performance Mode</h2>
            <p className="text-zinc-300 mt-2">
              How would you like to join this session?
            </p>
          </div>

          {session?.leader_id === user.id ? (
            <div className="space-y-4">
              <button
                onClick={() => handleStartPerformance('leader')}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
              >
                <Crown size={20} className="mr-2" />
                Continue as Leader
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => handleStartPerformance('leader')}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
              >
                <Crown size={20} className="mr-2" />
                Request Leadership
              </button>
              <button
                onClick={() => handleStartPerformance('follower')}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Users size={20} className="mr-2" />
                Join as Follower
              </button>
              <button
                onClick={() => handleStartPerformance('standalone')}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-zinc-600 text-white rounded-xl hover:bg-zinc-500 transition-colors font-medium"
              >
                <Music size={20} className="mr-2" />
                Standalone Mode
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && !inPerformance) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-zinc-300">
            {leadershipChoice ? 'Initializing performance mode...' : 'Loading setlists...'}
          </p>
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

          {error && (
            <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-xl mb-6">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

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
                onClick={() => navigate(`/performance?setlist=${selectedSetlistId}`)}
                disabled={!selectedSetlistId || loading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate shadow-lg font-medium"
              >
                <Play size={20} className="mr-2" />
                {loading ? 'Loading...' : 'Enter Performance Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Performance mode loading state
  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-zinc-300">Initializing performance mode...</p>
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

  // Lyrics content
  const lyricsContent = (
    <div className="h-full">
      {currentSong ? (
        <div className="max-w-4xl mx-auto">
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
        onShowFollowers={() => setShowFollowers(true)}
        onShowSearch={() => setShowSearch(true)}
        showSearch={showSearch}
        searchContent={searchContent}
        setlistName={setlistData?.name}
        currentSetName={currentSet?.name}
        isSearchSong={isSearchSong}
      >
        {lyricsContent}
      </MobilePerformanceLayout>

      {/* Leadership Request Modal */}
      <LeadershipRequestModal
        isOpen={showLeadershipRequest}
        onClose={() => setShowLeadershipRequest(false)}
        requestingUserName={leadershipRequestData?.requesting_user_name}
        onAllow={() => handleLeadershipResponse(true)}
        onReject={() => handleLeadershipResponse(false)}
        autoApproveAfter={30}
      />

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