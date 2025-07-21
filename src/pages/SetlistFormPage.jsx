import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, XCircle, Music, Trash2, GripVertical, BookTemplate as Template } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { setlistsService } from '../services/setlistsService';
import { songCollectionsService } from '../services/songCollectionsService';
import SongSelector from '../components/SongSelector';

const SetlistFormPage = () => {
  const { setlistId } = useParams();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setlistName, setSetlistName] = useState('');
  const [setlistSongs, setSetlistSongs] = useState([]);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const isEditing = !!setlistId;

  useEffect(() => {
    if (isEditing) {
      setPageTitle('Edit Setlist');
      fetchSetlist();
    } else {
      setPageTitle('New Setlist');
      setSetlistName('');
      setSetlistSongs([]);
    }
    fetchTemplates();
  }, [setlistId, isEditing, setPageTitle]);

  const fetchSetlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setlistsService.getSetlistById(setlistId);
      setSetlistName(data.name);
      // Transform the data structure to include song details
      const songs = data.setlist_songs
        ?.map(ss => ({
          ...ss.songs,
          song_order: ss.song_order
        }))
        .sort((a, b) => a.song_order - b.song_order) || [];
      setSetlistSongs(songs);
    } catch (err) {
      console.error('Error fetching setlist:', err);
      setError(err.message || 'Failed to load setlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await songCollectionsService.getAllSongCollections();
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleSongsSelected = (selectedSongs) => {
    const newSongs = selectedSongs.map((song, index) => ({
      ...song,
      song_order: setlistSongs.length + index + 1
    }));
    setSetlistSongs(prev => [...prev, ...newSongs]);
    setShowSongSelector(false);
  };

  const handleTemplateSelected = async (template) => {
    try {
      const templateData = await songCollectionsService.getSongCollectionById(template.id);
      const templateSongs = templateData.song_collection_songs
        ?.map(cs => ({
          ...cs.songs,
          song_order: setlistSongs.length + cs.song_order
        }))
        .sort((a, b) => a.song_order - b.song_order) || [];
      
      setSetlistSongs(prev => [...prev, ...templateSongs]);
      setShowTemplateSelector(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error('Error loading template songs:', err);
      setError('Failed to load template songs');
    }
  };

  const handleRemoveSong = (songIndex) => {
    setSetlistSongs(prev => prev.filter((_, index) => index !== songIndex));
  };

  const handleReorderSongs = (fromIndex, toIndex) => {
    setSetlistSongs(prev => {
      const newSongs = [...prev];
      const [removed] = newSongs.splice(fromIndex, 1);
      newSongs.splice(toIndex, 0, removed);
      return newSongs.map((song, index) => ({ ...song, song_order: index + 1 }));
    });
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
        user_id: user.id,
        songs: setlistSongs.map((song, index) => ({
          song_id: song.id,
          song_order: index + 1
        }))
      };

      if (isEditing) {
        await setlistsService.updateSetlist(setlistId, setlistData);
      } else {
        await setlistsService.createSetlist(setlistData);
      }

      navigate('/setlists');
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

      {/* Setlist Songs */}
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-lg font-medium text-slate-100">Songs in Setlist</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {templates.length > 0 && (
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Template size={18} className="mr-2" />
                {showTemplateSelector ? 'Cancel' : 'Add from Template'}
              </button>
            )}
            <button
              onClick={() => setShowSongSelector(!showSongSelector)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Music size={18} className="mr-2" />
              {showSongSelector ? 'Cancel' : 'Add Songs'}
            </button>
          </div>
        </div>

        {setlistSongs.length === 0 ? (
          <div className="text-center py-8">
            <Music className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-300 text-lg mb-2">No songs in setlist</p>
            <p className="text-slate-400">Add songs to build your setlist</p>
          </div>
        ) : (
          <div className="space-y-2">
            {setlistSongs.map((song, index) => (
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

      {/* Template Selector */}
      {showTemplateSelector && (
        <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
          <h3 className="text-lg font-medium text-slate-100 mb-4">Select Template</h3>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelected(template)}
                className="w-full text-left p-4 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-600 transition-colors"
              >
                <p className="text-sm font-medium text-slate-100">{template.name}</p>
                <p className="text-sm text-slate-400">
                  Created {new Date(template.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Song Selector */}
      {showSongSelector && (
        <SongSelector
          onSongsSelected={handleSongsSelected}
          selectedSongs={setlistSongs}
        />
      )}
    </div>
  );
};

export default SetlistFormPage;