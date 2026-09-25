import React, { useState, useEffect } from 'react';
import { plans } from '../data/pricingPlans';
import './pricing.css';
import '../styles/animations.css';

const Pricing = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (!modalOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousHtmlTouchAction = document.documentElement.style.touchAction;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const previousBodyPosition = document.body.style.position;
    const previousHtmlPosition = document.documentElement.style.position;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.position = 'fixed';
    document.body.style.inset = '0';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.inset = '0';
    document.documentElement.style.width = '100%';

    const preventScroll = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('scroll', preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.body.style.position = previousBodyPosition;
      document.body.style.inset = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.touchAction = previousHtmlTouchAction;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      document.documentElement.style.position = previousHtmlPosition;
      document.documentElement.style.inset = '';
      document.documentElement.style.width = '';
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('scroll', preventScroll);
    };
  }, [modalOpen]);
  const openConfirm = (plan) => {
    try {
      console.log('pricing: openConfirm', { plan: plan.name, price: plan.price, time: new Date().toISOString() });
      if (window && window.dataLayer) {
        window.dataLayer.push({ event: 'pricing_open_confirm', plan: plan.name, price: plan.price });
      }
    } catch (e) {
      console.error('Tracking openConfirm error', e);
    }

    const priceDisplay = plan.price;
    const message = `Olá, vim pelo site AGTV CENAS e gostaria de assinar o plano ${plan.name} pelo valor de R$ ${priceDisplay}`;
    const waLink = `https://wa.me/5583986913481?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank', 'noopener');
  };

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
            className={`bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col plan-card relative ${plan.name === 'Anual' ? 'border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.25)]' : ''} fade-in-up delay-${index + 3}`}
          >
            {plan.isPopular && !plan.highlight && (
              <span className="absolute top-0 right-0 bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg z-10">POPULAR</span>
            )}
            {plan.highlight && (
              <span className={`absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg z-10`}>{plan.highlight.text}</span>
            )}

            <h3 className="text-2xl font-bold text-indigo-400 mb-6">{plan.name}</h3>
            <div className="text-5xl font-extrabold text-white mb-2">
              R$ {plan.price.split(',')[0]}<span className="text-3xl text-gray-400">,{plan.price.split(',')[1]}</span>
            </div>
            {plan.name !== 'Mensal' && plan.name !== 'Plano Mensal' && (() => {
              const numeric = parseFloat(plan.price.replace('.', '').replace(',', '.'));
              const billed = plan.billedMonths || (
                plan.name === 'Trimestral' ? 3 :
                plan.name === 'Semestral' ? 6 :
                plan.name === 'Anual' ? 12 :
                1
              );
              const monthlyRaw = numeric / billed;
              const monthlyStr = monthlyRaw.toFixed(2).replace('.', ',');
              return (
                <div className="text-sm text-gray-300 mb-4">
                  Média mensal: <b className="text-white">R$ {monthlyStr}</b>
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
            <button
              onClick={() => openConfirm(plan)}
              data-analytics={`pricing_assinar_${index}`}
              className="mt-auto block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-center"
              aria-label={`Assinar o plano ${plan.name} via WhatsApp`}
            >
              Assinar Agora!
            </button>
          </div>
        ))}
      </div>

    </section>
  );
};

export default Pricing;
