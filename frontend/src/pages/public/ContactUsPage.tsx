import React from 'react';
import {
  Mail,
  MessageSquare,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Globe,
  BookOpen,
  Send,
} from 'lucide-react';

export const ContactUsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
          <Mail className="w-3.5 h-3.5 text-sky-500" />
          <span>Contact Channels</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Get in Touch with LibroVerse
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Connect directly with our engineering, author curation, and reader support teams.
        </p>
      </div>

      {/* Main Direct Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Email Support */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">General & Reader Support</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Questions regarding account setup, in-browser eBook reading, or technical inquiries.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <a
              href="mailto:support@libroverse.app"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline font-mono"
            >
              <span>support@libroverse.app</span>
              <Send className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Author Inquiries */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-sky-300 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Author & Publisher Desk</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Inquire about digital publication indexing, featured eBook collections, and verified author badges.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <a
              href="mailto:authors@libroverse.app"
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline font-mono"
            >
              <span>authors@libroverse.app</span>
              <Send className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Moderation & Security */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-purple-300 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Community & Trust Team</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Report community violations, copyright queries, or feedback regarding platform moderation.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <a
              href="mailto:trust@libroverse.app"
              className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline font-mono"
            >
              <span>trust@libroverse.app</span>
              <Send className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>

      {/* Response Guarantee Info Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">24-Hour Response Commitment</h4>
            <p className="text-xs text-slate-500">Our support coordinators respond to all reader and author emails within 1 business day.</p>
          </div>
        </div>

        <a
          href="mailto:support@libroverse.app"
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          Send an Email Now
        </a>
      </div>

    </div>
  );
};
