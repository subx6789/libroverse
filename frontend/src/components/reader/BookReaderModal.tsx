import React, { useState } from 'react';
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
} from 'lucide-react';
import type { Book } from '../../types';
import { useBookStore } from '../../store/useBookStore';
import { useToast } from '../ui/ToastContext';

interface BookReaderModalProps {
  book: Book | null;
  onClose: () => void;
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({ book, onClose }) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [highlightText, setHighlightText] = useState('');
  const [highlightNote, setHighlightNote] = useState('');
  const [selectedColor, setSelectedColor] = useState<'yellow' | 'green' | 'blue'>('yellow');

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
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </form>
              </div>

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
                          <button
                            onClick={() => removeHighlight(h.id)}
                            className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Delete Quote"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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
