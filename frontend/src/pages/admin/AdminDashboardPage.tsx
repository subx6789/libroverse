import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  Search,
  RefreshCw,
  LogOut,
  Edit3,
  Trash2,
  FileText,
  Compass,
  FolderPlus,
  HardDrive,
  PieChart,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Users,
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  Heart,
  Ban,
  UserCheck,
} from 'lucide-react';
import { useBookStore } from '../../store/useBookStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useUserStore } from '../../store/useUserStore';
import { useToast } from '../../components/ui/ToastContext';
import type { Book, User } from '../../types';

interface AdminDashboardPageProps {
  onOpenUpload: () => void;
  onEditBook: (book: Book) => void;
  onReadBook: (book: Book) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onOpenUpload,
  onEditBook,
  onReadBook,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { books, fetchBooks, isLoading, deleteBook } = useBookStore();
  const { categories, fetchCategories, createCategory, deleteCategory } = useCategoryStore();
  const { posts, fetchPosts } = usePostStore();
  const { users: usersList, fetchUsers, toggleBanUser } = useUserStore();
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();

  // Derive activeTab from URL path (/admin/catalog, /admin/categories, /admin/users, or /admin / /admin/analytics)
  const getTabFromPath = (): 'analytics' | 'catalog' | 'categories' | 'users' => {
    const path = location.pathname;
    if (path.includes('/catalog')) return 'catalog';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/users')) return 'users';
    return 'analytics';
  };

