// PrivacyPolicy.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

/**
 * PrivacyPolicy
 * Hard-coded Privacy Policy for Bad Habits Setlist Management System.
 * Minimal content for band-member usage, Google SSO verification.
 */
const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-zinc-900/20 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="card-modern p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              to="/"
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all duration-200 rounded-xl btn-animate"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">Privacy Policy</h1>
                <p className="text-zinc-400">Bad Habits Setlist Management System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card-modern p-8 space-y-6 prose prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">1. Information We Collect</h2>
            <p className="text-zinc-300 leading-relaxed">
              We collect basic account information when you authenticate via Google SSO, including your name and email address.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-zinc-300 space-y-2">
              <li>To authenticate and authorize band members to access the Service.</li>
              <li>To personalize your experience within the app.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">3. Data Sharing</h2>
            <p className="text-zinc-300 leading-relaxed">
              We do not share your personal information with third parties except as required by law or to comply with Google’s SSO policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">4. Data Retention</h2>
            <p className="text-zinc-300 leading-relaxed">
              We retain your information as long as your account exists or as needed to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">5. Security</h2>
            <p className="text-zinc-300 leading-relaxed">
              We implement reasonable security measures to protect your information, but cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">6. Your Rights</h2>
            <ul className="list-disc list-inside text-zinc-300 space-y-2">
              <li>You may request access to or deletion of your personal data by contacting the band's admin.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">7. Changes to This Policy</h2>
            <p className="text-zinc-300 leading-relaxed">
              We may update this Privacy Policy; changes take effect when posted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">8. Contact</h2>
            <p className="text-zinc-300 leading-relaxed">
              For privacy inquiries, contact the band's admin via email address associated with your account.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-zinc-700 flex items-center justify-between">
            <p className="text-sm text-zinc-400">Last updated: July 23, 2025</p>
            <Link
              to="/tos"
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
            >
              View Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
