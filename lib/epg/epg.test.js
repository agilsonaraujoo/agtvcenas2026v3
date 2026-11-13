const test = require('node:test');
const assert = require('node:assert/strict');
const { parseXmltvTime, dateKey, dayRange, isValidDateKey } = require('./time');
const { findCurrentAndNext, programsForDate, hasUpcomingData } = require('./schedule');
const { parseXmltv } = require('./xmltv');
const { buildDataset } = require('./dataset');
const { CHANNELS } = require('./channels');

const xml = (programmes) => `<?xml version="1.0" encoding="UTF-8"?><tv generator-info-name="t">
<channel id="A"><display-name>A</display-name></channel>${programmes}</tv>`;

test('parseXmltvTime respeita o deslocamento', () => {
  assert.equal(parseXmltvTime('20261007120000 -0300').toISOString(), '2026-10-07T15:00:00.000Z');
  assert.equal(parseXmltvTime('20261007120000 +0000').toISOString(), '2026-10-07T12:00:00.000Z');
  assert.equal(parseXmltvTime('lixo'), null);
});

test('dateKey usa o fuso de Brasília', () => {
  assert.equal(dateKey(new Date('2026-10-08T02:30:00Z')), '2026-10-07');
  assert.equal(dateKey(new Date('2026-10-08T03:00:00Z')), '2026-10-08');
});

test('dayRange cobre 24h de Brasília e valida datas', () => {
  const { start, end } = dayRange('2026-10-07');
  assert.equal(start.toISOString(), '2026-10-07T03:00:00.000Z');
  assert.equal(end.toISOString(), '2026-10-08T03:00:00.000Z');
  assert.equal(isValidDateKey('2026-02-30'), false);
  assert.equal(isValidDateKey('07/10/2026'), false);
  assert.equal(isValidDateKey('2026-10-07'), true);
});

const programs = [
  { title: 'P1', start: '2026-10-07T10:00:00.000Z', end: '2026-10-07T12:00:00.000Z' },
  { title: 'P2', start: '2026-10-07T12:00:00.000Z', end: '2026-10-07T14:00:00.000Z' },
  { title: 'P3', start: '2026-10-07T14:00:00.000Z', end: '2026-10-07T16:00:00.000Z' },
];

test('CURRENT é start <= agora < end e NEXT é o próximo start', () => {
  const at = (iso) => findCurrentAndNext(programs, Date.parse(iso));
  assert.equal(at('2026-10-07T11:59:59Z').current.title, 'P1');
  assert.equal(at('2026-10-07T12:00:00Z').current.title, 'P2');
  assert.equal(at('2026-10-07T12:00:00Z').next.title, 'P3');
  assert.equal(at('2026-10-07T15:00:00Z').next, null);
  assert.equal(at('2026-10-07T09:00:00Z').current, null);
  assert.equal(at('2026-10-07T09:00:00Z').next.title, 'P1');
});

test('hasUpcomingData e programsForDate', () => {
  assert.equal(hasUpcomingData(programs, Date.parse('2026-10-07T17:00:00Z')), false);
  assert.equal(hasUpcomingData(programs, Date.parse('2026-10-07T15:00:00Z')), true);
  assert.equal(programsForDate(programs, '2026-10-07').length, 3);
  assert.equal(programsForDate(programs, '2026-10-08').length, 0);
});

test('parseXmltv normaliza, calcula duração e ignora entradas inválidas', () => {
  const parsed = parseXmltv(xml(`
    <programme start="20261007120000 -0300" stop="20261007140000 -0300" channel="A"><title lang="pt">Filme</title><desc lang="pt">Desc</desc><length units="minutes">7200</length><rating system="Brazil"><value>[14]</value></rating></programme>
    <programme start="20261007140000 -0300" stop="20261007130000 -0300" channel="A"><title lang="pt">Invertido</title></programme>
    <programme start="20261007140000 -0300" stop="20261007150000 -0300" channel="A"><title lang="pt"></title></programme>`));
  assert.equal(parsed.programmes.A.length, 1);
  const [program] = parsed.programmes.A;
  assert.equal(program.title, 'Filme');
  assert.equal(program.duration, 120);
  assert.equal(program.start, '2026-10-07T15:00:00.000Z');
  assert.equal(program.rating, '14');
});

const NOW = Date.parse('2026-10-07T17:00:00Z');
const channel = CHANNELS.find((item) => item.slug === 'hbo');
const parsedWith = (id, startIso, endIso) => ({
  parsed: {
    generator: null,
    channels: {},
    programmes: { [id]: [{ title: 'X', description: null, start: startIso, end: endIso, duration: 60, category: null, rating: null }] },
  },
});

