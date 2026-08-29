import { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/public/LandingPage';
import { AboutUsPage } from './pages/public/AboutUsPage';
import { ContactUsPage } from './pages/public/ContactUsPage';
import { ReaderHomePage } from './pages/reader/ReaderHomePage';
import { BookFilterBar } from './components/books/BookFilterBar';
import { BookCard } from './components/books/BookCard';
import { BookUploadModal } from './components/books/BookUploadModal';
import { BookReaderModal } from './components/reader/BookReaderModal';
import { CommunityFeedSection } from './components/community/CommunityFeedSection';
import { AuthModal } from './components/auth/AuthModal';
import { LegalModal, type LegalModalType } from './components/ui/LegalModal';
import { UserProfileModal } from './components/community/UserProfileModal';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { useBookStore } from './store/useBookStore';
import { useAuthStore } from './store/useAuthStore';
import { useUserStore } from './store/useUserStore';
import { useToast } from './components/ui/ToastContext';
import { BookOpen, Library, PlusCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import type { Book } from './types';

export function App() {
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

  // Navigation states
  const [guestTab, setGuestTab] = useState<'landing' | 'about' | 'contact'>('landing');
  const [readerTab, setReaderTab] = useState<'home' | 'catalog' | 'community'>('home');

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

  const handleLoginSuccess = () => {
    setAuthModalOpen(false);
    showToast('Signed in successfully!', 'success');
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

  // ==========================================
  // 1. STRICT ADMIN ISOLATED CONSOLE VIEW
  // ==========================================
  if (isAuthenticated && user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <AdminDashboardPage
          onOpenUpload={handleOpenUpload}
          onEditBook={handleEditBook}
          onReadBook={(b) => setReadingBook(b)}
        />

        <BookUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          bookToEdit={bookToEdit}
        />

        <BookReaderModal
          book={readingBook}
          onClose={() => setReadingBook(null)}
        />
      </div>
    );
  }

  // ==========================================
  // 2. AUTHENTICATED READER HUB VIEW
  // ==========================================
  if (isAuthenticated && user?.role === 'user') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        
        {/* Reader Navigation */}
        <Navbar
          onOpenAuth={handleOpenAuth}
          onOpenAdmin={() => {}}
          readerTab={readerTab}
          onSelectReaderTab={(tab) => setReaderTab(tab)}
          onOpenProfile={handleOpenMyProfile}
        />

        {/* Reader Home Hub */}
        {readerTab === 'home' && (
          <main className="flex-1">
            <ReaderHomePage
              onNavigateCatalog={() => setReaderTab('catalog')}
              onNavigateCommunity={() => setReaderTab('community')}
              onReadBook={(b) => setReadingBook(b)}
            />
          </main>
        )}

        {/* Library Catalog */}
        {readerTab === 'catalog' && (
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
        )}

        {/* Reader Community */}
        {readerTab === 'community' && (
          <main className="flex-1">
            <CommunityFeedSection
              onOpenAuth={() => handleOpenAuth('login')}
              onNavigateStore={() => setReaderTab('catalog')}
            />
          </main>
        )}

        {/* Reader Footer */}
        <footer className="border-t border-slate-200 bg-white mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-800">LibroVerse Reader Portal</span>
              <span>— Personalized Bookshelf & Social Hub</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500 font-semibold">
              <button onClick={() => setLegalModalType('terms')} className="hover:text-slate-900 cursor-pointer">
                Terms
              </button>
              <span>•</span>
              <button onClick={() => setLegalModalType('privacy')} className="hover:text-slate-900 cursor-pointer">
                Privacy
              </button>
              <span>•</span>
              <button onClick={() => setLegalModalType('cookies')} className="hover:text-slate-900 cursor-pointer">
                Cookies
              </button>
            </div>
          </div>
        </footer>

        {/* Modals */}
        <BookReaderModal
          book={readingBook}
          onClose={() => setReadingBook(null)}
        />

        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onOpenAuth={() => handleOpenAuth('login')}
        />

        <LegalModal
          type={legalModalType}
          onClose={() => setLegalModalType(null)}
        />

      </div>
    );
  }

  // ==========================================
  // 3. UNAUTHENTICATED GUEST VIEW
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      
      {/* Public Guest Navbar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenAdmin={() => {}}
        guestTab={guestTab}
        onSelectGuestTab={(tab) => setGuestTab(tab)}
      />

      {/* Main Public Pages */}
      <main className="flex-1">
        {guestTab === 'landing' && (
          <LandingPage
            onGetStarted={() => handleOpenAuth('register')}
            onExploreAbout={() => setGuestTab('about')}
            onExploreContact={() => setGuestTab('contact')}
          />
        )}

        {guestTab === 'about' && (
          <AboutUsPage onGetStarted={() => handleOpenAuth('register')} />
        )}

        {guestTab === 'contact' && (
          <ContactUsPage />
        )}
      </main>

      {/* Guest Footer with Legal Policy Dialog Triggers */}
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
                onClick={() => setGuestTab('landing')}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => setGuestTab('about')}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                About Us
              </button>
              <button
                onClick={() => setGuestTab('contact')}
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

      {/* Guest Modals */}
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
