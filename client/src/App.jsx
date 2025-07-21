import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/songs" element={<PrivateRoute><Layout><ManageSongs /></Layout></PrivateRoute>} />
      <Route path="/songs/:songId" element={<PrivateRoute><Layout><SongViewPage /></Layout></PrivateRoute>} />
      <Route path="/songs/add" element={<PrivateRoute><Layout><SongFormPage /></Layout></PrivateRoute>} />
      <Route path="/songs/edit/:songId" element={<PrivateRoute><Layout><SongFormPage /></Layout></PrivateRoute>} />
      <Route path="/setlists" element={<PrivateRoute><Layout><ManageSetlists /></Layout></PrivateRoute>} />
      <Route path="/setlists/add" element={<PrivateRoute><Layout><SetlistFormPage /></Layout></PrivateRoute>} />
      <Route path="/setlists/edit/:setlistId" element={<PrivateRoute><Layout><SetlistFormPage /></Layout></PrivateRoute>} />
      <Route path="/set-templates" element={<PrivateRoute><Layout><ManageSetTemplates /></Layout></PrivateRoute>} />
      <Route path="/set-templates/add" element={<PrivateRoute><Layout><SetTemplateFormPage /></Layout></PrivateRoute>} />
      <Route path="/set-templates/edit/:templateId" element={<PrivateRoute><Layout><SetTemplateFormPage /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="/edit-profile" element={<PrivateRoute><Layout><EditProfile /></Layout></PrivateRoute>} />
      <Route path="/change-password" element={<PrivateRoute><Layout><ChangePassword /></Layout></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute><Layout><UserManagement /></Layout></PrivateRoute>} />
      {/* Add other routes here */}
    </Routes>
  );
}

export default App;
