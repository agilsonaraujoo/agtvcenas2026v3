import React, { useEffect } from 'react';
import SiteShell from './SiteShell';
import LiveSchedule from './LiveSchedule';
import GamesToday from './GamesToday';
import { TRIAL_URL } from './Header';
import { scheduleTabFromPath, scheduleTabPath } from '../utils/routes';
import '../styles/section-page.css';

const setMeta = (selector, attribute, value) => {
  const element = document.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
};

// Página própria de uma seção: abre direto no conteúdo, sem passar pela página de vendas.
const SectionPage = ({ title, description, path, children }) => {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', `https://agtvcenas.com.br${path}`);
  }, [title, description, path]);

  return (
    <SiteShell>
      <main className="section-page">
        {children}
        <aside className="section-page-cta" aria-label="Teste grátis">
          <p><strong>Ainda não é cliente?</strong> Teste a AGTV grátis por 3 horas.</p>
          <a href={TRIAL_URL} target="_blank" rel="noreferrer" data-analytics="cta_trial">Testar grátis</a>
        </aside>
      </main>
    </SiteShell>
  );
};

export const GamesPage = () => (
  <SectionPage
    title="Jogos de hoje com placar ao vivo | AGTV"
    description="Jogos de hoje e de amanhã separados por campeonato, com horário de Brasília, canais, placar ao vivo e tabela de classificação."
    path="/jogos"
  >
    <GamesToday />
  </SectionPage>
);

const SCHEDULE_TITLES = {
  filmes: 'Filmes na TV hoje | AGTV',
  series: 'Séries na TV hoje | AGTV',
  variedades: 'Variedades na TV hoje | AGTV',
  aovivo: 'TV ao vivo: canais abertos e de esporte | AGTV',
};

export const SchedulePage = () => {
  const tab = scheduleTabFromPath();
  return (
    <SectionPage
      title={SCHEDULE_TITLES[tab] || 'Programação da TV ao vivo | AGTV'}
      description="Veja o que está passando agora e o que vem a seguir nos canais abertos, de esporte, filmes, séries e variedades. Horários de Brasília."
      path={tab ? scheduleTabPath(tab) : '/programacao'}
    >
      <LiveSchedule />
    </SectionPage>
  );
};
