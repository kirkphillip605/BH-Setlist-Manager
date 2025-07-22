import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Music, ListMusic, LayoutTemplate, Users, X, Headphones, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: Home, description: 'Overview & stats' },
    { path: '/songs', label: 'Songs', icon: Music, description: 'Manage music library' },
    { path: '/song-collections', label: 'Collections', icon: LayoutTemplate, description: 'Curated song lists' },
    { path: '/setlists', label: 'Setlists', icon: ListMusic, description: 'Performance setlists' },
  ];

  const adminItems = user?.user_level === 3 ? [
    { path: '/admin/users', label: 'User Management', icon: Users, description: 'Manage system users' },
  ] : [];

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        bg-zinc-900 border-r border-zinc-800
        flex flex-col shadow-2xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Headphones size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">SetList Pro</h1>
              <p className="text-xs text-zinc-400">Music Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-200 btn-animate"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 lg:px-4 py-6 space-y-2">
          {menuItems.map(({ path, label, icon: Icon, description }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`
                group flex items-center px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 relative
                ${isActive(path) 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }
              `}
            >
              <Icon size={20} className={`mr-3 ${isActive(path) ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              <div className="flex-1">
                <div className={`font-medium ${isActive(path) ? 'text-white' : 'text-zinc-300'}`}>{label}</div>
                <div className={`text-xs ${isActive(path) ? 'text-blue-100' : 'text-zinc-500'} lg:block hidden`}>{description}</div>
              </div>
              {isActive(path) && (
                <div className="absolute right-2">
                  <Sparkles size={14} className="text-white opacity-75" />
                </div>
              )}
            </Link>
          ))}

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <>
              <div className="pt-8 pb-4">
                <span className="text-zinc-500 uppercase font-bold text-xs px-3 tracking-wider">
                  Administration
                </span>
              </div>
              {adminItems.map(({ path, label, icon: Icon, description }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 relative
                    ${isActive(path) 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg' 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    }
                  `}
                >
                  <Icon size={20} className={`mr-3 ${isActive(path) ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${isActive(path) ? 'text-white' : 'text-zinc-300'}`}>{label}</div>
                    <div className={`text-xs ${isActive(path) ? 'text-emerald-100' : 'text-zinc-500'} lg:block hidden`}>{description}</div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 lg:p-6 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 space-y-1">
            {user?.name && (
              <>
                <p className="truncate font-medium text-zinc-400">Signed in as</p>
                <p className="truncate text-zinc-300">{user.name}</p>
                <p className="text-zinc-500">Level {user.user_level} User</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;