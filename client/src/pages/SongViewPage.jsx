import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';

const SongViewPage = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSong = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/songs/${songId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSong(data);
      } catch (err) {
        console.error('Error fetching song:', err);
        setError('Failed to load song. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (songId) {
      fetchSong();
    }
  }, [songId]);

  const handleEditClick = () => {
    navigate(`/songs/edit/${songId}`); // Navigate to the dedicated edit song page
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading song details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900 dark:text-red-200 dark:border-red-700" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
        <p className="text-center text-gray-600 dark:text-gray-400">Song not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-1">{song.title}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">{song.original_artist}</p>
          {song.key_signature && (
            <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Key: {song.key_signature}</p>
          )}
        </div>
        <button
          onClick={handleEditClick}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          title="Edit Song"
        >
          <Edit size={18} className="mr-2" />
          Edit
        </button>
      </div>

      <hr className="my-6 border-gray-200 dark:border-gray-700" />

      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-100 mb-4">Lyrics</h2>
        {/* Render HTML content from Quill editor */}
        <div
          className="ql-editor p-0" // Apply Quill editor styles for rendering
          dangerouslySetInnerHTML={{ __html: song.lyrics }}
        />
      </div>
    </div>
  );
};

export default SongViewPage;
