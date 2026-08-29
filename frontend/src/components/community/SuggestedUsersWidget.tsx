import React, { useEffect } from 'react';
import { Users, UserPlus, UserCheck } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../ui/ToastContext';
import type { User } from '../../types';

interface SuggestedUsersWidgetProps {
  onOpenAuth: () => void;
  onSelectUser: (user: User) => void;
}

export const SuggestedUsersWidget: React.FC<SuggestedUsersWidgetProps> = ({
  onOpenAuth,
  onSelectUser,
}) => {
  const { suggestedUsers, fetchSuggestedUsers, toggleFollowUser } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  useEffect(() => {
    fetchSuggestedUsers();
  }, [fetchSuggestedUsers]);

  const handleFollowToggle = async (targetUser: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    try {
      await toggleFollowUser(targetUser._id);
      showToast(
        targetUser.isFollowing
          ? `Unfollowed ${targetUser.name}`
          : `Now following ${targetUser.name}!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update follow', 'error');
    }
  };

  if (suggestedUsers.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Readers to Follow</span>
        </h3>
        <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-sm">
          Suggested
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {suggestedUsers.slice(0, 5).map((u) => {
          const isFollowing = currentUser
            ? (u.followers || []).map((id) => id.toString()).includes(currentUser._id) || u.isFollowing
            : false;
          const uHandle = u.username || u.name.toLowerCase().replace(/\s+/g, '-');

          return (
            <div
              key={u._id}
              onClick={() => onSelectUser(u)}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-md px-2 -mx-2 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden group-hover:ring-2 ring-indigo-600 transition-all">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    u.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {u.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    @{uHandle}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleFollowToggle(u, e)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  isFollowing
                    ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3 h-3" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
