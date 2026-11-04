const { CHANNELS } = require('./channels');
const { TIMEZONE, dateKey, dayRange } = require('./time');
const { hasUpcomingData } = require('./schedule');

// Ordem de prioridade: BrazilTVEPG primeiro, iptv-org como fallback.
const SOURCES = [
  { key: 'brazilTvEpg/claro', idFor: (channel) => channel.brazilTvEpg.claro },
  { key: 'brazilTvEpg/vivoplay', idFor: (channel) => channel.brazilTvEpg.vivoplay },
  { key: 'iptv-org', idFor: (channel) => channel.iptvOrg && channel.iptvOrg.xmltvId },
];

const lastEnd = (programs) => programs.reduce((max, program) => Math.max(max, Date.parse(program.end)), 0);

// Cada canal usa a primeira fonte que tenha programação atual ou futura.
// Fonte desatualizada, sem o canal ou indisponível é registrada em `missing`, nunca inventada.
// `inputs`: { [sourceKey]: { parsed, error } }
const buildDataset = (inputs, { now = Date.now(), channels = CHANNELS } = {}) => {
  const todayStart = dayRange(dateKey(new Date(now))).start.getTime();
  const dataset = {
    version: 1,
    generatedAt: new Date(now).toISOString(),
    timezone: TIMEZONE,
    sources: {},
    channels: {},
    missing: [],
  };

  for (const source of SOURCES) {
    const input = inputs[source.key] || {};
    const all = input.parsed ? Object.values(input.parsed.programmes).flat() : [];
    dataset.sources[source.key] = {
      ok: Boolean(input.parsed),
      generator: input.parsed ? input.parsed.generator : null,
      lastProgramEnd: all.length ? new Date(lastEnd(all)).toISOString() : null,
      fresh: all.length ? hasUpcomingData(all, now) : false,
      error: input.error || null,
    };
  }

  for (const channel of channels) {
    const attempts = [];
    let chosen = null;

    for (const source of SOURCES) {
      const { parsed } = inputs[source.key] || {};
      const channelId = source.idFor(channel);
      if (!parsed) {
        attempts.push({ source: source.key, channelId: channelId || null, status: 'fonte-indisponivel' });
      } else if (!channelId) {
        attempts.push({ source: source.key, channelId: null, status: 'sem-mapeamento' });
      } else {
        const programs = (parsed.programmes[channelId] || [])
          .filter((program) => Date.parse(program.end) > todayStart);
        if (!programs.length && !(parsed.programmes[channelId] || []).length) {
          attempts.push({ source: source.key, channelId, status: 'canal-nao-encontrado' });
        } else if (!hasUpcomingData(programs, now)) {
          const all = parsed.programmes[channelId];
          attempts.push({
            source: source.key,
            channelId,
            status: 'desatualizada',
            lastProgramEnd: new Date(lastEnd(all)).toISOString(),
          });
        } else {
          chosen = { source: source.key, channelId, programs };
          break;
        }
      }
    }

    if (chosen) {
      dataset.channels[channel.slug] = {
        slug: channel.slug,
        channel: channel.name,
        channelId: chosen.channelId,
        group: channel.group,
        source: chosen.source,
        programs: chosen.programs,
      };
    } else {
      dataset.missing.push({ slug: channel.slug, channel: channel.name, attempts });
    }
  }

  return dataset;
};

// Quando todas as fontes de um canal falham numa rodada (download que estoura o tempo, arquivo
// fora do ar), reaproveita a grade publicada na rodada anterior, se ela ainda tiver programas
// por vir: as fontes trazem vários dias, então a grade antiga continua certa por um tempo.
const reusePrevious = (dataset, previous, { now = Date.now() } = {}) => {
  if (!previous || !previous.channels) return dataset;
  const todayStart = dayRange(dateKey(new Date(now))).start.getTime();
  dataset.missing = dataset.missing.filter((item) => {
    const old = previous.channels[item.slug];
    if (!old || !hasUpcomingData(old.programs, now)) return true;
    dataset.channels[item.slug] = {
      ...old,
      source: `anterior:${String(old.source).replace(/^anterior:/, '')}`,
      programs: old.programs.filter((program) => Date.parse(program.end) > todayStart),
    };
    return false;
  });
  return dataset;
};

module.exports = { SOURCES, buildDataset, reusePrevious };
