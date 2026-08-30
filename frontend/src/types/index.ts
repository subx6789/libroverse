export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role?: 'admin' | 'user';
  avatar?: string;
  coverImage?: string;
  bio?: string;
  isBanned?: boolean;
  bannedReason?: string;
  savedPosts?: string[];
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  usernameChangedAt?: string[];
  createdAt?: string;
}

export interface BookHighlight {
  id: string;
  bookId: string;
  text: string;
  note?: string;
  color: 'yellow' | 'green' | 'blue';
  createdAt: string;
}

export interface AuthorItem {
  _id: string;
  name: string;
  bio?: string;
  avatar_url?: string;
}

export interface CommentItem {
  _id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  title?: string;
  content: string;
  author: User;
  ebook_id?: Book;
  media_url?: string;
  media_type?: 'image' | 'video' | 'none';
  likes: string[];
  likes_count: number;
  shares_count: number;
  total_comments_count: number;
  recent_comments: CommentItem[];
  topic?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  _id: string;
  title: string;
  description: string;
  author: User | { _id: string; name: string; email?: string; role?: string };
  authors?: AuthorItem[];
  genre: string;
  coverImage: string;
  file: string;
  pdf_size_mb?: number;
  cover_size_mb?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}

export interface CreateBookPayload {
  title: string;
  description: string;
  genre: string;
  coverImage: File;
  file: File;
  authorNames?: string;
}

export interface UpdateBookPayload {
  title?: string;
  description?: string;
  genre?: string;
  coverImage?: File;
  file?: File;
  authorNames?: string;
}
