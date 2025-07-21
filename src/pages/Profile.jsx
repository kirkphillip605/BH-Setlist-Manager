import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';

const Profile = () => {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Profile');
  }, [setPageTitle]);

  if (!user) {
    return <div>Loading...</div>; // Or redirect to login
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
      <div className="space-y-4">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Role:</strong> {user.role || 'Not specified'}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>User Level:</strong> {user.user_level}
        </p>
      </div>
    </div>
  );
};

export default Profile;
