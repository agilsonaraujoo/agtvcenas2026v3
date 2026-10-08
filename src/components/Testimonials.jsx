import React, { useCallback, useState, useEffect, useRef } from 'react';
import { testimonials } from '../data/testimonials';
import { FaStar } from 'react-icons/fa';
import '../styles/testimonials.css';

const Testimonials = () => {
  const [expandedIds, setExpandedIds] = useState([]);

  const formatName = (fullName) => {
    const names = fullName.split(' ');
    if (names.length > 1) {
      return `${names[0]} ${names[names.length - 1][0]}.`;
    }
    return fullName;
  };

  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const scrollSpeed = 0.05;
  const isInteractingRef = useRef(false);

  const animateScroll = useCallback((timestamp) => {
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
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (scrollContainerRef.current && window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches) {
      stopAutoScroll();
      lastScrollTimeRef.current = 0;
      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }
  }, [animateScroll, stopAutoScroll]);

  const renderStars = (rating) => (
    <span className="testimonial-stars" role="img" aria-label={`Avaliação ${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <FaStar
          key={index}
          aria-hidden="true"
          className={`testimonial-star ${index + 0.5 < rating ? 'is-filled' : index < rating ? 'is-partial' : ''}`}
          style={{ '--star-index': index }}
        />
      ))}
    </span>
  );

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  return (
  <section id="depoimentos" className="py-14 sm:py-20">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="agtv-section-heading mb-8 sm:mb-12">
          <span className="agtv-section-kicker">QUEM ASSISTE, RECOMENDA</span>
          <h2 className="agtv-section-title">
            Depoimentos de <span>Nossos Clientes</span>
          </h2>
        </div>
        
        <div className="relative">
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-900/50 hover:bg-gray-900/70 text-white rounded-full p-2 z-10 hidden md:block"
            onClick={() => {
              const container = scrollContainerRef.current;
              if (container) {
                container.scrollLeft -= container.offsetWidth;
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-900/50 hover:bg-gray-900/70 text-white rounded-full p-2 z-10 hidden md:block"
            onClick={() => {
              const container = scrollContainerRef.current;
              if (container) {
                container.scrollLeft += container.offsetWidth;
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div
            ref={scrollContainerRef}
            className="relative snap-x snap-mandatory touch-pan-x overflow-x-auto hide-scrollbar"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onMouseEnter={() => {
              isInteractingRef.current = true;
              stopAutoScroll();
            }}
            onMouseLeave={() => {
              isInteractingRef.current = false;
              startAutoScroll();
            }}
            onTouchStart={() => {
              isInteractingRef.current = true;
              stopAutoScroll();
            }}
            onTouchEnd={() => {
              isInteractingRef.current = false;
              startAutoScroll();
            }}
            onTouchCancel={() => {
              isInteractingRef.current = false;
              startAutoScroll();
            }}
          >
            <div className="flex" style={{ scrollBehavior: 'smooth' }}>
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 snap-center p-3 sm:p-6 md:w-1/2 lg:w-1/3 xl:w-1/4"
                >
                  <div className="testimonial-card">
                    <div className="flex items-center mb-4 md:mb-6">
                      <div className="relative">
                        <img
                          src={`/images/${testimonial.image}`}
                          alt={`Foto de ${formatName(testimonial.name)}`}
                          className="mr-3 h-16 w-16 select-none rounded-full border-2 border-white object-cover shadow-xl sm:mr-4 sm:h-24 sm:w-24"
                          style={{ userSelect: 'none' }}
                          draggable={false}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = '/images/default-avatar.jpeg';
                          }}
                        />
                        <div className="testimonial-badge" aria-hidden="true">
                          <FaStar />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-white">{formatName(testimonial.name)}</h3>
                        <div className="mt-2">{renderStars(testimonial.rating)}</div>
                      </div>
                    </div>
                    <p className={`testimonial-quote${expandedIds.includes(testimonial.id) ? ' is-expanded' : ''}`}>
                      {testimonial.testimonial}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-green-500 text-sm font-semibold">{Math.round(testimonial.rating * 10) / 10}</span>
                        <FaStar aria-hidden="true" className="testimonial-rating-star ml-1" />
                      </div>
                      <button
                        type="button"
                        className="testimonial-more"
                        aria-expanded={expandedIds.includes(testimonial.id)}
                        onClick={() => setExpandedIds((ids) => (
                          ids.includes(testimonial.id)
                            ? ids.filter((id) => id !== testimonial.id)
                            : [...ids, testimonial.id]
                        ))}
                      >
                        {expandedIds.includes(testimonial.id) ? 'Ver menos' : 'Ver mais'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
