import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  Search,
  Users,
  Library,
  Compass,
  Home,
  User as UserIcon,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useBookStore } from '../../store/useBookStore';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenProfile,
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { searchQuery, setSearchQuery } = useBookStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const currentPath = location.pathname;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <div
            onClick={() => {
              if (isAdmin) {
                navigate('/admin');
              } else if (isAuthenticated) {
                navigate('/home');
              } else {
                navigate('/');
              }
            }}
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
                {isAuthenticated ? (isAdmin ? 'Admin Console' : 'Reader Portal') : 'Digital eBooks'}
              </span>
            </div>
          </div>

          {/* Navigation for Authenticated Readers */}
          {isAuthenticated && !isAdmin && (
            <nav className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => navigate('/home')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  currentPath === '/home' || currentPath === '/'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              <button
                onClick={() => navigate('/library')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  currentPath === '/library'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>Library</span>
              </button>

              <button
                onClick={() => navigate('/community')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  currentPath === '/community'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Community</span>
              </button>
            </nav>
          )}

          {/* Navigation for Unauthenticated Guests */}
          {!isAuthenticated && (
            <nav className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  currentPath === '/'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => navigate('/about')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  currentPath === '/about'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                About Us
              </button>

              <button
                onClick={() => navigate('/contact')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentPath === '/contact'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Contact Us
              </button>
            </nav>
          )}
        </div>

        {/* Global Search Bar (Only when on Library) */}
        {currentPath === '/library' && (
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

        {/* Right Actions / Auth Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile switcher for guests */}
          {!isAuthenticated && (
            <div className="flex sm:hidden items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => navigate('/')}
                className={`px-2 py-1 rounded ${currentPath === '/' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
              >
                Home
              </button>
              <button
                onClick={() => navigate('/about')}
                className={`px-2 py-1 rounded ${currentPath === '/about' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
              >
                About
              </button>
              <button
                onClick={() => navigate('/contact')}
                className={`px-2 py-1 rounded ${currentPath === '/contact' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
              >
                Contact
              </button>
            </div>
          )}

          {/* Mobile switcher for readers */}
          {isAuthenticated && !isAdmin && (
            <div className="flex sm:hidden items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => navigate('/home')}
                className={`px-2 py-1 rounded ${currentPath === '/home' || currentPath === '/' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
              >
                Home
              </button>
              <button
                onClick={() => navigate('/library')}
                className={`px-2 py-1 rounded ${currentPath === '/library' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
              >
                Books
              </button>
              <button
                onClick={() => navigate('/community')}
                className={`px-2 py-1 rounded ${currentPath === '/community' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
              >
                Feed
              </button>
            </div>
          )}

          {isAuthenticated ? (
            /* User Dropdown */
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
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{user?.email}</p>
                  </div>

                  {!isAdmin && onOpenProfile && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-600" />
                      <span>My Reader Profile</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/admin');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Console</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Login & Register Buttons */
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
