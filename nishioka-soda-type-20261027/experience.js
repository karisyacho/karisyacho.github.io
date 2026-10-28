import { FLAVORS, SIZES, yen, flavorWordMarkup, tasteRowsMarkup, crateMarkup } from './card.js?v=award1';

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
  const state = { flavor: 'sudachi', size: 250, qty: 3 };
  let raf = 0, generation = 0, manualPause = false, burstCount = 0;
  let lastBurst = -Infinity, departed = false;
  let particles = [], width = 0, height = 0;
  const allowed = () => !reduced.matches && !manualPause && !document.hidden && !departed;
  const announce = text => { if (status) status.textContent = text; };
  // build.mjs fills PHRASES with BudouX breaks so dynamic Japanese wraps by phrase.
  const PHRASES = {};
  const phrased = (element, text) => {
    const parts = PHRASES[text];
    if (!parts) { element.textContent = text; return; }
    // Unbreakable phrase spans: WebKit ignores <wbr> after an opening bracket under keep-all.
    element.classList.remove('bx');
    element.replaceChildren(...parts.flatMap((part, i) => [...(i ? [document.createElement('wbr')] : []), Object.assign(document.createElement('span'), { className: 'ph', textContent: part })]));
  };
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
      const label = reduced.matches ? '動きを減らす設定中' : manualPause ? '泡と文字の動きを再開する' : '泡と文字の動きを止める';
      const labelNode = document.querySelector('#motion-label'), icon = document.querySelector('#motion-icon');
      if (labelNode) labelNode.textContent = label;
      if (icon) icon.textContent = reduced.matches ? '○' : manualPause ? '▷' : 'Ⅱ';
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
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
    animate(document.querySelector('.bottle-wrap img.bottle'), [
      { transform: 'translateY(0) rotate(0deg)' },
      { transform: `translateY(${-9 * power}px) rotate(${1.6 * power}deg)`, offset: .3 },
      { transform: 'translateY(0) rotate(0deg)' },
    ], { duration: duration - 40, easing: 'cubic-bezier(.2,.65,.3,1)' });
    animate(document.querySelector('.splash-wrap img.splash'), [
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
  // Chapter 2: one flavour at a time; the shop below follows the same choice.
  const flavorSection = document.querySelector('#flavor'), shop = document.querySelector('#shop'), form = document.querySelector('#shop-form');
  const howto = { sudachi: '氷を入れたグラスに注いで、薄切りのすだちを一枚。', natsumikan: '氷を入れたグラスに注いで、夏みかんの皮をひとかけ。' };
  function selectFlavor(flavor, pointer = false) {
    const data = FLAVORS[flavor];
    if (!data) return;
    const changed = flavor !== state.flavor;
    state.flavor = flavor;
    root.dataset.flavor = flavor;
    [flavorSection, shop].forEach(section => { if (section) section.dataset.flavor = flavor; });
    document.querySelectorAll('[data-flavor-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.flavorChoice === flavor)));
    const word = document.querySelector('#flavor-word');
    if (word) word.innerHTML = flavorWordMarkup(flavor);
    const rows = document.querySelector('#taste-rows');
    if (rows) rows.innerHTML = tasteRowsMarkup(flavor);
    const name = document.querySelector('#flavor-name'), say = document.querySelector('#flavor-say-text'), pair = document.querySelector('#flavor-pair'), pour = document.querySelector('#pour-howto');
    if (name) name.textContent = `${data.name}。`;
    if (say) phrased(say, data.say);
    if (pair) pair.textContent = data.pair;
    if (pour) phrased(pour, howto[flavor]);
    const radio = form?.querySelector(`input[name="flavor"][value="${flavor}"]`);
    if (radio) radio.checked = true;
    updateShop();
    if (changed && pointer && allowed()) {
      word?.querySelectorAll('.flavor-letter').forEach((letter, i) => animate(letter, [
        { transform: 'translateY(14px) scale(.9)', opacity: 0 },
        { transform: `translateY(${-8 - i * 2}px) scale(1.04)`, opacity: 1, offset: .55 },
        { transform: 'translateY(0) scale(1)', opacity: 1 },
      ], { duration: 520, delay: i * 45, easing: 'cubic-bezier(.16,.72,.28,1)' }));
      rows?.querySelectorAll('.taste-line:first-child .taste-bubble.on').forEach((bubble, i) => animate(bubble, [
        { transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.18)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 },
      ], { duration: 360, delay: 120 + i * 28, easing: 'cubic-bezier(.2,.65,.3,1)' }));
    }
  }
  document.querySelectorAll('[data-flavor-choice]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', event => {
      selectFlavor(button.dataset.flavorChoice, event.detail !== 0);
      announce(`${FLAVORS[state.flavor].name}を選びました。`);
    });
  });

  // Chapter 4: flavour, size and count give a total; confirming only shows a summary.
  const qty = document.querySelector('#shop-qty'), total = document.querySelector('#shop-total'), crate = document.querySelector('#shop-crate');
  const confirmBox = document.querySelector('#shop-confirm'), summary = document.querySelector('#shop-summary');
  function readQty() {
    const value = Math.round(Number(qty?.value));
    return Number.isFinite(value) ? Math.max(1, Math.min(12, value)) : state.qty;
  }
  function updateShop() {
    if (!form) return;
    state.size = Number(form.querySelector('input[name="size"]:checked')?.value) || 250;
    state.qty = readQty();
    const sum = SIZES[state.size].price * state.qty;
    if (total) total.textContent = yen(sum);
    if (crate) crate.innerHTML = crateMarkup(state.size, state.qty);
    form.querySelectorAll('[data-step]').forEach(button => {
      const step = Number(button.dataset.step);
      button.disabled = step < 0 ? state.qty <= 1 : state.qty >= 12;
    });
    if (confirmBox && !confirmBox.hidden) closeConfirm(false);
  }
  function closeConfirm(focus = true) {
    if (!confirmBox || !form) return;
    confirmBox.hidden = true; form.hidden = false;
    if (focus) form.querySelector('.shop-submit')?.focus();
  }
  if (form) {
    form.addEventListener('change', event => {
      if (event.target.name === 'flavor') selectFlavor(event.target.value);
      else updateShop();
    });
    qty?.addEventListener('input', () => { if (qty.value !== '') updateShop(); });
    qty?.addEventListener('blur', () => { qty.value = String(readQty()); updateShop(); });
    form.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
      if (qty) qty.value = String(Math.max(1, Math.min(12, readQty() + Number(button.dataset.step))));
      updateShop();
      announce(`${state.qty}本、合計${yen(SIZES[state.size].price * state.qty)}。`);
    }));
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (qty) qty.value = String(readQty());
      updateShop();
      if (summary) {
        summary.replaceChildren(`${FLAVORS[state.flavor].name}　${SIZES[state.size].label} × ${state.qty}本`, document.createElement('br'), `合計 ${yen(SIZES[state.size].price * state.qty)}`);
      }
      if (confirmBox) { form.hidden = true; confirmBox.hidden = false; confirmBox.focus(); }
    });
    document.querySelector('#shop-back')?.addEventListener('click', () => closeConfirm());
  }
  selectFlavor('sudachi');
  if (fruit) {
    fruit.disabled = false;
    fruit.addEventListener('click', event => {
      announce('泡がはじけました。');
      const hint = document.querySelector('#hero-bridge-hint');
      if (hint && !hint.dataset.updated) { hint.textContent = '次は、2つの味をくらべる。'; hint.dataset.updated = 'true'; }
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
  const stateSnapshot = () => Object.freeze({ ...state });
  window.__nishiokaMotion = Object.freeze({ snapshot: () => Object.freeze({ activeAnimations: animations.size, raf: Boolean(raf), particles: particles.length, burstCount, motion: root.dataset.motion, ...stateSnapshot() }) });
  Object.defineProperty(window, '__nishiokaState', { configurable: true, get: stateSnapshot });
  const readiness = [document.fonts?.ready, ...Array.from(hero?.querySelectorAll('img') || [], image => image.decode?.().catch(() => {}))];
  const initialGeneration = generation;
  Promise.allSettled(readiness).then(() => {
    if (generation === initialGeneration && burstCount === 0 && allowed()) burst(true);
  });
})();
