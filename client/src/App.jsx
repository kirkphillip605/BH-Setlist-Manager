import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ManageSongs from './pages/ManageSongs';
import SongViewPage from './pages/SongViewPage';
import SongFormPage from './pages/SongFormPage';
import ManageSetlists from './pages/ManageSetlists';
import ManageSetTemplates from './pages/ManageSetTemplates';
import SetlistFormPage from './pages/SetlistFormPage';
import SetTemplateFormPage from './pages/SetTemplateFormPage';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import EditProfile from './pages/EditProfile';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/songs" element={<PrivateRoute><ManageSongs /></PrivateRoute>} />
      <Route path="/songs/:songId" element={<PrivateRoute><SongViewPage /></PrivateRoute>} />
      <Route path="/songs/add" element={<PrivateRoute><SongFormPage /></PrivateRoute>} />
      <Route path="/songs/edit/:songId" element={<PrivateRoute><SongFormPage /></PrivateRoute>} />
      <Route path="/setlists" element={<PrivateRoute><ManageSetlists /></PrivateRoute>} />
      <Route path="/setlists/add" element={<PrivateRoute><SetlistFormPage /></PrivateRoute>} />
      <Route path="/setlists/edit/:setlistId" element={<PrivateRoute><SetlistFormPage /></PrivateRoute>} />
      <Route path="/set-templates" element={<PrivateRoute><ManageSetTemplates /></PrivateRoute>} />
      <Route path="/set-templates/add" element={<PrivateRoute><SetTemplateFormPage /></PrivateRoute>} />
      <Route path="/set-templates/edit/:templateId" element={<PrivateRoute><SetTemplateFormPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/edit-profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
      <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
      {/* Add other routes here */}
    </Routes>
  );
}

export default App;
