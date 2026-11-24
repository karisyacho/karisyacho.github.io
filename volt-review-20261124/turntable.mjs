export function setupTurntable(hero) {
  const stage = hero.querySelector('.hero-turntable');
  const video = stage.querySelector('video');
  const button = hero.querySelector('[data-turntable-toggle]');
  const toolbar = hero.querySelector('.turntable-tools');
  const position = toolbar.querySelector('output');
  const play = toolbar.querySelector('[data-turntable-play]');
  const status = hero.querySelector('.turntable-status');
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let opened = false;
  let view;
  let loading;
  let gesture;
  let queuedTurn = 0;

  function playing(active) {
    play.setAttribute('aria-pressed', String(active));
    play.setAttribute('aria-label', active ? '回転を止める' : '一周再生');
  }

  function syncPreference() {
    play.hidden = reduced.matches;
    if (reduced.matches) view?.stop();
  }
  syncPreference();
  reduced.addEventListener('change', syncPreference, { signal });

  function ready() {
    status.textContent = '左右にドラッグ・スワイプで回転';
    toolbar.hidden = false;
    hero.classList.add('hero--turntable-ready');
  }

  function open() {
    if (opened) return;
    opened = true;
    button.setAttribute('aria-expanded', 'true');
    button.querySelector('span').textContent = '360°を閉じる';
    stage.tabIndex = 0;
    if (view) {
      ready();
      return;
    }
    status.textContent = '回転映像を読み込み中…';
    if (loading) return;
    loading = import('./turntable-video.mjs').then(async ({ mountTurntable }) => {
      if (signal.aborted) return;
      view = await mountTurntable(stage, signal, value => {
        position.textContent = String(Math.round(value * 360) % 360).padStart(3, '0') + '°';
      }, playing);
      if (!opened || signal.aborted) return;
      if (queuedTurn) view.turn(queuedTurn);
      queuedTurn = 0;
      ready();
    }).catch(() => {
      queuedTurn = 0;
      if (signal.aborted) return;
      video.removeAttribute('src');
      video.load();
      if (opened) status.textContent = '映像を読み込めませんでした';
    }).finally(() => { loading = null; });
  }

  function close() {
    opened = false;
    gesture = null;
    queuedTurn = 0;
    stage.tabIndex = -1;
    toolbar.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.querySelector('span').textContent = '360° VIEW';
    status.textContent = '';
    hero.classList.remove('hero--turntable-ready');
    stage.classList.remove('is-dragging');
    view?.reset();
  }

  button.addEventListener('click', event => {
    if (opened) close();
    else {
      open();
      if (event.detail === 0) stage.focus({ preventScroll: true });
    }
  }, { signal });

  function turn(delta) {
    if (view) view.turn(delta);
    else queuedTurn += delta;
  }

  toolbar.addEventListener('click', event => {
    const clicked = event.target.closest('button');
    if (!view || !clicked) return;
    if (clicked === play) view.togglePlay();
    else if (clicked.dataset.turntableStep) turn(Number(clicked.dataset.turntableStep) / 8);
  }, { signal });

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
      open();
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
    if (!opened || !['ArrowLeft', 'ArrowRight', 'Home', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') {
      close();
      button.focus();
    } else if (event.key === 'Home') {
      queuedTurn = 0;
      view?.reset();
    } else {
      turn(event.key === 'ArrowLeft' ? -.125 : .125);
    }
  }, { signal });

  return () => {
    controller.abort();
    if (!view && video.hasAttribute('src')) {
      video.removeAttribute('src');
      video.load();
    }
  };
}