test('fallback: fonte desatualizada cai para o iptv-org', () => {
  const dataset = buildDataset({
    'brazilTvEpg/claro': parsedWith('HBO', '2026-09-20T10:00:00.000Z', '2026-09-20T11:00:00.000Z'),
    'brazilTvEpg/vivoplay': { error: 'fora do ar' },
    'iptv-org': parsedWith('HBO.br@SD', '2026-10-07T16:00:00.000Z', '2026-10-07T18:00:00.000Z'),
  }, { now: NOW, channels: [channel] });
  assert.equal(dataset.channels.hbo.source, 'iptv-org');
  assert.equal(dataset.channels.hbo.channelId, 'HBO.br@SD');
  assert.equal(dataset.missing.length, 0);
});

test('prioridade: BrazilTVEPG vence quando está atualizado', () => {
  const dataset = buildDataset({
    'brazilTvEpg/claro': parsedWith('HBO', '2026-10-07T16:00:00.000Z', '2026-10-07T18:00:00.000Z'),
    'iptv-org': parsedWith('HBO.br@SD', '2026-10-07T16:00:00.000Z', '2026-10-07T18:00:00.000Z'),
  }, { now: NOW, channels: [channel] });
  assert.equal(dataset.channels.hbo.source, 'brazilTvEpg/claro');
});

test('sem dados em nenhuma fonte: canal vai para missing, sem inventar', () => {
  const dataset = buildDataset({
    'brazilTvEpg/claro': { error: 'x' },
    'brazilTvEpg/vivoplay': { error: 'x' },
    'iptv-org': { error: 'x' },
  }, { now: NOW, channels: [channel] });
  assert.deepEqual(Object.keys(dataset.channels), []);
  assert.equal(dataset.missing[0].attempts.length, 3);
  assert.equal(dataset.missing[0].attempts[0].status, 'fonte-indisponivel');
});

const { gamesForDate, parseGame } = require('./games');

test('jogos: só partidas ao vivo, sem reprise nem chamada', () => {
  const live = { category: 'live broadcast' };
  assert.deepEqual(parseGame({ ...live, title: 'Bragantino x Santos - ao vivo' }), { league: null, home: 'Bragantino', away: 'Santos' });
  assert.equal(parseGame({ ...live, title: 'NBA: Miami Heat x Los Angeles Lakers - ao vivo' }).league, 'NBA');
  assert.equal(parseGame({ category: 'sports (general)', title: 'Santos x Palmeiras' }), null);
  assert.equal(parseGame({ category: 'sports (general)', title: 'Dia 03/11: Chapecoense x Mirassol' }), null);
  assert.equal(parseGame({ ...live, title: 'Sportscenter - ao vivo' }), null);
});

test('jogos: o mesmo jogo em dois canais vira um item com os dois canais', () => {
  const program = { title: 'Bragantino x Santos - ao vivo', category: 'live broadcast', description: 'Pela 34ª rodada. Mais texto.', start: '2026-11-02T22:30:00.000Z', end: '2026-11-03T01:00:00.000Z' };
  const games = gamesForDate([
    { slug: 'sportv', channel: 'SporTV', group: 'esportes', programs: [program] },
    { slug: 'premiere', channel: 'Premiere', group: 'esportes', programs: [{ ...program, end: '2026-11-03T01:10:00.000Z' }] },
    { slug: 'hbo', channel: 'HBO', group: 'filmes', programs: [program] },
  ], '2026-11-02');
  assert.equal(games.length, 1);
  assert.deepEqual(games[0].channels.map((c) => c.name), ['SporTV', 'Premiere']);
  assert.equal(games[0].end, '2026-11-03T01:10:00.000Z');
  assert.equal(games[0].description, 'Pela 34ª rodada.');
});

const { reusePrevious } = require('./dataset');

test('fonte fora do ar: reaproveita a grade anterior que ainda tem programas por vir', () => {
  const dataset = buildDataset({
    'brazilTvEpg/claro': { error: 'timeout' },
    'brazilTvEpg/vivoplay': { error: 'timeout' },
    'iptv-org': { error: 'timeout' },
  }, { now: NOW, channels: [channel] });
  const previous = { channels: { hbo: { slug: 'hbo', channel: 'HBO', group: 'filmes', source: 'brazilTvEpg/claro', programs: [
    { title: 'Velho', start: '2026-10-06T10:00:00.000Z', end: '2026-10-06T12:00:00.000Z' },
    { title: 'Agora', start: '2026-10-07T16:00:00.000Z', end: '2026-10-07T18:00:00.000Z' },
  ] } } };
  reusePrevious(dataset, previous, { now: NOW });
  assert.equal(dataset.missing.length, 0);
  assert.equal(dataset.channels.hbo.source, 'anterior:brazilTvEpg/claro');
  assert.deepEqual(dataset.channels.hbo.programs.map((p) => p.title), ['Agora']);

  const stale = buildDataset({ 'brazilTvEpg/claro': { error: 'x' } }, { now: NOW, channels: [channel] });
  reusePrevious(stale, { channels: { hbo: { ...previous.channels.hbo, programs: previous.channels.hbo.programs.slice(0, 1) } } }, { now: NOW });
  assert.equal(stale.missing.length, 1);
});

