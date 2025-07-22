import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Edit, Trash2, PlusCircle, Mail, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';

const UserManagement = () => {
  const { user: authUser } = useAuth(); // Get the authenticated user
  const { setPageTitle } = usePageTitle();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    role: '',
    email: '',
    user_level: 1,
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    setPageTitle('User Management');
    if (authUser && authUser.user_level === 3) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [authUser, setPageTitle]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
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
        throw new Error(result.error || 'Failed to fetch users');
      }
      
      setUsers(result.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingUser({ ...editingUser, [name]: value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
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
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          user_level: parseInt(newUser.user_level, 10)
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to invite user');
      }

      fetchUsers();
      setNewUser({
        name: '',
        role: '',
        email: '',
        user_level: 1,
      });
      setShowAddUserForm(false);
      alert('Invitation sent successfully! The user will receive an email to complete their profile.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editingUser.name,
          role: editingUser.role,
          email: editingUser.email,
          user_level: parseInt(editingUser.user_level, 10), // Ensure user_level is an integer
        })
        .eq('id', editingUser.id);

      if (error) {
        throw new Error(error.message);
      }
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    setError(null);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }
      fetchUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResendInvite = async (userEmail) => {
    setError(null);
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
        body: JSON.stringify({
          email: userEmail
        })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation');
      }
      
      alert('Invitation resent successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResetUserPassword = async (userEmail) => {
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: userEmail
        })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }
      
      alert('Password reset email sent successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  if (!authUser || authUser.user_level !== 3) {
    return (
      <div className="max-w-7xl mx-auto fade-in">
        <div className="card-modern p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Access Denied</h2>
          <p className="text-zinc-300">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">User Management</h1>
            <p className="text-zinc-400">Manage system users and permissions</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="card-modern p-4 lg:p-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
          >
            <PlusCircle size={20} className="mr-2" />
            {showAddUserForm ? 'Cancel' : 'Add User'}
          </button>
        </div>

        {showAddUserForm && (
          <div className="p-4 border border-zinc-700 rounded-xl bg-zinc-800 mb-4">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  required
                  className="input-modern"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-zinc-300 mb-2">Role</label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
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
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                  className="input-modern"
                />
              </div>
              <div>
                <label htmlFor="user_level" className="block text-sm font-medium text-zinc-300 mb-2">User Level</label>
                <select
                  id="user_level"
                  name="user_level"
                  value={newUser.user_level}
                  onChange={handleInputChange}
                  className="input-modern"
                >
                  <option value="1">User</option>
                  <option value="2">Editor</option>
                  <option value="3">Admin</option>
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
                >
                  <Mail size={16} className="mr-2" />
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-300">Loading users...</p>
          </div>
        ) : (
          <div className="bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800">
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-zinc-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    User Level
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.role || 'Not specified'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.user_level}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser?.id === user.id ? (
                        <form onSubmit={handleUpdateUser} className="flex items-center justify-end space-x-2">
                          <input
                            type="text"
                            name="name"
                            value={editingUser.name || ''}
                            onChange={handleEditInputChange}
                            placeholder="Full Name"
                            className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <select
                            name="role"
                            value={editingUser.role || ''}
                            onChange={handleEditInputChange}
                            className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          <input
                            type="email"
                            name="email"
                            value={editingUser.email || ''}
                            onChange={handleEditInputChange}
                            placeholder="Email"
                            className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <select
                            name="user_level"
                            value={editingUser.user_level || 1}
                            onChange={handleEditInputChange}
                            className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="1">User</option>
                            <option value="2">Editor</option>
                            <option value="3">Admin</option>
                          </select>
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="inline-flex items-center px-4 py-2 border border-slate-600 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleResetUserPassword(user.email)}
                            className="inline-flex items-center px-3 py-1 border border-yellow-500 bg-yellow-900/50 text-yellow-200 rounded-lg hover:bg-yellow-800/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors text-xs"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleResendInvite(user.email)}
                            className="inline-flex items-center px-3 py-1 border border-blue-500 bg-blue-900/50 text-blue-200 rounded-lg hover:bg-blue-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-xs"
                          >
                            <Mail size={14} className="mr-1" />
                            Resend
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="inline-flex items-center px-4 py-2 border border-slate-600 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            <Edit size={16} className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;