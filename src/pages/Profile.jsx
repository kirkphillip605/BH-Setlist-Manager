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
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        <div className="space-y-4">
          <p className="text-slate-100">
            <strong>Name:</strong> {user.name}
          </p>
          <p className="text-slate-100">
            <strong>Role:</strong> {user.role || 'Not specified'}
          </p>
          <p className="text-slate-100">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="text-slate-100">
            <strong>User Level:</strong> {user.user_level}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
