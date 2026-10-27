(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.hero#top');
  const fruit = document.querySelector('#fruit-press');
  const toggle = document.querySelector('#motion-toggle');
  const status = document.querySelector('#experience-status');
  const canvas = document.querySelector('#burst-canvas');
  const ctx = canvas?.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  let raf = 0, generation = 0, manualPause = false, burstCount = 0;
  let lastBurst = -Infinity, flavorRequest = 0, departed = false;
  let particles = [], width = 0, height = 0;
  const allowed = () => !reduced.matches && !manualPause && !document.hidden && !departed;
  const announce = text => { if (status) status.textContent = text; };
  function stop() {
    generation++;
    cancelAnimationFrame(raf);
    raf = 0;
    particles = [];
    animations.forEach(animation => animation.cancel());
    animations.clear();
    if (ctx) ctx.clearRect(0, 0, width, height);
  }
  function syncMotion() {
    root.dataset.motion = reduced.matches ? 'reduced' : manualPause || document.hidden || departed ? 'paused' : 'active';
    if (toggle) {
      toggle.disabled = reduced.matches;
      toggle.setAttribute('aria-pressed', String(manualPause));
      toggle.textContent = reduced.matches ? '動きを減らす設定中' : manualPause ? '泡と文字の動きを再開する' : '泡と文字の動きを止める';
    }
    if (!allowed()) stop();
  }
  function animate(element, frames, options) {
    if (!element || !allowed() || !element.animate) return;
    const animation = element.animate(frames, { fill: 'none', ...options });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  }
  function resizeCanvas() {
    if (!canvas || !hero || !ctx) return;
    const rect = hero.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function bubbles(power) {
    if (!ctx || !hero || !fruit || !allowed()) return;
    resizeCanvas();
    const bounds = hero.getBoundingClientRect();
    const source = fruit.getBoundingClientRect();
    const x = source.left - bounds.left + source.width * .5;
    const y = source.top - bounds.top + source.height * .44;
    particles = Array.from({ length: 15 }, (_, i) => {
      const direction = i / 14 * Math.PI + Math.PI;
      return {
        x: x + (Math.random() - .5) * source.width * .48,
        y: y + (Math.random() - .5) * source.height * .34,
        dx: Math.cos(direction) * (50 + Math.random() * 115) * power,
        dy: -(55 + Math.random() * 160) * power,
        r: 3 + Math.random() * 9,
        life: 430 + Math.random() * 200,
        delay: i * 7,
      };
    });
    const born = performance.now(), id = generation;
    const draw = now => {
      if (id !== generation || !allowed()) { raf = 0; return; }
      ctx.clearRect(0, 0, width, height);
      let live = false;
      for (const p of particles) {
        const age = now - born - p.delay;
        if (age < 0) { live = true; continue; }
        const t = age / p.life;
        if (t >= 1) continue;
        live = true;
        const px = p.x + p.dx * t, py = p.y + p.dy * t - 24 * t * t;
        const r = p.r * (.65 + .35 * t);
        const alpha = Math.sin(Math.min(1, t * 5) * Math.PI / 2) * (1 - t) * .72;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * .07})`; ctx.fill();
        ctx.lineWidth = .8; ctx.strokeStyle = `rgba(255,255,244,${alpha})`; ctx.stroke();
        ctx.beginPath(); ctx.arc(px - r * .12, py - r * .12, r * .68, Math.PI * 1.04, Math.PI * 1.47);
        ctx.strokeStyle = `rgba(255,255,255,${alpha * .9})`; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.beginPath(); ctx.arc(px + r * .23, py + r * .28, r * .53, .05, 1.03);
        ctx.strokeStyle = `rgba(52,104,76,${alpha * .24})`; ctx.lineWidth = .65; ctx.stroke();
      }
      if (live) raf = requestAnimationFrame(draw);
      else { raf = 0; particles = []; ctx.clearRect(0, 0, width, height); }
    };
    raf = requestAnimationFrame(draw);
  }
  function burst(intro = false) {
    if (!allowed()) return;
    const now = performance.now();
    const power = intro ? .74 : now - lastBurst < 270 ? .43 : 1;
    lastBurst = now;
    stop();
    burstCount++;
    if (hero) hero.dataset.burstCount = String(burstCount);
    const duration = power < .5 ? 390 : 620;
    animate(fruit?.querySelector('svg'), [
      { transform: 'scale(1)', offset: 0 },
      { transform: `scale(${1 - .055 * power},${1 + .025 * power})`, offset: .16 },
      { transform: `scale(${1 + .06 * power},${1 - .035 * power}) rotate(${-1.5 * power}deg)`, offset: .38 },
      { transform: 'scale(1) rotate(0deg)' },
    ], { duration, easing: 'cubic-bezier(.18,.7,.25,1)' });
    animate(document.querySelector('.bottle-wrap > img.bottle'), [
      { transform: 'translateY(0) rotate(0deg)' },
      { transform: `translateY(${-9 * power}px) rotate(${1.6 * power}deg)`, offset: .3 },
      { transform: 'translateY(0) rotate(0deg)' },
    ], { duration: duration - 40, easing: 'cubic-bezier(.2,.65,.3,1)' });
    animate(document.querySelector('.splash-wrap > img.splash'), [
      { transform: 'scale(1)', opacity: 1 },
      { transform: `scale(${1 + .06 * power})`, opacity: .92, offset: .38 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration, easing: 'cubic-bezier(.16,.7,.25,1)' });
    document.querySelectorAll('.orbit-title .letter-motion').forEach((letter, i) => {
      animate(letter, [
        { transform: 'translateY(0px) rotate(0deg)' },
        { transform: `translateY(${3 * power}px) scale(.98)`, offset: .15 },
        { transform: `translateY(${-8 * power}px) rotate(${(i % 2 ? 2 : -2) * power}deg)`, offset: .4 },
        { transform: 'translateY(0px) rotate(0deg)' },
      ], { duration: duration - 65, delay: i * 22, easing: 'cubic-bezier(.16,.72,.28,1)' });
    });
    bubbles(power);
  }
  const flavors = {
    sudachi: { image: 'assets/taste-sudachi-v1.webp', alt: '光と水の中のすだちソーダ', title: 'すっきり、青い香り。', description: 'きゅっとした酸味と、すだちの青い香り。気分を切り替えたい午後に。', aroma: '青く、さわやか', taste: 'きゅっとした酸味', finish: 'すっきり、軽やか' },
    natsumikan: { image: 'assets/taste-natsu-v1.webp', alt: '光と水の中の夏みかんソーダ', title: 'ほろ苦く、ひと休み。', description: '夏みかんのほのかな苦みと、やわらかな甘酸っぱさ。ゆっくりしたい午後に。', aroma: '明るい柑橘の香り', taste: 'ほのかな苦みと甘酸っぱさ', finish: 'やわらかな余韻' },
  };
  const loaded = new Map();
  function loadFlavor(key) {
    if (!loaded.has(key)) loaded.set(key, new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { loaded.delete(key); reject(new Error('image')); };
      image.src = flavors[key].image;
    }));
    return loaded.get(key);
  }
  document.querySelectorAll('[data-flavor-choice]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', async event => {
      const key = button.dataset.flavorChoice, data = flavors[key];
      if (!data) return;
      const request = ++flavorRequest;
      try {
        const image = await loadFlavor(key);
        if (request !== flavorRequest) return;
        document.querySelectorAll('[data-flavor-choice]').forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.flavorChoice === key)));
        const tasting = document.querySelector('#tasting');
        const target = document.querySelector('#taste-image');
        if (tasting) tasting.dataset.flavor = key;
        if (target) { target.src = image.src; target.alt = data.alt; }
        const title = document.querySelector('#taste-title'), description = document.querySelector('#taste-description');
        if (title) title.textContent = data.title;
        if (description) description.textContent = data.description;
        ['aroma', 'taste', 'finish'].forEach(note => {
          const node = document.querySelector(`#taste-notes [data-note="${note}"]`);
          if (node) node.textContent = data[note];
        });
        if (event.detail !== 0 && allowed()) {
          animations.forEach(animation => { if (animation.effect?.target === target) { animation.cancel(); animations.delete(animation); } });
          animate(target, [{ opacity: .78, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 230, easing: 'cubic-bezier(.16,.7,.25,1)' });
        }
        announce(key === 'sudachi' ? 'すだちソーダを選びました。' : '夏みかんソーダを選びました。');
      } catch {
        if (request === flavorRequest) announce('画像を読み込めませんでした。もう一度お試しください。');
      }
    });
  });
  if (fruit) {
    fruit.disabled = false;
    fruit.addEventListener('click', event => {
      announce('泡がはじけました。');
      if (event.detail !== 0) burst();
    });
  }
  toggle?.addEventListener('click', () => { manualPause = !manualPause; syncMotion(); });
  reduced.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('pagehide', () => { departed = true; stop(); syncMotion(); });
  window.addEventListener('pageshow', () => { departed = false; syncMotion(); });
  window.addEventListener('resize', () => { if (raf) stop(); });
  document.addEventListener('keydown', event => {
    if (/^(Tab|Enter| |Spacebar|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|PageUp|PageDown)$/.test(event.key)) root.dataset.keyboard = 'true';
  });
  document.addEventListener('pointerdown', () => { root.dataset.keyboard = 'false'; }, { passive: true });
  syncMotion();
  if (hero) hero.dataset.burstCount = '0';
  root.dataset.ready = 'true';
  window.__nishiokaMotion = Object.freeze({ snapshot: () => Object.freeze({ activeAnimations: animations.size, raf: Boolean(raf), particles: particles.length, burstCount, motion: root.dataset.motion }) });
  const readiness = [document.fonts?.ready, ...Array.from(hero?.querySelectorAll('img') || [], image => image.decode?.().catch(() => {}))];
  const initialGeneration = generation;
  Promise.allSettled(readiness).then(() => {
    if (generation === initialGeneration && burstCount === 0 && allowed()) burst(true);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    Object.keys(flavors).forEach(key => loadFlavor(key).catch(() => {}));
  }));
})();
