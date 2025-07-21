import React, { useState } from 'react';
import { User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { Link } from 'react-router-dom';

const Header = ({ onToggleSidebar }) => {
  const { user, signOut } = useAuth();
  const { pageTitle } = usePageTitle();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-blue-900 shadow-lg border-b border-slate-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Mobile menu button */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors mr-3"
          >
            <Menu size={24} />
          </button>
          
          {/* Page title */}
          <div className="text-xl lg:text-2xl font-bold text-slate-100">
            {pageTitle}
          </div>
        </div>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button 
              onClick={toggleDropdown} 
              className="flex items-center p-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            >
              <User size={24} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-10">
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/edit-profile"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Edit Profile
                  </Link>
                  <Link
                    to="/change-password"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Change Password
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
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