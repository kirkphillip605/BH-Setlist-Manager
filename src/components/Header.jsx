import React, { useState } from 'react';
import { User, LogOut, Menu, Settings, UserCircle, Lock, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Header = ({ onToggleSidebar, sidebarCollapsed, onToggleCollapse }) => {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Mobile menu button */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all duration-200 mr-3 btn-animate"
          >
            <Menu size={24} />
          </button>
          
          {/* Collapse button for desktop */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all duration-200 btn-animate"
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
          <div className="relative">
            <button 
              onClick={toggleDropdown} 
              className="flex items-center space-x-2 p-2 rounded-xl text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-all duration-200 btn-animate"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium">{user.name}</span>
              </div>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 glass rounded-2xl shadow-2xl border border-zinc-600/30 z-50 fade-in">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-zinc-700/50 mb-2">
                    <p className="text-sm font-medium text-zinc-100">{user.name}</p>
                    <p className="text-xs text-zinc-400">{user.email}</p>
                    <p className="text-xs text-zinc-500 mt-1">Level {user.user_level} User</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <UserCircle size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/edit-profile"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Edit Profile</span>
                  </Link>
                  <Link
                    to="/change-password"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Lock size={16} />
                    <span>Change Password</span>
                  </Link>
                  <div className="border-t border-zinc-700/50 mt-2 pt-2">
                  <button
                    onClick={() => {
                      signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-all duration-200"
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