import React from 'react';
import { Lock } from 'lucide-react';
import PixelKeyIcon from './PixelKeyIcon';

/**
 * Premium Modern Vault Visual centerpiece.
 * Features multi-layered concentric metallic rings, glowing purple core with the
 * signature pixel-art key, atmospheric radial lighting, and encrypted credential badges.
 */
export default function VaultVisual({ compact = false }) {
  return (
    <div
      className={`relative flex items-center justify-center w-full select-none transition-all duration-300 ${
        compact
          ? 'h-[320px] lg:h-[440px]'
          : 'h-[440px] sm:h-[540px] lg:h-[620px]'
      }`}
      aria-label="Secure digital vault visualization"
    >
      {/* Deep atmospheric radial glow layers */}
      <div className="absolute w-80 h-80 sm:w-[480px] sm:h-[480px] lg:w-[560px] lg:h-[560px] rounded-full bg-purple-600/25 blur-[120px] pointer-events-none" />
      <div className="absolute w-60 h-60 sm:w-[340px] sm:h-[340px] rounded-full bg-indigo-500/20 blur-[90px] -translate-x-10 translate-y-8 pointer-events-none" />
      <div className="absolute w-40 h-40 rounded-full bg-violet-400/20 blur-[60px] pointer-events-none animate-pulse-glow" />

      {/* Main concentric metallic vault rings with smooth floating animation */}
      <div className="relative flex items-center justify-center animate-float-slow">
        {/* Outer ambient aura ring */}
        <div className="absolute -inset-4 rounded-full border border-purple-500/10 pointer-events-none" />

        {/* Outer ring */}
        <div
          className={`rounded-full border border-purple-500/30 bg-gradient-to-b from-[#111222] via-[#090a14] to-[#040409] shadow-[0_0_90px_rgba(139,92,246,0.3)] flex items-center justify-center backdrop-blur-2xl transition-all duration-300 ${
            compact
              ? 'w-64 h-64 sm:w-80 sm:h-80'
              : 'w-72 h-72 sm:w-96 sm:h-96 lg:w-[460px] lg:h-[460px]'
          }`}
        >
          {/* Middle rotating/textured metallic ring */}
          <div
            className={`rounded-full border border-indigo-400/25 bg-gradient-to-tr from-[#0a0a16] via-[#101226] to-[#18112e] flex items-center justify-center shadow-inner ${
              compact
                ? 'w-48 h-48 sm:w-60 sm:h-60'
                : 'w-52 h-52 sm:w-72 sm:h-72 lg:w-[340px] lg:h-[340px]'
            }`}
          >
            {/* Inner rim with subtle purple highlight */}
            <div
              className={`rounded-full border border-purple-400/35 bg-gradient-to-b from-purple-950/40 via-[#0d0e1c] to-[#05060d] flex items-center justify-center shadow-[inset_0_0_30px_rgba(139,92,246,0.25)] ${
                compact
                  ? 'w-32 h-32 sm:w-40 sm:h-40'
                  : 'w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56'
              }`}
            >
              {/* Glowing purple keyhole core */}
              <div
                className={`rounded-full bg-purple-600/25 border border-purple-400/50 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.55)] transition-transform hover:scale-105 duration-300 ${
                  compact
                    ? 'w-20 h-20 sm:w-24 sm:h-24'
                    : 'w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32'
                }`}
              >
                <PixelKeyIcon
                  className={`text-purple-200 drop-shadow-[0_0_16px_rgba(192,132,252,0.9)] ${
                    compact ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14'
                  }`}
                  fill="currentColor"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating glass credential badge - Top Right: Masked Password */}
        <div
          className={`absolute px-4 py-2.5 rounded-xl bg-[#0e1122]/85 border border-purple-500/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-2.5 transition-transform hover:scale-105 ${
            compact
              ? '-top-3 -right-4 sm:-right-8'
              : '-top-5 -right-4 sm:-right-10 lg:-right-12'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
          <div className="text-xs sm:text-sm font-mono text-slate-200 tracking-widest">
            ••••••••••••
          </div>
        </div>

        {/* Floating glass credential badge - Bottom Left: AES-256-GCM */}
        <div
          className={`absolute px-4 py-2 rounded-xl bg-[#0e1122]/85 border border-blue-500/35 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-2 transition-transform hover:scale-105 ${
            compact
              ? '-bottom-3 -left-4 sm:-left-8'
              : '-bottom-5 -left-4 sm:-left-10 lg:-left-12'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full border border-blue-400/80 bg-blue-500/20" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-200 uppercase tracking-wider">
            AES-256-GCM
          </span>
        </div>

        {/* Floating glass credential badge - Left: Encrypted Tag */}
        <div
          className={`absolute top-1/2 hidden sm:flex px-3.5 py-1.5 rounded-xl bg-[#0e1122]/85 border border-purple-500/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] items-center gap-2 -translate-y-1/2 transition-transform hover:scale-105 ${
            compact ? '-left-10' : '-left-14 lg:-left-16'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] sm:text-[11px] text-purple-300 font-semibold uppercase tracking-widest">
            Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
