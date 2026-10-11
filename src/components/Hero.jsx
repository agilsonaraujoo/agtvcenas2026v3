import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { FiArrowDown, FiBookOpen, FiCheck, FiFilm, FiMonitor, FiPause, FiPlay, FiTv } from 'react-icons/fi';
import { plans } from '../data/pricingPlans';
import { catalogStats, onDemandTotalLabel } from '../data/catalog';
import '../styles/animations.css';

// Menor valor mensal entre os planos (o anual dividido por 12), para o link 'veja os planos'.
const lowestMonthly = Math.min(...plans.map((p) => parseFloat(p.price.replace(',', '.')) / (p.billedMonths || 1)))
  .toFixed(2)
  .replace('.', ',');

const trialUrl = 'https://pagme.xyz/trial/eeebb22786aeac95e12e1b7bd37012a3d07f69721315fc2d';
const contactLinks = [
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@agtvcenas',
    Icon: FaYoutube,
    className: 'hover:border-red-400/50 hover:text-red-300',
  },
  {
    label: 'Guia AGTV',
    href: 'https://agtv-central-ajuda.vercel.app/',
    Icon: FiBookOpen,
    logo: 'https://agtv-central-ajuda.vercel.app/agtv-logo.png',
    className: 'hover:border-[#b7ff4a]/50 hover:text-[#c9ff83]',
  },
  {
    label: 'WhatsApp',
    href: `https://wa.me/5583986913481?text=${encodeURIComponent('Olá, vim pelo site AGTV e gostaria de mais informações.')}`,
    Icon: FaWhatsapp,
    className: 'hover:border-[#b7ff4a]/50 hover:text-[#c9ff83]',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/agtvcenas/',
    Icon: FaInstagram,
    className: 'hover:border-[#c084fc]/50 hover:text-[#d8b4fe]',
  },
];

const experienceHighlights = [
  {
    label: 'NO SEU RITMO',
    title: 'Filmes e séries',
    description: 'Histórias para transformar qualquer momento.',
    Icon: FiFilm,
  },
  {
    label: 'A EMOÇÃO AO VIVO',
    title: 'Esportes ao vivo',
    description: 'Acompanhe o que está acontecendo agora.',
    Icon: FiTv,
  },
  {
    label: 'EM QUALQUER TELA',
    title: 'Assista do seu jeito',
    description: 'Sua diversão acompanha você por todo lado.',
    Icon: FiMonitor,
  },
];

const heroEyebrows = [
  'SEU UNIVERSO DE ENTRETENIMENTO',
  'FILMES, SÉRIES E ENTRETENIMENTO',
  'EMOÇÃO AO VIVO, SEMPRE',
  'SEU PRÓXIMO PLAY COMEÇA AQUI',
  'ENTRETENIMENTO SEM LIMITES',
];

