import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiMenu, FiX, FiHome, FiTv, FiDollarSign, FiTrendingUp, FiStar, FiHelpCircle, FiZap, FiPlayCircle, FiMessageSquare } from 'react-icons/fi';

const TRIAL_URL = 'https://pagme.xyz/trial/eeebb22786aeac95e12e1b7bd37012a3d07f69721315fc2d';

const MENU = [
  { href: '#home', text: 'Início', Icon: FiHome, desktop: false },
  { href: '#servicos', text: 'Como funciona', Icon: FiPlayCircle },
  { href: '#programacao', text: 'Programação', Icon: FiTv, live: true },
  { href: '#trending', text: 'Em alta', Icon: FiTrendingUp },
  { href: '#recomendacoes', text: 'Recomendações', Icon: FiZap },
  { href: '#planos', text: 'Planos', Icon: FiDollarSign },
  { href: '#depoimentos', text: 'Depoimentos', Icon: FiMessageSquare },
  { href: '#faq', text: 'FAQ', Icon: FiHelpCircle },
];

const QUICK = [
  { label: 'Início', href: '#home', Icon: FiHome },
  { label: 'Programação', href: '#programacao', Icon: FiTv, live: true },
  { label: 'Em alta', href: '#trending', Icon: FiTrendingUp },
  { label: 'Planos', href: '#planos', Icon: FiDollarSign },
];

// Pulsing red dot that marks the live schedule.
const LiveDot = ({ className = '' }) => (
  <span aria-hidden="true" className={`relative inline-flex h-2 w-2 ${className}`}>
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff4d4d] opacity-70" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff4d4d]" />
  </span>
);

