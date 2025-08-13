import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Music, ListMusic, LayoutTemplate, Users, X, Headphones, User, LogOut, Settings, UserCircle, Lock, PanelLeftClose, PanelLeftOpen, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, collapsed }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/songs', label: 'Songs', icon: Music },
    { path: '/song-collections', label: 'Collections', icon: LayoutTemplate },
    { path: '/setlists', label: 'Setlists', icon: ListMusic },
    { path: '/performance', label: 'Performance Mode', icon: Play },
  ];

  const adminItems = user?.user_level === 3 ? [
    { path: '/admin/users', label: 'User Management', icon: Users },
  ] : [];

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 ${collapsed ? 'w-16' : 'w-64 sm:w-72'} 
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        bg-zinc-900 border-r border-zinc-800
        flex flex-col shadow-2xl safe-area-inset-top safe-area-inset-left
      `}>
        {/* Header */}
        <div className={`flex items-center ${collapsed ? 'justify-center p-4' : 'justify-between p-4 sm:p-6'} border-b border-zinc-800`}>
          {!collapsed && (
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Headphones size={24} className="text-white sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-lg font-bold text-zinc-100 tracking-tight">Bad Habits</h1>
              <p className="text-xs sm:text-xs text-zinc-400">Setlist Management</p>
            </div>
          </div>
          )}
          
          {/* Desktop collapse button */}
          <div className="hidden lg:flex">
            <button
              onClick={() => {/* This will be handled by parent */}}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200 btn-animate"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
          
          {collapsed && (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Headphones size={20} className="text-white" />
            </div>
          )}
          <button
            onClick={onClose}
            className={`lg:hidden p-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200 btn-animate mobile-action-btn ${collapsed ? 'hidden' : ''}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3 sm:px-4'} py-4 sm:py-6 space-y-1 sm:space-y-2 overflow-y-auto scroll-container`}>
          {menuItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              title={collapsed ? label : ''}
              className={`
                group flex items-center ${collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-4'} rounded-2xl text-sm sm:text-sm font-medium transition-all duration-200 relative mobile-nav-item
                ${isActive(path) 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }
              `}
            >
              <Icon size={24} className={`${collapsed ? '' : 'mr-4'} ${isActive(path) ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'} sm:w-5 sm:h-5`} />
              {!collapsed && (
              <div className="flex-1">
                <div className={`font-medium text-base sm:text-sm ${isActive(path) ? 'text-white' : 'text-zinc-300'}`}>{label}</div>
              </div>
              )}
            </Link>
          ))}

          {/* User Management for Admin Users */}
          {user?.user_level === 3 && (
            <Link
              to="/admin/users"
              onClick={onClose}
              title={collapsed ? 'User Management' : ''}
              className={`
                group flex items-center ${collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-4'} rounded-2xl text-sm sm:text-sm font-medium transition-all duration-200 relative mobile-nav-item
                ${isActive('/admin/users') 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }
              `}
            >
              <Users size={24} className={`${collapsed ? '' : 'mr-4'} ${isActive('/admin/users') ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'} sm:w-5 sm:h-5`} />
              {!collapsed && (
              <div className="flex-1">
                <div className={`font-medium text-base sm:text-sm ${isActive('/admin/users') ? 'text-white' : 'text-zinc-300'}`}>User Management</div>
              </div>
              )}
            </Link>
          )}
        </nav>
        
        {/* User Profile Section - Always at bottom */}
        <div className={`border-t border-zinc-800 ${collapsed ? 'p-2' : 'p-4'} safe-area-inset-bottom`}>
          {user && (
            <div className="relative">
              <button 
                onClick={toggleDropdown} 
                title={collapsed ? `${user.name} - Level ${user.user_level}` : ''}
                className={`
                  group flex items-center w-full ${collapsed ? 'justify-center p-4' : 'p-4'} rounded-2xl text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200 relative mobile-nav-item
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-white sm:w-4 sm:h-4" />
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base sm:text-sm text-zinc-100 truncate">{user.name}</div>
                      <div className="text-sm sm:text-xs text-zinc-400">Level {user.user_level} User</div>
                    </div>
                  )}
                </div>
              </button>
              
              {isDropdownOpen && (
                <div className={`absolute ${collapsed ? 'left-16 bottom-0' : 'right-0 bottom-full'} mb-3 w-64 sm:w-56 bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-600 z-50 fade-in mobile-modal`}>
                  <div className="p-3 sm:p-2">
                    <div className="px-4 py-3 sm:px-3 sm:py-2 border-b border-zinc-700/50 mb-2">
                      <p className="text-base sm:text-sm font-medium text-zinc-100">{user.name}</p>
                      <p className="text-sm sm:text-xs text-zinc-400">{user.email}</p>
                      <p className="text-sm sm:text-xs text-zinc-500 mt-1">Level {user.user_level} User</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200 mobile-nav-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onClose();
                      }}
                    >
                      <UserCircle size={20} className="sm:w-4 sm:h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/edit-profile"
                      className="flex items-center space-x-3 px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200 mobile-nav-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onClose();
                      }}
                    >
                      <Settings size={20} className="sm:w-4 sm:h-4" />
                      <span>Edit Profile</span>
                    </Link>
                    <Link
                      to="/change-password"
                      className="flex items-center space-x-3 px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200 mobile-nav-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onClose();
                      }}
                    >
                      <Lock size={20} className="sm:w-4 sm:h-4" />
                      <span>Change Password</span>
                    </Link>
                    <div className="border-t border-zinc-700/50 mt-3 pt-3 sm:mt-2 sm:pt-2">
                      <button
                        onClick={() => {
                          signOut();
                          setIsDropdownOpen(false);
                          onClose();
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-all duration-200 mobile-nav-item"
                      >
                        <LogOut size={20} className="sm:w-4 sm:h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!collapsed && (
            <div className="mt-4 pt-4 sm:mt-3 sm:pt-3 border-t border-zinc-700/30">
              <p className="text-xs text-zinc-500 px-4 sm:px-3">© 2025 Bad Habits Band</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;