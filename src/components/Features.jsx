import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import {
  FiCheck,
  FiChevronsDown,
  FiFilm,
  FiHeadphones,
  FiMessageCircle,
  FiMonitor,
  FiRadio,
  FiSettings,
  FiSmartphone,
  FiTv,
} from 'react-icons/fi';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';
import ZapMascot from './ZapMascot';

const trialMessage = 'Olá, vim pelo site AGTV CENAS e quero fazer o teste grátis.';
const trialLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(trialMessage)}`;

const STEPS = [
  {
    Icon: FiMessageCircle,
    short: 'WhatsApp',
    title: 'Chame no WhatsApp',
    lead: 'Um oi e pronto.',
    text: 'Peça o seu teste grátis. Sem cadastro complicado.',
  },
  {
    Icon: FiSettings,
    short: 'Instalação',
    title: 'A gente te ajuda a instalar',
    lead: 'Do jeito do seu aparelho.',
    text: 'Liberamos o acesso e explicamos o passo a passo no seu aparelho.',
  },
  {
    Icon: FiTv,
    short: 'Assistir',
    title: 'É só assistir',
    lead: 'Na tela que você quiser.',
    text: 'Filmes, séries e TV ao vivo na TV, no celular ou no computador.',
  },
];

const PERKS = [
  { Icon: FiMonitor, text: 'SD, HD, Full HD e 4K, conforme plano e conexão' },
  { Icon: FiHeadphones, text: 'Suporte pelo WhatsApp todos os dias' },
  { Icon: FiSmartphone, text: 'Funciona em TV, TV Box, celular e PC' },
];

const ease = [0.2, 0.75, 0.25, 1];

const TrialButton = ({ id }) => (
  <a
    href={trialLink}
    target="_blank"
    rel="noopener noreferrer"
    data-analytics={id}
    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#b7ff4a] px-7 py-3 text-base font-extrabold text-[#10130a] shadow-[0_0_24px_rgba(183,255,74,0.18)] transition hover:scale-[1.03] hover:bg-[#ceff83]"
  >
    <FiMessageCircle aria-hidden="true" /> Quero meu teste grátis
  </a>
);

const Perks = () => (
  <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2 sm:gap-3">
    {PERKS.map(({ Icon, text }) => (
      <li key={text} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-200 sm:text-sm">
        <Icon aria-hidden="true" className="h-4 w-4 text-[#9a7bff]" /> {text}
      </li>
    ))}
  </ul>
);

const Heading = () => (
  <div className="agtv-section-heading">
    <span className="agtv-section-kicker">COMO FUNCIONA</span>
    <h2 className="agtv-section-title">
      Comece a assistir <span>em 3 passos</span>
    </h2>
  </div>
);

// ---- Ilustrações de cada passo (montam em sequência quando o passo entra) ----

const pop = (delay) => ({
  initial: { opacity: 0, y: 14, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.45, ease, delay },
});

const ChatScene = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0b0d10]">
    <div className="flex items-center gap-3 border-b border-white/10 bg-[#12161b] px-4 py-3">
      <img src="/agtv-logo-192.png" alt="" className="h-8 w-8 rounded-full bg-black object-contain" />
      <div className="leading-tight">
        <p className="text-sm font-bold">AGTV</p>
        <p className="text-[11px] text-[#b7ff4a]">online</p>
      </div>
    </div>
    <div className="flex flex-1 flex-col justify-end gap-2.5 p-4">
      <motion.p {...pop(0.15)} className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-[#b7ff4a] px-3.5 py-2 text-sm font-semibold text-[#10130a]">
        Oi! Quero meu teste grátis
      </motion.p>
      <motion.p {...pop(0.7)} className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2 text-sm text-gray-100">
        Opa! Qual aparelho você vai usar?
      </motion.p>
      <motion.span {...pop(1.2)} className="flex gap-1 self-start rounded-2xl bg-white/10 px-3.5 py-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gray-300"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </motion.span>
    </div>
  </div>
);

const DEVICES = [
  { Icon: FiTv, label: 'Smart TV' },
  { Icon: FiMonitor, label: 'TV Box' },
  { Icon: FiSmartphone, label: 'Celular' },
  { Icon: FiMonitor, label: 'Computador' },
];

const InstallScene = () => (
  <div className="flex h-full flex-col justify-center gap-2.5 rounded-[1.6rem] border border-white/10 bg-[#0b0d10] p-4 sm:p-5">
    {DEVICES.map(({ Icon, label }, i) => (
      <motion.div key={label} {...pop(0.1 + i * 0.2)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
        <Icon aria-hidden="true" className="h-5 w-5 text-[#9a7bff]" />
        <span className="flex-1 text-sm font-semibold">{label}</span>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.45 + i * 0.2 }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#b7ff4a] text-[#10130a]"
        >
          <FiCheck aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      </motion.div>
    ))}
  </div>
);

const TILES = [
  { Icon: FiFilm, label: 'Filmes', tone: 'from-[#9a7bff]/40' },
  { Icon: FiTv, label: 'Séries', tone: 'from-[#b7ff4a]/30' },
  { Icon: FiRadio, label: 'Ao vivo', tone: 'from-red-500/35', live: true },
];

const WatchScene = () => (
  <div className="flex h-full flex-col items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: 18 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ duration: 0.6, ease }}
      style={{ transformPerspective: 900 }}
      className="w-full rounded-[1.4rem] border-[6px] border-[#1b1f26] bg-[#0b0d10] p-3 shadow-[0_0_60px_rgba(183,255,74,0.12)]"
    >
      <div className="grid grid-cols-3 gap-2">
        {TILES.map(({ Icon, label, tone, live }, i) => (
          <motion.div
            key={label}
            {...pop(0.25 + i * 0.15)}
            className={`relative flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-b ${tone} to-white/[0.03]`}
          >
            {live && (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> ao vivo
              </span>
            )}
            <Icon aria-hidden="true" className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-xs font-bold sm:text-sm">{label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
    <span aria-hidden="true" className="mt-1 h-2 w-24 rounded-b-xl bg-[#1b1f26]" />
  </div>
);

const SCENES = [ChatScene, InstallScene, WatchScene];

// ---- Versão parada (quem pede menos movimento no aparelho) ----

const StaticSteps = () => (
  <div className="container mx-auto px-4 py-12 sm:py-16">
    <Heading />
    <ol className="mx-auto mt-8 grid max-w-5xl gap-4 sm:mt-10 md:grid-cols-3 md:gap-6">
      {STEPS.map(({ Icon, title, text }, i) => (
        <li key={title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#101116]/90 p-4 md:flex-col md:items-center md:p-6 md:text-center">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#b7ff4a]/40 bg-[#b7ff4a]/10 text-[#c9ff83]">
            <Icon aria-hidden="true" className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#b7ff4a] text-xs font-extrabold text-[#10130a]">{i + 1}</span>
          </span>
          <div>
            <h3 className="text-lg font-bold sm:text-xl">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-gray-300 sm:text-base">{text}</p>
          </div>
        </li>
      ))}
    </ol>
    <div className="mt-7 flex justify-center sm:mt-9"><TrialButton id="como_funciona_teste" /></div>
    <div className="mt-8 sm:mt-10"><Perks /></div>
  </div>
);

// ---- Versão que acompanha a rolagem ----
// A seção fica presa na tela por 3 "telas" de rolagem; cada terço da rolagem é um passo.
// A barra de etapas embaixo mostra o progresso e leva direto ao passo tocado.

// O Zap no fundo da seção: os olhos e a cabeça seguem o mouse. No celular (sem mouse),
// ele olha pra baixo ou pra cima conforme a pessoa desliza e volta ao centro quando ela para.
const ZapWatcher = ({ step }) => {
  const ref = useRef(null);
  const eyeX = useSpring(0, { stiffness: 220, damping: 20 });
  const eyeY = useSpring(0, { stiffness: 220, damping: 20 });
  const tilt = useSpring(0, { stiffness: 120, damping: 16 });

  useEffect(() => {
    const clamp = (value, max) => Math.max(-max, Math.min(max, value));
    let pointer = null;
    let lastY = window.scrollY;
    let idle = null;

    const aim = () => {
      const el = ref.current;
      if (!el || !pointer) return;
      const r = el.getBoundingClientRect();
      const dx = pointer.x - (r.left + r.width / 2);
      const dy = pointer.y - (r.top + r.height * 0.42);
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / 260);
      eyeX.set((dx / dist) * 13 * reach);
      eyeY.set((dy / dist) * 11 * reach);
      tilt.set(clamp(dx / 60, 9));
    };

    const onMove = (event) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    };

    const onScroll = () => {
      if (pointer) { aim(); return; }
      const speed = window.scrollY - lastY;
      lastY = window.scrollY;
      eyeY.set(clamp(speed * 0.9, 11));
      tilt.set(clamp(speed * -0.25, 5));
      clearTimeout(idle);
      idle = setTimeout(() => { eyeY.set(0); tilt.set(0); }, 260);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idle);
    };
  }, [eyeX, eyeY, tilt]);

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute -right-7 top-[4.25rem] w-28 sm:w-36 md:bottom-8 md:left-[4%] md:right-auto md:top-auto md:w-64 xl:left-[7%] xl:w-72"
      style={{ rotate: tilt }}
      initial={{ y: 60, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 140, damping: 18 }}
    >
      <ZapMascot waving={step === STEPS.length - 1} eyeX={eyeX} eyeY={eyeY} className="h-auto w-full opacity-25 md:opacity-40 drop-shadow-[0_0_40px_rgba(183,255,74,0.25)]" />
    </motion.div>
  );
};

const ScrollSteps = () => {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.max(0, Math.min(STEPS.length - 1, Math.floor(value * STEPS.length))));
  });

  const goTo = (index) => {
    const track = trackRef.current;
    if (!track) return;
    const travel = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + travel * ((index + 0.5) / STEPS.length), behavior: 'smooth' });
  };

  const step = STEPS[active];
  const Scene = SCENES[active];

  return (
    <>
      <div ref={trackRef} className="relative h-[300svh]">
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-[4.5rem] md:pb-8 md:pt-10">
          {/* brilho que muda de lado a cada passo */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            animate={{
              background: [
                'radial-gradient(ellipse at 75% 55%, rgba(183,255,74,0.14), transparent 55%)',
                'radial-gradient(ellipse at 25% 50%, rgba(154,123,255,0.18), transparent 55%)',
                'radial-gradient(ellipse at 60% 45%, rgba(183,255,74,0.16), transparent 55%)',
              ][active],
            }}
            transition={{ duration: 0.8 }}
          />
          <ZapWatcher step={active} />

          <div className="container relative mx-auto flex min-h-0 max-w-5xl flex-1 flex-col">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-[#b7ff4a] sm:text-xs">
              Como funciona · 3 passos
            </p>

            <div className="mt-3 grid min-h-0 flex-1 items-center gap-4 md:mt-6 md:grid-cols-[1fr_1fr] md:gap-12">
              <div className="relative text-center md:text-left">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -24, filter: 'blur(8px)', transition: { duration: 0.18 } }}
                    transition={{ duration: 0.4, ease }}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">
                      0{active + 1} — {step.short}
                    </span>
                    <h2 className="mt-3 text-[1.75rem] font-extrabold leading-[1.08] sm:text-4xl md:text-5xl">
                      {step.title}.
                      <span className="mt-1 block bg-gradient-to-r from-[#b7ff4a] to-[#9a7bff] bg-clip-text text-transparent">
                        {step.lead}
                      </span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-300 sm:text-base md:mx-0">{step.text}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="mt-5 hidden md:block"><TrialButton id="como_funciona_teste" /></div>
              </div>

              <div className="relative mx-auto h-[clamp(8rem,calc(100svh-32.5rem),15.5rem)] w-full max-w-[19rem] md:h-[22rem] md:max-w-[24rem]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.92, rotate: active % 2 ? -3 : 3 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.4, ease }}
                  >
                    <Scene />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-4 flex justify-center md:hidden"><TrialButton id="como_funciona_teste" /></div>

            {/* barra de etapas */}
            <nav aria-label="Passos" className="relative mx-auto mt-4 w-full max-w-xl rounded-2xl border border-white/10 bg-[#101116]/80 p-1.5 backdrop-blur-md md:mt-6">
              <div className="absolute inset-x-3 top-0 h-[2px] overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full origin-left bg-gradient-to-r from-[#b7ff4a] to-[#9a7bff]" style={{ scaleX: progress }} />
              </div>
              <ol className="grid grid-cols-3 gap-1">
                {STEPS.map(({ Icon, short }, i) => (
                  <li key={short}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={i === active ? 'step' : undefined}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                        i === active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span className={i === active ? 'text-[#b7ff4a]' : ''}>0{i + 1}</span>
                      <Icon aria-hidden="true" className="hidden h-4 w-4 sm:block" />
                      {short}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            {/* aviso pra quem acha que a tela travou: a seção segura a tela enquanto os passos trocam */}
            <p
              aria-hidden="true"
              className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-white md:mt-3 md:text-sm"
            >
              <motion.span
                className="inline-flex text-[#b7ff4a]"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <FiChevronsDown className="h-4 w-4" />
              </motion.span>
              {active < STEPS.length - 1 ? `Deslize pra ver o passo ${active + 2}` : 'Continue deslizando'}
            </p>
          </div>
        </div>
      </div>
      <div className="px-4 pb-12 sm:pb-16"><Perks /></div>
    </>
  );
};

// "Como funciona": três passos curtos até o teste grátis, com uma faixa de benefícios embaixo.
const Features = () => {
  const reduce = useReducedMotion();
  return (
    <section id="servicos" data-no-reveal={reduce ? undefined : ''} className="relative bg-gray-800 text-white">
      {reduce ? <StaticSteps /> : <ScrollSteps />}
    </section>
  );
};

export default Features;
