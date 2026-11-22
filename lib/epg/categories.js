// Modalidade do jogo (futsal, feminino, sub-20...), lida só do que a emissora escreve no título
// ou na sinopse. Sem menção clara, não marca nada: jogo sem etiqueta é o profissional masculino,
// que é o padrão da grade. A API manda todas; quem mostra o campeonato junto (a arte, com o
// título do grupo) esconde as que já estão no nome dele.
const normalize = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// [regex, etiqueta]; a ordem aqui é a ordem em que aparecem ("Futsal · Feminino · Sub-20").
const SPORT_RULES = [
  [/\bfutsal\b|futebol de sal[aã]o/i, 'Futsal'],
  [/beach soccer|futebol de areia/i, 'Futebol de areia'],
  [/futebol society/i, 'Society'],
  [/v[oô]lei de praia/i, 'Vôlei de praia'],
  [/v[oô]lei/i, 'Vôlei'],
  [/basquete/i, 'Basquete'],
  [/handebol/i, 'Handebol'],
];
const GENDER_RULES = [
  [/\bfeminin[oa]s?\b/i, 'Feminino'],
  [/\bmasculin[oa]s?\b/i, 'Masculino'],
];

const tagsOf = ({ title = '', description = '', competition = '' }) => {
  const text = `${title} ${description || ''}`;
  const tags = [];
  const sport = SPORT_RULES.find(([pattern]) => pattern.test(text));
  if (sport) tags.push(sport[1]);
  // As duas na mesma sinopse ("vôlei masculino e feminino") não dizem qual é este jogo.
  const genders = GENDER_RULES.filter(([pattern]) => pattern.test(text));
  if (genders.length === 1) tags.push(genders[0][1]);
  const age = /\bsub[- ]?(\d{2})\b/i.exec(text);
  if (age) tags.push(`Sub-${age[1]}`);
  else if (/\bj[uú]nior(?:es)?\b|\bjuvenil\b/i.test(text)) tags.push('Base');

  const inName = normalize(competition);
  return tags.filter((tag) => !inName.includes(normalize(tag)));
};

module.exports = { tagsOf };
