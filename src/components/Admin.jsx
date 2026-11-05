import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiCopy, FiImage, FiLink, FiLogOut, FiRefreshCw } from 'react-icons/fi';
import { API_CONFIG } from '../utils/api';
import { ART_FORMATS, formatDay, formatTime, gameEnded, gamesArt, moviesArt } from '../utils/adminArt';
import '../styles/admin.css';

const WHATSAPP_LIMIT = 65000;

const gameLine = (game) => {
  const channels = game.channels.map((channel) => channel.name).join(', ');
  const { score } = game;
  if (!score) return `${formatTime(game.start)} • ${game.home} x ${game.away} • ${channels}`;
  const status = score.status === 'finished' ? 'encerrado' : 'ao vivo';
  return `${formatTime(game.start)} • ${game.home} ${score.home} x ${score.away} ${game.away} (${status}) • ${channels}`;
};

const gamesText = (data, onlyUpcoming, now) => {
  const games = data.games.filter((game) => !onlyUpcoming || !gameEnded(game, now));
  if (!games.length) return '';
  const groups = [];
  for (const game of games) {
    let group = groups.find((item) => item.name === game.competition.name);
    if (!group) {
      group = { name: game.competition.name, order: game.competition.order, lines: [] };
      groups.push(group);
    }
    group.lines.push(gameLine(game));
  }
  groups.sort((a, b) => a.order - b.order);
  const blocks = groups.map((group) => [`🏆 *${group.name}*`, ...group.lines].join('\n'));
  return [`⚽ *JOGOS DO DIA* (${formatDay(data.date)})\n_Horários de Brasília_`, ...blocks].join('\n\n');
};

const scheduleText = (data, { group, channel, onlyUpcoming }, now) => {
  const blocks = data.channels
    .filter((item) => (channel ? item.slug === channel : !group || item.group === group))
    .map((item) => {
      const programs = item.programs.filter((program) => !onlyUpcoming || Date.parse(program.end) > now);
      if (!programs.length) return null;
      return [`📺 *${item.name}*`, ...programs.map((program) => `${formatTime(program.start)} ${program.title}`)].join('\n');
    })
    .filter(Boolean);
  if (!blocks.length) return '';
  return [`🗓️ *PROGRAMAÇÃO* (${formatDay(data.date)})\n_Horários de Brasília_`, ...blocks].join('\n\n');
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
};

const useCopy = (text) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return [copied, copy];
};

