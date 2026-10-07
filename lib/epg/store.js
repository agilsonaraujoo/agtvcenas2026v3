const fs = require('fs/promises');

const DEFAULT_DATA_URL = 'https://raw.githubusercontent.com/agilsonaraujoo/agtvcenasProjetoAtualSetembroV2.1/epg-data/programacao.json';
const MEMORY_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

let memory = null;

const isDataset = (data) => (
  data && data.version === 1 && data.channels && typeof data.channels === 'object'
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
  if (process.env.EPG_DATA_FILE) {
    const data = JSON.parse(await fs.readFile(process.env.EPG_DATA_FILE, 'utf8'));
    if (!isDataset(data)) throw new Error('Formato de programação inválido.');
    return { data, stale: false };
  }

  const now = Date.now();
  if (memory && now - memory.fetchedAt < MEMORY_TTL_MS) {
    return { data: memory.data, stale: false };
  }

  try {
    const data = await fetchDataset(process.env.EPG_DATA_URL || DEFAULT_DATA_URL);
    memory = { data, fetchedAt: now };
    return { data, stale: false };
  } catch (error) {
    if (memory) return { data: memory.data, stale: true };
    throw error;
  }
};

module.exports = { loadDataset, DEFAULT_DATA_URL };