const { competitionOf } = require('./competitions');
const { crestFor } = require('./crests');
const { withScores, sameTeam } = require('./scores');

test('campeonato vem do prefixo ou da descrição, sem chute', () => {
  assert.equal(competitionOf({ description: 'Flamengo e Grêmio jogam pela 34ª rodada do Segundo Turno do Brasileirão, no Maracanã.' }).name, 'Brasileirão Série A');
  assert.equal(competitionOf({ description: 'As emoções da Série B continuam fortes.' }).name, 'Brasileirão Série B');
  assert.equal(competitionOf({ description: 'jogam a rodada de volta da Quartas de Final da Copa do Brasil Sub-20' }).name, 'Copa do Brasil Sub-20');
  assert.equal(competitionOf({ league: 'NBA', description: 'basquete' }).name, 'NBA');
  assert.equal(competitionOf({ league: 'NBA' }).football, false);
  assert.equal(competitionOf({ description: 'Histórias de heróis, anjos caídos e semideuses.' }).name, 'Outros jogos');
});

test('seleções e copas nacionais têm campeonato próprio', () => {
  assert.equal(competitionOf({ description: 'Sérvia e Alemanha jogam pela 5ª rodada da fase de grupos da Liga das Nações da UEFA, no Rajko Mitic.' }).name, 'Liga das Nações');
  assert.equal(competitionOf({ description: 'Uma competição entre seleções com o objetivo de aumentar a competitividade.' }).name, 'Liga das Nações');
  assert.equal(competitionOf({ description: 'Brasil e Japão jogam o Amistoso Internacional, no National Stadium.' }).name, 'Amistosos de seleções');
  assert.equal(competitionOf({ description: 'É a copa mais emblemática da Espanha, uma competição em que times pequenos sonham.' }).name, 'Copa do Rei');
  assert.equal(competitionOf({ description: 'O Sem Bloqueio acompanha a Seleção Feminina na Liga das Nações de Vôlei.' }).football, false);
  assert.equal(competitionOf({ description: 'Brasil e Japão jogam o Amistoso Internacional.' }).football, true);
});

test('escudo pelo nome do time, com apelidos da grade', () => {
  assert.equal(crestFor('Atlético-MG'), '/escudos/atletico-mineiro.png');
  assert.equal(crestFor('Vasco'), '/escudos/vasco-da-gama.png');
  assert.equal(crestFor('São Paulo'), '/escudos/sao-paulo.png');
  assert.equal(crestFor('Barcelona (ESP)'), null);
  assert.equal(crestFor('Time Que Não Existe'), null);
});

test('placar: casa o jogo da grade com o da API pelo horário e pelos times', async () => {
  assert.equal(sameTeam('Vasco', { name: 'CR Vasco da Gama', shortName: 'Vasco da Gama', tla: 'VAS' }), true);
  assert.equal(sameTeam('Bragantino', { name: 'Red Bull Bragantino', shortName: 'Bragantino', tla: 'RBB' }), true);
  assert.equal(sameTeam('Grêmio', { name: 'CR Flamengo', shortName: 'Flamengo', tla: 'FLA' }), false);

  const game = { home: 'Flamengo', away: 'Grêmio', start: '2026-11-04T22:30:00.000Z', competition: { name: 'Brasileirão Série A', football: true }, homeCrest: '/escudos/flamengo.png', awayCrest: null };
  const realFetch = global.fetch;
  process.env.FOOTBALL_DATA_KEY = 'teste';
  global.fetch = async () => ({ ok: true, json: async () => ({ matches: [{
    utcDate: '2026-11-04T22:30:00Z', status: 'IN_PLAY', minute: 63,
    homeTeam: { name: 'CR Flamengo', shortName: 'Flamengo', tla: 'FLA', crest: 'https://x/fla.png' },
    awayTeam: { name: 'Grêmio FBPA', shortName: 'Grêmio', tla: 'GRE', crest: 'https://x/gre.png' },
    score: { fullTime: { home: 2, away: 1 } }, competition: { name: 'Campeonato Brasileiro Série A' },
  }] }) });
  try {
    const [day] = await withScores([{ date: '2026-11-04', games: [game] }]);
    assert.deepEqual(day.games[0].score, { home: 2, away: 1, status: 'live', minute: 63 });
    assert.equal(day.games[0].homeCrest, '/escudos/flamengo.png');
    assert.equal(day.games[0].awayCrest, 'https://x/gre.png');
    assert.equal(day.games[0].competition.name, 'Brasileirão Série A');
  } finally {
    global.fetch = realFetch;
    delete process.env.FOOTBALL_DATA_KEY;
  }
});
