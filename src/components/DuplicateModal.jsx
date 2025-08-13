import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DuplicateModal = ({ isOpen, onClose, duplicates = [], onRemoveDuplicates, onKeepInCurrentSet, onKeepInOriginalSet, type = 'set' }) => {
  if (!isOpen) return null;

  const handleRemoveDuplicates = () => {
    onRemoveDuplicates();
    onClose();
  };

  const handleKeepInCurrent = () => {
    onKeepInCurrentSet();
    onClose();
  };

  const handleKeepInOriginal = () => {
    onKeepInOriginalSet();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-2 sm:px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75 backdrop-blur-sm"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full mobile-modal">
          <div className="bg-white dark:bg-slate-800 px-4 sm:px-6 pt-6 pb-4 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg sm:text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  Duplicate Songs Found
                </h3>
                <div className="mt-2">
                  <p className="text-base sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
                    The following songs already exist in other {type === 'set' ? 'sets within this setlist' : 'locations'}:
                  </p>
                  <div className="max-h-40 overflow-y-auto scroll-container">
                    {duplicates.map((duplicate, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-slate-700 p-4 sm:p-3 rounded-xl mb-3 sm:mb-2">
                        <p className="text-base sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                          {duplicate.songs?.title} by {duplicate.songs?.original_artist}
                        </p>
                        {duplicate.sets?.name && (
                          <p className="text-sm sm:text-xs text-gray-600 dark:text-gray-400">
                            Currently in: {duplicate.sets.name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700 px-4 sm:px-6 py-4 sm:py-3 flex flex-col sm:flex-row-reverse space-y-3 sm:space-y-0 sm:space-x-reverse sm:space-x-3">
            {type === 'set' && (
              <>
                <button
                  type="button"
                  onClick={handleKeepInCurrent}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-blue-600 text-base sm:text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mobile-form-button"
                >
                  Keep in Current Set
                </button>
                <button
                  type="button"
                  onClick={handleKeepInOriginal}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-3 sm:py-2 bg-white dark:bg-slate-800 text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mobile-form-button"
                >
                  Keep in Original Set
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleRemoveDuplicates}
              className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-red-600 text-base sm:text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mobile-form-button"
            >
              Remove Duplicates
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-3 sm:py-2 bg-white dark:bg-slate-800 text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mobile-form-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateModal;