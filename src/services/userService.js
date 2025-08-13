import { supabase } from '../supabaseClient';
import { apiService } from './apiService';

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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch auth users');
      }
      
      return result.users || [];
    } catch (error) {
      console.error('Error fetching auth users:', error);
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

      // Create auth user
      let authUser;
      if (password) {
        // Create with password
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role: role || '',
            user_level: user_level || 1
          }
        });

        if (error) throw error;
        authUser = data.user;
      } else {
        // Send invitation email
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-invite-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email,
            name,
            role: role || '',
            user_level: user_level || 1
          })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to invite user');
        }

        authUser = result.data.user;
      }

      // Sync with public.users table
      await this.syncUserProfile(authUser.id, {
        name,
        email,
        role: role || '',
        user_level: user_level || 1
      });

      return authUser;
    } catch (error) {
      console.error('Error creating user:', error);
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
      // Delete from auth.users (this will cascade to public.users via RLS)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Ensure deletion from public.users
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;
    } catch (error) {
      console.error('Error deleting user:', error);
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
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to reset password');
        }
      }
    } catch (error) {
      console.error('Error resetting password:', error);
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }
};