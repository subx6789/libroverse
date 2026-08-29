import React from 'react';
import {
  BookOpen,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  HardDrive,
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
  onExploreContact,
}) => {
  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>The Next-Generation Digital Library & Reader Social Hub</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Where <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-sky-600">Great Minds</span> Read, Discuss, and Discover eBooks.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          LibroVerse brings together in-browser eBook reading, smart pre-upload compression, and a Twitter-style reader community into one seamless digital experience.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreAbout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-slate-500" />
            <span>Learn About Us</span>
          </button>
        </div>

        {/* Highlight Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-indigo-600">100%</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Free-Tier Cloud Ready</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-sky-500">Zero-Wait</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">In-Browser PDF Reader</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-purple-600">Smart</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Media & PDF Compressor</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">Social</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Twitter-Style Reader Feed</p>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Designed for Readers, Built for Scale
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Everything you need to build your digital bookshelf and connect with fellow literature lovers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Instant Online eBook Reader</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Read digital eBooks directly in your browser with distraction-free viewing, page-by-page rendering, zoom controls, and instant downloads.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-sky-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Twitter-Style Reader Community</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Share quick thoughts, highlight trending `#hashtags`, tag any eBook in the library, and follow fellow great minds to curate your personalized feed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Built-in Lossless Compression</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Automatic client-side PDF and media optimization reduces bandwidth and storage by up to 80% before streaming directly to Cloudinary.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to immerse yourself in LibroVerse?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Create your free account today and unlock complete access to the library catalog, eBook reader, and social reader community.
            </p>
          </div>

          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Create Your Free Account Now
          </button>
        </div>
      </section>

    </div>
  );
};
