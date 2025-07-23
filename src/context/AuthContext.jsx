// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    const cleanupSupabaseChannels = () => {
      try {
        const channels = supabase.getChannels?.();
        if (channels?.length) {
          channels.forEach((channel) => supabase.removeChannel(channel));
        }
      } catch (err) {
        console.warn('⚠️ Failed to clean up Supabase channels:', err);
      }
    };

    const fetchUserData = async (authUser) => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError) {
          if (userError.code === 'PGRST116') {
            return await createUserRecord(authUser);
          } else {
            throw userError;
          }
        }

        if (userData) {
          console.log('✅ User data loaded:', userData);
          return userData;
        }

        return await createUserRecord(authUser);
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        return await createUserRecord(authUser);
      }
    };

    const createUserRecord = async (authUser) => {
      try {
        const newUserData = {
          id: authUser.id,
          email: authUser.email,
          name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email.split('@')[0],
          user_level: authUser.user_metadata?.user_level || 1,
        };

        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .upsert([newUserData], { onConflict: 'id' })
          .select()
          .single();

        if (insertError) {
          console.error('Error upserting user record:', insertError);
          return newUserData;
        }

        return insertedUser;
      } catch (error) {
        console.error('Error in createUserRecord:', error);
        return {
          id: authUser.id,
          email: authUser.email,
          name:
            authUser.user_metadata?.name || authUser.email.split('@')[0],
          user_level: authUser.user_metadata?.user_level || 1,
        };
      }
    };

    const getSession = async () => {
      try {
        if (!supabase?.auth) {
          console.error('❌ Supabase client or auth not available');
          setUser(null);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setUser(null);
          return;
        }

        if (session?.user) {
          const userData = await fetchUserData(session.user);
          if (mounted) {
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Initial session load
    getSession();

    // Setup auth state change subscription
    authSubscription = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        try {
          console.log('🔄 Auth state change:', _event, session?.user?.id);
          cleanupSupabaseChannels(); // proactive cleanup on any state change

          if (session?.user) {
            const userData = await fetchUserData(session.user);
            if (mounted) setUser(userData);
          } else {
            if (mounted) setUser(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authSubscription?.data?.subscription?.unsubscribe?.();
      cleanupSupabaseChannels();
    };
  }, []);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase unavailable');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase unavailable');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://xpatopjcfwsyxmazvopp.supabase.co/auth/v1/callback`
      }
    });
    if (error) throw new Error(error.message);
  };

  const signInWithMagicLink = async (email) => {
    if (!supabase) throw new Error('Supabase unavailable');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    try {
      if (!supabase) throw new Error('Supabase unavailable');
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
    } finally {
      supabase.getChannels?.().forEach((channel) => supabase.removeChannel(channel));
    }
  };

  const resetPassword = async (email) => {
    if (!supabase) throw new Error('Supabase unavailable');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw new Error(error.message);
  };

  const updatePassword = async (password) => {
    if (!supabase) throw new Error('Supabase unavailable');
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return data;
  };

  const value = {
    user,
    loading,
    initialized,
    signIn,
    signInWithGoogle,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {initialized && children}
    </AuthContext.Provider>
  );
};