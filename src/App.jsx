import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Shield, Search, Plus, Eye, EyeOff, Copy, Check, 
  Trash2, ExternalLink, RefreshCw, Lock, Sparkles, LogIn, 
  LogOut, Globe, User, CheckCircle2, AlertCircle, Laptop,
  Image, Edit3
} from 'lucide-react';

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
  const clean = website.toLowerCase().trim().replace(/\s+/g, '');
  if (clean.includes('.')) {
    return clean;
  }
  // Common mappings or generic domain
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

// Sample mock data for preview
const INITIAL_VAULT = [
  {
    id: '1',
    website: 'Netflix',
    url: 'https://netflix.com',
    customIcon: '',
    username: 'user@example.com',
    password: 'password123!Secure',
    category: 'Entertainment',
    updatedAt: '2 days ago'
  },
  {
    id: '2',
    website: 'GitHub',
    url: 'https://github.com',
    customIcon: '',
    username: 'dev_explorer',
    password: 'ghp_superSecretToken99',
    category: 'Development',
    updatedAt: 'Yesterday'
  },
  {
    id: '3',
    website: 'Amazon Prime',
    url: 'https://amazon.com',
    customIcon: '',
    username: 'shopper@gmail.com',
    password: 'AmzPassword2026!',
    category: 'Shopping',
    updatedAt: '3 hours ago'
  }
];

