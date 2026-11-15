import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

// Fio verde→roxo no topo da tela que enche conforme a pessoa desce a página.
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-[#b7ff4a] to-[#9a7bff]"
      style={{ scaleX }}
    />
  );
};

export default ScrollProgress;
