// Captures analytics only after the visitor has accepted optional cookies.
const GTM_CONTAINER_ID = 'GTM-M8V62TJV';
let gtmLoaded = false;

const hasAnalyticsConsent = () => {
  try {
    return localStorage.getItem('cookieChoice') === 'accepted';
  } catch (e) {
    return false;
  }
};

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

export const loadGoogleTagManager = () => {
  if (gtmLoaded || !hasAnalyticsConsent() || typeof window === 'undefined') return;
  gtmLoaded = true;
  ensureDataLayer();
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
  document.head.appendChild(script);
};

// Public: push an analytics event only with recorded consent.
export const trackEvent = (eventName, payload = {}) => {
  if (!hasAnalyticsConsent()) return;
  ensureDataLayer();
  try {
    const eventObj = { event: eventName, ...payload };
    window.dataLayer.push(eventObj);
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
  if (!hasAnalyticsConsent()) return;
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
  if (hasAnalyticsConsent()) loadGoogleTagManager();
  // Só 'click': no celular o toque também gera 'click', então ouvir 'touchend'
  // junto contava cada toque duas vezes.
  const clickHandler = (ev) => handleInteraction(ev);
  document.addEventListener('click', clickHandler, { capture: true });

  // Return cleanup
  return () => {
    document.removeEventListener('click', clickHandler, { capture: true });
  };
};

const analytics = {
  initAnalyticsListeners,
  loadGoogleTagManager,
  trackEvent,
  handleInteraction,
};

export default analytics;
