import React, { useEffect } from 'react';
import { useState } from 'react';
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
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Stats Cards */}
        <button
          onClick={() => navigate('/songs')}
          className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 text-left hover:bg-slate-700 transition-colors"
        >
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Total Songs</h3>
          <div className="flex items-center">
            <Music className="h-8 w-8 text-blue-400 mr-3" />
            <p className="text-3xl font-bold text-blue-400">
              {loading ? '...' : stats.totalSongs}
            </p>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/setlists')}
          className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 text-left hover:bg-slate-700 transition-colors"
        >
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Setlists</h3>
          <div className="flex items-center">
            <ListMusic className="h-8 w-8 text-blue-400 mr-3" />
            <p className="text-3xl font-bold text-blue-400">
              {loading ? '...' : stats.totalSetlists}
            </p>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/song-collections')}
          className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 text-left hover:bg-slate-700 transition-colors"
        >
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Collections</h3>
          <div className="flex items-center">
            <Collection className="h-8 w-8 text-blue-400 mr-3" />
            <p className="text-3xl font-bold text-blue-400">
              {loading ? '...' : stats.totalCollections}
            </p>
          </div>
        </button>
      </div>
      
      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Songs */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-100">Recent Songs</h2>
            <Link 
              to="/songs" 
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : recentSongs.length === 0 ? (
            <p className="text-slate-400">No songs yet. <Link to="/songs/add" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Add your first song</Link></p>
          ) : (
            <div className="space-y-3">
              {recentSongs.map((song) => (
                <div key={song.id} className="flex justify-between items-start">
                  <div>
                    <Link 
                      to={`/songs/${song.id}`}
                      className="text-sm font-medium text-slate-100 hover:text-blue-400 transition-colors"
                    >
                      {song.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {song.original_artist} {song.key_signature && `• ${song.key_signature}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(song.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Setlists */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-100">Recent Setlists</h2>
            <Link 
              to="/setlists" 
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : recentSetlists.length === 0 ? (
            <p className="text-slate-400">No setlists yet. <Link to="/setlists/add" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Create your first setlist</Link></p>
          ) : (
            <div className="space-y-3">
              {recentSetlists.map((setlist) => (
                <div key={setlist.id} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/setlists/${setlist.id}`}
                      className="text-sm font-medium text-slate-100 hover:text-blue-400 block truncate transition-colors"
                    >
                      {setlist.name}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {new Date(setlist.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handlePrintSetlist(setlist)}
                      className="p-1 text-green-400 hover:text-green-300 transition-colors"
                      title="Print Setlist"
                    >
                      <Printer size={16} />
                    </button>
                    <Link
                      to={`/setlists/edit/${setlist.id}`}
                      className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
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
