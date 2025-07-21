import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Music, ListMusic, LayoutTemplate, Users, X } from 'lucide-react';
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
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/songs', label: 'Manage Songs', icon: Music },
    { path: '/song-collections', label: 'Song Collections', icon: LayoutTemplate },
    { path: '/setlists', label: 'Setlists', icon: ListMusic },
  ];

  const adminItems = user?.user_level === 3 ? [
    { path: '/admin/users', label: 'Users', icon: Users },
  ] : [];

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        bg-gradient-to-b from-slate-800 via-blue-900 to-slate-900 
        flex flex-col shadow-xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-900">
            <center>Setlist Management</center>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 lg:px-6 py-4 space-y-2">
          {menuItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`
                flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive(path) 
                  ? 'bg-blue-700 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              <Icon size={20} className="mr-3" />
              {label}
            </Link>
          ))}

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <>
              <div className="pt-6 pb-2">
                <span className="text-gray-400 uppercase font-bold text-xs px-3">
                  Administration
                </span>
              </div>
              {adminItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={`
                    flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive(path) 
                      ? 'bg-blue-700 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700'
                    }
                  `}
                >
                  <Icon size={20} className="mr-3" />
                  {label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 lg:p-6 border-t border-slate-700">
          <div className="text-xs text-gray-400">
            {user?.name && (
              <p className="truncate">Signed in as {user.name}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;