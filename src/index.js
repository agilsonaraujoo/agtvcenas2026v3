import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/agtv-theme.css';
import App from './App';
import ThankYou from './components/ThankYou';
import Admin from './components/Admin';

// O site não tem roteador: /obrigado é a volta do pagamento do Mercado Pago e /admin é a página do dono.
const PAGES = { '/obrigado': ThankYou, '/admin': Admin };
const Page = PAGES[window.location.pathname.replace(/\/+$/, '')] || App;

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
