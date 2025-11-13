import React, { useState, useEffect } from 'react';
import { FaCookieBite } from 'react-icons/fa';
import './cookieBanner.css';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if no prior choice stored
    const choice = localStorage.getItem('cookieChoice');
    setVisible(!choice);
  }, []);

  const choose = (value) => {
    localStorage.setItem('cookieChoice', value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <div className="bg-gray-900/90 backdrop-blur rounded-2xl shadow-2xl text-white p-4 md:p-5 flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-3 text-sm md:text-base">
            <FaCookieBite className="text-yellow-400 flex-shrink-0" size={22} />
            <p>
              Usamos cookies para melhorar sua experiência. Você pode aceitar ou recusar.
            </p>
          </div>
          <div className="flex md:ml-auto gap-2 w-full md:w-auto">
            <button onClick={() => choose('rejected')} className="w-full md:w-auto px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition">
              Recusar
            </button>
            <button onClick={() => choose('accepted')} className="w-full md:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition">
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
 
