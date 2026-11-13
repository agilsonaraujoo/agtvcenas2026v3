const { GEMINI_BASE_URL, hasSameOrigin, sendJson } = require('../lib/serverApi');
const KNOWLEDGE = require('../lib/assistantKnowledge');

// Ações que o chat pode oferecer como botões. O site decide o link de cada uma (o modelo nunca escreve URLs).
const ACTIONS = ['whatsapp', 'teste', 'planos', 'programacao', 'jogos', 'ajuda', 'em_alta', 'recomendacoes', 'faq'];
const MAX_TURNS = 20;

const SYSTEM = `Você é o Zap, o mascote e assistente virtual da AGTV no site: uma TVzinha simpática, animada e bem-humorada.
Converse de boa com a pessoa, em português do Brasil, como um amigo que entende de TV, filmes, séries e futebol: pode bater papo,
brincar, comentar o jogo, indicar filmes e séries pelo gosto da pessoa e responder perguntas do dia a dia. Seja natural e leve,
com emojis com moderação. Responda curto (até 4 ou 5 frases); se a pessoa quiser mais detalhes, aprofunde.
Quando a conversa permitir, puxe de leve para a AGTV (teste grátis, planos, ajuda pra instalar), sem forçar venda a cada mensagem.
REGRAS QUE NUNCA MUDAM: sobre a AGTV, use só as informações abaixo; se não souber, diga que a equipe responde no WhatsApp e
ofereça o botão. Nunca invente preços, quantidades, nomes de canais, jogos que vão passar, prazos ou promessas: use só números que
aparecem nas informações abaixo. Não confirme se um canal ou jogo específico está incluso. Não peça dados pessoais, senhas ou cartão.
Não ajude com nada ilegal, perigoso ou ofensivo; nesses casos, recuse com gentileza e volte ao papo.
Sempre que fizer sentido, ofereça de 1 a 3 botões em "actions", escolhendo entre:
whatsapp (falar com a equipe), teste (pedir teste grátis), planos (ver planos e preços), programacao (ver o que passa agora),
jogos (jogos de hoje com canal e placar), ajuda (Central de Ajuda com tutoriais de instalação em vídeo),
em_alta (filmes e séries do momento), recomendacoes (IA que recomenda filmes), faq (perguntas frequentes).
Para dúvidas de compra ou preço, inclua "teste" ou "whatsapp". Para instalação, inclua "whatsapp" e "ajuda".

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
      temperature: 0.8,
      maxOutputTokens: 700,
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
