// TermsOfService.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

/**
 * TermsOfService
 * Hard-coded Terms of Service page for Bad Habits Setlist Management System.
 * Used for Google SSO verification; minimal content for band members.
 */
const TermsOfService = () => {
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
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Scale className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">Terms of Service</h1>
                <p className="text-zinc-400">Bad Habits Setlist Management System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card-modern p-8 space-y-6 prose prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">1. Acceptance of Terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              By accessing or using the Bad Habits Setlist Management System (&quot;Service&quot;), you agree to be bound by these Terms of Use. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">2. Eligibility</h2>
            <p className="text-zinc-300 leading-relaxed">
              The Service is intended solely for members of Bad Habits. You must authenticate via Google SSO using a band member account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">3. Use of Service</h2>
            <ul className="list-disc list-inside text-zinc-300 space-y-2">
              <li>You may use the Service to manage songs, setlists, and performance details.</li>
              <li>You agree not to modify, distribute, or reproduce any part of the Service outside band activities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">4. Intellectual Property</h2>
            <p className="text-zinc-300 leading-relaxed">
              All content and software are the property of Bad Habits or its licensors. Unauthorized use is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">5. Disclaimer of Warranties</h2>
            <p className="text-zinc-300 leading-relaxed">
              The Service is provided &quot;as is&quot; without warranties of any kind, either express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">6. Limitation of Liability</h2>
            <p className="text-zinc-300 leading-relaxed">
              In no event shall Bad Habits be liable for any indirect, incidental, or consequential damages arising out of use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">7. Changes to Terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              Bad Habits may modify these terms at any time. Updated terms take effect when posted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-100">8. Governing Law</h2>
            <p className="text-zinc-300 leading-relaxed">
              These Terms are governed by the laws of the state where the band is based.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-zinc-700 flex items-center justify-between">
            <p className="text-sm text-zinc-400">Last updated: July 23, 2025</p>
            <Link
              to="/privacy-policy"
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
