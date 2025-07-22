import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown, Music, Search } from 'lucide-react';
import ResizableTable from '../components/ResizableTable';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { songsService } from '../services/songsService';

const ManageSongs = () => {
  const { setPageTitle } = usePageTitle();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for pagination, search, and sort
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('title'); // Default sort by title
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const navigate = useNavigate();
  const { user } = useAuth(); // Get the user from the auth context

  useEffect(() => {
    setPageTitle('Manage Songs');
    fetchSongs();
  }, [setPageTitle]);

  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await songsService.getAllSongs();
      setSongs(data);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError(err.message || 'Failed to fetch songs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSong = async (song_id) => {
    if (!window.confirm('Are you sure you want to delete this song?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await songsService.deleteSong(song_id);
      await fetchSongs(); // Re-fetch songs
    } catch (err) {
      console.error('Error deleting song:', err);
      setError(err.message || 'Failed to delete song. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search, Sort, and Pagination Logic
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const filteredSongs = useMemo(() => {
    return songs.filter(song =>
      song.original_artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  const sortedSongs = useMemo(() => {
    if (!sortColumn) return filteredSongs;

    return [...filteredSongs].sort((a, b) => {
      const aValue = a[sortColumn] || '';
      const bValue = b[sortColumn] || '';

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSongs, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedSongs.length / itemsPerPage);
  const indexOfLastSong = currentPage * itemsPerPage;
  const indexOfFirstSong = indexOfLastSong - itemsPerPage;
  const currentSongs = sortedSongs.slice(indexOfFirstSong, indexOfLastSong);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />;
    }
    return null;
  };

  // Define columns for ResizableTable
  const tableColumns = useMemo(() => [
    {
      key: 'title',
      header: (
        <div className="flex items-center">
          Title {renderSortIcon('title')}
        </div>
      ),
      render: (song) => (
        <Link to={`/songs/${song.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
          {song.title}
        </Link>
      ),
      initialWidth: 250,
      sortable: true,
      onSort: () => handleSort('title'),
    },
    {
      key: 'original_artist',
      header: (
        <div className="flex items-center">
          Artist {renderSortIcon('original_artist')}
        </div>
      ),
      render: (song) => song.original_artist,
      initialWidth: 200,
      sortable: true,
      onSort: () => handleSort('original_artist'),
    },
    {
      key: 'key_signature',
      header: (
        <div className="flex items-center">
          Key {renderSortIcon('key_signature')}
        </div>
      ),
      render: (song) => song.key_signature || '-',
      initialWidth: 100,
      sortable: true,
      onSort: () => handleSort('key_signature'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (song) => (
        <div className="flex justify-end space-x-2">
          {user && user.user_level >= 2 && (
            <>
          <button
            onClick={() => navigate(`/songs/edit/${song.id}`)} // Navigate to edit page
            className="text-indigo-600 hover:text-indigo-900 mr-3 dark:text-indigo-400 dark:hover:text-indigo-300"
            title="Edit Song"
          >
            <Edit size={18} />
          </button>
          {user && user.user_level >= 2 && (
          <button
            onClick={() => handleDeleteSong(song.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            title="Delete Song"
          >
            <Trash2 size={18} />
          </button>
          )}
            </>
          )}
        </div>
      ),
      initialWidth: 120,
      sortable: false,
      align: 'right',
    },
  ], [sortColumn, sortDirection, handleSort, handleDeleteSong, navigate, user]);

  return (
    <div className="max-w-7xl mx-auto fade-in">
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm" role="alert">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <strong className="font-semibold">Error</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </div>
        </div>
      )}

      <div className="card-modern p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Music className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">Song Library</h1>
              <p className="text-sm text-zinc-400">Manage your music collection</p>
            </div>
          </div>
          
          <div className="w-full sm:w-1/2 lg:w-1/3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <label htmlFor="search" className="sr-only">Search songs</label>
          <input
            type="text"
            id="search"
                placeholder="Search songs..."
            value={searchTerm}
            onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-zinc-400"
          />
            </div>
        </div>
          
          {user && user.user_level >= 2 && (
            <button
              onClick={() => navigate('/songs/add')}
              className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus-ring shadow-lg btn-animate font-medium"
            >
              <PlusCircle size={20} className="mr-2" />
              Add Song
            </button>
          )}
        </div>

        {loading && (
          <div className="py-12">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-zinc-700 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-zinc-700 rounded-lg"></div>
                    <div className="w-8 h-8 bg-zinc-700 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && songs.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Music className="h-12 w-12 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">No songs in your library</h3>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">Get started by adding your first song to build your music collection.</p>
            {user && user.user_level >= 2 && (
              <button
                onClick={() => navigate('/songs/add')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus-ring shadow-lg btn-animate font-medium"
              >
                <PlusCircle size={20} className="mr-2" />
                Add Your First Song
              </button>
            )}
          </div>
        )}

        {!loading && songs.length > 0 && (
          <>
            <div className="bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800">
              <ResizableTable columns={tableColumns} data={currentSongs} />
            </div>

          {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <label htmlFor="items-per-page" className="text-sm text-zinc-400 font-medium">Show:</label>
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span className="text-sm text-zinc-400">of {filteredSongs.length} songs</span>
              </div>
              <nav className="flex items-center space-x-1" aria-label="Pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate"
                >
                  <ChevronUp size={16} className="-rotate-90" />
                </button>
                
                <div className="flex items-center space-x-2 px-4">
                  <span className="text-sm text-zinc-400">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate"
                >
                  <ChevronDown size={16} className="-rotate-90" />
                </button>
              </nav>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageSongs;
