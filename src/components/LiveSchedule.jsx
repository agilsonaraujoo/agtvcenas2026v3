import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const isDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const sharedDateFromLocation = () => {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('date');
  return isDateKey(value) ? value : null;
};

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
  const [showSynopsis, setShowSynopsis] = useState(false);

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
            <button
              type="button"
              className="epg-current-trigger"
              aria-expanded={showSynopsis}
              aria-controls={`epg-synopsis-${channel.slug}`}
              aria-label={`${showSynopsis ? 'Ocultar' : 'Ver'} sinopse: ${channel.current.title}`}
              onClick={() => setShowSynopsis((visible) => !visible)}
            >
              {channel.current.posterUrl && (
                <img className="epg-artwork epg-artwork--current" src={channel.current.posterUrl} alt="" loading="lazy" />
              )}
              <span className="epg-title">{channel.current.title}</span>
              <span className="epg-synopsis-toggle">{showSynopsis ? 'Ocultar sinopse' : 'Ver sinopse'}</span>
            </button>
            <p className="epg-time">
              {formatTime(channel.current.start)} – {formatTime(channel.current.end)}
            </p>
            <div className="epg-progress" aria-hidden="true">
              <span style={{ width: `${progressOf(channel.current, now)}%` }} />
            </div>
            {showSynopsis && (
              <p id={`epg-synopsis-${channel.slug}`} className="epg-desc epg-current-synopsis">
                {channel.current.description || 'Sinopse não disponível para este programa.'}
              </p>
            )}
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

const DayGuide = ({ channel, dates, initialDate, onClose, onShare, shareStatus }) => {
  const [date, setDate] = useState(initialDate);
  const [state, setState] = useState({ status: 'loading', programs: [] });
  const [now, setNow] = useState(Date.now());
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const scrollY = window.scrollY;
    const activeElement = document.activeElement;
    const body = document.body;
    const root = document.documentElement;
    const bodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const rootOverflow = root.style.overflow;
    const rootScrollBehavior = root.style.scrollBehavior;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    root.style.scrollBehavior = 'auto';
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      Object.assign(body.style, bodyStyles);
      root.style.overflow = rootOverflow;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, scrollY);
      root.style.scrollBehavior = rootScrollBehavior;
      if (activeElement instanceof HTMLElement) activeElement.focus({ preventScroll: true });
    };
  }, []);

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
    const onKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const modal = document.querySelector('.epg-modal');
      const focusable = modal && modal.querySelectorAll('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="epg-overlay" role="dialog" aria-modal="true" aria-label={`Grade do dia: ${channel.channel}`} onClick={onClose}>
      <div className="epg-modal" onClick={(event) => event.stopPropagation()}>
        <header className="epg-modal-header">
          <div className="epg-modal-heading">
            <h3>{channel.channel}</h3>
            <button type="button" className="epg-share epg-share--modal" onClick={() => onShare(date)}>
              Compartilhar este dia
            </button>
            {shareStatus && <span className="epg-share-status" role="status">{shareStatus}</span>}
          </div>
          <button ref={closeButtonRef} type="button" className="epg-close" onClick={onClose} aria-label="Fechar grade">×</button>
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

        <div className="epg-list" aria-label="Programação do canal">
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
                    <div className="epg-guide-entry">
                      {program.posterUrl && (
                        <img
                          className="epg-artwork epg-artwork--guide"
                          src={program.posterUrl}
                          alt=""
                          loading="lazy"
                        />
                      )}
                      <div className="epg-guide-details">
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
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

const LiveSchedule = () => {
  const [state, setState] = useState({ status: 'loading', data: null });
  const [group, setGroup] = useState('todos');
  const [now, setNow] = useState(Date.now());
  const [guide, setGuide] = useState(null);
  const [shareStatus, setShareStatus] = useState('');
  const sharedDate = sharedDateFromLocation();

  const load = useCallback(async () => {
    try {
      const requestUrl = new URL(API_CONFIG.PROGRAMACAO.URL, window.location.origin);
      if (sharedDate) requestUrl.searchParams.set('date', sharedDate);
      const { ok, data } = await fetchJson(requestUrl.toString());
      if (!ok || !data || !Array.isArray(data.channels)) throw new Error('indisponivel');
      setState({ status: 'ready', data });
      setNow(Date.now());
    } catch {
      setState((previous) => (previous.data ? previous : { status: 'error', data: null }));
    }
  }, [sharedDate]);

  const copyScheduleLink = useCallback(async (date) => {
    const url = new URL(window.location.href);
    url.searchParams.set('date', date);
    url.hash = 'programacao';
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareStatus('Link copiado!');
    } catch {
      window.prompt('Copie o link da programacao:', url.toString());
    }
    window.setTimeout(() => setShareStatus(''), 2500);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!sharedDate || state.status !== 'ready') return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById('programacao')?.scrollIntoView({ block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sharedDate, state.status]);

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
            <div className="epg-filters-sticky">
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
                <button type="button" className="epg-share" onClick={() => copyScheduleLink(data.date)}>
                  Compartilhar o dia
                </button>
              </div>
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
          dates={Array.from(new Set([
            ...(sharedDate ? [sharedDate] : []),
            ...(data.availableDates && data.availableDates.length ? data.availableDates : [data.date]),
          ]))}
          initialDate={sharedDate || data.date}
          onClose={() => setGuide(null)}
          onShare={copyScheduleLink}
          shareStatus={shareStatus}
        />
      )}
    </section>
  );
};

export default LiveSchedule;
