import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Trash2,
  Edit3,
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
import { EditPostModal } from './EditPostModal';
import { formatRelativeTime } from '../../utils/dateFormatter';
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(
    user?.savedPosts?.includes(post._id) || false
  );

  const isAuthor = user && user._id === post.author?._id;
  const isAdmin = user?.role === 'admin';
  const isLiked = user && post.likes ? post.likes.includes(user._id) || post.likes.includes('me') : false;

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
      showToast(err.message || 'Failed to like post', 'error');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
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
      setIsSubmittingComment(false);
      showToast('Comment posted', 'success');
    } catch (err: any) {
      setIsSubmittingComment(false);
      showToast(err.message || 'Failed to post comment', 'error');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/community?post=${post._id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        await sharePost(post._id);
        showToast('Direct post link copied to clipboard!', 'success');
      } else {
        await sharePost(post._id);
        showToast('Post shared!', 'success');
      }
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  const handleBookmark = () => {
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

  const authorHandle =
    post.author?.username ||
    (post.author?.name ? post.author.name.toLowerCase().replace(/\s+/g, '-') : 'reader');

  return (
    <>
      <article className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3 transition-all hover:border-slate-300">
        {/* Author & Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              onClick={() => post.author && onSelectUser && onSelectUser(post.author)}
              className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer hover:ring-2 ring-indigo-600 transition-all overflow-hidden"
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4
                  onClick={() => post.author && onSelectUser && onSelectUser(post.author)}
                  className="text-sm font-bold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer truncate"
                >
                  {post.author?.name || 'Community Member'}
                </h4>

                <span
                  onClick={() => post.author && onSelectUser && onSelectUser(post.author)}
                  className="text-xs text-slate-400 font-mono hover:text-slate-600 cursor-pointer"
                >
                  @{authorHandle}
                </span>

                {post.author?.role === 'admin' && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100 shrink-0">
                    Admin
                  </span>
                )}

                {/* Follow Quick Button */}
                {user && post.author && user._id !== post.author._id && (
                  <button
                    onClick={handleFollowAuthor}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm transition-all cursor-pointer ${
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
                {formatRelativeTime(post.createdAt)} •{' '}
                <span className="text-slate-500 font-medium">{post.topic || 'General'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Edit Button for Author */}
            {isAuthor && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                title="Edit Post"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete Button */}
            {(isAuthor || isAdmin) && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                title="Delete Post"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Post Content with Twitter Rich Hashtags (#) and Mentions */}
        <div className="space-y-1.5">
          {post.title && (
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{post.title}</h3>
          )}
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
            <RichTweetText content={post.content} onHashtagClick={onHashtagClick} />
          </p>
        </div>

        {/* Media Attachment (Image or Video) */}
        {post.media_url && (
          <div className="rounded-md overflow-hidden border border-slate-200 bg-slate-50 max-h-96 flex items-center justify-center">
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              isLiked ? 'text-rose-600 bg-rose-50 font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600' : ''}`} />
            <span>{post.likes_count || 0}</span>
          </button>

          {/* Comment Count / Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              showComments ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.total_comments_count || (post.recent_comments || []).length}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{post.shares_count || 0}</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
              isSaved ? 'text-indigo-600' : 'hover:text-slate-900'
            }`}
            title={isSaved ? 'Remove from bookmarks' : 'Save post'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600' : ''}`} />
          </button>
        </div>

        {/* Comment Drawer */}
        {showComments && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
            {/* Input */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a thoughtful comment..."
                className="input-field text-xs flex-1"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentInput.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>

            {/* List of recent comments */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(post.recent_comments || []).length > 0 ? (
                post.recent_comments.map((comment) => (
                  <div key={comment._id} className="p-2 rounded-md bg-slate-50 border border-slate-100 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{comment.user_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-2">No comments yet. Start the conversation!</p>
              )}
            </div>
          </div>
        )}
      </article>

      {/* Edit Modal */}
      {editModalOpen && (
        <EditPostModal
          post={post}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </>
  );
};
