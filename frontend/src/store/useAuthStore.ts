import { create } from 'zustand';
import type { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Actions
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('accessToken') || null,
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),

  initAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await api.get<User>('/users/self');
      set({
        user: res.data,
        isAuthenticated: true,
        isLoading: false,
      });
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err: any) {
      console.warn('Auth token verification error:', err?.response?.data?.message || err.message);
      // If token expired, clear state
      if (err?.response?.status === 401) {
        get().logout();
      }
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<AuthResponse>('/users/login', { email, password });
      const { accessToken, user } = res.data;

      localStorage.setItem('accessToken', accessToken);
      
      let fetchedUser = user;
      if (!fetchedUser) {
        const selfRes = await api.get<User>('/users/self', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        fetchedUser = selfRes.data;
      }

      if (fetchedUser) {
        localStorage.setItem('user', JSON.stringify(fetchedUser));
      }

      set({
        token: accessToken,
        user: fetchedUser || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg, { cause: err });
    }
  },

  register: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post<AuthResponse>('/users/register', { name, email, password });
      const { accessToken, user } = res.data;

      localStorage.setItem('accessToken', accessToken);

      let fetchedUser = user;
      if (!fetchedUser) {
        const selfRes = await api.get<User>('/users/self', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        fetchedUser = selfRes.data;
      }

      if (fetchedUser) {
        localStorage.setItem('user', JSON.stringify(fetchedUser));
      }

      set({
        token: accessToken,
        user: fetchedUser || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      throw new Error(msg, { cause: err });
    }
  },

  updateUser: (updatedData: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const merged = { ...current, ...updatedData };
    set({ user: merged });
    localStorage.setItem('user', JSON.stringify(merged));
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
