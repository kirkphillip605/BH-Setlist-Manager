import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale } from 'lucide-react';

const TermsOfService = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the terms of service content
    fetch('/tos.MD')
      .then(response => response.text())
      .then(text => {
        // Simple markdown to HTML conversion
        const htmlContent = text
          .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-zinc-100 mb-6">$1</h1>')
          .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold text-zinc-100 mt-8 mb-4">$1</h2>')
          .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-zinc-200 mt-6 mb-3">$1</h3>')
          .replace(/^\*\*(.+)\*\*$/gm, '<p class="font-bold text-zinc-100 mb-4">$1</p>')
          .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>')
          .replace(/^- (.+)$/gm, '<li class="text-zinc-300 mb-2">$1</li>')
          .replace(/^(.+)$/gm, (match, line) => {
            if (line.trim() === '' || line.startsWith('<') || line.startsWith('-')) return line;
            return `<p class="text-zinc-300 mb-4 leading-relaxed">${line}</p>`;
          })
          .replace(/(<li.*<\/li>\s*)+/g, '<ul class="list-disc list-inside mb-4 space-y-2 ml-4">$&</ul>')
          .replace(/<a name="([^"]+)"><\/a>/g, '')
          .replace(/\[([^\]]+)\]\(#([^)]+)\)/g, '<a href="#$2" class="text-blue-400 hover:text-blue-300 transition-colors">$1</a>');

        setContent(htmlContent);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading terms of service:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-zinc-900/20 pointer-events-none"></div>

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
                <h1 className="text-2xl font-bold text-zinc-100">Terms of Use</h1>
                <p className="text-zinc-400">Bad Habits Setlist Management System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card-modern p-8">
          <div className="prose prose-invert max-w-none">
            <div
              className="terms-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Last updated: July 23, 2025
              </p>
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
    </div>
  );
};

export default TermsOfService;