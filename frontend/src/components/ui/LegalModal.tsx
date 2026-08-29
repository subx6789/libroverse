import React from 'react';
import { X, ShieldCheck, FileText, Lock, Cookie } from 'lucide-react';

export type LegalModalType = 'terms' | 'privacy' | 'cookies' | null;

interface LegalModalProps {
  type: LegalModalType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const renderContent = () => {
    switch (type) {
      case 'terms':
        return {
          title: 'Terms of Service',
          icon: <FileText className="w-5 h-5 text-indigo-600" />,
          subtitle: 'Last updated: August 2026',
          body: (
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">1. Acceptance of Terms</h4>
                <p>
                  By accessing and using LibroVerse, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">2. User Accounts & Responsibilities</h4>
                <p>
                  You are responsible for maintaining the security of your account and password. You agree to use LibroVerse exclusively for lawful reading, publishing, and community discussion purposes.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">3. Intellectual Property & Digital eBooks</h4>
                <p>
                  All eBooks, publication covers, and textual reviews hosted on LibroVerse belong to their respective authors and copyright holders. Unauthorized redistribution or commercial exploitation without permission is strictly prohibited.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">4. Community Guidelines & Account Suspension</h4>
                <p>
                  Harassment, spamming, copyright infringement, or malicious behavior in the reader social feed may result in immediate suspension or permanent ban by platform administrators.
                </p>
              </section>
            </div>
          ),
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: <Lock className="w-5 h-5 text-indigo-600" />,
          subtitle: 'Your privacy is our priority',
          body: (
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">1. Information We Collect</h4>
                <p>
                  We collect your display name, email address, avatar, reading bookmarks, and community posts necessary to provide you with a personalized eBook and social experience.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">2. How We Use Information</h4>
                <p>
                  Your information is utilized solely to deliver customized feeds, preserve your reading progress, enable community interactions, and optimize Cloudinary digital asset delivery.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">3. Zero Data Monetization</h4>
                <p>
                  We never sell, rent, or monetize your personal information or reading behavior to third-party advertisers.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">4. Data Security</h4>
                <p>
                  All authentication passwords are encrypted using industry-standard bcrypt hashing, and API communication is strictly secured over HTTPS.
                </p>
              </section>
            </div>
          ),
        };
      case 'cookies':
        return {
          title: 'Cookie & Storage Policy',
          icon: <Cookie className="w-5 h-5 text-indigo-600" />,
          subtitle: 'Transparent storage management',
          body: (
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">1. Essential Cookies & LocalStorage</h4>
                <p>
                  LibroVerse uses secure authentication tokens (JWT) and browser localStorage to remember your active session, theme preferences, and reading progress.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">2. Performance & Delivery</h4>
                <p>
                  Client-side caching and media preloading are utilized to ensure instantaneous PDF viewing and compressed image rendering.
                </p>
              </section>
              <section className="space-y-1">
                <h4 className="font-bold text-slate-900">3. Managing Preferences</h4>
                <p>
                  You can clear your stored cookies and local session data at any time via your browser settings or by clicking "Log Out".
                </p>
              </section>
            </div>
          ),
        };
    }
  };

  const content = renderContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-indigo-50 border border-indigo-100">
              {content.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{content.title}</h3>
              <p className="text-xs text-slate-500">{content.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {content.body}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified LibroVerse Policy
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
