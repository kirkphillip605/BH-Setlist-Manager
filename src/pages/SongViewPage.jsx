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
      <div className="max-w-4xl mx-auto">
        <div className="card-modern p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-300">Loading song details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-xl mb-4">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-modern p-6">
          <p className="text-center text-zinc-300">Song not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="card-modern p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/songs')}
              className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700 transition-all duration-200 rounded-xl btn-animate"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Music className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 mb-1">{song.title}</h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
                  <span>{song.original_artist}</span>
                  {song.key_signature && (
                    <>
                      <span>•</span>
                      <span>Key: {song.key_signature}</span>
                    </>
                  )}
                  {song.tempo !== null && song.tempo !== undefined && (
                    <>
                      <span>•</span>
                      <span>{song.tempo} BPM</span>
                    </>
                  )}
                  {song.performance_note && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                        </svg>
                        <span className="text-amber-300 font-medium">{song.performance_note}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          {user && user.user_level >= 2 && (
            <button
              onClick={handleEditClick}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all btn-animate shadow-lg font-medium"
            >
              <Edit size={18} className="mr-2" />
              Edit Song
            </button>
          )}
        </div>
      </div>

      {/* Lyrics */}
      <div className="card-modern p-4 lg:p-6">
        <div className="flex items-center mb-6">
          <Music className="h-5 w-5 mr-2 text-zinc-400" />
          <h2 className="text-xl font-semibold text-zinc-100">Lyrics</h2>
        </div>
        <div className="prose prose-invert max-w-none">
          <div
            className="text-zinc-200 leading-relaxed text-base" 
            dangerouslySetInnerHTML={{ __html: song.lyrics }}
          />
        </div>
      </div>
    </div>
  );
};

export default SongViewPage;
