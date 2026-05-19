'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Zap } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Effect 1: Immediate forced timeout - MUST fire
  useEffect(() => {
    const t = setTimeout(() => {
      console.log('[Auth] Forced timeout fired');
      setLoading(false);
    }, 1500); // 1.5 seconds max
    return () => {}; // never clear
  }, []);

  // Effect 2: Firebase auth (non-blocking)
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        console.log('[Auth] User state:', firebaseUser ? 'logged in' : 'logged out');
        setUser(firebaseUser);
        setIsGuest(firebaseUser?.isAnonymous ?? false);
      }, (err) => {
        console.error('[Auth] Error:', err);
      });
      return unsubscribe;
    } catch (e) {
      console.error('[Auth] Setup failed:', e);
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  const signInAsGuest = async () => {
    // Guest mode disabled temporarily
    alert('Guest mode coming soon! Please use Google sign-in for now.');
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
        <div className="text-white text-xl animate-pulse flex items-center gap-3">
          <Zap className="w-6 h-6 text-violet-400" />
          Loading...
        </div>
        <button
          onClick={() => setLoading(false)}
          className="text-sm text-slate-500 hover:text-slate-300 underline transition-colors"
        >
          Tap here if stuck
        </button>
        <p className="text-[10px] text-slate-700">v12-nuclear</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="bg-[#0f172a] border border-[#334155] rounded-2xl p-10 text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mt-6">Productivito-Meter</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Track your productivity, build streaks, and crush your goals.
          </p>
          <button
            onClick={signInWithGoogle}
            className="mt-8 w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          <p className="text-xs text-slate-500 mt-4">
            Your data syncs across all devices securely via Google sign-in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, signInWithGoogle, signInAsGuest: async () => {}, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
