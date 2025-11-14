import React, { useState, useEffect } from 'react';
import { X, Music, BookTemplate as Collection } from 'lucide-react';
import { songCollectionsService } from '../services/songCollectionsService';

const CollectionSelectorModal = ({ 
  isOpen, 
  onClose, 
  onCollectionSelected 
}) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await songCollectionsService.getAllSongCollections();
      setCollections(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionSelect = (collection) => {
    onCollectionSelected(collection);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-zinc-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-zinc-800 px-6 pt-6 pb-4 border-b border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Collection className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-100">Select Collection</h3>
                  <p className="text-sm text-zinc-400">Choose a collection to add songs from</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-zinc-800 px-6 py-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-zinc-300">Loading collections...</p>
              </div>
            ) : error ? (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-xl">
                <p>{error}</p>
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-12">
                <Collection className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 mb-2">No collections available</p>
                <p className="text-sm text-zinc-500">Create a collection first to use this feature</p>
              </div>
            ) : (
              <div className="space-y-3">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleCollectionSelect(collection)}
                    className="w-full text-left p-4 bg-zinc-700 rounded-xl border border-zinc-600 hover:bg-zinc-600 hover:border-zinc-500 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{collection.name}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          {collection.is_public ? (
                            <span className="px-2 py-1 bg-emerald-600/20 text-emerald-300 text-xs rounded-full border border-emerald-600/30">
                              Public
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-zinc-600/50 text-zinc-400 text-xs rounded-full border border-zinc-600">
                              Private
                            </span>
                          )}
                          <span className="text-xs text-zinc-400">
                            {new Date(collection.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                          <Plus size={16} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-zinc-700 px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-zinc-600 rounded-xl text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionSelectorModal;