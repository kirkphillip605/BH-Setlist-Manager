import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Mail, UserCheck, Users, Key, RefreshCw, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import { userService } from '../services/userService';

const UserManagement = () => {
  const { user: authUser } = useAuth(); // Get the authenticated user
  const { setPageTitle } = usePageTitle();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [sendPasswordEmail, setSendPasswordEmail] = useState(true);
  const [newUser, setNewUser] = useState({
    name: '',
    role: '',
    email: '',
    user_level: 1,
    password: '',
    sendInvite: true
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await userService.getMergedUsersData();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'user_level' ? parseInt(value, 10) : value;
    setNewUser({ ...newUser, [name]: processedValue });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'user_level' ? parseInt(value, 10) : value;
    setEditingUser({ ...editingUser, [name]: processedValue });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');
    setLoading(true);
    
    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        user_level: newUser.user_level,
        password: newUser.sendInvite ? null : newUser.password
      };
      
      await userService.createUser(userData);
      await fetchUsers();
      
      setNewUser({
        name: '',
        role: '',
        email: '',
        user_level: 1,
        password: '',
        sendInvite: true
      });
      setShowAddUserForm(false);
      
      const message = newUser.sendInvite 
        ? 'User invited successfully! They will receive an email to complete their profile.'
        : 'User created successfully with the specified password.';
      showSuccess(message);
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');
    
    try {
      await userService.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        user_level: editingUser.user_level
      });
      
      await fetchUsers();
      setEditingUser(null);
      showSuccess('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    setSuccess('');
    
    try {
      await userService.deleteUser(userId);
      await fetchUsers();
      showSuccess('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message);
    }
  };

  const handleResendInvite = async (email) => {
    setError(null);
    setSuccess('');
    
    try {
      await userService.resendInvitation(email);
      showSuccess('Invitation resent successfully!');
    } catch (error) {
      console.error('Error resending invitation:', error);
      setError(error.message);
    }
  };

  const handleShowPasswordModal = (user) => {
    setPasswordModalUser(user);
    setNewPassword('');
    setSendPasswordEmail(true);
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');
    
    try {
      const password = sendPasswordEmail ? null : newPassword;
      await userService.resetUserPassword(passwordModalUser.email, password);
      
      const message = sendPasswordEmail 
        ? 'Password reset email sent successfully!'
        : 'Password updated successfully!';
      showSuccess(message);
      
      setShowPasswordModal(false);
      setPasswordModalUser(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.message);
    }
  };

  const getUserLevelBadge = (level) => {
    switch(level) {
      case 3: return <span className="badge bg-red-600 text-white border-red-500"><Shield size={12} className="mr-1" />Admin</span>;
      case 2: return <span className="badge bg-blue-600 text-white border-blue-500"><Edit size={12} className="mr-1" />Editor</span>;
      default: return <span className="badge badge-secondary"><UserCheck size={12} className="mr-1" />User</span>;
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
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <strong className="font-semibold">Error</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-800/50 text-green-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm" role="alert">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      <div className="card-modern p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-zinc-600 text-zinc-100 rounded-xl hover:bg-zinc-500 disabled:opacity-50 transition-colors font-medium"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
          >
            <UserPlus size={20} className="mr-2" />
            {showAddUserForm ? 'Cancel' : 'Add User'}
          </button>
        </div>

        {showAddUserForm && (
          <div className="p-4 border border-zinc-700 rounded-xl bg-zinc-800 mb-4">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="sendInvite"
                    type="checkbox"
                    checked={newUser.sendInvite}
                    onChange={(e) => setNewUser({ ...newUser, sendInvite: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-600 rounded bg-zinc-700"
                  />
                  <label htmlFor="sendInvite" className="ml-2 block text-sm text-zinc-300">
                    Send invitation email (user will set their own password)
                  </label>
                </div>
                
                {!newUser.sendInvite && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleInputChange}
                      required={!newUser.sendInvite}
                      className="input-modern"
                      placeholder="Enter password for new user..."
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-zinc-600 rounded-xl text-zinc-300 bg-zinc-700 hover:bg-zinc-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="mr-2" />
                      {newUser.sendInvite ? 'Send Invitation' : 'Create User'}
                    </>
                  )}
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
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-300 text-lg mb-2">No users found</p>
            <p className="text-zinc-400">Users will appear here once they are added to the system.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800">
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
                    Status
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-100">{user.name || 'No name'}</div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {user.role || <span className="text-slate-500 italic">Not specified</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserLevelBadge(user.user_level)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email_confirmed_at ? (
                        <span className="badge badge-success">Confirmed</span>
                      ) : (
                        <span className="badge bg-yellow-600 text-white border-yellow-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser?.id === user.id ? (
                        <div className="space-y-2">
                          <form onSubmit={handleUpdateUser} className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                name="name"
                                value={editingUser.name || ''}
                                onChange={handleEditInputChange}
                                placeholder="Full Name"
                                className="px-3 py-1 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                              <input
                                type="email"
                                name="email"
                                value={editingUser.email || ''}
                                onChange={handleEditInputChange}
                                placeholder="Email"
                                className="px-3 py-1 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                name="role"
                                value={editingUser.role || ''}
                                onChange={handleEditInputChange}
                                className="px-3 py-1 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                              <select
                                name="user_level"
                                value={editingUser.user_level || 1}
                                onChange={handleEditInputChange}
                                className="px-3 py-1 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="1">User</option>
                                <option value="2">Editor</option>
                                <option value="3">Admin</option>
                              </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button
                                type="submit"
                                className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="inline-flex items-center px-3 py-1 border border-slate-600 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleShowPasswordModal(user)}
                            className="inline-flex items-center px-2 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs"
                            title="Reset Password"
                          >
                            <Key size={12} />
                          </button>
                          <button
                            onClick={() => handleResendInvite(user.email)}
                            className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                            title="Resend Invitation"
                          >
                            <Mail size={12} />
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                            title="Edit User"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === authUser?.id}
                            className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                            title={user.id === authUser?.id ? "Cannot delete yourself" : "Delete User"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {users.map((user) => (
                <div key={user.id} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-zinc-100 truncate">{user.name || 'No name'}</h3>
                        <p className="text-sm text-zinc-400 truncate">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getUserLevelBadge(user.user_level)}
                          {user.email_confirmed_at ? (
                            <span className="badge badge-success text-xs">Confirmed</span>
                          ) : (
                            <span className="badge bg-yellow-600 text-white border-yellow-500 text-xs">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-zinc-300 mb-3">
                    <p><strong>Role:</strong> {user.role || 'Not specified'}</p>
                    <p><strong>Last Login:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</p>
                  </div>

                  {editingUser?.id === user.id ? (
                    <form onSubmit={handleUpdateUser} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <input
                          type="text"
                          name="name"
                          value={editingUser.name || ''}
                          onChange={handleEditInputChange}
                          placeholder="Full Name"
                          className="input-modern text-sm"
                        />
                        <input
                          type="email"
                          name="email"
                          value={editingUser.email || ''}
                          onChange={handleEditInputChange}
                          placeholder="Email"
                          className="input-modern text-sm"
                        />
                        <select
                          name="role"
                          value={editingUser.role || ''}
                          onChange={handleEditInputChange}
                          className="input-modern text-sm"
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
                        <select
                          name="user_level"
                          value={editingUser.user_level || 1}
                          onChange={handleEditInputChange}
                          className="input-modern text-sm"
                        >
                          <option value="1">User</option>
                          <option value="2">Editor</option>
                          <option value="3">Admin</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="inline-flex items-center px-4 py-2 border border-zinc-600 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600 text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleShowPasswordModal(user)}
                        className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors text-sm"
                        title="Reset Password"
                      >
                        <Key size={16} className="mr-1" />
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleResendInvite(user.email)}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                        title="Resend Invitation"
                      >
                        <Mail size={16} className="mr-1" />
                        Resend
                      </button>
                      <button
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                        title="Edit User"
                      >
                        <Edit size={16} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === authUser?.id}
                        className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        title={user.id === authUser?.id ? "Cannot delete yourself" : "Delete User"}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      
      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={() => setShowPasswordModal(false)}></div>
            
            <div className="inline-block align-bottom bg-zinc-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-zinc-800 px-6 pt-6 pb-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-900/50">
                    <Key className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-zinc-100">Reset Password</h3>
                    <p className="text-sm text-zinc-400">
                      Reset password for {passwordModalUser?.name || passwordModalUser?.email}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="px-6 pb-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="sendPasswordEmail"
                      type="checkbox"
                      checked={sendPasswordEmail}
                      onChange={(e) => setSendPasswordEmail(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-600 rounded bg-zinc-700"
                    />
                    <label htmlFor="sendPasswordEmail" className="ml-2 block text-sm text-zinc-300">
                      Send password reset email (let user set their own password)
                    </label>
                  </div>
                  
                  {!sendPasswordEmail && (
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required={!sendPasswordEmail}
                        className="input-modern"
                        placeholder="Enter new password..."
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="inline-flex items-center px-4 py-2 border border-zinc-600 rounded-xl text-zinc-300 bg-zinc-700 hover:bg-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors font-medium"
                  >
                    <Key size={16} className="mr-2" />
                    {sendPasswordEmail ? 'Send Reset Email' : 'Set Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserManagement;