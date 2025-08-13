import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, Music } from 'lucide-react';
import Fuse from 'fuse.js';
import { songsService } from '../services/songsService';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';

const SongSelectorModal = ({ 
  isOpen, 
  onClose, 
  onSongsSelected, 
  selectedSongs = [], 
  setlistId = null 
}) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [localSelectedSongs, setLocalSelectedSongs] = useState(new Set());
  const [allSetlistSongs, setAllSetlistSongs] = useState(new Set());

  // Configure Fuse.js for fuzzy search
  const fuseOptions = {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'original_artist', weight: 0.3 }
    ],
    threshold: 0.4, // Lower = more strict, higher = more fuzzy
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2
  };

  const fuse = useMemo(() => new Fuse(songs, fuseOptions), [songs]);

  useEffect(() => {
    if (isOpen) {
      fetchSongs();
      if (setlistId) {
        fetchSetlistSongs();
      }
    }
  }, [isOpen, setlistId]);

  useEffect(() => {
    // Reset local selection when modal opens
    if (isOpen) {
      setLocalSelectedSongs(new Set());
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [isOpen]);

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
    onClose();
  };

  // Smart search that handles fuzzy matching and special characters
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return songs;
    }

    // Use Fuse.js for fuzzy search
    const fuseResults = fuse.search(searchQuery);
    return fuseResults.map(result => result.item);
  }, [songs, searchQuery, fuse]);

  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const currentSongs = searchResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Check if song is already in the current selection (from props)
  const isAlreadySelected = (songId) => {
    return selectedSongs.some(s => (s.id || s) === songId);
  };

  // Check if song is already in setlist
  const isInSetlist = (songId) => {
    return allSetlistSongs.has(songId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-zinc-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-zinc-800 px-6 pt-6 pb-4 border-b border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Music className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-100">Add Songs</h3>
                  <p className="text-sm text-zinc-400">
                    {localSelectedSongs.size > 0 && `${localSelectedSongs.size} selected • `}
                    {searchResults.length} songs available
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {localSelectedSongs.size > 0 && (
                  <button
                    onClick={handleAddSelected}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus size={16} className="mr-2" />
                    Add {localSelectedSongs.size} Song{localSelectedSongs.size !== 1 ? 's' : ''}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search songs by title or artist..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-zinc-700 border border-zinc-600 text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-zinc-400"
                autoFocus
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-zinc-800 px-6 py-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-zinc-300">Loading songs...</p>
              </div>
            ) : error ? (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-xl">
                <p>{error}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentSongs.map((song) => {
                  const alreadySelected = isAlreadySelected(song.id);
                  const inSetlist = isInSetlist(song.id);
                  const locallySelected = localSelectedSongs.has(song.id);
                  const isDisabled = alreadySelected || (inSetlist && !locallySelected);

                  return (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        locallySelected
                          ? 'bg-blue-600/20 border-blue-500'
                          : alreadySelected
                            ? 'bg-green-600/20 border-green-500'
                            : inSetlist
                              ? 'bg-gray-600/20 border-gray-500'
                              : 'bg-zinc-700 border-zinc-600 hover:bg-zinc-650'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{song.title}</p>
                        <p className="text-sm text-zinc-400 truncate">
                          {song.original_artist} {song.key_signature && `• ${song.key_signature}`}
                        </p>
                        {song.performance_note && (
                          <div className="flex items-center space-x-1 mt-1">
                            <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                            </svg>
                            <span className="text-xs text-amber-300">{song.performance_note}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {alreadySelected ? (
                          <span className="px-3 py-2 bg-green-600 text-white text-sm rounded-xl font-medium">
                            Already in Set
                          </span>
                        ) : inSetlist && !locallySelected ? (
                          <span className="px-3 py-2 bg-gray-600 text-white text-sm rounded-xl font-medium">
                            In Setlist
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSongToggle(song)}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                              locallySelected
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500'
                            }`}
                          >
                            {locallySelected ? 'Selected' : 'Select'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {searchResults.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <Music className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400">No songs found for "{searchQuery}"</p>
                    <p className="text-sm text-zinc-500 mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-zinc-700 px-6 py-4 border-t border-zinc-600">
              <div className="flex justify-center">
                <nav className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-zinc-300">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-zinc-700 px-6 py-4 flex justify-between items-center">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-zinc-600 rounded-xl text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            {localSelectedSongs.size > 0 && (
              <button
                onClick={handleAddSelected}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={16} className="mr-2" />
                Add {localSelectedSongs.size} Song{localSelectedSongs.size !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongSelectorModal;