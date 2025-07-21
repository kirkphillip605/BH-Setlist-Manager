import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user: authUser } = useAuth(); // Get the authenticated user
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    role: '',
    email: '',
    password: '',
    user_level: 1,
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (authUser?.user_level === 3) { // Only fetch users if admin
      fetchUsers();
    }
  }, [authUser]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setUsers(data || []);
    } catch (error) {
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
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      const { data: userInsertData, error: userInsertError } = await supabase
        .from('users')
        .insert({
          name: newUser.name,
          role: newUser.role,
          email: newUser.email,
          user_level: newUser.user_level,
          id: data.user.id,
        });

      if (userInsertError) {
        throw new Error(userInsertError.message);
      }

      fetchUsers();
      setNewUser({
        name: '',
        role: '',
        email: '',
        password: '',
        user_level: 1,
      });
      setShowAddUserForm(false);
    } catch (error) {
      setError(error.message);
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

  if (!authUser || authUser.user_level !== 3) {
    return (
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
        <p className="text-center text-gray-600 dark:text-gray-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-gray-100">User Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900 dark:text-red-200 dark:border-red-700" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowAddUserForm(!showAddUserForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircle size={20} className="mr-2" />
          {showAddUserForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showAddUserForm && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-900 mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Add New User</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                id="role"
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="user_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">User Level</label>
              <select
                id="user_level"
                name="user_level"
                value={newUser.user_level}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="1">User</option>
                <option value="2">Editor</option>
                <option value="3">Admin</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add User
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-600 dark:text-gray-400">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="                col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  User Level
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role || 'Not specified'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.user_level}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingUser?.id === user.id ? (
                      <form onSubmit={handleUpdateUser} className="flex items-center justify-end space-x-2">
                        <input
                          type="text"
                          name="name"
                          value={editingUser.name || ''}
                          onChange={handleEditInputChange}
                          placeholder="Full Name"
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                        <select
                          name="role"
                          value={editingUser.role || ''}
                          onChange={handleEditInputChange}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
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
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                        <select
                          name="user_level"
                          value={editingUser.user_level || 1}
                          onChange={handleEditInputChange}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        >
                          <option value="1">User</option>
                          <option value="2">Editor</option>
                          <option value="3">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        >
                          <Edit size={16} className="mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
  );
};

export default UserManagement;
