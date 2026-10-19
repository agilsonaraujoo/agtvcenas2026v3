import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiStar, FiDollarSign, FiTv, FiTrendingUp, FiZap, FiHelpCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { API_CONFIG } from '../utils/api';
import { WHATSAPP_NUMBER } from '../utils/whatsapp';

const TRIAL_URL = 'https://pagme.xyz/trial/eeebb22786aeac95e12e1b7bd37012a3d07f69721315fc2d';
const STORE_KEY = 'agtv-chat-v1';
const GREETING = { role: 'assistant', text: 'Oi! 👋 Sou o assistente da AGTV. Posso tirar suas dúvidas sobre planos, aparelhos, teste grátis e mais. Como posso ajudar?', actions: ['teste', 'planos'] };
const SUGGESTIONS = ['Como funciona o teste grátis?', 'Quanto custa?', 'Funciona na minha TV?', 'Qual internet eu preciso?'];

// Botões que o assistente pode oferecer. O site define o destino de cada um.
const ACTIONS = {
  whatsapp: { label: 'Falar no WhatsApp', Icon: FaWhatsapp, href: () => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá, vim pelo assistente do site AGTV e tenho uma dúvida.')}`, external: true, primary: true },
  teste: { label: 'Fazer teste grátis', Icon: FiStar, href: () => TRIAL_URL, external: true, primary: true },
  planos: { label: 'Ver planos', Icon: FiDollarSign, href: () => '#planos' },
  programacao: { label: 'Programação ao vivo', Icon: FiTv, href: () => '#programacao' },
  em_alta: { label: 'Em alta', Icon: FiTrendingUp, href: () => '#trending' },
  recomendacoes: { label: 'Recomendações com IA', Icon: FiZap, href: () => '#recomendacoes' },
  faq: { label: 'Perguntas frequentes', Icon: FiHelpCircle, href: () => '#faq' },
};

const load = () => {
  try { const v = JSON.parse(sessionStorage.getItem(STORE_KEY)); return Array.isArray(v) && v.length ? v : [GREETING]; } catch { return [GREETING]; }
};

const ChatAssistant = () => {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(load);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [nudge, setNudge] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* sem armazenamento */ } }, [messages]);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, busy, open]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 250); }, [open]);
  // Balãozinho de convite depois de alguns segundos, só uma vez por visita.
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(`${STORE_KEY}-nudge`) === '1'; } catch { /* ignore */ }
    if (seen) return undefined;
    const t = setTimeout(() => { setNudge(true); try { sessionStorage.setItem(`${STORE_KEY}-nudge`, '1'); } catch { /* ignore */ } }, 12000);
    const hide = setTimeout(() => setNudge(false), 22000);
    return () => { clearTimeout(t); clearTimeout(hide); };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (text) => {
    const question = text.trim();
    if (!question || busy) return;
    const next = [...messages, { role: 'user', text: question }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const response = await fetch(API_CONFIG.ASSISTANT.URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, text: t }) => ({ role, text: t })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data?.error?.message || 'erro');
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, actions: data.actions || [] }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Ops, não consegui responder agora. Nossa equipe te atende rapidinho no WhatsApp:', actions: ['whatsapp'] }]);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => setMessages([GREETING]);
  const onlyGreeting = messages.length === 1;

  return (
    <>
      {/* bolinha */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-6 md:right-6">
        <AnimatePresence>
          {nudge && !open && (
            <motion.button
              type="button"
              onClick={() => { setNudge(false); setOpen(true); }}
              initial={reduce ? false : { opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-[4.4rem] right-0 w-56 rounded-2xl rounded-br-md border border-white/10 bg-[#14161d] px-4 py-3 text-left text-sm text-white shadow-2xl"
            >
              Ficou com alguma dúvida? Posso te ajudar agora 😉
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => { setNudge(false); setOpen((o) => !o); }}
          aria-label={open ? 'Fechar assistente' : 'Abrir assistente da AGTV'}
          aria-expanded={open}
          data-analytics="chat_toggle"
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#b7ff4a] text-[#10130a] shadow-[0_10px_30px_rgba(0,0,0,0.45),0_0_26px_rgba(183,255,74,0.35)]"
        >
          {!open && !reduce && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-[#b7ff4a] opacity-25" />}
          {open ? <FiX aria-hidden="true" className="relative h-6 w-6" /> : <FiMessageCircle aria-hidden="true" className="relative h-6 w-6" />}
          {!open && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#07080b] bg-[#ff4d4d]" />}
        </motion.button>
      </div>

      {/* janela do chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Assistente da AGTV"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-2 bottom-[calc(8.6rem+env(safe-area-inset-bottom))] top-20 z-50 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d0e14]/[0.98] text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[min(36rem,calc(100vh-8rem))] md:w-[24rem]"
          >
            <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-[#1a2410] to-[#1b1530] px-4 py-3">
              <img src="/agtv-neon-logo.jpg" alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-[#b7ff4a]/50" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold leading-tight">Assistente AGTV</p>
                <p className="flex items-center gap-1.5 text-xs text-[#c9ff83]"><span className="h-2 w-2 rounded-full bg-[#b7ff4a]" /> Online agora</p>
              </div>
              {!onlyGreeting && <button type="button" onClick={reset} className="rounded-full px-2 py-1 text-xs text-gray-300 hover:text-white">Nova conversa</button>}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar assistente" className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white">
                <FiX aria-hidden="true" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <p className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6 ${m.role === 'user' ? 'rounded-br-md bg-[#b7ff4a] text-[#10130a]' : 'rounded-bl-md border border-white/10 bg-[#171820] text-gray-100'}`}>
                    {m.text}
                  </p>
                  {m.role === 'assistant' && m.actions?.length > 0 && (
                    <div className="mt-2 flex max-w-[95%] flex-wrap gap-2">
                      {m.actions.filter((a) => ACTIONS[a]).map((a) => {
                        const { label, Icon, href, external, primary } = ACTIONS[a];
                        return (
                          <a
                            key={a}
                            href={href()}
                            target={external ? '_blank' : undefined}
                            rel={external ? 'noopener noreferrer' : undefined}
                            onClick={() => { if (!external) setOpen(false); }}
                            data-analytics={`chat_action_${a}`}
                            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:scale-[1.03] ${primary ? 'bg-[#b7ff4a] text-[#10130a]' : 'border border-[#9a7bff]/50 bg-[#9a7bff]/10 text-white'}`}
                          >
                            <Icon aria-hidden="true" /> {label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-[#171820] px-4 py-3 w-fit" aria-label="Digitando">
                  {[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: `${d * 0.15}s` }} />)}
                </div>
              )}
              {onlyGreeting && !busy && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-left text-xs text-gray-200 hover:border-[#b7ff4a]/50 hover:text-white">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-end gap-2 border-t border-white/10 p-3"
            >
              <label className="sr-only" htmlFor="agtv-chat-input">Sua mensagem</label>
              <textarea
                id="agtv-chat-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={600}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Digite sua dúvida..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-[#171820] px-4 py-2.5 text-base text-white placeholder:text-gray-500 focus:border-[#b7ff4a] focus:outline-none"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Enviar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#b7ff4a] text-[#10130a] transition disabled:opacity-40">
                <FiSend aria-hidden="true" />
              </button>
            </form>
            <p className="px-4 pb-2 text-center text-[10px] text-gray-500">Assistente com IA. Para atendimento humano, toque em "Falar no WhatsApp".</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatAssistant;
