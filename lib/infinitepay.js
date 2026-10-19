const CHECKOUT_BASE_URL = 'https://api.checkout.infinitepay.io';

// InfiniteTag da conta que recebe os pagamentos (sem o $).
const getHandle = () => process.env.INFINITEPAY_HANDLE || 'agtv_streaming';

// Preços em centavos. O valor cobrado vem daqui, nunca do navegador.
// Manter igual a src/data/pricingPlans.js.
const PLANS = {
  mensal: { name: 'Mensal', price: 3490 },
  trimestral: { name: 'Trimestral', price: 9990 },
  semestral: { name: 'Semestral', price: 15990 },
  anual: { name: 'Anual', price: 24990 },
};

// O número do pedido leva o plano, assim a confirmação sabe o que foi comprado sem banco de dados.
const createOrderNsu = (planId) => `agtv-${planId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const planFromOrderNsu = (orderNsu = '') => {
  const match = /^agtv-([a-z]+)-[a-z0-9]+-[a-z0-9]+$/.exec(orderNsu);
  return match && PLANS[match[1]] ? { id: match[1], ...PLANS[match[1]] } : null;
};

const postCheckout = async (path, body) => {
  const response = await fetch(`${CHECKOUT_BASE_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle: getHandle(), ...body }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('Não foi possível falar com a InfinitePay.');
    error.statusCode = 502;
    error.details = data;
    throw error;
  }
  return data;
};

module.exports = {
  PLANS,
  createOrderNsu,
  planFromOrderNsu,
  postCheckout,
};
