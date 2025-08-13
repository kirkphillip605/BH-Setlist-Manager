import React from 'react';
import { Edit, Trash2, ExternalLink } from 'lucide-react';

const MobileOptimizedTable = ({ 
  items = [], 
  onEdit, 
  onDelete, 
  onView, 
  type = 'items',
  showActions = true,
  extraContent = null 
}) => {
  const handleAction = (action, item, e) => {
    e.stopPropagation();
    action(item);
  };

  const renderItemContent = (item) => {
    switch (type) {
      case 'songs':
        return (
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-100 mb-1 truncate">
              {item.title}
            </h3>
            <p className="text-base text-zinc-300 mb-1">{item.original_artist}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              {item.key_signature && (
                <span className="badge badge-secondary">Key: {item.key_signature}</span>
              )}
              {item.performance_note && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                  <span className="text-amber-300">{item.performance_note}</span>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'setlists':
        return (
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2 truncate">
              {item.name}
            </h3>
            <div className="flex items-center space-x-3">
              {item.is_public ? (
                <span className="badge badge-success">Public</span>
              ) : (
                <span className="badge badge-secondary">Private</span>
              )}
              <span className="text-sm text-zinc-400">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      
      case 'collections':
        return (
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2 truncate">
              {item.name}
            </h3>
            <div className="flex items-center space-x-3">
              {item.is_public ? (
                <span className="badge badge-success">Public</span>
              ) : (
                <span className="badge badge-secondary">Private</span>
              )}
              <span className="text-sm text-zinc-400">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-100 mb-1 truncate">
              {item.title || item.name}
            </h3>
            <p className="text-sm text-zinc-400">
              {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="mobile-table-card"
          onClick={() => onView && onView(item)}
        >
          <div className="flex items-start justify-between">
            {renderItemContent(item)}
            
            {showActions && (
              <div className="flex flex-col space-y-2 ml-4 flex-shrink-0">
                {onView && (
                  <button
                    onClick={(e) => handleAction(onView, item, e)}
                    className="mobile-action-btn flex items-center justify-center"
                    title="View"
                  >
                    <ExternalLink size={20} className="text-zinc-400" />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={(e) => handleAction(onEdit, item, e)}
                    className="mobile-action-btn flex items-center justify-center"
                    title="Edit"
                  >
                    <Edit size={20} className="text-blue-400" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => handleAction(onDelete, item, e)}
                    className="mobile-action-btn flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 size={20} className="text-red-400" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          {extraContent && extraContent(item)}
        </div>
      ))}
    </div>
  );
};

export default MobileOptimizedTable;