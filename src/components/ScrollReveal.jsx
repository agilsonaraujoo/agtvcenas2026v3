import { useEffect } from 'react';

const revealSelector = 'section h2, section h3, section > div > p, section [class*="grid"] > div, section .flex-none';

const ScrollReveal = () => {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;

    const observed = new WeakSet();
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('agtv-revealed');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    const registerElements = (root) => {
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const elements = [];
      if (root.matches(revealSelector)) elements.push(root);
      elements.push(...root.querySelectorAll(revealSelector));

      elements.forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add('agtv-reveal');

        const siblings = Array.from(element.parentElement.children)
          .filter((sibling) => sibling.matches(revealSelector));
        const index = siblings.indexOf(element);
        element.style.setProperty('--agtv-reveal-delay', `${Math.min(index, 5) * 90}ms`);
        revealObserver.observe(element);
      });
    };

    document.documentElement.classList.add('agtv-scroll-ready');
    registerElements(document.body);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(registerElements);
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      revealObserver.disconnect();
      document.documentElement.classList.remove('agtv-scroll-ready');
    };
  }, []);

  return null;
};

export default ScrollReveal;
