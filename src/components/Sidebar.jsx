import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Music, ListMusic, LayoutTemplate, Users, X, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, collapsed }) => {
  const { user } = useAuth();
  const location = useLocation();

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
        <div className={`flex items-center ${collapsed ? 'justify-center p-4' : 'justify-between p-4 lg:p-6'} border-b border-zinc-800 bg-zinc-900`}>
          {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Headphones size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-heading tracking-tight">Bad Habits</h1>
              <p className="text-xs text-muted">Setlist Management</p>
            </div>
          </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
                 title="Bad Habits Setlist Management">
              <Headphones size={20} className="text-white" />
            </div>
          )}
          <button
            onClick={onClose}
            className={`mobile-only btn-icon ${collapsed ? 'hidden' : ''}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3 lg:px-4'} py-6 space-y-2`}>
          {menuItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              title={collapsed ? label : ''}
              className={`
                isActive(path) ? 'nav-item-active' : 'nav-item-inactive'
              } + (collapsed ? ' justify-center' : '')
              `}
            >
              <Icon size={20} className={collapsed ? '' : (isActive(path) ? 'nav-icon-active' : 'nav-icon-inactive')} />
              {!collapsed && (
              <div className="flex-1">
                <div className={`font-medium ${isActive(path) ? 'text-white' : 'text-body'}`}>{label}</div>
              </div>
              )}
            </Link>
          ))}

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <>
              {!collapsed && (
              <div className="pt-8 pb-4">
                <span className="text-subtle uppercase font-bold text-xs px-3 tracking-wider">
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
                    nav-item group ${collapsed ? 'justify-center' : ''}
                    ${isActive(path) 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : 'text-muted hover:text-heading hover:bg-zinc-800'
                    }
                  `}
                >
                  <Icon size={20} className={`${isActive(path) ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'} ${collapsed ? '' : 'nav-icon'}`} />
                  {!collapsed && (
                  <div className="flex-1">
                    <div className={`font-medium ${isActive(path) ? 'text-white' : 'text-body'}`}>{label}</div>
                  </div>
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;