import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiFilm, FiLoader, FiTv, FiZap } from 'react-icons/fi';
import { API_CONFIG } from '../utils/api';

const recommendationEyebrows = [
  'SUA PRÓXIMA DESCOBERTA',
  'FEITO PARA O SEU MOMENTO',
  'FILMES E SÉRIES NO SEU CLIMA',
  'UMA NOVA HISTÓRIA TE ESPERA',
];
const trialUrl = 'https://pagme.xyz/trial/eeebb22786aeac95e12e1b7bd37012a3d07f69721315fc2d';

const RecommendationEngine = () => {
  const [preference, setPreference] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeEyebrow, setActiveEyebrow] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const interval = window.setInterval(() => {
      setActiveEyebrow((current) => (current + 1) % recommendationEyebrows.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  const detectContentType = (text) => {
    const lowerText = text.toLowerCase();
    const keywords = {
      filme: ['filme', 'movie', 'cinema', 'cinematográfico'],
      série: ['série', 'serie', 'series', 'seriado', 'show'],
      anima: ['anime', 'animação', 'animê', 'animation'],
      documentário: ['documentário', 'documentario', 'documental'],
      reality: ['reality', 'reality show'],
      comedy: ['comédia', 'comedia', 'stand-up', 'standup'],
      terror: ['terror', 'horror'],
      ação: ['ação', 'acao', 'action', 'aventura']
    };

    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => lowerText.includes(word))) {
        return type;
      }
    }

    return 'conteúdo';
  };

  const searchTmdbForTitle = async (title, mediaType) => {
    const params = new URLSearchParams({ query: title, mediaType });
    const response = await fetch(`${API_CONFIG.TMDB.SEARCH_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`TMDB fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data.posterUrl || null;
  };

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    setRecommendations([]);

    try {
      const geminiResponse = await fetch(API_CONFIG.GEMINI.RECOMMENDATIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preference })
      });

      if (!geminiResponse.ok) {
        const errorPayload = await geminiResponse.json().catch(() => ({}));
        throw new Error(errorPayload?.error?.message || 'Erro na API do Gemini.');
      }

      const { recommendations: parsedRecommendations } = await geminiResponse.json();

      const recommendationsWithImages = await Promise.all(
        parsedRecommendations.map(async (rec) => {
          const imageUrl = await searchTmdbForTitle(rec.title, rec.mediaType || 'movie')
            .catch(() => null) || `https://placehold.co/500x750/000000/FFFFFF?text=${encodeURIComponent(rec.title)}`;

          return {
            ...rec,
            imageUrl,
            genre: rec.genre || 'Geral'
          };
        })
      );

      setRecommendations(recommendationsWithImages);
    } catch (err) {
      console.error('Erro na API Gemini ou TMDB:', err);
      setError(err.message || 'Erro ao buscar recomendações. Verifique sua conexão ou tente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="recomendacoes" className="relative overflow-hidden bg-gray-800 px-4 py-14 text-white sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_8%,rgba(154,123,255,0.15),transparent_42%),radial-gradient(ellipse_at_50%_48%,rgba(183,255,74,0.06),transparent_58%)]" />
      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65 }}
          className="mx-auto mb-8 max-w-3xl text-center sm:mb-12"
        >
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            {!prefersReducedMotion && (
              <>
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-[#9a7bff]/60"
                  animate={{ scale: [0.82, 1.28], opacity: [0.75, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-2 rounded-full border border-[#b7ff4a]/45"
                  animate={{ scale: [1, 1.34], opacity: [0.6, 0] }}
                  transition={{ duration: 2.4, delay: 0.55, repeat: Infinity, ease: 'easeOut' }}
                />
              </>
            )}
            <motion.div
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#b7ff4a]/40 bg-[#b7ff4a]/10 text-[#c9ff83] shadow-[0_0_30px_rgba(183,255,74,0.16)]"
              animate={prefersReducedMotion ? undefined : {
                boxShadow: [
                  '0 0 18px rgba(183,255,74,0.12)',
                  '0 0 32px rgba(154,123,255,0.32)',
                  '0 0 18px rgba(183,255,74,0.12)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FiZap aria-hidden="true" size={22} />
            </motion.div>
          </div>

          <div className="mx-auto mb-5 inline-flex min-h-[38px] max-w-full items-center gap-2 rounded-full border border-[#b7ff4a]/25 bg-[#b7ff4a]/[0.07] px-4 py-2 text-[10px] font-bold tracking-[0.16em] text-[#c9ff83] sm:text-xs sm:tracking-[0.22em]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#b7ff4a] shadow-[0_0_12px_rgba(183,255,74,0.8)]" />
            <span className="relative grid min-w-0 items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={activeEyebrow}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 7, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -7, filter: 'blur(4px)' }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
                  aria-live="polite"
                  className="col-start-1 row-start-1"
                >
                  {recommendationEyebrows[activeEyebrow]}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-5xl lg:text-6xl">
            Recomendações
            <span className="mt-1 block bg-gradient-to-r from-[#b7ff4a] via-[#d1ff8e] to-[#a68aff] bg-clip-text text-transparent">
              Personalizadas
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-7 text-gray-300 sm:text-xl">
            Conte o que combina com você e deixe a inteligência AGTV encontrar sua próxima história.
          </p>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mx-auto mb-8 max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#101116]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mb-10 sm:p-8"
        >
          {!prefersReducedMotion && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b7ff4a]/80 to-transparent shadow-[0_0_18px_rgba(183,255,74,0.8)]"
              animate={{ x: ['-55%', '55%', '-55%'], opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <textarea
            className="relative z-10 min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-gray-700 p-4 text-white placeholder:text-gray-500 focus:border-[#b7ff4a] focus:ring-2 focus:ring-[#b7ff4a]/10"
            placeholder="Ex: Quero um filme de ficção científica com muita ação e uma história envolvente..."
            data-analytics="reco_textarea"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading && preference.trim()) {
                  getRecommendations();
                }
              }
            }}
          ></textarea>
          <button
            onClick={getRecommendations}
            disabled={loading || !preference.trim()}
            data-analytics="reco_get"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#b7ff4a] px-4 py-3 text-sm font-extrabold text-[#10130a] shadow-[0_0_24px_rgba(183,255,74,0.16)] transition duration-300 hover:scale-[1.03] hover:bg-[#ceff83] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-7 sm:text-lg"
          >
            {loading ? (
              <>
                <motion.span
                  animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                  className="inline-flex"
                >
                  <FiLoader aria-hidden="true" />
                </motion.span>
                Encontrando sua próxima sessão...
              </>
            ) : (
              <>
                <FiZap aria-hidden="true" />
                Obter Recomendações
              </>
            )}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <FiFilm aria-hidden="true" />
            <span>Filmes</span>
            <span className="text-[#9a7bff]">·</span>
            <FiTv aria-hidden="true" />
            <span>Séries</span>
            <span className="text-[#9a7bff]">·</span>
            <FiZap aria-hidden="true" className="text-[#b7ff4a]" />
            <span>Do seu jeito</span>
          </p>
        </motion.div>

        {error && (
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center text-lg text-red-400"
          >
            {error}
          </motion.p>
        )}

        {recommendations.length > 0 && (
          <motion.div
            layout
            className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {recommendations.map((rec, index) => (
              <motion.div
                key={`${rec.title}-${index}`}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: prefersReducedMotion ? 0 : index * 0.09 }}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900 p-5 text-left shadow-xl"
              >
                <img
                  src={rec.imageUrl}
                  alt={`Capa de ${rec.title}`}
                  className="mb-4 aspect-[2/3] w-full rounded-xl object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/500x750/000000/FFFFFF?text=Imagem+Nao+Disponivel'; }}
                />
                <h3 className="relative z-10 mb-2 text-2xl font-bold text-indigo-400">{rec.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{rec.genre}</p>
                <p className="text-gray-300 flex-grow">{rec.shortDescription}</p>
                <div className="mt-5 grid gap-2.5">
                  {(() => {
                    const contentType = detectContentType(preference);
                    const message = `Olá, vim pelo site AGTV CENAS e gostaria de um teste grátis para o ${contentType} ${rec.title}`;
                    const waLink = `https://wa.me/5583986913481?text=${encodeURIComponent(message)}`;
                    return (
                      <>
                        <a
                          href={trialUrl}
                          data-analytics={`reco_trial_${index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#b7ff4a] px-4 py-2 text-center text-sm font-bold text-[#10130a] shadow-[0_0_20px_rgba(183,255,74,0.12)] transition hover:scale-[1.02] hover:bg-[#ceff83]"
                          aria-label={`Iniciar teste grátis para ${rec.title}`}
                        >
                          Iniciar teste grátis
                        </a>
                        <a
                          href={waLink}
                          data-analytics={`reco_whatsapp_${index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#9a7bff]/40 bg-[#9a7bff]/10 px-4 py-2 text-center text-sm font-semibold text-white transition hover:border-[#9a7bff]/70 hover:bg-[#9a7bff]/20"
                          aria-label={`Solicitar teste grátis para ${rec.title} pelo WhatsApp`}
                        >
                          Solicitar pelo WhatsApp
                        </a>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default RecommendationEngine;
