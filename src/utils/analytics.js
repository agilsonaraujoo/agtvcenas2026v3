// Simple analytics helper: initializes dataLayer and captures site-wide clicks/touches
// Push events to window.dataLayer for GTM, and logs to console for debugging.
const ensureDataLayer = () => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
};

const buildElementDescriptor = (el) => {
  if (!el) return null;
  const tag = el.tagName?.toLowerCase() || 'unknown';
  const id = el.id ? `#${el.id}` : '';
  const classes = el.className && typeof el.className === 'string' ? `.${el.className.split(/\s+/).filter(Boolean).join('.')}` : '';
  const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const aria = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('role'));
  return { tag, id, classes, text, aria };
};

// Google Analytics 4: ID da propriedade (começa com "G-"). Vazio = desligado.
// Só carrega depois que o visitante clica em "Aceitar" no aviso de cookies (LGPD).
export const GA_MEASUREMENT_ID = '';

// Eventos de conversão que também vão para o GA4.
const GA_EVENTS = new Set(['trial_click', 'whatsapp_click', 'begin_checkout']);
let gaLoaded = false;

export const loadGoogleAnalytics = () => {
  if (gaLoaded || !GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  gaLoaded = true;
  ensureDataLayer();
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
};

// Public: push a custom event to dataLayer and console
export const trackEvent = (eventName, payload = {}) => {
  ensureDataLayer();
  try {
    const eventObj = { event: eventName, ...payload };
    window.dataLayer.push(eventObj);
    if (gaLoaded && GA_EVENTS.has(eventName)) {
      window.gtag('event', eventName, payload);
    }
    // console log for local debugging
    // eslint-disable-next-line no-console
    console.log('analytics.trackEvent', eventObj);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('analytics.trackEvent error', e);
  }
};

// Handler for DOM clicks/touches
export const handleInteraction = (ev) => {
  try {
    const target = ev.target;
    // Find element with explicit data-analytics attribute upwards
    let el = target;
    let analyticsAttr = null;
    while (el && el !== document.body) {
      analyticsAttr = el.getAttribute && el.getAttribute('data-analytics');
      if (analyticsAttr) break;
      el = el.parentElement;
    }

    const clickedEl = analyticsAttr ? el : target;
    const desc = buildElementDescriptor(clickedEl);

    const payload = {
      selector: analyticsAttr || (desc ? `${desc.tag}${desc.id}${desc.classes}` : null),
      text: desc?.text || null,
      aria: desc?.aria || null,
      time: new Date().toISOString(),
      page: window.location.pathname,
      href: clickedEl && clickedEl.href ? clickedEl.href : null,
      clientX: ev.clientX || (ev.touches && ev.touches[0] && ev.touches[0].clientX) || null,
      clientY: ev.clientY || (ev.touches && ev.touches[0] && ev.touches[0].clientY) || null,
    };

    trackEvent('site_interaction', payload);

    // Eventos de conversão com nome fixo, para virar gatilho direto no GTM/GA4.
    const link = target.closest ? target.closest('a[href]') : null;
    if (link) {
      const location = analyticsAttr || 'sem_rotulo';
      if (link.href.includes('pagme.xyz/trial')) {
        trackEvent('trial_click', { location });
      } else if (link.href.includes('wa.me/')) {
        trackEvent('whatsapp_click', { location });
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('analytics.handleInteraction error', err);
  }
};

// Initialize global listeners — returns cleanup function
export const initAnalyticsListeners = () => {
  ensureDataLayer();
  // Quem já aceitou os cookies numa visita anterior passa a ser medido no GA4 de cara.
  try {
    if (localStorage.getItem('cookieChoice') === 'accepted') loadGoogleAnalytics();
  } catch (e) {
    // localStorage bloqueado: segue sem GA4.
  }
  // Só 'click': no celular o toque também gera 'click', então ouvir 'touchend'
  // junto contava cada toque duas vezes.
  const clickHandler = (ev) => handleInteraction(ev);
  document.addEventListener('click', clickHandler, { capture: true });

  // Return cleanup
  return () => {
    document.removeEventListener('click', clickHandler, { capture: true });
  };
};

export default {
  initAnalyticsListeners,
  trackEvent,
  handleInteraction,
};
