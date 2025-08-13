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
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-zinc-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-zinc-800 px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-900/50">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-zinc-100">
                    Duplicate Songs Found
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {totalDuplicates} song{totalDuplicates !== 1 ? 's' : ''} from the collection already exist in this setlist
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="bg-zinc-800 px-6 pb-4 max-h-96 overflow-y-auto">
            {duplicateSetIds.map((setId) => {
              const setInfo = duplicates[setId];
              return (
                <div key={setId} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-zinc-100">
                      {setInfo.isCurrentSet ? 'Already in Current Set' : `From "${setInfo.setName}"`} ({setInfo.songs.length} song{setInfo.songs.length !== 1 ? 's' : ''})
                    </h4>
                    {setInfo.isCurrentSet ? (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-600 text-gray-300 text-sm rounded-lg">
                        Already in Set
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMoveAllFromSet(setId)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ArrowRight size={14} className="mr-1" />
                        Move All to {targetSetName}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {setInfo.songs.map((song) => (
                      <div key={song.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-100">{song.title}</p>
                          <p className="text-xs text-zinc-400">{song.original_artist}</p>
                        </div>
                        {setInfo.isCurrentSet ? (
                          <span className="inline-flex items-center px-3 py-1 bg-gray-600 text-gray-300 text-sm rounded-lg">
                            Already in Set
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMoveSingleSong(setId, song.id)}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ArrowRight size={14} className="mr-1" />
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

          <div className="bg-zinc-700 px-6 py-4 sm:flex sm:flex-row-reverse space-y-2 sm:space-y-0 sm:space-x-reverse sm:space-x-3">
            <button
              type="button"
              onClick={onSkipDuplicates}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm"
            >
              {hasMovableDuplicates ? 'Skip All Duplicates' : 'Continue Without Adding Duplicates'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-lg border border-zinc-600 shadow-sm px-4 py-2 bg-zinc-800 text-base font-medium text-zinc-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
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