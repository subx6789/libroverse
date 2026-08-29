import { create } from 'zustand';
import api from '../services/api';
import type { Post } from '../types';

interface PostState {
  posts: Post[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  selectedTopic: string;
  sortBy: 'latest' | 'top' | 'discussed';
  feedTab: 'for-you' | 'following';
  activeHashtag: string | null;

  setSelectedTopic: (topic: string) => void;
  setSortBy: (sort: 'latest' | 'top' | 'discussed') => void;
  setFeedTab: (feedTab: 'for-you' | 'following', userId?: string) => void;
  setActiveHashtag: (hashtag: string | null) => void;
  fetchPosts: (search?: string, currentUserId?: string) => Promise<void>;
  createPost: (data: {
    title?: string;
    content: string;
    topic?: string;
    ebook_id?: string;
    media?: File;
  }) => Promise<Post>;
  updatePost: (
    postId: string,
    data: {
      title?: string;
      content: string;
      topic?: string;
      media?: File;
      removeMedia?: boolean;
    }
  ) => Promise<Post>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  selectedTopic: 'All',
  sortBy: 'latest',
  feedTab: 'for-you',
  activeHashtag: null,

  setSelectedTopic: (selectedTopic) => {
    set({ selectedTopic, activeHashtag: null });
    get().fetchPosts();
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get().fetchPosts();
  },

  setFeedTab: (feedTab, userId) => {
    set({ feedTab });
    get().fetchPosts(undefined, userId);
  },

  setActiveHashtag: (activeHashtag) => {
    set({ activeHashtag });
    if (activeHashtag) {
      get().fetchPosts(activeHashtag);
    } else {
      get().fetchPosts();
    }
  },

  fetchPosts: async (search, currentUserId) => {
    try {
      set({ isLoading: true, error: null });
      const { selectedTopic, sortBy, feedTab, activeHashtag } = get();
      const params: any = {};
      if (selectedTopic && selectedTopic !== 'All') params.topic = selectedTopic;
      if (sortBy) params.sort = sortBy;
      if (search) {
        params.search = search;
      } else if (activeHashtag) {
        params.search = activeHashtag;
      }

      if (feedTab === 'following' && currentUserId) {
        params.feed = 'following';
        params.userId = currentUserId;
      }

      const res = await api.get<Post[]>('/posts', { params });
      set({ posts: Array.isArray(res.data) ? res.data : [], isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to load community feed',
      });
    }
  },

  createPost: async (payload) => {
    try {
      set({ isSubmitting: true, error: null });
      const formData = new FormData();
      if (payload.title) formData.append('title', payload.title);
      formData.append('content', payload.content);
      if (payload.topic) formData.append('topic', payload.topic);
      if (payload.ebook_id) formData.append('ebook_id', payload.ebook_id);
      if (payload.media) formData.append('media', payload.media);

      const res = await api.post<Post>('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newPost = res.data;
      set((state) => ({
        posts: [newPost, ...state.posts],
        isSubmitting: false,
      }));
      return newPost;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to publish post';
      set({ isSubmitting: false, error: msg });
      throw new Error(msg, { cause: err });
    }
  },

  updatePost: async (postId, payload) => {
    try {
      set({ isSubmitting: true, error: null });
      const formData = new FormData();
      if (payload.title !== undefined) formData.append('title', payload.title);
      formData.append('content', payload.content);
      if (payload.topic) formData.append('topic', payload.topic);
      if (payload.media) formData.append('media', payload.media);
      if (payload.removeMedia) formData.append('removeMedia', 'true');

      const res = await api.patch<Post>(`/posts/${postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedPost = res.data;

      set((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? updatedPost : p)),
        isSubmitting: false,
      }));
      return updatedPost;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update post';
      set({ isSubmitting: false, error: msg });
      throw new Error(msg, { cause: err });
    }
  },

  toggleLike: async (postId: string) => {
    try {
      const res = await api.post<{ liked: boolean; likes_count: number }>(`/posts/${postId}/like`);
      const { liked, likes_count } = res.data;

      set((state) => ({
        posts: state.posts.map((p) => {
          if (p._id === postId) {
            return {
              ...p,
              likes_count,
              likes: liked ? [...(p.likes || []), 'me'] : (p.likes || []).filter((id) => id !== 'me'),
            };
          }
          return p;
        }),
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update like';
      throw new Error(msg, { cause: err });
    }
  },

  addComment: async (postId: string, content: string) => {
    try {
      const res = await api.post(`/posts/${postId}/comment`, { content });
      const { recent_comments, total_comments_count } = res.data;

      set((state) => ({
        posts: state.posts.map((p) => {
          if (p._id === postId) {
            return {
              ...p,
              recent_comments,
              total_comments_count,
            };
          }
          return p;
        }),
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit comment';
      throw new Error(msg, { cause: err });
    }
  },

  sharePost: async (postId: string) => {
    try {
      const res = await api.post<{ shares_count: number }>(`/posts/${postId}/share`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p._id === postId ? { ...p, shares_count: res.data.shares_count } : p
        ),
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to share post';
      throw new Error(msg, { cause: err });
    }
  },

  deletePost: async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`);
      set((state) => ({
        posts: state.posts.filter((p) => p._id !== postId),
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete post';
      throw new Error(msg, { cause: err });
    }
  },
}));
