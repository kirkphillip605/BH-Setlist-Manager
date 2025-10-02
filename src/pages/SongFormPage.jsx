import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, XCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import { songsService } from '../services/songsService';
import { usePageTitle } from '../context/PageTitleContext';
import { useAuth } from '../context/AuthContext';
import MobileFormContainer from '../components/MobileFormContainer';

const keySignatures = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 'C# Major',
  'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major', 'Cb Major',
  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor', 'A# Minor',
  'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor', 'Ab Minor'
];

const SongFormPage = () => {
  const { songId } = useParams(); // Get songId from URL for editing
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    original_artist: '',
    title: '',
    key_signature: '',
    tempo: '',
    performance_note: '',
    lyrics: '',
  });

  const isEditing = useMemo(() => !!songId, [songId]);

  // Check permissions
  useEffect(() => {
    if (!user || user.user_level < 2) {
      navigate('/songs');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isEditing) {
      const fetchSongForEdit = async () => {
        setPageTitle('Edit Song');
        setLoading(true);
        setError(null);
        try {
          const data = await songsService.getSongById(songId);
          setFormData({
            original_artist: data.original_artist,
            title: data.title,
            key_signature: data.key_signature,
            tempo: data.tempo ?? '',
            performance_note: data.performance_note || '',
            lyrics: data.lyrics,
          });
        } catch (err) {
          console.error('Error fetching song for edit:', err);
          setError(err.message || 'Failed to load song for editing. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchSongForEdit();
    } else {
      // Reset form for adding new song
      setPageTitle('Add New Song');
      setFormData({ original_artist: '', title: '', key_signature: '', tempo: '', performance_note: '', lyrics: '' });
    }
  }, [songId, isEditing, setPageTitle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLyricsChange = (value) => {
    setFormData((prev) => ({ ...prev, lyrics: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await songsService.updateSong(songId, formData);
      } else {
        await songsService.createSong(formData);
      }

      // Redirect after successful save
      if (isEditing) {
        navigate(`/songs/${songId}`); // Go back to the song view page
      } else {
        navigate('/songs'); // Go back to the manage songs list
      }
    } catch (err) {
      console.error('Error saving song:', err);
      setError(err.message || 'Failed to save song. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      navigate(`/songs/${songId}`); // Go back to the song view page
    } else {
      navigate('/songs'); // Go back to the manage songs list
    }
  };

  // Quill modules and formats
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  // Don't render if user doesn't have permission
  if (!user || user.user_level < 2) {
    return null;
  }

  if (loading && isEditing) {
    return (
      <MobileFormContainer title={isEditing ? "Edit Song" : "Add Song"}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-300">Loading song data...</p>
        </div>
      </MobileFormContainer>
    );
  }

  const formActions = (
    <>
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-zinc-600 rounded-xl text-zinc-300 bg-zinc-700 hover:bg-zinc-600 transition-colors mobile-form-button"
      >
        <XCircle size={20} className="mr-2" />
        Cancel
      </button>
      <button
        type="submit"
        form="song-form"
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mobile-form-button"
      >
        <Save size={20} className="mr-2" />
        {loading ? 'Saving...' : 'Save Song'}
      </button>
    </>
  );

  return (
    <MobileFormContainer 
      title={isEditing ? "Edit Song" : "Add Song"}
      subtitle={isEditing ? `Editing: ${formData.title}` : "Add a new song to your library"}
      actions={formActions}
      loading={loading}
    >
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="card-modern p-4 sm:p-6">
        <form id="song-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-4 mobile-form-grid">
          <div className="md:col-span-6">
            <label htmlFor="title" className="block text-base sm:text-sm font-medium text-zinc-300 mb-3 sm:mb-2">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-modern"
              required
            />
          </div>
          <div className="md:col-span-6">
            <label htmlFor="original_artist" className="block text-base sm:text-sm font-medium text-zinc-300 mb-3 sm:mb-2">Original Artist</label>
            <input
              type="text"
              id="original_artist"
              name="original_artist"
              value={formData.original_artist}
              onChange={handleChange}
              className="input-modern"
              required
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="key_signature" className="block text-base sm:text-sm font-medium text-zinc-300 mb-3 sm:mb-2">Key Signature (Optional)</label>
            <input
              type="text"
              id="key_signature"
              name="key_signature"
              value={formData.key_signature}
              onChange={handleChange}
              list="key-signatures"
              className="input-modern"
            />
            <datalist id="key-signatures">
              {keySignatures.map((key) => (
                <option key={key} value={key} />
              ))}
            </datalist>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="tempo" className="block text-base sm:text-sm font-medium text-zinc-300 mb-3 sm:mb-2">Tempo (BPM)</label>
            <div className="relative">
              <input
                type="number"
                id="tempo"
                name="tempo"
                value={formData.tempo}
                onChange={handleChange}
                className="input-modern pr-16"
                placeholder="e.g., 120"
                min="0"
                inputMode="numeric"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-sm font-medium text-zinc-400 pointer-events-none">BPM</span>
            </div>
          </div>
          <div className="md:col-span-12">
            <label htmlFor="performance_note" className="block text-base sm:text-sm font-medium text-zinc-300 mb-3 sm:mb-2">Performance Note (Optional)</label>
            <input
              type="text"
              id="performance_note"
              name="performance_note"
              value={formData.performance_note}
              onChange={handleChange}
              className="input-modern"
              placeholder="e.g., Change guitars, Solo by John..."
            />
          </div>
          <div className="col-span-1 md:col-span-12">
            <label htmlFor="lyrics" className="block text-base sm:text-sm font-medium text-zinc-300 mb-3 sm:mb-2">Lyrics (Rich Text Editor)</label>
            <ReactQuill
              theme="snow"
              value={formData.lyrics}
              onChange={handleLyricsChange}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter lyrics here..."
              className="bg-zinc-700 text-zinc-100 border-zinc-600"
            />
          </div>
        </form>
      </div>
    </MobileFormContainer>
  );
};

export default SongFormPage;