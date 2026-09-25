import React from 'react';
import { motion } from 'framer-motion';
import '../styles/animations.css';

const Hero = () => {
  return (
    <section
      id="home"
      className="text-white flex items-center justify-center min-h-screen pt-20 pb-10 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 fade-in-up"
        >
          Canais, filmes e séries <br className="hidden md:inline"/> em um só lugar.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-gray-300 mb-8 fade-in-up delay-1"
        >
          Qualidade premium, variedade infinita e suporte real para você curtir sem limites.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10 fade-in-up delay-2"
        >
          <a
            href="https://pagme.xyz/trial/eeebb22786aeac95e12e1b7bd37012a3d07f69721315fc2d"
            target="_blank"
            rel="noreferrer"
            data-analytics="cta_trial"
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-4 px-8 rounded-full text-lg transition duration-300 shadow-lg transform hover:scale-105"
          >
            Teste grátis
          </a>
          <a href="#planos" data-analytics="cta_planos" className="border border-white/40 bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-8 rounded-full text-lg transition duration-300">
            Ver planos
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left fade-in-up delay-3"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-2xl font-extrabold text-yellow-400">22 mil+</p>
            <p className="text-sm text-gray-300">Conteúdos em catálogo</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-2xl font-extrabold text-yellow-400">Suporte</p>
            <p className="text-sm text-gray-300">Atendimento via WhatsApp</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-2xl font-extrabold text-yellow-400">HD/4K</p>
            <p className="text-sm text-gray-300">Qualidade premium</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
