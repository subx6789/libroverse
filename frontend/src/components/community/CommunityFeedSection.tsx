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
  Users,
  TrendingUp,
  X,
} from 'lucide-react';
import { usePostStore } from '../../store/usePostStore';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CreatePostCard } from './CreatePostCard';
import { PostCard } from './PostCard';
import { SuggestedUsersWidget } from './SuggestedUsersWidget';
import { UserProfileModal } from './UserProfileModal';
import type { User } from '../../types';

interface CommunityFeedSectionProps {
  onOpenAuth: () => void;
  onNavigateStore: () => void;
}

const TRENDING_HASHTAGS = [
  { tag: '#ReadingGoals', count: '1.2k posts' },
  { tag: '#SciFi', count: '890 posts' },
  { tag: '#Philosophy', count: '740 posts' },
  { tag: '#BookReview', count: '630 posts' },
  { tag: '#TechNotes', count: '510 posts' },
  { tag: '#SelfGrowth', count: '480 posts' },
];

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
    feedTab,
    setFeedTab,
    activeHashtag,
    setActiveHashtag,
  } = usePostStore();

  const { fetchUserProfile, searchUsers } = useUserStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchResultsUsers, setSearchResultsUsers] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    fetchPosts(undefined, user?._id);
  }, [fetchPosts, user?._id]);

  const topics = [
    'All',
    'General Discussion',
    'Book Reviews & Ratings',
    'Reading Notes & Highlights',
    'Tech & Software Architecture',
    'Science Fiction & Fantasy',
    'Self-Improvement & Habits',
  ];

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length >= 2) {
      setIsSearchingUsers(true);
      const matched = await searchUsers(val.trim());
      setSearchResultsUsers(matched);
      setIsSearchingUsers(false);
    } else {
      setSearchResultsUsers([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(searchQuery.trim(), user?._id);
  };

  const handleSelectUser = (selectedUser: User) => {
    fetchUserProfile(selectedUser._id);
    setProfileModalOpen(true);
    setSearchResultsUsers([]);
  };

  const handleHashtagClick = (hashtag: string) => {
    setActiveHashtag(hashtag);
    setSearchQuery(hashtag);
  };

  const clearActiveHashtag = () => {
    setActiveHashtag(null);
    setSearchQuery('');
    fetchPosts();
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Universal Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Reader Social Community</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reader Thoughts & Discussions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect with fellow readers, discover trending book topics, and follow great minds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPosts(searchQuery, user?._id)}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-500' : ''}`} />
          </button>

          <button
            onClick={onNavigateStore}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Library Catalog</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout: Left Topics -> Center Feed Stream -> Right Trends & Suggested */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6">
        
        {/* Left Sidebar: Topics & Current Reader Mini Profile */}
        <aside className="lg:col-span-1 space-y-4">
          
          {/* User Mini Profile Card if Logged In */}
          {user && (
            <div
              onClick={() => handleSelectUser(user)}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 cursor-pointer hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0 group-hover:ring-2 ring-indigo-600 transition-all">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>View your reader profile</span>
                <span className="text-indigo-600 font-bold">➔</span>
              </div>
            </div>
          )}

          {/* Topics Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-sky-500" />
              <span>Channels & Topics</span>
            </h3>

            <div className="space-y-1">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTopic === t
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {t === 'All' ? '🌐 All Channels' : t}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Main Social Stream */}
        <main className="lg:col-span-2 space-y-4">
          
          {/* Twitter/X-Style Feed Switcher Tabs: "For You" & "Following" */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex border-b">
            <button
              onClick={() => setFeedTab('for-you')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer relative ${
                feedTab === 'for-you'
                  ? 'text-slate-900 bg-slate-50/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>For You (Global)</span>
              {feedTab === 'for-you' && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-sky-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                  return;
                }
                setFeedTab('following', user._id);
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer relative ${
                feedTab === 'following'
                  ? 'text-slate-900 bg-slate-50/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Following Feed</span>
              {feedTab === 'following' && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-sky-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Active Hashtag Filter Banner (if filtering by #tag) */}
          {activeHashtag && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-sky-500" />
                Filtered by hashtag: <span className="underline">{activeHashtag}</span>
              </span>
              <button
                onClick={clearActiveHashtag}
                className="p-1 hover:bg-sky-200 rounded-lg transition-colors cursor-pointer"
                title="Clear filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Fast Twitter-Style Composer */}
          <CreatePostCard onOpenAuth={onOpenAuth} />

          {/* Sort Filter Bar */}
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500">
            <span>Filter Stream:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setSortBy('latest')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'latest' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3 h-3" /> Latest
              </button>
              <button
                onClick={() => setSortBy('top')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'top' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500" /> Top
              </button>
              <button
                onClick={() => setSortBy('discussed')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'discussed' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-sky-500" /> Discussed
              </button>
            </div>
          </div>

          {/* Posts Feed Stream */}
          {posts.length > 0 ? (
            <div className="space-y-3.5">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onOpenAuth={onOpenAuth}
                  onSelectUser={handleSelectUser}
                  onHashtagClick={handleHashtagClick}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                {feedTab === 'following'
                  ? 'No posts from people you follow yet.'
                  : 'No community thoughts found in this view.'}
              </p>
              <p className="text-xs text-slate-400">
                {feedTab === 'following'
                  ? 'Check out the "Suggested Readers" sidebar and follow book enthusiasts!'
                  : 'Be the first to share a thought, quote, or review!'}
              </p>
            </div>
          )}
        </main>

        {/* Right Sidebar: Universal Search, Trending Hashtags, Suggested Readers */}
        <aside className="lg:col-span-1 space-y-4">
          
          {/* Universal Search Bar */}
          <div className="relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search posts, #tags, readers..."
                className="input-field pl-9.5! py-2! text-xs bg-white shadow-xs rounded-2xl"
              />
            </form>

            {/* Instant Reader Search Dropdown Results */}
            {searchResultsUsers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-30 space-y-1 animate-in fade-in">
                <p className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">
                  Matching Readers
                </p>
                {searchResultsUsers.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => handleSelectUser(u)}
                    className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Hashtags Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-500" />
              <span>Trending in LibroVerse</span>
            </h3>

            <div className="space-y-2">
              {TRENDING_HASHTAGS.map((item) => (
                <div
                  key={item.tag}
                  onClick={() => handleHashtagClick(item.tag)}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                >
                  <div>
                    <p className="text-xs font-bold text-sky-500 group-hover:underline">{item.tag}</p>
                    <p className="text-[10px] text-slate-400">{item.count}</p>
                  </div>
                  <span className="text-slate-400 text-xs group-hover:text-sky-500 transition-colors">➔</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Readers Widget */}
          <SuggestedUsersWidget
            onOpenAuth={onOpenAuth}
            onSelectUser={handleSelectUser}
          />
        </aside>

      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenAuth={onOpenAuth}
      />
    </section>
  );
};
