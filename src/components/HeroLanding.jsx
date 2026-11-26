import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight, LogIn, ShieldCheck, ChevronDown } from 'lucide-react';
import VaultVisual from './VaultVisual';
import { CinematicFooter } from './ui/motion-footer';

/**
 * Cinematic Landing Page with Hero and Curtain Reveal Motion Footer.
 * Left: Minimalist copy & CTAs. Right: Crisp, large-scale modern digital vault.
 * Bottom: Scroll curtain reveal cinematic footer.
 */
export default function HeroLanding({ onGetStarted, onSignIn }) {
  const heroRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !heroRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 24,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-full bg-[#05050a] min-h-screen overflow-x-hidden flex flex-col cinematic-footer-wrapper">
      {/* 
        MAIN CONTENT / HERO SECTION
        Styled in harmony with the Cinematic Footer:
        - Animated breathing aurora radial glow
        - 60px theme-adaptive linear grid with vertical fade mask
        - Glass pill badges and metallic gradient typography
      */}
      <section
        ref={heroRef}
        className="relative z-10 min-h-screen flex flex-col justify-between bg-[#05050a] border-b border-purple-500/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        {/* Harmonized Aurora Light & 60px Grid Background matching the Footer */}
        <div className="footer-aurora absolute left-1/2 top-1/2 h-[75vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[100px] pointer-events-none z-0" />
        <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

        {/* Ambient top and corner violet accents */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-purple-700/20 blur-[130px]" />
          <div className="absolute top-1/4 -right-32 w-[520px] h-[520px] rounded-full bg-indigo-700/15 blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 py-12 lg:py-20 flex-1 flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center w-full">
            {/* Left Column: Editorial Copy & CTAs */}
            <div className="lg:col-span-6 text-left space-y-7">
              {/* Badge styled with footer-glass-pill */}
              <div className="hero-stagger inline-flex items-center gap-2.5 px-4 py-2 rounded-full footer-glass-pill cursor-default">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc] animate-pulse" />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-purple-300">
                  Personal Password Manager
                </span>
              </div>

              {/* Headline with metallic glow */}
              <h1 className="hero-stagger text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08] footer-text-glow">
                Your Digital Life.{' '}
                <span className="block mt-1 bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  One Secure Place.
                </span>
              </h1>

              {/* Description */}
              <p className="hero-stagger text-base sm:text-lg text-slate-300/80 max-w-xl leading-relaxed">
                Save, organize and access your passwords without unnecessary complexity.
              </p>

              {/* CTAs */}
              <div className="hero-stagger flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="footer-glass-pill group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-white font-bold text-sm transition-all duration-300 bg-gradient-to-r from-purple-600/40 via-violet-600/35 to-indigo-600/30 hover:border-purple-400/80 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 text-purple-300" />
                </button>

                <button
                  type="button"
                  onClick={onSignIn}
                  className="footer-glass-pill inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-slate-200 font-semibold text-sm transition-all duration-300 hover:text-white hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-purple-400" />
                  <span>Sign In</span>
                </button>
              </div>

              {/* Supporting Tags styled with glass pills */}
              <div className="hero-stagger flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span className="tracking-wide">Simple. Private. Accessible.</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] font-mono text-[11px] text-slate-400">
                  <span>🔒 AES-256-GCM</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Impact Digital Vault Visual */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="w-full max-w-[640px]">
                <VaultVisual />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator Prompt */}
        <div className="relative z-10 pb-8 flex flex-col items-center justify-center text-slate-400 hover:text-purple-300 transition-colors pointer-events-none">
          <span className="text-[11px] font-mono tracking-widest uppercase mb-1.5 opacity-70">
            Scroll down to explore
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-purple-400" />
        </div>
      </section>

      {/* Cinematic Curtain-Reveal Footer */}
      <CinematicFooter onGetStarted={onGetStarted} onSignIn={onSignIn} />
    </div>
  );
}


