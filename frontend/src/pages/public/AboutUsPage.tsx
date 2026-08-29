import React from 'react';
import {
  Compass,
  Target,
  Sparkles,
  BookOpen,
  Users,
  ShieldCheck,
  Zap,
  Globe,
} from 'lucide-react';

interface AboutUsPageProps {
  onGetStarted: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onGetStarted }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Our Vision & Story</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Empowering Great Minds Through Open Reading
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          LibroVerse was founded on the belief that reading should be effortless, engaging, and social without bloated corporate walls.
        </p>
      </div>

      {/* Philosophy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To provide an accessible, high-performance ecosystem where authors and digital thinkers can publish and readers can discover, read, and converse about ideas that shape our world.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">High-Performance Engineering</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Engineered with strict zero-cost optimization: client-side PDF and image compression, memory streaming directly to Cloudinary, and reactive client state management.
          </p>
        </div>

      </div>

      {/* Community Values */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Core Values of the LibroVerse Community</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Open Knowledge</h4>
            <p className="text-xs text-slate-600">Free and open digital reading accessible across any device browser.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <Users className="w-5 h-5 text-sky-600" />
            <h4 className="text-sm font-bold text-slate-900">Constructive Dialogue</h4>
            <p className="text-xs text-slate-600">Thoughtful book reviews, quote sharing, and hashtag-driven book clubs.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Privacy & Respect</h4>
            <p className="text-xs text-slate-600">No invasive tracking, no ad clutter, strictly reader-first experience.</p>
          </div>
        </div>
      </div>

      {/* Join CTA */}
      <div className="text-center space-y-4 pt-4">
        <h3 className="text-xl font-bold text-slate-900">Join our growing reader community today</h3>
        <button
          onClick={onGetStarted}
          className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Sign In or Register
        </button>
      </div>

    </div>
  );
};
