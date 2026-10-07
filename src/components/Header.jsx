import React, { useState, useEffect, useRef } from 'react';
import { FiMenu, FiX, FiHome, FiTv, FiDollarSign, FiTrendingUp, FiStar, FiHelpCircle } from 'react-icons/fi';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showInicio, setShowInicio] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setShowInicio(true);
      } else {
        setShowInicio(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { id: 1, text: 'Início', icon: <FiHome className="h-5 w-5" />, href: '#home' },
    { id: 2, text: 'Serviços', icon: <FiTv className="h-5 w-5" />, href: '#servicos' },
    { id: 8, text: 'Programação', icon: <FiTv className="h-5 w-5" />, href: '#programacao' },
    { id: 3, text: 'Em Alta 🔥', icon: <FiTrendingUp className="h-5 w-5" />, href: '#trending' },
    { id: 4, text: 'Recomendações ✨', icon: <FiStar className="h-5 w-5" />, href: '#recomendacoes' },
    { id: 5, text: 'Planos', icon: <FiDollarSign className="h-5 w-5" />, href: '#planos' },
    { id: 6, text: 'Depoimentos', icon: <FiStar className="h-5 w-5" />, href: '#depoimentos' },
    { id: 7, text: 'FAQ', icon: <FiHelpCircle className="h-5 w-5" />, href: '#faq' },
  ];
  const [activeId, setActiveId] = useState('#home');
  const observerRef = useRef(null);
  const activeIdRef = useRef('#home');
  const showInicioRef = useRef(false);
  const desktopNavRef = useRef(null);
  const desktopIndicatorRef = useRef(null);
  const updateIndicatorRef = useRef(null);
  const sectionObjsRef = useRef([]);

  const findAnchorInNav = (nav, href) => {
    if (!nav) return null;
    const direct = nav.querySelector(`a[href="${href}"]`);
    if (direct) return direct;
    // If not found, find nearest existing anchor by searching menuItems order
    const idx = menuItems.findIndex(m => m.href === href);
    if (idx === -1) return null;
    // search forward and backward
    for (let offset = 1; offset < menuItems.length; offset++) {
      const f = menuItems[idx + offset];
      if (f) {
        const fa = nav.querySelector(`a[href="${f.href}"]`);
        if (fa) return fa;
      }
      const b = menuItems[idx - offset];
      if (b) {
        const ba = nav.querySelector(`a[href="${b.href}"]`);
        if (ba) return ba;
      }
    }
    return null;
  };

  useEffect(() => {
    const sectionObjs = menuItems
      .map(m => {
        const el = document.querySelector(m.href);
        return el ? { id: m.href, el, top: el.getBoundingClientRect().top + window.scrollY } : null;
      })
      .filter(Boolean);
    sectionObjsRef.current = sectionObjs;
    if (!sectionObjs.length) return;

    // We will drive activeId based on viewport center visibility inside onScroll

    // Smooth slider interpolation based on scroll position
    let raf = null;
  const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const viewportCenter = window.scrollY + window.innerHeight / 2;
        const viewportH = window.innerHeight;
        const sectionsNow = sectionObjsRef.current || [];

        // Determine the section containing the viewport center
        let centered = null;
        for (let i = 0; i < sectionsNow.length; i++) {
          const r = sectionsNow[i].el.getBoundingClientRect();
          const c = viewportH / 2;
          if (r.top <= c && r.bottom >= c) { centered = sectionsNow[i]; break; }
        }

        // Fallback: nearest by distance to center if none matches
        if (!centered && sectionsNow.length) {
          let best = sectionsNow[0];
          let bestDist = Infinity;
          const c = viewportH / 2;
          sectionsNow.forEach(s => {
            const r = s.el.getBoundingClientRect();
            const dist = Math.min(Math.abs(r.top - c), Math.abs(r.bottom - c));
            if (dist < bestDist) { bestDist = dist; best = s; }
          });
          centered = best;
        }

        if (centered) {
          let nextActive = centered.id;
          // If the Home tab is hidden, do not set active to #home; choose the next visible (Serviços)
          if (!showInicioRef.current && nextActive === '#home') {
            const srv = sectionsNow.find(s => s.id === '#servicos');
            if (srv) nextActive = srv.id;
          }
          if (nextActive && nextActive !== activeIdRef.current) {
            activeIdRef.current = nextActive;
            setActiveId(nextActive);
          }
        }
        // find lower and upper sections around center using dynamic positions
        const dyn = (sectionsNow || []).map(s => ({
          id: s.id,
          el: s.el,
          absTop: window.scrollY + s.el.getBoundingClientRect().top
        }));
        let lower = null;
        let upper = null;
        for (let i = 0; i < dyn.length; i++) {
          const s = dyn[i];
          if (s.absTop <= viewportCenter) lower = s;
          if (s.absTop > viewportCenter) { upper = s; break; }
        }
        if (!lower) lower = dyn[0];
        if (!upper) upper = dyn[dyn.length - 1];

        // interpolation factor between lower and upper based on center position
        const span = Math.max(1, upper.absTop - lower.absTop);
        const t = Math.min(1, Math.max(0, (viewportCenter - lower.absTop) / span));

        // find corresponding nav anchors and prefer the active anchor for accuracy
        const nav = desktopNavRef.current;
        if (nav) {
          const indicator = desktopIndicatorRef.current;
          if (indicator) {
            const activeAnchor = findAnchorInNav(nav, activeIdRef.current);
            if (activeAnchor) {
              const ar = activeAnchor.getBoundingClientRect();
              const navRect = nav.getBoundingClientRect();
              indicator.style.width = `${ar.width}px`;
              indicator.style.left = `${ar.left - navRect.left}px`;
              indicator.style.opacity = '1';
            } else {
              const lowerAnchor = findAnchorInNav(nav, lower.id);
              const upperAnchor = findAnchorInNav(nav, upper.id);
              if (lowerAnchor && upperAnchor) {
                const la = lowerAnchor.getBoundingClientRect();
                const ua = upperAnchor.getBoundingClientRect();
                const navRect = nav.getBoundingClientRect();
                const left = (la.left - navRect.left) * (1 - t) + (ua.left - navRect.left) * t;
                const width = la.width * (1 - t) + ua.width * t;
                indicator.style.left = `${left}px`;
                indicator.style.width = `${width}px`;
                indicator.style.opacity = '1';
              }
            }
          }
        }

        raf = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // initial run
    onScroll();

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Keep refs in sync with current state for the scroll handler
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { showInicioRef.current = showInicio; }, [showInicio]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const handleNavClick = (href) => {
    setActiveId(href);
    setIsOpen(false);
  };

  // Update indicator position when activeId changes or on resize
  useEffect(() => {
    const updateDesktopIndicator = () => {
      const nav = desktopNavRef.current;
      if (!nav) return;
      const activeLink = nav.querySelector(`a[href="${activeId}"]`);
      const indicator = desktopIndicatorRef.current;
      if (activeLink && indicator) {
        const rect = activeLink.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - navRect.left}px`;
        indicator.style.opacity = '1';
      } else if (indicator) {
        indicator.style.opacity = '0';
      }
    };

    updateIndicatorRef.current = updateDesktopIndicator;

    updateDesktopIndicator();
    window.addEventListener('resize', updateDesktopIndicator);
    return () => {
      window.removeEventListener('resize', updateDesktopIndicator);
    };
  }, [activeId]);

  // When showInicio toggles (the Início button appears/disappears) we need to recalc indicator
  useEffect(() => {
    // small delay to allow DOM updates
    const t = setTimeout(() => {
      if (updateIndicatorRef.current) updateIndicatorRef.current();
      // also trigger a resize event to recompute positions
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => clearTimeout(t);
  }, [showInicio]);

  // Slow down indicator transitions when viewing the Planos section
  useEffect(() => {
    const desktopInd = desktopIndicatorRef.current;
    const isPlanos = activeId === '#planos';
    if (desktopInd) {
      if (isPlanos) desktopInd.classList.add('slow-indicator');
      else desktopInd.classList.remove('slow-indicator');
    }
  }, [activeId]);

  return (
    <>
      {/* Desktop Navbar (top) */}
      <header className="bg-gradient-to-r from-gray-900 to-black text-white fixed w-full z-50 shadow-lg border-b border-gray-800 hidden md:block">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <a href="#home" className="flex items-center gap-3" aria-label="AGTV - Início">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl ring-1 ring-white/20 shadow-[0_0_24px_rgba(154,123,255,0.24)]">
              <img
                src="/agtv-neon-logo.jpg"
                alt="Logo AGTV"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="brand-copy hidden flex-col sm:flex">
              <strong>AGTV</strong>
              <small>ENTRETENIMENTO</small>
            </span>
          </a>
          <div className="relative flex gap-2 lg:gap-6 xl:gap-8" ref={desktopNavRef}>
            <div ref={desktopIndicatorRef} className="nav-slide-indicator" aria-hidden="true" />
            {menuItems.map((item) => {
              if (item.id === 1 && !showInicio) return null;
              const isActive = activeId === item.href;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`px-3 py-2 rounded-lg text-base font-semibold transition flex items-center gap-2 group ${isActive ? 'nav-link-active' : 'text-gray-200 hover:text-white hover:bg-indigo-600'}`}
                  style={{ minWidth: '120px', justifyContent: 'center' }}
                >
                  {item.icon}
                  <span className="group-hover:translate-x-1 transition-transform duration-300">{item.text.replace(/(🔥|✨)/g, '')}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </header>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#090a0e]/90 text-white shadow-lg backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <a
            href="#home"
            aria-label="AGTV - Início"
            onClick={() => handleNavClick('#home')}
            className="flex min-w-0 items-center gap-2.5"
          >
            <img
              src="/agtv-neon-logo.jpg"
              alt=""
              className="h-10 w-10 shrink-0 rounded-xl border border-white/15 object-cover shadow-[0_0_18px_rgba(154,123,255,0.2)]"
            />
            <span className="brand-copy flex min-w-0 flex-col">
              <strong>AGTV</strong>
              <small>ENTRETENIMENTO</small>
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="https://pagme.xyz/trial/eeebb22786aeac95e12e1b7bd37012a3d07f69721315fc2d"
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
              {isOpen ? <FiX aria-hidden="true" size={20} /> : <FiMenu aria-hidden="true" size={20} />}
            </button>
          </div>
        </div>
        <nav
          id="mobile-navigation"
          aria-label="Navegação principal"
          className={`${isOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] flex-col gap-1 overflow-y-auto border-t border-white/10 bg-[#0b0c11]/[0.98] p-3 shadow-2xl backdrop-blur-xl`}
        >
          {menuItems.map((item) => {
            const isActive = activeId === item.href;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                aria-current={isActive ? 'location' : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                  isActive
                    ? 'nav-link-active-mobile border-[#b7ff4a]/25 text-white'
                    : 'border-white/[0.06] bg-white/[0.025] text-gray-200 hover:border-[#9a7bff]/35 hover:bg-white/[0.06]'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.text.replace(/(🔥|✨)/g, '')}</span>
              </a>
            );
          })}
        </nav>
      </header>
    </>
  );
};

export default Header;
