import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, Search, Users, Settings, ZoomIn, ZoomOut } from 'lucide-react';

const MobilePerformanceLayout = ({
  children,
  sidebar,
  currentSong,
  currentSongLyrics,
  isLeader,
  onExit,
  onShowFollowers,
  onShowSearch,
  showSearch,
  searchContent,
  setlistName,
  currentSetName,
  isSearchSong,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  lyricsZoom
}) => {
  const [showLyrics, setShowLyrics] = useState(false);


  return (
    <div className="h-screen bg-zinc-950 flex flex-col safe-area-inset-top">
      {/* Mobile Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-zinc-100 truncate">{setlistName}</h1>
            <p className="text-sm text-zinc-400 truncate">
              {isLeader ? '👑 Leader' : '👥 Follower'} • {currentSetName}
              {isSearchSong && <span className="text-amber-400"> • 🎵 Search Song</span>}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isLeader && (
              <>
                <button
                  onClick={onShowSearch}
                  className="p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
                >
                  <Search size={20} />
                </button>
                <button
                  onClick={onShowFollowers}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Users size={20} />
                </button>
              </>
            )}
            <button
              onClick={onExit}
              className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="absolute inset-0 z-50 bg-zinc-950">
          {searchContent}
        </div>
      )}

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Side-by-side layout */}
        <div className="hidden lg:flex flex-1">
          <div className="w-80 bg-zinc-900 border-r border-zinc-800">
            {sidebar}
          </div>
          <div className="flex-1 relative">
            {/* Zoomable lyrics container */}
            <div className="h-full overflow-auto p-6 performance-zoom-container">
              <div className="mobile-zoom-container" style={{ 
                transform: `scale(${lyricsZoom})`, 
                transformOrigin: 'top left',
                width: lyricsZoom > 1 ? `${100 / lyricsZoom}%` : '100%',
                lineHeight: 1.6,
                wordWrap: 'break-word'
              }}>
              {children}
              </div>
            </div>
            {/* Zoom controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-1">
              <button
                onClick={onZoomIn}
                className="p-3 bg-zinc-800/95 backdrop-blur text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={onZoomOut}
                className="p-3 bg-zinc-800/95 backdrop-blur text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={onResetZoom}
                className="px-3 py-2 bg-zinc-800/95 backdrop-blur text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600 text-xs font-medium"
                title="Reset Zoom"
              >
                {Math.round(lyricsZoom * 100)}%
              </button>
            </div>
          </div>
        </div>

        {/* Tablet: Collapsible sidebar */}
        <div className="hidden md:flex lg:hidden flex-1">
          <div className="w-64 bg-zinc-900 border-r border-zinc-800">
            {sidebar}
          </div>
          <div className="flex-1 relative">
            <div className="h-full overflow-auto p-4 performance-zoom-container">
              <div className="mobile-zoom-container" style={{ 
                transform: `scale(${lyricsZoom})`, 
                transformOrigin: 'top left',
                width: lyricsZoom > 1 ? `${100 / lyricsZoom}%` : '100%',
                lineHeight: 1.6,
                wordWrap: 'break-word'
              }}>
              {children}
              </div>
            </div>
            <div className="absolute top-4 right-4 flex space-x-1">
              <button
                onClick={onZoomIn}
                className="p-2 bg-zinc-800/95 backdrop-blur text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={onZoomOut}
                className="p-2 bg-zinc-800/95 backdrop-blur text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={onResetZoom}
                className="px-2 py-1 bg-zinc-800/95 backdrop-blur text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all shadow-lg border border-zinc-600 text-xs font-medium"
                title="Reset Zoom"
              >
                {Math.round(lyricsZoom * 100)}%
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: Songs list with overlay lyrics */}
        <div className="md:hidden flex-1 flex flex-col">
          {!showLyrics ? (
            // Songs list view
            <div className="flex-1 overflow-auto">
              {sidebar}
            </div>
          ) : (
            // Lyrics overlay view
            <div className="flex-1 flex flex-col bg-zinc-950">
              <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-zinc-100 truncate">{currentSong?.title}</h2>
                  <p className="text-sm text-zinc-400 truncate">
                    {currentSong?.original_artist} {currentSong?.key_signature && `• ${currentSong.key_signature}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <button
                      onClick={onZoomIn}
                      className="p-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                      title="Zoom In"
                    >
                      <div className="relative">
                        <Search size={16} />
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-bold text-white">+</span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={onZoomOut}
                      className="p-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                      title="Zoom Out"
                    >
                      <div className="relative">
                        <Search size={16} />
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-bold text-white">−</span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={onResetZoom}
                      className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-xs font-medium"
                      title="Reset Zoom"
                    >
                      {Math.round(lyricsZoom * 100)}%
                    </button>
                  </div>
                  <button
                    onClick={() => setShowLyrics(false)}
                    className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="mobile-zoom-container" style={{ 
                  transform: `scale(${lyricsZoom})`, 
                  transformOrigin: 'top left',
                  width: lyricsZoom > 1 ? `${100 / lyricsZoom}%` : '100%',
                  lineHeight: 1.6,
                  wordWrap: 'break-word'
                }}>
                  {children}
                </div>
              </div>
            </div>
          )}

          {/* Current Song Footer - Only show when not in lyrics view */}
          {!showLyrics && currentSong && (
            <div className="bg-zinc-900 border-t border-zinc-800 p-4">
              <button
                onClick={() => setShowLyrics(true)}
                className="w-full text-left p-3 bg-zinc-800 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-zinc-100 truncate">{currentSong.title}</p>
                    <p className="text-sm text-zinc-400 truncate">
                      {currentSong.original_artist} {currentSong.key_signature && `• ${currentSong.key_signature}`}
                    </p>
                  </div>
                  <ChevronUp size={20} className="text-zinc-400 ml-2" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobilePerformanceLayout;