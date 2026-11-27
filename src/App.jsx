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
import Navbar from './components/Navbar';
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

  // Unauthenticated view state & URL routing ('/', '/login', '/vault')
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const navigate = (path, replace = false) => {
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
    }
    setCurrentPath(path);
  };
  const authView = currentPath === '/login' ? 'auth' : 'hero';
  const setAuthView = (view) => {
    navigate(view === 'auth' ? '/login' : '/');
  };
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

  // 1. Firebase Auth listener + browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => {
      window.removeEventListener('popstate', onPopState);
      unsubscribe();
    };
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser && currentPath === '/vault') {
      navigate('/login', true);
    } else if (currentUser && currentPath === '/login') {
      navigate('/vault', true);
    }
  }, [authLoading, currentUser, currentPath]);

  // 2. Real-time Firestore sync: Direct access once signed in
  useEffect(() => {
    if (authLoading || !currentUser) {
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

    if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05050a] text-slate-300 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
        <span className="text-sm font-medium tracking-wide text-slate-400">
          Verifying session...
        </span>
      </div>
    );
  }

  return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentUser]);

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    try {
      setAuthSubmitting(true);
      await loginWithGoogle();
      triggerToast('Signed in with Google!');
      navigate('/vault', true);
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
      setEmailInput('');
      setPasswordInput('');
      navigate('/vault', true);
    } catch (err) {
      triggerToast(err.message || 'Authentication error', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearCachedKey();
      setVaultItems([]);
      setVisiblePasswords({});
      setSearchQuery('');
      setCopiedId(null);
      setIsAddModalOpen(false);
      setEditingItemId(null);
      setDeletingItem(null);
      setNewWebsite('');
      setNewUrl('');
      setNewCustomIcon('');
      setNewUsername('');
      setNewPassword('');
      navigate('/login', true);
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
    if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05050a] text-slate-300 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
        <span className="text-sm font-medium tracking-wide text-slate-400">
          Verifying session...
        </span>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="text-sm font-medium">Opening LoginKeep...</span>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05050a] text-slate-300 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
        <span className="text-sm font-medium tracking-wide text-slate-400">
          Verifying session...
        </span>
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
      <Navbar
        currentUser={currentUser}
        authView={authView}
        setAuthView={setAuthView}
        authMode={authMode}
        setAuthMode={setAuthMode}
        avatarError={avatarError}
        setAvatarError={setAvatarError}
        handleLogout={handleLogout}
      />

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
      <main className="relative z-10 flex-1 w-full bg-[#05050a] overflow-hidden">
        {/* Grid + Aurora background matching hero */}
        <div className="footer-aurora absolute left-1/2 top-1/3 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[100px] pointer-events-none z-0" />
        <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-indigo-700/10 blur-[130px]" />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Dashboard Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Your Passwords
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                All your logins, organized in one place.
              </p>
            </div>

            <div className="flex items-center shrink-0">
              <button
                onClick={openCreateModal}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-[0_4px_14px_rgba(147,51,234,0.3)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Password</span>
              </button>
            </div>
          </div>

          {/* Search and Statistics */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search websites, apps or usernames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[46px] bg-[#0c0d1b]/70 border border-purple-500/15 rounded-xl pl-11 pr-16 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="inline-flex min-h-[46px] items-center justify-center gap-2 text-xs font-semibold text-slate-400 bg-[#0c0d1b]/70 border border-purple-500/15 px-4 py-3 rounded-xl whitespace-nowrap">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>{filteredItems.length} saved passwords</span>
            </div>
          </div>

          {/* Content State */}
          {dataLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span className="text-sm font-medium">Loading your saved credentials...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 px-6 bg-[#0c0d1b]/70 border border-purple-500/15 rounded-2xl">
              <div className="inline-flex p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-5">
                <PixelKeyIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchQuery ? 'No matching passwords' : 'Your vault is waiting.'}
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-7 leading-relaxed">
                {searchQuery
                  ? `No credentials match "${searchQuery}".`
                  : 'Add your first login and keep everything organized in one place.'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] text-sm font-medium border border-purple-500/15 transition-colors cursor-pointer"
                >
                  Clear search
                </button>
              ) : (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-[0_4px_14px_rgba(147,51,234,0.3)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add your first password</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                    className="group relative bg-[#0c0d1b]/70 hover:bg-[#0f1025] border border-purple-500/15 hover:border-purple-500/30 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Card Header: Favicon, Website, URL & Actions */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#12132a] border border-purple-500/15 flex items-center justify-center overflow-hidden shrink-0">
                            {!hasIconError ? (
                              <img
                                src={favicon}
                                alt={item.website}
                                className="w-full h-full object-cover"
                                onError={() => setIconErrors(prev => ({ ...prev, [item.id]: true }))}
                              />
                            ) : (
                              <span className="font-bold text-purple-400 text-base">
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
                                className="text-xs text-slate-400 hover:text-purple-400 transition-colors inline-flex items-center gap-1 max-w-full"
                              >
                                <span className="truncate">{displayUrl}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-500">Saved login</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit"
                            aria-label={`Edit ${item.website}`}
                            className="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ id: item.id, website: item.website })}
                            title="Delete"
                            aria-label={`Delete ${item.website}`}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Username row */}
                      <div className="bg-[#12132a] rounded-xl px-3.5 py-2.5 mb-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-200 truncate font-mono text-[13px]">
                            {item.username || 'No username'}
                          </span>
                        </div>
                        {item.username && (
                          <button
                            onClick={() => copyToClipboard(item.username, item.id, 'Username')}
                            title="Copy username"
                            aria-label="Copy username"
                            className="p-1 text-slate-500 hover:text-purple-400 rounded transition-colors shrink-0 cursor-pointer"
                          >
                            {isCopiedUser ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Password row */}
                      <div className="bg-[#12132a] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 overflow-hidden mr-2 font-mono">
                          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-200 truncate text-[13px]">
                            {isPassVisible ? item.password : '••••••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => togglePasswordVisibility(item.id)}
                            title={isPassVisible ? 'Hide password' : 'Show password'}
                            aria-label={isPassVisible ? 'Hide password' : 'Show password'}
                            className="p-1 text-slate-500 hover:text-purple-400 rounded transition-colors cursor-pointer"
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.password, item.id, 'Password')}
                            title="Copy password"
                            aria-label="Copy password"
                            className="p-1 text-slate-500 hover:text-purple-400 rounded transition-colors cursor-pointer"
                          >
                            {isCopiedPass ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
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
          <div className="bg-[#141418] border border-white/[0.08] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center justify-center">
                  <PixelKeyIcon className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingItemId ? 'Edit Password' : 'Add Password'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4" noValidate>
              {formError && (
                <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Website Name & Live Icon Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Website name <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1e1e24] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
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
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Netflix, Spotify, GitHub"
                      value={newWebsite}
                      onChange={(e) => {
                        setNewWebsite(e.target.value);
                        if (formError) setFormError('');
                      }}
                      className="w-full bg-[#1e1e24] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Mode Tabs */}
              <div className="bg-[#1e1e24] border border-white/[0.06] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-purple-400" />
                    Website Icon
                  </span>
                  <div className="flex bg-[#141418] p-0.5 rounded-lg border border-white/[0.06] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setIconMode('auto')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        iconMode === 'auto'
                          ? 'bg-purple-600 text-white font-medium shadow-xs'
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
                          ? 'bg-purple-600 text-white font-medium shadow-xs'
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
                      className="w-full bg-[#141418] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40"
                    />
                  </div>
                )}
              </div>

              {/* Direct Website URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Website URL <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. https://netflix.com/login"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-[#1e1e24] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Username or email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. name@example.com or username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-[#1e1e24] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full bg-[#1e1e24] border border-white/[0.08] rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-400 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-[0_4px_14px_rgba(147,51,234,0.3)] cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
          <div className="bg-[#141418] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Delete {deletingItem.website}?
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this saved password? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-medium text-xs transition-colors border border-white/[0.08] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
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
              ? 'border-t border-purple-500/15 bg-[#05050a] text-slate-500'
              : 'border-t border-white/[0.06] bg-[#05050a] text-slate-500'
          }`}
        >
          <p>LoginKeep &bull; AES-256-GCM Encrypted &bull; Personal Password Vault</p>
        </footer>
      )}
    </div>
  );
}
