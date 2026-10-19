const API_BASE_URL = 'https://api.mercadopago.com';

// Preços em reais. O valor cobrado vem daqui, nunca do navegador.
// Manter igual a src/data/pricingPlans.js.
const PLANS = {
  mensal: { name: 'Mensal', price: 34.9 },
  trimestral: { name: 'Trimestral', price: 99.9 },
  semestral: { name: 'Semestral', price: 159.9 },
  anual: { name: 'Anual', price: 249.9 },
};

// Nome na fatura do cartão (máx. 13 caracteres).
const STATEMENT_DESCRIPTOR = 'AGTVCENAS';

// A referência do pedido leva o plano, assim a confirmação sabe o que foi comprado sem banco de dados.
const createOrderRef = (planId) => `agtv-${planId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const planFromOrderRef = (orderRef = '') => {
  const match = /^agtv-([a-z]+)-[a-z0-9]+-[a-z0-9]+$/.exec(orderRef);
  return match && PLANS[match[1]] ? { id: match[1], ...PLANS[match[1]] } : null;
};

const mercadoPago = async (path, { method = 'GET', body } = {}) => {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    const error = new Error('O pagamento não está configurado.');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('Não foi possível falar com o Mercado Pago.');
    error.statusCode = response.status === 404 ? 404 : 502;
    error.details = data && data.message;
    throw error;
  }
  return data;
};

module.exports = {
  PLANS,
  STATEMENT_DESCRIPTOR,
  createOrderRef,
  mercadoPago,
  planFromOrderRef,
};
