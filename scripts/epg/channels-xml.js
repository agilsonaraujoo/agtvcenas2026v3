#!/usr/bin/env node
// Gera o channels.xml do iptv-org/epg apenas com os canais do AGTV (mi.tv), para o grabber
// não varrer o site inteiro. Uso: node scripts/epg/channels-xml.js <saida.xml>
const fs = require('fs');
const { CHANNELS } = require('../../lib/epg/channels');

const escape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const lines = CHANNELS.map(({ name, iptvOrg }) => (
  `  <channel site="${iptvOrg.site}" site_id="${escape(iptvOrg.siteId)}" lang="pt" xmltv_id="${escape(iptvOrg.xmltvId)}">${escape(name)}</channel>`
));

const output = process.argv[2];
if (!output) throw new Error('Informe o arquivo de saída.');
fs.writeFileSync(output, `<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n${lines.join('\n')}\n</channels>\n`);
console.log(`${CHANNELS.length} canais escritos em ${output}`);
