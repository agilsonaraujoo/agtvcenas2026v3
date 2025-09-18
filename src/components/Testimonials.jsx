import React, { useState, useEffect, useRef } from 'react';
import { testimonials } from '../data/testimonials';

import { FaStar } from 'react-icons/fa';

const Testimonials = () => {
  // Função para formatar o nome (primeiro nome + inicial do sobrenome)
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

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`text-yellow-400 ${i < rating ? 'opacity-100' : 'opacity-20'}`}
        />
      );
    }
    return stars;
  };

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, []);

  return (
  <section id="depoimentos" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-white mb-12">
          Depoimentos de Nossos Clientes
        </h2>
        
        <div className="relative overflow-hidden">
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
            className="relative overflow-hidden"
            onMouseEnter={() => {
              isInteractingRef.current = true;
              stopAutoScroll();
            }}
            onMouseLeave={() => {
              isInteractingRef.current = false;
              startAutoScroll();
            }}
          >
            <div className="flex" style={{ scrollBehavior: 'smooth' }}>
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 xl:w-1/4 p-6"
                >
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105 hover:-translate-y-2">
                    <div className="flex items-center mb-4 md:mb-6">
                      <div className="relative">
                        <img
                          src={`/images/${testimonial.image}`}
                          className="w-24 h-24 rounded-full border-2 border-white mr-4 shadow-xl object-cover select-none"
                          style={{ userSelect: 'none' }}
                          draggable={false}
                          onError={(e) => {
                            e.currentTarget.src = '/images/default-avatar.jpeg';
                          }}
                        />
                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">★</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-white">{formatName(testimonial.name)}</h3>
                        <p className="text-sm md:text-base text-gray-400 mt-1">{testimonial.role}</p>
                        <div className="flex items-center mt-3">
                          {renderStars(testimonial.rating)}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">{testimonial.testimonial}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-green-500 text-sm font-semibold">{Math.round(testimonial.rating * 10) / 10}</span>
                        <FaStar className="text-yellow-400 ml-1" />
                      </div>
                      <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        Ver mais
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
