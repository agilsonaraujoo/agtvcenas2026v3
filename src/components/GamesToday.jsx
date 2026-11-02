import React, { useCallback, useEffect, useState } from 'react';
import { API_CONFIG } from '../utils/api';
import '../styles/games-today.css';

const TIMEZONE = 'America/Sao_Paulo';
const REFRESH_MS = 60 * 1000;

const timeFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' });
const formatTime = (iso) => timeFormatter.format(new Date(iso));

const statusOf = (game, now) => {
  if (now >= Date.parse(game.end)) return 'done';
  if (now >= Date.parse(game.start)) return 'live';
  return 'soon';
};

const GameRow = ({ game, now }) => {
  const status = statusOf(game, now);
  return (
    <li className={`games-row games-row--${status}`}>
      <div className="games-time">
        {status === 'live' ? (
          <span className="epg-badge epg-badge--live"><i aria-hidden="true" /> AO VIVO</span>
        ) : (
          <time dateTime={game.start}>{formatTime(game.start)}</time>
        )}
        {status === 'done' && <span className="games-done">Encerrado</span>}
      </div>
      <div className="games-info">
        {game.league && <span className="games-league">{game.league}</span>}
        <p className="games-teams">
          {game.home} <span>x</span> {game.away}
        </p>
        {game.description && <p className="games-desc">{game.description}</p>}
      </div>
      <ul className="games-channels" aria-label="Onde passa">
        {game.channels.map((channel) => <li key={channel.slug}>{channel.name}</li>)}
      </ul>
    </li>
  );
};

const GamesToday = () => {
  const [state, setState] = useState({ status: 'loading', days: [] });
  const [day, setDay] = useState(0);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const response = await fetch(API_CONFIG.JOGOS.URL);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.days)) throw new Error('indisponivel');
      setState({ status: 'ready', days: data.days });
      setNow(Date.now());
    } catch {
      setState((previous) => (previous.days.length ? previous : { status: 'error', days: [] }));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const current = state.days[day];
  const games = current ? current.games : [];
  // Os que já acabaram vão para o fim: o topo da lista é sempre o que está passando ou vem a seguir.
  const ordered = [
    ...games.filter((game) => statusOf(game, now) !== 'done'),
    ...games.filter((game) => statusOf(game, now) === 'done'),
  ];

  return (
    <section id="jogos" className="relative px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">ESPORTES AO VIVO</span>
          <h2 className="agtv-section-title">
            Jogos de <span>hoje</span>
          </h2>
        </div>
        <p className="agtv-section-description mb-8">
          As partidas transmitidas ao vivo nos canais, conforme a programação das emissoras. Horários de Brasília.
        </p>

        {state.status === 'loading' && <div className="games-list epg-skeleton" aria-busy="true" />}

        {state.status === 'error' && (
          <p className="epg-state epg-error" role="alert">
            Não foi possível carregar os jogos agora. Tente novamente em instantes.
          </p>
        )}

        {state.status === 'ready' && (
          <>
            <div className="epg-filters" role="tablist" aria-label="Dia">
              {state.days.map((item, index) => (
                <button
                  key={item.date}
                  type="button"
                  role="tab"
                  aria-selected={day === index}
                  className={`epg-filter${day === index ? ' is-active' : ''}`}
                  onClick={() => setDay(index)}
                >
                  {index === 0 ? 'Hoje' : 'Amanhã'} ({item.games.length})
                </button>
              ))}
            </div>

            {ordered.length === 0 ? (
              <p className="epg-state" role="status">Nenhum jogo ao vivo na programação deste dia.</p>
            ) : (
              <ul className="games-list">
                {ordered.map((game) => <GameRow key={game.id} game={game} now={now} />)}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default GamesToday;
