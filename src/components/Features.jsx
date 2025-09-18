import React from 'react';
import { FaTv, FaHeadphones, FaShieldAlt } from 'react-icons/fa';
import { FiSettings } from 'react-icons/fi';

const Features = () => {
  return (
    <section id="servicos" className="bg-gray-800 text-white py-16 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white mb-12">
          Cansado(a) de pagar caro por streaming e só travar?<br />
          Conheça a AGTV Streaming
        </h2>
        <p className="text-xl text-gray-300 mb-12">
          A única plataforma que oferece qualidade e suporte sem igual
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Feature 1 */}
          <div className="bg-gray-900 rounded-lg shadow-xl p-8 transform transition-transform hover:scale-105 duration-300">
            <div className="text-indigo-400 mb-6">
              <FaTv className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Qualidade Impecável</h3>
            <p className="text-gray-300">
              Experiência de streaming em 4K, Full HD e HD sem travamentos. A melhor qualidade para você assistir.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="bg-gray-900 rounded-lg shadow-xl p-8 transform transition-transform hover:scale-105 duration-300">
            <div className="text-indigo-400 mb-6">
              <FaHeadphones className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Suporte 24/7</h3>
            <p className="text-gray-300">
              Suporte dedicado 24/7 para resolver qualquer problema rapidamente e garantir sua experiência.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="bg-gray-900 rounded-lg shadow-xl p-8 transform transition-transform hover:scale-105 duration-300">
            <div className="text-indigo-400 mb-6">
              <FaShieldAlt className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Tecnologia Avançada</h3>
            <p className="text-gray-300">
              Trabalhamos com a mais moderna tecnologia de transmissão, com alta definição e sem travamentos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
