import { create } from 'zustand';
import api from '../services/api';
import type { User } from '../types';
import { PrefixTrie } from '../utils/trie';

// Client-side Prefix Trie indices for instant O(K) @mention autocomplete without database load
const userTrie = new PrefixTrie<any>();
const bookTrie = new PrefixTrie<any>();

interface UserProfileData {
  user: User;
  posts: any[];
}

interface UserState {
  users: User[];
  suggestedUsers: User[];
  selectedProfile: UserProfileData | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isUpdatingProfile: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchSuggestedUsers: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  toggleFollowUser: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  searchMentions: (query: string) => Promise<{ users: any[]; books: any[] }>;
  checkUsername: (username: string) => Promise<{ available: boolean; message: string }>;
  updateProfile: (formData: FormData) => Promise<User>;
  toggleBanUser: (userId: string, reason?: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  suggestedUsers: [],
  selectedProfile: null,
  isLoading: false,
  isProfileLoading: false,
  isUpdatingProfile: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<User[]>('/users');
      set({ users: Array.isArray(res.data) ? res.data : [], isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to fetch users',
      });
    }
  },

  fetchSuggestedUsers: async () => {
    try {
      const res = await api.get<User[]>('/users/suggested');
      set({ suggestedUsers: Array.isArray(res.data) ? res.data : [] });
    } catch (err: any) {
      console.warn('Could not fetch suggested readers:', err);
    }
  },

  fetchUserProfile: async (userId: string) => {
    try {
      set({ isProfileLoading: true, error: null });
      const res = await api.get<UserProfileData>(`/users/profile/${userId}`);
      set({ selectedProfile: res.data, isProfileLoading: false });
    } catch (err: any) {
      set({
        isProfileLoading: false,
        error: err.response?.data?.message || 'Failed to fetch profile',
      });
    }
  },

  toggleFollowUser: async (userId: string) => {
    try {
      const res = await api.post<{
        isFollowing: boolean;
        followersCount: number;
        followingCount: number;
      }>(`/users/${userId}/follow`);

      const { isFollowing, followersCount, followingCount } = res.data;

      // Update suggested users
      set((state) => ({
        suggestedUsers: state.suggestedUsers.map((u) =>
          u._id === userId
            ? { ...u, isFollowing, followersCount }
            : u
        ),
      }));

      // Update selected profile if open
      const profile = get().selectedProfile;
      if (profile && profile.user._id === userId) {
        set({
          selectedProfile: {
            ...profile,
            user: {
              ...profile.user,
              isFollowing,
              followersCount,
              followingCount,
            },
          },
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update follow';
      throw new Error(msg, { cause: err });
    }
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) return [];
    try {
      const res = await api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Search readers error:', err);
      return [];
    }
  },

  searchMentions: async (query: string) => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return { users: [], books: [] };

    // 1. Instant O(K) lookup from local Prefix Trie (sub-1ms)
    const cachedUsers = userTrie.searchPrefix(cleanQuery, 5);
    const cachedBooks = bookTrie.searchPrefix(cleanQuery, 5);

    if (cachedUsers.length > 0 || cachedBooks.length > 0) {
      return { users: cachedUsers, books: cachedBooks };
    }

    try {
      const res = await api.get<{ users: any[]; books: any[] }>(
        `/users/mentions?q=${encodeURIComponent(query)}`
      );
      const data = res.data || { users: [], books: [] };

      // Index newly fetched users & books into the Trie for future instant lookups
      if (Array.isArray(data.users)) {
        data.users.forEach((u) => {
          if (u.name) userTrie.insert(u.name, u);
          if (u.username) userTrie.insert(u.username, u);
        });
      }
      if (Array.isArray(data.books)) {
        data.books.forEach((b) => {
          if (b.title) bookTrie.insert(b.title, b);
        });
      }

      return data;
    } catch (err) {
      console.warn('Search mentions error:', err);
      return { users: [], books: [] };
    }
  },

  checkUsername: async (username: string) => {
    if (!username.trim()) return { available: false, message: 'Username cannot be empty' };
    try {
      const res = await api.get<{ available: boolean; message: string }>(
        `/users/check-username?username=${encodeURIComponent(username)}`
      );
      return res.data;
    } catch (err: any) {
      return { available: false, message: err.response?.data?.message || 'Check failed' };
    }
  },

  updateProfile: async (formData: FormData) => {
    try {
      set({ isUpdatingProfile: true, error: null });
      const res = await api.patch<User>('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = res.data;

      // Update selected profile if open
      const profile = get().selectedProfile;
      if (profile && profile.user._id === updatedUser._id) {
        set({
          selectedProfile: {
            ...profile,
            user: {
              ...profile.user,
              ...updatedUser,
            },
          },
        });
      }

      set({ isUpdatingProfile: false });
      return updatedUser;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      set({ isUpdatingProfile: false, error: msg });
      throw new Error(msg, { cause: err });
    }
  },

  toggleBanUser: async (userId: string, reason?: string) => {
    try {
      await api.patch(`/users/${userId}/ban`, { reason });
      set((state) => ({
        users: state.users.map((u) => {
          if (u._id === userId) {
            const nextBanned = !u.isBanned;
            return {
              ...u,
              isBanned: nextBanned,
              bannedReason: nextBanned ? reason || 'Violating community guidelines' : '',
            };
          }
          return u;
        }),
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update user ban status';
      throw new Error(msg, { cause: err });
    }
  },
}));
