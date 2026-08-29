import { create } from 'zustand';
import api from '../services/api';
import type { User } from '../types';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  toggleBanUser: (userId: string, reason?: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,
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
