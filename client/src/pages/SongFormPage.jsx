import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, XCircle } from 'lucide-react';
import ReactQuill from 'react-quill';

const keySignatures = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 'C# Major',
  'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major', 'Cb Major',
  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor', 'A# Minor',
  'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor', 'Ab Minor'
];

const SongFormPage = () => {
  const { songId } = useParams(); // Get songId from URL for editing
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    original_artist: '',
    title: '',
    key_signature: '',
    lyrics: '',
  });

  const isEditing = useMemo(() => !!songId, [songId]);

  useEffect(() => {
    if (isEditing) {
      const fetchSongForEdit = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/songs/${songId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setFormData({
            original_artist: data.original_artist,
            title: data.title,
            key_signature: data.key_signature,
            lyrics: data.lyrics,
          });
        } catch (err) {
          console.error('Error fetching song for edit:', err);
          setError('Failed to load song for editing. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchSongForEdit();
    } else {
      // Reset form for adding new song
      setFormData({ original_artist: '', title: '', key_signature: '', lyrics: '' });
    }
  }, [songId, isEditing]);

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
      let response;
      if (isEditing) {
        response = await fetch(`/api/songs/${songId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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

  if (loading && isEditing) {
    return (
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading song data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-gray-100">{isEditing ? 'Edit Song' : 'Add New Song'}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900 dark:text-red-200 dark:border-red-700" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label htmlFor="original_artist" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Original Artist</label>
            <input
              type="text"
              id="original_artist"
              name="original_artist"
              value={formData.original_artist}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="key_signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key Signature (Optional)</label>
            <input
              type="text"
              id="key_signature"
              name="key_signature"
              value={formData.key_signature}
              onChange={handleChange}
              list="key-signatures"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <datalist id="key-signatures">
              {keySignatures.map((key) => (
                <option key={key} value={key} />
              ))}
            </datalist>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Lyrics (Rich Text Editor)</label>
            <ReactQuill
              theme="snow"
              value={formData.lyrics}
              onChange={handleLyricsChange}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter lyrics here..."
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <XCircle size={18} className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
