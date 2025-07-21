import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import ResizableTable from '../components/ResizableTable';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ManageSongs = () => {
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
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/songs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSongs(data);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to fetch songs. Please try again.');
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
      const response = await fetch(`/api/songs/${song_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

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
        <Link to={`/songs/${song.song_id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
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
          <button
            onClick={() => navigate(`/songs/edit/${song.song_id}`)} // Navigate to edit page
            className="text-indigo-600 hover:text-indigo-900 mr-3 dark:text-indigo-400 dark:hover:text-indigo-300"
            title="Edit Song"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDeleteSong(song.song_id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            title="Delete Song"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
      initialWidth: 120,
      sortable: false,
      align: 'right',
    },
  ], [sortColumn, sortDirection, handleSort, handleDeleteSong, navigate]);

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-gray-100">Manage Songs</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900 dark:text-red-200 dark:border-red-700" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
        <div className="w-full sm:w-1/3">
          <label htmlFor="search" className="sr-only">Search songs</label>
          <input
            type="text"
            id="search"
            placeholder="Search by artist or title..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
        {/* Navigate to add song page */}
        <button
          onClick={() => navigate('/songs/add')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircle size={20} className="mr-2" />
          Add New Song
        </button>
      </div>

      {loading && <p className="text-center text-gray-600 dark:text-gray-400">Loading songs...</p>}

      {!loading && songs.length === 0 && !error && (
        <p className="text-center text-gray-600 dark:text-gray-400">No songs found. Add a new song to get started!</p>
      )}

      {!loading && songs.length > 0 && (
        <>
          <ResizableTable columns={tableColumns} data={currentSongs} />

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <label htmlFor="items-per-page" className="text-sm text-gray-700 dark:text-gray-300">Items per page:</label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <span className="sr-only">Previous</span>
                <ChevronUp size={16} className="rotate-270" /> {/* Rotate for left arrow */}
              </button>
              {[...Array(totalPages).keys()].map(number => (
                <button
                  key={number + 1}
                  onClick={() => paginate(number + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === number + 1 ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-300' : 'text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                >
                  {number + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <span className="sr-only">Next</span>
                <ChevronDown size={16} className="-rotate-90" /> {/* Rotate for right arrow */}
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageSongs;
