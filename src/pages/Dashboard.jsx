import React, { useEffect } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, ListMusic, BookTemplate as Collection, Edit, Printer } from 'lucide-react';
import { usePageTitle } from '../context/PageTitleContext';
import { songsService } from '../services/songsService';
import { setlistsService } from '../services/setlistsService';
import { songCollectionsService } from '../services/songCollectionsService';
import { performanceService } from '../services/performanceService';
import { generateSetlistPDF } from '../utils/pdfGenerator';

const Dashboard = () => {
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalSetlists: 0,
    totalCollections: 0
  });
  const [recentSongs, setRecentSongs] = useState([]);
  const [recentSetlists, setRecentSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    setPageTitle('Dashboard');
    fetchDashboardData();
    checkForActiveSession();
  }, [setPageTitle]);

  const checkForActiveSession = async () => {
    try {
      // Check all setlists for active sessions
      const setlists = await setlistsService.getAllSetlists();
      for (const setlist of setlists) {
        try {
          const session = await import('../services/performanceService')
            .then(({ performanceService }) => performanceService.getActiveSession(setlist.id));
          if (session && session.leader_id !== user.id) {
            setActiveSession({ ...session, setlist });
            break;
          }
        } catch (err) {
          // No active session for this setlist, continue
        }
      }
    } catch (err) {
      console.error('Error checking for active sessions:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [songsData, setlistsData, collectionsData] = await Promise.all([
        songsService.getAllSongs(),
        setlistsService.getAllSetlists(),
        songCollectionsService.getAllSongCollections()
      ]);

      setStats({
        totalSongs: songsData.length,
        totalSetlists: setlistsData.length,
        totalCollections: collectionsData.length
      });

      // Get last 5 newest songs
      const sortedSongs = songsData
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentSongs(sortedSongs);

      // Get last 5 newest setlists
      const sortedSetlists = setlistsData
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentSetlists(sortedSetlists);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSetlist = async (setlist) => {
    try {
      await generateSetlistPDF(setlist);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };
  return (
    <div className="max-w-7xl mx-auto fade-in">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Dashboard</h1>
            <p className="text-sm sm:text-base text-zinc-400">Welcome back to your setlist manager</p>
          </div>
        </div>
      </div>
      
      {/* Active Performance Session Card */}
      {activeSession && (
        <div className="card-modern p-4 sm:p-6 mb-6 sm:mb-8 border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/10 to-transparent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:justify-between">
            <div>
              <h3 className="text-lg sm:text-lg font-semibold text-zinc-100 mb-2 sm:mb-1">🎭 Performance Mode Active</h3>
              <p className="text-base sm:text-base text-zinc-300 mb-2 sm:mb-1">
                <span className="font-medium">{activeSession.setlist.name}</span> is being performed
              </p>
              <p className="text-zinc-400 text-sm sm:text-sm">
                Led by {activeSession.users?.name || 'Unknown'} • Started {new Date(activeSession.created_at).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => navigate(`/performance?setlist=${activeSession.setlist.id}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all btn-animate shadow-lg font-medium mobile-form-button"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
              Join as Follower
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Quick Stats Cards */}
        <button
          onClick={() => navigate('/songs')}
          className="card-modern p-6 sm:p-6 text-left hover:scale-105 btn-animate group mobile-table-card"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg sm:text-lg font-semibold text-zinc-100">Songs</h3>
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Music className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              {loading ? '...' : stats.totalSongs}
            </p>
            <p className="text-base sm:text-sm text-zinc-400">in library</p>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/setlists')}
          className="card-modern p-6 sm:p-6 text-left hover:scale-105 btn-animate group mobile-table-card"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg sm:text-lg font-semibold text-zinc-100">Setlists</h3>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <ListMusic className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              {loading ? '...' : stats.totalSetlists}
            </p>
            <p className="text-base sm:text-sm text-zinc-400">created</p>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/song-collections')}
          className="card-modern p-6 sm:p-6 text-left hover:scale-105 btn-animate group mobile-table-card sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg sm:text-lg font-semibold text-zinc-100">Collections</h3>
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Collection className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              {loading ? '...' : stats.totalCollections}
            </p>
            <p className="text-base sm:text-sm text-zinc-400">curated</p>
          </div>
        </button>
      </div>
      
      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Songs */}
        <div className="card-modern p-4 sm:p-6 slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-1">Recent Songs</h2>
              <p className="text-sm sm:text-sm text-zinc-400">Latest additions to your library</p>
            </div>
            <Link 
              to="/songs" 
              className="text-blue-400 hover:text-blue-300 text-base sm:text-sm font-medium transition-colors hover:underline"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentSongs.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 mb-2">No songs yet</p>
              <Link to="/songs/add" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors text-sm">Add your first song</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSongs.map((song) => (
                <div key={song.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-700/30 transition-colors group">
                  <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                    <Music size={16} className="text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/songs/${song.id}`}
                      className="text-sm font-medium text-zinc-100 hover:text-blue-400 transition-colors block truncate"
                    >
                      {song.title}
                    </Link>
                    <p className="text-xs text-zinc-400 truncate">
                      {song.original_artist} {song.key_signature && `• ${song.key_signature}`} {song.performance_note && (
                        <span className="flex items-center space-x-1 mt-1">
                          <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                          </svg>
                          <span className="text-amber-300 text-xs">{song.performance_note}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(song.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Setlists */}
        <div className="card-modern p-6 slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-1">Recent Setlists</h2>
              <p className="text-sm text-zinc-400">Your latest performance setlists</p>
            </div>
            <Link 
              to="/setlists" 
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors hover:underline"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-6 h-6 bg-zinc-700 rounded"></div>
                    <div className="w-6 h-6 bg-zinc-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentSetlists.length === 0 ? (
            <div className="text-center py-8">
              <ListMusic className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 mb-2">No setlists yet</p>
              <Link to="/setlists/add" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors text-sm">Create your first setlist</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSetlists.map((setlist) => (
                <div key={setlist.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-700/30 transition-colors group">
                  <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                    <ListMusic size={16} className="text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link 
                      to={`/setlists/${setlist.id}`}
                      className="text-sm font-medium text-zinc-100 hover:text-blue-400 block truncate transition-colors"
                    >
                      {setlist.name}
                    </Link>
                    <p className="text-xs text-zinc-400">
                      {new Date(setlist.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handlePrintSetlist(setlist)}
                      className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all btn-animate"
                      title="Print Setlist"
                    >
                      <Printer size={16} />
                    </button>
                    <Link
                      to={`/setlists/edit/${setlist.id}`}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all btn-animate"
                      title="Edit Setlist"
                    >
                      <Edit size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
