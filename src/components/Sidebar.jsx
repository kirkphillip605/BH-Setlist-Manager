import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Music, ListMusic, LayoutTemplate, Users, X, Headphones, User, LogOut, Settings, UserCircle, Lock, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  ];

  const adminItems = user?.user_level === 3 ? [
    { path: '/admin/users', label: 'User Management', icon: Users },
  ] : [];

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 ${collapsed ? 'w-16' : 'w-64'} 
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        bg-zinc-900 border-r border-zinc-800
        flex flex-col shadow-2xl
      `}>
        {/* Header */}
        <div className={`flex items-center ${collapsed ? 'justify-center p-4' : 'justify-between p-4 lg:p-6'} border-b border-zinc-800`}>
          {!collapsed && (
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Headphones size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Bad Habits</h1>
              <p className="text-xs text-zinc-400">Setlist Management</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Headphones size={20} className="text-white" />
            </div>
          )}
          <button
            onClick={onClose}
            className={`lg:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200 btn-animate ${collapsed ? 'hidden' : ''}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3 lg:px-4'} py-6 space-y-2 overflow-y-auto`}>
          {menuItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              title={collapsed ? label : ''}
              className={`
                group flex items-center ${collapsed ? 'px-3 py-3 justify-center' : 'px-3 py-3'} rounded-2xl text-sm font-medium transition-all duration-200 relative
                ${isActive(path) 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }
              `}
            >
              <Icon size={20} className={`mr-3 ${isActive(path) ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {!collapsed && (
              <div className="flex-1">
                <div className={`font-medium ${isActive(path) ? 'text-white' : 'text-zinc-300'}`}>{label}</div>
              </div>
              )}
            </Link>
          ))}

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <>
              {!collapsed && (
              <div className="pt-8 pb-4">
                <span className="text-zinc-500 uppercase font-bold text-xs px-3 tracking-wider">
                  Administration
                </span>
              </div>
              )}
              {adminItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={onClose}
                  title={collapsed ? label : ''}
                  className={`
                    group flex items-center ${collapsed ? 'px-3 py-3 justify-center' : 'px-3 py-3'} rounded-2xl text-sm font-medium transition-all duration-200 relative
                    ${isActive(path) 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    }
                  `}
                >
                  <Icon size={20} className={`${isActive(path) ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'} ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && (
                  <div className="flex-1">
                    <div className={`font-medium ${isActive(path) ? 'text-white' : 'text-zinc-300'}`}>{label}</div>
                  </div>
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>
        
        {/* User Profile Section - Always at bottom */}
        <div className={`border-t border-zinc-800 ${collapsed ? 'p-2' : 'p-4'}`}>
          {user && (
            <div className="relative">
              <button 
                onClick={toggleDropdown} 
                title={collapsed ? `${user.name} - Level ${user.user_level}` : ''}
                className={`
                  group flex items-center w-full ${collapsed ? 'justify-center p-3' : 'p-3'} rounded-2xl text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200 relative
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-zinc-100 truncate">{user.name}</div>
                      <div className="text-xs text-zinc-400">Level {user.user_level} User</div>
                    </div>
                  )}
                </div>
              </button>
              
              {isDropdownOpen && (
                <div className={`absolute ${collapsed ? 'left-16 bottom-0' : 'right-0 bottom-full'} mb-3 w-56 glass rounded-2xl shadow-2xl border border-zinc-600/30 z-50 fade-in`}>
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-zinc-700/50 mb-2">
                      <p className="text-sm font-medium text-zinc-100">{user.name}</p>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                      <p className="text-xs text-zinc-500 mt-1">Level {user.user_level} User</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onClose();
                      }}
                    >
                      <UserCircle size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/edit-profile"
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onClose();
                      }}
                    >
                      <Settings size={16} />
                      <span>Edit Profile</span>
                    </Link>
                    <Link
                      to="/change-password"
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 rounded-xl transition-all duration-200"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onClose();
                      }}
                    >
                      <Lock size={16} />
                      <span>Change Password</span>
                    </Link>
                    <div className="border-t border-zinc-700/50 mt-2 pt-2">
                      <button
                        onClick={() => {
                          signOut();
                          setIsDropdownOpen(false);
                          onClose();
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
          
          {!collapsed && (
            <div className="mt-3 pt-3 border-t border-zinc-700/30">
              <p className="text-xs text-zinc-500 px-3">© 2024 Bad Habits Band</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;