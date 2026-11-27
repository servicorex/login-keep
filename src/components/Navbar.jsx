import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import PixelKeyIcon from './PixelKeyIcon';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

export default function Navbar({
  currentUser,
  authView,
  setAuthView,
  authMode,
  setAuthMode,
  avatarError,
  setAvatarError,
  handleLogout,
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (currentUser) {
    return (
      <header className="sticky top-0 z-40 transition-all duration-300 bg-[#05050a]/90 backdrop-blur-xl border-b border-purple-500/15 shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
        <div className="mx-auto transition-all duration-300 h-14 sm:h-16 flex items-center justify-between w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-left shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-600 shadow-[0_4px_12px_rgba(147,51,234,0.3)]">
              <PixelKeyIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-lg tracking-tight text-white">
                LoginKeep
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Personal Vault
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 py-1 pl-1 pr-2.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
              {currentUser.photoURL && !avatarError ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || currentUser.email}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-7 h-7 rounded-full object-cover border border-white/10"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 font-semibold text-xs flex items-center justify-center">
                  {currentUser.displayName
                    ? currentUser.displayName.charAt(0).toUpperCase()
                    : currentUser.email
                      ? currentUser.email.charAt(0).toUpperCase()
                      : 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left text-xs pr-1">
                <p className="font-semibold text-slate-100 leading-tight">
                  {currentUser.displayName || currentUser.email.split('@')[0]}
                </p>
                <p className="text-slate-400 text-[11px] leading-tight truncate max-w-[160px]">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300 relative overflow-hidden',
        isScrolled
          ? 'bg-[#070713]/88 backdrop-blur-2xl border-b border-purple-500/25 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_1px_24px_rgba(139,92,246,0.14)]'
          : 'bg-[#060611]/65 backdrop-blur-xl border-b border-purple-500/15 shadow-[0_4px_24px_rgba(0,0,0,0.35),0_1px_20px_rgba(139,92,246,0.08)]'
      )}
    >
      {/* Subtle purple ambient glow scoped to navbar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_50%_-20%,rgba(139,92,246,0.14),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-400/35 to-transparent"
      />

      <div className="relative mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setAuthView('hero')}
          className="flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer group shrink-0"
        >
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-1 rounded-full bg-purple-500/25 blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 bg-gradient-to-tr from-purple-600/90 via-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(168,85,247,0.45)] ring-1 ring-purple-400/40">
              <PixelKeyIcon className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]" />
            </div>
          </div>
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            LoginKeep
          </span>
        </button>

        <NavigationMenu className="dark shrink-0">
          <NavigationMenuList className="flex items-center gap-2 sm:gap-4">
            <NavigationMenuItem>
              <NavigationMenuLink
                active={authView === 'hero'}
                asChild
                className={cn(
                  'group relative inline-flex items-center justify-center font-medium text-xs sm:text-sm text-slate-300 transition-colors duration-200 cursor-pointer',
                  'hover:text-white data-active:text-white'
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthView('auth');
                  }}
                  className="px-2.5 sm:px-3.5 py-2 text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer whitespace-nowrap"
                >
                  Sign In
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                active={authView === 'auth' && authMode === 'signup'}
                asChild
                className="group relative inline-flex items-center justify-center font-medium text-xs sm:text-sm transition-all cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthView('auth');
                  }}
                  className="px-3.5 sm:px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.38)] hover:shadow-[0_0_28px_rgba(168,85,247,0.6)] active:scale-[0.98] cursor-pointer ring-1 ring-purple-400/40 whitespace-nowrap"
                >
                  Get Started
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}

