import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/agtv-theme.css';
import App from './App';
import ThankYou from './components/ThankYou';

// O site não tem roteador: /obrigado é a volta do pagamento da InfinitePay.
const Page = window.location.pathname.replace(/\/+$/, '') === '/obrigado' ? ThankYou : App;

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
