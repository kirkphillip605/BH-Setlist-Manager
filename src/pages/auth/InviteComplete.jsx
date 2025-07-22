import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { User, Lock, Mail } from 'lucide-react';

const InviteComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Get user data from current session
    const checkInviteData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user?.user_metadata) {
          setFormData(prev => ({
            ...prev,
            name: user.user_metadata.full_name || user.user_metadata.name || '',
            role: user.user_metadata.role || ''
          }));
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        setFormData(prev => ({
          ...prev,
          name: '',
          role: ''
        }));
      }
    };
    
    checkInviteData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (passwordError) {
        throw new Error(passwordError.message);
      }

      // Update the user profile in our users table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            name: formData.name,
            role: formData.role,
            user_level: user.user_metadata.user_level || 1
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      navigate('/', { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="card-modern p-6 sm:p-8 w-full max-w-md fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">Complete Your Profile</h2>
          <p className="text-zinc-300 mt-2">
            Set up your account to get started
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-modern"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-zinc-300 mb-2">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-modern"
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
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-modern"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input-modern"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up account...
              </>
            ) : (
              <>
                <User size={16} className="mr-2" />
                Complete Setup
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteComplete;