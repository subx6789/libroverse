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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 border-b border-slate-200">
      {/* Genre Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3 h-3" />
          Genres:
        </span>
        {GENRES.map((genre) => {
          const isSelected = selectedGenre === genre;
          return (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* Sort By Dropdown */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-500 font-medium">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 outline-none cursor-pointer shadow-2xs"
        >
          <option value="latest">Recently Added</option>
          <option value="title">Title (A-Z)</option>
          <option value="genre">Genre</option>
        </select>
      </div>
    </div>
  );
};
