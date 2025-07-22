import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Headphones, Mail, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, resetPassword, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setForgotPasswordLoading(true);

    try {
      await resetPassword(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  if (showForgotPassword) {
    if (forgotPasswordSuccess) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
          <div className="theme-card p-6 sm:p-8 auth-max-width text-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-heading-xl mb-4">Check Your Email</h2>
            <p className="text-body mb-6">
              We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>
            </p>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordSuccess(false);
                setForgotPasswordEmail('');
              }}
              className="text-link-underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="theme-card p-6 sm:p-8 auth-max-width">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-heading-xl">Forgot Password</h2>
            <p className="text-muted mt-2">Enter your email to reset your password</p>
          </div>

          {error && (
            <div className="alert-error" role="alert">
              <strong className="font-semibold">Error!</strong>
              {error}
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="section-spacing">
            <div className="form-group">
              <label htmlFor="forgotEmail" className="form-label">Email Address</label>
              <input
                type="email"
                id="forgotEmail"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                className="input-theme"
                placeholder="Enter your email address"
              />
            </div>
            <button
              type="submit"
              disabled={forgotPasswordLoading}
              className="btn-primary btn-large w-full"
            >
              {forgotPasswordLoading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={16} className="mr-2" />
                  Send Reset Link
                </>
              )}
            </button>
            <div className="text-center">
              <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-link-underline"
            >
              Back to Login
            </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative">
      <div className="page-background"></div>
      
      <div className="relative auth-max-width fade-in">
        <div className="theme-card p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Headphones size={24} className="text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-heading-xl tracking-tight">Bad Habits Band</h1>
            <p className="text-muted">Setlist Management Platform</p>
          </div>
        </div>
      
        {error && (
          <div className="alert-error" role="alert">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">!</span>
              </div>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="section-spacing">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-secondary btn-large w-full mb-6"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-900 text-muted rounded-lg">Or continue with email</span>
            </div>
          </div>

          <div className="section-spacing">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-theme"
              placeholder="Enter your email"
            />
            </div>
          <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-theme"
              placeholder="Enter your password"
            />
          </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-large w-full"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} className="mr-2" />
                Sign In
              </>
            )}
          </button>

          <div className="flex flex-col space-y-3 text-center pt-6 border-t border-zinc-700">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-link"
            >
              Forgot your password?
            </button>
            <Link
              to="/auth/magic-link"
              className="text-sm text-link font-medium inline-flex items-center justify-center"
            >
              Or sign in with magic link
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
