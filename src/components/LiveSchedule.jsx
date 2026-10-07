import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_CONFIG } from '../utils/api';
import '../styles/live-schedule.css';

const TIMEZONE = 'America/Sao_Paulo';
const REFRESH_MS = 60 * 1000;

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

const formatTime = (iso) => timeFormatter.format(new Date(iso));
const formatDay = (key) => dateFormatter.format(new Date(`${key}T12:00:00-03:00`)).replace('.', '');

const progressOf = (program, now) => {
  const start = Date.parse(program.start);
  const end = Date.parse(program.end);
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  const data = await response.json().catch(() => null);
  if (!response.ok && !data) throw new Error('Falha ao carregar a programação.');
  return { ok: response.ok, data };
};

const ChannelCard = ({ channel, now, onOpen }) => {
  if (!channel.available) {
    return (
      <article className="epg-card epg-card--empty">
        <h3 className="epg-channel">{channel.channel}</h3>
        <p className="epg-unavailable">Programação indisponível no momento.</p>
      </article>
    );
  }

  return (
    <article className="epg-card">
      <h3 className="epg-channel">{channel.channel}</h3>

      <div className="epg-now">
        <span className="epg-badge epg-badge--live">
          <i aria-hidden="true" /> AO VIVO AGORA
        </span>
        {channel.current ? (
          <>
            {channel.current.posterUrl && (
              <img className="epg-artwork epg-artwork--current" src={channel.current.posterUrl} alt="" loading="lazy" />
            )}
            <p className="epg-title">{channel.current.title}</p>
            <p className="epg-time">
              {formatTime(channel.current.start)} – {formatTime(channel.current.end)}
            </p>
            <div className="epg-progress" aria-hidden="true">
              <span style={{ width: `${progressOf(channel.current, now)}%` }} />
            </div>
          </>
        ) : (
          <p className="epg-muted">Sem informação do programa atual.</p>
        )}
      </div>

      <div className="epg-next">
        <span className="epg-badge">A SEGUIR</span>
        {channel.next ? (
          <div className="epg-next-content">
            {channel.next.posterUrl && (
              <img className="epg-artwork epg-artwork--next" src={channel.next.posterUrl} alt="" loading="lazy" />
            )}
            <p className="epg-next-line">
              <strong>{formatTime(channel.next.start)}</strong> {channel.next.title}
            </p>
          </div>
        ) : (
          <p className="epg-muted">Sem informação do próximo programa.</p>
        )}
      </div>

      <button type="button" className="epg-link" onClick={() => onOpen(channel)}>
        Ver grade do dia
      </button>
    </article>
  );
};

