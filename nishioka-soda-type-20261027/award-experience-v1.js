import { wordGlyphs, pourWordMarkup } from './award-card-v1.js';

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
  const state = { part: 'peel', gesture: { spread: .5, tilt: 0 }, sample: { u: .35, v: .90 } };
  let flightId = 0, flightNode = null, flightAnimation = null;
  const gestures = { peel: { spread: .5, tilt: 0 }, juice: { spread: .5, tilt: 0 } };
  let previewGesture = null, lastCommitGesture = { spread: .5, tilt: 0 };
  let raf = 0, generation = 0, manualPause = false, burstCount = 0;
  let lastBurst = -Infinity, departed = false;
  let particles = [], width = 0, height = 0;
  const allowed = () => !reduced.matches && !manualPause && !document.hidden && !departed;
  const announce = text => { if (status) status.textContent = text; };
  // build.mjs fills PHRASES with BudouX breaks so dynamic Japanese wraps by phrase.
  const PHRASES = {"動きを減らす設定中":["動きを","減らす","設定中"],"泡と文字の動きを再開する":["泡と","文字の","動きを","再開する"],"泡と文字の動きを止める":["泡と","文字の","動きを","止める"],"「ふわっ」は、皮の香り。":["「ふわっ」は、","皮の","香り。"],"皮は、すりおろして薬味にも。鼻に抜ける青い香りが「ふわっ」。":["皮は、","すり","おろして","薬味にも。","鼻に","抜ける","青い","香りが","「ふわっ」。"],"果皮のクローズアップ":["果皮の","クローズアップ"],"PEEL / 香りを楽しむ":["PEEL / 香りを","楽しむ"],"「きゅっ」は、果汁の酸味。":["「きゅっ」は、","果汁の","酸味。"],"果汁は、焼き魚や鍋にしぼって。舌に残る酸味が「きゅっ」。":["果汁は、","焼き魚や","鍋に","しぼって。","舌に","残る","酸味が","「きゅっ」。"],"果汁を含む果肉のクローズアップ":["果汁を","含む","果肉の","クローズアップ"],"JUICE / 酸味を楽しむ":["JUICE / 酸味を","楽しむ"],"果汁の酸味、きゅっ":["果汁の","酸味、","きゅっ"],"皮の香り、ふわっ":["皮の","香り、","ふわっ"],"皮の青い香りを、泡でひらく。":["皮の","青い","香りを、","泡で","ひらく。"],"果汁の酸味を、泡できりっと。":["果汁の","酸味を、","泡できりっと。"],"その香りを、一杯で味わう":["その","香りを、","一杯で","味わう"],"その酸味を、一杯で味わう":["その","酸味を、","一杯で","味わう"],"泡がはじけました。":["泡が","はじけました。"],"次は、皮と果汁の違いへ。":["次は、","皮と","果汁の","違いへ。"]};
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
    clearFlight();
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
  const parts = {
    peel: { word: 'ふわっ', title: '「ふわっ」は、皮の香り。', description: '皮は、すりおろして薬味にも。鼻に抜ける青い香りが「ふわっ」。', detail: '果皮のクローズアップ', stage: 'PEEL / 香りを楽しむ' },
    juice: { word: 'きゅっ', title: '「きゅっ」は、果汁の酸味。', description: '果汁は、焼き魚や鍋にしぼって。舌に残る酸味が「きゅっ」。', detail: '果汁を含む果肉のクローズアップ', stage: 'JUICE / 酸味を楽しむ' },
  };
  const lab = document.querySelector('#lab-fruit');
  const lens = document.querySelector('#aroma .detail-lens');
  const defaults = { peel: { u: .35, v: .90 }, juice: { u: .70, v: .68 } };
  const samples = { peel: { ...defaults.peel }, juice: { ...defaults.juice } };
  let lensPoint = { ...defaults.peel }, drag = null, lastPointerUp = -Infinity;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function publishComposition() {
    window.dispatchEvent(new CustomEvent('soda:composition', { detail: { part: state.part, gesture: { ...state.gesture }, sample: { ...state.sample } } }));
  }
  function clearFlight() {
    flightId++;
    if (flightAnimation) { flightAnimation.cancel(); animations.delete(flightAnimation); flightAnimation = null; }
    flightNode?.remove(); flightNode = null;
    document.querySelector('#aroma')?.classList.remove('sample-arriving');
  }
  function flySample(source = null) {
    clearFlight();
    if (!allowed() || !lens) return;
    const target = document.querySelector('.part-echo'), marker = document.querySelector('#lab-marker');
    if (!target) return;
    const markerRect = marker?.getBoundingClientRect(), end = target.getBoundingClientRect();
    const start = source || (markerRect ? { x: markerRect.left + markerRect.width / 2, y: markerRect.top + markerRect.height / 2 } : null);
    if (!start) return;
    const style = getComputedStyle(lens), node = document.createElement('div');
    node.className = 'sample-flight';
    node.setAttribute('aria-hidden', 'true');
    Object.assign(node.style, { position: 'fixed', left: `${start.x - 22}px`, top: `${start.y - 22}px`, width: '44px', height: '44px', borderRadius: '50%', pointerEvents: 'none', zIndex: '30', backgroundImage: style.backgroundImage, backgroundSize: style.backgroundSize, backgroundPosition: style.backgroundPosition, backgroundColor: style.backgroundColor });
    if (!node.animate) return;
    document.body.append(node); flightNode = node;
    const id = flightId, dx = end.left + end.width / 2 - start.x, dy = end.top + end.height / 2 - start.y;
    const aroma = document.querySelector('#aroma'); aroma?.classList.add('sample-arriving');
    const animation = node.animate([
      { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .5}px,${dy * .5 - 50}px) scale(.85)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx}px,${dy}px) scale(.25)`, opacity: 0 },
    ], { duration: 420, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'none' });
    flightAnimation = animation; animations.add(animation);
    const finish = () => {
      animations.delete(animation); node.remove();
      if (id === flightId) { flightNode = null; flightAnimation = null; aroma?.classList.remove('sample-arriving'); }
    };
    animation.finished.then(finish, finish);
  }
  function explored(event) { if (event.isTrusted) root.dataset.explored = 'true'; }
  function updateLink() {
    const svg = lab?.querySelector('svg'), link = document.querySelector('#lens-link');
    const matrix = svg?.getScreenCTM();
    if (!matrix || !link || !lens) return;
    const rect = lens.getBoundingClientRect();
    try {
      const end = new DOMPoint(rect.left + rect.width / 2, rect.top + rect.height / 2).matrixTransform(matrix.inverse());
      link.setAttribute('x1', 82 + lensPoint.u * 636); link.setAttribute('y1', 82 + lensPoint.v * 636);
      link.setAttribute('x2', end.x); link.setAttribute('y2', end.y);
    } catch { /* A hidden SVG has no usable inverse matrix. */ }
  }
  function moveLens(point) {
    lensPoint = { ...point };
    document.querySelectorAll('#lab-marker, #lab-fruit .marker-ring').forEach(marker => {
      marker.setAttribute('cx', 82 + point.u * 636); marker.setAttribute('cy', 82 + point.v * 636); marker.removeAttribute('hidden');
    });
    const position = `${(point.u * 5.2 - .5) / 4.2 * 100}% ${(point.v * 5.2 - .5) / 4.2 * 100}%`;
    if (lens) lens.style.backgroundPosition = position;
    document.querySelector('#aroma')?.style.setProperty('--sample-position', position);
    updateLink();
  }
  function renderWord(gesture = state.gesture) {
    const spreadControl = document.querySelector('#shape-spread'), tiltControl = document.querySelector('#shape-tilt');
    const spreadValue = Math.round(gesture.spread * 100), tiltValue = Number(gesture.tilt.toFixed(1));
    if (spreadControl) { spreadControl.value = String(spreadValue); spreadControl.setAttribute('aria-valuetext', `ひらき${spreadValue}パーセント`); }
    if (tiltControl) { tiltControl.value = String(tiltValue); tiltControl.setAttribute('aria-valuetext', `傾き${tiltValue}度`); }
    const word = document.querySelector('#part-word');
    if (!word) return;
    if (word.querySelectorAll('.echo-char').length !== 3) {
      word.replaceChildren(...Array.from({ length: 3 }, () => { const span = document.createElement('span'); span.className = 'echo-char'; span.setAttribute('aria-hidden', 'true'); return span; }));
    }
    word.setAttribute('aria-label', parts[state.part].word);
    word.style.transform = `rotate(${gesture.tilt}deg)`;
    // 「大きさで弾む」: the same layout as the pour heading (card.js wordGlyphs).
    const shape = wordGlyphs(parts[state.part].word, state.part, gesture.spread);
    const echo = word.closest('.part-echo'), bang = echo?.querySelector('.part-echo-bang');
    if (echo) { echo.style.width = `${shape.width.toFixed(3)}em`; echo.style.height = `${shape.height.toFixed(3)}em`; }
    [...word.querySelectorAll('.echo-char'), bang].forEach((span, i) => {
      const g = shape.glyphs[i];
      if (!span || !g) return;
      if (span !== bang) span.textContent = g.ch;
      span.style.fontSize = `${g.size}em`;
      span.style.transform = `translate(-50%, -50%) translate(${(g.x / g.size).toFixed(3)}em, ${(g.y / g.size).toFixed(3)}em) rotate(${g.rotation.toFixed(1)}deg) skewX(-8deg) scaleX(${g.sx})`;
    });
  }
  function commitGesture(gesture = previewGesture || state.gesture) {
    gestures[state.part] = { ...gesture }; state.gesture = { ...gesture }; previewGesture = null;
    lastCommitGesture = { ...gesture };
    root.dataset.gesture = JSON.stringify(state.gesture);
    root.dataset.lastCommitGesture = JSON.stringify(lastCommitGesture);
    samples[state.part] = { ...state.sample };
    renderWord();
    publishComposition();
  }
  ['shape-spread', 'shape-tilt'].forEach(id => {
    const input = document.getElementById(id);
    input?.addEventListener('input', event => {
      const value = Number(input.value);
      if (drag) cancelDrag();
      clearFlight();
      const targets = [document.querySelector('.part-echo-motion'), lens];
      animations.forEach(animation => { if (targets.includes(animation.effect?.target)) { animation.cancel(); animations.delete(animation); } });
      const gesture = { ...state.gesture };
      if (id === 'shape-spread') gesture.spread = clamp(value / 100, 0, 1);
      else gesture.tilt = clamp(value, -10, 10);
      commitGesture(gesture); explored(event);
    });
  });
  const partLabel = () => state.part === 'juice' ? '果汁の酸味、きゅっ' : '皮の香り、ふわっ';
  function selectPart(part, pointer = false, point = samples[part], commit = true) {
    const data = parts[part];
    if (!data) return;
    clearFlight();
    state.part = part;
    state.sample = { u: point.u, v: point.v };
    state.gesture = { ...gestures[part] }; previewGesture = null;
    root.dataset.part = part;
    const aroma = document.querySelector('#aroma');
    if (aroma) aroma.dataset.part = part;
    document.querySelectorAll('[data-part-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.partChoice === part)));
    const values = { 'part-title': data.title, 'part-description': data.description, 'part-detail-label': data.detail, 'part-stage-note': data.stage };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (!element) return;
      if (id === 'part-title') {
        const split = value.indexOf('、') + 1;
        const lead = document.createElement('span'), tail = document.createElement('span');
        phrased(lead, value.slice(0, split)); phrased(tail, value.slice(split));
        element.replaceChildren(lead, tail);
      } else if (id === 'part-description') phrased(element, value);
      else element.textContent = value;
    });
    if (lens) lens.setAttribute('aria-label', data.detail);
    const pourWord = document.querySelector('#pour-word'), pourAccessible = document.querySelector('#pour-title .sr-only'), pourCopy = document.querySelector('#pour-sense-copy');
    const pourText = part === 'peel' ? 'ふわっ。' : 'きゅっ。';
    if (pourWord) pourWord.innerHTML = pourWordMarkup(part);
    if (pourAccessible) pourAccessible.textContent = pourText;
    if (pourCopy) phrased(pourCopy, part === 'peel' ? '皮の青い香りを、泡でひらく。' : '果汁の酸味を、泡できりっと。');
    const nextLink = document.querySelector('.lab-panel .text-link');
    if (nextLink) nextLink.firstChild.textContent = part === 'peel' ? 'その香りを、一杯で味わう' : 'その酸味を、一杯で味わう';
    moveLens(point); renderWord();
    root.dataset.gesture = JSON.stringify(state.gesture);
    const targets = [document.querySelector('.part-echo-motion'), document.querySelector('#aroma .detail-lens')];
    animations.forEach(animation => { if (targets.includes(animation.effect?.target)) { animation.cancel(); animations.delete(animation); } });
    if (pointer && allowed()) targets.forEach(target => animate(target, [
      { transform: 'scale(1)' }, { transform: 'scale(.975)', offset: .22 },
      { transform: 'scale(1.018)', offset: .55 }, { transform: 'scale(1)' },
    ], { duration: 300, easing: 'cubic-bezier(.16,.7,.25,1)' }));
    if (commit) { samples[part] = { ...state.sample }; lastCommitGesture = { ...state.gesture }; root.dataset.lastCommitGesture = JSON.stringify(lastCommitGesture); publishComposition(); }
    announce(`${partLabel()}を選びました。`);
  }
  document.querySelectorAll('[data-part-choice]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', event => {
      selectPart(button.dataset.partChoice, event.detail !== 0);
      if (button.closest('#aroma')) { explored(event); if (event.detail !== 0) flySample(); else clearFlight(); }
    });
  });
  let alphaPixels = null, alphaWidth = 0, alphaHeight = 0;
  const cleanFruit = new Image();
  cleanFruit.onload = () => {
    try {
      const sample = document.createElement('canvas'); sample.width = cleanFruit.naturalWidth; sample.height = cleanFruit.naturalHeight;
      const context = sample.getContext('2d', { willReadFrequently: true });
      context.drawImage(cleanFruit, 0, 0); alphaPixels = context.getImageData(0, 0, sample.width, sample.height).data;
      alphaWidth = sample.width; alphaHeight = sample.height;
    } catch { alphaPixels = null; }
  };
  cleanFruit.src = new URL('./assets/citrus-award-v1.webp', import.meta.url).href;
  function hitTest(event) {
    const matrix = lab?.querySelector('svg')?.getScreenCTM();
    if (!matrix || !alphaPixels) return null;
    let point;
    try { point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()); } catch { return null; }
    const u = (point.x - 82) / 636, v = (point.y - 82) / 636;
    if (u < 0 || v < 0 || u >= 1 || v >= 1) return null;
    const pixel = (Math.floor(v * alphaHeight) * alphaWidth + Math.floor(u * alphaWidth)) * 4;
    if (alphaPixels[pixel + 3] < 30) return null;
    return { u, v, part: ((u - .5) / .435) ** 2 + ((v - .45) / .39) ** 2 < 1 ? 'juice' : 'peel' };
  }
  function cancelDrag() {
    if (!drag) return;
    lastPointerUp = performance.now();
    const previous = drag.previous; drag = null; previewGesture = null;
    selectPart(previous.part, false, previous.point, false);
    state.gesture = { ...previous.gesture }; renderWord(); root.dataset.gesture = JSON.stringify(state.gesture);
  }
  if (lab) {
    lab.disabled = false;
    lab.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || drag) { if (drag) cancelDrag(); return; }
      const hit = hitTest(event); if (!hit) return;
      const previous = { part: state.part, gesture: { ...state.gesture }, point: { ...lensPoint } };
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, width: lab.getBoundingClientRect().width, horizontal: false, previous };
      selectPart(hit.part, false, hit, false);
    });
    lab.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.horizontal) {
        if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx) / 1.4) { cancelDrag(); return; }
        if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
        drag.horizontal = true;
        try { lab.setPointerCapture(event.pointerId); } catch { /* Pointer may already have ended. */ }
      }
      previewGesture = { spread: clamp(.5 + dx / (drag.width * .4), 0, 1), tilt: clamp(dx / drag.width * 18, -10, 10) };
      renderWord(previewGesture);
    });
    lab.addEventListener('pointerup', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const source = { x: drag.x, y: drag.y };
      lastPointerUp = performance.now(); drag = null; commitGesture(); explored(event); flySample(source);
    });
    lab.addEventListener('pointercancel', cancelDrag);
    window.addEventListener('pointerup', () => { if (drag) cancelDrag(); });
    document.addEventListener('pointerdown', event => { if (!event.isPrimary && drag) cancelDrag(); }, { passive: true });
    lab.addEventListener('click', event => {
      if (event.detail === 0) { selectPart(state.part === 'peel' ? 'juice' : 'peel'); explored(event); clearFlight(); return; }
      if (performance.now() - lastPointerUp < 500) return;
      const hit = hitTest(event); if (hit) { selectPart(hit.part, true, hit); explored(event); flySample({ x: event.clientX, y: event.clientY }); }
    });
  }
  window.addEventListener('resize', updateLink);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelDrag(); });
  if (typeof ResizeObserver === 'function' && lens && lab) { const observer = new ResizeObserver(updateLink); observer.observe(lens); observer.observe(lab); }
  selectPart('peel', false, defaults.peel, false);
  if (fruit) {
    fruit.disabled = false;
    fruit.addEventListener('click', event => {
      announce('泡がはじけました。');
      const hint = document.querySelector('#hero-bridge-hint');
      if (hint && !hint.dataset.updated) { hint.textContent = '次は、皮と果汁の違いへ。'; hint.dataset.updated = 'true'; }
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
  const stateSnapshot = () => Object.freeze({ ...state, sample: Object.freeze({ ...state.sample }), gesture: Object.freeze({ ...state.gesture }), lastCommitGesture: Object.freeze({ ...lastCommitGesture }), previewGesture: previewGesture ? Object.freeze({ ...previewGesture }) : null });
  window.__nishiokaMotion = Object.freeze({ snapshot: () => Object.freeze({ activeAnimations: animations.size, raf: Boolean(raf), particles: particles.length, burstCount, motion: root.dataset.motion, ...stateSnapshot() }) });
  Object.defineProperty(window, '__nishiokaState', { configurable: true, get: stateSnapshot });
  root.dataset.part = state.part;
  root.dataset.explored = 'false';
  root.dataset.lastCommitGesture = JSON.stringify(lastCommitGesture);
  const readiness = [document.fonts?.ready, ...Array.from(hero?.querySelectorAll('img') || [], image => image.decode?.().catch(() => {}))];
  const initialGeneration = generation;
  Promise.allSettled(readiness).then(() => {
    if (generation === initialGeneration && burstCount === 0 && allowed()) burst(true);
  });
})();
