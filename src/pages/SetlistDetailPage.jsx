import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Music, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setlistsService } from '../services/setlistsService';
import { setsService } from '../services/setsService';

const SetlistDetailPage = () => {
  const { setlistId } = useParams();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setlist, setSetlist] = useState(null);
  const [sets, setSets] = useState([]);

  useEffect(() => {
    fetchSetlistAndSets();
  }, [setlistId]);

  const fetchSetlistAndSets = async () => {
    setLoading(true);
    setError(null);
    try {
      const setlistData = await setlistsService.getSetlistById(setlistId);
      setSetlist(setlistData);
      setSets(setlistData.sets || []);
      setPageTitle(setlistData.name);
    } catch (err) {
      console.error('Error fetching setlist:', err);
      setError(err.message || 'Failed to load setlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async (setId) => {
    if (!window.confirm('Are you sure you want to delete this set?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setsService.deleteSet(setId);
      await fetchSetlistAndSets();
    } catch (err) {
      console.error('Error deleting set:', err);
      setError(err.message || 'Failed to delete set');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-center text-slate-300">Loading setlist...</p>
        </div>
      </div>
    );
  }

  if (error || !setlist) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error || 'Setlist not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/setlists')}
              className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{setlist.name}</h1>
              <p className="text-slate-400">
                {sets.length} set{sets.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => navigate(`/setlists/edit/${setlistId}`)}
              className="inline-flex items-center px-4 py-2 bg-slate-600 text-slate-100 rounded-lg hover:bg-slate-500 transition-colors"
            >
              <Edit size={18} className="mr-2" />
              Edit Setlist
            </button>
            <button
              onClick={() => navigate(`/setlists/${setlistId}/sets/add`)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              Create New Set
            </button>
          </div>
        </div>
      </div>

      {/* Sets List */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        {sets.length === 0 ? (
          <div className="text-center py-12">
            <Music className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-300 text-lg mb-2">No sets in this setlist</p>
            <p className="text-slate-400 mb-6">Create your first set to get started</p>
            <button
              onClick={() => navigate(`/setlists/${setlistId}/sets/add`)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={20} className="mr-2" />
              Create Set
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sets.map((set, index) => (
              <div
                key={set.id}
                className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-100">{set.name}</h3>
                    <p className="text-sm text-slate-400">
                      Created {new Date(set.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/setlists/${setlistId}/sets/${set.id}/edit`)}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit Set"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteSet(set.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Delete Set"
                  >
                    <Trash2 size={18} />
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

export default SetlistDetailPage;