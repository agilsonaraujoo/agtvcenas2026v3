import React, { useCallback, useEffect, useState } from 'react';
import { FiBarChart2, FiChevronDown } from 'react-icons/fi';
import { API_CONFIG } from '../utils/api';
import '../styles/games-today.css';

const TIMEZONE = 'America/Sao_Paulo';
const REFRESH_MS = 60 * 1000;

const timeFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' });
const formatTime = (iso) => timeFormatter.format(new Date(iso));

// O placar, quando existe, manda no status; sem placar vale o horário da transmissão.
export const statusOf = (game, now) => {
  if (game.score) return game.score.status === 'finished' ? 'done' : 'live';
  if (now >= Date.parse(game.end)) return 'done';
  if (now >= Date.parse(game.start)) return 'live';
  return 'soon';
};

const Crest = ({ src }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <img className="games-crest" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
};

const liveLabel = (score) => {
  if (!score) return null;
  if (score.status === 'halftime') return 'Intervalo';
  return score.minute ? `${score.minute}'` : null;
};

export const GameRow = ({ game, now }) => {
  const status = statusOf(game, now);
  const { score } = game;
  return (
    <li className={`games-row games-row--${status}`}>
      <div className="games-time">
        {status === 'live' ? (
          <span className="epg-badge epg-badge--live"><i aria-hidden="true" /> AO VIVO</span>
        ) : (
          <time dateTime={game.start}>{formatTime(game.start)}</time>
        )}
        {status === 'live' && liveLabel(score) && <span className="games-minute">{liveLabel(score)}</span>}
        {status === 'done' && <span className="games-done">Encerrado</span>}
      </div>
      <div className="games-info">
        <p className="games-teams">
          <span className="games-team"><Crest src={game.homeCrest} />{game.home}</span>
          {score ? (
            <strong className="games-score">{score.home} <span>x</span> {score.away}</strong>
          ) : (
            <span className="games-vs">x</span>
          )}
          <span className="games-team"><Crest src={game.awayCrest} />{game.away}</span>
        </p>
        {game.description && <p className="games-desc">{game.description}</p>}
      </div>
      <ul className="games-channels" aria-label="Onde passa">
        {game.channels.map((channel) => <li key={channel.slug}>{channel.name}</li>)}
      </ul>
    </li>
  );
};

// Tabela de classificação, buscada só quando a pessoa abre (poupa o limite da API de placar).
const Standings = ({ code, name }) => {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    fetch(`${API_CONFIG.JOGOS.TABELA_URL}?c=${code}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('indisponivel'))))
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => { alive = false; };
  }, [code]);

  if (state.status === 'loading') return <div className="games-standings epg-skeleton" aria-busy="true" />;
  if (state.status === 'error') {
    return <p className="epg-state games-standings-msg" role="alert">Não foi possível carregar a tabela agora.</p>;
  }

  const { tables, matchday } = state.data;
  return (
    <div className="games-standings">
      {matchday && <p className="games-standings-round">{matchday}ª rodada</p>}
      {tables.map((table) => (
        <div key={table.group || 'geral'} className="games-standings-table">
          {table.group && <h4>{table.group}</h4>}
          <table aria-label={`Classificação ${table.group || name}`}>
            <thead>
              <tr>
                <th scope="col" className="pos">#</th>
                <th scope="col" className="team">Time</th>
                <th scope="col" title="Pontos">P</th>
                <th scope="col" title="Jogos">J</th>
                <th scope="col" className="wide" title="Vitórias">V</th>
                <th scope="col" className="wide" title="Empates">E</th>
                <th scope="col" className="wide" title="Derrotas">D</th>
                <th scope="col" title="Saldo de gols">SG</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.team}>
                  <td className="pos">{row.position}</td>
                  <td className="team"><Crest src={row.crest} /><span>{row.team}</span></td>
                  <td className="pts">{row.points}</td>
                  <td>{row.played}</td>
                  <td className="wide">{row.won}</td>
                  <td className="wide">{row.draw}</td>
                  <td className="wide">{row.lost}</td>
                  <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

const GamesToday = () => {
  const [state, setState] = useState({ status: 'loading', days: [] });
  const [day, setDay] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [openTable, setOpenTable] = useState(null);

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
  // Um bloco por campeonato, na ordem de importância; dentro dele, os que já acabaram vão para o
  // fim, então o topo é sempre o que está passando ou vem a seguir.
  const groups = [];
  for (const game of games) {
    let group = groups.find((item) => item.name === game.competition.name);
    if (!group) {
      group = { name: game.competition.name, order: game.competition.order, table: null, games: [] };
      groups.push(group);
    }
    group.table = group.table || game.competition.table || null;
    group.games.push(game);
  }
  groups.sort((a, b) => a.order - b.order);
  for (const group of groups) {
    group.games = [
      ...group.games.filter((game) => statusOf(game, now) !== 'done'),
      ...group.games.filter((game) => statusOf(game, now) === 'done'),
    ];
  }

  return (
    <section id="jogos" className="relative px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">ESPORTES AO VIVO</span>
          <h1 className="agtv-section-title">
            Jogos de <span>hoje</span>
          </h1>
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

            {groups.length === 0 ? (
              <p className="epg-state" role="status">Nenhum jogo ao vivo na programação deste dia.</p>
            ) : (
              <div className="games-groups">
                {groups.map((group) => (
                  <section key={group.name} className="games-group" aria-label={group.name}>
                    <div className="games-group-head">
                      <h3 className="games-group-title">
                        {group.name} <span>{group.games.length} {group.games.length === 1 ? 'jogo' : 'jogos'}</span>
                      </h3>
                      {group.table && (
                        <button
                          type="button"
                          className={`games-table-toggle${openTable === group.table ? ' is-open' : ''}`}
                          aria-expanded={openTable === group.table}
                          onClick={() => setOpenTable(openTable === group.table ? null : group.table)}
                        >
                          <FiBarChart2 aria-hidden="true" /> Tabela <FiChevronDown aria-hidden="true" className="chev" />
                        </button>
                      )}
                    </div>
                    {group.table && openTable === group.table && <Standings code={group.table} name={group.name} />}
                    <ul className="games-list">
                      {group.games.map((game) => <GameRow key={game.id} game={game} now={now} />)}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default GamesToday;
