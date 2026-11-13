import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiCopy, FiDownload, FiImage, FiLink, FiLogOut, FiRefreshCw, FiShare } from 'react-icons/fi';
import { API_CONFIG } from '../utils/api';
import { SCHEDULE_TABS, scheduleTabPath } from '../utils/routes';
import {
  ART_FORMATS, PRIME_END, PRIME_START, formatDay, formatTime, gameEnded, gamesArt, gamesCaption,
  movieCandidates, movieRowsFor, moviesArt, moviesCaption, simpleRanking, upcomingGames,
} from '../utils/adminArt';
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

// No celular, baixar sozinho faz o Safari abrir a imagem e sair do admin; lá a pessoa copia ou envia.
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

const canCopyImage = () => typeof window.ClipboardItem === 'function' && Boolean(navigator.clipboard?.write);

const canShareImage = (file) => {
  try {
    return Boolean(navigator.canShare?.({ files: [file] }));
  } catch {
    return false;
  }
};

const ArtPreview = ({ file, label, caption }) => {
  const [done, setDone] = useState('');

  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => setDone(''), 2500);
    return () => clearTimeout(timer);
  }, [done]);

  // Copia direto para a área de transferência: dá para colar no WhatsApp sem salvar na galeria.
  const copy = async () => {
    try {
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': file.blob })]);
      setDone('Copiada');
    } catch {
      setDone('Não deu para copiar');
    }
  };

  const share = async () => {
    try {
      // A legenda vai junto; se o app de destino ignorar o texto, o botão Copiar legenda cobre.
      await navigator.share(caption ? { files: [file.shareFile], text: caption } : { files: [file.shareFile] });
    } catch (error) {
      if (error?.name !== 'AbortError') setDone('Não deu para enviar');
    }
  };

  return (
    <figure className="admin-art-preview">
      <img src={file.url} alt={`Prévia ${file.label}: ${label}`} />
      <figcaption>{file.label}</figcaption>
      <div className="admin-art-actions">
        {canCopyImage() && (
          <button type="button" className="admin-chip" onClick={copy}>
            {done === 'Copiada' ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />} Copiar
          </button>
        )}
        {canShareImage(file.shareFile) && (
          <button type="button" className="admin-chip" onClick={share}>
            <FiShare aria-hidden="true" /> Enviar
          </button>
        )}
        <a className="admin-chip" href={file.url} download={file.name}>
          <FiDownload aria-hidden="true" /> Baixar
        </a>
      </div>
      {done && <p className="admin-art-status" role="status">{done}</p>}
    </figure>
  );
};

// Desenha os dois tamanhos e deixa as prévias na tela, cada uma com Copiar, Enviar e Baixar.
// No computador também baixa os PNGs na hora.
// Horário padrão da arte de filmes: hoje, da próxima meia hora até 3 horas depois; outro dia, 20h às 23h.
const defaultArtWindow = (data) => {
  if (data.date !== data.today) return { start: PRIME_START, end: PRIME_END };
  const [hours, minutes] = formatTime(new Date().toISOString()).split(':').map(Number);
  const start = Math.min(Math.ceil((hours * 60 + minutes) / 30) * 30, 23 * 60);
  const end = Math.min(start + 180, 23 * 60 + 59);
  const hhmm = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  return { start: hhmm(start), end: hhmm(end) };
};

