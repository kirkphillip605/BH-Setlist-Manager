import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, XCircle, Music, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setTemplatesService } from '../services/setTemplatesService';
import SongSelector from '../components/SongSelector';

const SetTemplateFormPage = () => {
  const { templateId } = useParams();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSongs, setTemplateSongs] = useState([]);
  const [showSongSelector, setShowSongSelector] = useState(false);

  const isEditing = !!templateId;

  useEffect(() => {
    if (isEditing) {
      setPageTitle('Edit Set Template');
      fetchTemplate();
    } else {
      setPageTitle('New Set Template');
      setTemplateName('');
      setTemplateSongs([]);
    }
  }, [templateId, isEditing, setPageTitle]);

  const fetchTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setTemplatesService.getSetTemplateById(templateId);
      setTemplateName(data.name);
      // Transform the data structure to include song details
      const songs = data.set_template_songs
        ?.map(ts => ({
          ...ts.songs,
          song_order: ts.song_order
        }))
        .sort((a, b) => a.song_order - b.song_order) || [];
      setTemplateSongs(songs);
    } catch (err) {
      console.error('Error fetching set template:', err);
      setError(err.message || 'Failed to load set template');
    } finally {
      setLoading(false);
    }
  };

  const handleSongsSelected = (selectedSongs) => {
    const newSongs = selectedSongs.map((song, index) => ({
      ...song,
      song_order: templateSongs.length + index + 1
    }));
    setTemplateSongs(prev => [...prev, ...newSongs]);
    setShowSongSelector(false);
  };

  const handleRemoveSong = (songIndex) => {
    setTemplateSongs(prev => prev.filter((_, index) => index !== songIndex));
  };

  const handleReorderSongs = (fromIndex, toIndex) => {
    setTemplateSongs(prev => {
      const newSongs = [...prev];
      const [removed] = newSongs.splice(fromIndex, 1);
      newSongs.splice(toIndex, 0, removed);
      return newSongs.map((song, index) => ({ ...song, song_order: index + 1 }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const templateData = {
        name: templateName,
        user_id: user.id,
        songs: templateSongs.map((song, index) => ({
          song_id: song.id,
          song_order: index + 1
        }))
      };

      if (isEditing) {
        await setTemplatesService.updateSetTemplate(templateId, templateData);
      } else {
        await setTemplatesService.createSetTemplate(templateData);
      }

      navigate('/set-templates');
    } catch (err) {
      console.error('Error saving set template:', err);
      setError(err.message || 'Failed to save set template');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/set-templates');
  };

  if (loading && isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <p className="text-center text-slate-300">Loading template...</p>
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

      {/* Template Name Form */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-slate-300 mb-2">
              Template Name
            </label>
            <input
              type="text"
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter template name..."
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
              disabled={loading || !templateName.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>

      {/* Template Songs */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-slate-100">Songs in Template</h3>
          <button
            onClick={() => setShowSongSelector(!showSongSelector)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Music size={18} className="mr-2" />
            {showSongSelector ? 'Cancel' : 'Add Songs'}
          </button>
        </div>

        {templateSongs.length === 0 ? (
          <div className="text-center py-8">
            <Music className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-300 text-lg mb-2">No songs in template</p>
            <p className="text-slate-400">Add songs to build your set template</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templateSongs.map((song, index) => (
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

      {/* Song Selector */}
      {showSongSelector && (
        <SongSelector
          onSongsSelected={handleSongsSelected}
          selectedSongs={templateSongs}
        />
      )}
    </div>
  );
};

export default SetTemplateFormPage;