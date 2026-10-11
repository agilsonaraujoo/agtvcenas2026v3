import React, { useState, useEffect } from 'react';
import { plans, commonFeatures, monthlyReferencePrice } from '../data/pricingPlans';
import { trackEvent } from '../utils/analytics';
import './pricing.css';
import '../styles/animations.css';

const parsePrice = (price) => parseFloat(price.replace('.', '').replace(',', '.'));
const formatBRL = (value) => value.toFixed(2).replace('.', ',');

// Valores calculados de cada plano: mensal equivalente e economia sobre o mensal.
const getPlanNumbers = (plan) => {
  const total = parsePrice(plan.price);
  const months = plan.billedMonths || 1;
  const fullPrice = monthlyReferencePrice * months;
  const savings = fullPrice - total;
  return {
    total,
    months,
    perMonth: total / months,
    savings,
    savingsPercent: Math.round((savings / fullPrice) * 100),
    hasSavings: savings > 0.5,
  };
};

const billingLabel = (months) => (months === 1 ? 'por mês' : `a cada ${months} meses`);
const screensLabel = (screens) => (screens === 1 ? '1 tela por vez' : `${screens} telas ao mesmo tempo`);

const CheckIcon = () => (
  <svg className="mr-2 h-5 w-5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
  </svg>
);

const Pricing = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  // Plano marcado no seletor do celular; começa no de melhor custo.
  const [mobilePlanIndex, setMobilePlanIndex] = useState(() => {
    const best = plans.findIndex((plan) => plan.highlight);
    return best >= 0 ? best : 0;
  });
  const mobilePlan = plans[mobilePlanIndex];
  const mobileNumbers = getPlanNumbers(mobilePlan);

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

      <div className="container mx-auto mb-6 max-w-xl rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:mb-8 sm:px-6 md:max-w-none">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 sm:text-sm">Todos os planos incluem</p>
        <ul className="grid grid-cols-1 gap-y-2 text-sm text-gray-200 min-[400px]:grid-cols-2 min-[400px]:gap-x-4 md:flex md:flex-wrap md:justify-center md:gap-x-6 md:text-base">
          {commonFeatures.map((feature) => (
            <li key={feature} className="flex items-center">
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Celular: seletor compacto com um único botão de assinar, em vez de 4 cards longos. */}
      <div className="mx-auto max-w-xl md:hidden">
        <div role="radiogroup" aria-label="Escolha o plano" className="space-y-2.5">
          {plans.map((plan, index) => {
            const numbers = getPlanNumbers(plan);
            const selected = index === mobilePlanIndex;
            const badge = plan.highlight ? plan.highlight.text : plan.isPopular ? 'POPULAR' : null;

            return (
              <button
                key={plan.name}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMobilePlanIndex(index)}
                data-analytics={`pricing_mobile_select_${plan.name.toLowerCase()}`}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${selected ? 'border-[#b7ff4a] bg-[#b7ff4a]/[0.07] shadow-[0_0_24px_rgba(183,255,74,0.12)]' : 'border-white/10 bg-gray-800/80 active:bg-gray-800'}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-[#b7ff4a]' : 'border-gray-500'}`}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#b7ff4a]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-base font-bold text-white">{plan.name}</span>
                    {badge && (
                      <span className="rounded-full bg-purple-500/90 px-2 py-0.5 text-[10px] font-bold uppercase leading-4 text-white">
                        {badge.replace('⭐ ', '')}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    {numbers.months === 1 ? plan.description : `R$ ${plan.price} ${billingLabel(numbers.months)}`}
                    {numbers.hasSavings && <span className="font-semibold text-green-400"> · economize {numbers.savingsPercent}%</span>}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-extrabold leading-6 text-white">R$ {formatBRL(numbers.perMonth)}</span>
                  <span className="block text-[11px] text-gray-400">por mês</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-gray-800/80 p-4" aria-live="polite">
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start">
              <CheckIcon />
              <span>Qualidade <b className="text-white">{mobilePlan.quality}</b></span>
            </li>
            <li className="flex items-start">
              <CheckIcon />
              <span>{screensLabel(mobilePlan.screens)}</span>
            </li>
            {mobileNumbers.hasSavings && (
              <li className="flex items-start">
                <CheckIcon />
                <span>Economia de <b className="text-green-400">R$ {formatBRL(mobileNumbers.savings)}</b> em relação ao mensal</span>
              </li>
            )}
          </ul>
          <button
            type="button"
            onClick={() => openConfirm(mobilePlan)}
            data-analytics={`pricing_mobile_assinar_${mobilePlan.name.toLowerCase()}`}
            className="mt-4 flex min-h-[3.25rem] w-full flex-col items-center justify-center rounded-xl bg-[#b7ff4a] px-4 py-2.5 font-extrabold text-[#10130a] shadow-[0_0_24px_rgba(183,255,74,0.18)] transition active:scale-[0.98]"
            aria-label={`Assinar o plano ${mobilePlan.name} por R$ ${mobilePlan.price} via WhatsApp`}
          >
            <span className="text-base">Assinar {mobilePlan.name}</span>
            <span className="text-xs font-semibold opacity-80">R$ {mobilePlan.price} {billingLabel(mobileNumbers.months)} · via WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {plans.map((plan, index) => {
          const { total, months, savings, savingsPercent } = getPlanNumbers(plan);

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
                <span>{screensLabel(plan.screens)}</span>
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
