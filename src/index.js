import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/agtv-theme.css';
import App from './App';
import ThankYou from './components/ThankYou';
import Admin from './components/Admin';
import { GamesPage, SchedulePage } from './components/SectionPage';
import { currentPath, isSchedulePath, movedSectionUrl } from './utils/routes';

// O site não tem roteador: /obrigado é a volta do pagamento do Mercado Pago e /admin é a página do dono.
const PAGES = {
  '/obrigado': ThankYou,
  '/admin': Admin,
  '/jogos': GamesPage,
  '/programacao': SchedulePage,
};
const Page = PAGES[currentPath()] || (isSchedulePath() ? SchedulePage : App);

const moved = movedSectionUrl();
if (moved) {
  window.location.replace(moved);
} else {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Page />
    </React.StrictMode>
  );
}
