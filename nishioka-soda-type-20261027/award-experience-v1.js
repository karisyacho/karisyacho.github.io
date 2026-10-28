import { FLAVORS, SIZES, yen, flavorWordMarkup, tasteRowsMarkup, crateMarkup } from './award-card-v1.js';

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
  const PHRASES = {"動きを減らす設定中":["動きを","減らす","設定中"],"泡と文字の動きを再開する":["泡と","文字の","動きを","再開する"],"泡と文字の動きを止める":["泡と","文字の","動きを","止める"],"光る浅い水面の上で、すだちソーダの瓶から氷の入ったグラスへ注いでいるイメージ":["光る","浅い","水面の","上で、","すだちソーダの","瓶から","氷の","入った","グラスへ","注いでいる","イメージ"],"光る浅い水面の上で、夏みかんソーダの瓶から氷の入ったグラスへ注ぎ、横に夏みかんの皮を添えたイメージ":["光る","浅い","水面の","上で、","夏みかん","ソーダの","瓶から","氷の","入った","グラスへ","注ぎ、","横に","夏みかんの","皮を","添えた","イメージ"],"氷を入れたグラスに注いで、薄切りのすだちを一枚。":["氷を","入れた","グラスに","注いで、","薄切りの","すだちを","一枚。"],"氷を入れたグラスに注いで、夏みかんの皮をひとかけ。":["氷を","入れた","グラスに","注いで、","夏みかんの","皮を","ひとかけ。"],"泡がはじけました。":["泡が","はじけました。"],"次は、2つの味をくらべる。":["次は、","2つの","味を","くらべる。"],"きりっと酸っぱく、青く香る。":["きりっと","酸っぱく、","青く","香る。"],"唐揚げ、焼き魚、お昼ごはん":["唐揚げ、","焼き魚、","お昼ごはん"],"ほろ苦く、あとから甘い。":["ほろ","苦く、","あとから","甘い。"],"午後のおやつ、ひと休み":["午後の","おやつ、","ひと休み"]};
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
    syncStream();
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
  const POUR = {
    sudachi: { pc: 'assets/pour-light-v1.webp', phone: 'assets/pour-light-phone-v1.webp', alt: '光る浅い水面の上で、すだちソーダの瓶から氷の入ったグラスへ注いでいるイメージ' },
    natsumikan: { pc: 'assets/pour-natsu-v1.webp', phone: 'assets/pour-natsu-phone-v1.webp', alt: '光る浅い水面の上で、夏みかんソーダの瓶から氷の入ったグラスへ注ぎ、横に夏みかんの皮を添えたイメージ' },
  };
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
    // Chapter 3 pours the bottle that was chosen, with the garnish the how-to line names.
    const pourPhoto = document.querySelector('.pour-photo'), pourSet = POUR[flavor];
    if (pourPhoto && pourPhoto.dataset.flavor !== flavor) {
      pourPhoto.dataset.flavor = flavor;
      pourPhoto.querySelector('source').srcset = pourSet.phone;
      const img = pourPhoto.querySelector('img');
      img.src = pourSet.pc;
      img.alt = pourSet.alt;
    }
    document.querySelectorAll('.chap-flavor').forEach(node => { node.textContent = data.name; });
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
    if (crate) crate.innerHTML = crateMarkup(state.size, state.qty, state.flavor);
    const order = document.querySelector('#chap-order');
    if (order) order.textContent = `${FLAVORS[state.flavor].name}・${state.size} ml`;
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
  // Chapters 2-4: one stream of bubbles keeps rising through the page, thickest where it crosses a chapter line.
  // It moves on its own (not with the scroll); the canvas stays on screen and draws only the bubbles in view.
  const flow = document.querySelector('#flow'), stream = document.querySelector('#stream-canvas'), sctx = stream?.getContext('2d');
  let streamRaf = 0, streamLast = 0, streamSeen = false, streamBubbles = [], darkTop = Infinity, sw = 0, sh = 0;
  function seed(n) { let r = n; return () => (r = (r * 9301 + 49297) % 233280) / 233280; }
  function layoutStream() {
    if (!flow || !stream || !sctx) return;
    const box = flow.getBoundingClientRect(), top = box.top + scrollY, dpr = Math.min(devicePixelRatio || 1, 1.5);
    sw = document.documentElement.clientWidth; sh = innerHeight;
    stream.width = Math.round(sw * dpr); stream.height = Math.round(sh * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dark = flow.querySelector('.flow-dark');
    darkTop = dark ? dark.getBoundingClientRect().top + scrollY - top + 160 : Infinity;
    const rnd = seed(7), narrow = sw < 701, bubbles = [];
    // A band of bubbles around each chapter line, rising across the full width.
    flow.querySelectorAll('.chap-rule').forEach(rule => {
      const y = rule.getBoundingClientRect().top + scrollY - top;
      for (let i = 0; i < (narrow ? 26 : 46); i++) bubbles.push({ x: rnd() * sw, y0: y - 190, y1: y + 150, at: rnd(), v: 14 + rnd() * 26, r: 2 + rnd() * 7, pop: rnd() < .16 });
    });
    // A thin column along the left edge joins the bands from the first chapter to the last.
    const height = box.height;
    for (let i = 0; i < Math.round(height / (narrow ? 70 : 46)); i++) bubbles.push({ x: (narrow ? 8 : 30) + rnd() * (narrow ? 26 : 60), y0: 0, y1: height, at: rnd(), v: 18 + rnd() * 20, r: 1.5 + rnd() * 4.5, pop: rnd() < .08 });
    streamBubbles = bubbles;
    flow.dataset.streamTop = String(top);
  }
  function drawStream(dt) {
    if (!sctx || !flow) return;
    const top = flow.getBoundingClientRect().top;
    sctx.clearRect(0, 0, sw, sh);
    for (const b of streamBubbles) {
      const span = b.y1 - b.y0;
      b.at = (b.at - b.v * dt / span + 1) % 1;
      const y = b.y0 + b.at * span, sy = y + top;
      if (sy < -20 || sy > sh + 20) continue;
      const fade = Math.sin(b.at * Math.PI), x = b.x + Math.sin(b.at * 9 + b.r) * 5;
      sctx.beginPath(); sctx.arc(x, sy, b.r, 0, Math.PI * 2);
      if (y > darkTop) { sctx.fillStyle = `rgba(255,255,255,${.28 * fade})`; sctx.fill(); continue; }
      if (b.pop) {
        const g = sctx.createRadialGradient(x - b.r * .3, sy - b.r * .4, 0, x, sy, b.r * 1.6);
        g.addColorStop(0, `rgba(255,251,224,${fade})`); g.addColorStop(.3, `rgba(236,227,60,${fade})`); g.addColorStop(1, `rgba(156,200,60,${fade})`);
        sctx.fillStyle = g; sctx.fill();
      } else {
        sctx.fillStyle = `rgba(255,255,255,${.55 * fade})`; sctx.fill();
        sctx.lineWidth = 1; sctx.strokeStyle = `rgba(120,160,80,${.35 * fade})`; sctx.stroke();
      }
    }
  }
  function streamFrame(now) {
    const dt = streamLast ? Math.min(.05, (now - streamLast) / 1000) : 0;
    streamLast = now;
    drawStream(dt);
    streamRaf = streamSeen && allowed() ? requestAnimationFrame(streamFrame) : 0;
  }
  function syncStream() {
    if (!streamSeen) { cancelAnimationFrame(streamRaf); streamRaf = 0; return; }
    if (allowed()) { if (!streamRaf) { streamLast = 0; streamRaf = requestAnimationFrame(streamFrame); } }
    else { cancelAnimationFrame(streamRaf); streamRaf = 0; drawStream(0); }
  }
  if (flow && sctx) {
    layoutStream();
    new IntersectionObserver(entries => { streamSeen = entries[0].isIntersecting; syncStream(); }).observe(flow);
    // While paused, the bubbles stay where they are but still follow the page as it scrolls.
    addEventListener('scroll', () => { if (streamSeen && !streamRaf) requestAnimationFrame(() => drawStream(0)); }, { passive: true });
    let resizeTimer = 0;
    addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { layoutStream(); drawStream(0); }, 150); });
    document.fonts?.ready.then(() => { layoutStream(); drawStream(0); });
    addEventListener('load', () => { layoutStream(); drawStream(0); });
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
