const { GEMINI_BASE_URL, hasSameOrigin, sendJson } = require('../lib/serverApi');
const KNOWLEDGE = require('../lib/assistantKnowledge');

// Ações que o chat pode oferecer como botões. O site decide o link de cada uma (o modelo nunca escreve URLs).
const ACTIONS = ['whatsapp', 'teste', 'planos', 'programacao', 'em_alta', 'recomendacoes', 'faq'];
const MAX_TURNS = 12;

const SYSTEM = `Você é o assistente virtual da AGTV no site. Fale em português do Brasil, de forma simpática, curta e direta
(no máximo 3 frases curtas), como um atendente de WhatsApp. Use só as informações abaixo; se não souber, diga que a equipe
responde no WhatsApp e ofereça o botão. Nunca invente preços, canais, prazos ou promessas. Não fale de assuntos fora da AGTV
(responda com gentileza que só ajuda com a AGTV). Não peça dados pessoais, senhas ou cartão.
Sempre que fizer sentido, ofereça de 1 a 3 botões em "actions", escolhendo entre:
whatsapp (falar com a equipe), teste (pedir teste grátis), planos (ver planos e preços), programacao (ver o que passa agora),
em_alta (filmes e séries do momento), recomendacoes (IA que recomenda filmes), faq (perguntas frequentes).
Para dúvidas de compra, preço ou instalação, inclua "teste" ou "whatsapp".

INFORMAÇÕES DA AGTV:
${KNOWLEDGE}`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  // Histórico curto vindo do navegador: [{ role: 'user' | 'assistant', text }]
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, text: m.text.trim().slice(0, 600) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return sendJson(res, 400, { error: { message: 'Mensagem inválida.' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJson(res, 503, { error: { message: 'O assistente não está configurado.' } });
  }

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 400,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          reply: { type: 'STRING' },
          actions: { type: 'ARRAY', items: { type: 'STRING', enum: ACTIONS } },
        },
        required: ['reply'],
      },
    },
  };

  try {
    const response = await fetch(GEMINI_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('Gemini assistant request failed:', response.status);
      return sendJson(res, 502, { error: { message: 'Não consegui responder agora. Tente de novo ou fale no WhatsApp.' } });
    }
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const parsed = JSON.parse(text);
    const reply = typeof parsed.reply === 'string' ? parsed.reply.trim().slice(0, 700) : '';
    if (!reply) throw new Error('empty reply');
    const actions = [...new Set((Array.isArray(parsed.actions) ? parsed.actions : []).filter((a) => ACTIONS.includes(a)))].slice(0, 3);
    return sendJson(res, 200, { reply, actions });
  } catch (error) {
    console.error('Gemini assistant processing failed:', error.message);
    return sendJson(res, 502, { error: { message: 'Não consegui responder agora. Tente de novo ou fale no WhatsApp.' } });
  }
};
