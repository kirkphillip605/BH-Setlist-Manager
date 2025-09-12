import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { apiService } from '../services/apiService';
import { handleError } from '../utils/errorHandler';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../context/PageTitleContext';

const EditProfile = () => {
  const { user, updatePassword } = useAuth();
  const { setPageTitle } = usePageTitle();
  const [profile, setProfile] = useState({
    name: '',
    role: '',
    email: '',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle('Edit Profile');
    let isMounted = true;

    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.executeQuery(() =>
          supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
        );

        if (isMounted && data) {
          setProfile({
            name: data.name || '',
            role: data.role || '',
            email: data.email || '',
          });
        }
      } catch (error) {
        if (isMounted) {
          setError(apiService.formatError(error));
        }
        handleError(error, 'Failed to load profile');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user, setPageTitle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Update user details
      await apiService.executeQuery(() =>
        supabase
          .from('users')
          .update({
            name: profile.name,
            role: profile.role,
            email: profile.email,
          })
          .eq('id', user.id)
      );

      // Update password if provided
      if (password && password === confirmPassword) {
        await updatePassword(password);
      } else if (password && password !== confirmPassword) {
        throw new Error("Passwords don't match.");
      }

      setSuccess(true);
      // Optionally, redirect to profile or dashboard
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 2000); // Redirect after 2 seconds
    } catch (error) {
      setError(apiService.formatError(error));
      handleError(error, 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg mb-4" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> Profile updated successfully.</span>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-700">
        {loading && (
          <div className="text-center text-slate-300">Loading...</div>
        )}

        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">Role</label>
              <select
                id="role"
                name="role"
                value={profile.role}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select a role</option>
                <option value="Bass Guitar">Bass Guitar</option>
                <option value="Drums">Drums</option>
                <option value="Lead Guitar">Lead Guitar</option>
                <option value="Rhythm Guitar">Rhythm Guitar</option>
                <option value="Keyboard">Keyboard</option>
                <option value="Vocals">Vocals</option>
                <option value="Sound Engineer">Sound Engineer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">New Password (Optional)</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password (Optional)</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
