// Mapeamento dos canais exibidos no site.
// Os IDs vêm dos arquivos XMLTV reais de cada fonte; nunca casamos canais pelo nome.
//  - brazilTvEpg: IDs dentro de claro.xml e vivoplay.xml (limaalef/BrazilTVEPG)
//  - iptvOrg: site/site_id do grabber iptv-org/epg e o xmltv_id gerado por ele (opcional:
//    canais sem mapeamento no mi.tv ficam só com o BrazilTVEPG)

const GROUPS = {
  abertos: 'Abertos',
  esportes: 'Esportes',
  filmes: 'Filmes',
  series: 'Séries',
  documentarios: 'Documentários e variedades',
};

const channel = (slug, name, group, brazilTvEpg, iptvOrg) => ({
  slug,
  name,
  group,
  brazilTvEpg,
  iptvOrg: iptvOrg ? { site: 'mi.tv', ...iptvOrg } : null,
});

const CHANNELS = [
  channel('globo', 'Globo', 'abertos', { claro: 'GLOBO SP' }),
  channel('sbt', 'SBT', 'abertos', { claro: 'SBT São Paulo' }),
  channel('record', 'Record', 'abertos', { claro: 'RECORD - Sao Paulo' }),
  channel('band', 'Band', 'abertos', { claro: 'BAND HD' }),
  channel('redetv', 'RedeTV!', 'abertos', { claro: 'REDE TV! São Paulo', vivoplay: 'RedeTV! HD' }),
  channel('cultura', 'TV Cultura', 'abertos', { claro: 'CULTURA HD' }),
  channel('gazeta', 'TV Gazeta', 'abertos', { claro: 'GAZETA' }),
  channel('tv-brasil', 'TV Brasil', 'abertos', { claro: 'TV BRASIL', vivoplay: 'TV Brasil HD' }),

  channel('sportv', 'SporTV', 'esportes', { claro: 'SPORTV', vivoplay: 'sportv' }),
  channel('sportv2', 'SporTV 2', 'esportes', { claro: 'SPORTV 2', vivoplay: 'sportv 2' }),
  channel('sportv3', 'SporTV 3', 'esportes', { claro: 'SPORTV 3', vivoplay: 'sportv 3' }),
  channel('premiere', 'Premiere', 'esportes', { claro: 'PREMIERE CLUBES HD', vivoplay: 'Premiere ' }),
  channel('premiere2', 'Premiere 2', 'esportes', { claro: 'PREMIERE 2 HD', vivoplay: 'Premiere 2' }),
  channel('premiere3', 'Premiere 3', 'esportes', { claro: 'PREMIERE 3 HD', vivoplay: 'Premiere 3' }),
  channel('premiere4', 'Premiere 4', 'esportes', { claro: 'PREMIERE 4 HD', vivoplay: 'Premiere 4' }),
  channel('espn', 'ESPN', 'esportes', { claro: 'ESPN', vivoplay: 'ESPN' }),
  channel('espn2', 'ESPN 2', 'esportes', { claro: 'ESPN 2', vivoplay: 'ESPN 2' }),
  channel('espn3', 'ESPN 3', 'esportes', { claro: 'ESPN 3', vivoplay: 'ESPN 3' }),
  channel('espn4', 'ESPN 4', 'esportes', { claro: 'ESPN 4', vivoplay: 'ESPN 4' }),
  channel('bandsports', 'BandSports', 'esportes', { claro: 'BAND SPORTS HD', vivoplay: 'Bandsports HD' }),

  channel('telecine-premium', 'Telecine Premium', 'filmes',
    { claro: 'TELECINE PREMIUM', vivoplay: 'Telecine HD' },
    { siteId: 'br#telecine-premium', xmltvId: 'TelecinePremium.br@SD' }),
  channel('telecine-pipoca', 'Telecine Pipoca', 'filmes',
    { claro: 'TELECINE PIPOCA', vivoplay: 'Telecine Pipoca HD' },
    { siteId: 'br#telecine-pipoca', xmltvId: 'TelecinePipoca.br@SD' }),
  channel('telecine-action', 'Telecine Action', 'filmes',
    { claro: 'TELECINE ACTION', vivoplay: 'Telecine Action HD' },
    { siteId: 'br#telecine-action', xmltvId: 'TelecineAction.br@SD' }),
  channel('telecine-touch', 'Telecine Touch', 'filmes',
    { claro: 'TELECINE TOUCH', vivoplay: 'Telecine Touch HD' },
    { siteId: 'br#telecine-touch', xmltvId: 'TelecineTouch.br@SD' }),
  channel('telecine-cult', 'Telecine Cult', 'filmes',
    { claro: 'TELECINE CULT', vivoplay: 'Telecine Cult HD' },
    { siteId: 'br#telecine-cult', xmltvId: 'TelecineCult.br@SD' }),
  channel('telecine-fun', 'Telecine Fun', 'filmes',
    { claro: 'TELECINE FUN', vivoplay: 'Telecine Fun HD' },
    { siteId: 'br#telecine-fun', xmltvId: 'TelecineFun.br@SD' }),
  channel('hbo', 'HBO', 'filmes',
    { claro: 'HBO', vivoplay: 'HBO HD' },
    { siteId: 'br#hbo', xmltvId: 'HBO.br@SD' }),
  channel('hbo-family', 'HBO Family', 'filmes',
    { claro: 'HBO Family', vivoplay: 'HBO Family HD' },
    { siteId: 'br#hbo-family-hd', xmltvId: 'HBOFamily.br@SD' }),
  channel('hbo2', 'HBO 2', 'filmes',
    { claro: 'HBO2', vivoplay: 'HBO2' },
    { siteId: 'br#hbo2', xmltvId: 'HBO2.br@SD' }),
  channel('hbo-signature', 'HBO Signature', 'filmes',
    { claro: 'HBO Signature', vivoplay: 'HBO Signature HD' },
    { siteId: 'br#hbo-signature', xmltvId: 'HBOSignature.br@SD' }),
  channel('megapix', 'Megapix', 'filmes',
    { claro: 'MEGAPIX HD', vivoplay: 'Megapix HD' },
    { siteId: 'br#megapix', xmltvId: 'Megapix.br@SD' }),

  channel('warner', 'Warner Channel', 'series',
    { claro: 'WARNER CHANNEL', vivoplay: 'Warner HD' },
    { siteId: 'br#warner-channel', xmltvId: 'WarnerChannel.us@Brazil' }),
  channel('tnt', 'TNT', 'series',
    { claro: 'TNT HD', vivoplay: 'TNT' },
    { siteId: 'br#tnt', xmltvId: 'TNTLatinAmerica.us@Brazil' }),

  channel('discovery', 'Discovery Channel', 'documentarios',
    { claro: 'DISCOVERY HD', vivoplay: 'Discovery HD' },
    { siteId: 'br#discovery', xmltvId: 'DiscoveryChannelLatinAmerica.us@Brazil' }),
  channel('discovery-home-health', 'Discovery Home & Health', 'documentarios',
    { claro: 'DISCOVERY HOME&HEALTH HD', vivoplay: 'Discovery Home&Health HD' },
    { siteId: 'br#discovery-home-health', xmltvId: 'DiscoveryHomeHealthLatinAmerica.mx@Brazil' }),
  channel('investigacao-discovery', 'Investigação Discovery', 'documentarios',
    { claro: 'ID HD', vivoplay: 'ID' },
    { siteId: 'br#investigacao-discovery', xmltvId: 'InvestigationDiscovery.br@SD' }),
  channel('tlc', 'TLC', 'documentarios',
    { claro: 'TLC HD', vivoplay: 'TLC HD' },
    { siteId: 'br#tlc', xmltvId: 'TLCLatinAmerica.us@Brazil' }),
  channel('discovery-world', 'Discovery World', 'documentarios',
    { claro: 'DISCOVERY WORLD HD', vivoplay: 'Discovery World' },
    { siteId: 'br#discovery-world-hd', xmltvId: 'DiscoveryWorld.us@Brazil' }),
  channel('discovery-science', 'Discovery Science', 'documentarios',
    { claro: 'DISCOVERY SCIENCE HD', vivoplay: 'Discovery Science HD' },
    { siteId: 'br#discovery-science', xmltvId: 'DiscoveryScienceLatinAmerica.us@Brazil' }),
  channel('discovery-theater', 'Discovery Theater', 'documentarios',
    { claro: 'DISCOVERY THEATER HD', vivoplay: 'Discovery Theater' },
    { siteId: 'br#discovery-theater-hd', xmltvId: 'DiscoveryTheater.br@SD' }),
  channel('discovery-turbo', 'Discovery Turbo', 'documentarios',
    { claro: 'DISCOVERY TURBO HD', vivoplay: 'Discovery Turbo HD' },
    { siteId: 'br#discovery-turbo', xmltvId: 'DiscoveryTurboLatinAmerica.us@Brazil' }),
];

const bySlug = new Map(CHANNELS.map((item) => [item.slug, item]));

module.exports = {
  CHANNELS,
  GROUPS,
  getChannel: (slug) => bySlug.get(slug) || null,
};
