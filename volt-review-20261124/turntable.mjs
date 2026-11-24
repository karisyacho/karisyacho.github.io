import { mountTurntable } from './turntable-video.mjs?v=hero-video';

export function setupTurntable(hero, motionEnabled) {
  const stage = hero.querySelector('.hero-turntable');
  const video = stage.querySelector('video');
  const status = hero.querySelector('[data-turntable-status]');
  const controller = new AbortController();
  const { signal } = controller;
  let view;
  let gesture;
  let queuedTurn = 0;
  let manual = false;
  let inView = !('IntersectionObserver' in window);

  function syncPlayback() {
    view?.setAutoplay(motionEnabled && inView && !manual && !document.hidden);
  }

  if (!inView) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(stage);
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }
  document.addEventListener('visibilitychange', syncPlayback, { signal });

  mountTurntable(stage, signal).then(mounted => {
    if (signal.aborted) return;
    view = mounted;
    if (queuedTurn) view.turn(queuedTurn);
    hero.classList.add('hero--turntable-ready');
    syncPlayback();
  }).catch(() => {
    if (!signal.aborted) status.textContent = 'ORBITの映像を読み込めませんでした。';
  });

  function turn(delta) {
    if (!manual) {
      manual = true;
      syncPlayback();
    }
    if (view) view.turn(delta);
    else queuedTurn += delta;
  }

  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
  }, { signal });
  stage.addEventListener('pointermove', event => {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    if (!gesture.active) {
      if (event.pointerType === 'touch' && Math.abs(event.clientY - gesture.y) > Math.max(12, Math.abs(dx))) {
        gesture = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      gesture.active = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
    }
    turn(dx / Math.max(220, stage.clientWidth * .72));
    gesture.x = event.clientX;
  }, { signal });

  function release(event) {
    if (gesture?.id !== event.pointerId) return;
    gesture = null;
    stage.classList.remove('is-dragging');
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stage.addEventListener(type, release, { signal });
  }
  stage.addEventListener('pointerleave', event => {
    if (!gesture?.active) release(event);
  }, { signal });
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    turn(event.key === 'ArrowLeft' ? -.125 : .125);
  }, { signal });

  return {
    setMotion(enabled) {
      if (motionEnabled === enabled) return;
      motionEnabled = enabled;
      manual = false;
      syncPlayback();
    },
    dispose() {
      controller.abort();
      video.pause();
      video.removeAttribute('src');
      video.load();
    },
  };
}
