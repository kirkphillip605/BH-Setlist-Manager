import React, { useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';

const Dashboard = () => {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Dashboard');
  }, [setPageTitle]);

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
      <p className="text-gray-600 dark:text-gray-400">Welcome to the dashboard!</p>
    </div>
  );
};

export default Dashboard;
