import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, XCircle, Music, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { songCollectionsService } from '../services/songCollectionsService';
import SongSelector from '../components/SongSelector';
import SongSelectorModal from '../components/SongSelectorModal';

const SongCollectionFormPage = () => {
  const { collectionId } = useParams();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collectionName, setCollectionName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [collectionSongs, setCollectionSongs] = useState([]);
  const [showSongSelector, setShowSongSelector] = useState(false);

  const isEditing = !!collectionId;

  useEffect(() => {
    if (isEditing) {
      setPageTitle('Edit Song Collection');
      fetchCollection();
    } else {
      setPageTitle('New Song Collection');
      setCollectionName('');
      setCollectionSongs([]);
    }
  }, [collectionId, isEditing, setPageTitle]);

  const fetchCollection = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await songCollectionsService.getSongCollectionById(collectionId);
      setCollectionName(data.name);
      setIsPublic(data.is_public || false);
      // Transform the data structure to include song details
      const songs = data.song_collection_songs
        ?.map(cs => ({
          ...cs.songs,
          song_order: cs.song_order
        }))
        .sort((a, b) => a.song_order - b.song_order) || [];
      setCollectionSongs(songs);
    } catch (err) {
      console.error('Error fetching song collection:', err);
      setError(err.message || 'Failed to load song collection');
    } finally {
      setLoading(false);
    }
  };

  const handleSongsSelected = (selectedSongs) => {
    // Only add songs that aren't already in the collection
    const existingSongIds = new Set(collectionSongs.map(s => s.id));
    const newSongs = selectedSongs
      .filter(song => !existingSongIds.has(song.id))
      .map((song, index) => ({
        ...song,
        song_order: collectionSongs.length + index + 1
      }));
    
    if (newSongs.length > 0) {
      setCollectionSongs(prev => [...prev, ...newSongs]);
    }
  };

  const handleRemoveSong = (songIndex) => {
    setCollectionSongs(prev => prev.filter((_, index) => index !== songIndex));
  };

  const handleReorderSongs = (fromIndex, toIndex) => {
    setCollectionSongs(prev => {
      const newSongs = [...prev];
      const [removed] = newSongs.splice(fromIndex, 1);
      newSongs.splice(toIndex, 0, removed);
      return newSongs.map((song, index) => ({ ...song, song_order: index + 1 }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!collectionName.trim()) {
      setError('Collection name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const collectionData = {
        name: collectionName,
        user_id: user.id,
        is_public: isPublic,
        songs: collectionSongs.map((song) => ({
          song_id: song.id,
          song_order: song.song_order
        }))
      };

      if (isEditing) {
        await songCollectionsService.updateSongCollection(collectionId, collectionData);
        navigate(`/song-collections/${collectionId}`);
      } else {
        const newCollection = await songCollectionsService.createSongCollection(collectionData);
        // Route directly to add songs page for new collections
        navigate(`/song-collections/edit/${newCollection.id}`);
      }
    } catch (err) {
      console.error('Error saving song collection:', err);
      setError(err.message || 'Failed to save song collection');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/song-collections');
  };

  if (loading && isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-center text-slate-300">Loading collection...</p>
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

      {/* Collection Name Form */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="collectionName" className="block text-sm font-medium text-slate-300 mb-2">
              Collection Name
            </label>
            <input
              type="text"
              id="collectionName"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter collection name..."
              required
            />
          </div>
         
         <div className="flex items-center">
           <input
             id="isPublic"
             type="checkbox"
             checked={isPublic}
             onChange={(e) => setIsPublic(e.target.checked)}
             className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-600 rounded bg-slate-700"
           />
           <label htmlFor="isPublic" className="ml-2 block text-sm text-slate-300">
             Make this collection public (visible to all users)
           </label>
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
              disabled={loading || !collectionName.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : isEditing ? 'Update Collection' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>

      {/* Collection Songs */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-slate-100">Songs in Collection</h3>
          <button
            onClick={() => setShowSongSelector(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Music size={18} className="mr-2" />
            Add Songs
          </button>
        </div>

        {collectionSongs.length === 0 ? (
          <div className="text-center py-8">
            <Music className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-300 text-lg mb-2">No songs in collection</p>
            <p className="text-slate-400">Add songs to build your collection</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collectionSongs.map((song, index) => (
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
        selectedSongs={collectionSongs}
      />
    </div>
  );
};

export default SongCollectionFormPage;
