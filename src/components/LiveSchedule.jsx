import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiChevronRight, FiCompass, FiFilm, FiLayers, FiSearch, FiShare2, FiTv } from 'react-icons/fi';
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

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE });
const dayKeyOf = (ms) => dayKeyFormatter.format(new Date(ms));

// Busca sem diferenciar acento nem maiúscula ("sbt", "Globo", "jornal nacional").
const normalize = (value) => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const DAY_MS = 24 * 60 * 60 * 1000;
const dayLabel = (key, now) => {
  if (key === dayKeyOf(now)) return 'Hoje';
  if (key === dayKeyOf(now + DAY_MS)) return 'Amanhã';
  return formatDay(key);
};

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

// Capa do programa, quando o catálogo tem; sem capa (ou se a imagem falhar), o card fica só com o texto.
const Artwork = ({ program, variant }) => {
  const [failed, setFailed] = useState(false);
  if (!program.posterUrl || failed) return null;
  return (
    <img
      className={`epg-artwork epg-artwork--${variant}`}
      src={program.posterUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

// Uma linha por canal: dá para comparar vários canais na mesma tela e tocar para abrir a grade.
const ChannelRow = ({ channel, main, after, now, live, onOpen }) => (
  <li>
    <button type="button" className="epg-row" onClick={() => onOpen(channel)} aria-label={`Ver grade do dia: ${channel.channel}`}>
      <span className="epg-row-channel">{channel.channel}</span>
      <Artwork program={main || {}} variant="row" />
      <span className="epg-row-body">
        <span className="epg-row-title">{main ? main.title : 'Sem informação do programa'}</span>
        <span className="epg-row-meta">
          {main && `${formatTime(main.start)} – ${formatTime(main.end)}`}
          {after && <span className="epg-row-next"> · Depois: {formatTime(after.start)} {after.title}</span>}
        </span>
        {live && main && (
          <span className="epg-progress" aria-hidden="true">
            <span style={{ width: `${progressOf(main, now)}%` }} />
          </span>
        )}
      </span>
      <FiChevronRight aria-hidden="true" className="epg-row-arrow" />
    </button>
  </li>
);

const DayGuide = ({ channel, channels = [], onNavigate, dates, initialDate, onClose, onShare, shareStatus }) => {
  // Passar para o canal anterior/próximo sem fechar: setas, deslizar com o dedo ou ← →.
  const index = channels.findIndex((c) => c.slug === channel.slug);
  const prev = index > 0 ? channels[index - 1] : null;
  const next = index >= 0 && index < channels.length - 1 ? channels[index + 1] : null;
  const [direction, setDirection] = useState(0);
  const goTo = useCallback((target, dir) => { if (target && onNavigate) { setDirection(dir); onNavigate(target); } }, [onNavigate]);
  const touchRef = useRef(null);
  const onTouchStart = (event) => { if (event.target.closest('.epg-days')) { touchRef.current = null; return; } const t = event.touches[0]; touchRef.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (event) => {
    const start = touchRef.current; touchRef.current = null;
    if (!start) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(dx < 0 ? next : prev, dx < 0 ? 1 : -1);
  };
  const [date, setDate] = useState(initialDate);
  const [state, setState] = useState({ status: 'loading', programs: [] });
  const [now, setNow] = useState(Date.now());
  // Hoje a grade começa no que está passando; o que já passou fica atrás de um botão.
  const [showPast, setShowPast] = useState(false);
  // Sinopses abertas ou fechadas pela pessoa; a do programa no ar começa aberta.
  const [opened, setOpened] = useState({});
  const listRef = useRef(null);
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
    setShowPast(false);
    setOpened({});
    if (listRef.current) listRef.current.scrollTop = 0;
    fetchJson(`${API_CONFIG.PROGRAMACAO.URL}?channel=${channel.slug}&date=${date}`)
      .then(({ ok, data }) => {
        if (!active) return;
        const entry = data && data.channels && data.channels[0];
        if (!ok || !entry) throw new Error('indisponivel');
        // A fonte às vezes repete o mesmo programa no mesmo horário: mostramos uma vez só.
        const seen = new Set();
        const programs = entry.programs.filter((p) => {
          const key = `${p.start}|${p.title}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setState({ status: programs.length ? 'ready' : 'empty', programs });
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
      if (event.key === 'ArrowRight' && next) { goTo(next, 1); return; }
      if (event.key === 'ArrowLeft' && prev) { goTo(prev, -1); return; }

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
  }, [onClose, goTo, next, prev]);

  const pastCount = date === dayKeyOf(now)
    ? state.programs.filter((program) => Date.parse(program.end) <= now).length
    : 0;
  const hiddenPast = showPast ? 0 : pastCount;
  const shownPrograms = hiddenPast ? state.programs.slice(hiddenPast) : state.programs;

  return createPortal(
    <div className="epg-overlay" role="dialog" aria-modal="true" aria-label={`Grade do dia: ${channel.channel}`} onClick={onClose}>
      <div className="epg-modal" onClick={(event) => event.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <header className="epg-modal-header">
          <div className="epg-guide-bar">
            {channels.length > 1 && (
              <button type="button" className="epg-pager-btn" onClick={() => goTo(prev, -1)} disabled={!prev} aria-label={prev ? `Canal anterior: ${prev.channel}` : 'Sem canal anterior'}>‹</button>
            )}
            <div className="epg-guide-name">
              <h3 key={channel.slug} className={`epg-guide-title${direction > 0 ? ' from-right' : direction < 0 ? ' from-left' : ''}`}>{channel.channel}</h3>
              {channels.length > 1 && <span>Canal {index + 1} de {channels.length}</span>}
            </div>
            {channels.length > 1 && (
              <button type="button" className="epg-pager-btn" onClick={() => goTo(next, 1)} disabled={!next} aria-label={next ? `Próximo canal: ${next.channel}` : 'Sem próximo canal'}>›</button>
            )}
          </div>
          <button type="button" className="epg-icon-btn" onClick={() => onShare(date)} aria-label="Copiar link deste dia" title="Copiar link deste dia">
            <FiShare2 aria-hidden="true" />
          </button>
          <button ref={closeButtonRef} type="button" className="epg-icon-btn epg-close" onClick={onClose} aria-label="Fechar grade">×</button>
        </header>
        {shareStatus && <p className="epg-share-status" role="status">{shareStatus}</p>}

        <div className="epg-days" role="tablist" aria-label="Dia">
          {dates.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === date}
              className={`epg-day${key === date ? ' is-active' : ''}`}
              onClick={() => setDate(key)}
            >
              {dayLabel(key, now)}
            </button>
          ))}
        </div>

        <div className="epg-list" aria-label="Programação do canal" ref={listRef}>
          {state.status === 'loading' && <p className="epg-muted">Carregando grade...</p>}
          {state.status === 'error' && <p className="epg-error">Não foi possível carregar a grade deste dia.</p>}
          {state.status === 'empty' && <p className="epg-muted">Sem programação disponível para este dia.</p>}
          {state.status === 'ready' && (
            <>
              {hiddenPast > 0 && (
                <button type="button" className="epg-past-toggle" onClick={() => setShowPast(true)}>
                  Ver o que já passou ({hiddenPast})
                </button>
              )}
              <ul>
                {shownPrograms.map((program) => {
                  const key = `${program.start}-${program.title}`;
                  const live = Date.parse(program.start) <= now && now < Date.parse(program.end);
                  const past = Date.parse(program.end) <= now;
                  const open = Boolean(program.description) && (key in opened ? opened[key] : live);
                  return (
                    <li key={key} className={live ? 'is-live' : past ? 'is-past' : ''}>
                      <button
                        type="button"
                        className="epg-entry"
                        aria-expanded={program.description ? open : undefined}
                        disabled={!program.description}
                        onClick={() => setOpened((previous) => ({ ...previous, [key]: !open }))}
                      >
                        <time>{formatTime(program.start)}</time>
                        <Artwork program={program} variant="guide" />
                        <span className="epg-entry-body">
                          <span className="epg-title">
                            {program.title}
                            {live && <span className="epg-badge epg-badge--live epg-badge--inline">AO VIVO</span>}
                          </span>
                          <span className="epg-time">
                            até {formatTime(program.end)} · {program.duration} min
                            {program.rating ? ` · ${program.rating}` : ''}
                          </span>
                        </span>
                        {program.description && <FiChevronDown aria-hidden="true" className={`epg-entry-arrow${open ? ' is-open' : ''}`} />}
                      </button>
                      {live && (
                        <div className="epg-progress" aria-hidden="true">
                          <span style={{ width: `${progressOf(program, now)}%` }} />
                        </div>
                      )}
                      {open && <p className="epg-desc">{program.description}</p>}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Abas da programação: canais abertos e de esporte juntos em "TV ao vivo".
const FILTERS = [
  { key: 'aovivo', label: 'TV ao vivo', Icon: FiTv, groups: ['abertos', 'esportes'] },
  { key: 'filmes', label: 'Filmes', Icon: FiFilm, groups: ['filmes'] },
  { key: 'series', label: 'Séries', Icon: FiLayers, groups: ['series'] },
  { key: 'variedades', label: 'Variedades', Icon: FiCompass, groups: ['documentarios'] },
];

const NIGHT_TIME = '21:00';
const nightOf = (key) => Date.parse(`${key}T${NIGHT_TIME}:00-03:00`);

const LiveSchedule = () => {
  const [state, setState] = useState({ status: 'loading', data: null });
  const [group, setGroup] = useState('aovivo');
  const [when, setWhen] = useState('agora');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(Date.now());
  const [guide, setGuide] = useState(null);
  // Grade completa de cada dia, buscada só quando a pessoa escolhe a noite: { 'AAAA-MM-DD': { slug: programas } }.
  const [days, setDays] = useState({});
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

  const { data } = state;
  const today = dayKeyOf(now);
  const tomorrow = data ? (data.availableDates || []).find((key) => key > today) : null;

  // Depois das 21h, "Hoje à noite" seria igual a "Agora".
  const moments = useMemo(() => [
    { key: 'agora', label: 'Agora' },
    ...(now < nightOf(today) ? [{ key: 'noite', label: 'Hoje à noite', date: today }] : []),
    ...(tomorrow ? [{ key: 'amanha', label: 'Amanhã à noite', date: tomorrow }] : []),
  ], [now, today, tomorrow]);
  const moment = moments.find((item) => item.key === when) || moments[0];
  const momentDate = moment.date;

  useEffect(() => {
    if (!momentDate || days[momentDate]) return undefined;
    let active = true;
    fetchJson(`${API_CONFIG.PROGRAMACAO.URL}?date=${momentDate}`)
      .then(({ ok, data: day }) => {
        if (!active) return;
        if (!ok || !day || !Array.isArray(day.channels)) throw new Error('indisponivel');
        const programs = Object.fromEntries(day.channels.map((channel) => [channel.slug, channel.programs || []]));
        setDays((previous) => ({ ...previous, [momentDate]: programs }));
      })
      .catch(() => active && setDays((previous) => ({ ...previous, [momentDate]: 'erro' })));
    return () => { active = false; };
  }, [momentDate, days]);

  const available = useMemo(
    () => (data ? data.channels.filter((channel) => channel.available) : []),
    [data],
  );
  const filters = useMemo(
    () => FILTERS.filter((item) => available.some((channel) => item.groups.includes(channel.group))),
    [available],
  );

  const dayPrograms = momentDate ? days[momentDate] : null;
  const dayLoading = Boolean(momentDate) && !dayPrograms;
  const dayFailed = dayPrograms === 'erro';

  // O programa principal e o seguinte de cada canal no momento escolhido.
  const rows = useMemo(() => available.map((channel) => {
    if (!momentDate) return { channel, main: channel.current || channel.next, after: channel.current ? channel.next : null };
    const programs = (dayPrograms && dayPrograms !== 'erro' && dayPrograms[channel.slug]) || [];
    const at = nightOf(momentDate);
    const main = programs.find((item) => Date.parse(item.start) <= at && at < Date.parse(item.end))
      || programs.find((item) => Date.parse(item.start) > at);
    const after = main ? programs.find((item) => Date.parse(item.start) >= Date.parse(main.end)) : null;
    return { channel, main, after };
  }), [available, momentDate, dayPrograms]);

  // Com busca, olha todas as categorias: quem procura "Band" não precisa saber em qual aba ela está.
  const term = normalize(query.trim());
  const visible = useMemo(() => {
    if (term) {
      return rows.filter(({ channel, main, after }) => (
        [channel.channel, main && main.title, after && after.title].some((value) => normalize(value).includes(term))
      ));
    }
    const active = FILTERS.find((item) => item.key === group) || FILTERS[0];
    return rows.filter(({ channel }) => active.groups.includes(channel.group));
  }, [rows, term, group]);

  const missing = data ? data.channels.filter((channel) => !channel.available) : [];

  return (
    <section id="programacao" className="relative px-4 py-12 text-white sm:py-16">
      <div className="container mx-auto">
        <div className="agtv-section-heading">
          <span className="agtv-section-kicker">GUIA DE TV</span>
          <h1 className="agtv-section-title">
            Programação <span>da TV</span>
          </h1>
        </div>
        <p className="agtv-section-description mb-8">
          Veja o que passa agora e mais tarde. Toque em um canal para abrir a grade completa. Horários de Brasília.
        </p>

        {state.status === 'loading' && <div className="epg-rows epg-skeleton" aria-busy="true" aria-live="polite" />}

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
            <div className="epg-tools">
              <label className="epg-search">
                <FiSearch aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar canal ou programa"
                  aria-label="Buscar canal ou programa"
                />
              </label>
              <div className="epg-moments" role="tablist" aria-label="Quando">
                {moments.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={moment.key === item.key}
                    className={`epg-moment${moment.key === item.key ? ' is-active' : ''}`}
                    onClick={() => setWhen(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="epg-filters-sticky">
              <div className="epg-filters" role="tablist" aria-label="Categorias de canais">
                {filters.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={!term && group === key}
                    className={`epg-filter${!term && group === key ? ' is-active' : ''}`}
                    onClick={() => { setGroup(key); setQuery(''); }}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {momentDate && !dayLoading && !dayFailed && (
              <p className="epg-moment-note">O que passa às 21h de {formatDay(momentDate)}</p>
            )}

            {dayLoading && <div className="epg-rows epg-skeleton" aria-busy="true" />}

            {dayFailed && (
              <p className="epg-state epg-error" role="alert">Não foi possível carregar esse horário agora. Tente novamente em instantes.</p>
            )}

            {!dayLoading && !dayFailed && visible.length === 0 && (
              <p className="epg-state" role="status">Nada encontrado para “{query.trim()}”.</p>
            )}

            {!dayLoading && !dayFailed && visible.length > 0 && (
              <ul className="epg-rows">
                {visible.map(({ channel, main, after }) => (
                  <ChannelRow
                    key={channel.slug}
                    channel={channel}
                    main={main}
                    after={after}
                    now={now}
                    live={!momentDate && Boolean(channel.current)}
                    onOpen={setGuide}
                  />
                ))}
              </ul>
            )}

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
          channels={visible.map((row) => row.channel)}
          onNavigate={setGuide}
          dates={Array.from(new Set([
            ...(sharedDate ? [sharedDate] : []),
            ...(data.availableDates && data.availableDates.length ? data.availableDates : [data.date]),
          ]))}
          initialDate={sharedDate || momentDate || data.date}
          onClose={() => setGuide(null)}
          onShare={copyScheduleLink}
          shareStatus={shareStatus}
        />
      )}
    </section>
  );
};

export default LiveSchedule;
