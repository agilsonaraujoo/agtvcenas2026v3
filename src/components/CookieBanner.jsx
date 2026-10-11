import React, { useState, useEffect } from 'react';
import { FaCookieBite } from 'react-icons/fa';
import { trackEvent, loadGoogleTagManager } from '../utils/analytics';
import './cookieBanner.css';

// Faixa de cookies no rodapé: não bloqueia o site e só some quando a pessoa escolhe.
// "Aceitar" e "Recusar" têm o mesmo tamanho e ficam lado a lado (exigência da LGPD/ANPD);
// o destaque visual vai para "Aceitar".
const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem('cookieChoice'));
    } catch (e) {
      setVisible(true);
    }
  }, []);

  const choose = (value) => {
    try {
      localStorage.setItem('cookieChoice', value);
    } catch (e) {
      // localStorage bloqueado: a escolha vale só para esta visita.
    }
    if (value === 'accepted') loadGoogleTagManager();

    // trackEvent já envia para o dataLayer do GTM.
    trackEvent('cookie_consent', {
      consent_choice: value,
      timestamp: new Date().toISOString()
    });

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="cookie-banner fixed inset-x-0 z-[60] px-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-[#101116]/95 p-4 text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-lg sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex items-start gap-3">
          <FaCookieBite className="mt-0.5 shrink-0 text-[#b7ff4a]" size={20} aria-hidden="true" />
          <p className="text-sm leading-5 text-gray-300">
            Registramos visitas em métricas agregadas sem cookies. Se você aceitar, também medimos cliques e conversões.
            Você pode recusar sem perder nada do site.
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => choose('rejected')}
            data-analytics="cookie_reject"
            className="min-h-11 rounded-xl border border-white/20 px-5 text-sm font-semibold text-gray-200 transition hover:border-white/40 hover:bg-white/5"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            data-analytics="cookie_accept"
            className="min-h-11 rounded-xl bg-[#b7ff4a] px-5 text-sm font-extrabold text-[#10130a] shadow-[0_0_20px_rgba(183,255,74,0.2)] transition hover:bg-[#ceff83]"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
