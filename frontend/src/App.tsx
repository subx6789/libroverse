import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/public/LandingPage';
import { ReaderHomePage } from './pages/reader/ReaderHomePage';
import { BookFilterBar } from './components/books/BookFilterBar';
import { BookCard } from './components/books/BookCard';
import { BookUploadModal } from './components/books/BookUploadModal';
import { CommunityFeedSection } from './components/community/CommunityFeedSection';
import { AuthModal } from './components/auth/AuthModal';
import { LegalModal, type LegalModalType } from './components/ui/LegalModal';
import { UserProfileModal } from './components/community/UserProfileModal';
import { useBookStore } from './store/useBookStore';
import { useAuthStore } from './store/useAuthStore';
import { useUserStore } from './store/useUserStore';
import { useToast } from './components/ui/ToastContext';
import { findFuzzySuggestion } from './utils/fuzzySearch';
import { BookOpen, Library, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import type { Book } from './types';

// Code-split heavy route modules & reader (isolates pdf-lib)
const AboutUsPage = lazy(() => import('./pages/public/AboutUsPage').then((m) => ({ default: m.AboutUsPage })));
const ContactUsPage = lazy(() => import('./pages/public/ContactUsPage').then((m) => ({ default: m.ContactUsPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const BookReaderModal = lazy(() => import('./components/reader/BookReaderModal').then((m) => ({ default: m.BookReaderModal })));

const PageFallbackLoader = () => (
  <div className="py-24 flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    <p className="text-xs font-semibold text-slate-500">Loading experience...</p>
  </div>
);

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    books,
    fetchBooks,
    isLoading,
    selectedGenre,
    searchQuery,
    sortBy,
    deleteBook,
  } = useBookStore();

  const { user, isAuthenticated } = useAuthStore();
  const { fetchUserProfile } = useUserStore();
  const { showToast } = useToast();

  // Modals & Active View States
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [legalModalType, setLegalModalType] = useState<LegalModalType>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (role?: string) => {
    setAuthModalOpen(false);
    showToast('Signed in successfully!', 'success');
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/home');
    }
  };

  const handleOpenUpload = () => {
    setBookToEdit(null);
    setUploadModalOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setBookToEdit(book);
    setUploadModalOpen(true);
  };

  const handleDeleteBook = async (book: Book) => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      try {
        await deleteBook(book._id);
        showToast('Book deleted successfully from library', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete book', 'error');
      }
    }
  };

  const handleOpenMyProfile = () => {
    if (user?._id) {
      fetchUserProfile(user._id);
      setProfileModalOpen(true);
    }
  };

  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books];

    if (selectedGenre && selectedGenre !== 'All') {
      result = result.filter((b) => b.genre?.toLowerCase() === selectedGenre.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.genre?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          (typeof b.author === 'object' && b.author?.name?.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'genre') {
        return (a.genre || '').localeCompare(b.genre || '');
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });

    return result;
  }, [books, selectedGenre, searchQuery, sortBy]);

  // Compute "Did you mean?" suggestions using Levenshtein distance when results are empty or query is typed
  const fuzzySuggestion = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) return null;

    const allTitlesAndAuthors = books.flatMap((b) => [
      b.title,
      b.genre,
      typeof b.author === 'object' && b.author ? b.author.name : '',
    ]).filter(Boolean);

    return findFuzzySuggestion(searchQuery, allTitlesAndAuthors, 2);
  }, [books, searchQuery]);

  // Is current path inside admin dashboard?
  const isAdminRoute = location.pathname.startsWith('/admin');

  // ==========================================
  // 1. STRICT ADMIN ISOLATED CONSOLE VIEW
  // ==========================================
  if (isAdminRoute) {
    if (!isAuthenticated || user?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Suspense fallback={<PageFallbackLoader />}>
          <AdminDashboardPage
            onOpenUpload={handleOpenUpload}
            onEditBook={handleEditBook}
            onReadBook={(b) => setReadingBook(b)}
            onOpenProfile={handleOpenMyProfile}
          />
        </Suspense>

        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onOpenAuth={() => handleOpenAuth('login')}
        />

        <BookUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          bookToEdit={bookToEdit}
        />

        {readingBook && (
          <Suspense fallback={null}>
            <BookReaderModal
              book={readingBook}
              onClose={() => setReadingBook(null)}
            />
          </Suspense>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. MAIN USER / GUEST APPLICATION VIEW
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenProfile={handleOpenMyProfile}
      />

      {/* Declarative Routes */}
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<PageFallbackLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                isAuthenticated && user?.role === 'user' ? (
                  <Navigate to="/home" replace />
                ) : isAuthenticated && user?.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <LandingPage
                    onGetStarted={() => handleOpenAuth('register')}
                    onExploreAbout={() => navigate('/about')}
                    onExploreContact={() => navigate('/contact')}
                  />
                )
              }
            />
            <Route
              path="/about"
              element={<AboutUsPage onGetStarted={() => handleOpenAuth('register')} />}
            />
            <Route
              path="/contact"
              element={<ContactUsPage />}
            />

          {/* Reader Routes */}
          <Route
            path="/home"
            element={
              <main className="flex-1">
                <ReaderHomePage
                  onNavigateCatalog={() => navigate('/library')}
                  onNavigateCommunity={() => navigate('/community')}
                  onReadBook={(b) => setReadingBook(b)}
                />
              </main>
            }
          />

          <Route
            path="/library"
            element={
              <main id="catalog" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <Library className="w-6 h-6 text-indigo-600" />
                      <span>Library Digital Catalog</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Showing {filteredAndSortedBooks.length} of {books.length} publications
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => fetchBooks()}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                <BookFilterBar />

                {/* Interactive Fuzzy Search "Did you mean?" banner */}
                {fuzzySuggestion && (
                  <div className="mt-4 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-950 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        Showing results for <span className="font-semibold text-slate-700">"{searchQuery}"</span>. Did you mean:{' '}
                        <button
                          onClick={() => {
                            useBookStore.getState().setSearchQuery(fuzzySuggestion);
                          }}
                          className="font-bold text-indigo-600 underline hover:text-indigo-800 cursor-pointer ml-1"
                        >
                          "{fuzzySuggestion}"
                        </button>
                        ?
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="text-sm font-semibold text-slate-600">Loading library publications...</p>
                    </div>
                  ) : filteredAndSortedBooks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {filteredAndSortedBooks.map((book) => (
                        <BookCard
                          key={book._id}
                          book={book}
                          onRead={(b) => setReadingBook(b)}
                          onEdit={handleEditBook}
                          onDelete={handleDeleteBook}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
                      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-slate-800">No books found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Try adjusting your search query or category filter.
                      </p>
                    </div>
                  )}
                </div>
              </main>
            }
          />

          <Route
            path="/community"
            element={
              <main className="flex-1">
                <CommunityFeedSection
                  onOpenAuth={() => handleOpenAuth('login')}
                  onNavigateStore={() => navigate('/library')}
                />
              </main>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900">LibroVerse</span>
                <p className="text-xs text-slate-400">Digital eBook Ecosystem & Reader Community</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
              <button
                onClick={() => navigate('/')}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/about')}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                About Us
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Contact Us
              </button>
              <button
                onClick={() => setLegalModalType('terms')}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button
                onClick={() => setLegalModalType('privacy')}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setLegalModalType('cookies')}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Cookie Policy
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>© 2026 LibroVerse. All rights reserved. Designed for great minds.</p>
            <p>Optimized for free-tier high-performance delivery.</p>
          </div>
        </div>
      </footer>

      {/* Shared Modals */}
      {readingBook && (
        <Suspense fallback={null}>
          <BookReaderModal
            book={readingBook}
            onClose={() => setReadingBook(null)}
          />
        </Suspense>
      )}

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      <BookUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        bookToEdit={bookToEdit}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />

      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

    </div>
  );
}

export default App;
