const { fetchTmdb, hasSameOrigin, sendJson } = require('../lib/serverApi');

// Ordem de preferência: português dublado > português legendado > outro vídeo em português
// > inglês. O idioma sempre vence o tipo: um teaser dublado ganha de um trailer em inglês.
const normalize = (text = '') => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pickTrailer = (videos = []) => {
  const youtube = videos.filter((video) => video.site === 'YouTube' && video.key);
  const rank = (video) => {
    const name = normalize(video.name);
    let score = 0;
    if (video.iso_639_1 === 'pt') {
      score += 100;
      if (/dublad|dub\b/.test(name)) score += 40;
      else if (/legendad|leg\b/.test(name)) score += 20;
      // Português do Brasil antes do de Portugal (dublagens e legendas diferentes).
      if (video.iso_3166_1 === 'BR') score += 30;
      if (video.iso_3166_1 === 'PT' || /portugal/.test(name)) score -= 30;
    } else if (video.iso_639_1 === 'en') {
      score += 10;
    }
    if (video.type === 'Trailer') score += 4;
    else if (video.type === 'Teaser') score += 2;
    if (video.official) score += 1;
    return score;
  };
  const [best] = youtube.sort((a, b) => rank(b) - rank(a));
  if (!best) return null;
  const name = normalize(best.name);
  const language = best.iso_639_1 !== 'pt' ? 'en' : /dublad|dub\b/.test(name) ? 'dublado' : /legendad|leg\b/.test(name) ? 'legendado' : 'pt';
  return { key: best.key, name: best.name, language };
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const requestUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const id = requestUrl.searchParams.get('id') || '';
  const mediaType = requestUrl.searchParams.get('mediaType');
  if (!/^\d{1,10}$/.test(id) || !['movie', 'tv'].includes(mediaType)) {
    return sendJson(res, 400, { error: { message: 'Título ou tipo de conteúdo inválido.' } });
  }

  try {
    const data = await fetchTmdb(`${mediaType}/${id}`, {
      append_to_response: 'videos',
      include_video_language: 'pt,en,null',
    });

    const date = data.release_date || data.first_air_date || '';
    const runtime = data.runtime || (data.episode_run_time && data.episode_run_time[0]) || null;

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return sendJson(res, 200, {
      id: data.id,
      mediaType,
      title: data.title || data.name,
      overview: data.overview || '',
      year: date ? date.slice(0, 4) : null,
      rating: typeof data.vote_average === 'number' && data.vote_count > 0
        ? Math.round(data.vote_average * 10) / 10
        : null,
      genres: (data.genres || []).map((genre) => genre.name).slice(0, 3),
      runtime,
      seasons: data.number_of_seasons || null,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
      trailer: pickTrailer(data.videos && data.videos.results),
    });
  } catch (error) {
    console.error('TMDB details request failed:', error.message);
    return sendJson(res, error.statusCode || 502, {
      error: { message: error.message || 'Não foi possível carregar os detalhes do título.' },
    });
  }
};
