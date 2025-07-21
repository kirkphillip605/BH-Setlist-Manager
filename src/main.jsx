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
import ManageSongCollections from './pages/ManageSongCollections';
import SetlistFormPage from './pages/SetlistFormPage';
import SetlistDetailPage from './pages/SetlistDetailPage';
import SetFormPage from './pages/SetFormPage';
import SongCollectionFormPage from './pages/SongCollectionFormPage';
import SongCollectionDetailPage from './pages/SongCollectionDetailPage';
import SetDetailPage from './pages/SetDetailPage';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import EditProfile from './pages/EditProfile';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import MagicLinkLogin from './pages/auth/MagicLinkLogin';
import AuthCallback from './pages/auth/AuthCallback';
import InviteComplete from './pages/auth/InviteComplete';
import EmailConfirmation from './pages/auth/EmailConfirmation';
import ResetPassword from './pages/auth/ResetPassword';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/auth/magic-link",
    element: <MagicLinkLogin />
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />
  },
  {
    path: "/auth/invite-complete",
    element: <InviteComplete />
  },
  {
    path: "/auth/confirm-email",
    element: <EmailConfirmation />
  },
  {
    path: "/auth/reset-password",
    element: <ResetPassword />
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
    path: "/setlists/:setlistId",
    element: <PrivateRoute><Layout><SetlistDetailPage /></Layout></PrivateRoute>
  },
  {
    path: "/setlists/edit/:setlistId",
    element: <PrivateRoute><Layout><SetlistFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/setlists/:setlistId/sets/add",
    element: <PrivateRoute><Layout><SetFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/setlists/:setlistId/sets/:setId/edit",
    element: <PrivateRoute><Layout><SetFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/song-collections",
    element: <PrivateRoute><Layout><ManageSongCollections /></Layout></PrivateRoute>
  },
  {
    path: "/song-collections/add",
    element: <PrivateRoute><Layout><SongCollectionFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/song-collections/edit/:collectionId",
    element: <PrivateRoute><Layout><SongCollectionFormPage /></Layout></PrivateRoute>
  },
  {
    path: "/song-collections/:collectionId",
    element: <PrivateRoute><Layout><SongCollectionDetailPage /></Layout></PrivateRoute>
  },
  {
    path: "/setlists/:setlistId/sets/:setId",
    element: <PrivateRoute><Layout><SetDetailPage /></Layout></PrivateRoute>
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