import React, { useState } from "react";
import {
  Send,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  Hash,
  BookOpen,
  Sparkles,
  Smile,
} from "lucide-react";
import { usePostStore } from "../../store/usePostStore";
import { useBookStore } from "../../store/useBookStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useToast } from "../ui/ToastContext";
import { compressImage, compressVideo } from "../../utils/mediaCompressor";
import { CompressionStatsBadge } from "../ui/CompressionStatsBadge";
import { RichTweetText } from "./RichTweetText";

interface CreatePostCardProps {
  onOpenAuth: () => void;
}

const POPULAR_HASHTAGS = [
  "#ReadingGoals",
  "#BookReview",
  "#SciFi",
  "#Philosophy",
  "#TechNotes",
  "#SelfGrowth",
  "#ClassicLit",
];

export const CreatePostCard: React.FC<CreatePostCardProps> = ({
  onOpenAuth,
}) => {
  const { createPost, isSubmitting } = usePostStore();
  const { books } = useBookStore();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("General Discussion");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [mediaStats, setMediaStats] = useState<any | null>(null);
  const [isCompressingMedia, setIsCompressingMedia] = useState(false);
  const [showBookTagger, setShowBookTagger] = useState(false);

  const topics = [
    "General Discussion",
    "Book Reviews & Ratings",
    "Reading Notes & Highlights",
    "Tech & Software Architecture",
    "Science Fiction & Fantasy",
    "Self-Improvement & Habits",
  ];

  const handleInsertHashtag = (tag: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${tag} ` : `${tag} `;
    });
  };

  const handleMediaChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (type === "image" && file.size > 15 * 1024 * 1024) {
        showToast("Image attachment exceeds 15 MB limit", "error");
        e.target.value = "";
        return;
      }

      if (type === "video" && file.size > 50 * 1024 * 1024) {
        showToast("Video attachment exceeds 50 MB limit", "error");
        e.target.value = "";
        return;
      }

      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
      setIsCompressingMedia(true);

      try {
        if (type === "image") {
          const result = await compressImage(file, {
            maxWidth: 1400,
            maxHeight: 1400,
            quality: 0.85,
          });
          setMediaFile(result.file);
          setMediaStats(result);
          setMediaPreview(URL.createObjectURL(result.file));
        } else {
          const result = await compressVideo(file);
          setMediaFile(result.file);
          setMediaStats(result);
        }
      } catch (err) {
        console.error("Media optimization failed, using original:", err);
        setMediaFile(file);
      } finally {
        setIsCompressingMedia(false);
      }
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    setMediaPreview("");
    setMediaStats(null);
  };

  const selectedBook = books.find((b) => b._id === selectedBookId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      onOpenAuth();
      return;
    }

    if (!content.trim()) {
      showToast("Please type your thought, quote, or review", "error");
      return;
    }

    try {
      await createPost({
        content: content.trim(),
        topic,
        ebook_id: selectedBookId || undefined,
        media: mediaFile || undefined,
      });

      showToast("Thought posted to reader feed!", "success");
      setContent("");
      setSelectedBookId("");
      removeMedia();
      setShowBookTagger(false);
    } catch (err: any) {
      showToast(err.message || "Failed to publish post", "error");
    }
  };

  const charCount = content.length;
  const maxChars = 280;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 transition-all">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Top: Avatar + Inline Textarea */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {user ? (
              user.avatar ? (
                <img
                  src={user.avatar}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )
            ) : (
              "👤"
            )}
          </div>

          <div className="flex-1 space-y-2">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                user
                  ? `What are you reading or thinking, ${user.name.split(" ")[0]}? Use #hashtags to trend...`
                  : "Join the community to post thoughts, quotes & tag books..."
              }
              className="w-full bg-transparent border-none p-0 text-slate-800 text-sm sm:text-base focus:ring-0 resize-none outline-none leading-relaxed"
            />

            {/* Live Hashtag Preview Indicator */}
            {content.includes("#") && (
              <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="font-semibold text-slate-400">
                  Live Preview:
                </span>
                <RichTweetText content={content} />
              </div>
            )}

            {/* Attached Tagged eBook Card */}
            {selectedBook && (
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 max-w-md animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={selectedBook.coverImage}
                    alt=""
                    className="w-8 h-11 object-cover rounded bg-white shadow-2xs shrink-0 border border-indigo-200"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      Tagged Publication
                    </span>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedBook.title}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {selectedBook.genre}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBookId("")}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Media Preview Box */}
            {mediaPreview && (
              <div className="space-y-2 max-w-sm">
                <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-3 right-3 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors z-10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {mediaType === "image" ? (
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

                {(isCompressingMedia || mediaStats) && (
                  <CompressionStatsBadge
                    type={mediaType || "image"}
                    stats={mediaStats}
                    isCompressing={isCompressingMedia}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Hashtag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Hash className="w-3 h-3 text-sky-500" />
            Trends:
          </span>
          {POPULAR_HASHTAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleInsertHashtag(tag)}
              className="px-2 py-0.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-600 font-semibold text-[11px] shrink-0 transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Book Tagger Dropdown (if toggled) */}
        {showBookTagger && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Tag an eBook from LibroVerse Library
              </span>
              <button
                type="button"
                onClick={() => setShowBookTagger(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <select
              value={selectedBookId}
              onChange={(e) => {
                setSelectedBookId(e.target.value);
                setShowBookTagger(false);
              }}
              className="input-field text-xs bg-white cursor-pointer"
            >
              <option value="">-- Choose an eBook to attach --</option>
              {books.map((b) => (
                <option key={b._id} value={b._id}>
                  📖 {b.title} ({b.genre})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Toolbar & Fast Post Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tag eBook Button */}
            <button
              type="button"
              onClick={() => setShowBookTagger(!showBookTagger)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedBookId
                  ? "bg-indigo-50 text-indigo-600 font-bold"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
              title="Tag an eBook"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Tag eBook</span>
            </button>

            {/* Image Attachment Button */}
            <label
              className="p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Attach Image"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleMediaChange(e, "image")}
                className="hidden"
              />
              <ImageIcon className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">Photo</span>
            </label>

            {/* Video Attachment Button */}
            <label
              className="p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Attach Short Video"
            >
              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={(e) => handleMediaChange(e, "video")}
                className="hidden"
              />
              <Video className="w-4 h-4 text-purple-500" />
              <span className="hidden sm:inline">Clip</span>
            </label>

            {/* Topic Select */}
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg py-1 px-2 text-slate-700 cursor-pointer outline-none"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Character counter */}
            <span
              className={`text-[11px] font-mono font-semibold ${isOverLimit ? "text-rose-500" : "text-slate-400"}`}
            >
              {charCount > 0 && `${charCount}/${maxChars}`}
            </span>

            {/* Tweet Post Button */}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
