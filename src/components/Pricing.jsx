import React from 'react';
import { plans } from '../data/pricingPlans';
import './pricing.css';
import '../styles/animations.css';

const Pricing = () => {
  return (
    <section 
      id="planos" 
      className="bg-gray-900 text-white py-16 px-4 pricing-section fade-in-up"
    >
      <div className="container mx-auto text-center mb-12">
        <h2 
          className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl mb-4 fade-in-up delay-1"
        >
          Escolha o Plano Ideal para Você
        </h2>
        <p 
          className="text-xl text-gray-300 fade-in-up delay-2"
        >
          Diversão sem limites ao seu alcance.
        </p>
      </div>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col plan-card relative ${plan.name === 'Anual' ? 'border-2 border-purple-500' : ''} fade-in-up delay-${index + 3}`}
          >
            {plan.isPopular && (
              <span className="absolute top-0 right-0 bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</span>
            )}
            {plan.highlight && (
              <span className={`absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg`}>{plan.highlight.text}</span>
            )}

            <h3 className="text-2xl font-bold text-indigo-400 mb-6">{plan.name}</h3>
            <div className="text-5xl font-extrabold text-white mb-2">
              R$ {plan.price.split(',')[0]}<span className="text-3xl text-gray-400">,{plan.price.split(',')[1]}</span>
            </div>
            {/* Effective monthly price considering bonus months (hidden for Mensal) */}
            {plan.name !== 'Plano Mensal' && (() => {
              const numeric = parseFloat(plan.price.replace('.', '').replace(',', '.'));
              const bonus = plan.bonusMonths || 0;
              const billed = plan.billedMonths || (plan.name === 'Plano Quadrimestral' ? 4 : plan.name === 'Plano Semestral' ? 5 : plan.name === 'Anual' ? 10 : 1);
              const effectiveMonths = billed + bonus;
              const monthlyRaw = numeric / effectiveMonths;
              // Floor to 2 decimals to meet request: 99,90 / 4 => 24,97
              const monthlyFloored = Math.floor(monthlyRaw * 100) / 100;
              const monthlyStr = monthlyFloored.toFixed(2).replace('.', ',');
              return (
                <div className="text-sm text-gray-300 mb-4">
                  Valor médio: <b className="text-white">R$ {monthlyStr}</b> <span className="text-xs text-gray-400">/mês</span>
                </div>
              );
            })()}
            <ul className="text-lg text-gray-300 space-y-3 flex-grow mb-8">
              {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                    {feature === 'Ultra Economia' ? (
                      <span className="neon">{feature}</span>
                    ) : (
                      <span>{feature}</span>
                    )}
                </li>
              ))}
            </ul>
            <a href={plan.paymentUrl} target="_blank" rel="noopener noreferrer" className="mt-auto block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-center">
              Assinar Agora!
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Pricing;
