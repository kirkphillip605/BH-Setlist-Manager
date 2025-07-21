import React from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';

function App() {
  const { user, loading, initialized } = useAuth();

  // Show environment error if Supabase is not initialized
  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-6 rounded-xl max-w-2xl w-full">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-2">⚠️ Configuration Error</h1>
            <p className="text-lg">Supabase environment variables are missing</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm mb-4">
            <p className="text-gray-300 mb-2">Please ensure your .env file contains:</p>
            <div className="text-green-400">
              <p>VITE_SUPABASE_URL=your_supabase_url</p>
              <p>VITE_SUPABASE_ANON_KEY=your_anon_key</p>
            </div>
          </div>
          <div className="text-center">
            <p className="mb-2">After updating the .env file:</p>
            <ol className="text-left list-decimal list-inside space-y-1 mb-4">
              <li>Stop the development server (Ctrl+C)</li>
              <li>Restart with: <code className="bg-gray-800 px-2 py-1 rounded">npm run dev</code></li>
              <li>Refresh this page</li>
            </ol>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return null; // Router handles all routing now
}

export default App;