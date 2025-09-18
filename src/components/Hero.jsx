import React from 'react';
import { motion } from 'framer-motion';
import '../styles/animations.css';

const Hero = () => {
  return (
    <section
      id="home"
      className="text-white flex items-center justify-center min-h-screen pt-20 pb-10 relative overflow-hidden"
    >
      {/* Vídeo de fundo removido para evitar duplicação */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 fade-in-up"
        >
          Assista aos Melhores Canais, Filmes e Séries <br className="hidden md:inline"/> Em Um Só Lugar!
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-gray-300 mb-12 fade-in-up delay-1"
        >
          A única plataforma que oferece qualidade e suporte sem igual
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 fade-in-up delay-2"
        >
          <a href="#planos" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-full text-xl transition duration-300 shadow-lg transform hover:scale-105">
            Contrate Agora!
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
