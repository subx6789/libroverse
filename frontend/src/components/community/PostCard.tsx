import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Trash2,
  Send,
  Loader2,
  Check,
} from 'lucide-react';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../ui/ToastContext';
import type { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onOpenAuth: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onOpenAuth }) => {
  const { toggleLike, addComment, sharePost, deletePost } = usePostStore();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaved, setIsSaved] = useState(
    user?.savedPosts?.includes(post._id) || false
  );
  const [copiedShare, setCopiedShare] = useState(false);

  const isAuthor = user && user._id === post.author?._id;
  const isAdmin = user?.role === 'admin';
  const isLiked = user && (post.likes || []).includes(user._id);

  const handleLike = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      await toggleLike(post._id);
    } catch (err: any) {
      showToast(err.message || 'Error updating like', 'error');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!commentInput.trim()) return;

    try {
      setIsSubmittingComment(true);
      await addComment(post._id, commentInput.trim());
      setCommentInput('');
      showToast('Comment posted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      await sharePost(post._id);
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      showToast('Post link copied to clipboard!', 'success');
      setTimeout(() => setCopiedShare(false), 3000);
    } catch {
      showToast('Link copied', 'success');
    }
  };

  const handleSave = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setIsSaved(!isSaved);
    showToast(isSaved ? 'Post removed from bookmarks' : 'Post saved to bookmarks!', 'success');
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this community post?')) {
      try {
        await deletePost(post._id);
        showToast('Post deleted', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete post', 'error');
      }
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 transition-all hover:border-slate-300">
      
      {/* Author & Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">{post.author?.name || 'Community Member'}</h4>
              {post.author?.role === 'admin' && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now'} • {post.topic || 'General'}
            </p>
          </div>
        </div>

        {(isAuthor || isAdmin) && (
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="space-y-2">
        {post.title && (
          <h3 className="text-base font-bold text-slate-900 leading-snug">{post.title}</h3>
        )}
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Attached eBook Reference */}
      {post.ebook_id && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
          <img
            src={post.ebook_id.coverImage}
            alt=""
            className="w-8 h-11 object-cover rounded bg-white shadow-2xs border border-indigo-200 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Referenced Title</span>
            <p className="text-xs font-bold text-slate-900 truncate">{post.ebook_id.title}</p>
            <span className="text-[11px] text-slate-500">{post.ebook_id.genre}</span>
          </div>
        </div>
      )}

      {/* Media Attachment (Image or Video) */}
      {post.media_url && (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-96 flex items-center justify-center">
          {post.media_type === 'video' ? (
            <video src={post.media_url} controls className="w-full max-h-96 bg-black" />
          ) : (
            <img
              src={post.media_url}
              alt="Post attachment"
              className="w-full max-h-96 object-cover"
            />
          )}
        </div>
      )}

      {/* Social Action Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600 font-semibold">
        
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            isLiked ? 'text-rose-600 bg-rose-50 font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600' : ''}`} />
          <span>{post.likes_count || 0}</span>
        </button>

        {/* Comments Drawer Toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>{post.total_comments_count || 0} comments</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          <span>{post.shares_count || 0}</span>
        </button>

        {/* Save Bookmark */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            isSaved ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600' : ''}`} />
          <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </button>

      </div>

      {/* Embedded Comments Section (Sub-15ms Reads) */}
      {showComments && (
        <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
          
          {/* Add Comment Form */}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={user ? 'Write a friendly reply...' : 'Log in to write a comment...'}
              className="input-field text-xs py-1.5!"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentInput.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center justify-center cursor-pointer transition-all shrink-0"
            >
              {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Recent Comments List */}
          {post.recent_comments && post.recent_comments.length > 0 ? (
            <div className="space-y-2 pt-1">
              {post.recent_comments.map((c) => (
                <div key={c._id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{c.user_name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700">{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-2">No comments yet. Start the conversation!</p>
          )}

        </div>
      )}

    </article>
  );
};
