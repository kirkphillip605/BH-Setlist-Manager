import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="w-full sm:w-1/2 lg:w-1/3">
          <label htmlFor="search" className="sr-only">Search songs</label>
          <input
            type="text"
            id="search"
            placeholder="Search by artist or title..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        {/* Navigate to add song page */}
        <button
          onClick={() => navigate('/songs/add')}
          className="inline-flex items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <PlusCircle size={20} className="mr-2" />
          Add New Song
        </button>
        </div>

        {loading && <p className="text-center text-slate-300 py-8">Loading songs...</p>}

        {!loading && songs.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-slate-300 text-lg mb-2">No songs found</p>
            <p className="text-slate-400 mb-6">Add your first song to get started</p>
            <button
              onClick={() => navigate('/songs/add')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <PlusCircle size={20} className="mr-2" />
              Add Song
            </button>
          </div>
        )}

        {!loading && songs.length > 0 && (
          <>
          <ResizableTable columns={tableColumns} data={currentSongs} />

          {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <label htmlFor="items-per-page" className="text-sm text-slate-300">Items per page:</label>
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="block w-20 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              <nav className="flex space-x-1" aria-label="Pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp size={16} className="rotate-270" />
                </button>
                {[...Array(Math.min(5, totalPages)).keys()].map(i => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
