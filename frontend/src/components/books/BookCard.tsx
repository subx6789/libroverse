import React from 'react';
import type { Book } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { BookOpen, User as UserIcon, Trash2, Edit3, Download } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onRead: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onRead, onEdit, onDelete }) => {
  const { user } = useAuthStore();

  const authorName =
    book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name).join(', ')
      : typeof book.author === 'object' && book.author
      ? book.author.name
      : 'Author';

  const authorId = typeof book.author === 'object' && book.author ? book.author._id : String(book.author);

  const isOwner = user && authorId && user._id === authorId;
  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase().includes('admin');
  const canManage = isOwner || isAdmin;

  return (
    <div className="theme-card rounded-lg overflow-hidden flex flex-col justify-between group">
      
      {/* Cover Image Container */}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-slate-100 border-b border-slate-100 flex items-center justify-center">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <BookOpen className="w-10 h-10 text-indigo-400 mb-2" />
            <span className="text-xs font-semibold line-clamp-2 text-slate-600">{book.title}</span>
          </div>
        )}

        {/* Solid Genre Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-slate-800 shadow-xs border border-slate-200">
            {book.genre || 'General'}
          </span>
        </div>

        {/* Hover Quick Read Button */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onRead(book)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transform translate-y-1 group-hover:translate-y-0 transition-transform"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open & Read</span>
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <UserIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate font-semibold text-slate-700">{authorName}</span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {book.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {book.description || 'No summary available.'}
          </p>
        </div>

        {/* Card Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={() => onRead(book)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read PDF</span>
          </button>

          {book.file && (
            <a
              href={book.file}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}

          {canManage && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(book)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="Edit Book"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(book)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Book"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
