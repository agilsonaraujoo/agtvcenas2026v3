import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { currentPath, sectionHref } from '../utils/routes';
import { FiMenu, FiX, FiHome, FiTv, FiDollarSign, FiTrendingUp, FiStar, FiHelpCircle, FiZap, FiPlayCircle, FiMessageSquare, FiAward } from 'react-icons/fi';

export const TRIAL_URL = 'https://pagme.xyz/trial/eeebb22786aeac95e12e1b7bd37012a3d07f69721315fc2d';

const MENU = [
  { href: '#home', text: 'Início', Icon: FiHome, desktop: false },
  { href: '#servicos', text: 'Como funciona', Icon: FiPlayCircle },
  { href: '/programacao', text: 'Programação', Icon: FiTv, live: true },
  { href: '/jogos', text: 'Jogos', Icon: FiAward },
  { href: '#trending', text: 'Em alta', Icon: FiTrendingUp },
  { href: '#recomendacoes', text: 'Recomendações', Icon: FiZap },
  { href: '#planos', text: 'Planos', Icon: FiDollarSign },
  { href: '#depoimentos', text: 'Depoimentos', Icon: FiMessageSquare },
  { href: '#faq', text: 'FAQ', Icon: FiHelpCircle },
];

const QUICK = [
  { label: 'Início', href: '#home', Icon: FiHome },
  { label: 'Programação', href: '/programacao', Icon: FiTv, live: true },
  { label: 'Jogos', href: '/jogos', Icon: FiAward },
  { label: 'Em alta', href: '#trending', Icon: FiTrendingUp },
  { label: 'Planos', href: '#planos', Icon: FiDollarSign },
];

const urlOf = (href) => (href.startsWith('#') ? sectionHref(href) : href);

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
  const [activeId, setActiveId] = useState(currentPath() || '#home');
  const [railOpen, setRailOpen] = useState(false);   // barra lateral do computador aberta (mouse em cima)
  const [progress, setProgress] = useState(0);       // page reading progress, 0..1
  const navRef = useRef(null);

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

        // Só a página inicial tem seções; nas outras, o item aceso é a própria página.
        if (currentPath()) return;
        const center = window.innerHeight / 2;
        let current = '#home';
        for (const { href } of MENU) {
          if (!href.startsWith('#')) continue;
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

  const go = useCallback((href) => { setActiveId(href); setIsOpen(false); }, []);

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
      {/* ------------------------------------------------ Desktop: barra lateral de vidro, à esquerda */}
      {/* fechada mostra só os ícones; com o mouse em cima ela se abre e mostra os nomes */}
      <motion.header
        initial={reduce ? false : { x: -110, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.2 }}
        className="pointer-events-none fixed inset-y-0 left-0 z-50 hidden items-center pl-4 md:flex"
      >
        <motion.nav
          ref={navRef}
          onMouseMove={onMove}
          onMouseEnter={() => setRailOpen(true)}
          onMouseLeave={() => setRailOpen(false)}
          onFocus={() => setRailOpen(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setRailOpen(false); }}
          aria-label="Navegação principal"
          animate={{ width: railOpen ? 264 : 80 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }}
          className="group/nav pointer-events-auto relative flex max-h-[calc(100vh-2rem)] flex-col gap-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0c12]/80 p-2 shadow-[12px_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          {/* luz que segue o mouse */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100"
            style={{ background: 'radial-gradient(200px circle at var(--mx, 50%) var(--my, 50%), rgba(183,255,74,0.12), transparent 70%)' }}
          />
          {/* progresso da leitura descendo pela borda direita */}
          <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 w-[2px] bg-gradient-to-b from-[#b7ff4a] to-[#9a7bff]" style={{ height: `${progress * 100}%` }} />

          <a href={urlOf('#home')} onClick={() => go('#home')} className="relative mb-1 flex h-14 shrink-0 items-center overflow-hidden px-1.5" aria-label="AGTV - Início">
            <motion.img
              src="/marca/agtv-icone.svg"
              alt=""
              animate={{ opacity: railOpen ? 0 : 1, scale: railOpen ? 0.6 : 1 }}
              className="absolute left-[9px] block h-11 w-11"
            />
            <motion.img
              src="/marca/agtv-horizontal-slogan.svg"
              alt="AGTV: entretenimento sem limites"
              animate={{ opacity: railOpen ? 1 : 0, x: railOpen ? 0 : -16 }}
              className="block h-11 w-auto max-w-none"
            />
          </a>

          <ul className="relative flex min-h-0 flex-col gap-1">
            {MENU.filter((m) => m.desktop !== false).map(({ href, text, Icon, live }, i) => {
              const active = activeId === href;
              return (
                <li key={href} className="relative">
                  <a
                    href={urlOf(href)}
                    onClick={() => go(href)}
                    title={railOpen ? undefined : text}
                    aria-label={text}
                    aria-current={active ? 'location' : undefined}
                    className={`group relative flex h-12 items-center gap-3.5 whitespace-nowrap rounded-2xl px-5 text-[15px] font-semibold transition-colors ${active ? 'text-[#10130a]' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={reduce ? { duration: 0 } : pill}
                        className="absolute inset-0 -z-0 rounded-2xl bg-gradient-to-r from-[#b7ff4a] to-[#d4ff96] shadow-[0_0_22px_rgba(183,255,74,0.35)]"
                      />
                    )}
                    <span className="relative inline-flex shrink-0">
                      <Icon aria-hidden="true" className="h-[1.35rem] w-[1.35rem] transition-transform duration-300 group-hover:scale-110" />
                      {live && <span className="absolute -right-1.5 -top-1 flex"><LiveDot /></span>}
                    </span>
                    <motion.span
                      className="relative"
                      animate={{ opacity: railOpen ? 1 : 0, x: railOpen ? 0 : -10 }}
                      transition={{ duration: 0.2, delay: railOpen && !reduce ? 0.04 + i * 0.025 : 0 }}
                    >
                      {text}
                    </motion.span>
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
            aria-label="Teste grátis"
            className="relative mt-2 flex h-14 shrink-0 items-center gap-3.5 overflow-hidden whitespace-nowrap rounded-2xl bg-[#b7ff4a] px-5 text-[15px] font-extrabold text-[#10130a] shadow-[0_0_22px_rgba(183,255,74,0.25)] transition hover:bg-[#ceff83]"
          >
            {!reduce && <span aria-hidden="true" className="agtv-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/50" />}
            <FiStar aria-hidden="true" className="relative h-[1.35rem] w-[1.35rem] shrink-0" />
            <motion.span className="relative" animate={{ opacity: railOpen ? 1 : 0 }}>Teste grátis</motion.span>
          </a>
        </motion.nav>
      </motion.header>

      {/* ------------------------------------------------ Mobile: top bar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#090a0e]/90 text-white shadow-lg backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <a href={urlOf('#home')} aria-label="AGTV - Início" onClick={() => go('#home')} className="flex min-w-0 items-center gap-2.5">
            <img src="/marca/agtv-horizontal-slogan.svg" alt="AGTV: entretenimento sem limites" className="block h-10 w-auto shrink-0" />
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
                    href={urlOf(href)}
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
        className="mobile-quick-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#090a0e]/95 text-white shadow-[0_-12px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden"
      >
        {QUICK.map(({ label, href, Icon, live }) => {
          const active = activeId === href;
          return (
            <a
              key={href}
              href={urlOf(href)}
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