const DayGuide = ({ channel, dates, initialDate, onClose }) => {
  const [date, setDate] = useState(initialDate);
  const [state, setState] = useState({ status: 'loading', programs: [] });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', programs: [] });
    fetchJson(`${API_CONFIG.PROGRAMACAO.URL}?channel=${channel.slug}&date=${date}`)
      .then(({ ok, data }) => {
        if (!active) return;
        const entry = data && data.channels && data.channels[0];
        if (!ok || !entry) throw new Error('indisponivel');
        setState({ status: entry.programs.length ? 'ready' : 'empty', programs: entry.programs });
      })
      .catch(() => active && setState({ status: 'error', programs: [] }));
    return () => { active = false; };
  }, [channel.slug, date]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="epg-overlay" role="dialog" aria-modal="true" aria-label={`Grade do dia: ${channel.channel}`} onClick={onClose}>
      <div className="epg-modal" onClick={(event) => event.stopPropagation()}>
        <header className="epg-modal-header">
          <h3>{channel.channel}</h3>
          <button type="button" className="epg-close" onClick={onClose} aria-label="Fechar">×</button>
        </header>

        <div className="epg-days" role="tablist">
          {dates.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === date}
              className={`epg-day${key === date ? ' is-active' : ''}`}
              onClick={() => setDate(key)}
            >
              {formatDay(key)}
            </button>
          ))}
        </div>

        <div className="epg-list">
          {state.status === 'loading' && <p className="epg-muted">Carregando grade...</p>}
          {state.status === 'error' && <p className="epg-error">Não foi possível carregar a grade deste dia.</p>}
          {state.status === 'empty' && <p className="epg-muted">Sem programação disponível para este dia.</p>}
          {state.status === 'ready' && (
            <ul>
              {state.programs.map((program) => {
                const live = Date.parse(program.start) <= now && now < Date.parse(program.end);
                return (
                  <li key={`${program.start}-${program.title}`} className={live ? 'is-live' : ''}>
                    <time>{formatTime(program.start)}</time>
                    <div>
                      <p className="epg-title">
                        {program.title}
                        {live && <span className="epg-badge epg-badge--live epg-badge--inline">AO VIVO</span>}
                      </p>
                      <p className="epg-time">
                        até {formatTime(program.end)} · {program.duration} min
                        {program.rating ? ` · ${program.rating}` : ''}
                      </p>
                      {program.description && <p className="epg-desc">{program.description}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const LiveSchedule = () => {
  const [state, setState] = useState({ status: 'loading', data: null });
  const [group, setGroup] = useState('todos');
  const [now, setNow] = useState(Date.now());
  const [guide, setGuide] = useState(null);

  const load = useCallback(async () => {
    try {
      const { ok, data } = await fetchJson(API_CONFIG.PROGRAMACAO.URL);
      if (!ok || !data || !Array.isArray(data.channels)) throw new Error('indisponivel');
      setState({ status: 'ready', data });
      setNow(Date.now());
    } catch {
      setState((previous) => (previous.data ? previous : { status: 'error', data: null }));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const { data } = state;
  const available = useMemo(
    () => (data ? data.channels.filter((channel) => channel.available) : []),
    [data],
  );
  const groups = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.groups || {}).filter(([key]) => available.some((channel) => channel.group === key));
  }, [data, available]);
  const visible = useMemo(() => {
    if (!data) return [];
    return data.channels.filter((channel) => group === 'todos' || channel.group === group);
  }, [data, group]);
  const missing = data ? data.channels.filter((channel) => !channel.available) : [];

  return (
    <section id="programacao" className="relative px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">PROGRAMAÇÃO DE TV</span>
          <h2 className="agtv-section-title">
            No ar <span>agora</span>
          </h2>
        </div>
        <p className="agtv-section-description mb-8">
          Veja o que está passando e o que vem a seguir nos principais canais. Horários de Brasília.
        </p>

        {state.status === 'loading' && (
          <div className="epg-grid" aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="epg-card epg-skeleton" />)}
          </div>
        )}

        {state.status === 'error' && (
          <p className="epg-state epg-error" role="alert">
            Não foi possível carregar a programação agora. Tente novamente em instantes.
            <button type="button" className="epg-link" onClick={() => { setState({ status: 'loading', data: null }); load(); }}>
              Tentar novamente
            </button>
          </p>
        )}

        {state.status === 'ready' && available.length === 0 && (
          <p className="epg-state" role="status">
            A programação dos canais não está disponível no momento. Ela volta a aparecer assim que as fontes forem atualizadas.
          </p>
        )}

        {state.status === 'ready' && available.length > 0 && (
          <>
            <div className="epg-filters" role="tablist" aria-label="Categorias de canais">
              {[['todos', 'Todos'], ...groups].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={group === key}
                  className={`epg-filter${group === key ? ' is-active' : ''}`}
                  onClick={() => setGroup(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="epg-grid">
              {visible.map((channel) => (
                <ChannelCard key={channel.slug} channel={channel} now={now} onOpen={setGuide} />
              ))}
            </div>

            {missing.length > 0 && (
              <p className="epg-footnote">
                Sem dados de programação no momento: {missing.map((channel) => channel.channel).join(', ')}.
              </p>
            )}
          </>
        )}
      </div>

      {guide && data && (
        <DayGuide
          channel={guide}
          dates={data.availableDates && data.availableDates.length ? data.availableDates : [data.date]}
          initialDate={data.date}
          onClose={() => setGuide(null)}
        />
      )}
    </section>
  );
};

export default LiveSchedule;
