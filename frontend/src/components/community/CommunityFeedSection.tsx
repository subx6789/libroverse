import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Flame,
  Clock,
  Sparkles,
  Search,
  RefreshCw,
  Hash,
  Compass,
} from 'lucide-react';
import { usePostStore } from '../../store/usePostStore';
import { CreatePostCard } from './CreatePostCard';
import { PostCard } from './PostCard';

interface CommunityFeedSectionProps {
  onOpenAuth: () => void;
  onNavigateStore: () => void;
}

export const CommunityFeedSection: React.FC<CommunityFeedSectionProps> = ({
  onOpenAuth,
  onNavigateStore,
}) => {
  const {
    posts,
    fetchPosts,
    isLoading,
    selectedTopic,
    setSelectedTopic,
    sortBy,
    setSortBy,
  } = usePostStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const topics = [
    'All',
    'General Discussion',
    'Book Reviews & Ratings',
    'Reading Notes & Highlights',
    'Tech & Software Architecture',
    'Science Fiction & Fantasy',
    'Self-Improvement & Habits',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(searchQuery.trim());
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>eBook Community & Book Clubs</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reader Feeds & Discussions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect with fellow readers, share insightful reviews, attach media, and engage in book clubs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPosts()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={onNavigateStore}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Library Books</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Topics Sidebar + Center Feed + Right Clubs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6">
        
        {/* Left Topic Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-indigo-600" />
              <span>Community Topics</span>
            </h3>

            <div className="space-y-1">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTopic === t
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {t === 'All' ? '🌐 All Discussions' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Friendly Guidelines</span>
            </p>
            <p className="text-[11px] text-indigo-800/80 leading-relaxed">
              Be respectful, share meaningful insights, and avoid spoilers without warning. Images are limited to 2MB and video clips to 10MB.
            </p>
          </div>
        </aside>

        {/* Center Main Feed */}
        <main className="lg:col-span-3 space-y-5">
          
          {/* Post Creation Form */}
          <CreatePostCard onOpenAuth={onOpenAuth} />

          {/* Filter Bar & Feed Tabs */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Sort Tabs */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
              <button
                onClick={() => setSortBy('latest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'latest' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Latest</span>
              </button>

              <button
                onClick={() => setSortBy('top')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'top' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Top Liked</span>
              </button>

              <button
                onClick={() => setSortBy('discussed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'discussed' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                <span>Most Discussed</span>
              </button>
            </div>

            {/* Search Posts */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts & reviews..."
                className="input-field pl-9! py-1.5! text-xs"
              />
            </form>

          </div>

          {/* Posts Feed Stream */}
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} onOpenAuth={onOpenAuth} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No community posts in this topic yet.</p>
              <p className="text-xs text-slate-400">Be the first to start a conversation or review a book!</p>
            </div>
          )}

        </main>

      </div>
    </section>
  );
};
