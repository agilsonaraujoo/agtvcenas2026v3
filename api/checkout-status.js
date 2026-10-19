const { hasSameOrigin, sendJson } = require('../lib/serverApi');
const { planFromOrderNsu, postCheckout } = require('../lib/infinitepay');

// Confere com a InfinitePay se o pedido que voltou para /obrigado foi pago, e com o valor certo.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const params = new URL(req.url, `https://${req.headers.host || 'localhost'}`).searchParams;
  const orderNsu = params.get('order_nsu') || '';
  const transactionNsu = params.get('transaction_nsu') || '';
  const slug = params.get('slug') || '';
  const plan = planFromOrderNsu(orderNsu);
  if (!plan || !transactionNsu || !slug) {
    return sendJson(res, 400, { error: { message: 'Pedido inválido.' } });
  }

  try {
    const data = await postCheckout('payment_check', {
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug,
    });
    const paid = Boolean(data.success && data.paid && Number(data.amount) >= plan.price);

    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 200, {
      paid,
      plan: plan.name,
      amount: plan.price,
      captureMethod: data.capture_method || null,
    });
  } catch (error) {
    console.error('InfinitePay payment check failed:', error.message, error.details || '');
    return sendJson(res, error.statusCode || 502, {
      error: { message: 'Não foi possível confirmar o pagamento agora.' },
    });
  }
};
