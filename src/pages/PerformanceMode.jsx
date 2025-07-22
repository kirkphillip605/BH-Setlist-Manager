import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, SkipBack, SkipForward, X, Music, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';
import { songsService } from '../services/songsService';
import { performanceService } from '../services/performanceService';

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

  // Performance state
  const [inPerformance, setInPerformance] = useState(!!setlistId);
  const [session, setSession] = useState(null);
  const [setlistData, setSetlistData] = useState(null);
  const [songsData, setSongsData] = useState({});
  const [currentSet, setCurrentSet] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentSongLyrics, setCurrentSongLyrics] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Search functionality
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allSongs, setAllSongs] = useState([]);
  const [isSearchSong, setIsSearchSong] = useState(false);
  const [previousSetSong, setPreviousSetSong] = useState(null);

  useEffect(() => {
    setPageTitle('Performance Mode');
    if (setlistId) {
      initializePerformanceMode(setlistId);
    } else {
      fetchSetlists();
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [setlistId]);

  const fetchSetlists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setlistsService.getAllSetlists();
      setSetlists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSongs = async () => {
    try {
      const songs = await songsService.getAllSongs();
      setAllSongs(songs);
    } catch (err) {
      console.error('Error fetching all songs:', err);
    }
  };

  const initializePerformanceMode = async (setlistId) => {
    setLoading(true);
    setError(null);
    try {
      // Check for existing active session
      const activeSession = await performanceService.getActiveSession(setlistId);
      
      let sessionData;
      if (activeSession) {
        // Join existing session as follower
        sessionData = activeSession;
        setIsLeader(activeSession.leader_id === user.id);
      } else {
        // Create new session as leader
        sessionData = await performanceService.createSession(setlistId, user.id);
        setIsLeader(true);
        
        // Prefetch all setlist data for offline support
        await performanceService.prefetchSetlistData(setlistId);
      }

      setSession(sessionData);
      await loadPerformanceData(setlistId, sessionData);

      // Subscribe to session updates
      const sub = performanceService.subscribeToSession(
        sessionData.id,
        handleSessionUpdate
      );
      setSubscription(sub);

      // Fetch all songs for search functionality
      await fetchAllSongs();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async (setlistId, sessionData) => {
    try {
      // Try to load from cache first
      const cached = performanceService.getCachedSetlistData();
      
      if (cached.setlistData && cached.songsData) {
        setSetlistData(cached.setlistData);
        setSongsData(cached.songsData);
      } else {
        // Fallback to API calls
        const fullSetlist = await setlistsService.getSetlistById(setlistId);
        setSetlistData(fullSetlist);
      }

      // Load current set and song
      if (sessionData.current_set_id) {
        const setData = await setsService.getSetById(sessionData.current_set_id);
        setCurrentSet(setData);
      }

      if (sessionData.current_song_id) {
        await loadCurrentSong(sessionData.current_song_id);
      }

      setInPerformance(true);
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError(err.message);
    }
  };

  const loadCurrentSong = async (songId) => {
    try {
      // Try cached data first
      if (songsData[songId]) {
        const songData = songsData[songId];
        setCurrentSong(songData);
        setCurrentSongLyrics(songData.lyrics);
        setIsSearchSong(false);
      } else {
        // Fallback to API
        const songData = await songsService.getSongById(songId);
        setCurrentSong(songData);
        setCurrentSongLyrics(songData.lyrics);
        setIsSearchSong(false);
      }
    } catch (err) {
      console.error('Error loading current song:', err);
    }
  };

  const loadSearchSong = async (song) => {
    try {
      // Store previous set song for navigation
      setPreviousSetSong(currentSong);
      
      // Load full song data if not cached
      let songData = songsData[song.id] || song;
      if (!songData.lyrics) {
        songData = await songsService.getSongById(song.id);
      }
      
      // Update the performance session for followers to see the change
      if (isLeader && session) {
        await performanceService.updateSession(session.id, {
          current_song_id: songData.id
        });
      }
      
      setCurrentSong(songData);
      setCurrentSongLyrics(songData.lyrics);
      setIsSearchSong(true);
      setShowSearch(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Error loading search song:', err);
      setError('Failed to load selected song');
    }
  };

  const handleSessionUpdate = (payload) => {
    if (payload.new) {
      setSession(payload.new);
      if (payload.new.current_song_id !== currentSong?.id) {
        loadCurrentSong(payload.new.current_song_id);
      }
      if (payload.new.current_set_id !== currentSet?.id) {
        loadCurrentSet(payload.new.current_set_id);
      }
    }
  };

  const loadCurrentSet = async (setId) => {
    try {
      const setData = await setsService.getSetById(setId);
      setCurrentSet(setData);
    } catch (err) {
      console.error('Error loading current set:', err);
    }
  };

  const handleStartPerformance = async () => {
    if (!selectedSetlistId) {
      setError('Please select a setlist');
      return;
    }
    navigate(`/performance?setlist=${selectedSetlistId}`);
  };

  const handleSetChange = async (set) => {
    if (!isLeader || !session) return;

    try {
      const setData = await setsService.getSetById(set.id);
      const firstSong = setData.set_songs && setData.set_songs.length > 0 
        ? setData.set_songs[0].songs 
        : null;

      await performanceService.updateSession(session.id, {
        current_set_id: set.id,
        current_song_id: firstSong?.id || null
      });
      
      // Update local state immediately for leader
      setCurrentSet(setData);
      if (firstSong) {
        await loadCurrentSong(firstSong.id);
      }
      setIsSearchSong(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSongSelect = async (song) => {
    if (!isLeader || !session) return;

    try {
      await performanceService.updateSession(session.id, {
        current_song_id: song.id
      });
      
      // Update local state immediately for leader
      await loadCurrentSong(song.id);
      setIsSearchSong(false);
    } catch (err) {
      setError(err.message);
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
    if (!isLeader || !session) return;

    // If currently viewing a search song, go back to the previous set song
    if (isSearchSong && previousSetSong) {
      await performanceService.updateSession(session.id, {
        current_song_id: previousSetSong.id
      });
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
      await performanceService.updateSession(session.id, {
        current_song_id: previousSong.id
      });
      await loadCurrentSong(previousSong.id);
    }
  };

  const handleNextSong = async () => {
    if (!isLeader || !session) return;

    // If currently viewing a search song, go back to the set
    if (isSearchSong && previousSetSong) {
      await performanceService.updateSession(session.id, {
        current_song_id: previousSetSong.id
      });
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
      await performanceService.updateSession(session.id, {
        current_song_id: nextSong.id
      });
      await loadCurrentSong(nextSong.id);
    }
  };

  const handleExitPerformance = async () => {
    try {
      if (isLeader && session) {
        await performanceService.endSession(session.id);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
      // Clear cache on exit
      performanceService.clearCache();
      navigate('/setlists');
    } catch (err) {
      console.error('Error exiting performance:', err);
      navigate('/setlists');
    }
  };

  const filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.original_artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                onClick={handleStartPerformance}
                disabled={!selectedSetlistId || loading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate shadow-lg font-medium"
              >
                <Play size={20} className="mr-2" />
                {loading ? 'Loading...' : 'Start Performance'}
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

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      {/* Performance Sidebar */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-100 mb-1">
            {setlistData?.name}
          </h2>
          <p className="text-sm text-zinc-400">
            {isLeader ? 'Leader' : 'Follower'} • {currentSet?.name}
          </p>
          {isSearchSong && (
            <p className="text-xs text-amber-400 mt-1">
              🎵 Search Song Active
            </p>
          )}
        </div>

        {/* Sets Navigation (Leader only) */}
        {isLeader && setlistData?.sets && setlistData.sets.length > 1 && (
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

        {/* Search Songs (Leader only) */}
        {isLeader && (
          <div className="p-4 border-b border-zinc-800">
            <div className="relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-full inline-flex items-center justify-center px-3 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all btn-animate text-sm font-medium"
              >
                <Search size={16} className="mr-2" />
                Search Songs
                <ChevronDown size={16} className={`ml-2 transition-transform ${showSearch ? 'rotate-180' : ''}`} />
              </button>
              
              {showSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden">
                  <div className="p-3 border-b border-zinc-700">
                    <input
                      type="text"
                      placeholder="Search songs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredSongs.slice(0, 20).map((song) => (
                      <button
                        key={song.id}
                        onClick={() => loadSearchSong(song)}
                        className="w-full text-left p-3 hover:bg-zinc-700 transition-colors border-b border-zinc-800 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-zinc-100">{song.title}</p>
                        <p className="text-xs text-zinc-400">{song.original_artist}</p>
                      </button>
                    ))}
                    {filteredSongs.length === 0 && searchQuery && (
                      <p className="p-3 text-sm text-zinc-400">No songs found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {currentSetSongs.map((song, index) => (
              <button
                key={song.id}
                onClick={() => isLeader && !isSearchSong && handleSongSelect(song)}
                disabled={!isLeader || isSearchSong}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  currentSong?.id === song.id && !isSearchSong
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isLeader && !isSearchSong
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
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-xs opacity-75 truncate">
                      {song.original_artist} {song.key_signature && `• ${song.key_signature}`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Lyrics Display */}
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          {currentSong ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-100 mb-2">{currentSong.title}</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-xl text-zinc-400">
                    {currentSong.original_artist} {currentSong.key_signature && `• ${currentSong.key_signature}`}
                  </p>
                  {isSearchSong && (
                    <span className="px-2 py-1 bg-amber-600 text-white text-xs font-medium rounded-full">
                      Search Song
                    </span>
                  )}
                </div>
              </div>
              <div 
                className="prose prose-invert prose-lg max-w-none text-zinc-200 leading-relaxed"
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

        {/* Fixed Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 p-4">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            {/* Exit Button */}
            <button
              onClick={handleExitPerformance}
              className="inline-flex items-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all btn-animate shadow-lg font-medium"
            >
              <X size={20} className="mr-2" />
              Exit Performance Mode
            </button>

            {/* Navigation Controls (Leader only) */}
            {isLeader && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePreviousSong}
                  disabled={!canGoPrevious}
                  className="inline-flex items-center px-6 py-3 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate shadow-lg font-medium"
                >
                  <SkipBack size={20} className="mr-2" />
                  Previous
                </button>
                <button
                  onClick={handleNextSong}
                  disabled={!canGoNext}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate shadow-lg font-medium"
                >
                  Next
                  <SkipForward size={20} className="ml-2" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMode;