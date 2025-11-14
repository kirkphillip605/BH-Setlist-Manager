import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token) {
          setStatus('error');
          setError('Invalid confirmation link');
          return;
        }

        if (type === 'email_change') {
          // Handle email change confirmation
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email_change'
          });

          if (error) {
            throw error;
          }

          setStatus('success');
          setTimeout(() => navigate('/profile'), 3000);
        } else {
          // Handle regular email confirmation
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (error) {
            throw error;
          }

          setStatus('success');
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setError(error.message);
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-300">Confirming your email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4">
        <div className="card-modern p-6 sm:p-8 w-full max-w-md text-center fade-in">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Email Confirmed!</h2>
          <p className="text-zinc-300 mb-6">
            Your email has been successfully confirmed. You&apos;ll be redirected shortly.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="card-modern p-6 sm:p-8 w-full max-w-md text-center fade-in">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-4">Confirmation Failed</h2>
        <p className="text-zinc-300 mb-6">
          {error || 'There was an error confirming your email. The link may be expired or invalid.'}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Mail size={16} className="mr-2" />
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmation;