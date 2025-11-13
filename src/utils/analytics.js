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

// Public: push a custom event to dataLayer and console
export const trackEvent = (eventName, payload = {}) => {
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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('analytics.handleInteraction error', err);
  }
};

// Initialize global listeners — returns cleanup function
export const initAnalyticsListeners = () => {
  ensureDataLayer();
  const clickHandler = (ev) => handleInteraction(ev);
  const touchHandler = (ev) => handleInteraction(ev);
  document.addEventListener('click', clickHandler, { capture: true });
  document.addEventListener('touchend', touchHandler, { capture: true });

  // Return cleanup
  return () => {
    document.removeEventListener('click', clickHandler, { capture: true });
    document.removeEventListener('touchend', touchHandler, { capture: true });
  };
};

export default {
  initAnalyticsListeners,
  trackEvent,
  handleInteraction,
};
