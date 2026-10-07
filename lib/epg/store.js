const fs = require('fs/promises');
const path = require('path');

const DEFAULT_DATA_URL = 'https://raw.githubusercontent.com/agilsonaraujoo/agtvcenasProjetoAtualSetembroV2.1/epg-data/programacao.json';
const MEMORY_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

let memory = null;

const isDataset = (data) => (
  data && data.channels && typeof data.channels === 'object'
);

const fetchDataset = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Falha ao carregar a programação (HTTP ${response.status}).`);
  const data = await response.json();
  if (!isDataset(data)) throw new Error('Formato de programação inválido.');
  return data;
};

// Lê o JSON já processado (gerado pela rotina agendada). Nunca baixa XMLTV.
// Se a origem falhar, reutiliza a última cópia em memória (stale) em vez de quebrar o site.
const loadDataset = async () => {
  const now = Date.now();

  // Prefer an explicitly configured local dataset when one is provided.
  if (process.env.EPG_DATA_FILE) {
    try {
      const data = JSON.parse(await fs.readFile(process.env.EPG_DATA_FILE, 'utf8'));
      if (!isDataset(data)) throw new Error('Formato inv?lido.');
      return { data, stale: false, source: 'env:' + process.env.EPG_DATA_FILE };
    } catch (error) {
      console.error('[EPG] Erro ao carregar de EPG_DATA_FILE:', error.message);
    }
  }

  // Reuse a recent copy so normal requests do not download the EPG repeatedly.
  if (memory && now - memory.fetchedAt < MEMORY_TTL_MS) {
    return { data: memory.data, stale: false, source: 'memory-cache' };
  }

  // Fetch the latest normalized dataset. The scheduled job updates this URL
  // throughout the day, so Vercel does not need a new deployment for each update.
  const remoteUrl = process.env.EPG_DATA_URL || DEFAULT_DATA_URL;
  try {
    const data = await fetchDataset(remoteUrl);
    memory = { data, fetchedAt: now };
    return { data, stale: false, source: remoteUrl };
  } catch (error) {
    console.error('[EPG] Erro ao buscar do servidor remoto:', error.message);
  }

  // Static copy is the fallback for temporary GitHub/network failures.
  try {
    const publicPath = path.join(process.cwd(), 'public', 'programacao.json');
    const data = JSON.parse(await fs.readFile(publicPath, 'utf8'));
    if (!isDataset(data)) throw new Error('Formato inv?lido.');
    return { data, stale: true, source: 'public/programacao.json' };
  } catch (error) {
    console.error('[EPG] Arquivo public/programacao.json n?o dispon?vel:', error.message);
  }

  if (memory) {
    console.warn('[EPG] Usando dados em cache (pode estar desatualizado)');
    return { data: memory.data, stale: true, source: 'memory-cache-stale' };
  }

  throw new Error('N?o foi poss?vel carregar a programa??o de nenhuma fonte dispon?vel.');
};

module.exports = { loadDataset, DEFAULT_DATA_URL };
