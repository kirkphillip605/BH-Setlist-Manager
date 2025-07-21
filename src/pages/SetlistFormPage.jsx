import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setlistsService } from '../services/setlistsService';

const SetlistFormPage = () => {
  const { setlistId } = useParams();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setlistName, setSetlistName] = useState('');

  const isEditing = !!setlistId;

  useEffect(() => {
    if (isEditing) {
      setPageTitle('Edit Setlist');
      fetchSetlist();
    } else {
      setPageTitle('New Setlist');
      setSetlistName('');
    }
  }, [setlistId, isEditing, setPageTitle]);

  const fetchSetlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setlistsService.getSetlistById(setlistId);
      setSetlistName(data.name);
    } catch (err) {
      console.error('Error fetching setlist:', err);
      setError(err.message || 'Failed to load setlist');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!setlistName.trim()) {
      setError('Setlist name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const setlistData = {
        name: setlistName,
        user_id: user.id
      };

      if (isEditing) {
        await setlistsService.updateSetlist(setlistId, setlistData);
        navigate(`/setlists/${setlistId}`);
      } else {
        const newSetlist = await setlistsService.createSetlist(setlistData);
        navigate(`/setlists/${newSetlist.id}`);
      }
    } catch (err) {
      console.error('Error saving setlist:', err);
      setError(err.message || 'Failed to save setlist');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/setlists');
  };

  if (loading && isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-center text-slate-300">Loading setlist...</p>
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

      {/* Setlist Name Form */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="setlistName" className="block text-sm font-medium text-slate-300 mb-2">
              Setlist Name
            </label>
            <input
              type="text"
              id="setlistName"
              value={setlistName}
              onChange={(e) => setSetlistName(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter setlist name..."
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
              disabled={loading || !setlistName.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : isEditing ? 'Update Setlist' : 'Create Setlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetlistFormPage;