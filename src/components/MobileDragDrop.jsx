import React, { useState } from 'react';
import { GripVertical, Trash2, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';

const MobileDragDrop = ({ 
  items, 
  onReorder, 
  onRemove, 
  onMoveToSet, 
  availableSets = [],
  type = 'songs',
  showMoveToSet = false
}) => {
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleMoveUp = (index) => {
    if (index > 0) {
      onReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index) => {
    if (index < items.length - 1) {
      onReorder(index, index + 1);
    }
  };

  const handleItemClick = (item, index) => {
    if (reorderMode) {
      setSelectedItem(selectedItem === index ? null : index);
    }
  };

  return (
    <div className="space-y-3">
      {/* Reorder mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-zinc-100">Songs in Set</h3>
        <button
          onClick={() => {
            setReorderMode(!reorderMode);
            setSelectedItem(null);
          }}
          className={`px-4 py-2 rounded-xl transition-colors font-medium ${
            reorderMode 
              ? 'bg-amber-600 text-white hover:bg-amber-700' 
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {reorderMode ? 'Done' : 'Reorder'}
        </button>
      </div>

      {items.map((item, index) => (
        <div
          key={`${item.id}-${index}`}
          className={`p-4 rounded-xl border transition-all ${
            selectedItem === index
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-zinc-800 border-zinc-700 text-zinc-300'
          } ${reorderMode ? 'cursor-pointer' : ''}`}
          onClick={() => handleItemClick(item, index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {reorderMode && (
                <GripVertical className="h-5 w-5 text-zinc-400" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium truncate">
                  {item.title}
                </p>
                <p className="text-sm opacity-75 truncate">
                  {item.original_artist} {item.key_signature && `• ${item.key_signature}`}
                </p>
                {item.performance_note && (
                  <div className="flex items-center space-x-1 mt-1">
                    <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                    <span className="text-amber-300 text-xs">{item.performance_note}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {reorderMode && selectedItem === index && (
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(index);
                    }}
                    disabled={index === 0}
                    className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(index);
                    }}
                    disabled={index === items.length - 1}
                    className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
              
              {!reorderMode && (
                <>
                  {showMoveToSet && availableSets.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onMoveToSet(item.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="text-sm bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-zinc-300"
                      defaultValue=""
                    >
                      <option value="">Move to...</option>
                      {availableSets.map((set) => (
                        <option key={set.id} value={set.id}>
                          {set.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => onRemove(index)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-400">No {type} yet</p>
        </div>
      )}
    </div>
  );
};

export default MobileDragDrop;