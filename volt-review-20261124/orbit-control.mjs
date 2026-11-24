const step = Math.PI / 4;
const fallbackShots = [
  ['orbit-hero', '斜め'], ['orbit-side-bone', '側面'], ['orbit-heel-bone', 'かかと'],
  ['orbit-top-bone', '上面'], ['orbit-sole-bone', '靴底'],
];

export function setupHeroOrbit(hero) {
  const stage = hero.querySelector('.hero-turntable');
  const toggle = hero.querySelector('[data-orbit-toggle]');
  const canvas = stage.querySelector('canvas');
  const alternative = stage.querySelector('.hero-turntable-photo');
  const readout = hero.querySelector('[data-orbit-angle]');
  const controls = hero.querySelector('.orbit-controls');
  const help = hero.querySelector('.orbit-instructions');
  const defaultHelp = help.textContent;
  const spin = hero.querySelector('[data-orbit-spin]');
  const abort = new AbortController();
  const signal = abort.signal;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let view;
  let startPromise;
  let active = false;
  let fallback = false;
  let photoIndex = 0;
  let pointer;
  let pendingX = 0;

  function moveHero(angle) {
    const radians = angle * Math.PI / 180;
    hero.style.setProperty('--orbit-sway', Math.sin(radians).toFixed(3));
    hero.style.setProperty('--orbit-lift', ((1 - Math.cos(radians)) / 2).toFixed(3));
  }

  function updateAngle(angle) {
    readout.textContent = String(angle).padStart(3, '0') + '°';
    moveHero(angle);
  }

  function syncMotion() {
    spin.hidden = fallback || reduced.matches;
    if (reduced.matches) view?.stop();
  }
  spin.disabled = true;
  syncMotion();
  reduced.addEventListener('change', syncMotion, { signal });

  function setFrame(index) {
    photoIndex = (index + fallbackShots.length) % fallbackShots.length;
    const [asset, label] = fallbackShots[photoIndex];
    alternative.src = 'assets/' + asset + '.webp';
    alternative.alt = 'ORBITの' + label;
    readout.textContent = (photoIndex + 1) + ' / ' + fallbackShots.length;
    moveHero(photoIndex * 360 / fallbackShots.length);
  }

  function usePhotos() {
    if (signal.aborted) return;
    fallback = true;
    view?.dispose();
    view = null;
    help.textContent = '左右のボタンかスワイプで写真の角度を切り替え';
    if (active) toggle.querySelector('span').textContent = '写真を閉じる';
    setFrame(pendingX < 0 ? -1 : pendingX > 0 ? 1 : 0);
    hero.classList.remove('hero--film');
    hero.classList.toggle('hero--photos', active);
    syncMotion();
  }

  function initialize() {
    if (!startPromise) {
      help.textContent = '回転映像を読み込み中…';
      startPromise = import('./orbit-view.mjs').then(async ({ mountOrbitView }) => {
        if (signal.aborted) return;
        view = await mountOrbitView(canvas, updateAngle, signal);
        if (signal.aborted) {
          view?.dispose();
          return;
        }
        if (!view) {
          usePhotos();
          return;
        }
        spin.disabled = false;
        help.textContent = defaultHelp;
        if (active) hero.classList.add('hero--film');
        if (pendingX) view.turn(pendingX);
        pendingX = 0;
      }).catch(usePhotos);
    }
    return startPromise;
  }

  function open() {
    if (active) return;
    active = true;
    controls.hidden = false;
    stage.tabIndex = 0;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.querySelector('span').textContent = fallback ? '写真を閉じる' : '360°を閉じる';
    hero.classList.add('hero--orbit-open');
    hero.classList.toggle('hero--film', Boolean(view));
    hero.classList.toggle('hero--photos', fallback);
    if (!view && !fallback) initialize();
  }

  function close() {
    active = false;
    view?.reset();
    if (fallback) setFrame(0);
    pointer = null;
    stage.classList.remove('is-dragging');
    pendingX = 0;
    controls.hidden = true;
    stage.tabIndex = -1;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('span').textContent = '360° VIEW';
    hero.classList.remove('hero--orbit-open', 'hero--film', 'hero--photos');
  }

  function turn(dx) {
    if (fallback) {
      setFrame(photoIndex + Math.sign(dx));
    } else if (view) {
      view.turn(dx);
    } else {
      pendingX += dx;
    }
  }

  toggle.addEventListener('click', event => {
    if (active) close();
    else {
      open();
      if (event.detail === 0) stage.focus({ preventScroll: true });
    }
  }, { signal });
  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-orbit-spin')) {
      if (!reduced.matches) view?.spin();
    } else if (button.dataset.orbitStep) {
      turn(Number(button.dataset.orbitStep) * step);
    }
  }, { signal });

  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false, accumulated: 0, touch: event.pointerType === 'touch' };
    view?.stop();
  }, { signal });
  stage.addEventListener('pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.dragging) {
      if (pointer.touch && Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
        pointer = null;
        return;
      }
      if (Math.hypot(dx, dy) < 8) return;
      pointer.dragging = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
      open();
    }
    if (fallback) {
      pointer.accumulated += dx;
      if (Math.abs(pointer.accumulated) >= 48) {
        turn(pointer.accumulated);
        pointer.accumulated = 0;
      }
    } else {
      const scale = 2 * Math.PI / Math.max(stage.clientWidth * .77, 220);
      turn(dx * scale);
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { signal });

  function release(event) {
    if (pointer?.id !== event.pointerId) return;
    pointer = null;
    stage.classList.remove('is-dragging');
  }
  stage.addEventListener('pointerup', release, { signal });
  stage.addEventListener('pointercancel', release, { signal });
  stage.addEventListener('lostpointercapture', release, { signal });
  stage.addEventListener('pointerleave', event => {
    if (!pointer?.dragging) release(event);
  }, { signal });
  stage.addEventListener('keydown', event => {
    if (!active || !['ArrowLeft', 'ArrowRight', 'Home', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') {
      close();
      toggle.focus();
    } else if (event.key === 'Home') {
      if (fallback) setFrame(0);
      else view?.reset();
    } else {
      turn(event.key === 'ArrowLeft' ? -step : step);
    }
  }, { signal });

  return () => {
    abort.abort();
    view?.dispose();
  };
}
