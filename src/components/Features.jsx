import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiMessageCircle, FiSettings, FiTv, FiMonitor, FiHeadphones, FiSmartphone } from 'react-icons/fi';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';

const trialMessage = 'Olá, vim pelo site AGTV CENAS e quero fazer o teste grátis.';
const trialLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(trialMessage)}`;

const STEPS = [
  { Icon: FiMessageCircle, title: 'Chame no WhatsApp', text: 'Peça o seu teste grátis. Sem cadastro complicado.' },
  { Icon: FiSettings, title: 'A gente te ajuda a instalar', text: 'Liberamos o acesso e explicamos o passo a passo no seu aparelho.' },
  { Icon: FiTv, title: 'É só assistir', text: 'Filmes, séries e TV ao vivo na TV, no celular ou no computador.' },
];

const PERKS = [
  { Icon: FiMonitor, text: 'SD, HD, Full HD e 4K, conforme plano e conexão' },
  { Icon: FiHeadphones, text: 'Suporte pelo WhatsApp todos os dias' },
  { Icon: FiSmartphone, text: 'Funciona em TV, TV Box, celular e PC' },
];

// "Como funciona": três passos curtos até o teste grátis, com uma faixa de benefícios embaixo.
const Features = () => {
  const reduce = useReducedMotion();
  return (
    <section id="servicos" className="relative overflow-hidden bg-gray-800 px-4 py-12 text-white sm:py-16">
      <div className="container relative mx-auto">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">COMO FUNCIONA</span>
          <h2 className="agtv-section-title">
            Comece a assistir <span>em 3 passos</span>
          </h2>
        </div>

        <ol className="relative mx-auto mt-8 grid max-w-5xl gap-4 sm:mt-10 md:grid-cols-3 md:gap-6">
          {/* linha que liga os passos no computador */}
          <span aria-hidden="true" className="pointer-events-none absolute left-[16%] right-[16%] top-9 hidden h-px bg-gradient-to-r from-[#b7ff4a]/0 via-[#b7ff4a]/50 to-[#9a7bff]/0 md:block" />
          {STEPS.map(({ Icon, title, text }, i) => (
            <motion.li
              key={title}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.12 }}
              className="relative flex items-start gap-4 rounded-2xl border border-white/10 bg-[#101116]/90 p-4 md:flex-col md:items-center md:p-6 md:text-center"
            >
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#b7ff4a]/40 bg-[#b7ff4a]/10 text-[#c9ff83] md:h-[4.5rem] md:w-[4.5rem]">
                <Icon aria-hidden="true" className="h-6 w-6 md:h-8 md:w-8" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#b7ff4a] text-xs font-extrabold text-[#10130a]">
                  {i + 1}
                </span>
              </span>
              <div>
                <h3 className="text-lg font-bold sm:text-xl">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-300 sm:text-base">{text}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="mt-7 flex justify-center sm:mt-9">
          <a
            href={trialLink}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics="como_funciona_teste"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#b7ff4a] px-7 py-3 text-base font-extrabold text-[#10130a] shadow-[0_0_24px_rgba(183,255,74,0.18)] transition hover:scale-[1.03] hover:bg-[#ceff83]"
          >
            <FiMessageCircle aria-hidden="true" /> Quero meu teste grátis
          </a>
        </div>

        <ul className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2 sm:mt-10 sm:gap-3">
          {PERKS.map(({ Icon, text }) => (
            <li key={text} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-200 sm:text-sm">
              <Icon aria-hidden="true" className="h-4 w-4 text-[#9a7bff]" /> {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Features;
