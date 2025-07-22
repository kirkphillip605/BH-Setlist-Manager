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

    const fetchUserData = async (authUser) => {
      try {
        // Fetch user data from our users table with proper error handling
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (userError) {
          if (userError.code === 'PGRST116') {
            // User doesn't exist in our table, create them
            return await createUserRecord(authUser);
          } else {
            throw userError;
          }
        }
        
        if (userData) {
          // Ensure user_level is properly set
          console.log('✅ User data loaded:', userData);
          return userData;
        }
        
        // Fallback to create user record
        return await createUserRecord(authUser);
        
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        // Try to create user as fallback
        return await createUserRecord(authUser);
      }
    };

    const createUserRecord = async (authUser) => {
      try {
        const newUserData = {
          id: authUser.id, // Use auth user ID directly
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
          user_level: authUser.user_metadata?.user_level || 1
        };
        
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .upsert([newUserData], { onConflict: 'id' })
          .select()
          .single();
          
        if (insertError) {
          console.error('Error upserting user record:', insertError);
          // Return user data even if insert fails (for fallback)
          return newUserData;
        }
        
        return insertedUser;
      } catch (error) {
        console.error('Error in createUserRecord:', error);
        // Final fallback - return basic user data
        return {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          user_level: authUser.user_metadata?.user_level || 1
        };
      }
    };

    const getSession = async () => {
      try {
        if (!supabase) {
          console.error('❌ CRITICAL: Supabase client not initialized - check environment variables');
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (!supabase.auth) {
          console.error('❌ CRITICAL: Supabase auth not available');
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session && mounted) {
          const userData = await fetchUserData(session.user);
          if (userData && mounted) {
            console.log('✅ Setting user:', userData);
            setUser(userData);
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getSession();

    let subscription = null;
    
    if (supabase) {
      const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);

        try {
          if (session?.user) {
            const userData = await fetchUserData(session.user);
            if (userData && mounted) {
              console.log('✅ Auth state change - setting user:', userData);
              setUser(userData);
            }
          } else {
            if (mounted) {
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted) {
            setUser(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );
      subscription = authSubscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      if (!supabase) {
        throw new Error('Authentication service unavailable. Please refresh the page and try again.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // The auth state change listener will handle setting the user
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!supabase) {
        throw new Error('Authentication service unavailable. Please refresh the page and try again.');
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    }
  };

  const signInWithMagicLink = async (email) => {
    try {
      if (!supabase) {
        throw new Error('Authentication service unavailable. Please refresh the page and try again.');
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (!supabase) {
        throw new Error('Authentication service unavailable. Please refresh the page and try again.');
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      // The auth state change listener will handle clearing the user
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear user on sign out error
      setUser(null);
    }
  };

  const resetPassword = async (email) => {
    if (!supabase) {
      throw new Error('Authentication service unavailable. Please refresh the page and try again.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };

  const updatePassword = async (password) => {
    if (!supabase) {
      throw new Error('Authentication service unavailable. Please refresh the page and try again.');
    }

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
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
