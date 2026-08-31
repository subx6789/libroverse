import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Download,
  ExternalLink,
  BookOpen,
  Maximize2,
  Minimize2,
  Highlighter,
  Plus,
  Trash2,
  Tag,
  User as UserIcon,
  Calendar,
  Sparkles,
  Loader2,
  Copy,
  Check,
  BrainCircuit,
} from 'lucide-react';
import type { Book } from '../../types';
import { useBookStore } from '../../store/useBookStore';
import { useToast } from '../ui/ToastContext';
import { explainPassageAPI, type ExplainMode } from '../../services/aiService';

interface BookReaderModalProps {
  book: Book | null;
  onClose: () => void;
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({ book, onClose }) => {
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);
  const [highlightText, setHighlightText] = useState('');
  const [highlightNote, setHighlightNote] = useState('');
  const [selectedColor, setSelectedColor] = useState<'yellow' | 'green' | 'blue'>('yellow');

  // AI Passage Explainer State
  const [aiMode, setAiMode] = useState<ExplainMode>('explain');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const [copiedAiText, setCopiedAiText] = useState(false);

  const { highlights, addHighlight, removeHighlight } = useBookStore();
  const { showToast } = useToast();

  if (!book) return null;

  const authorName =
    book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name).join(', ')
      : typeof book.author === 'object' && book.author
      ? book.author.name
      : 'Author';
  const bookHighlights = highlights.filter((h) => h.bookId === book._id);

  const handleSaveHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!highlightText.trim()) {
      showToast('Please type or paste a quote/text to highlight', 'error');
      return;
    }
    addHighlight(book._id, highlightText.trim(), highlightNote.trim(), selectedColor);
    setHighlightText('');
    setHighlightNote('');
    showToast('Quote saved to your interactive study notes!', 'success');
  };

  const handleAiAnalyze = async (overrideText?: string, modeToUse: ExplainMode = aiMode) => {
    const textToAnalyze = (overrideText || highlightText).trim();
    if (!textToAnalyze) {
      showToast('Please enter or select a quote first to analyze with AI.', 'info');
      return;
    }

    setAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await explainPassageAPI({
        passage: textToAnalyze,
        bookTitle: book.title,
        author: authorName,
        mode: modeToUse,
      });

      setAiExplanation(res.explanation);
      setAiModelUsed(res.model);
      showToast('AI analysis generated successfully!', 'success');
    } catch (err: any) {
      showToast(
        err.response?.data?.message || 'Failed to generate AI analysis. Please try again.',
        'error'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAiExplanation = () => {
    if (!aiExplanation) return;
    navigator.clipboard?.writeText(aiExplanation);
    setCopiedAiText(true);
    showToast('AI explanation copied to clipboard!', 'info');
    setTimeout(() => setCopiedAiText(false), 2000);
  };

  const handleSaveAiToNote = () => {
    if (!aiExplanation) return;
    const cleanSnippet = (highlightText || 'AI Passage Analysis').slice(0, 80);
    addHighlight(
      book._id,
      `[AI ${aiMode.toUpperCase()}]: ${cleanSnippet}...`,
      aiExplanation.slice(0, 200) + '...',
      'blue'
    );
    showToast('Saved AI analysis directly to your Study Notes!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`relative w-full bg-white rounded-lg border border-slate-200 shadow-xl flex flex-col overflow-hidden transition-all duration-200 ${
          fullscreen ? 'h-[98vh] max-w-[98vw]' : 'h-[88vh] max-w-6xl'
        }`}
      >
        
        {/* Reader Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">{book.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{authorName}</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                  {book.genre}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {book.file && (
              <a
                href={book.file}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors hidden sm:inline-flex cursor-pointer"
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
            {book.file && !book.file.includes('undefined') ? (
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
                <p className="text-sm font-bold text-slate-800">eBook document could not be loaded.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The document file is unavailable. Please edit or re-upload the publication to view the reader.
                </p>
              </div>
            )}
          </div>

          {/* Unique Feature: Interactive Study Notes & Quotes Sidebar */}
          <div className="w-full md:w-88 bg-white p-5 overflow-y-auto space-y-5 flex flex-col justify-between shrink-0 border-l border-slate-100">
            <div className="space-y-4">
              
              {/* Highlight / Annotation Form */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Highlighter className="w-4 h-4 text-indigo-600" />
                    Save Quote & Notes
                  </span>
                  <div className="flex items-center gap-1">
                    {(['yellow', 'green', 'blue'] as const).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-4 h-4 rounded-full border cursor-pointer ${
                          color === 'yellow' ? 'bg-amber-300' : color === 'green' ? 'bg-emerald-300' : 'bg-sky-300'
                        } ${selectedColor === color ? 'ring-2 ring-slate-800' : 'border-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSaveHighlight} className="space-y-2">
                  <textarea
                    rows={2}
                    value={highlightText}
                    onChange={(e) => setHighlightText(e.target.value)}
                    placeholder="Paste selected quote or key phrase here..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                  />
                  <input
                    type="text"
                    value={highlightNote}
                    onChange={(e) => setHighlightNote(e.target.value)}
                    placeholder="Personal note (optional)..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                  />
                  
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="submit"
                      className="py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Note</span>
                    </button>

                    <button
                      type="button"
                      disabled={aiLoading || !highlightText.trim()}
                      onClick={() => handleAiAnalyze()}
                      className="py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      title="Analyze with Qwen 2.5 AI"
                    >
                      {aiLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      )}
                      <span>AI Analyze</span>
                    </button>
                  </div>
                </form>

                {/* AI Mode Selector Tabs */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-200/80 text-[10px]">
                  {(
                    [
                      { id: 'explain', label: 'Explain' },
                      { id: 'simplify', label: 'ELI5' },
                      { id: 'summary', label: 'Summary' },
                      { id: 'key_terms', label: 'Terms' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setAiMode(m.id);
                        if (highlightText.trim()) {
                          handleAiAnalyze(highlightText, m.id);
                        }
                      }}
                      className={`px-2 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        aiMode === m.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Analysis Insight Card */}
              {(aiExplanation || aiLoading) && (
                <div className="p-3.5 rounded-xl bg-linear-to-br from-indigo-50/90 to-purple-50/90 border border-indigo-200/80 shadow-xs space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <BrainCircuit className="w-4 h-4 text-indigo-600" />
                      <span>AI Literary Insight</span>
                      <span className="text-[10px] font-semibold text-indigo-600/80 uppercase px-1.5 py-0.2 bg-indigo-100 rounded">
                        {aiMode}
                      </span>
                    </div>

                    {aiExplanation && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <button
                          onClick={handleCopyAiExplanation}
                          className="p-1 hover:text-indigo-600 cursor-pointer rounded transition-colors"
                          title="Copy AI Explanation"
                        >
                          {copiedAiText ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={handleSaveAiToNote}
                          className="p-1 hover:text-indigo-600 cursor-pointer rounded transition-colors text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-1.5"
                          title="Save to study notes"
                        >
                          + Add to Notes
                        </button>
                      </div>
                    )}
                  </div>

                  {aiLoading ? (
                    <div className="py-4 flex flex-col items-center justify-center gap-2 text-indigo-700 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <p className="font-medium">Analyzing passage with Qwen 2.5 72B...</p>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-800 leading-relaxed max-h-48 overflow-y-auto space-y-1.5 whitespace-pre-line bg-white/70 p-2.5 rounded-lg border border-indigo-100">
                      {aiExplanation}
                    </div>
                  )}

                  {aiModelUsed && (
                    <div className="text-[10px] text-slate-400 text-right">
                      Powered by {aiModelUsed}
                    </div>
                  )}
                </div>
              )}

              {/* Saved Notes List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Saved Notes ({bookHighlights.length})
                </h3>
                {bookHighlights.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {bookHighlights.map((h) => (
                      <div
                        key={h.id}
                        className={`p-2.5 rounded-xl border text-xs relative group ${
                          h.color === 'yellow'
                            ? 'bg-amber-50/80 border-amber-200'
                            : h.color === 'green'
                            ? 'bg-emerald-50/80 border-emerald-200'
                            : 'bg-sky-50/80 border-sky-200'
                        }`}
                      >
                        <p className="font-semibold text-slate-900 leading-snug">"{h.text}"</p>
                        {h.note && <p className="text-slate-600 text-[11px] mt-1 italic">Note: {h.note}</p>}
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                          <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                const cleanBookTag = book.title.replace(/\s+/g, '-');
                                const postText = `"${h.text}" — from #${cleanBookTag} #LibroVerse`;
                                onClose();
                                navigate('/community');
                                showToast(`Quote copied! Head over to Community to share it.`, 'info');
                                navigator.clipboard?.writeText(postText);
                              }}
                              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                              title="Share Quote to Community Feed"
                            >
                              <span>Share</span>
                            </button>
                            <span>•</span>
                            <button
                              onClick={() => removeHighlight(h.id)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Delete Quote"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No notes saved for this book yet. Highlight quotes to review anytime!
                  </p>
                )}
              </div>

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
                  <span className="font-bold text-slate-800 truncate max-w-35">{authorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Uploaded
                  </span>
                  <span className="font-semibold text-slate-700">
                    {book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'Recent'}
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
