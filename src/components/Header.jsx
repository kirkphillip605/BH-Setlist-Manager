import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Menu, Settings, UserCircle, Lock, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Header = ({ onToggleSidebar, sidebarCollapsed, onToggleCollapse }) => {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40 shadow-lg">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Mobile menu button */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="mobile-menu-button mr-3"
          >
            <Menu size={24} />
          </button>
          
          {/* Collapse button for desktop */}
          <div className="desktop-only">
            <button
              onClick={onToggleCollapse}
              className="btn-icon"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>
        </div>
        
        {/* Spacer to push user menu to the right */}
        <div className="flex-1"></div>

        {/* User menu */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={toggleDropdown} 
              className="flex items-center space-x-2 p-2 rounded-xl text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200 transform active:scale-95"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium">{user.name}</span>
              </div>
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-content">
                  <div className="dropdown-header">
                    <p className="text-sm font-medium text-heading">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                    <p className="text-xs text-subtle mt-1">Level {user.user_level} User</p>
                  </div>
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <UserCircle size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/edit-profile"
                    className="dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Edit Profile</span>
                  </Link>
                  <Link
                    to="/change-password"
                    className="dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Lock size={16} />
                    <span>Change Password</span>
                  </Link>
                  <div className="dropdown-divider">
                  <button
                    onClick={() => {
                      signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="dropdown-item text-red-400 hover:text-red-300 hover:bg-red-900/20 w-full"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;