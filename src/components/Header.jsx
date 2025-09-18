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
  { id: 1, text: 'Início', textMobile: 'Início', icon: <FiHome className="w-5 h-5" />, href: '#home', mobileHidden: true },
  { id: 2, text: 'Serviços', textMobile: 'Serviços', icon: <FiTv className="w-5 h-5" />, href: '#servicos' },
  { id: 3, text: 'Em Alta 🔥', textMobile: 'Alta', icon: <FiTrendingUp className="w-5 h-5" />, href: '#trending' },
  { id: 4, text: 'Recomendações ✨', textMobile: 'Recom.', icon: <FiStar className="w-5 h-5" />, href: '#recomendacoes' },
  { id: 5, text: 'Planos', textMobile: 'Planos', icon: <FiDollarSign className="w-5 h-5" />, href: '#planos' },
  { id: 6, text: 'Depoimentos', textMobile: 'Clientes', icon: <FiStar className="w-5 h-5" />, href: '#depoimentos' },
  { id: 7, text: 'FAQ', textMobile: 'FAQ', icon: <FiHelpCircle className="w-5 h-5" />, href: '#faq' }
  ];
  const [activeId, setActiveId] = useState('#home');
  const observerRef = useRef(null);
  const activeIdRef = useRef('#home');
  const showInicioRef = useRef(false);
  const desktopNavRef = useRef(null);
  const desktopIndicatorRef = useRef(null);
  const mobileIndicatorRef = useRef(null);
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

        // mobile - show indicator only after passing the first non-home section
  const mobileNav = document.querySelector('nav.fixed.bottom-0');
        const minfo = mobileIndicatorRef.current;
        if (mobileNav && minfo) {
          // find first non-home section top
          const sectionObjs = sectionObjsRef.current || [];
          const firstNonHome = sectionObjs.find(s => s.id !== '#home');
          const shouldShow = firstNonHome ? (viewportCenter >= (firstNonHome.top - window.innerHeight * 0.25)) : (activeId !== '#home');
          if (!shouldShow) {
            minfo.style.opacity = '0';
          } else {
              const activeA = findAnchorInNav(mobileNav, activeIdRef.current);
              if (activeA) {
                const ar = activeA.getBoundingClientRect();
                const navRect = mobileNav.getBoundingClientRect();
                minfo.style.width = `${ar.width}px`;
                minfo.style.left = `${ar.left - navRect.left}px`;
                minfo.style.opacity = '1';
              } else {
                const lowerA = findAnchorInNav(mobileNav, lower.id);
                const upperA = findAnchorInNav(mobileNav, upper.id);
                if (lowerA && upperA) {
                  const la = lowerA.getBoundingClientRect();
                  const ua = upperA.getBoundingClientRect();
                  const navRect = mobileNav.getBoundingClientRect();
                  const left = (la.left - navRect.left) * (1 - t) + (ua.left - navRect.left) * t;
                  const width = la.width * (1 - t) + ua.width * t;
                  minfo.style.left = `${left}px`;
                  minfo.style.width = `${width}px`;
                  minfo.style.opacity = '1';
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

    const updateMobileIndicator = () => {
      const mobileNav = document.querySelector('nav.fixed.bottom-0');
      const indicator = mobileIndicatorRef.current;
      if (!mobileNav || !indicator) return;
      const activeLink = mobileNav.querySelector(`a[href="${activeId}"]`);
      if (activeLink) {
        const rect = activeLink.getBoundingClientRect();
        const navRect = mobileNav.getBoundingClientRect();
        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - navRect.left}px`;
        indicator.style.opacity = '1';
      } else {
        indicator.style.opacity = '0';
      }
    };

    // expose for other effects
    updateIndicatorRef.current = () => {
      updateDesktopIndicator();
      updateMobileIndicator();
    };

    updateDesktopIndicator();
    updateMobileIndicator();
    window.addEventListener('resize', updateDesktopIndicator);
    window.addEventListener('resize', updateMobileIndicator);
    return () => {
      window.removeEventListener('resize', updateDesktopIndicator);
      window.removeEventListener('resize', updateMobileIndicator);
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
    const mobileInd = mobileIndicatorRef.current;
    const isPlanos = activeId === '#planos';
    if (desktopInd) {
      if (isPlanos) desktopInd.classList.add('slow-indicator');
      else desktopInd.classList.remove('slow-indicator');
    }
    if (mobileInd) {
      if (isPlanos) mobileInd.classList.add('slow-indicator');
      else mobileInd.classList.remove('slow-indicator');
    }
  }, [activeId]);

  return (
    <>
      {/* Desktop Navbar (top) */}
      <header className="bg-gradient-to-r from-gray-900 to-black text-white fixed w-full z-50 shadow-lg border-b border-gray-800 hidden md:block">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <a href="#home" className="flex items-center">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
              <img
                src="/AGTV.jpg"
                alt="Logo AGTV"
                className="relative w-14 h-14 rounded-full border-2 border-white shadow-lg hover:shadow-xl transition-shadow duration-300"
              />
            </div>
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

      {/* Mobile Navbar (bottom) */}
      <nav className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 to-black text-white z-50 shadow-t border-t border-gray-800 flex md:hidden justify-between items-center py-2 px-2">
        <div ref={mobileIndicatorRef} className="mobile-nav-slide-indicator" aria-hidden="true" />
        {/* Menu esquerdo */}
        <div className="flex flex-1 justify-evenly">
          {menuItems.filter(item => !item.mobileHidden && item.id < 5).map((item) => {
            const isActive = activeId === item.href;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`flex flex-col items-center justify-center px-1 py-1 text-xs font-medium transition rounded ${isActive ? 'nav-link-active-mobile' : 'text-gray-200 hover:text-white hover:bg-indigo-600'}`}
                style={{ minWidth: '40px' }}
              >
                {item.icon}
                <span className="mt-1">{item.textMobile}</span>
              </a>
            );
          })}
        </div>
        {/* Logo centralizada no menu inferior com brilho giratório (mobile) */}
        <a href="#home" className="flex flex-col items-center justify-center mx-2">
          <div className="relative w-10 h-10">
            {/* Anel de brilho giratório */}
            <span aria-hidden="true" className="pointer-events-none absolute -inset-1 flex items-center justify-center">
              <span className="relative block w-14 h-14 rounded-full">
                <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-purple-500 opacity-70 blur-[6px] spin-slow"></span>
                <span className="absolute inset-0 rounded-full ring-2 ring-white/20"></span>
              </span>
            </span>
            {/* Disco base */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
            <img
              src="/AGTV.jpg"
              alt="Logo AGTV"
              className="relative w-10 h-10 rounded-full border-2 border-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            />
          </div>
        </a>
        {/* Menu direito */}
        <div className="flex flex-1 justify-evenly">
          {menuItems.filter(item => !item.mobileHidden && item.id >= 5).map((item) => {
            const isActive = activeId === item.href;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`flex flex-col items-center justify-center px-1 py-1 text-xs font-medium transition rounded ${isActive ? 'nav-link-active-mobile' : 'text-gray-200 hover:text-white hover:bg-indigo-600'}`}
                style={{ minWidth: '40px' }}
              >
                {item.icon}
                <span className="mt-1">{item.textMobile}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;