const LinkRow = ({ label, url }) => {
  const [copied, copy] = useCopy(url);
  return (
    <div className="admin-link">
      <div>
        <strong><FiLink aria-hidden="true" /> {label}</strong>
        <a href={url} target="_blank" rel="noreferrer">{url}</a>
      </div>
      <button type="button" className="admin-copy" onClick={copy}>
        {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  );
};

// Desenha os dois tamanhos, baixa os PNGs e deixa as prévias na tela para conferir. O link de cada
// prévia cobre o navegador que bloquear o segundo download automático.
const ArtMaker = ({ label, fileName, draw }) => {
  const [art, setArt] = useState({ status: 'idle', files: [] });

  useEffect(() => () => {
    art.files.forEach((file) => URL.revokeObjectURL(file.url));
  }, [art.files]);

  const generate = async () => {
    setArt((previous) => ({ ...previous, status: 'working' }));
    try {
      const blobs = await Promise.all(ART_FORMATS.map(draw));
      if (blobs.some((blob) => !blob)) {
        setArt({ status: 'empty', files: [] });
        return;
      }
      const files = blobs.map((blob, index) => ({
        url: URL.createObjectURL(blob),
        name: `${fileName}_${ART_FORMATS[index].key}.png`,
        label: ART_FORMATS[index].label,
      }));
      files.forEach((file) => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        link.click();
      });
      setArt({ status: 'ready', files });
    } catch {
      setArt({ status: 'error', files: [] });
    }
  };

  return (
    <div className="admin-art">
      <button type="button" className="admin-chip" onClick={generate} disabled={art.status === 'working'}>
        <FiImage aria-hidden="true" /> {art.status === 'working' ? 'Gerando...' : label}
      </button>
      {art.status === 'empty' && <p className="admin-count">Nada para mostrar nesse período.</p>}
      {art.status === 'error' && <p className="admin-error" role="alert">Não foi possível gerar a imagem.</p>}
      {art.files.length > 0 && (
        <div className="admin-art-previews">
          {art.files.map((file) => (
            <a key={file.name} href={file.url} download={file.name}>
              <img src={file.url} alt={`Prévia ${file.label}: ${label}`} />
              <span>Baixar {file.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const CopyPanel = ({ title, text, empty, children, art }) => {
  const [copied, copy] = useCopy(text);

  return (
    <section className="admin-panel" aria-label={title}>
      <div className="admin-panel-head">
        <h2>{title}</h2>
        <button type="button" className="admin-copy" onClick={copy} disabled={!text}>
          {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      {children}
      <textarea readOnly value={text || empty} aria-label={`Texto de ${title}`} />
      <p className={`admin-count${text.length > WHATSAPP_LIMIT ? ' is-over' : ''}`}>
        {text.length.toLocaleString('pt-BR')} caracteres
        {text.length > WHATSAPP_LIMIT && ' (grande demais para uma mensagem do WhatsApp; filtre por categoria ou canal)'}
      </p>
      {art}
    </section>
  );
};

const Admin = () => {
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ status: 'checking', error: null, data: null });
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [group, setGroup] = useState('');
  const [channel, setChannel] = useState('');

  useEffect(() => {
    document.title = 'Admin | AGTV';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  const load = useCallback(async (date) => {
    setState((previous) => ({ ...previous, status: previous.data ? 'refreshing' : 'loading', error: null }));
    try {
      const query = date ? `?${new URLSearchParams({ date })}` : '';
      const response = await fetch(`${API_CONFIG.ADMIN.URL}${query}`);
      const data = await response.json();
      if (response.status === 401) {
        // Sem sessão: na primeira abertura é normal; com a página aberta, a sessão venceu.
        setState((previous) => ({
          status: 'locked',
          error: previous.data ? 'Sua sessão expirou. Entre de novo.' : null,
          data: null,
        }));
        return;
      }
      if (!response.ok) throw new Error(data.error ? data.error.message : 'Não foi possível carregar.');
      setState({ status: 'ready', error: null, data });
    } catch (error) {
      setState((previous) => ({
        status: previous.data ? 'ready' : 'locked',
        error: error.message,
        data: previous.data,
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const login = async () => {
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    try {
      const response = await fetch(API_CONFIG.ADMIN.URL, {
        method: 'POST',
        headers: { 'X-Admin-Password': password },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ? data.error.message : 'Não foi possível entrar.');
      setPassword('');
      await load();
    } catch (error) {
      setState({ status: 'locked', error: error.message, data: null });
    }
  };

  const logout = async () => {
    await fetch(API_CONFIG.ADMIN.URL, { method: 'DELETE' }).catch(() => {});
    setState({ status: 'locked', error: null, data: null });
  };

  const { data } = state;
  const games = useMemo(() => (data ? gamesText(data, onlyUpcoming, Date.now()) : ''), [data, onlyUpcoming]);
  const schedule = useMemo(
    () => (data ? scheduleText(data, { group, channel, onlyUpcoming }, Date.now()) : ''),
    [data, group, channel, onlyUpcoming],
  );

  if (state.status === 'checking' || (!data && state.status === 'loading' && !password)) {
    return <main className="admin-page admin-login" aria-busy="true" />;
  }

  if (!data) {
    return (
      <main className="admin-page admin-login">
        <form
          className="admin-panel"
          onSubmit={(event) => {
            event.preventDefault();
            login();
          }}
        >
          <h1>Admin AGTV</h1>
          <label htmlFor="admin-password">Senha</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {state.error && <p className="admin-error" role="alert">{state.error}</p>}
          <button type="submit" className="admin-copy" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
    );
  }

  const channels = data.channels.filter((item) => !group || item.group === group);

  return (
    <main className="admin-page">
      <header className="admin-head">
        <div>
          <h1>Admin AGTV</h1>
          <p>{formatDay(data.date)} · atualizado às {formatTime(data.now)}</p>
        </div>
        <button type="button" className="admin-chip" onClick={logout}>
          <FiLogOut aria-hidden="true" /> Sair
        </button>
      </header>

      <section className="admin-panel admin-links" aria-label="Links para enviar">
        <LinkRow label="Jogos do dia" url={`${window.location.origin}/jogos`} />
        <LinkRow label="Programação da TV" url={`${window.location.origin}/programacao`} />
      </section>

      <div className="admin-controls">
        {[[data.today, 'Hoje'], [data.tomorrow, 'Amanhã']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`admin-chip${data.date === key ? ' is-active' : ''}`}
            onClick={() => load(key)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="admin-chip"
          onClick={() => load(data.date)}
          disabled={state.status === 'refreshing'}
        >
          <FiRefreshCw aria-hidden="true" /> Atualizar
        </button>
        {data.date === data.today && (
          <label className="admin-check">
            <input type="checkbox" checked={onlyUpcoming} onChange={(event) => setOnlyUpcoming(event.target.checked)} />
            Só o que ainda vai passar
          </label>
        )}
      </div>
      {state.error && <p className="admin-error" role="alert">{state.error}</p>}

      <div className="admin-grid">
        <CopyPanel
          title="Jogos do dia"
          text={games}
          empty="Nenhum jogo para mostrar."
          art={(
            <ArtMaker
              key={`jogos-${data.date}`}
              label="Gerar imagem dos jogos"
              fileName={`AGTV_jogos_${data.date}`}
              draw={(format) => gamesArt(data, { onlyUpcoming, now: Date.now(), format })}
            />
          )}
        />
        <CopyPanel
          title="Programação"
          text={schedule}
          empty="Nenhum programa para mostrar."
          art={(
            <ArtMaker
              key={`filmes-${data.date}`}
              label="Gerar imagem de filmes e séries"
              fileName={`AGTV_filmes_series_${data.date}`}
              draw={(format) => moviesArt(data, { onlyUpcoming, now: Date.now(), format })}
            />
          )}
        >
          <div className="admin-filters">
            <select
              aria-label="Categoria"
              value={group}
              onChange={(event) => {
                setGroup(event.target.value);
                setChannel('');
              }}
            >
              <option value="">Todas as categorias</option>
              {Object.entries(data.groups).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select aria-label="Canal" value={channel} onChange={(event) => setChannel(event.target.value)}>
              <option value="">Todos os canais</option>
              {channels.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </div>
        </CopyPanel>
      </div>
    </main>
  );
};

export default Admin;
