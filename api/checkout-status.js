const { hasSameOrigin, sendJson } = require('../lib/serverApi');
const { mercadoPago, planFromOrderRef } = require('../lib/mercadopago');

// Confere com o Mercado Pago se o pagamento que voltou para /obrigado foi aprovado, e com o valor certo.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const params = new URL(req.url, `https://${req.headers.host || 'localhost'}`).searchParams;
  const paymentId = params.get('payment_id') || '';
  if (!/^\d{1,20}$/.test(paymentId)) {
    return sendJson(res, 400, { error: { message: 'Pagamento inválido.' } });
  }

  try {
    const payment = await mercadoPago(`v1/payments/${paymentId}`);
    // O plano vem da referência gravada no pagamento, não da URL.
    const plan = planFromOrderRef(payment.external_reference);
    if (!plan) {
      return sendJson(res, 400, { error: { message: 'Pagamento inválido.' } });
    }
    const paid = payment.status === 'approved' && Number(payment.transaction_amount) >= plan.price;

    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, {
      paid,
      pending: ['pending', 'in_process'].includes(payment.status),
      plan: plan.name,
      amount: plan.price,
      orderRef: payment.external_reference,
      paymentType: payment.payment_type_id || null,
    });
  } catch (error) {
    console.error('Mercado Pago payment check failed:', error.message, error.details || '');
    return sendJson(res, error.statusCode === 404 ? 404 : 502, {
      error: { message: 'Não foi possível confirmar o pagamento agora.' },
    });
  }
};
