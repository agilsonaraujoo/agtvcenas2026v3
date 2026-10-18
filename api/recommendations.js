const { GEMINI_BASE_URL, hasSameOrigin, sendJson } = require('../lib/serverApi');

const CATEGORIES = ['filme', 'serie', 'anime', 'documentario', 'reality', 'desenho'];

const isValidTitle = (item) => (
  item
  && typeof item.title === 'string'
  && ['movie', 'tv'].includes(item.mediaType)
  && typeof item.shortDescription === 'string'
);

const cleanTitle = (item) => ({
  title: item.title,
  originalTitle: typeof item.originalTitle === 'string' ? item.originalTitle : '',
  mediaType: item.mediaType,
  category: CATEGORIES.includes(item.category) ? item.category : null,
  genre: typeof item.genre === 'string' ? item.genre : '',
  shortDescription: item.shortDescription,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const preference = typeof req.body?.preference === 'string' ? req.body.preference.trim() : '';
  if (!preference || preference.length > 500) {
    return sendJson(res, 400, { error: { message: 'Descreva sua preferência em até 500 caracteres.' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJson(res, 503, { error: { message: 'A integração de recomendações não está configurada.' } });
  }

  const prompt = [
    'Você é um curador de catálogo de streaming brasileiro.',
    `Texto do usuário: "${preference}".`,
    'Se o texto pede um título específico (filme, série, anime, documentário, reality ou desenho), preencha "searchedTitle" com esse título; senão, use null.',
    'Em "recommendations", sugira 4 títulos que combinem com o pedido (se houve título específico, sugira títulos parecidos, sem repetir o pesquisado).',
    'Para cada título: "title" é o nome usado no Brasil, "originalTitle" o nome original,',
    '"mediaType" é "movie" ou "tv" como no TMDB, "category" é filme, serie, anime, documentario, reality ou desenho,',
    '"genre" é o gênero principal e "shortDescription" uma descrição curta em até 2 linhas, em português.',
  ].join(' ');

  const titleSchema = {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      originalTitle: { type: 'STRING' },
      mediaType: { type: 'STRING', enum: ['movie', 'tv'] },
      category: { type: 'STRING', enum: CATEGORIES },
      genre: { type: 'STRING' },
      shortDescription: { type: 'STRING' },
    },
    required: ['title', 'mediaType', 'category', 'genre', 'shortDescription'],
  };
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          searchedTitle: { ...titleSchema, nullable: true },
          recommendations: { type: 'ARRAY', items: titleSchema },
        },
        required: ['recommendations'],
      },
    },
  };

  try {
    const response = await fetch(GEMINI_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Gemini recommendation request failed:', response.status);
      return sendJson(res, 502, { error: { message: 'Não foi possível gerar recomendações agora. Tente novamente.' } });
    }

    const result = await response.json();
    const rawText = result?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
    const parsed = JSON.parse(rawText);
    const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
    const searchedTitle = parsed?.searchedTitle && isValidTitle(parsed.searchedTitle)
      ? cleanTitle(parsed.searchedTitle)
      : null;

    const validRecommendations = recommendations.filter(isValidTitle).map(cleanTitle).slice(0, 4);
    if (!validRecommendations.length && !searchedTitle) {
      throw new Error('Gemini returned invalid recommendations.');
    }

    return sendJson(res, 200, { searchedTitle, recommendations: validRecommendations });
  } catch (error) {
    console.error('Gemini recommendation processing failed:', error.message);
    return sendJson(res, 502, { error: { message: 'Não foi possível gerar recomendações agora. Tente novamente.' } });
  }
};
