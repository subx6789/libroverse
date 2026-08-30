import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../ui/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onLoginSuccess?: (role?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');

  const { login, register, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useToast();

  // Synchronize initial mode when modal opens
  const [prevMode, setPrevMode] = useState(initialMode);
  if (initialMode !== prevMode) {
    setPrevMode(initialMode);
    setMode(initialMode);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (mode === 'register' && !name) {
      showToast('Name is required for registration', 'error');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
        const loggedUser = useAuthStore.getState().user;
        showToast('Welcome back to LibroVerse!', 'success');
        if (onLoginSuccess) {
          onLoginSuccess(loggedUser?.role);
        }
      } else {
        await register(name, email, password);
        const registeredUser = useAuthStore.getState().user;
        showToast('Account created successfully! Welcome to LibroVerse.', 'success');
        if (onLoginSuccess) {
          onLoginSuccess(registeredUser?.role);
        }
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    }
  };

  const toggleMode = () => {
    clearError();
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-lg bg-white border border-slate-200 shadow-xl p-5 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {mode === 'login' ? 'Sign In to LibroVerse' : 'Create an Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'login'
                  ? 'Access your cloud publications and saved notes'
                  : 'Join the developer eBook platform today'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-3 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
          
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Subhajit Sarkar"
                  className="input-field pl-10! text-xs sm:text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@example.com"
                className="input-field pl-10! text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10! pr-10! text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="pt-4 mt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            {mode === 'login' ? "Don't have an account yet?" : 'Already have an account?'}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1.5 font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Register here' : 'Log in here'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
