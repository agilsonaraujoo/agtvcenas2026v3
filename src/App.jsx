import React, { useEffect } from 'react';
import SiteShell from './components/SiteShell';
import AGTVDevicesCarousel from './components/AGTVDevicesCarousel';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import HomeHighlights from './components/HomeHighlights';
import TrendingContent from './components/TrendingContent';
import RecommendationEngine from './components/RecommendationEngine';
import FAQ from './components/FAQ';
import Testimonials from './components/Testimonials';
import scrollToHash from './utils/scrollToHash';

const App = () => {
  useEffect(() => scrollToHash(), []);

  return (
    <SiteShell>
      <Hero />
      <Features />
      <AGTVDevicesCarousel />
      <HomeHighlights />
      <TrendingContent />
      <RecommendationEngine />
      <Pricing />
      <Testimonials />
      <FAQ />
    </SiteShell>
  );
};

export default App;
