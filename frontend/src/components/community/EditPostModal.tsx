import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  Image as ImageIcon,
  Video,
  Sparkles,
  AlertCircle,
  AtSign,
  Hash,
} from "lucide-react";
import { usePostStore } from "../../store/usePostStore";
import { useUserStore } from "../../store/useUserStore";
import { useToast } from "../ui/ToastContext";
import { HighlightedTextarea } from "./HighlightedTextarea";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { compressImage, compressVideo } from "../../utils/mediaCompressor";
import type { Post } from "../../types";

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const { updatePost, channels, fetchChannels } = usePostStore();
  const { searchMentions } = useUserStore();
  const { showToast } = useToast();

  const [content, setContent] = useState(post.content);
  const [topic, setTopic] = useState(post.topic || "General Discussion");

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>(
    post.media_url || "",
  );
  const [mediaType, setMediaType] = useState<"image" | "video" | "none">(
    post.media_type || "none",
  );
  const [removeMedia, setRemoveMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingMedia, setIsCompressingMedia] = useState(false);

  // Mention Autocomplete state
  const [mentionResults, setMentionResults] = useState<{
    users: any[];
    books: any[];
  }>({
    users: [],
    books: [],
  });
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [isSearchingMentions, setIsSearchingMentions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect "@" query in real-time
  useEffect(() => {
    const atMatch = content.match(/@([a-zA-Z0-9_\s-]{1,25})$/);
    if (atMatch && atMatch[1]) {
      const query = atMatch[1].trim();
      if (query.length >= 1) {
        setIsSearchingMentions(true);
        setShowMentionMenu(true);
        const timer = setTimeout(async () => {
          try {
            const data = await searchMentions(query);
            setMentionResults(data);
          } catch (e) {
            console.warn("Mention search failed", e);
          } finally {
            setIsSearchingMentions(false);
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      setShowMentionMenu(false);
    }
  }, [content, searchMentions]);

  const handleSelectUserMention = (targetUser: {
    name: string;
    username?: string;
  }) => {
    const handle =
      targetUser.username || targetUser.name.toLowerCase().replace(/\s+/g, "-");
    setContent((prev) => {
      return prev.replace(/@([a-zA-Z0-9_\s-]*)$/, `@${handle} `);
    });
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  };

  const handleSelectBookMention = (book: { title: string }) => {
    const bookTag = book.title.replace(/\s+/g, "-");
    setContent((prev) => {
      return prev.replace(/@([a-zA-Z0-9_\s-]*)$/, `@${bookTag} `);
    });
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  const handleMediaChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
      setRemoveMedia(false);
      setIsCompressingMedia(true);

      try {
        if (type === "image") {
          const result = await compressImage(file, {
            maxWidth: 1400,
            maxHeight: 1400,
            quality: 0.85,
          });
          setMediaFile(result.file);
          setMediaPreview(URL.createObjectURL(result.file));
        } else {
          const result = await compressVideo(file);
          setMediaFile(result.file);
        }
      } catch (err) {
        console.error("Media optimization failed:", err);
        setMediaFile(file);
      } finally {
        setIsCompressingMedia(false);
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview("");
    setMediaType("none");
    setRemoveMedia(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast("Post content cannot be empty", "error");
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

      showToast("Post updated successfully!", "success");
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || "Failed to update post", "error");
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
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Edit Post
              </h3>
              <p className="text-xs text-slate-500">
                Update your thoughts or attachments
              </p>
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
          {/* Channel / Topic Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Hash className="w-3 h-3 text-indigo-600" />
              <span>Channel:</span>
            </span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-md px-2.5 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
            >
              {channels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <HighlightedTextarea
                textareaRef={textareaRef}
                rows={4}
                value={content}
                onChange={(val) => setContent(val)}
                placeholder="Edit your post content... Use @ to mention readers or eBooks"
              />
            </div>

            {/* Mention Autocomplete Dropdown */}
            {showMentionMenu && (
              <MentionAutocomplete
                users={mentionResults.users}
                books={mentionResults.books}
                onSelectUser={handleSelectUserMention}
                onSelectBook={handleSelectBookMention}
                isLoading={isSearchingMentions}
              />
            )}
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
              {mediaType === "image" ||
              (!mediaType &&
                mediaPreview.match(/\.(jpeg|jpg|png|webp|gif)/i)) ? (
                <img
                  src={mediaPreview}
                  alt="Media attachment"
                  className="w-full max-h-48 object-cover rounded"
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-48 rounded bg-black"
                />
              )}
            </div>
          )}

          {/* Media and Mention Helper Tools */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!mediaPreview && (
                <>
                  <label className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMediaChange(e, "image")}
                      className="hidden"
                    />
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Replace Image</span>
                  </label>

                  <label className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleMediaChange(e, "video")}
                      className="hidden"
                    />
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    <span>Replace Video</span>
                  </label>
                </>
              )}
            </div>

            {/* Quick Mention Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setContent((prev) => (prev ? `${prev} @` : "@"));
                textareaRef.current?.focus();
              }}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
              title="Mention reader or eBook (@)"
            >
              <AtSign className="w-3.5 h-3.5" />
              <span>Mention</span>
            </button>
          </div>

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