const Hero = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(!prefersReducedMotion);
  const [activeHighlight, setActiveHighlight] = useState(0);
  const [activeEyebrow, setActiveEyebrow] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) setIsPreviewPlaying(false);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const interval = window.setInterval(() => {
      setActiveEyebrow((current) => (current + 1) % heroEyebrows.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!isPreviewPlaying) return undefined;

    const interval = window.setInterval(() => {
      setActiveHighlight((current) => (current + 1) % experienceHighlights.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, [isPreviewPlaying]);

  // TV em 3D: inclina na direção do mouse (computador) ou balança devagar (celular).
  // pointerX/pointerY vão de -1 a 1; as molas suavizam o movimento.
  const tvRef = useRef(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const glareOpacity = useSpring(0, { stiffness: 80, damping: 20 });
  const springX = useSpring(pointerX, { stiffness: 110, damping: 16, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 110, damping: 16, mass: 0.6 });
  const tvRotateY = useTransform(springX, [-1, 1], [-16, 16]);
  const tvRotateX = useTransform(springY, [-1, 1], [12, -12]);
  const glareX = useTransform(springX, [-1, 1], [10, 90]);
  const glareY = useTransform(springY, [-1, 1], [5, 95]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22), rgba(255,255,255,0) 48%)`;
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    setHasFinePointer(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || hasFinePointer) return undefined;
    glareOpacity.set(0.55);
    const swayX = animate(pointerX, [-0.55, 0.55], { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' });
    const swayY = animate(pointerY, [-0.35, 0.35], { duration: 8.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' });
    return () => {
      swayX.stop();
      swayY.stop();
    };
  }, [prefersReducedMotion, hasFinePointer, pointerX, pointerY, glareOpacity]);

  const handleHeroPointerMove = (event) => {
    if (prefersReducedMotion || event.pointerType !== 'mouse' || !tvRef.current) return;
    const rect = tvRef.current.getBoundingClientRect();
    const clampUnit = (value) => Math.max(-1, Math.min(1, value));
    pointerX.set(clampUnit((event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2)));
    pointerY.set(clampUnit((event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2)));
    glareOpacity.set(1);
  };

  const handleHeroPointerLeave = (event) => {
    if (event.pointerType !== 'mouse') return;
    pointerX.set(0);
    pointerY.set(0);
    glareOpacity.set(0);
  };

  const togglePreview = () => {
    setIsPreviewPlaying((playing) => !playing);
  };

  return (
    <section
      id="home"
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="relative flex min-h-screen items-start overflow-hidden px-4 pb-10 pt-16 text-white sm:px-6 sm:pt-28 lg:items-center lg:pt-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_48%,rgba(154,123,255,0.14),transparent_42%),radial-gradient(ellipse_at_78%_52%,rgba(183,255,74,0.08),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-[#07080b]/90" />

      <div className="container relative z-10 mx-auto grid max-w-7xl items-center gap-6 py-4 sm:gap-10 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="relative z-10 order-2 text-center lg:order-1 lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex min-h-[42px] w-full max-w-[22rem] items-center gap-2 rounded-full border border-[#b7ff4a]/25 bg-[#b7ff4a]/[0.07] px-4 py-2 text-left text-[11px] font-semibold tracking-wide text-[#c9ff83] sm:text-xs"
          >
            <span className="h-2 w-2 rounded-full bg-[#b7ff4a] shadow-[0_0_12px_rgba(183,255,74,0.8)]" />
            <span className="relative grid min-w-0 flex-1 items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={activeEyebrow}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
                  aria-live="polite"
                  className="col-start-1 row-start-1"
                >
                  {heroEyebrows[activeEyebrow]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mb-6 max-w-3xl text-4xl font-black leading-[1.06] tracking-tight sm:text-5xl md:text-6xl lg:mx-0 lg:text-7xl"
          >
            Tudo o que você ama.
            <span className="mt-2 block bg-gradient-to-r from-[#b7ff4a] via-[#d1ff8e] to-[#a68aff] bg-clip-text text-transparent">
              Em um só lugar.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 max-w-xl text-base leading-7 text-gray-300 sm:text-lg lg:mx-0"
          >
            Filmes, séries e muito mais para curtir do seu jeito, com qualidade premium e suporte de verdade.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 flex flex-col items-center gap-3 lg:items-start"
          >
            <a
              href={trialUrl}
              target="_blank"
              rel="noreferrer"
              data-analytics="cta_trial"
              className="mx-auto inline-flex min-h-14 w-full max-w-[22rem] items-center justify-center gap-2 rounded-full bg-[#b7ff4a] px-10 py-4 text-lg font-extrabold text-[#10130a] shadow-[0_0_30px_rgba(183,255,74,0.2)] transition hover:scale-[1.03] hover:bg-[#ceff83] sm:w-auto sm:max-w-none lg:mx-0"
            >
              <FiPlay aria-hidden="true" />
              Testar grátis agora
            </a>
            <a
              href="#planos"
              data-analytics="cta_ver_planos"
              className="text-sm font-semibold text-gray-300 underline decoration-white/30 underline-offset-4 transition hover:text-white hover:decoration-[#b7ff4a]"
            >
              Ou veja os planos a partir de R$ {lowestMonthly}/mês
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mx-auto mb-9 grid max-w-sm grid-cols-4 gap-1 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center sm:gap-1.5 lg:mx-0 lg:justify-start"
            aria-label="Redes e contato AGTV"
          >
            {contactLinks.map(({ label, href, Icon, logo, className }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics={`hero_link_${label.toLowerCase().replace(/\s+/g, '_')}`}
                className={`inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium text-gray-400 transition hover:bg-white/[0.06] sm:min-h-9 sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-xs ${className}`}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    className="h-4 w-4 rounded-sm object-contain"
                  />
                ) : (
                  <Icon aria-hidden="true" size={16} />
                )}
                {label}
              </a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto grid max-w-xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.035] px-2 py-4 backdrop-blur-md lg:mx-0"
          >
            {catalogStats.map(({ value, label }, index) => (
              <div key={label} className={`px-2 text-center lg:text-left ${index > 0 ? 'lg:pl-5' : ''}`}>
                <p className="text-lg font-extrabold text-[#b7ff4a] sm:text-2xl">{value}</p>
                <p className="mt-1 text-[11px] leading-4 text-gray-400 sm:text-xs">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.25 }}
          className="relative z-0 order-1 mx-auto w-[min(88vw,420px)] sm:w-[min(82vw,520px)] lg:order-2 lg:w-full lg:max-w-[470px]"
        >
          <motion.div
            ref={tvRef}
            className="relative"
            style={{ rotateX: tvRotateX, rotateY: tvRotateY, transformPerspective: 1100, transformStyle: 'preserve-3d' }}
          >
          <div
            className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#9a7bff]/25 via-transparent to-[#b7ff4a]/20 blur-2xl lg:block"
            style={{ transform: 'translateZ(-60px)' }}
          />
          <div className="relative aspect-square overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#101116] p-1.5 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:rounded-[2rem] sm:p-2 lg:aspect-auto">
            {/* Reflexo de luz que acompanha a inclinação */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-30 mix-blend-screen"
              style={{ backgroundImage: glare, opacity: glareOpacity }}
            />
            <img
              src="/agtv-neon-logo.jpg"
              alt="Televisor AGTV com aro neon verde e roxo"
              className="aspect-square w-full rounded-[1.5rem] object-cover object-center"
            />
            {isPreviewPlaying && (
              <div className="pointer-events-none absolute inset-1.5 z-10 flex items-center justify-center overflow-hidden rounded-[1.35rem] bg-[#07080b]/75 px-3 pb-5 pt-3 backdrop-blur-[3px] sm:inset-2 sm:rounded-[1.5rem] sm:px-8 lg:pb-24 lg:pt-5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(154,123,255,0.2),transparent_55%)]" />
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b7ff4a]/80 to-transparent shadow-[0_0_18px_rgba(183,255,74,0.8)]"
                  animate={{ y: ['0%', '420px', '0%'], opacity: [0, 1, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />

                <div className="relative z-10 w-full max-w-sm text-center">
                  <div className="relative mx-auto mb-2 flex h-16 w-16 items-center justify-center sm:mb-5 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-[#9a7bff]/70"
                      animate={{ scale: [0.84, 1.2], opacity: [0.8, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-2 rounded-full border border-[#b7ff4a]/50"
                      animate={{ scale: [1, 1.32], opacity: [0.65, 0] }}
                      transition={{ duration: 2.2, delay: 0.45, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#b7ff4a]/50 bg-[#b7ff4a]/10 text-[#c9ff83] shadow-[0_0_32px_rgba(183,255,74,0.2)] sm:h-12 sm:w-12 lg:h-14 lg:w-14"
                      animate={{ boxShadow: ['0 0 20px rgba(183,255,74,0.15)', '0 0 36px rgba(154,123,255,0.35)', '0 0 20px rgba(183,255,74,0.15)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {React.createElement(experienceHighlights[activeHighlight].Icon, { size: 26, 'aria-hidden': true })}
                    </motion.div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeHighlight}
                      initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                      transition={{ duration: 0.45 }}
                      aria-live="polite"
                    >
                      <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#b7ff4a] sm:mb-2 sm:text-[10px] sm:tracking-[0.28em] lg:text-xs">
                        {experienceHighlights[activeHighlight].label}
                      </p>
                      <h3 className="text-lg font-black text-white drop-shadow-[0_0_18px_rgba(154,123,255,0.5)] sm:text-xl lg:text-3xl">
                        {experienceHighlights[activeHighlight].title}
                      </h3>
                      <p className="mx-auto mt-1 max-w-xs text-[11px] leading-4 text-gray-200 sm:mt-2 sm:text-xs sm:leading-5 lg:text-sm lg:leading-6">
                        {experienceHighlights[activeHighlight].description}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="pointer-events-none mt-2 hidden justify-center gap-2 sm:mt-4 lg:pointer-events-auto lg:mt-5 lg:flex">
                    {experienceHighlights.map((highlight, index) => (
                      <button
                        key={highlight.title}
                        type="button"
                        aria-label={`Mostrar destaque: ${highlight.title}`}
                        aria-pressed={activeHighlight === index}
                        onClick={() => setActiveHighlight(index)}
                        className={`h-1.5 rounded-full transition-all ${activeHighlight === index ? 'w-8 bg-[#b7ff4a]' : 'w-3 bg-white/35 hover:bg-white/70'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="absolute inset-x-2 bottom-2 z-20 hidden rounded-b-[1.5rem] bg-gradient-to-t from-black/90 via-black/45 to-transparent px-5 pb-5 pt-16 sm:px-7 sm:pb-7 lg:block">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-[#b7ff4a]">Sua próxima sessão</p>
                  <p className="text-xl font-extrabold text-white sm:text-2xl">Diversão sem complicação</p>
                </div>
                <button
                  type="button"
                  onClick={togglePreview}
                  aria-label={isPreviewPlaying ? 'Pausar prévia animada da AGTV' : 'Reproduzir prévia animada da AGTV'}
                  aria-pressed={isPreviewPlaying}
                  className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#b7ff4a] backdrop-blur-md transition hover:scale-110 hover:border-[#b7ff4a]/60 hover:bg-[#b7ff4a]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b7ff4a]"
                >
                  {isPreviewPlaying ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" className="ml-0.5" />}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {!isPreviewPlaying && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                style={{ z: 70 }}
                className="absolute -left-4 top-8 z-20 hidden items-center gap-2 rounded-2xl border border-white/10 bg-[#101116]/90 px-4 py-3 shadow-xl backdrop-blur-lg sm:flex lg:-left-12"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b7ff4a]/10 text-[#b7ff4a]">
                  <FiCheck aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-white">{onDemandTotalLabel} filmes e séries para explorar</span>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      <a
        href="#servicos"
        aria-label="Conheça os serviços AGTV"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 transition hover:text-[#b7ff4a] lg:flex"
      >
        Explore a AGTV
        <FiArrowDown aria-hidden="true" />
      </a>
    </section>
  );
};

export default Hero;
