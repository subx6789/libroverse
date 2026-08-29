import React, { useState } from 'react';
import {
  BookOpen,
  PlusCircle,
  LogOut,
  ShieldAlert,
  Search,
  Users,
  Library,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useBookStore } from '../../store/useBookStore';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenUpload: () => void;
  onOpenAdmin: () => void;
  currentPublicTab: 'catalog' | 'community';
  onSelectPublicTab: (tab: 'catalog' | 'community') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenUpload,
  onOpenAdmin,
  currentPublicTab,
  onSelectPublicTab,
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { searchQuery, setSearchQuery } = useBookStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & View Switcher */}
        <div className="flex items-center gap-6 shrink-0">
          <div
            onClick={() => onSelectPublicTab('catalog')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs transition-transform group-hover:scale-105">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-900 leading-tight">
                LibroVerse
              </span>
              <span className="text-[10px] block font-semibold text-slate-400 -mt-1">
                eBooks & Community
              </span>
            </div>
          </div>

          {/* Navigation Pill Switcher: Library Catalog vs Community Feed */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => onSelectPublicTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentPublicTab === 'catalog'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Library Catalog</span>
            </button>

            <button
              onClick={() => onSelectPublicTab('community')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentPublicTab === 'community'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Reader Community</span>
            </button>
          </nav>
        </div>

        {/* Global Search Bar (When on catalog) */}
        {currentPublicTab === 'catalog' && (
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or genre..."
                className="input-field pl-10! pr-12 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded-md cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile view switch pills */}
          <div className="flex sm:hidden items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              onClick={() => onSelectPublicTab('catalog')}
              className={`px-2 py-1 rounded ${currentPublicTab === 'catalog' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
            >
              Books
            </button>
            <button
              onClick={() => onSelectPublicTab('community')}
              className={`px-2 py-1 rounded ${currentPublicTab === 'community' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
            >
              Feed
            </button>
          </div>

          {isAuthenticated ? (
            <>
              {/* Only Admin can publish books */}
              {isAdmin && (
                <button
                  onClick={onOpenUpload}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Publish Book</span>
                </button>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-xs sm:text-sm hidden sm:inline text-slate-800">
                    {user?.name || 'Reader'}
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded border border-indigo-200 uppercase">
                          System Admin
                        </span>
                      )}
                    </div>
                    <div className="p-1 space-y-1">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onOpenAdmin();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 text-indigo-600" />
                          Admin Console & Analytics
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
