import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/agtv-theme.css';
import { currentPath, isSchedulePath, movedSectionUrl } from './utils/routes';

// O site não tem roteador: /obrigado é a volta do pagamento do Mercado Pago e /admin é a página do dono.
// Cada página vem num arquivo próprio: quem abre /programacao no celular não baixa a página de vendas inteira.
const App = lazy(() => import('./App'));
const ThankYou = lazy(() => import('./components/ThankYou'));
const Admin = lazy(() => import('./components/Admin'));
const GamesPage = lazy(() => import('./components/SectionPage').then((module) => ({ default: module.GamesPage })));
const SchedulePage = lazy(() => import('./components/SectionPage').then((module) => ({ default: module.SchedulePage })));

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
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </React.StrictMode>
  );
}
