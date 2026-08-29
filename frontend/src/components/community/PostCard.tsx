import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Trash2,
  Send,
  Loader2,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { useToast } from '../ui/ToastContext';
import { RichTweetText } from './RichTweetText';
import type { Post, User } from '../../types';

interface PostCardProps {
  post: Post;
  onOpenAuth: () => void;
  onSelectUser?: (user: User) => void;
  onHashtagClick?: (hashtag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenAuth,
  onSelectUser,
  onHashtagClick,
}) => {
  const { toggleLike, addComment, sharePost, deletePost } = usePostStore();
  const { user } = useAuthStore();
  const { toggleFollowUser } = useUserStore();
  const { showToast } = useToast();

  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaved, setIsSaved] = useState(
    user?.savedPosts?.includes(post._id) || false
  );

  const isAuthor = user && user._id === post.author?._id;
  const isAdmin = user?.role === 'admin';
  const isLiked = user && (post.likes || []).includes(user._id);

  const isFollowingAuthor = user && post.author
    ? (post.author.followers || []).map((id) => id.toString()).includes(user._id)
    : false;

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
      showToast('Post link copied to clipboard!', 'success');
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

  const handleFollowAuthor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!post.author?._id) return;
    try {
      await toggleFollowUser(post.author._id);
      showToast(
        isFollowingAuthor
          ? `Unfollowed ${post.author.name}`
          : `Following ${post.author.name}!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update follow', 'error');
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3.5 transition-all hover:border-slate-300">
      
      {/* Author & Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => post.author && onSelectUser && onSelectUser(post.author)}
            className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer hover:ring-2 ring-indigo-600 transition-all overflow-hidden"
          >
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
            ) : post.author?.name ? (
              post.author.name.charAt(0).toUpperCase()
            ) : (
              'U'
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                onClick={() => post.author && onSelectUser && onSelectUser(post.author)}
                className="text-sm font-bold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer truncate"
              >
                {post.author?.name || 'Community Member'}
              </h4>

              {post.author?.role === 'admin' && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100 shrink-0">
                  Admin
                </span>
              )}

              {/* Follow Quick Button */}
              {user && post.author && user._id !== post.author._id && (
                <button
                  onClick={handleFollowAuthor}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    isFollowingAuthor
                      ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                      : 'bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white'
                  }`}
                >
                  {isFollowingAuthor ? 'Following' : '+ Follow'}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now'} •{' '}
              <span className="text-slate-500 font-medium">{post.topic || 'General'}</span>
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

      {/* Post Content with Twitter Rich Hashtags (#) and Mentions */}
      <div className="space-y-2">
        {post.title && (
          <h3 className="text-base font-bold text-slate-900 leading-snug">{post.title}</h3>
        )}
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
          <RichTweetText content={post.content} onHashtagClick={onHashtagClick} />
        </p>
      </div>

      {/* Attached eBook Reference Card */}
      {post.ebook_id && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-50 transition-colors">
          <img
            src={post.ebook_id.coverImage}
            alt=""
            className="w-9 h-12 object-cover rounded bg-white shadow-2xs border border-indigo-200 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Referenced eBook</span>
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
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-semibold">
        
        {/* Like Button */}
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
          <MessageSquare className="w-4 h-4 text-sky-500" />
          <span>{post.total_comments_count || 0}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Share Post Link"
        >
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>{post.shares_count || 0}</span>
        </button>

        {/* Save Bookmark */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            isSaved ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Bookmark Post"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Embedded Comments Section */}
      {showComments && (
        <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
          
          {/* Add Comment Input */}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a thoughtful comment..."
              className="input-field text-xs py-1.5! bg-slate-50"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentInput.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Comment List */}
          {(post.recent_comments || []).length > 0 ? (
            <div className="space-y-2 pt-1">
              {post.recent_comments.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {c.user_name ? c.user_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{c.user_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 text-center py-2">No comments yet. Start the conversation!</p>
          )}

        </div>
      )}

    </article>
  );
};
