import React, { useState } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  Calendar,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../ui/ToastContext';
import { PostCard } from './PostCard';
import { EditProfileModal } from './EditProfileModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { selectedProfile, isProfileLoading, toggleFollowUser } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  if (!isOpen || !selectedProfile) return null;

  const { user, posts } = selectedProfile;
  const isOwnProfile = currentUser && currentUser._id === user._id;
  const isFollowing = currentUser
    ? (user.followers || []).map((id) => id.toString()).includes(currentUser._id) || user.isFollowing
    : false;

  const handleFollowClick = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      await toggleFollowUser(user._id);
      showToast(isFollowing ? `Unfollowed ${user.name}` : `Following ${user.name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update follow', 'error');
    }
  };

  const userHandle = user.username || user.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
        <div className="relative w-full max-w-2xl rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
          
          {/* Header Cover Banner */}
          <div className="h-28 bg-slate-900 relative shrink-0 overflow-hidden">
            {user.coverImage ? (
              <img src={user.coverImage} alt="Cover Banner" className="w-full h-full object-cover" />
            ) : null}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-md bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Info Bar */}
          <div className="px-6 pb-4 border-b border-slate-100 relative shrink-0 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-3">
              
              {/* Avatar */}
              <div className="w-20 h-20 rounded-md bg-slate-900 border-2 border-white text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Follow / Edit Button */}
              <div>
                {isOwnProfile ? (
                  <button
                    onClick={() => setEditProfileOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFollowClick}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow Reader</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <span className="text-xs text-slate-400 font-mono">@{userHandle}</span>
                {user.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 pt-1 leading-relaxed">
                {user.bio || 'Avid reader & eBook explorer on LibroVerse.'}
              </p>

              {/* Stats Counter Row */}
              <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-slate-600 font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-900 font-extrabold">{user.followingCount ?? (user.following || []).length}</span>
                  <span className="text-slate-500">Following</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-900 font-extrabold">{user.followersCount ?? (user.followers || []).length}</span>
                  <span className="text-slate-500">Followers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-900 font-extrabold">{posts.length}</span>
                  <span className="text-slate-500">Posts & Reviews</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Post Stream Tab */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Publications & Thoughts ({posts.length})</span>
              </h4>
            </div>

            {isProfileLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading reader feed...</div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} onOpenAuth={onOpenAuth} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-md border border-slate-200 text-slate-400 text-xs">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>This reader hasn't shared any community posts yet.</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {editProfileOpen && (
        <EditProfileModal
          user={{
            ...user,
            username: user.username || currentUser?.username || '',
            name: user.name || currentUser?.name || '',
            bio: user.bio || currentUser?.bio || '',
            avatar: user.avatar || currentUser?.avatar || '',
            coverImage: user.coverImage || currentUser?.coverImage || '',
            usernameChangedAt: user.usernameChangedAt || currentUser?.usernameChangedAt || [],
          }}
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
        />
      )}
    </>
  );
};
