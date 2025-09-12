import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { PageTitleProvider } from './context/PageTitleContext';
import ErrorBoundary from './components/ErrorBoundary';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Lazy load components for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ManageSongs = React.lazy(() => import('./pages/ManageSongs'));
const SongViewPage = React.lazy(() => import('./pages/SongViewPage'));
const SongFormPage = React.lazy(() => import('./pages/SongFormPage'));
const ManageSetlists = React.lazy(() => import('./pages/ManageSetlists'));
const ManageSongCollections = React.lazy(() => import('./pages/ManageSongCollections'));
const SetlistFormPage = React.lazy(() => import('./pages/SetlistFormPage'));
const SetlistDetailPage = React.lazy(() => import('./pages/SetlistDetailPage'));
const SetFormPage = React.lazy(() => import('./pages/SetFormPage'));
const SongCollectionFormPage = React.lazy(() => import('./pages/SongCollectionFormPage'));
const SongCollectionDetailPage = React.lazy(() => import('./pages/SongCollectionDetailPage'));
const SetDetailPage = React.lazy(() => import('./pages/SetDetailPage'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const Profile = React.lazy(() => import('./pages/Profile'));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword'));
const PerformanceMode = React.lazy(() => import('./pages/PerformanceMode'));

// Auth pages - don't lazy load these as they're critical for app bootstrap
import Login from './pages/Login';
import MagicLinkLogin from './pages/auth/MagicLinkLogin';
import AuthCallback from './pages/auth/AuthCallback';
import InviteComplete from './pages/auth/InviteComplete';
import EmailConfirmation from './pages/auth/EmailConfirmation';
import ResetPassword from './pages/auth/ResetPassword';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <div className="text-lg text-zinc-300">Loading...</div>
    </div>
  </div>
);

// Wrapper component for lazy-loaded pages
const LazyPage = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

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
    path: "/tos",
    element: <TermsOfService />
  },
  {
    path: "/privacy-policy", 
    element: <PrivacyPolicy />
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <Dashboard />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/songs",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <ManageSongs />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/songs/:songId",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SongViewPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/songs/add",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SongFormPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/songs/edit/:songId",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SongFormPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/setlists",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <ManageSetlists />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/setlists/add",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SetlistFormPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/setlists/:setlistId",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SetlistDetailPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/setlists/edit/:setlistId",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SetlistFormPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/setlists/:setlistId/sets/add",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SetFormPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/setlists/:setlistId/sets/:setId/edit",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SetFormPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/song-collections",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <ManageSongCollections />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/song-collections/add",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SongCollectionFormPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/song-collections/edit/:collectionId",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SongCollectionFormPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/song-collections/:collectionId",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SongCollectionDetailPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/setlists/:setlistId/sets/:setId",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <SetDetailPage />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/profile",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <Profile />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/edit-profile",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <EditProfile />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/change-password",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <ChangePassword />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/admin/users",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <UserManagement />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "/performance",
    element: (
      <PrivateRoute>
        <Layout>
          <LazyPage>
            <PerformanceMode />
          </LazyPage>
        </Layout>
      </PrivateRoute>
    )
  },
  {
    path: "*",
    element: <NotFound />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <PageTitleProvider>
        <RouterProvider router={router} />
      </PageTitleProvider>
    </AuthProvider>
  </ErrorBoundary>
);