import React, { useState, useEffect } from 'react';
import { FaCookieBite } from 'react-icons/fa';
import { trackEvent } from '../utils/analytics';
import './cookieBanner.css';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if no prior choice stored
    const choice = localStorage.getItem('cookieChoice');
    setVisible(!choice);
  }, []);

  const choose = (value) => {
    // Always set cookieChoice, regardless of accept/reject
    localStorage.setItem('cookieChoice', value);
    
    // Track cookie consent to analytics/dataLayer
    try {
      trackEvent('cookie_consent', {
        consent_choice: value,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Cookie tracking error', e);
    }

    // Also push to window.dataLayer for GTM
    if (window && window.dataLayer) {
      window.dataLayer.push({
        event: 'cookie_consent',
        consent_choice: value
      });
    }

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay escurecido (modal backdrop) */}
      <div className="absolute inset-0 bg-black/60" onClick={() => choose('rejected')}></div>
      
      {/* Modal content */}
      <div className="relative bg-gray-900 backdrop-blur rounded-2xl shadow-2xl text-white p-6 w-full max-w-md">
        <div className="flex items-start gap-4 mb-4">
          <FaCookieBite className="text-yellow-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-bold mb-2">Política de Cookies</h3>
            <p className="text-sm text-gray-300">
              Usamos cookies para melhorar sua experiência e coletar dados de navegação. Você pode aceitar ou recusar — ambas as opções serão registradas.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => choose('rejected')} 
            data-analytics="cookie_reject"
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition"
          >
            Recusar
          </button>
          <button 
            onClick={() => choose('accepted')} 
            data-analytics="cookie_accept"
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
