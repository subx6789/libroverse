import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
  User as UserIcon,
  AtSign,
} from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../ui/ToastContext';
import type { User } from '../../types';

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isOpen, onClose }) => {
  const { updateProfile, checkUsername, isUpdatingProfile } = useUserStore();
  const { updateUser: updateAuthUser } = useAuthStore();
  const { showToast } = useToast();

  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');

  // Image files
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(user.coverImage || '');

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: '',
  });

  // Calculate username change limits (max 2 times per 30-day period)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentChanges = (user.usernameChangedAt || []).filter(
    (d) => new Date(d) > thirtyDaysAgo
  );
  const changesRemaining = Math.max(0, 2 - recentChanges.length);
  const isUsernameLocked = changesRemaining === 0;

  // Keep form state in sync whenever user object updates or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarFile(null);
      setAvatarPreview(user.avatar || '');
      setCoverFile(null);
      setCoverPreview(user.coverImage || '');
      setUsernameStatus({ checking: false, available: true, message: 'Your current username' });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Real-time debounced username checker
  useEffect(() => {
    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    if (cleanUsername === user.username) {
      setUsernameStatus({ checking: false, available: true, message: 'Your current username' });
      return;
    }

    if (isUsernameLocked) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Username change limit reached (2 changes / 30 days)',
      });
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus({ checking: false, available: false, message: 'Must be at least 3 chars' });
      return;
    }

    if (!/^[a-z0-9-_]+$/.test(cleanUsername)) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Only lowercase letters, numbers, -, _',
      });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsername(cleanUsername);
        setUsernameStatus({
          checking: false,
          available: res.available,
          message: res.message,
        });
      } catch {
        setUsernameStatus({ checking: false, available: false, message: 'Could not verify username' });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, user.username, checkUsername, isUsernameLocked]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('Avatar image must be under 5 MB', 'error');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        showToast('Cover banner image must be under 8 MB', 'error');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    if (usernameStatus.available === false) {
      showToast(usernameStatus.message || 'Please choose an available username', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('username', username.toLowerCase().trim());
      formData.append('bio', bio.trim());
      if (avatarFile) formData.append('avatar', avatarFile);
      if (coverFile) formData.append('coverImage', coverFile);

      const updated = await updateProfile(formData);
      updateAuthUser(updated);

      showToast('Profile updated successfully!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Reader Profile</h3>
              <p className="text-xs text-slate-500">Customize your public identity on LibroVerse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Cover Banner Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Profile Cover Banner</label>
            <div className="relative h-28 w-full bg-slate-900 rounded-md overflow-hidden border border-slate-200 group">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 text-xs">
                  No custom banner
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center gap-1.5 text-white text-xs font-semibold opacity-80 group-hover:opacity-100 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <Camera className="w-4 h-4" />
                <span>Change Banner</span>
              </label>
            </div>
          </div>

          {/* Profile Picture Uploader */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-md bg-slate-900 border-2 border-white text-white flex items-center justify-center font-bold text-lg shadow-xs overflow-hidden shrink-0 group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase() || 'U'
              )}
              <label className="absolute inset-0 bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Camera className="w-4 h-4" />
              </label>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Profile Picture</label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Upload New Avatar</span>
              </label>
              <p className="text-[11px] text-slate-400">JPG, PNG or WEBP up to 5 MB</p>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="input-field text-xs sm:text-sm"
            />
          </div>

          {/* Unique Username */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold text-slate-700">Unique Username (@handle)</label>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  changesRemaining > 0 
                    ? 'bg-slate-100 text-slate-600 border-slate-200' 
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  {changesRemaining}/2 edits left this month
                </span>
              </div>
              {usernameStatus.checking ? (
                <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Checking...</span>
                </span>
              ) : usernameStatus.available === true ? (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{usernameStatus.message}</span>
                </span>
              ) : usernameStatus.available === false ? (
                <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{usernameStatus.message}</span>
                </span>
              ) : null}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
              <input
                type="text"
                required
                disabled={isUsernameLocked}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="username"
                className={`input-field pl-7! text-xs sm:text-sm font-mono ${
                  isUsernameLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isUsernameLocked
                ? 'You have reached the limit of 2 username changes per 30 days.'
                : 'This handle is used to mention you across discussions. You can change it up to 2 times a month.'}
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reader Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other book lovers what you enjoy reading..."
              className="input-field text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingProfile || usernameStatus.available === false || !name.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
