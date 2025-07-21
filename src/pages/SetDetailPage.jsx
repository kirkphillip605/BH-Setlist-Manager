import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { usePageTitle } from '../context/PageTitleContext';
import { setsService } from '../services/setsService';
import { setlistsService } from '../services/setlistsService';

const SetDetailPage = () => {
  const { setlistId, setId } = useParams();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();
  
  const [set, setSet] = useState(null);
  const [availableSets, setAvailableSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSetAndAvailableSets();
  }, [setId]);

  const fetchSetAndAvailableSets = async () => {
    setLoading(true);
    setError(null);
    try {
      const [setData, setlistData] = await Promise.all([
        setsService.getSetById(setId),
        setlistsService.getSetlistById(setlistId)
      ]);
      
      setSet(setData);
      setPageTitle(`${setData.name} - ${setData.setlists?.name || 'Set'}`);
      
      // Get other sets in the same setlist for moving songs
      const otherSets = setlistData.sets?.filter(s => s.id !== setId) || [];
      setAvailableSets(otherSets);
    } catch (err) {
      console.error('Error fetching set:', err);
      setError(err.message || 'Failed to load set');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSong = async (songId) => {
    const updatedSongs = songs.filter((_, index) => index !== songIndex);
    await updateSetSongs(updatedSongs);
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
    
    await updateSetSongs(updatedSongs);
  };

  const handleMoveToSet = async (songId, targetSetId) => {
    try {
      await setsService.moveSongToSet(songId, setId, targetSetId);
      await fetchSetAndAvailableSets(); // Refresh data
    } catch (err) {
      console.error('Error moving song:', err);
      setError('Failed to move song');
    }
  };
    
  const updateSetSongs = async (updatedSongs) => {
    try {
      const songsData = updatedSongs.map((song, index) => ({
        song_id: song.id,
        song_order: index + 1
      }));

      await setsService.updateSet(setId, {
        name: set.name,
        songs: songsData
      });

      // Update local state
      setSet(prev => ({
        ...prev,
        set_songs: updatedSongs.map((song, index) => ({
          songs: song,
          song_order: index + 1
        }))
      }));
    } catch (err) {
      console.error('Error updating songs:', err);
      setError('Failed to update songs');
    }
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-center text-slate-300">Loading set...</p>
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error || 'Set not found'}</span>
        </div>
      </div>
    );
  }

  const songs = set.set_songs
    ?.map(ss => ({
      ...ss.songs,
      song_order: ss.song_order
    }))
    .sort((a, b) => a.song_order - b.song_order) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/setlists/${setlistId}`)}
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{set.name}</h1>
              <p className="text-slate-400">
                {songs.length} song{songs.length !== 1 ? 's' : ''} • {set.setlists?.name || 'Setlist'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/setlists/${setlistId}/sets/${setId}/edit`)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={18} className="mr-2" />
            Edit Set
          </button>
        </div>
      </div>

      {/* Songs Table */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        {songs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-300 text-lg">No songs in this set</p>
          </div>
        ) : (
            <div className="space-y-2">
              {songs.map((song, index) => (
                <div
                  key={`${song.id}-${index}`}
                  className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {song.title}
                      </p>
                      <p className="text-sm text-slate-300 truncate">
                        {song.original_artist} {song.key_signature && `• ${song.key_signature}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {availableSets.length > 0 && (
                      <div className="relative group">
                        <button
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Move to another set"
                        >
                          <ArrowRight size={16} />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <div className="py-1">
                            <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-600">
                              Move to set:
                            </div>
                            {availableSets.map((set) => (
                              <button
                                key={set.id}
                                onClick={() => handleMoveToSet(song.id, set.id)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                              >
                                {set.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveSong(index)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Remove from Set"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default SetDetailPage;