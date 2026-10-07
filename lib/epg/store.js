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
  // Tentar 1: Variável de ambiente (arquivo local)
  if (process.env.EPG_DATA_FILE) {
    try {
      const data = JSON.parse(await fs.readFile(process.env.EPG_DATA_FILE, 'utf8'));
      if (!isDataset(data)) throw new Error('Formato inválido.');
      return { data, stale: false, source: 'env:' + process.env.EPG_DATA_FILE };
    } catch (error) {
      console.error('[EPG] Erro ao carregar de EPG_DATA_FILE:', error.message);
    }
  }

  // Tentar 2: Arquivo public/programacao.json (Vercel static)
  try {
    const publicPath = path.join(process.cwd(), 'public', 'programacao.json');
    const data = JSON.parse(await fs.readFile(publicPath, 'utf8'));
    if (!isDataset(data)) throw new Error('Formato inválido.');
    return { data, stale: false, source: 'public/programacao.json' };
  } catch (error) {
    console.error('[EPG] Arquivo public/programacao.json não disponível:', error.message);
  }

  // Tentar 3: Memory cache (stale)
  const now = Date.now();
  if (memory && now - memory.fetchedAt < MEMORY_TTL_MS) {
    return { data: memory.data, stale: false, source: 'memory-cache' };
  }

  // Tentar 4: Fetch remoto (GitHub)
  try {
    const data = await fetchDataset(process.env.EPG_DATA_URL || DEFAULT_DATA_URL);
    memory = { data, fetchedAt: now };
    return { data, stale: false, source: process.env.EPG_DATA_URL || DEFAULT_DATA_URL };
  } catch (error) {
    console.error('[EPG] Erro ao buscar do servidor remoto:', error.message);
    
    // Tentar 5: Memory cache stale (último recurso)
    if (memory) {
      console.warn('[EPG] Usando dados em cache (pode estar desatualizado)');
      return { data: memory.data, stale: true, source: 'memory-cache-stale' };
    }
    
    throw new Error('Não foi possível carregar a programação de nenhuma fonte disponível.');
  }
};

module.exports = { loadDataset, DEFAULT_DATA_URL };
