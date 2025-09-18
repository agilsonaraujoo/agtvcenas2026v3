import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../utils/api';

const TrendingContent = () => {
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const scrollSpeed = 0.1;
  const isInteractingRef = useRef(false);

  // !!! IMPORTANTE: Use a variável de ambiente para sua chave da API do TMDB.
  // Para produção, esta chave deve ser segura no servidor.
const TMDB_API_KEY = API_CONFIG.TMDB.API_KEY;

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
    if (scrollContainerRef.current) {
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
    const fetchTrending = async () => {
      if (!TMDB_API_KEY) {
        setError('A chave da API do TMDB não foi configurada. Verifique seu arquivo .env.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=pt-BR`);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();

        if (data.results) {
          const filteredItems = data.results.filter(item =>
            item.poster_path && (item.title || item.name)
          );
          const itemsToDisplay = [...filteredItems, ...filteredItems];
          setTrendingItems(itemsToDisplay);
        } else {
          setError('Não foi possível carregar o conteúdo em alta.');
        }
      } catch (err) {
        setError('Erro ao buscar conteúdo em alta. Verifique sua conexão ou a chave da API.');
        console.error('Erro ao buscar trending do TMDB:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();

    return () => {
      stopAutoScroll();
    };
  }, [TMDB_API_KEY]);

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
    <section id="trending" className="bg-gray-900 text-white py-16 px-4 relative">
      <div className="container mx-auto mb-12">
        <h2 className="text-4xl font-extrabold text-white text-center sm:text-5xl lg:text-6xl mb-4">
          Filmes e Séries do Momento 🔥
        </h2>
        <p className="text-xl text-gray-300 text-center mb-8">
          Os títulos mais assistidos de 2025 (e além)!
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
              className="flex overflow-x-scroll pb-4 hide-scrollbar cursor-grab active:cursor-grabbing"
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
                  className="flex-none w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 mr-4 snap-center transform transition-transform hover:scale-105 duration-300"
                >
                  <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden h-full flex flex-col">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={`Capa de ${item.title || item.name}`}
                      className="w-full h-auto object-cover rounded-t-lg"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/500x750/000000/FFFFFF?text=Poster+Nao+Disponivel'; }}
                    />
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <h3 className="text-lg font-bold text-white mb-1 leading-tight">
                        {item.title || item.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{item.media_type === 'movie' ? 'Filme' : 'Série'}</p>
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
    </section>
  );
};

export default TrendingContent;
