import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, ListMusic, BookTemplate as Collection, Edit, Printer } from 'lucide-react';
import { usePageTitle } from '../context/PageTitleContext';
import { songsService } from '../services/songsService';
import { setlistsService } from '../services/setlistsService';
import { songCollectionsService } from '../services/songCollectionsService';
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

  useEffect(() => {
    setPageTitle('Dashboard');
    fetchDashboardData();
  }, [setPageTitle]);

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
    <div className="content-max-width">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats Cards */}
        <button
          onClick={() => navigate('/songs')}
          className="theme-card-interactive p-6 text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-heading-md">Songs</h3>
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
              <Music className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-heading tracking-tight">
              {loading ? '...' : stats.totalSongs}
            </p>
            <p className="text-sm text-muted">in library</p>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/setlists')}
          className="theme-card-interactive p-6 text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-heading-md">Setlists</h3>
            <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors">
              <ListMusic className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-heading tracking-tight">
              {loading ? '...' : stats.totalSetlists}
            </p>
            <p className="text-sm text-muted">created</p>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/song-collections')}
          className="theme-card-interactive p-6 text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-heading-md">Collections</h3>
            <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center group-hover:bg-orange-600/20 transition-colors">
              <Collection className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-heading tracking-tight">
              {loading ? '...' : stats.totalCollections}
            </p>
            <p className="text-sm text-muted">curated</p>
          </div>
        </button>
      </div>
      
      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Songs */}
        <div className="theme-card p-6 slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-heading-lg mb-1">Recent Songs</h2>
              <p className="text-sm text-muted">Latest additions to your library</p>
            </div>
            <Link 
              to="/songs" 
              className="text-link-underline text-sm font-medium"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="w-10 h-10 loading-skeleton rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 loading-skeleton rounded w-3/4"></div>
                    <div className="h-3 loading-skeleton rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentSongs.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-muted mb-2">No songs yet</p>
              <Link to="/songs/add" className="text-link-underline text-sm">Add your first song</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSongs.map((song) => (
                <div key={song.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-700/30 transition-colors group">
                  <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                    <Music size={16} className="text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/songs/${song.id}`}
                      className="text-sm font-medium text-heading hover:text-blue-400 transition-colors block truncate"
                    >
                      {song.title}
                    </Link>
                    <p className="text-xs text-muted truncate">
                      {song.original_artist} {song.key_signature && `• ${song.key_signature}`}
                    </p>
                  </div>
                  <span className="text-xs text-subtle whitespace-nowrap">
                    {new Date(song.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Setlists */}
        <div className="theme-card p-6 slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-heading-lg mb-1">Recent Setlists</h2>
              <p className="text-sm text-muted">Your latest performance setlists</p>
            </div>
            <Link 
              to="/setlists" 
              className="text-link-underline text-sm font-medium"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="w-10 h-10 loading-skeleton rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 loading-skeleton rounded w-3/4"></div>
                    <div className="h-3 loading-skeleton rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-6 h-6 loading-skeleton rounded"></div>
                    <div className="w-6 h-6 loading-skeleton rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentSetlists.length === 0 ? (
            <div className="text-center py-8">
              <ListMusic className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-muted mb-2">No setlists yet</p>
              <Link to="/setlists/add" className="text-link-underline text-sm">Create your first setlist</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSetlists.map((setlist) => (
                <div key={setlist.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-700/30 transition-colors group">
                  <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center group-hover:bg-zinc-600 transition-colors">
                    <ListMusic size={16} className="text-muted" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link 
                      to={`/setlists/${setlist.id}`}
                      className="text-sm font-medium text-heading hover:text-blue-400 block truncate transition-colors"
                    >
                      {setlist.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {new Date(setlist.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={() => handlePrintSetlist(setlist)}
                      className="btn-icon text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/10"
                      title="Print Setlist"
                    >
                      <Printer size={16} />
                    </button>
                    <Link
                      to={`/setlists/edit/${setlist.id}`}
                      className="btn-icon text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
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
