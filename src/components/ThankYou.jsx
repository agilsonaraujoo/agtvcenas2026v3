import React, { useEffect, useState } from 'react';
import { trackEvent } from '../utils/analytics';

const WHATSAPP_NUMBER = '5583986913481';
const formatBRL = (cents) => (cents / 100).toFixed(2).replace('.', ',');

// Página para onde a InfinitePay manda o cliente depois do pagamento.
// Confere o pagamento no servidor e leva o cliente ao WhatsApp para receber o acesso.
const ThankYou = () => {
  const [state, setState] = useState({ status: 'checking' });
  const params = new URLSearchParams(window.location.search);
  const orderNsu = params.get('order_nsu') || '';
  const receiptUrl = params.get('receipt_url') || '';

  useEffect(() => {
    const query = new URLSearchParams({
      order_nsu: orderNsu,
      transaction_nsu: params.get('transaction_nsu') || '',
      slug: params.get('slug') || '',
    });

    let cancelled = false;
    fetch(`/api/checkout-status?${query}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && data.paid) {
          setState({ status: 'paid', ...data });
          trackEvent('purchase', {
            transaction_id: orderNsu,
            currency: 'BRL',
            value: data.amount / 100,
            items: [{ item_id: data.plan.toLowerCase(), item_name: `AGTV ${data.plan}`, price: data.amount / 100, quantity: 1 }],
          });
        } else {
          setState({ status: 'unpaid' });
        }
      })
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const whatsappLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  const paidMessage = state.status === 'paid'
    ? `Olá! Acabei de assinar o plano ${state.plan} (R$ ${formatBRL(state.amount)}) pelo site AGTV CENAS.\nPedido: ${orderNsu}${receiptUrl ? `\nComprovante: ${receiptUrl}` : ''}`
    : `Olá! Fiz um pagamento pelo site AGTV CENAS e preciso de ajuda.\nPedido: ${orderNsu || 'não informado'}${receiptUrl ? `\nComprovante: ${receiptUrl}` : ''}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-800/80 p-6 text-center shadow-xl sm:p-8" aria-live="polite">
        {state.status === 'checking' && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-[#b7ff4a]" aria-hidden="true" />
            <h1 className="text-xl font-bold">Confirmando seu pagamento…</h1>
            <p className="mt-2 text-sm text-gray-400">Só um instante.</p>
          </>
        )}

        {state.status === 'paid' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#b7ff4a]/15 text-3xl text-[#b7ff4a]" aria-hidden="true">✓</div>
            <h1 className="text-2xl font-extrabold">Pagamento aprovado!</h1>
            <p className="mt-2 text-gray-300">
              Plano <b className="text-white">{state.plan}</b> · R$ {formatBRL(state.amount)}
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Agora é só chamar a gente no WhatsApp para receber seu acesso. A mensagem já vai pronta com os dados do pedido.
            </p>
            <a
              href={whatsappLink(paidMessage)}
              onClick={() => trackEvent('whatsapp_click', { location: 'obrigado', plan: state.plan })}
              className="mt-6 flex min-h-[3.25rem] w-full items-center justify-center rounded-xl bg-[#b7ff4a] px-4 py-3 text-base font-extrabold text-[#10130a] transition active:scale-[0.98]"
            >
              Receber meu acesso no WhatsApp
            </a>
          </>
        )}

        {(state.status === 'unpaid' || state.status === 'error') && (
          <>
            <h1 className="text-xl font-bold">
              {state.status === 'unpaid' ? 'Não encontramos a confirmação do pagamento' : 'Não conseguimos confirmar agora'}
            </h1>
            <p className="mt-3 text-sm text-gray-400">
              Se você pagou, fale com a gente no WhatsApp e mande o comprovante. A gente libera rapidinho.
            </p>
            <a
              href={whatsappLink(paidMessage)}
              className="mt-6 flex min-h-[3.25rem] w-full items-center justify-center rounded-xl bg-[#b7ff4a] px-4 py-3 text-base font-extrabold text-[#10130a]"
            >
              Falar no WhatsApp
            </a>
            <a href="/#planos" className="mt-3 block text-sm text-gray-400 underline">Voltar aos planos</a>
          </>
        )}
      </div>
    </main>
  );
};

export default ThankYou;
