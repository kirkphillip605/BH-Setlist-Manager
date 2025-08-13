import React from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

const CollectionDuplicateModal = ({ 
  isOpen, 
  onClose, 
  duplicates = {}, 
  onSkipDuplicates, 
  onMoveSongs,
  targetSetName = 'current set'
}) => {
  if (!isOpen) return null;

  const duplicateSetIds = Object.keys(duplicates);
  const totalDuplicates = duplicateSetIds.reduce((sum, setId) => sum + duplicates[setId].songs.length, 0);
  const hasMovableDuplicates = duplicateSetIds.some(setId => !duplicates[setId].isCurrentSet);

  const handleMoveSongs = (fromSetId, songIds) => {
    onMoveSongs(fromSetId, songIds);
  };

  const handleMoveAllFromSet = (fromSetId) => {
    const songIds = duplicates[fromSetId].songs.map(song => song.id);
    handleMoveSongs(fromSetId, songIds);
  };

  const handleMoveSingleSong = (fromSetId, songId) => {
    handleMoveSongs(fromSetId, [songId]);
  };

  if (totalDuplicates === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-2 sm:px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-zinc-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full mobile-modal">
          <div className="bg-zinc-800 px-4 sm:px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-900/50">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg sm:text-lg leading-6 font-medium text-zinc-100">
                    Duplicate Songs Found
                  </h3>
                  <p className="text-sm sm:text-sm text-zinc-400 mt-1">
                    {totalDuplicates} song{totalDuplicates !== 1 ? 's' : ''} from the collection already exist in this setlist
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 mobile-action-btn"
              >
                <X className="h-6 w-6 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          <div className="bg-zinc-800 px-4 sm:px-6 pb-4 max-h-96 overflow-y-auto mobile-modal-content scroll-container">
            {duplicateSetIds.map((setId) => {
              const setInfo = duplicates[setId];
              return (
                <div key={setId} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base sm:text-md font-medium text-zinc-100">
                      {setInfo.isCurrentSet ? 'Already in Current Set' : `From "${setInfo.setName}"`} ({setInfo.songs.length} song{setInfo.songs.length !== 1 ? 's' : ''})
                    </h4>
                    {setInfo.isCurrentSet ? (
                      <span className="inline-flex items-center px-3 py-2 sm:px-3 sm:py-1 bg-gray-600 text-gray-300 text-sm rounded-lg mobile-action-btn">
                        Already in Set
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMoveAllFromSet(setId)}
                        className="inline-flex items-center px-3 py-2 sm:px-3 sm:py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors mobile-action-btn"
                      >
                        <ArrowRight size={16} className="mr-1 sm:w-3 sm:h-3" />
                        Move All to {targetSetName}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3 sm:space-y-2">
                    {setInfo.songs.map((song) => (
                      <div key={song.id} className="flex items-center justify-between p-4 sm:p-3 bg-zinc-700 rounded-xl">
                        <div className="flex-1">
                          <p className="text-base sm:text-sm font-medium text-zinc-100">{song.title}</p>
                          <p className="text-sm sm:text-xs text-zinc-400">{song.original_artist}</p>
                        </div>
                        {setInfo.isCurrentSet ? (
                          <span className="inline-flex items-center px-3 py-2 sm:px-3 sm:py-1 bg-gray-600 text-gray-300 text-sm rounded-lg mobile-action-btn">
                            Already in Set
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMoveSingleSong(setId, song.id)}
                            className="inline-flex items-center px-3 py-2 sm:px-3 sm:py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors mobile-action-btn"
                          >
                            <ArrowRight size={16} className="mr-1 sm:w-3 sm:h-3" />
                            Move to {targetSetName}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-zinc-700 px-4 sm:px-6 py-4 sm:py-4 flex flex-col sm:flex-row-reverse space-y-3 sm:space-y-0 sm:space-x-reverse sm:space-x-3">
            <button
              type="button"
              onClick={onSkipDuplicates}
              className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-green-600 text-base sm:text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mobile-form-button"
            >
              {hasMovableDuplicates ? 'Skip All Duplicates' : 'Continue Without Adding Duplicates'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-zinc-600 shadow-sm px-4 py-3 sm:py-2 bg-zinc-800 text-base sm:text-sm font-medium text-zinc-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mobile-form-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDuplicateModal;