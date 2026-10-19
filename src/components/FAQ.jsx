import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';
import { faqs, faqCategories } from '../data/faqs';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';

const helpLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá, vim pelo site AGTV CENAS e tenho uma dúvida.')}`;
const plain = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const FAQ = () => {
  const reduce = useReducedMotion();
  const [category, setCategory] = useState('todas');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(faqs[0]?.question || null);

  const list = useMemo(() => {
    const q = plain(query.trim());
    return faqs.filter((f) => (category === 'todas' || f.category === category)
      && (!q || plain(`${f.question} ${f.answer}`).includes(q)));
  }, [category, query]);

  return (
    <section id="faq" className="relative px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto mb-8 text-center sm:mb-10">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">ESTAMOS AQUI PARA AJUDAR</span>
          <h2 className="agtv-section-title">
            Perguntas <span>Frequentes</span>
          </h2>
        </div>
        <p className="agtv-section-description">Encontre sua resposta rapidinho ou fale com a gente.</p>
      </div>

      <div className="container mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          {/* busca + categorias */}
          <label className="relative mb-4 block">
            <span className="sr-only">Buscar nas perguntas</span>
            <FiSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque: pagamento, Smart TV, teste grátis..."
              data-analytics="faq_search"
              className="min-h-12 w-full rounded-full border border-white/10 bg-[#101116] py-3 pl-12 pr-11 text-sm text-white placeholder:text-gray-500 focus:border-[#b7ff4a] focus:outline-none focus:ring-2 focus:ring-[#b7ff4a]/20 sm:text-base"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:text-white">
                <FiX aria-hidden="true" />
              </button>
            )}
          </label>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Categorias">
            {[{ id: 'todas', label: 'Todas' }, ...faqCategories].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={category === id}
                onClick={() => setCategory(id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${category === id ? 'border-[#b7ff4a] bg-[#b7ff4a] text-[#10130a]' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-[#9a7bff]/50 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* perguntas */}
          <ul className="space-y-3">
            {list.map(({ question, answer }) => {
              const isOpen = open === question;
              const id = `faq-${plain(question).replace(/[^a-z0-9]+/g, '-')}`;
              return (
                <li key={question} className={`overflow-hidden rounded-2xl border transition-colors ${isOpen ? 'border-[#b7ff4a]/40 bg-[#14161d]' : 'border-white/10 bg-[#101116] hover:border-[#9a7bff]/40'}`}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen(isOpen ? null : question)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold sm:text-lg"
                  >
                    <span>{question}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: reduce ? 0 : 0.25 }} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isOpen ? 'bg-[#b7ff4a] text-[#10130a]' : 'bg-white/5 text-gray-300'}`}>
                      <FiChevronDown aria-hidden="true" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={id}
                        key="answer"
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduce ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-5 pb-5 text-sm leading-7 text-gray-300 sm:text-base">{answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
          {list.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-gray-400">
              Não achamos essa pergunta. Fale com a gente no WhatsApp que respondemos rapidinho.
            </p>
          )}
        </div>

        {/* cartão de ajuda */}
        <aside className="h-fit rounded-3xl border border-[#b7ff4a]/25 bg-gradient-to-br from-[#16201a] via-[#101116] to-[#1a1530] p-6 lg:sticky lg:top-28">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25d366]/15 text-[#25d366]">
            <FaWhatsapp aria-hidden="true" className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-xl font-extrabold">Ainda com dúvida?</h3>
          <p className="mt-2 text-sm leading-6 text-gray-300">Fale com uma pessoa de verdade pelo WhatsApp, 7 dias por semana.</p>
          <a
            href={helpLink}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics="faq_whatsapp"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#b7ff4a] px-5 py-3 text-sm font-extrabold text-[#10130a] transition hover:scale-[1.02] hover:bg-[#ceff83]"
          >
            <FaWhatsapp aria-hidden="true" /> Chamar no WhatsApp
          </a>
        </aside>
      </div>
    </section>
  );
};

export default FAQ;
