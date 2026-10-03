import React from 'react';
import { FaTv, FaHeadphones, FaShieldAlt } from 'react-icons/fa';

const Features = () => {
  return (
    <section id="servicos" className="bg-gray-800 px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto text-center">
        <h2 className="mx-auto mb-8 max-w-4xl text-3xl font-extrabold leading-tight text-white sm:mb-12 sm:text-4xl">
          Cansado(a) de pagar caro por streaming e só travar?<br className="hidden sm:block" />
          Conheça a AGTV Streaming
        </h2>
        <p className="mb-8 text-base text-gray-300 sm:mb-12 sm:text-xl">
          A única plataforma que oferece qualidade e suporte sem igual
        </p>
        <div className="grid grid-cols-1 gap-5 sm:gap-8 md:grid-cols-3 md:gap-12">
          {/* Feature 1 */}
          <div className="transform rounded-lg bg-gray-900 p-6 shadow-xl transition-transform duration-300 hover:scale-105 sm:p-8">
            <div className="mb-4 text-indigo-400 sm:mb-6">
              <FaTv className="mx-auto h-12 w-12 sm:h-16 sm:w-16" />
            </div>
            <h3 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Qualidade Impecável</h3>
            <p className="text-sm leading-6 text-gray-300 sm:text-base">
              Escolha entre SD, HD, Full HD e 4K, conforme seu plano, aparelho e conexão. A melhor experiência para assistir do seu jeito.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="transform rounded-lg bg-gray-900 p-6 shadow-xl transition-transform duration-300 hover:scale-105 sm:p-8">
            <div className="mb-4 text-indigo-400 sm:mb-6">
              <FaHeadphones className="mx-auto h-12 w-12 sm:h-16 sm:w-16" />
            </div>
            <h3 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Suporte 24/7</h3>
            <p className="text-sm leading-6 text-gray-300 sm:text-base">
              Atendimento dedicado e rápido pelo WhatsApp, todos os dias da semana, para ajudar você sempre que precisar.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="transform rounded-lg bg-gray-900 p-6 shadow-xl transition-transform duration-300 hover:scale-105 sm:p-8">
            <div className="mb-4 text-indigo-400 sm:mb-6">
              <FaShieldAlt className="mx-auto h-12 w-12 sm:h-16 sm:w-16" />
            </div>
            <h3 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Tecnologia Avançada</h3>
            <p className="text-sm leading-6 text-gray-300 sm:text-base">
              Trabalhamos com a mais moderna tecnologia de transmissão, com alta definição e sem travamentos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
