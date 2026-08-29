import React, { useState } from 'react';
import { X, Loader2, Image as ImageIcon, Video, Sparkles, AlertCircle } from 'lucide-react';
import { usePostStore } from '../../store/usePostStore';
import { useToast } from '../ui/ToastContext';
import { HighlightedTextarea } from './HighlightedTextarea';
import { compressImage, compressVideo } from '../../utils/mediaCompressor';
import type { Post } from '../../types';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ post, isOpen, onClose }) => {
  const { updatePost } = usePostStore();
  const { showToast } = useToast();

  const [content, setContent] = useState(post.content);
  const [topic, setTopic] = useState(post.topic || 'General Discussion');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>(post.media_url || '');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>(post.media_type || 'none');
  const [removeMedia, setRemoveMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingMedia, setIsCompressingMedia] = useState(false);

  if (!isOpen) return null;

  const handleMediaChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video'
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
      setRemoveMedia(false);
      setIsCompressingMedia(true);

      try {
        if (type === 'image') {
          const result = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.85 });
          setMediaFile(result.file);
          setMediaPreview(URL.createObjectURL(result.file));
        } else {
          const result = await compressVideo(file);
          setMediaFile(result.file);
        }
      } catch (err) {
        console.error('Media optimization failed:', err);
        setMediaFile(file);
      } finally {
        setIsCompressingMedia(false);
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    setMediaType('none');
    setRemoveMedia(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Post content cannot be empty', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await updatePost(post._id, {
        content: content.trim(),
        topic,
        media: mediaFile || undefined,
        removeMedia,
      });

      showToast('Post updated successfully!', 'success');
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || 'Failed to update post', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Edit Post</h3>
              <p className="text-xs text-slate-500">Update your thoughts or attachments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <HighlightedTextarea
              rows={4}
              value={content}
              onChange={(val) => setContent(val)}
              placeholder="Edit your post content..."
            />
          </div>

          {/* Media Section */}
          {mediaPreview && (
            <div className="relative rounded-md border border-slate-200 bg-slate-50 p-1.5 max-w-sm">
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute top-2.5 right-2.5 p-1 rounded-md bg-slate-900/70 text-white hover:bg-slate-900 transition-colors z-10 cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {mediaType === 'image' || (!mediaType && mediaPreview.match(/\.(jpeg|jpg|png|webp|gif)/i)) ? (
                <img src={mediaPreview} alt="Media attachment" className="w-full max-h-48 object-cover rounded" />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-48 rounded bg-black" />
              )}
            </div>
          )}

          {/* Attachment options if no media */}
          {!mediaPreview && (
            <div className="flex items-center gap-2">
              <label className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMediaChange(e, 'image')}
                  className="hidden"
                />
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Replace Image</span>
              </label>

              <label className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleMediaChange(e, 'video')}
                  className="hidden"
                />
                <Video className="w-3.5 h-3.5 text-purple-600" />
                <span>Replace Video</span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressingMedia || !content.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
