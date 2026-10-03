const { GEMINI_BASE_URL, hasSameOrigin, sendJson } = require('../lib/serverApi');

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

  const prompt = `Você é um curador de catálogo de streaming. Com base nesta preferência do usuário: "${preference}". Sugira 4 recomendações de filmes ou séries. Responda APENAS com um array JSON, sem markdown, no formato abaixo: [{"title":"Nome do título","mediaType":"movie" ou "tv","genre":"Gênero principal","shortDescription":"descrição curta em até 2 linhas"}]`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            mediaType: { type: 'STRING', enum: ['movie', 'tv'] },
            genre: { type: 'STRING' },
            shortDescription: { type: 'STRING' },
          },
          required: ['title', 'mediaType', 'genre', 'shortDescription'],
        },
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
    const recommendations = JSON.parse(rawText);
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      throw new Error('Gemini returned no recommendations.');
    }

    const validRecommendations = recommendations
      .filter((item) => (
        typeof item.title === 'string'
        && ['movie', 'tv'].includes(item.mediaType)
        && typeof item.shortDescription === 'string'
      ))
      .slice(0, 4);
    if (!validRecommendations.length) {
      throw new Error('Gemini returned invalid recommendations.');
    }

    return sendJson(res, 200, { recommendations: validRecommendations });
  } catch (error) {
    console.error('Gemini recommendation processing failed:', error.message);
    return sendJson(res, 502, { error: { message: 'Não foi possível gerar recomendações agora. Tente novamente.' } });
  }
};
