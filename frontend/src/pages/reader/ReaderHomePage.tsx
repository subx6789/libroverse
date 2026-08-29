import React from 'react';
import {
  BookOpen,
  Library,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Bookmark,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useBookStore } from '../../store/useBookStore';
import { usePostStore } from '../../store/usePostStore';
import type { Book } from '../../types';

interface ReaderHomePageProps {
  onNavigateCatalog: () => void;
  onNavigateCommunity: () => void;
  onReadBook: (book: Book) => void;
}

export const ReaderHomePage: React.FC<ReaderHomePageProps> = ({
  onNavigateCatalog,
  onNavigateCommunity,
  onReadBook,
}) => {
  const { user } = useAuthStore();
  const { books } = useBookStore();
  const { posts } = usePostStore();

  const recentBooks = books.slice(0, 4);
  const featuredBook = books[0];
  const recentPosts = posts.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in">
      
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-indigo-200 text-xs font-bold border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Reader Personal Hub</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name.split(' ')[0] || 'Reader'} 👋
          </h1>

          <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
            "A reader lives a thousand lives before he dies. The man who never reads lives only one."
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onNavigateCatalog}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs sm:text-sm shadow-xs hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <Library className="w-4 h-4 text-indigo-600" />
              <span>Browse Catalog ({books.length})</span>
            </button>

            <button
              onClick={onNavigateCommunity}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Reader Community</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured eBook & Quick Reader Spotlight */}
      {featuredBook && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Spotlight Publication</span>
            </h2>
            <button
              onClick={onNavigateCatalog}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All eBooks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
            <img
              src={featuredBook.coverImage}
              alt={featuredBook.title}
              className="w-36 h-52 sm:w-44 sm:h-64 object-cover rounded-2xl shadow-lg border border-slate-200 shrink-0"
            />
            <div className="space-y-3 flex-1 text-center md:text-left">
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                {featuredBook.genre}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">{featuredBook.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {featuredBook.description}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={() => onReadBook(featuredBook)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read In Browser</span>
                </button>
                <a
                  href={featuredBook.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2-Column Section: Library Picks + Recent Community Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Additions */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Recent Library Additions</span>
            </h3>
            <button
              onClick={onNavigateCatalog}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Browse all {books.length}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentBooks.map((b) => (
              <div
                key={b._id}
                onClick={() => onReadBook(b)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
              >
                <img
                  src={b.coverImage}
                  alt={b.title}
                  className="w-14 h-20 object-cover rounded-xl shadow-2xs border border-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{b.genre}</span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {b.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Added {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right 1 Col: Community Discussions Pulse */}
        <section className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" />
              <span>Community Pulse</span>
            </h3>
            <button
              onClick={onNavigateCommunity}
              className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
            >
              Open Feed
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            {recentPosts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentPosts.map((p) => (
                  <div
                    key={p._id}
                    onClick={onNavigateCommunity}
                    className="py-2.5 first:pt-0 last:pb-0 cursor-pointer group"
                  >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {p.author?.name ? p.author.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">{p.author?.name || 'Reader'}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{p.topic}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-snug group-hover:text-slate-900 transition-colors">
                    {p.content}
                  </p>
                </div>
              ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No community posts yet.</p>
            )}
          </div>
        </section>

      </div>

    </div>
  );
};
