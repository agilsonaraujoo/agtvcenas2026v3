export const WHATSAPP_NUMBER = '5583986913481';

// Cada categoria leva o artigo certo ("o filme", "a série"), para a mensagem
// não sair com o gênero trocado.
const CATEGORIES = {
  filme: { article: 'o', label: 'filme' },
  serie: { article: 'a', label: 'série' },
  anime: { article: 'o', label: 'anime' },
  documentario: { article: 'o', label: 'documentário' },
  reality: { article: 'o', label: 'reality show' },
  desenho: { article: 'o', label: 'desenho' },
};

// category vem da IA (filme, serie, anime...); sem ela, usamos o tipo do TMDB.
export const resolveCategory = (category, mediaType) => (
  CATEGORIES[category] || (mediaType === 'tv' ? CATEGORIES.serie : CATEGORIES.filme)
);

export const buildWhatsappLink = (title, { category, mediaType } = {}) => {
  const { article, label } = resolveCategory(category, mediaType);
  const message = `Olá, vim pelo site AGTV CENAS e gostaria de um teste grátis para assistir ${article} ${label} "${title}".`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
