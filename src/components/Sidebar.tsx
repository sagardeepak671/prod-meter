'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarCheck, CalendarPlus, BarChart3, Trophy, Settings, Zap, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from './Avatar';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { href: '/daily', label: 'Daily Tracker', shortLabel: 'Daily', icon: CalendarCheck },
  { href: '/planner', label: 'Weekly Planner', shortLabel: 'Plan', icon: CalendarPlus },
  { href: '/analytics', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3 },
  { href: '/rewards', label: 'Rewards', shortLabel: 'Rewards', icon: Trophy },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Productivito</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Avatar photoURL={user.photoURL} displayName={user.displayName} uid={user.uid} size="sm" />
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1 animate-fade-in max-h-[calc(100vh-3.5rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-card-hover'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : ''}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
            {user && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-border px-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar photoURL={user.photoURL} displayName={user.displayName} uid={user.uid} size="sm" />
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <button onClick={logout} className="p-2 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors shrink-0">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center z-50 md:hidden safe-bottom">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-colors ${
                isActive ? 'text-violet-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Productivito</h1>
              <p className="text-xs text-slate-400 -mt-0.5">Meter</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/10 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-card-hover'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : ''}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-3">
              <Avatar photoURL={user.photoURL} displayName={user.displayName} uid={user.uid} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button onClick={logout} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-900/30 to-purple-900/20 border border-violet-500/20">
            <p className="text-xs text-violet-300 font-medium">Stay Consistent</p>
            <p className="text-xs text-slate-400 mt-1">Your future self will thank you</p>
          </div>
        </div>
      </aside>
    </>
  );
}
