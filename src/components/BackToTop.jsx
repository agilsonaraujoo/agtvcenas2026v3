import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiArrowUp } from 'react-icons/fi';

// Botão de seta que aparece depois de descer bastante e leva de volta ao topo.
const BackToTop = () => {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.2);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          aria-label="Voltar ao topo"
          title="Voltar ao topo"
          data-analytics="back_to_top"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
          initial={reduce ? false : { opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: 20, scale: 0.8 }}
          whileHover={reduce ? undefined : { y: -3 }}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[#b7ff4a]/40 bg-[#0b0c12]/85 text-[#b7ff4a] shadow-[0_10px_30px_rgba(0,0,0,0.45),0_0_18px_rgba(183,255,74,0.2)] backdrop-blur-xl transition-colors hover:bg-[#b7ff4a] hover:text-[#10130a] md:bottom-6 md:right-6"
        >
          <FiArrowUp aria-hidden="true" className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
