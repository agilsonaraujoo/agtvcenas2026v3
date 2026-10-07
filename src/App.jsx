import React, { useEffect } from 'react';
import Header from './components/Header';
import AGTVDevicesCarousel from './components/AGTVDevicesCarousel';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import LiveSchedule from './components/LiveSchedule';
import TrendingContent from './components/TrendingContent';
import RecommendationEngine from './components/RecommendationEngine';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Testimonials from './components/Testimonials';
import NewSubscriptionPopup from './components/NewSubscriptionPopup';
import CookieBanner from './components/CookieBanner';
import ScrollReveal from './components/ScrollReveal';

const App = () => {
  React.useEffect(() => {
    // Allow default browser actions (right-click, select, drag) so users can copy and inspect
    // Previously we blocked these actions as a deterrent; we've removed that restriction.
  }, []);

  useEffect(() => {
    // Initialize analytics listeners to capture clicks/touches site-wide
    let cleanup = null;
    try {
      // dynamic import so this doesn't break SSR (if any)
      const analytics = require('./utils/analytics');
      if (analytics && analytics.initAnalyticsListeners) {
        cleanup = analytics.initAnalyticsListeners();
        console.log('Analytics listeners initialized');
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
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-black/50"></div>
      <div className="relative">
  <Header />
  <Hero />
           <Features />
           {/* ...existing code... */}
           <AGTVDevicesCarousel />
  <LiveSchedule />
  <TrendingContent />
  <RecommendationEngine />
  <Pricing />
  <Testimonials />
  <FAQ />
  <Footer />
  {/* <NewSubscriptionPopup /> */}
  <CookieBanner />
      </div>
    </div>
  );
};

export default App;
