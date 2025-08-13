import React from 'react';
import { Users, X, User, Crown } from 'lucide-react';

const FollowersModal = ({ isOpen, onClose, followers = [], sessionData }) => {
  if (!isOpen) return null;

  const totalParticipants = followers.length + 1; // +1 for the leader

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-zinc-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-zinc-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-900/50">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-zinc-100">Session Participants</h3>
                  <p className="text-sm text-zinc-400">
                    {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''} • {sessionData?.setlists?.name || 'Session'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 mobile-action-btn"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="bg-zinc-800 px-6 pb-6 max-h-96 overflow-y-auto scroll-container">
            <div className="space-y-3">
              {/* Current Leader */}
              <div className="flex items-center p-3 bg-gradient-to-r from-amber-600/20 to-amber-500/10 rounded-xl border border-amber-500/30">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                  {sessionData?.users?.name ? (
                    <span className="text-white font-medium text-sm">
                      {sessionData.users.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Crown size={20} className="text-white" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-zinc-100">
                    {sessionData?.users?.name || 'Session Leader'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Crown size={14} className="text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Leader</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-amber-400">Active</span>
                </div>
              </div>

              {/* Followers */}
              {followers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No followers have joined yet</p>
                  <p className="text-sm text-zinc-500 mt-1">They will appear here when they join the session</p>
                </div>
              ) : (
                followers.map((follower) => (
                  <div key={follower.id} className="flex items-center p-3 bg-zinc-700 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {follower.name ? follower.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-zinc-100">{follower.name || 'Unknown User'}</p>
                      <div className="flex items-center space-x-2">
                        <Users size={14} className="text-blue-400" />
                        <span className="text-xs text-blue-400 font-medium">Follower</span>
                        {follower.role && (
                          <>
                            <span className="text-xs text-zinc-500">•</span>
                            <span className="text-xs text-zinc-400">{follower.role}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-400">Active</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Session Info */}
            <div className="mt-6 pt-4 border-t border-zinc-700">
              <div className="text-center">
                <p className="text-xs text-zinc-500">
                  Session started {new Date(sessionData?.created_at).toLocaleTimeString()}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Session ID: {sessionData?.id?.slice(-8)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;