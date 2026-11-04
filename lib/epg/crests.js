// Escudos servidos em /escudos/<slug>.png (96 px, copiados de video-ads/escudos).
// crests.json lista os slugs disponíveis; time sem escudo fica só com o nome.
const SLUGS = new Set(require('./crests.json'));

const ALIASES = {
  'atletico-mg': 'atletico-mineiro',
  'athletico-pr': 'athletico-paranaense',
  'america-mg': 'america-mineiro',
  'operario-pr': 'operario-ferroviario',
  vasco: 'vasco-da-gama',
  bragantino: 'rb-bragantino',
  'red-bull-bragantino': 'rb-bragantino',
  remo: 'clube-do-remo',
  sport: 'sport-recife',
  psg: 'paris-saint-germain',
  dortmund: 'borussia-dortmund',
  lens: 'rc-lens',
  'le-havre': 'le-havre-ac',
};

const slugOf = (name) => name
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/\((?:[a-z]{2,4})\)/gi, '')
  .replace(/\b(?:sub-?\d{2}|feminino|feminina)\b/gi, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const crestFor = (name) => {
  const slug = slugOf(name);
  const file = ALIASES[slug] || slug;
  return SLUGS.has(file) ? `/escudos/${file}.png` : null;
};

module.exports = { crestFor, slugOf };
