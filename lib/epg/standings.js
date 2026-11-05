// Tabela de classificação do football-data.org (só os campeonatos de futebol do plano grátis).
// A tabela muda poucas vezes por dia: guardamos 10 min em memória para poupar as 10 chamadas/min.
const { crestFor } = require('./crests');

const API_URL = 'https://api.football-data.org/v4/competitions';
const CACHE_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

// Códigos do football-data liberados no plano grátis, com o nome que usamos no site.
const COMPETITIONS = {
  BSA: 'Brasileirão Série A',
  PL: 'Premier League',
  ELC: 'Championship (Inglaterra)',
  PD: 'La Liga',
  SA: 'Campeonato Italiano',
  BL1: 'Bundesliga',
  FL1: 'Campeonato Francês',
  DED: 'Campeonato Holandês',
  PPL: 'Campeonato Português',
  CL: 'Liga dos Campeões',
  EC: 'Eurocopa',
  WC: 'Copa do Mundo',
};

const CODE_BY_NAME = Object.fromEntries(Object.entries(COMPETITIONS).map(([code, name]) => [name, code]));

const cache = new Map();

// A API usa nomes curtos que o torcedor não fala ("Paranaense", "Mineiro"): trocamos pelo nome
// usado na grade e no resto do site.
const DISPLAY_NAMES = {
  Paranaense: 'Athletico-PR',
  Mineiro: 'Atlético-MG',
  'Vasco da Gama': 'Vasco',
  'Clube do Remo': 'Remo',
};

const row = (item) => {
  const original = item.team.shortName || item.team.name;
  const team = DISPLAY_NAMES[original] || original;
  return {
    position: item.position,
    team,
    crest: crestFor(team) || crestFor(original) || crestFor(item.team.name || '') || item.team.crest || null,
    played: item.playedGames,
    won: item.won,
    draw: item.draw,
    lost: item.lost,
    goalDifference: item.goalDifference,
    points: item.points,
  };
};

const groupName = (group) => (group ? group.replace(/^GROUP_/, 'Grupo ').replace(/_/g, ' ') : null);

const fetchStandings = async (code) => {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key || !COMPETITIONS[code]) return null;
  const hit = cache.get(code);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  try {
    const response = await fetch(`${API_URL}/${code}/standings`, {
      headers: { 'X-Auth-Token': key },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const tables = (json.standings || [])
      .filter((standing) => standing.type === 'TOTAL')
      .map((standing) => ({ group: groupName(standing.group), rows: (standing.table || []).map(row) }))
      .filter((table) => table.rows.length);
    const data = {
      code,
      name: COMPETITIONS[code],
      matchday: json.season ? json.season.currentMatchday : null,
      tables,
    };
    cache.set(code, { at: Date.now(), data });
    return data;
  } catch (error) {
    console.error(`[tabela] ${code} indisponível:`, error.message);
    // Uma falha passageira não apaga a última tabela boa.
    return hit ? hit.data : null;
  }
};

module.exports = { COMPETITIONS, CODE_BY_NAME, fetchStandings };
