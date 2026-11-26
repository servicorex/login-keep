import React from 'react';
import { KeyRound, Shield, Lock } from 'lucide-react';

/**
 * Graceful fallback rendered when WebGL is unavailable, disabled, or still lazy-loading.
 * Matches the midnight-black & electric-purple vault aesthetic.
 */
export default function VaultFallback({ compact = false }) {
  return (
    <div
      className={`relative flex items-center justify-center w-full h-full select-none ${
        compact ? 'min-h-[220px]' : 'min-h-[380px] sm:min-h-[480px]'
      }`}
      aria-label="Secure digital vault visualization"
    >
      {/* Ambient radial glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-purple-600/20 blur-[90px] animate-pulse-glow pointer-events-none" />
      <div className="absolute w-48 h-48 rounded-full bg-blue-600/15 blur-[70px] -translate-x-12 translate-y-10 pointer-events-none" />

      {/* Stylized 2D metallic vault ring */}
      <div className="relative flex items-center justify-center animate-float-slow">
        <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-purple-500/30 bg-gradient-to-b from-slate-900/90 to-[#070711]/95 shadow-[0_0_80px_rgba(139,92,246,0.22)] flex items-center justify-center backdrop-blur-xl">
          {/* Inner rotating-style ring */}
          <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full border border-indigo-400/25 bg-gradient-to-tr from-[#0b0b18] via-slate-900 to-purple-950/40 flex items-center justify-center shadow-inner">
            {/* Glowing purple keyhole core */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-600/20 border border-purple-400/40 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.45)]">
              <KeyRound className="w-9 h-9 sm:w-11 sm:h-11 text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.85)]" />
            </div>
          </div>
        </div>

        {/* Floating glass credential badges */}
        {!compact && (
          <>
            <div className="absolute -top-4 -right-6 px-3.5 py-2 rounded-xl bg-slate-900/75 border border-purple-500/30 backdrop-blur-md shadow-xl flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <div className="text-[11px] font-mono text-slate-300 tracking-wider">••••••••••••</div>
            </div>

            <div className="absolute -bottom-3 -left-8 px-3.5 py-2 rounded-xl bg-slate-900/75 border border-blue-500/30 backdrop-blur-md shadow-xl flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-medium text-slate-300">AES-256-GCM</span>
            </div>

            <div className="absolute top-1/2 -left-12 -translate-y-1/2 hidden sm:flex px-3 py-1.5 rounded-lg bg-slate-900/70 border border-purple-500/25 backdrop-blur-md shadow-lg items-center gap-1.5">
              <Lock className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Encrypted</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

