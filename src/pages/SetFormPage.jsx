import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, XCircle, Music, Trash2, GripVertical, BookTemplate as Collection } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setsService } from '../services/setsService';
import { songCollectionsService } from '../services/songCollectionsService';
import SongSelector from '../components/SongSelector';
import SongSelectorModal from '../components/SongSelectorModal';
import CollectionSelectorModal from '../components/CollectionSelectorModal';
import DuplicateModal from '../components/DuplicateModal';
import CollectionDuplicateModal from '../components/CollectionDuplicateModal';

const SetFormPage = () => {
  const { setlistId, setId } = useParams();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setName, setSetName] = useState('');
  const [setSongs, setSetSongs] = useState([]);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collections, setCollections] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showCollectionDuplicateModal, setShowCollectionDuplicateModal] = useState(false);
  const [collectionDuplicates, setCollectionDuplicates] = useState({});
  const [pendingCollectionSongs, setPendingCollectionSongs] = useState([]);

  const isEditing = !!setId;

  useEffect(() => {
    if (isEditing) {
      setPageTitle('Edit Set');
      fetchSet();
    } else {
      setPageTitle('New Set');
      setSetName('');
      setSetSongs([]);
    }
    fetchCollections();
  }, [setId, isEditing, setPageTitle]);

  const fetchSet = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setsService.getSetById(setId);
      setSetName(data.name);
      // Transform the data structure to include song details
      const songs = data.set_songs
        ?.map(ss => ({
          ...ss.songs,
          song_order: ss.song_order
        }))
        .sort((a, b) => a.song_order - b.song_order) || [];
      setSetSongs(songs);
    } catch (err) {
      console.error('Error fetching set:', err);
      setError(err.message || 'Failed to load set');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const data = await songCollectionsService.getAllSongCollections();
      setCollections(data);
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  };

  const handleSongsSelected = (selectedSongs) => {
    // Filter out songs that are already in the set
    const existingSongIds = new Set(setSongs.map(s => s.id));
    const newSongs = selectedSongs.filter(song => !existingSongIds.has(song.id));
    
    if (newSongs.length > 0) {
      const startOrder = setSongs.length + 1;
      const songsWithOrder = newSongs.map((song, index) => ({
        ...song,
        song_order: startOrder + index
      }));
      
      setSetSongs(prev => [...prev, ...songsWithOrder]);
    }
    
    // Close the modal
    setShowSongSelector(false);
  };

  const handleCollectionSelected = async (collection) => {
    try {
      const collectionData = await songCollectionsService.getSongCollectionById(collection.id);
      const collectionSongs = collectionData.song_collection_songs
        ?.map(cs => ({
          ...cs.songs,
          song_order: setSongs.length + cs.song_order
        }))
        .sort((a, b) => a.song_order - b.song_order) || [];
      
      if (collectionSongs.length === 0) {
        setError('Selected collection is empty');
        return;
      }

      // Check for duplicates in the setlist
      const songIds = collectionSongs.map(song => song.id);
      const duplicates = await setsService.checkCollectionDuplicates(setlistId, songIds, setId);
      
      if (Object.keys(duplicates).length > 0) {
        // Show duplicate modal
        setCollectionDuplicates(duplicates);
        setPendingCollectionSongs(collectionSongs);
        setShowCollectionDuplicateModal(true);
      } else {
        // No duplicates, add only new songs
        const existingSongIds = new Set(setSongs.map(s => s.id));
        const newSongs = collectionSongs.filter(song => !existingSongIds.has(song.id));
        
        if (newSongs.length > 0) {
          setSetSongs(prev => [...prev, ...newSongs]);
        }
      }
    } catch (err) {
      console.error('Error loading collection songs:', err);
      setError('Failed to load collection songs');
    }
  };

  const handleSkipDuplicates = () => {
    // Filter out duplicate songs and add the rest
    const duplicateSongIds = new Set();
    Object.values(collectionDuplicates).forEach(setInfo => {
      setInfo.songs.forEach(song => duplicateSongIds.add(song.id));
    });
    
    // Also filter out songs already in current set
    const existingSongIds = new Set(setSongs.map(s => s.id));
    const songsToAdd = pendingCollectionSongs.filter(song => 
      !duplicateSongIds.has(song.id) && !existingSongIds.has(song.id)
    );
    
    if (songsToAdd.length > 0) {
      setSetSongs(prev => [...prev, ...songsToAdd]);
    }
    
    // Clean up state
    setShowCollectionDuplicateModal(false);
    setCollectionDuplicates({});
    setPendingCollectionSongs([]);
  };

  const handleMoveSongs = async (fromSetId, songIds) => {
    try {
      // Move songs from other set to current set
      if (isEditing) {
        await setsService.moveSongsBetweenSets(songIds, fromSetId, setId);
      }
      
      // Update local state - remove moved songs from duplicates
      const updatedDuplicates = { ...collectionDuplicates };
      const setInfo = updatedDuplicates[fromSetId];
      
      if (setInfo) {
        setInfo.songs = setInfo.songs.filter(song => !songIds.includes(song.id));
        if (setInfo.songs.length === 0) {
          delete updatedDuplicates[fromSetId];
        }
      }
      
      setCollectionDuplicates(updatedDuplicates);
      
      // Add moved songs to current set
      const movedSongs = pendingCollectionSongs.filter(song => songIds.includes(song.id));
      
      // Only add songs that aren't already in the set
      const existingSongIds = new Set(setSongs.map(s => s.id));
      const newSongs = movedSongs.filter(song => !existingSongIds.has(song.id));
      
      if (newSongs.length > 0) {
        setSetSongs(prev => [...prev, ...newSongs]);
      }
      
      // If no more duplicates, close modal and add remaining songs
      if (Object.keys(updatedDuplicates).length === 0) {
        handleSkipDuplicates();
      }
      
    } catch (err) {
      console.error('Error moving songs:', err);
      setError('Failed to move songs between sets');
    }
  };

  const handleRemoveSong = (songIndex) => {
    setSetSongs(prev => prev.filter((_, index) => index !== songIndex));
  };

  const handleReorderSongs = (fromIndex, toIndex) => {
    setSetSongs(prev => {
      const newSongs = [...prev];
      const [removed] = newSongs.splice(fromIndex, 1);
      newSongs.splice(toIndex, 0, removed);
      return newSongs.map((song, index) => ({ ...song, song_order: index + 1 }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!setName.trim()) {
      setError('Set name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const setData = {
        name: setName,
        setlist_id: setlistId,
        songs: setSongs.map((song, index) => ({
          song_id: song.id,
          song_order: index + 1
        }))
      };

      if (isEditing) {
        await setsService.updateSet(setId, setData);
        navigate(`/setlists/${setlistId}/sets/${setId}`);
      } else {
        const newSet = await setsService.createSet(setData);
        navigate(`/setlists/${setlistId}/sets/${newSet.id}`);
      }
    } catch (err) {
      console.error('Error saving set:', err);
      // Handle duplicate error
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.type === 'DUPLICATES_FOUND') {
          setShowDuplicateModal(true);
          setDuplicates(errorData.duplicates);
          return;
        }
      } catch (parseError) {
        // Not a JSON error, show regular error
      }
      setError(err.message || 'Failed to save set');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/setlists/${setlistId}`);
  };

  if (loading && isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-center text-slate-300">Loading set...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Set Name Form */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="setName" className="block text-sm font-medium text-slate-300 mb-2">
              Set Name
            </label>
            <input
              type="text"
              id="setName"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter set name..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-slate-600 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <XCircle size={18} className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !setName.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : isEditing ? 'Update Set' : 'Create Set'}
            </button>
          </div>
        </form>
      </div>

      {/* Set Songs */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-lg font-medium text-slate-100">Songs in Set</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {collections.length > 0 && (
              <button
                onClick={() => setShowCollectionModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Collection size={18} className="mr-2" />
                Add from Collection
              </button>
            )}
            <button
              onClick={() => setShowSongSelector(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Music size={18} className="mr-2" />
              Add Songs
            </button>
          </div>
        </div>

        {setSongs.length === 0 ? (
          <div className="text-center py-8">
            <Music className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-300 text-lg mb-2">No songs in set</p>
            <p className="text-slate-400">Add songs to build your set</p>
          </div>
        ) : (
          <div className="space-y-2">
            {setSongs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600"
              >
                <div className="flex items-center space-x-3">
                  <GripVertical className="h-5 w-5 text-slate-400 cursor-move" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {song.title}
                    </p>
                    <p className="text-sm text-slate-400 truncate">
                      {song.original_artist} {song.key_signature && `• ${song.key_signature}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSong(index)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Song Selector Modal */}
      <SongSelectorModal
        isOpen={showSongSelector}
        onClose={() => setShowSongSelector(false)}
        onSongsSelected={handleSongsSelected}
        selectedSongs={setSongs}
        setlistId={setlistId}
      />
      
      {/* Collection Selector Modal */}
      <CollectionSelectorModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        onCollectionSelected={handleCollectionSelected}
      />
      
      {/* Keep the old SongSelector for backward compatibility if needed elsewhere */}
      {false && (
        <SongSelector
          onSongsSelected={handleSongsSelected}
          selectedSongs={setSongs}
          setlistId={setlistId}
        />
      )}
      
      {/* Collection Duplicate Modal */}
      <CollectionDuplicateModal
        isOpen={showCollectionDuplicateModal}
        onClose={() => {
          setCollectionDuplicates({});
          setPendingCollectionSongs([]);
        }}
        duplicates={collectionDuplicates}
        onSkipDuplicates={handleSkipDuplicates}
        onMoveSongs={handleMoveSongs}
        targetSetName={setName || 'this set'}
      />
    </div>
  );
};

export default SetFormPage;