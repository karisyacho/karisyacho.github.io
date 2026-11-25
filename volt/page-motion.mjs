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

export function setupPageMotion(main, enabled) {
  const controller = new AbortController();
  const { signal } = controller;
  const backdrop = main.querySelector('.hero-backdrop');
  const hero = backdrop?.parentElement;
  let observer;
  let heroObserver;
  let frame = 0;
  const targets = Array.from(main.querySelectorAll(revealTargets));

  if (enabled && 'IntersectionObserver' in window) {
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
        if (!entry.isIntersecting || entry.intersectionRatio < .2) continue;
        const card = entry.target.matches('.product-card, .collection-detail, .journal-card, .home-editorial > a');
        reveal(entry.target, true, card ? Math.min(stagger++ * 110, 660) : 0);
      }
    }, { rootMargin: '0px 0px -24px', threshold: .2 });

    for (const element of targets) {
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

  if (backdrop && enabled) {
    if ('IntersectionObserver' in window) {
      heroObserver = new IntersectionObserver(([entry]) => {
        hero.classList.toggle('ribbon-in-view', entry.isIntersecting && entry.intersectionRatio >= .12);
      }, { threshold: .12 });
      heroObserver.observe(hero);
    } else hero.classList.add('ribbon-in-view');
    function updateRibbon() {
      frame = 0;
      const offset = Math.max(0, Math.min(-hero.getBoundingClientRect().top * .13, 84));
      backdrop.style.setProperty('--ribbon-scroll-offset', offset.toFixed(1) + 'px');
    }
    function scheduleRibbon() {
      if (!frame) frame = requestAnimationFrame(updateRibbon);
    }
    window.addEventListener('scroll', scheduleRibbon, { passive: true, signal });
    updateRibbon();
  }

  return () => {
    controller.abort();
    observer?.disconnect();
    heroObserver?.disconnect();
    cancelAnimationFrame(frame);
    hero?.classList.remove('ribbon-in-view');
    for (const element of targets) element.classList.remove('reveal-pending', 'reveal-in');
  };
}
