import React from 'react';
import { Users, X, User } from 'lucide-react';

const FollowersModal = ({ isOpen, onClose, followers = [], sessionData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
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
                    {followers.length + 1} participant{followers.length !== 0 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-200 transition-colors p-2"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="bg-zinc-800 px-6 pb-6">
            <div className="space-y-3">
              {/* Current Leader */}
              <div className="flex items-center p-3 bg-zinc-700 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-zinc-100">{sessionData?.users?.name || 'You'}</p>
                  <p className="text-xs text-amber-400 flex items-center">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                    Leader
                  </p>
                </div>
              </div>

              {/* Followers */}
              {followers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No followers have joined yet</p>
                  <p className="text-sm text-zinc-500 mt-1">They will appear here when they join</p>
                </div>
              ) : (
                followers.map((follower, index) => (
                  <div key={index} className="flex items-center p-3 bg-zinc-700 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-zinc-100">{follower.name}</p>
                      <p className="text-xs text-blue-400 flex items-center">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                        Follower
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;