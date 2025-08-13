import React, { useState, useEffect } from 'react';
import { Crown, Clock, CheckCircle, X } from 'lucide-react';

const LeadershipRequestModal = ({ 
  isOpen, 
  onClose, 
  requestingUserName, 
  onAllow, 
  onReject,
  autoApproveAfter = 30 
}) => {
  const [countdown, setCountdown] = useState(autoApproveAfter);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoApproveAfter);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onAllow(); // Auto-approve when countdown reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoApproveAfter, onAllow]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity"></div>
        
        <div className="inline-block align-bottom bg-zinc-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-zinc-800 px-6 pt-6 pb-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-900/50">
                <Crown className="h-6 w-6 text-amber-400" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-zinc-100">Leadership Request</h3>
                <p className="text-sm text-zinc-400">
                  <strong>{requestingUserName}</strong> wants to take over as leader for this session
                </p>
              </div>
            </div>
            
            <div className="bg-zinc-700 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-amber-300">
                <Clock size={20} />
                <span className="text-lg font-mono">{countdown}s</span>
              </div>
              <p className="text-sm text-zinc-400 text-center mt-2">
                Auto-approve in {countdown} second{countdown !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="bg-zinc-700 px-6 py-4 flex flex-col sm:flex-row-reverse space-y-3 sm:space-y-0 sm:space-x-reverse sm:space-x-3">
            <button
              onClick={onAllow}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <CheckCircle size={16} className="mr-2" />
              Allow ({countdown}s)
            </button>
            <button
              onClick={onReject}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-zinc-600 shadow-sm px-6 py-3 bg-zinc-800 text-base font-medium text-zinc-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <X size={16} className="mr-2" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadershipRequestModal;