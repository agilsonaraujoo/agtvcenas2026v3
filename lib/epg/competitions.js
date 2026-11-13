// Campeonato de cada jogo, lido do prefixo do título ("NBA: ...") ou da descrição que a emissora
// publica ("jogam pela 34ª rodada do Segundo Turno do Brasileirão"). Sem pista clara, o jogo
// fica em "Outros jogos": nunca chutamos o campeonato.
const { CODE_BY_NAME } = require('./standings');

const OTHER = { name: 'Outros jogos', football: false, order: 99 };

// [regex na descrição, nome, é futebol?, ordem na página]
const RULES = [
  [/Copa do Brasil Sub-20/i, 'Copa do Brasil Sub-20', true, 20],
  [/Copa do Brasil Feminina/i, 'Copa do Brasil Feminina', true, 21],
  [/Copa do Brasil/i, 'Copa do Brasil', true, 3],
  [/Brasileir[aã]o Feminino/i, 'Brasileirão Feminino', true, 22],
  [/S[eé]rie B|chegar à elite do futebol brasileiro/i, 'Brasileirão Série B', true, 2],
  [/Brasileir[aã]o/i, 'Brasileirão Série A', true, 1],
  [/Copa do Nordeste/i, 'Copa do Nordeste', true, 9],
  [/Supercopa do Brasil|Supercopa Rei/i, 'Supercopa do Brasil', true, 3],
  [/Recopa Sul-Americana/i, 'Recopa Sul-Americana', true, 5],
  [/Libertadores/i, 'Libertadores', true, 4],
  [/Sul-Americana/i, 'Sul-Americana', true, 5],
  [/Liga dos Campe[oõ]es|Champions League/i, 'Liga dos Campeões', true, 6],
  [/Liga Europa|Europa League/i, 'Liga Europa', true, 7],
  [/Liga Confer[eê]ncia|Conference League/i, 'Liga Conferência', true, 7],
  [/Liga das Na[cç][oõ]es de V[oô]lei|Liga das Na[cç][oõ]es Feminina de V|Liga das Na[cç][oõ]es Masculina de V/i, 'Liga das Nações de Vôlei', false, 40],
  // Seleções. A ESPN não diz o nome do torneio, só "uma competição entre seleções...".
  [/Liga das Na[cç][oõ]es da UEFA|UEFA Nations League|competi[cç][aã]o entre sele[cç][oõ]es/i, 'Liga das Nações', true, 6],
  [/Eliminat[oó]rias/i, 'Eliminatórias', true, 6],
  [/Copa Am[eé]rica/i, 'Copa América', true, 6],
  [/Eurocopa|Campeonato Europeu de sele/i, 'Eurocopa', true, 6],
  [/Mundial de Clubes|Copa do Mundo de Clubes/i, 'Mundial de Clubes', true, 6],
  [/Copa do Mundo Feminina Sub-17/i, 'Copa do Mundo Feminina Sub-17', true, 23],
  [/Copa do Mundo/i, 'Copa do Mundo', true, 8],
  [/Amistoso Internacional|amistoso internacional/i, 'Amistosos de seleções', true, 8],
  [/Copa do Rei|copa mais emblem[aá]tica da Espanha/i, 'Copa do Rei', true, 11],
  [/Copa da Inglaterra|FA Cup/i, 'Copa da Inglaterra', true, 11],
  [/Copa da Liga Inglesa|Carabao Cup|EFL Cup/i, 'Copa da Liga Inglesa', true, 12],
  [/Copa da It[aá]lia|Coppa Italia/i, 'Copa da Itália', true, 14],
  [/Campeonato Carioca|Cariocão/i, 'Campeonato Carioca', true, 9],
  [/Campeonato Mineiro/i, 'Campeonato Mineiro', true, 9],
  [/Campeonato Ga[uú]cho|Gauchão/i, 'Campeonato Gaúcho', true, 9],
  [/futebol argentino|Campeonato Argentino|Liga Profissional Argentina/i, 'Campeonato Argentino', true, 17],
  [/\bMLS\b|Major League Soccer/i, 'MLS', true, 17],
  [/Copa Intercontinental de Futsal/i, 'Copa Intercontinental de Futsal', false, 41],
  [/Paulista[^.]*Feminino Sub-20/i, 'Paulista Feminino Sub-20', true, 24],
  [/Paulist[aã]o|Campeonato Paulista/i, 'Paulistão', true, 9],
  [/segunda divis[aã]o inglesa/i, 'Championship (Inglaterra)', true, 12],
  [/Premier League|maior liga de futebol do mundo/i, 'Premier League', true, 10],
  [/La Liga|Campeonato Espanhol/i, 'La Liga', true, 11],
  [/Bundesliga/i, 'Bundesliga', true, 13],
  [/S[eé]rie A italiana|Campeonato Italiano|Calcio/i, 'Campeonato Italiano', true, 14],
  [/Ligue 1|Campeonato Franc[eê]s/i, 'Campeonato Francês', true, 15],
  [/Eredivisie|Campeonato Holand[eê]s/i, 'Campeonato Holandês', true, 16],
  [/Primeira Liga|Campeonato Portugu[eê]s|Liga Portugal/i, 'Campeonato Português', true, 16],
  [/Liga Saudita|Ar[aá]bia Saudita/i, 'Liga Saudita', true, 16],
  [/R[uú]ssia/i, 'Campeonato Russo', true, 17],
  [/Confedera[cç][aã]o Asi[aá]tica/i, 'Champions da Ásia', true, 18],
  [/Superliga|casa do v[oô]lei/i, 'Superliga de Vôlei', false, 40],
  [/futebol americano universit[aá]rio/i, 'Futebol americano universitário', false, 43],
];

const PREFIXES = {
  nba: ['NBA', 30],
  nfl: ['NFL', 31],
  nhl: ['NHL', 32],
  nbb: ['NBB', 33],
};

const competitionOf = ({ league, description }) => {
  if (league) {
    const known = PREFIXES[league.toLowerCase()];
    if (known) return { name: known[0], football: false, order: known[1] };
  }
  const text = description || '';
  for (const [pattern, name, football, order] of RULES) {
    if (pattern.test(text)) {
      // table: código da tabela de classificação, quando o campeonato tem uma (só futebol).
      return CODE_BY_NAME[name] ? { name, football, order, table: CODE_BY_NAME[name] } : { name, football, order };
    }
  }
  // Prefixo desconhecido ("Catarinense de Vôlei Feminino: ...") já é o nome do torneio.
  if (league) return { name: league, football: false, order: 50 };
  return OTHER;
};

module.exports = { competitionOf };
