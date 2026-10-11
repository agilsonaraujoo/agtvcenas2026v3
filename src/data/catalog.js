// Números do catálogo. Fonte única: o topo do site, os planos e o selo
// do Hero leem daqui, para não ficarem diferentes entre si.
export const catalog = {
  channels: 2200,
  movies: 20600,
  series: 8400,
};

const formatThousands = (value) => value.toLocaleString('pt-BR');

export const catalogStats = [
  { value: `${formatThousands(catalog.channels)}+`, label: 'canais' },
  { value: `${formatThousands(catalog.movies)}+`, label: 'filmes' },
  { value: `${formatThousands(catalog.series)}+`, label: 'séries' },
];

// Ex.: "29 mil+" (filmes + séries).
export const onDemandTotalLabel = `${Math.floor((catalog.movies + catalog.series) / 1000)} mil+`;
