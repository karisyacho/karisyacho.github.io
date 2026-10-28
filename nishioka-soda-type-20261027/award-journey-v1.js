// One scroll-driven word, shared by the lab, glass and saved card.
(() => {
  'use strict';
  const root = document.documentElement;
  const source = document.querySelector('#aroma .part-echo');
  const pour = document.querySelector('#pour-word');
  const svg = document.querySelector('#pour-title svg');
  const canvas = document.querySelector('#note-canvas');
  if (!source || !pour || !svg || !canvas) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const actor = document.createElement('div');
  actor.className = 'word-traveler';
  actor.setAttribute('aria-hidden', 'true');
  Object.assign(actor.style, { position: 'fixed', left: '0', top: '0', zIndex: '20', pointerEvents: 'none', display: 'none', transformOrigin: 'center center' });
  document.body.append(actor);
  let clone, glyphs = [], cloneDirty = true, frame = 0, phase = 'static', progress = 0, active = false, frozen = false;
  let baseWidth = 1, sourceAngle = -9;
  const owned = new Map();
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const set = (element, property, value) => {
    if (element.style[property] !== value) element.style[property] = value;
  };
  function opacity(element, value) {
    if (!owned.has(element)) owned.set(element, { value: element.style.getPropertyValue('opacity'), priority: element.style.getPropertyPriority('opacity') });
    set(element, 'opacity', String(value));
  }
  function restore() {
    owned.forEach((old, element) => {
      if (old.value) element.style.setProperty('opacity', old.value, old.priority);
      else element.style.removeProperty('opacity');
    });
    owned.clear();
    const mask = document.querySelector('#note-word-mask');
    if (mask) { mask.hidden = true; mask.style.removeProperty('opacity'); }
  }
  function staticView() {
    restore();
    actor.style.display = 'none';
    actor.style.removeProperty('will-change');
    active = false; phase = 'static'; progress = 0;
  }
  function rebuild() {
    const original = [source, ...source.querySelectorAll('*')];
    clone = source.cloneNode(true);
    const copied = [clone, ...clone.querySelectorAll('*')];
    original.forEach((node, index) => {
      const target = copied[index], style = getComputedStyle(node);
      target.removeAttribute('id');
      // Computed styles preserve the material and individually shaped glyphs.
      for (const property of style) target.style.setProperty(property, style.getPropertyValue(property));
      target.style.animation = 'none'; target.style.transition = 'none';
    });
    const matrix = getComputedStyle(source).transform;
    const numbers = matrix.match(/^matrix\(([^)]+)\)$/);
    sourceAngle = numbers ? Math.atan2(Number(numbers[1].split(',')[1]), Number(numbers[1].split(',')[0])) * 180 / Math.PI : -9;
    baseWidth = source.offsetWidth || source.getBoundingClientRect().width || 1;
    Object.assign(clone.style, { position: 'relative', left: 'auto', right: 'auto', top: 'auto', bottom: 'auto', margin: '0', transform: 'none', opacity: '1', width: `${baseWidth}px`, height: `${source.offsetHeight}px`, pointerEvents: 'none', visibility: 'visible' });
    actor.replaceChildren(clone);
    Object.assign(actor.style, { display: 'block', opacity: '0', transform: 'none' });
    const cloneBox = clone.getBoundingClientRect();
    const painted = paintedRect(clone);
    baseWidth = painted.width || baseWidth;
    clone.style.transform = `translate(${cloneBox.left + cloneBox.width / 2 - (painted.left + painted.width / 2)}px, ${cloneBox.top + cloneBox.height / 2 - (painted.top + painted.height / 2)}px)`;
    glyphs = [...clone.querySelectorAll('.echo-char, .part-echo-bang')].map(element => {
      const filter = element.style.filter;
      const factor = name => {
        const match = filter.match(new RegExp(`${name}\\(([^)]+)\\)`));
        return match ? parseFloat(match[1]) / (match[1].includes('%') ? 100 : 1) : 1;
      };
      return { element, fill: element.style.webkitTextFillColor, color: element.style.color, filter, brightness: factor('brightness'), saturate: factor('saturate') };
    });
    cloneDirty = false;
  }
  function paintedRect(element) {
    const rects = [...element.querySelectorAll('.echo-char, .part-echo-bang')].map(node => node.getBoundingClientRect()).filter(rect => rect.width && rect.height);
    if (!rects.length) return element.getBoundingClientRect();
    const left = Math.min(...rects.map(rect => rect.left)), right = Math.max(...rects.map(rect => rect.right));
    const top = Math.min(...rects.map(rect => rect.top)), bottom = Math.max(...rects.map(rect => rect.bottom));
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  }
  function center(rect) { return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 + scrollY }; }
  function interval(a, b) {
    const distance = b.y - a.y;
    return distance > 1 ? (scrollY - (a.y - innerHeight * .35)) / distance : -1;
  }
  function cardReady() {
    try { return window.__nishiokaMotion?.snapshot?.().cardReady === true && !canvas.hidden; }
    catch { return false; }
  }
  function draw() {
    frame = 0;
    if (frozen || reduced.matches || root.dataset.explored !== 'true' || root.dataset.motion !== 'active' || root.dataset.keyboard === 'true' || document.hidden || (window.visualViewport?.scale || 1) > 1.01) { staticView(); return; }
    const labRect = paintedRect(source), glassRect = pour.getBoundingClientRect(), cardRect = canvas.getBoundingClientRect();
    if (!labRect.width || !glassRect.width) { staticView(); return; }
    const lab = center(labRect), glass = center(glassRect);
    const note = { x: cardRect.left + cardRect.width * .5, y: cardRect.top + cardRect.height * .4 + scrollY };
    const first = interval(lab, glass), second = interval(glass, note);
    let t, from, to, startWidth, endWidth;
    if (first > 0 && first < 1) {
      phase = 'lab-to-glass'; t = first; from = lab; to = glass;
      startWidth = labRect.width; endWidth = glassRect.width;
    } else if (second > 0 && second < 1 && cardRect.width && cardReady() && document.querySelector('#note-word-mask')) {
      phase = 'glass-to-note'; t = second; from = glass; to = note;
      startWidth = glassRect.width; endWidth = cardRect.width / 1080 * 850;
    } else { staticView(); return; }
    restore();
    if (cloneDirty) rebuild();
    const enter = ease(clamp(t / .2)), leave = ease(clamp((t - .8) / .2));
    const laneX = innerWidth - 62, laneY = innerHeight * .35;
    const x = t < .2 ? lerp(from.x, laneX, enter) : t > .8 ? lerp(laneX, to.x, leave) : laneX;
    const y = t < .2 ? lerp(from.y - scrollY, laneY, enter) : t > .8 ? lerp(laneY, to.y - scrollY, leave) : laneY;
    const width = t < .2 ? lerp(startWidth, 92, enter) : t > .8 ? lerp(92, endWidth, leave) : 92;
    const part = root.dataset.part || document.querySelector('#tasting')?.dataset.part || 'peel';
    if (phase === 'lab-to-glass') {
      opacity(source, 1 - enter);
      opacity(svg, leave);
    } else {
      opacity(svg, 1 - enter);
      const mask = document.querySelector('#note-word-mask');
      const flavor = root.dataset.flavor || document.querySelector('#tasting')?.dataset.flavor || 'sudachi';
      const natsu = flavor === 'natsumikan' || flavor === 'natsu';
      mask.style.backgroundColor = part === 'juice' ? (natsu ? '#3c271c' : '#0f382b') : (natsu ? '#fff0d8' : '#f2f0dc');
      mask.hidden = false;
      set(mask, 'opacity', String(1 - leave));
    }
    const pourRect = document.querySelector('#pour')?.getBoundingClientRect();
    const aromaRect = document.querySelector('#aroma')?.getBoundingClientRect();
    const contains = rect => rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    const white = contains(pourRect) || (part === 'juice' && (contains(aromaRect) || contains(cardRect)));
    const neutral = enter * (1 - leave);
    const ink = white ? `rgba(245, 248, 231, ${neutral})` : `rgba(18, 60, 49, ${neutral})`;
    glyphs.forEach(({ element, fill, color, filter, brightness, saturate }) => {
      set(element, 'webkitTextFillColor', neutral > 0 ? ink : fill);
      set(element, 'color', color);
      set(element, 'filter', neutral > 0 ? `brightness(${lerp(brightness, 1, neutral)}) saturate(${lerp(saturate, 1, neutral)})` : filter);
    });
    const scale = clamp(width / baseWidth, .2, 1.5);
    const angle = phase === 'lab-to-glass' ? lerp(sourceAngle, -10, t) : lerp(-10, sourceAngle, t);
    Object.assign(actor.style, { display: 'block', willChange: 'transform, opacity', filter: white ? 'drop-shadow(0 1px 1px rgba(12,40,30,.25))' : 'none', opacity: String(enter * (1 - leave)), transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale}) rotate(${angle}deg)` });
    active = true; progress = t;
  }
  function dirty() {
    if (frozen || reduced.matches || root.dataset.explored !== 'true' || root.dataset.motion !== 'active' || root.dataset.keyboard === 'true' || document.hidden || (window.visualViewport?.scale || 1) > 1.01) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      staticView();
      return;
    }
    if (!frame) frame = requestAnimationFrame(draw);
  }
  addEventListener('scroll', dirty, { passive: true });
  addEventListener('resize', dirty, { passive: true });
  window.visualViewport?.addEventListener('resize', dirty, { passive: true });
  document.addEventListener('visibilitychange', dirty);
  addEventListener('soda:composition', () => { cloneDirty = true; dirty(); });
  addEventListener('pagehide', () => { frozen = true; if (frame) cancelAnimationFrame(frame); frame = 0; staticView(); });
  addEventListener('pageshow', () => { frozen = false; cloneDirty = true; dirty(); });
  reduced.addEventListener('change', dirty);
  new MutationObserver(() => { cloneDirty = true; dirty(); }).observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-explored', 'data-keyboard', 'data-part', 'data-flavor'] });
  new MutationObserver(records => {
    if (records.some(record => record.target !== source || record.type !== 'attributes' || record.attributeName !== 'style')) { cloneDirty = true; dirty(); }
  }).observe(source, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class'] });
  const aroma = document.querySelector('#aroma');
  if (aroma) new MutationObserver(() => { cloneDirty = true; dirty(); }).observe(aroma, { attributes: true, attributeFilter: ['class', 'style', 'data-part'] });
  Object.defineProperty(window, '__nishiokaJourney', { value: Object.freeze({ snapshot: () => Object.freeze({ phase, active, raf: Boolean(frame), clonesCount: actor.childElementCount, progress }) }), configurable: true });
  document.fonts?.ready.then(() => { cloneDirty = true; dirty(); });
  dirty();
})();