// Pede à IA a ordem dos itens da grade (só ids; nomes e horários continuam os da grade). null = sem resposta.
const askAiRanking = async (kind, candidates, limit) => {
  try {
    const response = await fetch(API_CONFIG.ADMIN.URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Acao': 'destaques' },
      body: JSON.stringify({ kind, limit, candidates }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && Array.isArray(result.ids) && result.ids.length ? result.ids : null;
  } catch {
    return null;
  }
};

// Jogos de maior audiência para a arte: a IA ordena os jogos do dia; sem ela, a ordem por campeonato.
const pickGames = async (data, { onlyUpcoming, useAi }) => {
  const games = upcomingGames(data, { onlyUpcoming, now: Date.now() });
  if (!useAi || !games.length) return { ranked: null, note: '' };
  const ids = await askAiRanking('jogos', games.map((game, id) => ({
    id,
    time: formatTime(game.start),
    title: `${game.home} x ${game.away} (${game.competition.name})`,
    channel: game.channels.map((channel) => channel.name).join(', '),
  })), 16);
  if (!ids) return { ranked: null, note: 'A IA não respondeu agora; usei a ordem por campeonato.' };
  const ranked = ids.map((id) => games[id]).filter(Boolean);
  return { ranked, note: `A IA escolheu os jogos de maior audiência entre ${games.length} do dia.` };
};

// Destaques de filmes e séries do horário: a IA ordena os programas da grade (nunca inventa nome);
// sem resposta dela, um por canal.
const pickMovies = async (data, { start, end, onlyUpcoming, useAi }) => {
  const window = { start, end };
  const candidates = movieCandidates(data, { start, end, onlyUpcoming, now: Date.now() });
  if (!candidates.length) return { ranked: [], window, note: '' };
  const automatic = { ranked: simpleRanking(candidates), window, note: 'Seleção automática: um destaque por canal.' };
  if (!useAi) return automatic;
  const ids = await askAiRanking('filmes', candidates.map(({ id, title, channel, start: at }) => ({ id, title, channel, time: formatTime(at) })), movieRowsFor(ART_FORMATS[0]));
  const byId = new Map(candidates.map((item) => [item.id, item]));
  const ranked = ids ? ids.map((id) => byId.get(id)).filter(Boolean) : [];
  if (ranked.length) return { ranked, window, note: `A IA escolheu ${ranked.length} destaques entre ${candidates.length} programas desse horário.` };
  return { ...automatic, note: 'A IA não respondeu agora; usei a seleção automática (um por canal).' };
};

const ArtMaker = ({ label, fileName, draw, caption, prepare, controls }) => {
  const [art, setArt] = useState({ status: 'idle', files: [] });
  const [captionCopied, setCaptionCopied] = useState(false);

  useEffect(() => {
    if (!captionCopied) return undefined;
    const timer = setTimeout(() => setCaptionCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [captionCopied]);

  const copyCaption = async () => {
    setCaptionCopied(await copyText(art.caption));
  };

  useEffect(() => () => {
    art.files.forEach((file) => URL.revokeObjectURL(file.url));
  }, [art.files]);

  const generate = async () => {
    setArt((previous) => ({ ...previous, status: 'working' }));
    try {
      // prepare() roda uma vez (ex.: a IA escolhe os destaques) e vale para os dois formatos e a legenda.
      const context = prepare ? await prepare() : undefined;
      const blobs = await Promise.all(ART_FORMATS.map((format) => draw(format, context)));
      if (blobs.some((blob) => !blob)) {
        setArt({ status: 'empty', files: [] });
        return;
      }
      const files = blobs.map((blob, index) => {
        const name = `${fileName}_${ART_FORMATS[index].key}.png`;
        return {
          blob,
          shareFile: new File([blob], name, { type: 'image/png' }),
          url: URL.createObjectURL(blob),
          name,
          label: ART_FORMATS[index].label,
        };
      });
      if (!isTouchDevice()) {
        files.forEach((file) => {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name;
          link.click();
        });
      }
      const text = typeof caption === 'function' ? caption(context) : caption;
      setArt({ status: 'ready', files, caption: text || '', note: (context && context.note) || '' });
    } catch {
      setArt({ status: 'error', files: [] });
    }
  };

  return (
    <div className="admin-art">
      {controls}
      <button type="button" className="admin-chip" onClick={generate} disabled={art.status === 'working'}>
        <FiImage aria-hidden="true" /> {art.status === 'working' ? 'Gerando...' : label}
      </button>
      {art.status === 'empty' && <p className="admin-count">Nada para mostrar nesse período.</p>}
      {art.status === 'error' && <p className="admin-error" role="alert">Não foi possível gerar a imagem.</p>}
      {art.files.length > 0 && art.note && <p className="admin-count">{art.note}</p>}
      {art.files.length > 0 && (
        <div className="admin-art-previews">
          {art.files.map((file) => <ArtPreview key={file.name} file={file} label={label} caption={art.caption} />)}
        </div>
      )}
      {art.files.length > 0 && art.caption && (
        <div className="admin-art-caption">
          <textarea readOnly value={art.caption} rows={Math.min(10, art.caption.split('\n').length)} aria-label="Legenda pronta" />
          <button type="button" className="admin-chip" onClick={copyCaption}>
            {captionCopied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
            {captionCopied ? ' Legenda copiada' : ' Copiar legenda'}
          </button>
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
  const [artWindow, setArtWindow] = useState({ start: PRIME_START, end: PRIME_END });
  const [useAi, setUseAi] = useState(true);
  const [useAiGames, setUseAiGames] = useState(true);
  const loadedDate = state.data ? state.data.date : null;
  const loadedToday = state.data ? state.data.today : null;
  useEffect(() => {
    if (loadedDate) setArtWindow(defaultArtWindow({ date: loadedDate, today: loadedToday }));
  }, [loadedDate, loadedToday]);
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
        {SCHEDULE_TABS.map((tab) => (
          <LinkRow key={tab.key} label={`Programação: ${tab.label}`} url={`${window.location.origin}${scheduleTabPath(tab.key)}`} />
        ))}
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
              prepare={() => pickGames(data, { onlyUpcoming, useAi: useAiGames })}
              draw={(format, picks) => gamesArt(data, { onlyUpcoming, now: Date.now(), format, ranked: picks && picks.ranked })}
              caption={(picks) => gamesCaption(data, { onlyUpcoming, now: Date.now(), ranked: picks && picks.ranked })}
              controls={(
                <div className="admin-art-window">
                  <label className="admin-check">
                    <input type="checkbox" checked={useAiGames} onChange={(event) => setUseAiGames(event.target.checked)} />
                    Escolher os jogos de maior audiência com IA
                  </label>
                </div>
              )}
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
              prepare={() => pickMovies(data, { ...artWindow, onlyUpcoming, useAi })}
              draw={(format, picks) => moviesArt(data, { ...picks, format })}
              caption={(picks) => moviesCaption(data, picks)}
              controls={(
                <div className="admin-art-window">
                  <label>
                    De <input type="time" value={artWindow.start} onChange={(event) => setArtWindow((previous) => ({ ...previous, start: event.target.value || previous.start }))} />
                  </label>
                  <label>
                    até <input type="time" value={artWindow.end} onChange={(event) => setArtWindow((previous) => ({ ...previous, end: event.target.value || previous.end }))} />
                  </label>
                  <label className="admin-check">
                    <input type="checkbox" checked={useAi} onChange={(event) => setUseAi(event.target.checked)} />
                    Escolher os melhores com IA
                  </label>
                </div>
              )}
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
