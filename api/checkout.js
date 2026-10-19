const { hasSameOrigin, sendJson } = require('../lib/serverApi');
const { PLANS, createOrderNsu, postCheckout } = require('../lib/infinitepay');

// Cria um link de pagamento da InfinitePay (Pix ou cartão) para o plano escolhido.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const planId = String(body.plan || '').toLowerCase();
  const plan = PLANS[planId];
  if (!plan) {
    return sendJson(res, 400, { error: { message: 'Plano inválido.' } });
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';

  try {
    const data = await postCheckout('links', {
      order_nsu: createOrderNsu(planId),
      redirect_url: `${protocol}://${host}/obrigado`,
      items: [{ quantity: 1, price: plan.price, description: `AGTV Plano ${plan.name}` }],
    });
    if (!data.url) throw new Error('A InfinitePay não devolveu o link de pagamento.');

    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, { url: data.url });
  } catch (error) {
    console.error('InfinitePay checkout failed:', error.message, error.details || '');
    return sendJson(res, error.statusCode || 502, {
      error: { message: 'Não foi possível gerar o pagamento. Tente de novo ou fale com a gente no WhatsApp.' },
    });
  }
};
