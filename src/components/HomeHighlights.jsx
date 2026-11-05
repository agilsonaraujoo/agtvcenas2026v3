import React, { useEffect, useState } from 'react';
import { FiAward, FiTv } from 'react-icons/fi';
import { API_CONFIG } from '../utils/api';
import { GameRow, statusOf } from './GamesToday';
import '../styles/section-page.css';

const PREVIEW_SIZE = 3;

// Futebol primeiro e os campeonatos principais na frente: a prévia precisa mostrar os jogos que
// mais chamam atenção, não um Sub-20 só porque começou antes.
const nextGames = (games, now) => games
  .filter((game) => statusOf(game, now) !== 'done')
  .sort((a, b) => (
    Number(b.competition.football) - Number(a.competition.football)
    || a.competition.order - b.competition.order
    || Date.parse(a.start) - Date.parse(b.start)
  ))
  .slice(0, PREVIEW_SIZE);

// Prévia na página inicial; a lista completa fica em /jogos e a grade em /programacao.
const HomeHighlights = () => {
  const [preview, setPreview] = useState({ games: [], tomorrow: false });
  const [now] = useState(Date.now());

  useEffect(() => {
    let alive = true;
    fetch(API_CONFIG.JOGOS.URL)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('indisponivel'))))
      .then(({ days = [] }) => {
        if (!alive) return;
        const today = nextGames(days[0] ? days[0].games : [], now);
        if (today.length) setPreview({ games: today, tomorrow: false });
        else setPreview({ games: nextGames(days[1] ? days[1].games : [], now), tomorrow: true });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [now]);

  return (
    <section id="destaques" className="relative px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">AO VIVO TODO DIA</span>
          <h2 className="agtv-section-title">
            {preview.tomorrow ? 'Jogos de ' : 'Próximos '}<span>{preview.tomorrow ? 'amanhã' : 'jogos'}</span>
          </h2>
        </div>
        <p className="agtv-section-description mb-8">
          Acompanhe os jogos com placar ao vivo e a programação dos canais em tempo real.
        </p>
        {preview.games.length > 0 && (
          <ul className="games-list">
            {preview.games.map((game) => <GameRow key={game.id} game={game} now={now} />)}
          </ul>
        )}
        <div className="home-highlights-actions">
          <a href="/jogos" className="is-primary" data-analytics="home_ver_jogos">
            <FiAward aria-hidden="true" /> Ver todos os jogos
          </a>
          <a href="/programacao" data-analytics="home_ver_programacao">
            <FiTv aria-hidden="true" /> Ver programação da TV
          </a>
        </div>
      </div>
    </section>
  );
};

export default HomeHighlights;
