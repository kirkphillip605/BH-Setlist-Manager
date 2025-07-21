import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, Trash2 } from 'lucide-react';
import { usePageTitle } from '../context/PageTitleContext';
import { setsService } from '../services/setsService';

const SetDetailPage = () => {
  const { setlistId, setId } = useParams();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();
  
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSet();
  }, [setId]);

  const fetchSet = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setsService.getSetById(setId);
      setSet(data);
      setPageTitle(`${data.name} - ${data.setlists?.name || 'Set'}`);
    } catch (err) {
      console.error('Error fetching set:', err);
      setError(err.message || 'Failed to load set');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSong = async (songId) => {
    if (!window.confirm('Are you sure you want to remove this song from the set?')) {
      return;
    }
    
    try {
      const updatedSongs = set.set_songs
        .filter(ss => ss.songs.id !== songId)
        .map((ss, index) => ({
          song_id: ss.songs.id,
          song_order: index + 1
        }));

      await setsService.updateSet(setId, {
        name: set.name,
        songs: updatedSongs
      });

      await fetchSet();
    } catch (err) {
      console.error('Error removing song:', err);
      setError('Failed to remove song from set');
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {songs.map((song) => (
                  <tr key={song.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-slate-100">{song.title}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{song.original_artist}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{song.key_signature || '-'}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleRemoveSong(song.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Remove from Set"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetDetailPage;