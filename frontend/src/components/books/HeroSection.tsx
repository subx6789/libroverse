import React from 'react';
import { BookOpen, ShieldCheck, Zap, UploadCloud, Compass, Sparkles } from 'lucide-react';
import { useBookStore } from '../../store/useBookStore';

interface HeroSectionProps {
  onPublishClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onPublishClick }) => {
  const { books } = useBookStore();

  return (
    <div className="relative border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          
          {/* Solid Light Theme Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Digital Library & Community Hub</span>
          </div>

          {/* Solid Modern Typography */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Read, Publish and Annotate <span className="text-indigo-600">eBooks Online</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover thousands of titles, publish your own books, highlight key passages, and build your digital bookshelf seamlessly.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onPublishClick}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Publish eBook</span>
            </button>
            <a
              href="#catalog"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Browse Catalog</span>
            </a>
          </div>

          {/* Solid Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 max-w-2xl mx-auto text-left">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Available Titles</p>
                <p className="text-sm font-bold text-slate-900">{books.length} Books in Library</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Reading Speed</p>
                <p className="text-sm font-bold text-slate-900">Instant PDF Access</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Study Features</p>
                <p className="text-sm font-bold text-slate-900">Highlighter & Notes</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
