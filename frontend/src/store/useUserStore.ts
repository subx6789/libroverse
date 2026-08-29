import { create } from 'zustand';
import api from '../services/api';
import type { User } from '../types';

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
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchSuggestedUsers: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  toggleFollowUser: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  toggleBanUser: (userId: string, reason?: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  suggestedUsers: [],
  selectedProfile: null,
  isLoading: false,
  isProfileLoading: false,
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
