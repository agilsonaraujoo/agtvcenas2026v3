import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import CookieBanner from './CookieBanner';
import ScrollReveal from './ScrollReveal';
import BackToTop from './BackToTop';
import ChatAssistant from './ChatAssistant';

// Moldura comum às páginas públicas: menu, rodapé, cookies, assistente e métricas.
const SiteShell = ({ children }) => {
  useEffect(() => {
    // Initialize analytics listeners to capture clicks/touches site-wide
    let cleanup = null;
    try {
      // dynamic import so this doesn't break SSR (if any)
      const analytics = require('../utils/analytics');
      if (analytics && analytics.initAnalyticsListeners) {
        cleanup = analytics.initAnalyticsListeners();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Could not initialize analytics listeners', e);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <ScrollReveal />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-black/50" />
      <div className="relative pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <Header />
        {children}
        <Footer />
        <CookieBanner />
        <BackToTop />
        <ChatAssistant />
      </div>
    </div>
  );
};

export default SiteShell;
