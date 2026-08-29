import React, { useState } from 'react';
import {
  Send,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
} from 'lucide-react';
import { usePostStore } from '../../store/usePostStore';
import { useBookStore } from '../../store/useBookStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../ui/ToastContext';

interface CreatePostCardProps {
  onOpenAuth: () => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ onOpenAuth }) => {
  const { createPost, isSubmitting } = usePostStore();
  const { books } = useBookStore();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('General Discussion');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const topics = [
    'General Discussion',
    'Book Reviews & Ratings',
    'Reading Notes & Highlights',
    'Tech & Software Architecture',
    'Science Fiction & Fantasy',
    'Self-Improvement & Habits',
  ];

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (type === 'image' && file.size > 2 * 1024 * 1024) {
        showToast('Image attachment exceeds 2 MB limit', 'error');
        e.target.value = '';
        return;
      }

      if (type === 'video' && file.size > 10 * 1024 * 1024) {
        showToast('Video attachment exceeds 10 MB limit', 'error');
        e.target.value = '';
        return;
      }

      setMediaFile(file);
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
      setIsExpanded(true);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    setMediaPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      onOpenAuth();
      return;
    }

    if (!content.trim()) {
      showToast('Please enter post content', 'error');
      return;
    }

    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        topic,
        ebook_id: selectedBookId || undefined,
        media: mediaFile || undefined,
      });

      showToast('Post shared with the community!', 'success');
      setContent('');
      setTitle('');
      setSelectedBookId('');
      removeMedia();
      setIsExpanded(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to publish post', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 transition-all">
      <form onSubmit={handleSubmit} className="space-y-3">
        
        {/* User Identity Row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {user ? user.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={content}
              onFocus={() => setIsExpanded(true)}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                user
                  ? `Share thoughts, reviews, or book excerpts, ${user.name.split(' ')[0]}...`
                  : 'Join the community to share your book thoughts & reviews...'
              }
              className="input-field text-xs sm:text-sm py-2! bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Expanded Options */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
            
            {/* Optional Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional post headline or review title..."
                className="input-field text-xs py-1.5! bg-slate-50"
              />
            </div>

            {/* Select Topic & Associated eBook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input-field text-xs py-1.5! cursor-pointer bg-slate-50"
              >
                {topics.map((t) => (
                  <option key={t} value={t}>
                    📌 {t}
                  </option>
                ))}
              </select>

              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="input-field text-xs py-1.5! cursor-pointer bg-slate-50"
              >
                <option value="">📖 Tag an eBook from library (optional)</option>
                {books.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} ({b.genre})
                  </option>
                ))}
              </select>
            </div>

            {/* Media Preview Box */}
            {mediaPreview && (
              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 max-w-sm">
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-3 right-3 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors z-10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                {mediaType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Upload Preview"
                    className="w-full max-h-48 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-48 rounded-lg bg-black"
                  />
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                
                {/* Image Upload Button */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMediaChange(e, 'image')}
                    className="hidden"
                  />
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Image (Max 2MB)</span>
                </label>

                {/* Video Upload Button */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => handleMediaChange(e, 'video')}
                    className="hidden"
                  />
                  <Video className="w-3.5 h-3.5 text-sky-600" />
                  <span>Video Clip (Max 10MB)</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    removeMedia();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

      </form>
    </div>
  );
};
