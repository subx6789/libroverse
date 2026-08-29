import React from 'react';
import { BookOpen, User as UserIcon } from 'lucide-react';

interface MentionAutocompleteProps {
  users: Array<{ _id: string; name: string; username?: string; avatar?: string }>;
  books: Array<{ _id: string; title: string; coverImage?: string; genre?: string }>;
  onSelectUser: (user: { name: string; username?: string }) => void;
  onSelectBook: (book: { title: string }) => void;
  isLoading?: boolean;
}

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  users,
  books,
  onSelectUser,
  onSelectBook,
  isLoading,
}) => {
  const hasResults = users.length > 0 || books.length > 0;

  if (!hasResults && !isLoading) return null;

  return (
    <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-bottom-2">
      <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-slate-500 font-semibold text-[11px]">
        <span>Mention Readers or eBooks</span>
        {isLoading && <span className="text-indigo-600 animate-pulse">Searching...</span>}
      </div>

      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
        {/* Readers List */}
        {users.length > 0 && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              Readers
            </div>
            {users.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => onSelectUser(u)}
                className="w-full px-2.5 py-2 flex items-center gap-2.5 hover:bg-indigo-50/80 text-left transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    u.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    @{u.username || u.name.toLowerCase().replace(/\s+/g, '')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Books List */}
        {books.length > 0 && (
          <div>
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              eBooks in Library
            </div>
            {books.map((b) => (
              <button
                key={b._id}
                type="button"
                onClick={() => onSelectBook(b)}
                className="w-full px-2.5 py-2 flex items-center gap-2.5 hover:bg-indigo-50/80 text-left transition-colors cursor-pointer"
              >
                {b.coverImage ? (
                  <img
                    src={b.coverImage}
                    alt=""
                    className="w-5 h-7 object-cover rounded-xs border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-5 h-7 rounded-xs bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <BookOpen className="w-3 h-3" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{b.title}</p>
                  <p className="text-[10px] text-indigo-600 font-medium truncate">@{b.genre}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
