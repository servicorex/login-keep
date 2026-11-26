import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Plus, Eye, EyeOff, Copy, Check, 
  Trash2, ExternalLink, Lock, LogOut, Globe, User, CheckCircle2,
  AlertCircle, Image, Edit3, Loader2, Sparkles
} from 'lucide-react';
import PixelKeyIcon from './components/PixelKeyIcon';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import HeroLanding from './components/HeroLanding';
import AuthPage from './components/AuthPage';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp, 
  onAuthStateChanged 
} from './firebase';
import { encryptPassword, decryptPassword, getAccountKey, clearCachedKey } from './crypto';

// Helper to extract or guess domain for Google Favicon API
const getDomainFromWebsite = (website, customUrl = '') => {
  if (customUrl) {
    try {
      const url = customUrl.startsWith('http') ? customUrl : `https://${customUrl}`;
      return new URL(url).hostname;
    } catch {
      // fallback
    }
  }
  const clean = (website || '').toLowerCase().trim().replace(/\s+/g, '');
  if (clean.includes('.')) {
    return clean;
  }
  const knownDomains = {
    netflix: 'netflix.com',
    github: 'github.com',
    google: 'google.com',
    amazon: 'amazon.com',
    spotify: 'spotify.com',
    facebook: 'facebook.com',
    instagram: 'instagram.com',
    twitter: 'twitter.com',
    x: 'x.com',
    linkedin: 'linkedin.com',
    reddit: 'reddit.com',
    youtube: 'youtube.com',
    microsoft: 'microsoft.com',
    apple: 'apple.com',
    discord: 'discord.com'
  };
  return knownDomains[clean] || `${clean}.com`;
};

