import { create } from 'zustand';
import type { Book, BookHighlight, CreateBookPayload, UpdateBookPayload } from '../types';
import { api } from '../services/api';

interface BookState {
  books: Book[];
  selectedBook: Book | null;
  activeReadingBook: Book | null;
  highlights: BookHighlight[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  searchQuery: string;
  selectedGenre: string;
  sortBy: 'latest' | 'title' | 'genre';

  // Actions
  fetchBooks: () => Promise<void>;
  getBookById: (id: string) => Promise<Book | null>;
  createBook: (payload: CreateBookPayload) => Promise<void>;
  updateBook: (id: string, payload: UpdateBookPayload) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  addHighlight: (bookId: string, text: string, note?: string, color?: 'yellow' | 'green' | 'blue') => void;
  removeHighlight: (id: string) => void;
  setSelectedBook: (book: Book | null) => void;
  setActiveReadingBook: (book: Book | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string) => void;
  setSortBy: (sort: 'latest' | 'title' | 'genre') => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  selectedBook: null,
  activeReadingBook: null,
  highlights: (() => {
    try {
      const saved = localStorage.getItem('libroverse_highlights');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),
  isLoading: false,
  isSubmitting: false,
  error: null,
  searchQuery: '',
  selectedGenre: 'All',
  sortBy: 'latest',

  fetchBooks: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<Book[]>('/books');
      set({ books: Array.isArray(res.data) ? res.data : [], isLoading: false });
    } catch (err: any) {
      set({ books: [], isLoading: false, error: err.response?.data?.message || 'Failed to fetch library books' });
    }
  },

  addHighlight: (bookId, text, note, color = 'yellow') => {
    const newHighlight: BookHighlight = {
      id: Math.random().toString(36).substring(2, 9),
      bookId,
      text,
      note,
      color,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [newHighlight, ...state.highlights];
      localStorage.setItem('libroverse_highlights', JSON.stringify(updated));
      return { highlights: updated };
    });
  },

  removeHighlight: (id) => {
    set((state) => {
      const updated = state.highlights.filter((h) => h.id !== id);
      localStorage.setItem('libroverse_highlights', JSON.stringify(updated));
      return { highlights: updated };
    });
  },


  getBookById: async (id: string) => {
    try {
      const res = await api.get<Book>(`/books/${id}`);
      return res.data;
    } catch {
      const found = get().books.find((b) => b._id === id);
      return found || null;
    }
  },

  createBook: async (payload: CreateBookPayload) => {
    try {
      set({ isSubmitting: true, error: null });
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('genre', payload.genre);
      formData.append('coverImage', payload.coverImage);
      formData.append('file', payload.file);

      await api.post('/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await get().fetchBooks();
      set({ isSubmitting: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to upload eBook';
      set({ isSubmitting: false, error: msg });
      throw new Error(msg, { cause: err });
    }
  },

  updateBook: async (id: string, payload: UpdateBookPayload) => {
    try {
      set({ isSubmitting: true, error: null });
      const formData = new FormData();
      if (payload.title) formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      if (payload.genre) formData.append('genre', payload.genre);
      if (payload.coverImage) formData.append('coverImage', payload.coverImage);
      if (payload.file) formData.append('file', payload.file);

      await api.put(`/books/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await get().fetchBooks();
      set({ isSubmitting: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update eBook';
      set({ isSubmitting: false, error: msg });
      throw new Error(msg, { cause: err });
    }
  },

  deleteBook: async (id: string) => {
    try {
      set({ isSubmitting: true, error: null });
      await api.delete(`/books/${id}`);
      // Remove from local store
      set((state) => ({
        books: state.books.filter((b) => b._id !== id),
        isSubmitting: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete eBook';
      set({ isSubmitting: false, error: msg });
      throw new Error(msg, { cause: err });
    }
  },

  setSelectedBook: (book) => set({ selectedBook: book }),
  setActiveReadingBook: (book) => set({ activeReadingBook: book }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedGenre: (genre) => set({ selectedGenre: genre }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
