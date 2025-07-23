// AuthContext.js - Refactored with Supabase best practices
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const mountedRef = useRef(true);
  const authSubscriptionRef = useRef(null);

  // Cleanup function for subscriptions
  const cleanupSubscriptions = () => {
    if (authSubscriptionRef.current) {
      authSubscriptionRef.current.subscription.unsubscribe();
      authSubscriptionRef.current = null;
    }
    
    // Clean up any Supabase channels
    try {
      const channels = supabase.getChannels?.();
      if (channels?.length) {
        channels.forEach((channel) => supabase.removeChannel(channel));
      }
    } catch (err) {
      console.warn('Failed to clean up Supabase channels:', err);
    }
  };

  // Fetch user profile data
  const fetchUserProfile = async (authUser) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User doesn't exist, create profile
          return await createUserProfile(authUser);
        }
        throw error;
      }

      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return createUserProfile(authUser);
    }
  };

  // Create user profile
  const createUserProfile = async (authUser) => {
    try {
      const newUserData = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || 
              authUser.user_metadata?.name || 
              authUser.email.split('@')[0],
        user_level: authUser.user_metadata?.user_level || 1,
        role: authUser.user_metadata?.role || null,
      };

      const { data: insertedUser, error } = await supabase
        .from('users')
        .upsert([newUserData], { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return newUserData;
      }

      return insertedUser;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
        user_level: 1,
      };
    }
  };

  // Process auth change - deferred async logic as per Supabase best practices
  const processAuthChange = async (event, session) => {
    if (!mountedRef.current) return;

    try {
      if (session?.user) {
        const userData = await fetchUserProfile(session.user);
        if (mountedRef.current) {
          setUser(userData);
        }
      } else {
        if (mountedRef.current) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth processing error:', error);
      if (mountedRef.current) {
        setUser(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        if (!supabase?.auth) {
          console.error('Supabase client not available');
          setUser(null);
          return;
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setUser(null);
        } else if (session?.user) {
          const userData = await fetchUserProfile(session.user);
          if (mountedRef.current) {
            setUser(userData);
          }
        } else {
          if (mountedRef.current) {
            setUser(null);
          }
        }

        // Setup auth listener with minimal callback as per Supabase best practices
        authSubscriptionRef.current = supabase.auth.onAuthStateChange((event, session) => {
          // Quick, synchronous callback - defer async work
          setTimeout(() => processAuthChange(event, session), 0);
        });

      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mountedRef.current) {
          setUser(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      cleanupSubscriptions();
    };
  }, []);

  // Auth methods
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
        redirectTo: `${window.location.origin}/auth/callback`
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
      
      cleanupSubscriptions();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
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
      {children}
    </AuthContext.Provider>
  );
};