const Header = () => {
  const reduce = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState('#home');
  const [compact, setCompact] = useState(false);     // shrinks once the page is scrolled
  const [hidden, setHidden] = useState(false);       // hides while scrolling down, returns on the way up
  const [progress, setProgress] = useState(0);       // page reading progress, 0..1
  const navRef = useRef(null);
  const lastYRef = useRef(0);

  // Which section sits in the middle of the screen, plus compact/hidden/progress state.
  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        setProgress(Math.min(1, y / max));
        setCompact(y > 60);
        const goingDown = y > lastYRef.current + 4, goingUp = y < lastYRef.current - 4;
        if (goingDown && y > 400) setHidden(true);
        if (goingUp || y < 200) setHidden(false);
        lastYRef.current = y;

        const center = window.innerHeight / 2;
        let current = '#home';
        for (const { href } of MENU) {
          const el = document.querySelector(href);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.top <= center) current = href;
        }
        setActiveId(current);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const go = useCallback((href) => { setActiveId(href); setIsOpen(false); setHidden(false); }, []);

  // Spotlight that follows the mouse across the desktop bar.
  const onMove = (event) => {
    const nav = navRef.current;
    if (!nav || reduce) return;
    const r = nav.getBoundingClientRect();
    nav.style.setProperty('--mx', `${event.clientX - r.left}px`);
    nav.style.setProperty('--my', `${event.clientY - r.top}px`);
  };

  const pill = { type: 'spring', stiffness: 420, damping: 34 };

  return (
    <>
      {/* ------------------------------------------------ Desktop: floating glass pill */}
      <motion.header
        initial={false}
        animate={{ y: hidden && !reduce ? -120 : 0 }}
        transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 hidden px-4 md:block"
        style={{ paddingTop: compact ? 8 : 14 }}
      >
        <nav
          ref={navRef}
          onMouseMove={onMove}
          aria-label="Navegação principal"
          className={`group/nav relative mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-hidden rounded-full border border-white/10 bg-[#0b0c12]/75 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ${compact ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}
        >
          {/* mouse spotlight */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100"
            style={{ background: 'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(183,255,74,0.12), transparent 70%)' }}
          />
          {/* reading progress along the bottom edge */}
          <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#b7ff4a] to-[#9a7bff]" style={{ width: `${progress * 100}%` }} />

          <a href="#home" onClick={() => go('#home')} className="relative flex shrink-0 items-center gap-3" aria-label="AGTV - Início">
            <motion.span
              whileHover={reduce ? undefined : { rotate: -6, scale: 1.06 }}
              className={`relative block overflow-hidden rounded-xl ring-1 ring-white/20 shadow-[0_0_24px_rgba(154,123,255,0.3)] transition-all duration-300 ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
            >
              <img src="/agtv-neon-logo.jpg" alt="Logo AGTV" className="h-full w-full object-cover" />
            </motion.span>
            <span className="brand-copy hidden flex-col xl:flex">
              <strong>AGTV</strong>
              <small>ENTRETENIMENTO</small>
            </span>
          </a>

          <ul className="relative flex items-center gap-0.5 lg:gap-1">
            {MENU.filter((m) => m.desktop !== false).map(({ href, text, Icon, live }) => {
              const active = activeId === href;
              return (
                <li key={href} className="relative">
                  <a
                    href={href}
                    onClick={() => go(href)}
                    title={text}
                    aria-current={active ? 'location' : undefined}
                    className={`group relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors lg:px-3.5 ${active ? 'text-[#10130a]' : 'text-gray-300 hover:text-white'}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={reduce ? { duration: 0 } : pill}
                        className="absolute inset-0 -z-0 rounded-full bg-gradient-to-r from-[#b7ff4a] to-[#d4ff96] shadow-[0_0_22px_rgba(183,255,74,0.35)]"
                      />
                    )}
                    <Icon aria-hidden="true" className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                    <span className="relative hidden lg:inline">{text}</span>
                    {live && <LiveDot className="relative -ml-0.5" />}
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href={TRIAL_URL}
            target="_blank"
            rel="noreferrer"
            data-analytics="cta_trial_desktop"
            className="relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-[#b7ff4a] px-4 py-2 text-sm font-extrabold text-[#10130a] shadow-[0_0_22px_rgba(183,255,74,0.25)] transition hover:scale-[1.04] hover:bg-[#ceff83]"
          >
            {!reduce && <span aria-hidden="true" className="agtv-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/50" />}
            <FiStar aria-hidden="true" className="relative" />
            <span className="relative">Teste grátis</span>
          </a>
        </nav>
      </motion.header>

      {/* ------------------------------------------------ Mobile: top bar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#090a0e]/90 text-white shadow-lg backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <a href="#home" aria-label="AGTV - Início" onClick={() => go('#home')} className="flex min-w-0 items-center gap-2.5">
            <img src="/agtv-neon-logo.jpg" alt="" className="h-10 w-10 shrink-0 rounded-xl border border-white/15 object-cover shadow-[0_0_18px_rgba(154,123,255,0.2)]" />
            <span className="brand-copy flex min-w-0 flex-col">
              <strong>AGTV</strong>
              <small>ENTRETENIMENTO</small>
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={TRIAL_URL}
              target="_blank"
              rel="noreferrer"
              data-analytics="cta_trial_mobile"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#b7ff4a] px-3.5 text-xs font-extrabold text-[#10130a] shadow-[0_0_18px_rgba(183,255,74,0.14)] transition hover:bg-[#ceff83] sm:px-4 sm:text-sm"
            >
              Teste grátis
            </a>
            <button
              type="button"
              aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-[#9a7bff]/50 hover:bg-[#9a7bff]/10 focus-visible:outline-none"
            >
              <motion.span key={isOpen ? 'x' : 'menu'} initial={reduce ? false : { rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} className="inline-flex">
                {isOpen ? <FiX aria-hidden="true" size={20} /> : <FiMenu aria-hidden="true" size={20} />}
              </motion.span>
            </button>
          </div>
        </div>
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#b7ff4a] to-[#9a7bff]" style={{ width: `${progress * 100}%` }} />
        <AnimatePresence>
          {isOpen && (
            <motion.nav
              id="mobile-navigation"
              aria-label="Navegação principal"
              initial={reduce ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-full flex max-h-[calc(100svh-4rem)] flex-col gap-1 overflow-y-auto border-t border-white/10 bg-[#0b0c11]/[0.98] p-3 shadow-2xl backdrop-blur-xl"
            >
              {MENU.map(({ href, text, Icon, live }, i) => {
                const active = activeId === href;
                return (
                  <motion.a
                    key={href}
                    href={href}
                    onClick={() => go(href)}
                    aria-current={active ? 'location' : undefined}
                    initial={reduce ? false : { opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduce ? 0 : i * 0.03 }}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active ? 'border-[#b7ff4a]/40 bg-[#b7ff4a] text-[#10130a]' : 'border-white/[0.06] bg-white/[0.025] text-gray-200 hover:border-[#9a7bff]/35 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    <span>{text}</span>
                    {live && <span className={`ml-auto inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider ${active ? 'text-[#a3001b]' : 'text-[#ff8080]'}`}><LiveDot /> AO VIVO</span>}
                  </motion.a>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* ------------------------------------------------ Mobile: bottom quick bar with a sliding highlight */}
      <nav
        aria-label="Atalhos principais"
        className="mobile-quick-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-[#090a0e]/95 text-white shadow-[0_-12px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden"
      >
        {QUICK.map(({ label, href, Icon, live }) => {
          const active = activeId === href;
          return (
            <a
              key={href}
              href={href}
              onClick={() => go(href)}
              aria-current={active ? 'location' : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-bold transition ${active ? 'text-[#b7ff4a]' : 'text-gray-300 hover:text-white'}`}
            >
              {active && (
                <motion.span
                  layoutId="quick-active"
                  transition={reduce ? { duration: 0 } : pill}
                  className="absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-[#b7ff4a] to-[#9a7bff] shadow-[0_0_12px_rgba(183,255,74,0.6)]"
                />
              )}
              <span className="relative inline-flex">
                <Icon aria-hidden="true" className={`block h-5 w-5 transition-transform ${active ? '-translate-y-0.5 scale-110' : ''}`} />
                {live && <span className="absolute -right-1.5 -top-1 flex"><LiveDot /></span>}
              </span>
              <span>{label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
};

export default Header;
