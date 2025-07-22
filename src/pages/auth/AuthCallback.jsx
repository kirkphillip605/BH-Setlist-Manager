import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle both URL params and hash fragments for OAuth
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || urlParams.get('refresh_token');
        
        // If we have tokens in the URL, set the session
        if (accessToken && refreshToken) {
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            throw error;
          }

          if (session?.user) {
            // Check if user exists and has complete profile in our users table
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // User doesn't exist in our table, needs to complete profile
              navigate('/auth/invite-complete');
            } else if (!userProfile?.name || userProfile.name.trim() === '') {
              // User exists but profile is incomplete
              navigate('/auth/invite-complete');
            } else {
              // User exists and profile is complete
              console.log('✅ Auth callback - user authenticated:', userProfile);
              navigate('/');
            }
          } else {
            navigate('/login');
          }
        } else {
          // Fallback to getting current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (session?.user) {
          // Check if user exists and has complete profile in our users table
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // User doesn't exist in our table, needs to complete profile
            navigate('/auth/invite-complete');
          } else if (!userProfile?.name || userProfile.name.trim() === '') {
            // User exists but profile is incomplete
            navigate('/auth/invite-complete');
          } else {
            // User exists and profile is complete
            console.log('✅ Auth callback - user authenticated:', userProfile);
            navigate('/');
          }
        } else {
          navigate('/login');
        }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;