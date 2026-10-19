import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiCalendar, FiClock, FiPlay, FiStar, FiX } from 'react-icons/fi';
import { API_CONFIG } from '../utils/api';
import { buildWhatsappLink, resolveCategory } from '../utils/whatsapp';

// item: { id?, mediaType, category?, title, posterUrl?, overview?, genre? } — null fecha o modal.
const TitleDetailsModal = ({ item, onClose, trialUrl, notice }) => {
  const prefersReducedMotion = useReducedMotion();
  const [details, setDetails] = useState(null);
  const [status, setStatus] = useState('idle');
  const [playing, setPlaying] = useState(false);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    setDetails(null);
    setPlaying(false);
    if (!item || !item.id) {
      setStatus('idle');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    const params = new URLSearchParams({ id: item.id, mediaType: item.mediaType });
    fetch(`${API_CONFIG.TMDB.DETAILS_URL}?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setDetails(data);
        setStatus('done');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Erro ao buscar detalhes do título:', err);
        setStatus('error');
      });

    return () => controller.abort();
  }, [item]);

  useEffect(() => {
    if (!item) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [item, onClose]);

  if (typeof document === 'undefined') return null;

  const title = details?.title || item?.title;
  const overview = details?.overview || item?.overview;
  const posterUrl = details?.posterUrl || item?.posterUrl;
  const backdropUrl = details?.backdropUrl || posterUrl;
  const genres = details?.genres?.length ? details.genres : (item?.genre ? [item.genre] : []);
  const trailer = details?.trailer;

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          key="title-modal"
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="title-modal-heading"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101116] text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:rounded-3xl"
            initial={prefersReducedMotion ? false : { y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-[#b7ff4a]"
              aria-label="Fechar detalhes"
            >
              <FiX size={20} aria-hidden="true" />
            </button>

            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {playing && trailer ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`}
                  title={`Trailer de ${title}`}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <>
                  {backdropUrl && (
                    <img src={backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101116] via-black/20 to-transparent" />
                  {trailer && (
                    <button
                      type="button"
                      onClick={() => setPlaying(true)}
                      data-analytics={`modal_trailer_${details?.id || ''}`}
                      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-[#b7ff4a] px-6 py-3 text-sm font-extrabold text-[#10130a] shadow-[0_0_30px_rgba(183,255,74,0.35)] transition hover:scale-105 hover:bg-[#ceff83] sm:text-base"
                      aria-label={`Assistir trailer de ${title}`}
                    >
                      <FiPlay aria-hidden="true" /> Ver trailer
                      {trailer.language && (
                        <span className="rounded-full bg-[#10130a]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                          {{ dublado: 'Dublado', legendado: 'Legendado', pt: 'Português', en: 'Em inglês' }[trailer.language]}
                        </span>
                      )}
                    </button>
                  )}
                  {status === 'loading' && (
                    <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-300">Carregando trailer...</p>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-8">
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt={`Capa de ${title}`}
                  className="hidden w-36 shrink-0 self-start rounded-xl object-cover shadow-xl sm:block"
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 id="title-modal-heading" className="text-2xl font-extrabold leading-tight sm:text-3xl">
                  {title}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-300">
                  <span className="capitalize">{resolveCategory(item.category, item.mediaType).label}</span>
                  {details?.year && (
                    <span className="inline-flex items-center gap-1"><FiCalendar aria-hidden="true" /> {details.year}</span>
                  )}
                  {details?.rating && (
                    <span className="inline-flex items-center gap-1 text-[#c9ff83]">
                      <FiStar aria-hidden="true" /> {details.rating.toLocaleString('pt-BR')}
                    </span>
                  )}
                  {item.mediaType === 'tv' && details?.seasons ? (
                    <span>{details.seasons} {details.seasons === 1 ? 'temporada' : 'temporadas'}</span>
                  ) : details?.runtime ? (
                    <span className="inline-flex items-center gap-1"><FiClock aria-hidden="true" /> {details.runtime} min</span>
                  ) : null}
                </div>

                {genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <span key={genre} className="rounded-full border border-[#9a7bff]/40 bg-[#9a7bff]/10 px-3 py-1 text-xs font-semibold">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-4 leading-7 text-gray-300">
                  {overview || (status === 'loading' ? 'Carregando sinopse...' : 'Sinopse ainda não disponível em português.')}
                </p>

                {notice && (
                  <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm leading-6 text-yellow-100">
                    ⚠️ {notice}
                  </p>
                )}

                <div className="mt-6 grid gap-2.5 sm:flex sm:flex-wrap">
                  {trialUrl && (
                    <a
                      href={trialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-analytics="modal_trial"
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#b7ff4a] px-6 py-2 text-sm font-bold text-[#10130a] transition hover:scale-[1.02] hover:bg-[#ceff83]"
                    >
                      Iniciar teste grátis
                    </a>
                  )}
                  <a
                    href={buildWhatsappLink(title, item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics="modal_whatsapp"
                    className={trialUrl
                      ? 'inline-flex min-h-11 items-center justify-center rounded-full border border-[#9a7bff]/40 bg-[#9a7bff]/10 px-6 py-2 text-sm font-semibold text-white transition hover:border-[#9a7bff]/70 hover:bg-[#9a7bff]/20'
                      : 'inline-flex min-h-11 items-center justify-center rounded-full bg-[#b7ff4a] px-6 py-2 text-sm font-bold text-[#10130a] transition hover:scale-[1.02] hover:bg-[#ceff83]'}
                  >
                    Assistir na AGTV pelo WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default TitleDetailsModal;
