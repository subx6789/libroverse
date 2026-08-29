import React from "react";
import { Filter, ArrowUpDown } from "lucide-react";
import { useBookStore } from "../../store/useBookStore";

const GENRES = [
  "All",
  "Computer Science",
  "Software Engineering",
  "Business & Startups",
  "Self Improvement",
  "Productivity",
  "Fiction",
  "Science",
];

export const BookFilterBar: React.FC = () => {
  const { selectedGenre, setSelectedGenre, sortBy, setSortBy } = useBookStore();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-slate-800/80">
      {/* Genre Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" />
          Genres:
        </span>
        {GENRES.map((genre) => {
          const isSelected = selectedGenre === genre;
          return (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* Sort By Dropdown */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="latest">Recently Added</option>
          <option value="title">Title (A-Z)</option>
          <option value="genre">Genre</option>
        </select>
      </div>
    </div>
  );
};
