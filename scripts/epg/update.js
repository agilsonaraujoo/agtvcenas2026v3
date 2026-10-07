#!/usr/bin/env node
// Gera o JSON de programação consumido por /api/programacao.
//
// Uso:
//   node scripts/epg/update.js --out programacao.json [--iptv-xml guide.xml] [--brazil-dir pasta]
//
// Fontes (nesta ordem de prioridade): BrazilTVEPG (claro.xml, vivoplay.xml) e, como fallback,
// o XMLTV gerado pelo grabber iptv-org/epg (ver scripts/epg/channels-xml.js).
const fs = require('fs/promises');
const path = require('path');
const { buildDataset } = require('../../lib/epg/dataset');
const { decodeXml, parseXmltv } = require('../../lib/epg/xmltv');

const BRAZIL_BASE = 'https://raw.githubusercontent.com/limaalef/BrazilTVEPG/main';
const FETCH_TIMEOUT_MS = 60000;

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const readBrazil = async (file) => {
  const dir = option('brazil-dir');
  if (dir) return fs.readFile(path.join(dir, file));
  const response = await fetch(`${BRAZIL_BASE}/${file}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const load = async (label, reader) => {
  try {
    const parsed = parseXmltv(decodeXml(await reader()));
    console.log(`[epg] ${label}: ${Object.keys(parsed.channels).length} canais`);
    return { parsed };
  } catch (error) {
    console.warn(`[epg] ${label} indisponível: ${error.message}`);
    return { error: error.message };
  }
};

const main = async () => {
  const out = option('out');
  if (!out) throw new Error('Informe --out <arquivo>.');

  const iptvXml = option('iptv-xml');
  const inputs = {
    'brazilTvEpg/claro': await load('BrazilTVEPG claro.xml', () => readBrazil('claro.xml')),
    'brazilTvEpg/vivoplay': await load('BrazilTVEPG vivoplay.xml', () => readBrazil('vivoplay.xml')),
    'iptv-org': iptvXml
      ? await load('iptv-org', () => fs.readFile(iptvXml))
      : { error: 'Não executado.' },
  };

  const dataset = buildDataset(inputs);
  await fs.mkdir(path.dirname(path.resolve(out)), { recursive: true });
  await fs.writeFile(out, `${JSON.stringify(dataset)}\n`);

  console.log(`[epg] canais com programação: ${Object.keys(dataset.channels).length}`);
  for (const item of dataset.missing) {
    console.warn(`[epg] sem programação: ${item.channel} (${item.slug})`);
  }

  // Sem nenhum canal, o job falha para não publicar um arquivo vazio por cima do último válido.
  if (!Object.keys(dataset.channels).length) process.exitCode = 1;
};

main().catch((error) => {
  console.error(`[epg] ${error.message}`);
  process.exitCode = 1;
});
