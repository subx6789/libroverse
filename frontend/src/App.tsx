import { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/books/HeroSection';
import { BookFilterBar } from './components/books/BookFilterBar';
import { BookCard } from './components/books/BookCard';
import { BookUploadModal } from './components/books/BookUploadModal';
import { BookReaderModal } from './components/reader/BookReaderModal';
import { CommunityFeedSection } from './components/community/CommunityFeedSection';
import { AuthModal } from './components/auth/AuthModal';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { useBookStore } from './store/useBookStore';
import { useAuthStore } from './store/useAuthStore';
import { useToast } from './components/ui/ToastContext';
import { BookOpen, Library, PlusCircle, RefreshCw, Loader2 } from 'lucide-react';
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

  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [currentPublicTab, setCurrentPublicTab] = useState<'catalog' | 'community'>('catalog');
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = () => {
    setAuthModalOpen(false);
    if (user?.role === 'admin' || user?.email?.toLowerCase().includes('admin')) {
      setCurrentView('admin');
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

  const handleNavigateAdmin = () => {
    const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase().includes('admin');
    if (!isAdmin) {
      showToast('Administrator privileges required to access Admin Dashboard', 'error');
      return;
    }
    setCurrentView('admin');
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

  if (currentView === 'admin') {
    return (
      <>
        <AdminDashboardPage
          onBackToStore={() => setCurrentView('store')}
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
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      
      {/* Top Navigation with Catalog & Community Switcher */}
      <Navbar
        onOpenAuth={() => handleOpenAuth('login')}
        onOpenUpload={handleOpenUpload}
        onOpenAdmin={handleNavigateAdmin}
        currentPublicTab={currentPublicTab}
        onSelectPublicTab={(tab) => setCurrentPublicTab(tab)}
      />

      {/* Main Public View: Catalog OR Community Feed */}
      {currentPublicTab === 'catalog' ? (
        <>
          {/* Hero Banner */}
          <HeroSection onPublishClick={handleOpenUpload} />

          {/* Main Catalog View */}
          <main id="catalog" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Library className="w-6 h-6 text-indigo-600" />
                  <span>Explore Library Catalog</span>
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

                {user?.role === 'admin' && (
                  <button
                    onClick={handleOpenUpload}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Upload Book</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Category Bar */}
            <BookFilterBar />

            {/* Catalog Grid */}
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
                    Try adjusting your search query or category filter to discover more titles.
                  </p>
                </div>
              )}
            </div>

          </main>
        </>
      ) : (
        <CommunityFeedSection
          onOpenAuth={() => handleOpenAuth('login')}
          onNavigateStore={() => setCurrentPublicTab('catalog')}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">LibroVerse</span>
            <span>— Digital eBook Ecosystem & Reader Community</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>Online Reader</span>
            <span>•</span>
            <span>Community Feed</span>
            <span>•</span>
            <span>Cloud Library</span>
          </div>
        </div>
      </footer>

      {/* Dialog Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
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

export default App;
