import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Download,
  ExternalLink,
  BookOpen,
  Maximize2,
  Minimize2,
  Tag,
  User as UserIcon,
  Calendar,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Share2,
  HelpCircle,
} from "lucide-react";
import type { Book } from "../../types";
import { useToast } from "../ui/ToastContext";
import { explainPassageAPI } from "../../services/aiService";

interface BookReaderModalProps {
  book: Book | null;
  onClose: () => void;
}

const LOADING_STATUSES = [
  "Reading passage...",
  "Analyzing literary context...",
  "Synthesizing key insights...",
  "Cooking explanation...",
];

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  book,
  onClose,
}) => {
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);
  const [passageInput, setPassageInput] = useState("");

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [copiedAiText, setCopiedAiText] = useState(false);

  const { showToast } = useToast();

  // Cycling animated loader text
  useEffect(() => {
    let interval: any;
    if (aiLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  if (!book) return null;

  const authorName =
    book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name).join(", ")
      : typeof book.author === "object" && book.author
        ? book.author.name
        : "Author";

  const handleAiExplain = async (overrideText?: string) => {
    const textToAnalyze = (overrideText || passageInput).trim();
    if (!textToAnalyze || textToAnalyze.length < 10) {
      showToast("Please enter at least 10 characters from the passage to analyze.", "info");
      return;
    }

    setAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await explainPassageAPI({
        passage: textToAnalyze,
        bookTitle: book.title,
        author: authorName,
        mode: "explain",
      });

      setAiExplanation(res.explanation);
    } catch (err: any) {
      showToast(
        err.response?.data?.message ||
          "Failed to explain passage. Please try again.",
        "error",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAiExplanation = () => {
    if (!aiExplanation) return;
    navigator.clipboard?.writeText(aiExplanation);
    setCopiedAiText(true);
    showToast("Explanation copied to clipboard!", "info");
    setTimeout(() => setCopiedAiText(false), 2000);
  };

  const handleShareToCommunity = () => {
    const cleanBookTag = book.title.replace(/\s+/g, "-");
    const snippet = passageInput ? `"${passageInput.slice(0, 100)}..." ` : "";
    const postText = `${snippet}\n\n💡 AI Breakdown: ${aiExplanation?.slice(0, 160)}...\n\n— from #${cleanBookTag} #LibroVerse`;

    navigator.clipboard?.writeText(postText);
    onClose();
    navigate("/community");
    showToast(
      "Insights copied! Head over to the community feed to share.",
      "info",
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`relative w-full bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          fullscreen ? "h-[98vh] max-w-[98vw]" : "h-[88vh] max-w-6xl"
        }`}
      >
        {/* Reader Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {book.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {authorName}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                  {book.genre}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {book.file && (
              <a
                href={book.file}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors hidden sm:inline-flex cursor-pointer"
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {fullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              title="Close Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Embedded Document Viewer */}
          <div className="flex-1 bg-slate-100 relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-200">
            {book.file && !book.file.includes("undefined") ? (
              <object
                data={`${book.file}#toolbar=1&navpanes=0`}
                type="application/pdf"
                className="w-full h-full"
              >
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(book.file)}&embedded=true`}
                  title={book.title}
                  className="w-full h-full border-0 bg-white"
                />
              </object>
            ) : (
              <div className="text-center p-8 space-y-3">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  eBook document could not be loaded.
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The document file is unavailable. Please edit or re-upload the
                  publication to view the reader.
                </p>
              </div>
            )}
          </div>

          {/* Clean AI Reading Companion Sidebar */}
          <div className="w-full md:w-96 bg-white p-5 overflow-y-auto space-y-5 flex flex-col justify-between shrink-0 border-l border-slate-100">
            <div className="space-y-4">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      AI Reading Companion
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Contextual breakdown & passage summarizer
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Passage Query Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Got stuck on a sentence or concept?</span>
                </div>

                <textarea
                  rows={3}
                  value={passageInput}
                  onChange={(e) => setPassageInput(e.target.value)}
                  placeholder="Paste any quote, sentence, or complex paragraph from the book here..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />

                <button
                  type="button"
                  disabled={aiLoading || !passageInput.trim()}
                  onClick={() => handleAiExplain()}
                  className="w-full py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{LOADING_STATUSES[loadingStepIndex]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Explain & Summarize</span>
                    </>
                  )}
                </button>
              </div>

              {/* Interactive Loading State */}
              {aiLoading && (
                <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col items-center justify-center gap-3 text-center animate-in fade-in">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin" />
                    <Sparkles className="w-5 h-5 text-indigo-600 absolute" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-indigo-900 transition-all duration-300">
                      {LOADING_STATUSES[loadingStepIndex]}
                    </p>
                    <p className="text-[10px] text-indigo-500">
                      Unpacking narrative & concepts for you
                    </p>
                  </div>
                </div>
              )}

              {/* AI Explanation Result Box */}
              {!aiLoading && aiExplanation && (
                <div className="p-4 rounded-2xl bg-linear-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-200/80 shadow-xs space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Analysis & Context
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleCopyAiExplanation}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-indigo-100 text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedAiText ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={handleShareToCommunity}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-indigo-100 text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                        title="Share insights to Community"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-800 leading-relaxed max-h-60 overflow-y-auto space-y-2 whitespace-pre-line bg-white/80 p-3 rounded-xl border border-indigo-100/70 shadow-2xs font-normal">
                    {aiExplanation}
                  </div>
                </div>
              )}

              {/* Empty placeholder guide when no query is active */}
              {!aiLoading && !aiExplanation && (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                  <HelpCircle className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Need help understanding?
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paste any tricky terminology, dialogue, or complex paragraph
                    from the left reader to get an instant breakdown.
                  </p>
                </div>
              )}

              {/* Book Metadata Details */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" /> Category
                  </span>
                  <span className="font-bold text-slate-800">{book.genre}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-600" /> Author
                  </span>
                  <span className="font-bold text-slate-800 truncate max-w-35">
                    {authorName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />{" "}
                    Uploaded
                  </span>
                  <span className="font-semibold text-slate-700">
                    {book.createdAt
                      ? new Date(book.createdAt).toLocaleDateString()
                      : "Recent"}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Open Full Tab */}
            {book.file && (
              <a
                href={book.file}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs text-center mt-3 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open PDF in Full Tab</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
