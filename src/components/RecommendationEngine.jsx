import React, { useState } from 'react';

const RecommendationEngine = () => {
  const [preference, setPreference] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;

  const detectContentType = (text) => {
    const lowerText = text.toLowerCase();
    const keywords = {
      filme: ['filme', 'movie', 'cinema', 'cinematográfico'],
      série: ['série', 'serie', 'series', 'seriado', 'show'],
      anima: ['anime', 'animação', 'animê', 'animation'],
      documentário: ['documentário', 'documentario', 'documental'],
      reality: ['reality', 'reality show'],
      comedy: ['comédia', 'comedia', 'stand-up', 'standup'],
      terror: ['terror', 'horror'],
      ação: ['ação', 'acao', 'action', 'aventura']
    };

    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => lowerText.includes(word))) {
        return type;
      }
    }

    return 'conteúdo';
  };

  const parseGeminiJson = (rawText) => {
    if (!rawText) return [];

    const cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  };

  const searchTmdbForTitle = async (title, mediaType) => {
    if (!TMDB_API_KEY) return null;

    const query = encodeURIComponent(`${title} ${mediaType === 'tv' ? 'series' : 'movie'}`);
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${query}&language=pt-BR&include_adult=false&page=1`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];
    const result = results.find((item) => {
      if (!item.poster_path) return false;
      const matchesType = mediaType ? item.media_type === mediaType : item.media_type === 'movie' || item.media_type === 'tv';
      return matchesType;
    });

    return result ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null;
  };

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    setRecommendations([]);

    if (!TMDB_API_KEY) {
      setError('A chave da API do TMDB não foi configurada. Verifique seu arquivo .env.');
      setLoading(false);
      return;
    }
    if (!geminiApiKey) {
      setError('A chave da API Gemini não foi configurada. Verifique seu arquivo .env.');
      setLoading(false);
      return;
    }

    try {
      const prompt = `Você é um curador de catálogo de streaming. Com base nesta preferência do usuário: "${preference}". Sugira 4 recomendações de filmes ou séries. Responda APENAS com um array JSON, sem markdown, no formato abaixo: [{"title":"Nome do título","mediaType":"movie" ou "tv","genre":"Gênero principal","shortDescription":"descrição curta em até 2 linhas"}]`;

      const payload = {
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
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
                shortDescription: { type: 'STRING' }
              },
              required: ['title', 'mediaType', 'genre', 'shortDescription']
            }
          }
        }
      };

      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const geminiResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!geminiResponse.ok) {
        const errorPayload = await geminiResponse.json().catch(() => ({}));
        throw new Error(errorPayload?.error?.message || 'Erro na API do Gemini.');
      }

      const geminiResult = await geminiResponse.json();
      const rawText = geminiResult?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';

      if (!rawText) {
        throw new Error('Resposta vazia da API Gemini.');
      }

      const parsedRecommendations = parseGeminiJson(rawText);

      const recommendationsWithImages = await Promise.all(
        parsedRecommendations.map(async (rec) => {
          const imageUrl = await searchTmdbForTitle(rec.title, rec.mediaType || 'movie')
            .catch(() => null) || `https://placehold.co/400x225/000000/FFFFFF?text=${encodeURIComponent(rec.title)}`;

          return {
            ...rec,
            imageUrl,
            genre: rec.genre || 'Geral'
          };
        })
      );

      setRecommendations(recommendationsWithImages);
    } catch (err) {
      console.error('Erro na API Gemini ou TMDB:', err);
      setError(err.message || 'Erro ao buscar recomendações. Verifique sua conexão ou tente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="recomendacoes" className="bg-gray-800 text-white py-16 px-4">
      <div className="container mx-auto text-center mb-12">
        <h2 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl mb-4 flex items-center justify-center gap-2 relative">
          Recomendações Personalizadas
          <span className="relative inline-block" style={{width:'2.5em',height:'2.5em'}}>
            <span style={{fontSize:'2.2em',position:'relative',zIndex:2}}>✨</span>
            {/* Brilhos infinitos sobre o emoji */}
            <span className="absolute left-0 top-0 w-full h-full pointer-events-none" style={{zIndex:3}}>
              {[...Array(14)].map((_, i) => (
                <span
                  key={i}
                  className="absolute emoji-sparkle"
                  style={{
                    left: `${Math.random() * 90 + 5}%`,
                    top: `-${Math.random() * 10 + 2}px`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1.8 + Math.random()}s`,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="6" r="2.5" fill="#fff8c6" fillOpacity="0.8" />
                    <circle cx="6" cy="6" r="1" fill="#ffe066" fillOpacity="0.9" />
                  </svg>
                </span>
              ))}
            </span>
          </span>
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Descreva o que você gostaria de assistir e deixe a IA te surpreender!
        </p>

        <div className="max-w-2xl mx-auto mb-10 relative">
          {/* Brilhos removidos da caixa de texto */}
          <textarea
            className="w-full p-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[100px] relative z-10"
            placeholder="Ex: Quero um filme de ficção científica com muita ação e uma história envolvente..."
            data-analytics="reco_textarea"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading && preference.trim()) {
                  getRecommendations();
                }
              }
            }}
          ></textarea>
          <button
            onClick={getRecommendations}
            disabled={loading || !preference.trim()}
            data-analytics="reco_get"
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Gerando Recomendações...' : 'Obter Recomendações ✨'}
          </button>
          {/* Bottom sparkles removed to avoid overlapping result cards */}
          {/* Estilos para brilhos animados */}
          <style>{`
            .emoji-sparkle {
              animation: sparkle-fall 2.5s linear infinite;
              opacity: 0.9;
              filter: blur(0.5px) drop-shadow(0 0 4px #fff8c6);
            }
            @keyframes sparkle-fall {
              0% { transform: translateY(0) scale(1); opacity: 0.9; }
              80% { opacity: 1; }
              100% { transform: translateY(120px) scale(0.7); opacity: 0; }
            }
          `}</style>
        </div>

        {error && (
          <p className="text-red-500 text-lg mb-4">{error}</p>
        )}

        {recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-gray-900 rounded-lg shadow-xl p-6 text-left flex flex-col transform transition-transform hover:scale-105 duration-300 relative overflow-hidden">
                <img
                  src={rec.imageUrl}
                  alt={`Capa de ${rec.title}`}
                  className="w-full h-auto rounded-md mb-4 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x225/000000/FFFFFF?text=Imagem+Nao+Disponivel'; }}
                />
                {/* Sparkles removed from result cards */}
                <h3 className="text-2xl font-bold text-indigo-400 mb-2 relative z-10">{rec.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{rec.genre}</p>
                <p className="text-gray-300 flex-grow">{rec.shortDescription}</p>
                <div className="mt-4 flex justify-center">
                  {(() => {
                    const contentType = detectContentType(preference);
                    const message = `Olá, vim pelo site AGTV CENAS e gostaria de um teste grátis para o ${contentType} ${rec.title}`;
                    const waLink = `https://wa.me/5583986913481?text=${encodeURIComponent(message)}`;
                    return (
                      <a
                        href={waLink}
                        data-analytics={`reco_whatsapp_${index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-full text-sm transition duration-200 shadow-sm"
                        aria-label={`Solicitar teste grátis para ${rec.title} via WhatsApp`}
                      >
                        Solicitar e assistir gratuitamente
                      </a>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecommendationEngine;
