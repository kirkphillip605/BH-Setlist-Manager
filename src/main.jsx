import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PageTitleProvider } from './context/PageTitleContext';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
  },
  {
    path: "/songs",
    element: <PrivateRoute><Layout><ManageSongs /></Layout></PrivateRoute>
  },
  {
    path: "/songs/:songId",
    element: <PrivateRoute><Layout><SongViewPage /></Layout></PrivateRoute>
  },
  {
    path: "/songs/add",
    element: <PrivateRoute><Layout><SongFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/songs/edit/:songId",
    element: <PrivateRoute><Layout><SongFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/setlists",
    element: <PrivateRoute><Layout><ManageSetlists /></Layout></PrivateRoute>
  },
  {
    path: "/setlists/add",
    element: <PrivateRoute><Layout><SetlistFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/setlists/edit/:setlistId",
    element: <PrivateRoute><Layout><SetlistFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/set-templates",
    element: <PrivateRoute><Layout><ManageSetTemplates /></Layout></PrivateRoute>
  },
  {
    path: "/set-templates/add",
    element: <PrivateRoute><Layout><SetTemplateFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/set-templates/edit/:templateId",
    element: <PrivateRoute><Layout><SetTemplateFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/profile",
    element: <PrivateRoute><Layout><Profile /></Layout></PrivateRoute>
  },
  {
    path: "/edit-profile",
    element: <PrivateRoute><Layout><EditProfile /></Layout></PrivateRoute>
  },
  {
    path: "/change-password",
    element: <PrivateRoute><Layout><ChangePassword /></Layout></PrivateRoute>
  },
  {
    path: "/admin/users",
    element: <PrivateRoute><Layout><UserManagement /></Layout></PrivateRoute>
  }
], {
  future: {
    v7_startTransition: true
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <PageTitleProvider>
      <RouterProvider router={router} />
    </PageTitleProvider>
  </AuthProvider>
);