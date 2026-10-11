import React, { useState, useEffect } from 'react';
import { plans, commonFeatures, monthlyReferencePrice } from '../data/pricingPlans';
import { trackEvent } from '../utils/analytics';
import './pricing.css';
import '../styles/animations.css';

const parsePrice = (price) => parseFloat(price.replace('.', '').replace(',', '.'));
const formatBRL = (value) => value.toFixed(2).replace('.', ',');

const CheckIcon = () => (
  <svg className="mr-2 h-5 w-5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
  </svg>
);

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
    // Evento padrão do GA4 para "começou a comprar", com o valor do plano.
    trackEvent('begin_checkout', {
      currency: 'BRL',
      value: parsePrice(plan.price),
      plan: plan.name,
      items: [{ item_id: plan.name.toLowerCase(), item_name: `AGTV ${plan.name}`, price: parsePrice(plan.price), quantity: 1 }],
    });

    const priceDisplay = plan.price;
    const message = `Olá, vim pelo site AGTV CENAS e gostaria de assinar o plano ${plan.name} pelo valor de R$ ${priceDisplay}`;
    const waLink = `https://wa.me/5583986913481?text=${encodeURIComponent(message)}`;
    trackEvent('whatsapp_click', { location: 'planos', plan: plan.name });
    window.open(waLink, '_blank', 'noopener');
  };

  return (
    <section 
      id="planos" 
      className="bg-gray-900 px-4 py-12 text-white pricing-section fade-in-up sm:py-16"
    >
      <div className="container mx-auto mb-8 text-center sm:mb-12">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">DIVERSÃO DO SEU JEITO</span>
          <h2 className="agtv-section-title fade-in-up delay-1">
            Escolha o Plano <span>Ideal para Você</span>
          </h2>
        </div>
        <p className="agtv-section-description fade-in-up delay-2">
          Diversão sem limites ao seu alcance.
        </p>
      </div>

      <div className="container mx-auto mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:mb-8 sm:px-6">
        <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-400">Todos os planos incluem</p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-200 sm:text-base">
          {commonFeatures.map((feature) => (
            <li key={feature} className="flex items-center">
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {plans.map((plan, index) => {
          const total = parsePrice(plan.price);
          const months = plan.billedMonths || 1;
          const fullPrice = monthlyReferencePrice * months;
          const savings = fullPrice - total;
          const savingsPercent = Math.round((savings / fullPrice) * 100);

          return (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-lg bg-gray-800 p-6 shadow-xl plan-card sm:p-8 ${plan.name === 'Anual' ? 'border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.25)]' : ''} fade-in-up delay-${index + 3}`}
          >
            {plan.isPopular && !plan.highlight && (
              <span className="absolute top-0 right-0 bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg z-10">POPULAR</span>
            )}
            {plan.highlight && (
              <span className={`absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg z-10`}>{plan.highlight.text}</span>
            )}

            <h3 className="text-2xl font-bold text-indigo-400 mb-1">{plan.name}</h3>
            <p className="mb-5 text-sm text-gray-400">{plan.description}</p>
            <div className="mb-1 text-4xl font-extrabold text-white sm:text-5xl">
              R$ {plan.price.split(',')[0]}<span className="text-2xl text-gray-400 sm:text-3xl">,{plan.price.split(',')[1]}</span>
            </div>
            <p className="mb-4 text-sm text-gray-300">
              {months === 1 ? 'por mês' : <>equivale a <b className="text-white">R$ {formatBRL(total / months)}</b> por mês</>}
            </p>
            <div className="mb-5 min-h-[2.25rem]">
              {savings > 0.5 && (
                <span className="inline-block rounded-full bg-green-500/15 px-3 py-1.5 text-sm font-bold text-green-400">
                  Economize R$ {formatBRL(savings)} ({savingsPercent}%)
                </span>
              )}
            </div>
            <ul className="mb-8 flex-grow space-y-3 text-base text-gray-300">
              <li className="flex items-start">
                <CheckIcon />
                <span>Qualidade <b className="text-white">{plan.quality}</b></span>
              </li>
              <li className="flex items-start">
                <CheckIcon />
                <span>{plan.screens === 1 ? '1 tela por vez' : `${plan.screens} telas ao mesmo tempo`}</span>
              </li>
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
          );
        })}
      </div>

    </section>
  );
};

export default Pricing;
