import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, SkipBack, SkipForward, X, Music } from 'lucide-react';
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
  const [currentSet, setCurrentSet] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentSongLyrics, setCurrentSongLyrics] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [subscription, setSubscription] = useState(null);

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

  const initializePerformanceMode = async (setlistId) => {
    setLoading(true);
    setError(null);
    try {
      // Check for existing active session
      const activeSession = await performanceService.getActiveSession(setlistId);
      
      if (activeSession) {
        // Join existing session as follower
        setSession(activeSession);
        setIsLeader(activeSession.leader_id === user.id);
        await loadPerformanceData(setlistId, activeSession);
      } else {
        // Create new session as leader
        const newSession = await performanceService.createSession(setlistId, user.id);
        setSession(newSession);
        setIsLeader(true);
        await loadPerformanceData(setlistId, newSession);
      }

      // Subscribe to session updates
      const sub = performanceService.subscribeToSession(
        activeSession?.id || session?.id,
        handleSessionUpdate
      );
      setSubscription(sub);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async (setlistId, sessionData) => {
    try {
      // Load full setlist with sets and songs
      const fullSetlist = await setlistsService.getSetlistById(setlistId);
      setSetlistData(fullSetlist);

      // Load detailed set data
      if (sessionData.current_set_id) {
        const setData = await setsService.getSetById(sessionData.current_set_id);
        setCurrentSet(setData);
      }

      // Load current song lyrics
      if (sessionData.current_song_id) {
        const songData = await songsService.getSongById(sessionData.current_song_id);
        setCurrentSong(songData);
        setCurrentSongLyrics(songData.lyrics);
      }

      setInPerformance(true);
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError(err.message);
    }
  };

  const handleSessionUpdate = (payload) => {
    if (payload.new) {
      // Update session data and reload current song if changed
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

  const loadCurrentSong = async (songId) => {
    try {
      const songData = await songsService.getSongById(songId);
      setCurrentSong(songData);
      setCurrentSongLyrics(songData.lyrics);
    } catch (err) {
      console.error('Error loading current song:', err);
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
    } catch (err) {
      setError(err.message);
    }
  };

  const getCurrentSongIndex = () => {
    if (!currentSet || !currentSong) return -1;
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
    if (!isLeader || !session || !currentSet) return;

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
      await handleSongSelect(previousSong);
    }
  };

  const handleNextSong = async () => {
    if (!isLeader || !session || !currentSet) return;

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
      await handleSongSelect(nextSong);
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
      navigate('/setlists');
    } catch (err) {
      console.error('Error exiting performance:', err);
      navigate('/setlists');
    }
  };

  if (!inPerformance) {
    // Setlist selection screen
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
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

          {/* Setlist Selection */}
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

  // Performance mode screen
  const currentSetSongs = currentSet?.set_songs
    ?.map(ss => ss.songs)
    .sort((a, b) => {
      const aOrder = currentSet.set_songs.find(ss => ss.songs.id === a.id)?.song_order || 0;
      const bOrder = currentSet.set_songs.find(ss => ss.songs.id === b.id)?.song_order || 0;
      return aOrder - bOrder;
    }) || [];

  const currentIndex = getCurrentSongIndex();
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < currentSetSongs.length - 1;

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-100 mb-1">
            {setlistData?.name}
          </h2>
          <p className="text-sm text-zinc-400">
            {isLeader ? 'Leader' : 'Follower'} • {currentSet?.name}
          </p>
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
              className="input-modern"
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
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {currentSetSongs.map((song, index) => (
              <button
                key={song.id}
                onClick={() => isLeader && handleSongSelect(song)}
                disabled={!isLeader}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  currentSong?.id === song.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isLeader 
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
                      : 'bg-zinc-800 text-zinc-300 cursor-default'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentSong?.id === song.id
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

        {/* Exit Button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleExitPerformance}
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all btn-animate shadow-lg font-medium"
          >
            <X size={20} className="mr-2" />
            Exit Performance Mode
          </button>
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
                <p className="text-xl text-zinc-400">
                  {currentSong.original_artist} {currentSong.key_signature && `• ${currentSong.key_signature}`}
                </p>
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

        {/* Navigation Controls (Leader only) */}
        {isLeader && (
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 p-4">
            <div className="flex justify-center space-x-4">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMode;