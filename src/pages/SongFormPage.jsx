import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, XCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import { songsService } from '../services/songsService';
import { usePageTitle } from '../context/PageTitleContext';
import { useAuth } from '../context/AuthContext';

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
      setFormData({ original_artist: '', title: '', key_signature: '', performance_note: '', lyrics: '' });
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
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading song data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="original_artist" className="block text-sm font-medium text-slate-300 mb-2">Original Artist</label>
            <input
              type="text"
              id="original_artist"
              name="original_artist"
              value={formData.original_artist}
              onChange={handleChange}
              className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label htmlFor="key_signature" className="block text-sm font-medium text-slate-300 mb-2">Key Signature (Optional)</label>
            <input
              type="text"
              id="key_signature"
              name="key_signature"
              value={formData.key_signature}
              onChange={handleChange}
              list="key-signatures"
              className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <datalist id="key-signatures">
              {keySignatures.map((key) => (
                <option key={key} value={key} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="performance_note" className="block text-sm font-medium text-slate-300 mb-2">Performance Note (Optional)</label>
            <input
              type="text"
              id="performance_note"
              name="performance_note"
              value={formData.performance_note}
              onChange={handleChange}
              className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Change guitars, Solo by John..."
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="lyrics" className="block text-sm font-medium text-slate-300 mb-2">Lyrics (Rich Text Editor)</label>
            <ReactQuill
              theme="snow"
              value={formData.lyrics}
              onChange={handleLyricsChange}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter lyrics here..."
              className="bg-slate-700 text-slate-100 border-slate-600"
            />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-3">
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
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : 'Save Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SongFormPage;