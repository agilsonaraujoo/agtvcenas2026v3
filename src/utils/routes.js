// O site não tem roteador: cada endereço carrega sua página (ver src/index.js).
export const currentPath = () => window.location.pathname.replace(/\/+$/, '');

// Âncoras como #planos só existem na página inicial; nas outras páginas o link volta para ela.
export const sectionHref = (hash) => (currentPath() === '' ? hash : `/${hash}`);

// Cada aba da programação tem endereço próprio (/programacao/filmes) para mandar o link direto.
export const SCHEDULE_TABS = [
  { key: 'aovivo', slug: 'ao-vivo', label: 'TV ao vivo' },
  { key: 'filmes', slug: 'filmes', label: 'Filmes' },
  { key: 'series', slug: 'series', label: 'Séries' },
  { key: 'variedades', slug: 'variedades', label: 'Variedades' },
];

export const scheduleTabFromPath = () => {
  const match = currentPath().match(/^\/programacao\/([^/]+)$/);
  const tab = match && SCHEDULE_TABS.find((item) => item.slug === match[1].toLowerCase());
  return tab ? tab.key : null;
};

export const scheduleTabPath = (key) => {
  const tab = SCHEDULE_TABS.find((item) => item.key === key);
  return tab ? `/programacao/${tab.slug}` : '/programacao';
};

// Categoria desconhecida (link digitado errado) abre a programação na primeira aba.
export const isSchedulePath = () => /^\/programacao(?:\/[^/]+)?$/.test(currentPath());

// Links antigos que apontavam para as seções, agora páginas próprias.
const MOVED_SECTIONS = { '#jogos': '/jogos', '#programacao': '/programacao' };

export const movedSectionUrl = () => {
  const target = MOVED_SECTIONS[window.location.hash];
  return target && currentPath() === '' ? `${target}${window.location.search}` : null;
};
