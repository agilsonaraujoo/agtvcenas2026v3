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
