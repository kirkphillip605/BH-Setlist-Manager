import React, { useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';

const Dashboard = () => {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Dashboard');
  }, [setPageTitle]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        {/* Quick Stats Cards */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Songs</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Setlists</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Templates</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Welcome to SetList Console</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your songs, create setlists, and organize your performances all in one place.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
