import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, Music } from 'lucide-react';
import { songsService } from '../services/songsService';
import { usePageTitle } from '../context/PageTitleContext';
import { useAuth } from '../context/AuthContext';

const SongViewPage = () => {
  const { songId } = useParams();
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSong = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await songsService.getSongById(songId);
        setSong(data);
        setPageTitle(`${data.title} - ${data.original_artist}`);
      } catch (err) {
        console.error('Error fetching song:', err);
        setError(err.message || 'Failed to load song. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (songId) {
      fetchSong();
    }
  }, [songId, setPageTitle]);

  const handleEditClick = () => {
    navigate(`/songs/edit/${songId}`); // Navigate to the dedicated edit song page
  };

  if (loading) {
    return (
      <div className="form-max-width">
        <div className="theme-card p-6">
          <div className="text-center py-8">
            <div className="loading-spinner w-12 h-12 border-2 mx-auto mb-4"></div>
            <p className="text-body">Loading song details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-max-width">
        <div className="alert-error">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="form-max-width">
        <div className="theme-card p-6">
          <p className="text-center text-body">Song not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-max-width section-spacing">
      {/* Header */}
      <div className="theme-card theme-card-content">
        <div className="theme-card-header">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/songs')}
              className="btn-icon"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Music className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-heading-xl mb-1">{song.title}</h1>
                <div className="flex items-center space-x-2 text-sm text-muted">
                  <span>{song.original_artist}</span>
                  {song.key_signature && (
                    <>
                      <span>•</span>
                      <span>Key: {song.key_signature}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          {user && user.user_level >= 2 && (
            <button
              onClick={handleEditClick}
              className="btn-primary"
            >
              <Edit size={18} className="mr-2" />
              Edit Song
            </button>
          )}
        </div>
      </div>

      {/* Lyrics */}
      <div className="theme-card theme-card-content">
        <h2 className="text-heading-lg mb-6 flex items-center">
          <Music className="h-5 w-5 mr-2 text-muted" />
          Lyrics
        </h2>
        <div className="prose-theme">
          <div
            className="ql-editor p-0 text-body leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: song.lyrics }}
          />
        </div>
      </div>
    </div>
  );
};

export default SongViewPage;
