import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  AtSign,
  Hash,
  Sparkles,
  ChevronRight,
  MessageSquareQuote,
} from "lucide-react";
import { usePostStore } from "../../store/usePostStore";
import { useUserStore } from "../../store/useUserStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useToast } from "../ui/ToastContext";
import { compressImage, compressVideo } from "../../utils/mediaCompressor";
import { HighlightedTextarea } from "./HighlightedTextarea";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { generateHooksAPI } from "../../services/aiService";

interface CreatePostCardProps {
  onOpenAuth: () => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({
  onOpenAuth,
}) => {
  const { createPost, isSubmitting, selectedTopic, posts, channels, fetchChannels, draftContent, draftTopic, setDraftContent, setDraftTopic } = usePostStore();
  const { searchMentions } = useUserStore();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [content, setContent] = useState(draftContent || "");
  const [topic, setTopic] = useState(
    draftTopic || (selectedTopic && selectedTopic !== "All" ? selectedTopic : channels[0] || "General Discussion")
  );

  // Sync draftContent into local state when user navigates from AI Reader
  useEffect(() => {
    if (draftContent) {
      setContent(draftContent);
      setDraftContent(""); // Clear after populating
    }
  }, [draftContent, setDraftContent]);

  useEffect(() => {
    if (draftTopic) {
      setTopic(draftTopic);
      setDraftTopic("");
    }
  }, [draftTopic, setDraftTopic]);

  // AI Hook Generator State
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [suggestedHooks, setSuggestedHooks] = useState<string[]>([]);
  const [showHooksTray, setShowHooksTray] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Keep topic in sync when user switches channel tab or when channels load
  useEffect(() => {
    if (selectedTopic && selectedTopic !== "All") {
      setTopic(selectedTopic);
    } else if (!topic && channels.length > 0) {
      setTopic(channels[0]);
    }
  }, [selectedTopic, channels]);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
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

  const handleSparkDiscussion = async () => {
    setIsGeneratingHooks(true);
    setShowHooksTray(true);
    try {
      // Extract any book name tagged in the content like @Dune or #Dune
      const bookTagMatch = content.match(/[@#]([a-zA-Z0-9_-]+)/);
      const taggedBook = bookTagMatch ? bookTagMatch[1] : undefined;

      const res = await generateHooksAPI({
        topic,
        bookTitle: taggedBook,
        draftText: content,
      });

      setSuggestedHooks(res.hooks || []);
      showToast("Generated 3 fresh conversation starters!", "success");
    } catch (err: any) {
      showToast("Could not generate discussion prompts right now. Please try again.", "error");
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  const handleApplyHook = (hook: string) => {
    setContent((prev) => {
      const cleanPrev = prev.trim();
      return cleanPrev ? `${cleanPrev}\n\n${hook}` : hook;
    });
    setShowHooksTray(false);
    showToast("Hook added to your post draft!", "info");
    textareaRef.current?.focus();
  };

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

  const handleInsertHashtag = (tag: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${tag} ` : `${tag} `;
    });
    textareaRef.current?.focus();
  };

  const handleMediaChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Mutually exclusive: cannot upload image and video at the same time
      if (mediaFile && mediaType !== type) {
        showToast(
          `You cannot attach an image and video in the same post. Please remove your current ${mediaType} first.`,
          "error"
        );
        e.target.value = "";
        return;
      }

      if (type === "image" && file.size > 3 * 1024 * 1024) {
        showToast("Image attachment exceeds 3 MB limit", "error");
        e.target.value = "";
        return;
      }

      if (type === "video" && file.size > 8 * 1024 * 1024) {
        showToast("Video attachment exceeds 8 MB limit", "error");
        e.target.value = "";
        return;
      }

      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
      setIsCompressingMedia(true);

      try {
        if (type === "image") {
          const result = await compressImage(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.85,
          });
          setMediaFile(result.file);
          setMediaPreview(URL.createObjectURL(result.file));
        } else {
          const result = await compressVideo(file);
          setMediaFile(result.file);
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
  };

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
        media: mediaFile || undefined,
      });

      showToast("Thought posted to reader feed!", "success");
      setContent("");
      removeMedia();
    } catch (err: any) {
      showToast(err.message || "Failed to publish post", "error");
    }
  };

  const charCount = content.length;
  const maxChars = 280;
  const isOverLimit = charCount > maxChars;

  if (user && user.role === "admin") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            🛡️
          </div>
          <div>
            <p className="font-bold text-slate-900">Administrator Moderation Mode</p>
            <p className="text-slate-600 text-[11px]">
              Administrator accounts oversee community content, discussions, and the eBook catalog. Publishing personal social feed posts is restricted for admins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 transition-all relative">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Top: Avatar + Inline Textarea */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
            {user ? (
              user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )
            ) : (
              "👤"
            )}
          </div>

          <div className="flex-1 space-y-2 relative">
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
                className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
              >
                {channels.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            <HighlightedTextarea
              textareaRef={textareaRef}
              rows={3}
              value={content}
              onChange={(val) => setContent(val)}
              placeholder={
                user
                  ? `What are you reading or thinking, ${user.name.split(" ")[0]}? Use #hashtags and @mentions...`
                  : "Join the community to post thoughts, quotes, and @tag books/users..."
              }
            />

            {/* Mention Autocomplete Box */}
            {showMentionMenu && (
              <MentionAutocomplete
                users={mentionResults.users}
                books={mentionResults.books}
                onSelectUser={handleSelectUserMention}
                onSelectBook={handleSelectBookMention}
                isLoading={isSearchingMentions}
              />
            )}

            {/* Media Preview Box */}
            {mediaPreview && (
              <div className="space-y-2 max-w-sm">
                <div className="relative rounded-md border border-slate-200 bg-slate-50 p-1.5">
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md bg-slate-900/70 text-white hover:bg-slate-900 transition-colors z-10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {mediaType === "image" ? (
                    <img
                      src={mediaPreview}
                      alt="Upload Preview"
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
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Hashtag Quick-Pills from Live Posts */}
        {(() => {
          const uniqueTags = Array.from(
            new Set(
              posts
                .flatMap((p) => (p.content ? p.content.match(/#[a-zA-Z0-9_]+/g) || [] : []))
            )
          ).slice(0, 6);

          if (uniqueTags.length === 0) return null;

          return (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100/60">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                <Hash className="w-3 h-3 text-sky-500" />
                <span>Trending:</span>
              </span>
              {uniqueTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleInsertHashtag(tag)}
                  className="text-[11px] font-medium text-sky-600 hover:text-sky-700 bg-sky-50/70 hover:bg-sky-100/80 px-2 py-0.5 rounded-sm transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          );
        })()}

        {/* Suggested AI Hooks Tray */}
        {showHooksTray && (
          <div className="p-3 bg-linear-to-r from-purple-50 via-indigo-50 to-pink-50 border border-indigo-200/80 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Spark Conversation Starters</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHooksTray(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {isGeneratingHooks ? (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-indigo-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Brainstorming engaging discussion questions...</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {suggestedHooks.map((hk, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyHook(hk)}
                    className="w-full text-left p-2 bg-white/90 hover:bg-white border border-indigo-100 hover:border-indigo-300 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="flex-1 pr-2 leading-relaxed">{hk}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toolbar & Fast Post Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* AI Spark Discussion Button */}
            <button
              type="button"
              onClick={handleSparkDiscussion}
              disabled={isGeneratingHooks}
              className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
              title="Generate conversation starters"
            >
              {isGeneratingHooks ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Spark Discussion</span>
            </button>

            {/* Mention trigger button */}
            <button
              type="button"
              onClick={() => {
                setContent((prev) => `${prev.trim()} @`);
                textareaRef.current?.focus();
              }}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-100 text-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
              title="Mention user or eBook (@)"
            >
              <AtSign className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Mention</span>
            </button>

            {/* Image Attachment Button */}
            <label
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-100 text-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
              title="Attach Image"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleMediaChange(e, "image")}
                disabled={isCompressingMedia}
                className="hidden"
              />
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Image</span>
            </label>

            {/* Video Attachment Button */}
            <label
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-100 text-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
              title="Attach Video"
            >
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleMediaChange(e, "video")}
                disabled={isCompressingMedia}
                className="hidden"
              />
              <Video className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Video</span>
            </label>
          </div>

          {/* Right: Character Count + Submit Button */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-mono font-medium ${
                isOverLimit
                  ? "text-rose-600 font-bold"
                  : charCount > 240
                    ? "text-amber-500"
                    : "text-slate-400"
              }`}
            >
              {maxChars - charCount}
            </span>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isCompressingMedia ||
                isOverLimit ||
                !content.trim()
              }
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
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
