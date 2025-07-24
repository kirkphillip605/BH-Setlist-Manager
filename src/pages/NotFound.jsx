import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate(user ? '/' : '/login', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="card-modern p-8 w-full max-w-md text-center fade-in">
        <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <div className="text-6xl">🎵</div>
        </div>
        
        <h1 className="text-3xl font-bold text-zinc-100 mb-4">Page Not Found</h1>
        <p className="text-zinc-300 mb-6">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate(user ? '/' : '/login', { replace: true })}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all btn-animate shadow-lg font-medium"
          >
            <Home size={20} className="mr-2" />
            {user ? 'Go to Dashboard' : 'Go to Login'}
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-zinc-600 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all btn-animate font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Go Back
          </button>
        </div>
        
        <p className="text-xs text-zinc-500 mt-6">
          You'll be automatically redirected in 5 seconds...
        </p>
      </div>
    </div>
  );
};

export default NotFound;