import React from 'react';
import {
  BookOpen,
  Library,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Welcome Banner */}
      <div className="rounded-xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reader Workspace</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Welcome back, {user?.name.split(' ')[0] || 'Reader'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
          "A reader lives a thousand lives before he dies. The man who never reads lives only one."
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            onClick={onNavigateCatalog}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <Library className="w-4 h-4" />
            <span>Browse Library ({books.length})</span>
          </button>

          <button
            onClick={onNavigateCommunity}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Community Feed</span>
          </button>
        </div>
      </div>

      {/* Featured eBook & Quick Reader Spotlight */}
      {featuredBook && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Featured Publication</span>
            </h2>
            <button
              onClick={onNavigateCatalog}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All eBooks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row items-center gap-5">
            <img
              src={featuredBook.coverImage}
              alt={featuredBook.title}
              className="w-32 h-44 sm:w-40 sm:h-56 object-cover rounded-lg border border-slate-200 shrink-0"
            />
            <div className="space-y-2.5 flex-1 text-center md:text-left">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider border border-slate-200">
                {featuredBook.genre}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">{featuredBook.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {featuredBook.description}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <button
                  onClick={() => onReadBook(featuredBook)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open PDF Reader</span>
                </button>
                {featuredBook.file && (
                  <a
                    href={featuredBook.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Download</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2-Column Section: Library Picks + Recent Community Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Additions */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Recent Library Additions</span>
            </h3>
            <button
              onClick={onNavigateCatalog}
              className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              Browse catalog
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentBooks.map((b) => (
              <div
                key={b._id}
                onClick={() => onReadBook(b)}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 hover:border-slate-300 transition-colors cursor-pointer group"
              >
                <img
                  src={b.coverImage}
                  alt={b.title}
                  className="w-12 h-16 object-cover rounded-md border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{b.genre}</span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {b.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right 1 Col: Community Discussions Pulse */}
        <section className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Community Pulse</span>
            </h3>
            <button
              onClick={onNavigateCommunity}
              className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
            >
              Open Feed
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-2.5">
            {recentPosts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentPosts.map((p) => (
                  <div
                    key={p._id}
                    onClick={onNavigateCommunity}
                    className="py-2 first:pt-0 last:pb-0 cursor-pointer group"
                  >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[9px]">
                      {p.author?.name ? p.author.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">{p.author?.name || 'Reader'}</span>
                    <span className="text-[10px] text-slate-400 ml-auto font-mono">{p.topic}</span>
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