const getFaviconUrl = (item) => {
  if (item.customIcon && item.customIcon.trim()) {
    return item.customIcon.trim();
  }
  const domain = getDomainFromWebsite(item.website, item.url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Vault data state
  const [vaultItems, setVaultItems] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Unauthenticated view state: 'hero' or 'auth'
  const [authView, setAuthView] = useState('hero');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Password visibility & Copy state
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [iconErrors, setIconErrors] = useState({});
  const [avatarError, setAvatarError] = useState(false);

  // Modal / Form state for Add/Edit & Delete Confirmation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null); // { id, website }
  const [newWebsite, setNewWebsite] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCustomIcon, setNewCustomIcon] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [iconMode, setIconMode] = useState('auto');
  const [savingItem, setSavingItem] = useState(false);
  const [notification, setNotification] = useState(null);

  const triggerToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore sync: Direct access once signed in
  useEffect(() => {
    if (!currentUser) {
      setVaultItems([]);
      setDataLoading(false);
      clearCachedKey();
      return;
    }

    setDataLoading(true);
    const vaultRef = collection(db, 'users', currentUser.uid, 'vault');

    // Pre-derive account key once in background
    let sessionKeyPromise = getAccountKey(currentUser.uid);

    const unsubscribe = onSnapshot(vaultRef, async (snapshot) => {
      const rawDocs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Await key once
      const accountKey = await sessionKeyPromise;

      // Decrypt credentials concurrently using the single cached key
      const decryptedItems = await Promise.all(
        rawDocs.map(async (item) => {
          try {
            const targetCipher = item.encPayload || item.password;
            const plain = await decryptPassword(targetCipher, currentUser.uid, accountKey);
            return {
              ...item,
              password: plain
            };
          } catch (e) {
            console.error("Decryption error for item", item.id, e);
            return item;
          }
        })
      );

      // Sort client-side by recency
      decryptedItems.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setVaultItems(decryptedItems);
      setDataLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      triggerToast(error.message || 'Failed to sync vault.', 'error');
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    try {
      setAuthSubmitting(true);
      await loginWithGoogle();
      triggerToast('Signed in with Google!');
      setAuthView('hero');
    } catch (err) {
      triggerToast(err.message || 'Google sign-in failed', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      triggerToast('Please provide both email and password', 'error');
      return;
    }

    try {
      setAuthSubmitting(true);
      if (authMode === 'signup') {
        await registerWithEmail(emailInput, passwordInput);
        triggerToast('Account created and signed in!');
      } else {
        await loginWithEmail(emailInput, passwordInput);
        triggerToast('Signed in successfully!');
      }
      setAuthView('hero');
      setEmailInput('');
      setPasswordInput('');
    } catch (err) {
      triggerToast(err.message || 'Authentication error', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      triggerToast('Logged out securely');
    } catch (err) {
      triggerToast(err.message || 'Error logging out', 'error');
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 1-Click Clipboard copy with 30-second auto-clear
  const copyToClipboard = (text, id, label = 'Password') => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${label}`);
    triggerToast(`${label} copied! (clears in 30s)`);

    setTimeout(() => setCopiedId(null), 2000);

    // Auto-purge clipboard after 30 seconds
    setTimeout(() => {
      navigator.clipboard.readText().then(current => {
        if (current === text) {
          navigator.clipboard.writeText('');
        }
      }).catch(() => {});
    }, 30000);
  };

  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setEditingItemId(null);
    setNewWebsite('');
    setNewUrl('');
    setNewCustomIcon('');
    setNewUsername(''); // Never prefilled
    setNewPassword('');
    setFormError('');
    setIconMode('auto');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItemId(item.id);
    setNewWebsite(item.website);
    setNewUrl(item.url || '');
    setNewCustomIcon(item.customIcon || '');
    setNewUsername(item.username || '');
    setNewPassword(item.password);
    setFormError('');
    setIconMode(item.customIcon ? 'custom' : 'auto');
    setIsAddModalOpen(true);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newWebsite.trim()) {
      setFormError('Please enter a website or service name.');
      return;
    }
    if (!newPassword.trim()) {
      setFormError('Please enter a password.');
      return;
    }

    if (!currentUser) {
      triggerToast('Please sign in to save credentials.', 'error');
      return;
    }

    const domain = getDomainFromWebsite(newWebsite, newUrl);
    const finalUrl = newUrl.trim() 
      ? (newUrl.startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`)
      : `https://${domain}`;

    setSavingItem(true);
    try {
      const vaultRef = collection(db, 'users', currentUser.uid, 'vault');

      // Encrypt password using AES-256-GCM
      const cipherPassword = await encryptPassword(newPassword, currentUser.uid);

      if (editingItemId) {
        // Update document
        const itemDoc = doc(db, 'users', currentUser.uid, 'vault', editingItemId);
        await updateDoc(itemDoc, {
          website: newWebsite.trim(),
          url: finalUrl,
          customIcon: iconMode === 'custom' ? newCustomIcon.trim() : '',
          username: newUsername.trim() || '',
          password: cipherPassword,
          updatedAt: serverTimestamp()
        });
        triggerToast(`Updated ${newWebsite.trim()}`);
      } else {
        // Create new document
        await addDoc(vaultRef, {
          website: newWebsite.trim(),
          url: finalUrl,
          customIcon: iconMode === 'custom' ? newCustomIcon.trim() : '',
          username: newUsername.trim() || '',
          password: cipherPassword,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        triggerToast(`Saved ${newWebsite.trim()} to your vault!`);
      }
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      triggerToast(err.message || 'Failed to save password.', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const confirmDelete = async () => {
    if (!currentUser || !deletingItem) return;
    try {
      const itemDoc = doc(db, 'users', currentUser.uid, 'vault', deletingItem.id);
      await deleteDoc(itemDoc);
      triggerToast(`Deleted ${deletingItem.website} entry`);
    } catch (err) {
      triggerToast(err.message || 'Failed to delete entry.', 'error');
    } finally {
      setDeletingItem(null);
    }
  };

  const filteredItems = vaultItems.filter(item => 
    item.website?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const previewDomain = getDomainFromWebsite(newWebsite || 'google', newUrl);
  const previewFaviconUrl = iconMode === 'custom' && newCustomIcon.trim() 
    ? newCustomIcon.trim() 
    : `https://www.google.com/s2/favicons?domain=${previewDomain}&sz=128`;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="text-sm font-medium">Opening LoginKeep...</span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative ${
        currentUser
          ? 'bg-[#0b101b] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200'
          : 'bg-[#05050a] text-slate-100 selection:bg-purple-500/40 selection:text-white'
      }`}
    >
      {/* Decorative ambient background glows for full-color dashboard */}
      {currentUser && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-40 left-1/4 w-[650px] h-[380px] rounded-full bg-teal-500/[0.12] blur-[130px]" />
          <div className="absolute top-1/3 right-10 w-[550px] h-[350px] rounded-full bg-cyan-500/[0.09] blur-[140px]" />
          <div className="absolute -bottom-20 left-10 w-[600px] h-[350px] rounded-full bg-emerald-600/[0.08] blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage: 'radial-gradient(rgba(45, 212, 191, 0.25) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>
      )}
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-200 backdrop-blur-md ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-[#0f1d2e]/95 border-teal-500/40 text-teal-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          currentUser
            ? 'bg-[#0d1524]/85 backdrop-blur-xl border-b border-teal-500/15 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
            : 'pt-4 pb-2 px-4 sm:px-8 bg-transparent'
        }`}
      >
        <div
          className={`mx-auto transition-all duration-300 ${
            currentUser
              ? 'h-14 sm:h-16 flex items-center justify-between w-full px-4 sm:px-6 lg:px-10 xl:px-12'
              : 'h-14 sm:h-16 flex items-center justify-between max-w-7xl px-4 sm:px-6 rounded-full footer-glass-pill bg-[#0c0d1b]/70 border border-purple-500/25 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.65)] ring-1 ring-white/10'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (!currentUser) setAuthView('hero');
            }}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                currentUser
                  ? 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md shadow-teal-500/30 ring-1 ring-teal-400/30'
                  : 'bg-gradient-to-tr from-purple-600/90 via-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(168,85,247,0.45)] ring-1 ring-purple-400/40 rounded-full'
              }`}
            >
              <PixelKeyIcon className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className={`font-black text-lg tracking-tight ${
                  currentUser
                    ? 'bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                }`}
              >
                LoginKeep
              </span>
              {currentUser && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/25">
                  Personal Vault
                </span>
              )}
            </div>
          </button>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 py-1 pl-1 pr-2.5 rounded-full bg-[#131f33]/80 border border-teal-500/20 shadow-inner">
                  {currentUser.photoURL && !avatarError ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || currentUser.email}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-7 h-7 rounded-full object-cover border border-teal-500/30"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold text-xs flex items-center justify-center">
                      {currentUser.displayName
                        ? currentUser.displayName.charAt(0).toUpperCase()
                        : currentUser.email
                          ? currentUser.email.charAt(0).toUpperCase()
                          : 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left text-xs pr-1">
                    <p className="font-semibold text-slate-200 leading-tight">
                      {currentUser.displayName || currentUser.email.split('@')[0]}
                    </p>
                    <p className="text-teal-400/80 text-[11px] leading-tight truncate max-w-[160px]">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  aria-label="Log out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NavigationMenu className="dark">
                <NavigationMenuList className="flex items-center gap-1.5 sm:gap-2">
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      active={authView === 'hero'}
                      asChild
                      className={cn(
                        "group relative inline-flex items-center justify-center font-medium text-xs text-slate-300 transition-all cursor-pointer",
                        "hover:text-white",
                        "data-active:text-white"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthView('auth');
                        }}
                        className="px-4 py-2 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
                      >
                        Sign In
                      </button>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      active={authView === 'auth' && authMode === 'signup'}
                      asChild
                      className={cn(
                        "group relative inline-flex items-center justify-center font-medium text-xs text-slate-300 transition-all cursor-pointer"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setAuthView('auth');
                        }}
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:shadow-[0_0_32px_rgba(168,85,247,0.6)] active:scale-95 cursor-pointer ring-1 ring-purple-400/40"
                      >
                        Get Started
                      </button>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {!currentUser ? (
        authView === 'auth' ? (
          <AuthPage
            authMode={authMode}
            setAuthMode={setAuthMode}
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            passwordInput={passwordInput}
            setPasswordInput={setPasswordInput}
            authSubmitting={authSubmitting}
            onGoogleSignIn={handleGoogleSignIn}
            onEmailAuth={handleEmailAuth}
            onBack={() => setAuthView('hero')}
          />
        ) : (
          <HeroLanding
            onGetStarted={() => {
              setAuthMode('signup');
              setAuthView('auth');
            }}
            onSignIn={() => {
              setAuthMode('login');
              setAuthView('auth');
            }}
          />
        )
      ) : (
      <main className="relative z-10 flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-6 sm:py-8">
          <div>
            {/* Dashboard Heading Banner */}
            <div className="bg-gradient-to-r from-[#101b2d] via-[#132238] to-[#101b2d] border border-teal-500/20 rounded-2xl p-5 sm:p-6 mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Your Passwords
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    <Sparkles className="w-2.5 h-2.5" /> AES-256
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  All your logins, encrypted and organized in one place.
                </p>
              </div>

              <div className="flex items-center">
                <button
                  onClick={openCreateModal}
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-teal-500/25 ring-1 ring-white/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Password</span>
                </button>
              </div>
            </div>

            {/* Search and Statistics */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-teal-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search websites, apps or usernames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] bg-[#111c2e]/90 border border-teal-500/20 rounded-xl pl-10 pr-16 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-teal-400 hover:text-teal-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="inline-flex min-h-[44px] items-center justify-center gap-2 text-xs font-semibold text-teal-200 bg-[#111c2e]/90 border border-teal-500/25 px-4 py-2.5 rounded-xl whitespace-nowrap shadow-sm">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>{filteredItems.length} saved passwords</span>
              </div>
            </div>

            {/* Content State */}
            {dataLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2.5">
                <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                <span className="text-sm">Loading your saved credentials...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-14 px-6 bg-[#101b2d]/80 border border-teal-500/20 rounded-2xl shadow-xl">
                <div className="inline-flex p-3.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
                  <PixelKeyIcon className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">
                  {searchQuery ? 'No matching passwords' : 'Your vault is empty'}
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                  {searchQuery
                    ? `No credentials match "${searchQuery}".`
                    : 'Save your first login and keep everything organized in one place.'}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16243b] text-slate-200 hover:bg-[#1a2d4a] text-sm font-medium border border-teal-500/20 transition-colors cursor-pointer"
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-teal-500/25 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add your first password</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredItems.map((item) => {
                  const isPassVisible = visiblePasswords[item.id];
                  const isCopiedUser = copiedId === `${item.id}-Username`;
                  const isCopiedPass = copiedId === `${item.id}-Password`;
                  const favicon = getFaviconUrl(item);
                  const hasIconError = iconErrors[item.id];
                  const displayUrl = item.url
                    ? item.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                    : '';

                  return (
                    <div
                      key={item.id}
                      className="group relative bg-[#101b2d]/90 hover:bg-[#132238] border border-teal-500/20 hover:border-teal-400/50 rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_28px_rgba(20,184,166,0.15)] hover:-translate-y-0.5"
                    >
                      <div>
                        {/* Card Header: Favicon, Website, URL & Actions */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#0c1422] border border-teal-500/25 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                              {!hasIconError ? (
                                <img
                                  src={favicon}
                                  alt={item.website}
                                  className="w-full h-full object-cover"
                                  onError={() => setIconErrors(prev => ({ ...prev, [item.id]: true }))}
                                />
                              ) : (
                                <span className="font-bold text-teal-400 text-base">
                                  {item.website?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-white text-sm truncate">
                                {item.website}
                              </h3>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={item.url}
                                  className="text-xs text-teal-400/80 hover:text-teal-300 transition-colors inline-flex items-center gap-1 max-w-full"
                                >
                                  <span className="truncate">{displayUrl}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400">Saved login</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit"
                              aria-label={`Edit ${item.website}`}
                              className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingItem({ id: item.id, website: item.website })}
                              title="Delete"
                              aria-label={`Delete ${item.website}`}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Username row */}
                        <div className="bg-[#0b1424]/90 border border-teal-500/15 rounded-xl px-3 py-2 mb-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <User className="w-3.5 h-3.5 text-teal-400/70 shrink-0" />
                            <span className="text-slate-200 truncate font-mono">
                              {item.username || 'No username'}
                            </span>
                          </div>
                          {item.username && (
                            <button
                              onClick={() => copyToClipboard(item.username, item.id, 'Username')}
                              title="Copy username"
                              aria-label="Copy username"
                              className="p-1 text-slate-400 hover:text-teal-300 rounded transition-colors shrink-0 cursor-pointer"
                            >
                              {isCopiedUser ? (
                                <Check className="w-3.5 h-3.5 text-teal-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Password row */}
                        <div className="bg-[#0b1424]/90 border border-teal-500/15 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 overflow-hidden mr-2 font-mono">
                            <PixelKeyIcon className="w-3.5 h-3.5 text-teal-400/70 shrink-0" />
                            <span className="text-slate-200 truncate">
                              {isPassVisible ? item.password : '••••••••••••'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => togglePasswordVisibility(item.id)}
                              title={isPassVisible ? 'Hide password' : 'Show password'}
                              aria-label={isPassVisible ? 'Hide password' : 'Show password'}
                              className="p-1 text-slate-400 hover:text-teal-300 rounded transition-colors cursor-pointer"
                            >
                              {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.password, item.id, 'Password')}
                              title="Copy password"
                              aria-label="Copy password"
                              className="p-1 text-slate-400 hover:text-teal-300 rounded transition-colors cursor-pointer"
                            >
                              {isCopiedPass ? (
                                <Check className="w-3.5 h-3.5 text-teal-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </main>
        )}

      {/* Modal: Add or Edit Password */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#101b2d] border border-teal-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center justify-center">
                  <PixelKeyIcon className="w-4 h-4 text-teal-400" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingItemId ? 'Edit Password' : 'Add Password'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4" noValidate>
              {formError && (
                <div className="px-3.5 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Website Name & Live Icon Preview */}
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  Website name <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0c1422] border border-teal-500/30 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <img
                      src={previewFaviconUrl}
                      alt="Icon preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                    />
                  </div>
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-teal-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Netflix, Spotify, GitHub"
                      value={newWebsite}
                      onChange={(e) => {
                        setNewWebsite(e.target.value);
                        if (formError) setFormError('');
                      }}
                      className="w-full bg-[#0c1422] border border-teal-500/25 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Mode Tabs */}
              <div className="bg-[#0c1422] border border-teal-500/20 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-teal-400" />
                    Website Icon
                  </span>
                  <div className="flex bg-[#101b2d] p-0.5 rounded-lg border border-teal-500/25 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setIconMode('auto')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        iconMode === 'auto'
                          ? 'bg-teal-500 text-white font-medium shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Auto Favicon
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconMode('custom')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        iconMode === 'custom'
                          ? 'bg-teal-500 text-white font-medium shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Custom Icon URL
                    </button>
                  </div>
                </div>

                {iconMode === 'auto' ? (
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Automatically fetches the official favicon based on the website name.
                  </p>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="Paste image/icon URL (e.g. https://example.com/logo.png)"
                      value={newCustomIcon}
                      onChange={(e) => setNewCustomIcon(e.target.value)}
                      className="w-full bg-[#101b2d] border border-teal-500/25 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"
                    />
                  </div>
                )}
              </div>

              {/* Direct Website URL */}
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  Website URL <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-teal-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. https://netflix.com/login"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-[#0c1422] border border-teal-500/25 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition-colors"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  Username or email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-teal-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. name@example.com or username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-[#0c1422] border border-teal-500/25 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-teal-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full bg-[#0c1422] border border-teal-500/25 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-teal-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-sm font-semibold transition-all shadow-md shadow-teal-500/25 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {savingItem && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItemId ? 'Update Password' : 'Save Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#101b2d] border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Delete {deletingItem.website}?
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this saved password? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#16243b] hover:bg-[#1c304f] text-slate-200 font-medium text-xs transition-colors border border-teal-500/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer (shown on authenticated dashboard & auth page) */}
      {(currentUser || authView === 'auth') && (
        <footer
          className={`relative z-10 py-5 text-center text-xs ${
            currentUser
              ? 'border-t border-teal-500/15 bg-[#0d1524]/80 backdrop-blur-sm text-teal-400/80'
              : 'border-t border-white/[0.06] bg-[#05050a] text-slate-500'
          }`}
        >
          <p>LoginKeep &bull; AES-256-GCM Encrypted &bull; Personal Password Vault</p>
        </footer>
      )}
    </div>
  );
}
