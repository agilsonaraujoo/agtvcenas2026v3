// Links diretos para seções da página inicial (/#planos): a seção nasce depois do React e o conteúdo acima dela
// ainda muda de altura ao carregar, então reposicionamos algumas vezes. Parar ao primeiro toque
// ou rolagem da pessoa evita puxar a tela de volta.
const RETRY_DELAYS_MS = [0, 300, 800, 1500, 2500, 4000];
const USER_INPUT = ['wheel', 'touchstart', 'keydown', 'mousedown'];

const scrollToHash = () => {
  const { hash } = window.location;
  if (!/^#[\w-]+$/.test(hash)) return () => {};

  const place = () => {
    const target = document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  };
  const timers = RETRY_DELAYS_MS.map((delay) => setTimeout(place, delay));
  const stop = () => {
    timers.forEach(clearTimeout);
    USER_INPUT.forEach((name) => window.removeEventListener(name, stop));
  };
  USER_INPUT.forEach((name) => window.addEventListener(name, stop, { passive: true }));
  return stop;
};

export default scrollToHash;
