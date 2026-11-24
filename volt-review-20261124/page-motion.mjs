const revealTargets = [
  '.home-products .section-heading',
  '.product-card',
  '.collection-detail',
  '.home-editorial > a',
  '.editorial-band-text',
  '.tech-cards > details',
  '.construction',
  '.detail-strip > a',
  '.journal-card',
].join(', ');

export function setupPageMotion(main, isKeyboardInput) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const { signal } = controller;
  const backdrop = main.querySelector('.hero-backdrop');
  const hero = backdrop?.parentElement;
  let observer;
  let frame = 0;

  if (!reduced.matches && 'IntersectionObserver' in window) {
    const pending = new Set();
    function reveal(element, animate, delay = 0) {
      if (!pending.delete(element)) return;
      observer.unobserve(element);
      element.classList.remove('reveal-pending');
      if (!animate) return;
      element.style.setProperty('--reveal-delay', delay + 'ms');
      element.classList.add('reveal-in');
    }

    observer = new IntersectionObserver(entries => {
      let stagger = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const animate = !isKeyboardInput() && !reduced.matches;
        const card = entry.target.matches('.product-card, .collection-detail, .journal-card, .home-editorial > a');
        reveal(entry.target, animate, card ? Math.min(stagger++ * 72, 216) : 0);
      }
    }, { rootMargin: '0px 0px -12px', threshold: .08 });

    for (const element of main.querySelectorAll(revealTargets)) {
      if (element.getBoundingClientRect().bottom <= 0) continue;
      element.classList.add('reveal-pending');
      pending.add(element);
      observer.observe(element);
    }
    main.addEventListener('focusin', event => {
      const element = event.target.closest('.reveal-pending');
      if (element) reveal(element, false);
    }, { signal });
  }

  if (backdrop) {
    function updateRibbon() {
      frame = 0;
      const offset = reduced.matches ? 0 : Math.max(0, Math.min(-hero.getBoundingClientRect().top * .085, 64));
      backdrop.style.setProperty('--ribbon-scroll-offset', offset.toFixed(1) + 'px');
    }
    function scheduleRibbon() {
      if (!frame) frame = requestAnimationFrame(updateRibbon);
    }
    window.addEventListener('scroll', scheduleRibbon, { passive: true, signal });
    reduced.addEventListener('change', scheduleRibbon, { signal });
    updateRibbon();
  }

  return () => {
    controller.abort();
    observer?.disconnect();
    cancelAnimationFrame(frame);
  };
}
