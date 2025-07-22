import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback triggered');
        console.log('Current URL:', window.location.href);
        
        // Handle OAuth callback - Supabase will automatically process the tokens
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          navigate('/login?error=' + encodeURIComponent(sessionError.message));
          return;
        }

        if (session?.user) {
          console.log('✅ Session found:', session.user.email);
          
          // Check if user exists and has complete profile in our users table
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // User doesn't exist in our table, needs to complete profile
            console.log('User not found in users table, redirecting to invite complete');
            navigate('/auth/invite-complete');
          } else if (!userProfile?.name || userProfile.name.trim() === '') {
            // User exists but profile is incomplete
            console.log('User profile incomplete, redirecting to invite complete');
            navigate('/auth/invite-complete');
          } else {
            // User exists and profile is complete
            console.log('✅ Auth callback - user authenticated:', userProfile);
            navigate('/');
          }
        } else {
          console.log('No session found, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=' + encodeURIComponent(error.message));
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-zinc-300">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;