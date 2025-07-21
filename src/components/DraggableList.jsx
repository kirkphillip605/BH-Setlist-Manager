import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, Trash2, ArrowRight } from 'lucide-react';

const DraggableList = ({ 
  items, 
  onReorder, 
  onRemove, 
  onMoveToSet, 
  availableSets = [],
  type = 'songs',
  showMoveToSet = false
}) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    onReorder(sourceIndex, destinationIndex);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="songs-list">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''} transition-colors rounded-lg p-2`}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-lg border ${
                      snapshot.isDragging 
                        ? 'border-blue-500 shadow-lg' 
                        : 'border-slate-600 hover:bg-slate-600'
                    } transition-all`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        {...provided.dragHandleProps}
                        className="flex items-center text-slate-400 hover:text-slate-300 cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-400 truncate">
                          {item.original_artist} {item.key_signature && `• ${item.key_signature}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {showMoveToSet && availableSets.length > 0 && (
                        <div className="relative group">
                          <button
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Move to another set"
                          >
                            <ArrowRight size={16} />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="py-1">
                              <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-600">
                                Move to set:
                              </div>
                              {availableSets.map((set) => (
                                <button
                                  key={set.id}
                                  onClick={() => onMoveToSet(item.id, set.id)}
                                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                                >
                                  {set.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => onRemove(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Remove from set"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-300">No {type} yet</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableList;