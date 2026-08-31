import { create } from 'zustand';
import { api } from '../services/api';

export interface CategoryItem {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryState {
  categories: CategoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<CategoryItem>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<CategoryItem[]>('/categories');
      set({ categories: Array.isArray(res.data) ? res.data : [], isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to fetch categories' });
    }
  },

  createCategory: async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Category name cannot be empty');
    }

    // Client-Side Normalized Deduplication Gate (DSA Set & Alphanumeric Key check)
    const normalizedKey = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentCategories = get().categories;

    const duplicate = currentCategories.find(
      (c: CategoryItem) => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedKey
    );

    if (duplicate) {
      throw new Error(`Category "${duplicate.name}" already exists`);
    }

    try {
      set({ isLoading: true, error: null });
      const res = await api.post<CategoryItem>('/categories', { name: trimmed });
      const newCategory = res.data;
      set((state) => ({
        categories: [...state.categories, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false,
      }));
      return newCategory;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create category';
      set({ isLoading: false, error: msg });
      throw new Error(msg, { cause: err });
    }
  },

  deleteCategory: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.delete(`/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter((c) => c._id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete category';
      set({ isLoading: false, error: msg });
      throw new Error(msg, { cause: err });
    }
  },
}));
