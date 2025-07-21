import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Music, ListMusic, LayoutTemplate, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <div className="w-64 bg-gradient-to-br from-blue-600 via-gray-600 to-blue-800 p-4 flex flex-col dark:bg-gray-950">
      <div className="text-2xl font-bold mb-8 text-232323-400">Setlist Console</div>
      <nav className="flex-1">
        <ul>
          <li className="mb-4">
            <Link to="/" className="flex items-center text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded-md transition-colors duration-200">
              <Home size={20} className="mr-3" />
              Dashboard
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/songs" className="flex items-center text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded-md transition-colors duration-200">
              <Music size={20} className="mr-3" />
              Manage Songs
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/set-templates" className="flex items-center text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded-md transition-colors duration-200">
              <LayoutTemplate size={20} className="mr-3" />
              Manage Set Templates
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/setlists" className="flex items-center text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded-md transition-colors duration-200">
              <ListMusic size={20} className="mr-3" />
              Manage Setlists
            </Link>
          </li>
          {user?.user_level === 3 && ( // Admin Menu
            <>
              <li className="mt-6 mb-2">
                <span className="text-gray-400 uppercase font-bold text-sm">Administration</span>
              </li>
              <li className="mb-4">
                <Link to="/admin/users" className="flex items-center text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded-md transition-colors duration-200">
                  <Users size={20} className="mr-3" />
                  Users
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
