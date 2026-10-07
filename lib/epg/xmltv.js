const { XMLParser } = require('fast-xml-parser');
const { parseXmltvTime } = require('./time');

const ARRAY_TAGS = new Set(['channel', 'programme', 'title', 'desc', 'category', 'display-name', 'sub-title']);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => ARRAY_TAGS.has(name),
});

// Decodifica o buffer respeitando o encoding declarado no prólogo do XML.
const decodeXml = (buffer) => {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  const prolog = Buffer.from(bytes.subarray(0, 200)).toString('latin1');
  const declared = /encoding\s*=\s*["']([\w-]+)["']/i.exec(prolog);
  const encoding = declared ? declared[1] : 'utf-8';
  try {
    return new TextDecoder(encoding).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
};

const textOf = (nodes) => {
  if (nodes === undefined || nodes === null) return '';
  const list = Array.isArray(nodes) ? nodes : [nodes];
  const pick = list.find((node) => node && node['@_lang'] === 'pt') || list[0];
  if (pick === undefined || pick === null) return '';
  const value = typeof pick === 'object' ? pick['#text'] : pick;
  return value === undefined || value === null ? '' : String(value).trim();
};

const cleanRating = (rating) => {
  const value = rating && rating.value ? String(rating.value).trim() : '';
  return value.replace(/^\[|\]$/g, '') || null;
};

// Converte um XMLTV em { generator, channels: { id: [nomes] }, programmes: { id: [programas] } }.
// Os programas saem normalizados: ISO UTC, duração em minutos calculada por start/stop
// (o <length> dessas fontes não é confiável) e ordenados por início.
const parseXmltv = (xml) => {
  const document = parser.parse(xml);
  const tv = document.tv || {};

  const channels = {};
  for (const item of tv.channel || []) {
    const id = item['@_id'];
    if (id) channels[id] = (item['display-name'] || []).map(textOf).filter(Boolean);
  }

  const programmes = {};
  for (const item of tv.programme || []) {
    const channelId = item['@_channel'];
    const start = parseXmltvTime(item['@_start']);
    const end = parseXmltvTime(item['@_stop']);
    const title = textOf(item.title);
    if (!channelId || !start || !end || end <= start || !title) continue;

    const description = textOf(item.desc);
    const category = textOf(item.category);
    (programmes[channelId] = programmes[channelId] || []).push({
      title,
      description: description || null,
      start: start.toISOString(),
      end: end.toISOString(),
      duration: Math.round((end.getTime() - start.getTime()) / 60000),
      category: category || null,
      rating: cleanRating(item.rating),
    });
  }

  for (const list of Object.values(programmes)) {
    list.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }

  return { generator: tv['@_generator-info-name'] || null, channels, programmes };
};

module.exports = { decodeXml, parseXmltv };
