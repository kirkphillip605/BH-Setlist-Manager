import { supabase } from '../supabaseClient';
import { apiService } from './apiService';
import { handleError } from '../utils/errorHandler';

export const userService = {
  // Get all users (admin only)
  async getAllUsers() {
    return apiService.executeQuery(() => {
      return supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    });
  },

  // Get auth users data (admin only)
  async getAuthUsersData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const result = await apiService.fetchWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-users`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      return result.users || [];
    } catch (error) {
      handleError(error, 'Failed to fetch auth users');
      throw error;
    }
  },

  // Get merged user data (auth + profile)
  async getMergedUsersData() {
    const [profileUsers, authUsers] = await Promise.all([
      this.getAllUsers(),
      this.getAuthUsersData()
    ]);

    // Merge auth data with profile data
    const mergedUsers = authUsers.map(authUser => {
      const profile = profileUsers.find(p => p.id === authUser.id);
      return {
        ...authUser,
        ...profile,
        email: authUser.email || profile?.email, // Use auth email as primary
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at
      };
    });

    return mergedUsers;
  },

  // Create new user (admin only)
  async createUser(userData) {
    const { name, email, password, role, user_level } = userData;

    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Always call the Edge Function for user creation
      const result = await apiService.fetchWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email,
            name,
            role: role || '',
            user_level: user_level || 1,
            password: password || null,
          }),
        }
      );

      const authUser = result.data.user;
      return authUser;
    } catch (error) {
      handleError(error, 'Error creating user');
      throw error;
    }
  },

  // Update user (admin only)
  async updateUser(userId, userData) {
    const { name, email, role, user_level } = userData;

    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    try {
      // Update auth.users email if changed
      const { data: currentAuth } = await supabase.auth.admin.getUserById(userId);
      
      if (currentAuth.user && currentAuth.user.email !== email) {
        await supabase.auth.admin.updateUserById(userId, {
          email,
          user_metadata: {
            ...currentAuth.user.user_metadata,
            name,
            role: role || '',
            user_level: user_level || 1
          }
        });
      } else if (currentAuth.user) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...currentAuth.user.user_metadata,
            name,
            role: role || '',
            user_level: user_level || 1
          }
        });
      }

      // Update public.users
      const { data, error } = await supabase
        .from('users')
        .update({
          name,
          email,
          role: role || '',
          user_level: user_level || 1
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user (admin only)
  async deleteUser(userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Use Edge Function for user deletion
      await apiService.fetchWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      return true;
    } catch (error) {
      handleError(error, 'Error deleting user');
      throw error;
    }
  },

  // Reset user password (admin only)
  async resetUserPassword(email, newPassword = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      if (newPassword) {
        // Set specific password
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users.users.find(u => u.email === email);
        
        if (!user) {
          throw new Error('User not found');
        }

        const { error } = await supabase.auth.admin.updateUserById(user.id, {
          password: newPassword
        });

        if (error) throw error;
      } else {
        // Send password reset email
        await apiService.fetchWithRetry(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ email }),
          }
        );
      }
    } catch (error) {
      handleError(error, 'Error resetting password');
      throw error;
    }
  },

  // Sync user profile data
  async syncUserProfile(userId, profileData) {
    const { name, email, role, user_level } = profileData;
    
    const { error } = await supabase.rpc('sync_user_profile', {
      user_id: userId,
      user_name: name,
      user_email: email,
      user_role: role,
      user_level: user_level
    });

    if (error) throw error;
  },

  // Resend invitation (admin only)
  async resendInvitation(email) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      await apiService.fetchWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email }),
        }
      );
    } catch (error) {
      handleError(error, 'Failed to resend invitation');
      throw error;
    }
  }
};
