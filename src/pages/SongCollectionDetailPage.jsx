import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, Trash2 } from 'lucide-react';
import { usePageTitle } from '../context/PageTitleContext';
import { songCollectionsService } from '../services/songCollectionsService';
import MobileDragDrop from '../components/MobileDragDrop';

const SongCollectionDetailPage = () => {
  const { collectionId } = useParams();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  const fetchCollection = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await songCollectionsService.getSongCollectionById(collectionId);
      setCollection(data);
      setPageTitle(data.name);
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError(err.message || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSong = async (songId) => {
    const updatedSongs = songs.filter((_, index) => index !== songIndex);
    await updateCollectionSongs(updatedSongs);
  };

  const handleReorderSongs = async (sourceIndex, destinationIndex) => {
    const reorderedSongs = [...songs];
    const [removed] = reorderedSongs.splice(sourceIndex, 1);
    reorderedSongs.splice(destinationIndex, 0, removed);
    
    // Update song_order for all songs
    const updatedSongs = reorderedSongs.map((song, index) => ({
      ...song,
      song_order: index + 1
    }));
    
    await updateCollectionSongs(updatedSongs);
  };
    
  const updateCollectionSongs = async (updatedSongs) => {
    if (!window.confirm('Are you sure you want to make this change?')) {
      return;
    }
    
    try {
      const songsData = updatedSongs.map((song, index) => ({
        song_id: song.id,
        song_order: index + 1
      }));

      await songCollectionsService.updateSongCollection(collectionId, {
        name: collection.name,
        songs: songsData
      });

      await fetchCollection();
    } catch (err) {
      console.error('Error updating songs:', err);
      setError('Failed to update songs');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-center text-slate-300">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error || 'Collection not found'}</span>
        </div>
      </div>
    );
  }

  const songs = collection.song_collection_songs
    ?.map(cs => ({
      ...cs.songs,
      song_order: cs.song_order
    }))
    .sort((a, b) => a.song_order - b.song_order) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/song-collections')}
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{collection.name}</h1>
              <p className="text-slate-400">
                {songs.length} song{songs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/song-collections/edit/${collectionId}`)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={18} className="mr-2" />
            Edit Collection
          </button>
        </div>
      </div>

      {/* Songs Table */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        {songs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-300 text-lg">No songs in this collection</p>
          </div>
        ) : (
          <MobileDragDrop
            items={songs}
            onReorder={handleReorderSongs}
            onRemove={handleRemoveSong}
            type="songs"
            showMoveToSet={false}
          />
        )}
      </div>
    </div>
  );
};

export default SongCollectionDetailPage;