export default function App() {
  // Authentication simulation state (for frontend showcase)
  const [currentUser, setCurrentUser] = useState({
    name: 'Alex Johnson',
    email: 'guest.demo@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
  });

  const [vaultItems, setVaultItems] = useState(() => {
    const saved = localStorage.getItem('locker_vault_items');
    return saved ? JSON.parse(saved) : INITIAL_VAULT;
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Show / Hide password states for vault items
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [iconErrors, setIconErrors] = useState({});

  // Modal / Form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newWebsite, setNewWebsite] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCustomIcon, setNewCustomIcon] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [iconMode, setIconMode] = useState('auto'); // 'auto' or 'custom'
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem('locker_vault_items', JSON.stringify(vaultItems));
  }, [vaultItems]);

  const triggerToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGoogleLogin = (mockEmail = 'alex.developer@gmail.com') => {
    setCurrentUser({
      name: 'Alex Johnson',
      email: mockEmail,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    });
    triggerToast(`Signed in securely as ${mockEmail}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    triggerToast('Logged out securely');
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text, id, label = 'Password') => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${label}`);
    triggerToast(`${label} copied to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const generateStrongPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    triggerToast('Strong 16-character password generated!');
  };

  const openCreateModal = () => {
    setEditingItemId(null);
    setNewWebsite('');
    setNewUrl('');
    setNewCustomIcon('');
    setNewUsername(currentUser?.email || '');
    setNewPassword('');
    setIconMode('auto');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItemId(item.id);
    setNewWebsite(item.website);
    setNewUrl(item.url || '');
    setNewCustomIcon(item.customIcon || '');
    setNewUsername(item.username);
    setNewPassword(item.password);
    setIconMode(item.customIcon ? 'custom' : 'auto');
    setIsAddModalOpen(true);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!newWebsite.trim() || !newPassword.trim()) {
      triggerToast('Please provide a website name and password.', 'error');
      return;
    }

    const domain = getDomainFromWebsite(newWebsite, newUrl);
    const finalUrl = newUrl.trim() 
      ? (newUrl.startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`)
      : `https://${domain}`;

    if (editingItemId) {
      // Update existing item
      setVaultItems(vaultItems.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            website: newWebsite.trim(),
            url: finalUrl,
            customIcon: iconMode === 'custom' ? newCustomIcon.trim() : '',
            username: newUsername.trim() || currentUser?.email || 'N/A',
            password: newPassword,
            updatedAt: 'Just now'
          };
        }
        return item;
      }));
      triggerToast(`Updated ${newWebsite.trim()}`);
    } else {
      // Create new item
      const newItem = {
        id: Date.now().toString(),
        website: newWebsite.trim(),
        url: finalUrl,
        customIcon: iconMode === 'custom' ? newCustomIcon.trim() : '',
        username: newUsername.trim() || currentUser?.email || 'N/A',
        password: newPassword,
        category: 'General',
        updatedAt: 'Just now'
      };
      setVaultItems([newItem, ...vaultItems]);
      triggerToast(`Credentials for ${newItem.website} saved!`);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (id, name) => {
    setVaultItems(vaultItems.filter(item => item.id !== id));
    triggerToast(`Deleted ${name} entry`);
  };

  const filteredItems = vaultItems.filter(item => 
    item.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Computed preview icon for modal
  const previewDomain = getDomainFromWebsite(newWebsite || 'google', newUrl);
  const previewFaviconUrl = iconMode === 'custom' && newCustomIcon.trim() 
    ? newCustomIcon.trim() 
    : `https://www.google.com/s2/favicons?domain=${previewDomain}&sz=128`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          notification.type === 'error' 
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' 
            : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  KeyLocker
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Isolated Vault
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded-full py-1.5 pl-2 pr-3">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-7 h-7 rounded-full ring-2 ring-indigo-500/50 object-cover"
                />
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-medium text-slate-200 leading-tight">{currentUser.name}</p>
                  <p className="text-slate-400 text-[11px] leading-tight truncate max-w-[140px]">{currentUser.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1 hover:bg-slate-700/70 rounded-full text-slate-400 hover:text-rose-400 transition ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => handleGoogleLogin()}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-medium text-sm transition-all shadow-md hover:shadow-indigo-500/10 active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {!currentUser ? (
          /* Unauthenticated Landing */
          <div className="max-w-2xl mx-auto text-center py-16 px-4">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Your Personal, Zero-Stress <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Password Safe
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed">
              Never reset a forgotten password again. Sign in with your Google account—only you have access to your personal vault, encrypted with modern standards.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => handleGoogleLogin('alex.developer@gmail.com')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In with Google</span>
              </button>

              <button 
                onClick={() => handleGoogleLogin('guest.demo@gmail.com')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition border border-slate-700"
              >
                Try Live Preview
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Vault Dashboard */
          <div>
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Your Password Locker</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authenticated as <span className="text-indigo-400 font-medium">{currentUser.email}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={openCreateModal}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Password</span>
                </button>
              </div>
            </div>

            {/* Search and Stats Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search websites, apps, or usernames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 border border-slate-800 px-4 py-2.5 rounded-xl whitespace-nowrap">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>{filteredItems.length} total encrypted items</span>
              </div>
            </div>

            {/* Vault List / Cards */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <div className="inline-flex p-3 rounded-2xl bg-slate-800 text-slate-400 mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-slate-200 font-semibold mb-1">No passwords found</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4">
                  {searchQuery ? `No credentials match "${searchQuery}"` : "You haven't saved any passwords to this locker yet."}
                </p>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-medium border border-indigo-500/30 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add your first password</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const isPassVisible = visiblePasswords[item.id];
                  const isCopiedUser = copiedId === `${item.id}-Username`;
                  const isCopiedPass = copiedId === `${item.id}-Password`;
                  const favicon = getFaviconUrl(item);
                  const hasIconError = iconErrors[item.id];

                  return (
                    <div 
                      key={item.id}
                      className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-black/40"
                    >
                      <div>
                        {/* Card Header: Favicon & Website */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shadow-md overflow-hidden relative group-hover:border-slate-500 transition shrink-0">
                              {!hasIconError ? (
                                <img 
                                  src={favicon} 
                                  alt={item.website}
                                  className="w-full h-full object-cover"
                                  onError={() => setIconErrors(prev => ({ ...prev, [item.id]: true }))}
                                />
                              ) : (
                                <span className="font-bold text-slate-300 text-base">
                                  {item.website.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-200 text-sm group-hover:text-white transition flex items-center gap-1.5">
                                {item.website}
                                {item.url && (
                                  <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    title="Open website"
                                    className="text-slate-500 hover:text-indigo-400 transition"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </h3>
                              <span className="text-[11px] text-slate-500">Updated {item.updatedAt}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit item & icon"
                              className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.website)}
                              title="Delete"
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Username row */}
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 mb-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-300 truncate font-mono">{item.username}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(item.username, item.id, 'Username')}
                            title="Copy username"
                            className="p-1 text-slate-400 hover:text-indigo-400 rounded transition shrink-0 cursor-pointer"
                          >
                            {isCopiedUser ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Password row */}
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 overflow-hidden mr-2 font-mono">
                            <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-200 truncate">
                              {isPassVisible ? item.password : '••••••••••••'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => togglePasswordVisibility(item.id)}
                              title={isPassVisible ? "Hide password" : "Show password"}
                              className="p-1 text-slate-400 hover:text-indigo-400 rounded transition cursor-pointer"
                            >
                              {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.password, item.id, 'Password')}
                              title="Copy password"
                              className="p-1 text-slate-400 hover:text-indigo-400 rounded transition cursor-pointer"
                            >
                              {isCopiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
        )}
      </main>

      {/* Modal: Add or Edit Password */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingItemId ? 'Edit Credentials & Icon' : 'Save New Password'}
                </h2>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              {/* Website Name & Live Icon Preview */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Website or Service Name <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
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
                      placeholder="e.g. Netflix, Spotify, GitHub, Amazon"
                      value={newWebsite}
                      onChange={(e) => setNewWebsite(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Mode Tabs */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-indigo-400" />
                    Website Icon / Favicon
                  </span>
                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setIconMode('auto')}
                      className={`px-2.5 py-1 rounded-md transition ${iconMode === 'auto' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Auto Favicon
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconMode('custom')}
                      className={`px-2.5 py-1 rounded-md transition ${iconMode === 'custom' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Custom Icon URL
                    </button>
                  </div>
                </div>

                {iconMode === 'auto' ? (
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Automatically fetches the official high-resolution favicon using Google's Favicon service based on the website name.
                  </p>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="Paste image/icon URL (e.g. https://example.com/logo.png)"
                      value={newCustomIcon}
                      onChange={(e) => setNewCustomIcon(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Enter any direct link to an SVG, PNG, or ICO image.
                    </p>
                  </div>
                )}
              </div>

              {/* Website URL (Optional for direct link) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Direct Website URL <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. https://netflix.com/login"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. user@gmail.com or dev_explorer"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  {editingItemId ? 'Update Entry' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>KeyLocker &bull; Protected with per-user vault isolation &bull; Personal use</p>
      </footer>
    </div>
  );
}
