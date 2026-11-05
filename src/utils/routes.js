// O site não tem roteador: cada endereço carrega sua página (ver src/index.js).
export const currentPath = () => window.location.pathname.replace(/\/+$/, '');

// Âncoras como #planos só existem na página inicial; nas outras páginas o link volta para ela.
export const sectionHref = (hash) => (currentPath() === '' ? hash : `/${hash}`);

// Links antigos que apontavam para as seções, agora páginas próprias.
const MOVED_SECTIONS = { '#jogos': '/jogos', '#programacao': '/programacao' };

export const movedSectionUrl = () => {
  const target = MOVED_SECTIONS[window.location.hash];
  return target && currentPath() === '' ? `${target}${window.location.search}` : null;
};
