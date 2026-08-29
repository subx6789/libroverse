import React from 'react';
import {
  BookOpen,
  Sparkles,
  Compass,
  ArrowRight,
  Zap,
  MessageSquare,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreAbout: () => void;
  onExploreContact: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExploreAbout,
}) => {
  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>The Minimalist Digital Library & Social Reading Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Where curious minds read, discuss, and discover eBooks.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          LibroVerse delivers distraction-free in-browser reading, lossy & lossless pre-upload media compression, and a focused social reader community in a clean, solid workspace.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreAbout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-slate-500" />
            <span>Learn More</span>
          </button>
        </div>

        {/* Highlight Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-left">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">100%</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Free-Tier Cloud Ready</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-left">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">Sub-50ms</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">In-Browser PDF Reader</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-left">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">Smart</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Direct Stream Compressor</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-left">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">Focused</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Micro-Reader Feed</p>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-1.5 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Designed for Readers. Built for Simplicity.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Everything you need to catalog your digital bookshelf and discuss with fellow readers without cognitive clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Instant eBook Reader</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Read digital eBooks cleanly inside the browser with focus viewing, zoom controls, full-screen reading, and instant local note tagging.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Reader Community Feed</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Share quick insights, hashtag book titles, highlight passages, and follow fellow readers without social algorithmic noise.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Client-Side Compression</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatic lossless PDF and image optimization reduces bandwidth and upload time by up to 80% before streaming directly to Cloudinary.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-xl p-8 sm:p-10 text-center text-white space-y-5 shadow-sm border border-slate-800">
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Ready to immerse yourself in LibroVerse?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Create your account in seconds to unlock full access to the curated catalog and reader network.
            </p>
          </div>

          <button
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            Create Your Account
          </button>
        </div>
      </section>

    </div>
  );
};