  const activeTab = getTabFromPath();
  const setActiveTab = (tab: 'analytics' | 'catalog' | 'categories' | 'users') => {
    if (tab === 'analytics') navigate('/admin');
    else navigate(`/admin/${tab}`);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState('All');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchPosts();
    fetchUsers();
  }, [fetchBooks, fetchCategories, fetchPosts, fetchUsers]);

  const genres = useMemo(() => {
    return ['All', ...categories.map((c) => c.name)];
  }, [categories]);

  // Executive Business & Community Analytics
  const analyticsData = useMemo(() => {
    const totalBooks = books.length;
    const totalCategories = categories.length;
    const totalUsers = usersList.length;
    const bannedUsers = usersList.filter((u) => u.isBanned).length;
    const activeUsers = totalUsers - bannedUsers;

    const totalPosts = posts.length;
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes_count || 0), 0);
    const totalComments = posts.reduce((acc, p) => acc + (p.total_comments_count || 0), 0);

    // Storage metrics
    const totalPdfMb = books.reduce((acc, b) => acc + (b.pdf_size_mb || 0), 0);
    const totalCoverMb = books.reduce((acc, b) => acc + (b.cover_size_mb || 0), 0);
    const totalStorageMb = Math.round((totalPdfMb + totalCoverMb) * 100) / 100;
    const avgBookSizeMb = totalBooks > 0 ? Math.round((totalPdfMb / totalBooks) * 100) / 100 : 0;

    // Category distribution
    const categoryStats = categories.map((c) => {
      const count = books.filter((b) => b.genre?.toLowerCase() === c.name?.toLowerCase()).length;
      const pct = totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0;
      return {
        id: c._id,
        name: c.name,
        count,
        percentage: pct,
      };
    }).sort((a, b) => b.count - a.count);

    const topCategory = categoryStats[0] || { name: 'None', count: 0 };
    const recentUploads = [...books].slice(0, 5);

    return {
      totalBooks,
      totalCategories,
      totalUsers,
      bannedUsers,
      activeUsers,
      totalPosts,
      totalLikes,
      totalComments,
      totalStorageMb,
      avgBookSizeMb,
      categoryStats,
      topCategory,
      recentUploads,
    };
  }, [books, categories, usersList, posts]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof b.author === 'object' && b.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre = selectedGenreFilter === 'All' || b.genre === selectedGenreFilter;
      return matchesSearch && matchesGenre;
    });
  }, [books, searchQuery, selectedGenreFilter]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      return (
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
      );
    });
  }, [usersList, userSearchQuery]);

  const handleDelete = async (book: Book) => {
    if (window.confirm(`Are you sure you want to remove "${book.title}" from the library catalog?`)) {
      try {
        await deleteBook(book._id);
        showToast('Publication deleted successfully', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete publication', 'error');
      }
    }
  };

  const handleToggleUserBan = async (targetUser: User) => {
    const actionText = targetUser.isBanned ? 'unban and restore' : 'suspend / ban';
    if (window.confirm(`Are you sure you want to ${actionText} ${targetUser.name}?`)) {
      try {
        await toggleBanUser(
          targetUser._id,
          targetUser.isBanned ? '' : 'Violating community discussion guidelines'
        );
        showToast(targetUser.isBanned ? 'User restored successfully' : 'User account suspended', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to update user status', 'error');
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) {
      showToast('Category name cannot be empty', 'error');
      return;
    }
    try {
      setIsCreatingCategory(true);
      const created = await createCategory(newCategoryInput.trim());
      showToast(`Category "${created.name}" added successfully!`, 'success');
      setNewCategoryInput('');
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      try {
        await deleteCategory(id);
        showToast(`Category "${name}" deleted`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete category', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row">
      
      {/* 🏛️ Dedicated Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        
        <div>
          {/* Admin Header */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm text-slate-900 leading-tight">
                LibroVerse
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2.5 space-y-1">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Business Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>eBook Management</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>Category Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Moderation</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer & User Card */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Administrator</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1 rounded">Active</span>
            </div>
            <p className="text-xs font-bold text-slate-900 mt-1 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@libroverse.com'}</p>
            
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </aside>

      {/* 💻 Main Dashboard Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Action Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xs border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === 'analytics' && 'Platform Overview & Category Analytics'}
              {activeTab === 'catalog' && 'Library Publications & Catalog'}
              {activeTab === 'categories' && 'Dynamic Categories Management'}
              {activeTab === 'users' && 'User Management & Community Moderation'}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === 'analytics' && 'Executive metrics, community engagement, cloud storage, and audience distribution'}
              {activeTab === 'catalog' && `Managing ${books.length} publications available in the digital library`}
              {activeTab === 'categories' && 'Create, customize, and manage categories across your bookstore'}
              {activeTab === 'users' && `Managing ${usersList.length} registered platform readers and creators`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                fetchBooks();
                fetchCategories();
                fetchPosts();
                fetchUsers();
              }}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish New eBook</span>
            </button>
          </div>
        </header>

        {/* 📊 Tab 1: Comprehensive Business & Category Analytics */}
        {activeTab === 'analytics' && (
          <div className="p-6 space-y-6 flex-1">
            
            {/* Top 4 KPI Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Registered Users</span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{analyticsData.totalUsers}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{analyticsData.activeUsers} active / {analyticsData.bannedUsers} suspended</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Community Activity</span>
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{analyticsData.totalPosts}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>{analyticsData.totalLikes} likes • {analyticsData.totalComments} comments</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">eBook Catalog</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{analyticsData.totalBooks}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {analyticsData.totalCategories} active categories
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Cloud Storage</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <HardDrive className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{analyticsData.totalStorageMb} <span className="text-sm font-semibold text-slate-500">MB</span></p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Avg: {analyticsData.avgBookSizeMb} MB / eBook
                </p>
              </div>

            </div>

            {/* Middle Section: Category Breakdown Bars & Volume Share */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Category Volume & Visual Distribution Graph */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      <span>Category Distribution & Publication Share</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visual catalog breakdown across all configured categories
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    {analyticsData.totalCategories} Categories
                  </span>
                </div>

                {analyticsData.categoryStats.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {analyticsData.categoryStats.map((stat, idx) => {
                      const colors = [
                        'bg-indigo-600',
                        'bg-sky-500',
                        'bg-emerald-500',
                        'bg-amber-500',
                        'bg-purple-600',
                        'bg-rose-500',
                      ];
                      const barColor = colors[idx % colors.length];

                      return (
                        <div key={stat.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-800 flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
                              {stat.name}
                            </span>
                            <span className="text-slate-500 font-semibold">
                              {stat.count} {stat.count === 1 ? 'book' : 'books'} ({stat.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className={`${barColor} h-3 rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(stat.percentage, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs">No categories created yet.</p>
                  </div>
                )}
              </div>

              {/* Business Overview & Quick Metrics */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    <span>Catalog & User Health</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Community & platform metrics</p>
                  
                  <div className="space-y-3 mt-5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-semibold text-slate-600">Top Performing Genre</span>
                      <span className="text-xs font-bold text-slate-900">{analyticsData.topCategory.name}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-semibold text-slate-600">Community Safety</span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Moderation Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-semibold text-slate-600">Free-Tier Safety Limit</span>
                      <span className="text-xs font-bold text-slate-900">2MB Img / 10MB PDF</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Platform Users ({usersList.length})</span>
                </button>
              </div>

            </div>

            {/* Bottom Row: Recent Publications Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span>Recent Catalog Activity</span>
                  </h3>
                  <p className="text-xs text-slate-500">Latest publications added to the platform</p>
                </div>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Manage Full Catalog →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Author</th>
                      <th className="py-2.5 px-3">PDF Size</th>
                      <th className="py-2.5 px-3">Upload Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {analyticsData.recentUploads.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <img src={b.coverImage} alt="" className="w-6 h-8 object-cover rounded bg-slate-100 border border-slate-200" />
                          <span className="truncate max-w-xs">{b.title}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                            {b.genre}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{typeof b.author === 'object' && b.author ? b.author.name : 'Author'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{b.pdf_size_mb ? `${b.pdf_size_mb} MB` : 'Cloud'}</td>
                        <td className="py-2.5 px-3 text-slate-400">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onReadBook(b)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 📚 Tab 2: Catalog Management Table */}
        {activeTab === 'catalog' && (
          <div className="p-6 space-y-6 flex-1 flex flex-col">
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col flex-1 overflow-hidden">
              
              {/* Search & Filter Toolbar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, author, or genre..."
                    className="input-field pl-10! text-xs sm:text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Category:</span>
                  <select
                    value={selectedGenreFilter}
                    onChange={(e) => setSelectedGenreFilter(e.target.value)}
                    className="input-field py-1.5! px-3! w-auto! text-xs font-semibold cursor-pointer"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto flex-1">
                {filteredBooks.length > 0 ? (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Publication</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Author</th>
                        <th className="py-3 px-4">Document</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Published</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredBooks.map((b) => {
                        const authorName = typeof b.author === 'object' && b.author ? b.author.name : 'Author';
                        return (
                          <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-3">
                              <img
                                src={b.coverImage}
                                alt=""
                                className="w-9 h-12 object-cover rounded-md bg-slate-100 border border-slate-200 shrink-0"
                              />
                              <div className="max-w-xs">
                                <p className="line-clamp-1">{b.title}</p>
                                <p className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5">
                                  {b.description}
                                </p>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                                {b.genre}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-slate-800 font-semibold">{authorName}</td>

                            <td className="py-3 px-4">
                              {b.file && (
                                <button
                                  onClick={() => onReadBook(b)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View Document</span>
                                </button>
                              )}
                            </td>

                            <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                              {b.pdf_size_mb ? `${b.pdf_size_mb} MB` : 'N/A'}
                            </td>

                            <td className="py-3 px-4 text-xs text-slate-500">
                              {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onEditBook(b)}
                                  className="p-1.5 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Publication"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(b)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Publication"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No publications found.</p>
                    <p className="text-xs text-slate-400">Click "Publish New eBook" to upload your first title.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 🗂️ Tab 3: Category Manager */}
        {activeTab === 'categories' && (
          <div className="p-6 space-y-6">
            
            {/* Create Category Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-xl">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <span>Create New Category</span>
              </h3>
              <p className="text-xs text-slate-500">
                Add a new category name. It will be formatted into standard title casing and appear immediately for all readers and creators.
              </p>

              <form onSubmit={handleCreateCategory} className="flex gap-2 pt-2">
                <input
                  type="text"
                  required
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="e.g. Science Fiction, Design & UX..."
                  className="input-field flex-1 text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={isCreatingCategory}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </form>
            </div>

            {/* Existing Categories Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Available Categories ({categories.length})</h3>
                <span className="text-xs text-slate-500">At least one category is needed to publish an eBook</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {categories.map((c) => {
                  const bookCount = books.filter((b) => b.genre === c.name).length;
                  return (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 group hover:bg-white hover:border-indigo-300 transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{bookCount} books assigned</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(c._id, c.name)}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 👥 Tab 4: User Moderation & Access Control */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-6 flex-1 flex flex-col">
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col flex-1 overflow-hidden">
              
              {/* Search Toolbar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="input-field pl-10! text-xs sm:text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Active: {analyticsData.activeUsers}
                  </span>
                  <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    Suspended: {analyticsData.bannedUsers}
                  </span>
                </div>
              </div>

              {/* Users Data Table */}
              <div className="overflow-x-auto flex-1">
                {filteredUsers.length > 0 ? (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Community Posts</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Moderation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredUsers.map((u) => {
                        const isCurrentAdmin = u._id === user?._id;
                        return (
                          <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p>{u.name}</p>
                                <p className="text-[11px] font-normal text-slate-400">{u.email}</p>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                                  u.role === 'admin'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {u.role === 'admin' ? 'Administrator' : 'Reader'}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {u.postsCount || 0} posts
                            </td>

                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                            </td>

                            <td className="py-3 px-4">
                              {u.isBanned ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                                  <ShieldAlert className="w-3 h-3" />
                                  Suspended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3" />
                                  Active
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              {u.role !== 'admin' && !isCurrentAdmin ? (
                                <button
                                  onClick={() => handleToggleUserBan(u)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                    u.isBanned
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {u.isBanned ? (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Unban User</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Ban User</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-400">Protected</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No users found.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
};
