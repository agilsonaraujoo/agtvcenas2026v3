import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '../utils/api';
import { buildWhatsappLink } from '../utils/whatsapp';
import TitleDetailsModal from './TitleDetailsModal';

const TrendingContent = () => {
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const scrollSpeed = 0.1;
  const isInteractingRef = useRef(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const closeModal = useCallback(() => setSelectedItem(null), []);
  const [mediaFilter, setMediaFilter] = useState('movie');
  const cacheRef = useRef({});

  const openDetails = (item) => {
    setSelectedItem({
      id: item.id,
      mediaType: item.media_type === 'movie' ? 'movie' : 'tv',
      title: item.title || item.name,
      overview: item.overview,
      posterUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
    });
  };


  const animateScroll = (timestamp) => {
    if (!lastScrollTimeRef.current) {
      lastScrollTimeRef.current = timestamp;
    }

    const deltaTime = timestamp - lastScrollTimeRef.current;
    lastScrollTimeRef.current = timestamp;

    const container = scrollContainerRef.current;
    if (container && !isInteractingRef.current) {
      container.scrollLeft += scrollSpeed * deltaTime;

      const originalContentWidth = container.scrollWidth / 2;
      if (container.scrollLeft >= originalContentWidth) {
        container.scrollLeft -= originalContentWidth;
      }
    }
    scrollAnimationRef.current = requestAnimationFrame(animateScroll);
  };

  const startAutoScroll = () => {
    if (scrollContainerRef.current && window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches) {
      stopAutoScroll();
      lastScrollTimeRef.current = 0;
      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }
  };

  const stopAutoScroll = () => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    stopAutoScroll();
    if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;

    const showItems = (items) => {
      setTrendingItems([...items, ...items]);
      setError('');
      setLoading(false);
    };

    if (cacheRef.current[mediaFilter]) {
      showItems(cacheRef.current[mediaFilter]);
      return () => {
        cancelled = true;
        stopAutoScroll();
      };
    }

    const fetchTrending = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_CONFIG.TMDB.TRENDING_URL}?type=${mediaFilter}`);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) return;

        if (data.results) {
          const filteredItems = data.results.filter(item =>
            item.poster_path && (item.title || item.name)
          );
          cacheRef.current[mediaFilter] = filteredItems;
          showItems(filteredItems);
        } else {
          setError('Não foi possível carregar o conteúdo em alta.');
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError('Erro ao buscar conteúdo em alta. Verifique sua conexão ou tente novamente mais tarde.');
        setLoading(false);
        console.error('Erro ao buscar trending do TMDB:', err);
      }
    };

    fetchTrending();

    return () => {
      cancelled = true;
      stopAutoScroll();
    };
  }, [mediaFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (trendingItems.length > 0 && !loading && !error) {
      startAutoScroll();
    }
  }, [trendingItems, loading, error]);

  const handleInteractionStart = () => {
    isInteractingRef.current = true;
    stopAutoScroll();
  };

  const handleInteractionEnd = () => {
    isInteractingRef.current = false;
    setTimeout(() => {
      if (!isInteractingRef.current) {
        startAutoScroll();
      }
    }, 1000);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      handleInteractionStart();
      const container = scrollContainerRef.current;
      const itemWidth = container.querySelector('.flex-none')?.offsetWidth || 0;
      const originalContentWidth = container.scrollWidth / 2;

      if (container.scrollLeft - itemWidth < 0) {
        container.scrollLeft += originalContentWidth;
        container.style.scrollBehavior = 'auto';
        setTimeout(() => {
          container.scrollBy({ left: -itemWidth, behavior: 'smooth' });
          container.style.scrollBehavior = 'smooth';
        }, 50);
      } else {
        container.scrollBy({ left: -itemWidth, behavior: 'smooth' });
      }
      handleInteractionEnd();
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      handleInteractionStart();
      const container = scrollContainerRef.current;
      const itemWidth = container.querySelector('.flex-none')?.offsetWidth || 0;
      const originalContentWidth = container.scrollWidth / 2;

      if (container.scrollLeft + itemWidth >= originalContentWidth) {
        container.scrollLeft -= originalContentWidth;
        container.style.scrollBehavior = 'auto';
        setTimeout(() => {
          container.scrollBy({ left: itemWidth, behavior: 'smooth' });
          container.style.scrollBehavior = 'smooth';
        }, 50);
      } else {
        container.scrollBy({ left: itemWidth, behavior: 'smooth' });
      }
      handleInteractionEnd();
    }
  };

  return (
    <section id="trending" className="relative bg-gray-900 px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto mb-8 sm:mb-12">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">EM ALTA NA AGTV</span>
          <h2 className="agtv-section-title">
            Filmes e Séries <span>do Momento</span> <span aria-hidden="true">🔥</span>
          </h2>
        </div>
        <p className="agtv-section-description text-center mb-3">
          Os títulos mais assistidos de 2026 (e além)!
        </p>
        <div className="mb-4 flex justify-center gap-3" role="tablist" aria-label="Escolha entre filmes e séries em alta">
          {[
            { value: 'movie', label: '🎬 Filmes' },
            { value: 'tv', label: '📺 Séries' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mediaFilter === value}
              onClick={() => setMediaFilter(value)}
              data-analytics={`trending_tab_${value}`}
              className={`min-h-11 rounded-full px-6 py-2 text-sm font-bold transition sm:text-base ${mediaFilter === value
                ? 'bg-[#b7ff4a] text-[#10130a] shadow-[0_0_24px_rgba(183,255,74,0.25)]'
                : 'border border-white/15 bg-white/5 text-gray-200 hover:border-[#b7ff4a]/50 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mx-auto mb-8 max-w-2xl text-center text-xs leading-5 text-gray-400 sm:text-sm">
          {mediaFilter === 'movie'
            ? '⚠️ Muitos destes filmes ainda estão em cartaz nos cinemas e podem não estar disponíveis na AGTV.'
            : '⚠️ Episódios e temporadas recém-lançados podem ainda não estar disponíveis na AGTV.'}
          {' '}Consulte a disponibilidade pelo WhatsApp.
        </p>

        {loading && <p className="text-center text-indigo-400">Carregando conteúdo em alta...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && trendingItems.length > 0 && (
          <div className="relative">
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-700 bg-opacity-75 hover:bg-opacity-100 p-3 rounded-full shadow-lg z-20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hidden md:block"
              aria-label="Rolar para a esquerda"
            >
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={scrollContainerRef}
              className="flex snap-x snap-mandatory touch-pan-x overflow-x-auto pb-4 hide-scrollbar cursor-grab active:cursor-grabbing md:snap-none"
              style={{ WebkitOverflowScrolling: 'touch' }}
              onMouseEnter={handleInteractionStart}
              onMouseLeave={handleInteractionEnd}
              onTouchStart={handleInteractionStart}
              onTouchEnd={handleInteractionEnd}
              onTouchCancel={handleInteractionEnd}
              onMouseDown={handleInteractionStart}
              onMouseUp={handleInteractionEnd}
            >
              {trendingItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex-none w-48 snap-start pr-4 transition-transform duration-300 sm:w-56 md:w-64 md:snap-center md:pr-0 lg:w-72 xl:w-80 md:mr-4 md:hover:scale-105"
                >
                  <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden h-full flex flex-col">
                    <button
                      type="button"
                      onClick={() => openDetails(item)}
                      data-analytics={`trending_details_${item.id || index}`}
                      className="group relative block w-full focus:outline-none focus:ring-2 focus:ring-[#b7ff4a]"
                      aria-label={`Ver sinopse e trailer de ${item.title || item.name}`}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={`Capa de ${item.title || item.name}`}
                        loading="lazy"
                        className="w-full h-auto object-cover rounded-t-lg"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/500x750/000000/FFFFFF?text=Poster+Nao+Disponivel'; }}
                      />
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/90 to-transparent pb-3 pt-10 text-sm font-bold text-[#c9ff83] transition md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100">
                        ▶ Trailer e sinopse
                      </span>
                    </button>
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <h3 className="text-lg font-bold text-white mb-1 leading-tight">
                        <button type="button" onClick={() => openDetails(item)} className="text-left hover:text-[#c9ff83]">
                          {item.title || item.name}
                        </button>
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">{item.media_type === 'movie' ? 'Filme' : 'Série'}</p>
                      <div className="flex justify-center">
                        <a
                          href={buildWhatsappLink(item.title || item.name, { mediaType: item.media_type })}
                          data-analytics={`trending_assist_${item.id || index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-3 rounded-full text-xs transition duration-200 shadow-sm"
                          aria-label={`Solicitar teste grátis para ${item.title || item.name} via WhatsApp`}
                        >
                          Assistir
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-700 bg-opacity-75 hover:bg-opacity-100 p-3 rounded-full shadow-lg z-20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hidden md:block"
              aria-label="Rolar para a direita"
            >
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <TitleDetailsModal
        item={selectedItem}
        onClose={closeModal}
        notice={selectedItem?.mediaType === 'tv'
          ? 'Episódios e temporadas recém-lançados podem ainda não estar disponíveis na AGTV. Consulte a disponibilidade pelo WhatsApp.'
          : 'Este filme pode ainda estar em cartaz nos cinemas e não estar disponível na AGTV. Consulte a disponibilidade pelo WhatsApp.'}
      />
    </section>
  );
};

export default TrendingContent;
