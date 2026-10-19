const { hasSameOrigin, sendJson } = require('../lib/serverApi');
const { PLANS, STATEMENT_DESCRIPTOR, createOrderRef, mercadoPago } = require('../lib/mercadopago');

// Cria um pagamento no Checkout Pro do Mercado Pago (Pix ou cartão) para o plano escolhido.
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
  const returnUrl = `${protocol}://${host}/obrigado`;

  try {
    const data = await mercadoPago('checkout/preferences', {
      method: 'POST',
      body: {
        items: [{
          id: planId,
          title: `AGTV Plano ${plan.name}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: plan.price,
        }],
        external_reference: createOrderRef(planId),
        back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
        auto_return: 'approved',
        statement_descriptor: STATEMENT_DESCRIPTOR,
        // Só Pix e cartão: sem boleto nem lotérica.
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
          installments: 12,
        },
      },
    });
    if (!data.init_point) throw new Error('O Mercado Pago não devolveu o link de pagamento.');

    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, { url: data.init_point });
  } catch (error) {
    console.error('Mercado Pago checkout failed:', error.message, error.details || '');
    return sendJson(res, error.statusCode === 503 ? 503 : 502, {
      error: { message: 'Não foi possível gerar o pagamento. Tente de novo ou fale com a gente no WhatsApp.' },
    });
  }
};
