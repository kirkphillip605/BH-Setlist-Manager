import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileFormContainer = ({ 
  title, 
  subtitle, 
  onBack, 
  children, 
  actions,
  loading = false 
}) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 safe-area-inset-top">
      <div className="max-w-4xl mx-auto">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-6 safe-area-inset-top">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="mobile-action-btn flex items-center justify-center"
              disabled={loading}
            >
              <ArrowLeft size={24} className="text-zinc-400" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-zinc-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 safe-area-inset-bottom">
          {children}
          
          {/* Actions */}
          {actions && (
            <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 safe-area-inset-bottom">
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                {actions}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFormContainer;