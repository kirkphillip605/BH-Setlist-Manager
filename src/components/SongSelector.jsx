import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { songsService } from '../services/songsService';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';

const SongSelector = ({ onSongsSelected, selectedSongs = [], showAddButton = true, setlistId = null }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [localSelectedSongs, setLocalSelectedSongs] = useState(new Set(selectedSongs.map(s => s.id || s)));
  const [allSetlistSongs, setAllSetlistSongs] = useState(new Set());

  useEffect(() => {
    fetchSongs();
    if (setlistId) {
      fetchSetlistSongs();
    }
  }, []);

  useEffect(() => {
    setLocalSelectedSongs(new Set(selectedSongs.map(s => s.id || s)));
  }, [selectedSongs]);

  const fetchSetlistSongs = async () => {
    try {
      const setlistData = await setlistsService.getSetlistById(setlistId);
      const allSongIds = new Set();
      
      // Get all songs from all sets in the setlist
      for (const set of setlistData.sets || []) {
        const setData = await setsService.getSetById(set.id);
        setData.set_songs?.forEach(ss => {
          allSongIds.add(ss.songs.id);
        });
      }
      
      setAllSetlistSongs(allSongIds);
    } catch (err) {
      console.error('Error fetching setlist songs:', err);
    }
  };

  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await songsService.getAllSongs();
      setSongs(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch songs');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSongToggle = (song) => {
    const newSelected = new Set(localSelectedSongs);
    if (newSelected.has(song.id)) {
      newSelected.delete(song.id);
    } else {
      newSelected.add(song.id);
    }
    setLocalSelectedSongs(newSelected);
  };

  const handleAddSelected = () => {
    const selectedSongObjects = songs.filter(song => localSelectedSongs.has(song.id));
    onSongsSelected(selectedSongObjects);
  };

  const filteredSongs = useMemo(() => {
    const normalizedTerm = searchTerm.toLowerCase();
    return songs.filter(song =>
      song.original_artist.toLowerCase().includes(normalizedTerm) ||
      song.title.toLowerCase().includes(normalizedTerm) ||
      (song.key_signature && song.key_signature.toLowerCase().includes(normalizedTerm)) ||
      (song.tempo !== null && song.tempo !== undefined && song.tempo.toString().includes(normalizedTerm))
    );
  }, [songs, searchTerm]);

  const sortedSongs = useMemo(() => {
    if (!sortColumn) return filteredSongs;
    return [...filteredSongs].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (sortColumn === 'tempo') {
        const aTempo = aValue !== null && aValue !== undefined ? Number(aValue) : -Infinity;
        const bTempo = bValue !== null && bValue !== undefined ? Number(bValue) : -Infinity;
        if (aTempo < bTempo) return sortDirection === 'asc' ? -1 : 1;
        if (aTempo > bTempo) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      const aComparable = (aValue || '').toString().toLowerCase();
      const bComparable = (bValue || '').toString().toLowerCase();
      if (aComparable < bComparable) return sortDirection === 'asc' ? -1 : 1;
      if (aComparable > bComparable) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSongs, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedSongs.length / itemsPerPage);
  const currentSongs = sortedSongs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <p className="text-center text-slate-300">Loading songs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
        <div className="w-full sm:w-1/2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        {showAddButton && localSelectedSongs.size > 0 && (
          <button
            onClick={handleAddSelected}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
          >
            <Plus size={20} className="mr-2" />
            Add {localSelectedSongs.size} Song{localSelectedSongs.size !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full divide-y divide-slate-600">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <span className="sr-only">Select</span>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Title {renderSortIcon('title')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('original_artist')}
              >
                <div className="flex items-center">
                  Artist {renderSortIcon('original_artist')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('key_signature')}
              >
                <div className="flex items-center">
                  Key {renderSortIcon('key_signature')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('tempo')}
              >
                <div className="flex items-center">
                  Tempo (BPM) {renderSortIcon('tempo')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {currentSongs.map((song) => (
              <tr key={song.id} className="hover:bg-slate-700 transition-colors">
                <td className="px-4 py-4">
                  <button
                    onClick={() => handleSongToggle(song)}
                    className={`p-2 rounded-full transition-colors ${
                      localSelectedSongs.has(song.id) || allSetlistSongs.has(song.id)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                    disabled={allSetlistSongs.has(song.id) && !localSelectedSongs.has(song.id)}
                  >
                    {localSelectedSongs.has(song.id) || allSetlistSongs.has(song.id) ? <Minus size={16} /> : <Plus size={16} />}
                  </button>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-slate-100">{song.title}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{song.original_artist}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{song.key_signature || '-'}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{song.tempo !== null && song.tempo !== undefined ? `${song.tempo} BPM` : '-'}</td>
                {song.performance_note && (
                  <td className="px-4 py-4 text-sm text-amber-300 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                    <span>{song.performance_note}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {currentSongs.map((song) => (
          <div key={song.id} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-zinc-100 mb-1">{song.title}</h3>
                <p className="text-sm text-zinc-400 mb-1">{song.original_artist}</p>
                {song.key_signature && (
                  <p className="text-sm text-zinc-500">Key: {song.key_signature}</p>
                )}
                {song.tempo !== null && song.tempo !== undefined && (
                  <p className="text-sm text-zinc-500">Tempo: {song.tempo} BPM</p>
                )}
                {song.performance_note && (
                  <div className="flex items-center space-x-1 mt-2">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                    <span className="text-xs text-amber-300">{song.performance_note}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleSongToggle(song)}
                disabled={allSetlistSongs.has(song.id) && !localSelectedSongs.has(song.id)}
                className={`ml-4 px-4 py-2 rounded-xl font-medium transition-colors ${
                  localSelectedSongs.has(song.id) || allSetlistSongs.has(song.id)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500'
                } disabled:opacity-50`}
              >
                {localSelectedSongs.has(song.id) || allSetlistSongs.has(song.id) ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-slate-300">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default SongSelector;