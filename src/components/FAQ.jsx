import React, { useState } from 'react';
import { faqs } from '../data/faqs';
import { FaWhatsapp } from 'react-icons/fa';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-gray-900 text-white py-16 px-4">
      <div className="container mx-auto text-center mb-12">
        <h2 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl mb-4">
          Perguntas Frequentes
        </h2>
        <p className="text-xl text-gray-300">
          Tire suas dúvidas e saiba mais sobre a AGTV.
        </p>
      </div>

      <div className="container mx-auto max-w-3xl">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-gray-800 rounded-lg mb-3 overflow-hidden">
            <button
              className="w-full text-left p-6 flex justify-between items-center text-xl font-semibold text-white hover:bg-gray-700 transition duration-300 focus:outline-none"
              onClick={() => toggleFAQ(index)}
            >
              {faq.question}
              <svg
                className={`h-6 w-6 transform transition-transform duration-500 ease-in-out ${openIndex === index ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="p-4 border-t border-gray-700 text-gray-300">
              <div 
                className={`transition-all duration-700 ease-in-out ${openIndex === index ? 'opacity-100 h-auto' : 'opacity-0 h-0'}`} 
                style={{ display: openIndex === index ? 'block' : 'none' }}
              >
                <p className="text-sm leading-5 mb-3">{faq.answer}</p>
                {index === faqs.length - 1 && (
                  <div className="mt-6 flex justify-center">
                    <a
                      href="https://wa.me/5583986913481?text=Olá!%20Gostaria%20de%20solicitar%20um%20período%20de%20teste%20gratuito%20da%20AGTV.%20Como%20posso%20proceder?"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-base font-medium"
                    >
                      <FaWhatsapp className="h-5 w-5 mr-2" />
                      Falar com um Especialista
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
