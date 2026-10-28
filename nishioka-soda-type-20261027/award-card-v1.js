// 「大きさで弾む」: big first letter, small middle, oversized "!".
// Peel lets the small letters bounce upward; juice squeezes them low and tight.
// Units are em of the base size, centred on (0, 0); y is the glyph centre.
export function wordGlyphs(word, part, spread = .5) {
  const chars = [...word.replace(/[。！!]+$/, ''), '!'];
  const peel = part === 'peel', smallKana = /[ぁぃぅぇぉゃゅょっ]/;
  const glyphs = [];
  chars.forEach((ch, i) => {
    const first = i === 0, last = i === chars.length - 1, small = smallKana.test(ch);
    const size = first ? 1.5 : last ? (peel ? 1.4 : 1.55) : small ? (peel ? .62 : .74) : .78;
    const sx = peel || last ? 1 : .84;
    const ink = last ? .36 : small ? .62 : .92;
    const width = size * ink * sx, height = size * (small ? .62 : .9);
    const middle = !first && !last, odd = (i % 2) === 1;
    const y = peel ? (middle ? (odd ? -.48 - .28 * spread : -.04) : last ? -.36 : 0) : (middle ? .38 - .05 * spread : last ? -.28 : 0);
    const rotation = (peel ? (first ? -6 : last ? 12 : odd ? 9 : -5) * (.6 + .8 * spread) : first ? -4 : last ? 7 : 0);
    const gap = peel ? .1 + .22 * spread : last ? .16 : .02 - .06 * spread;
    const x = i ? glyphs[i - 1].x + glyphs[i - 1].width / 2 + gap + width / 2 : 0;
    glyphs.push({ ch, x, y, size, sx, rotation, width, height });
  });
  const left = Math.min(...glyphs.map(g => g.x - g.width / 2)), right = Math.max(...glyphs.map(g => g.x + g.width / 2));
  const top = Math.min(...glyphs.map(g => g.y - g.height / 2)), bottom = Math.max(...glyphs.map(g => g.y + g.height / 2));
  const cx = (left + right) / 2, cy = (top + bottom) / 2;
  glyphs.forEach(g => { g.x -= cx; g.y -= cy; });
  return { glyphs, width: right - left, height: bottom - top };
}

// Colour A (fruit cross-section) and its juice / natsumikan counterparts, top to bottom.
export const WORD_COLORS = {
  sudachi: { peel: ['#0f3a2c', '#2e6a2c', '#9cc83c', '#ece33c'], juice: ['#fdfbd2', '#f3ec7a', '#cfe05a', '#9cc83c'] },
  natsumikan: { peel: ['#5a2408', '#a8460c', '#ec8a1e', '#ffd26a'], juice: ['#fff6dc', '#ffe0a0', '#f8b45a', '#ec8a1e'] }
};
const STOPS = [0, .38, .7, 1];
export function cssWordGradient(flavor, part, alpha = '') {
  return `linear-gradient(180deg, ${WORD_COLORS[flavor][part].map((c, i) => `${c}${alpha} ${STOPS[i] * 100}%`).join(', ')})`;
}

// SVG <text> run of wordGlyphs, used by the pour heading (built and live).
export function svgWord(word, part, { cx, cy, maxWidth, maxHeight, fill, rim, spread = .5 }) {
  const shape = wordGlyphs(word, part, spread), base = Math.min(maxWidth / shape.width, maxHeight / shape.height);
  return shape.glyphs.map(g => {
    const x = (cx + g.x * base).toFixed(1), y = (cy + g.y * base).toFixed(1), size = (g.size * base).toFixed(1);
    return `<text x="0" y="0" transform="translate(${x} ${y}) rotate(${g.rotation.toFixed(1)}) skewX(-8) scale(${g.sx} 1)" text-anchor="middle" dominant-baseline="central" style="font-size:${size}px;letter-spacing:0;fill:${fill};stroke:${rim};stroke-width:${Math.max(6, g.size * base * .12).toFixed(1)}px;stroke-linejoin:round;paint-order:stroke">${g.ch}</text>`;
  }).join('');
}
export function svgGradient(id, flavor, part, space) {
  const box = space ? `gradientUnits="userSpaceOnUse" x1="0" y1="${space.y1.toFixed(1)}" x2="0" y2="${space.y2.toFixed(1)}"` : 'x1="0" y1="0" x2="0" y2="1"';
  return `<linearGradient id="${id}" ${box}>${WORD_COLORS[flavor][part].map((c, i) => `<stop offset="${STOPS[i]}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}

export function createNoteRenderer({ canvas, button, status }) {
  let token = 0, ready = false, rendering = false, busy = false, destroyed = false;
  let latest = Promise.resolve(), current = null;
  const urls = new Map();
  const expand = document.querySelector('#expand-note'), dialog = document.querySelector('#note-dialog');
  const large = document.querySelector('#note-large'), close = document.querySelector('#close-note');
  const say = message => { if (status) status.textContent = message; };
  const updateButton = () => {
    if (button) button.disabled = !ready || rendering || busy || destroyed;
    if (expand) expand.disabled = !ready || rendering || destroyed;
  };
  const fonts = Promise.all([
    document.fonts.load('900 250px BurstJP'),
    document.fonts.load('500 36px ClearJP'),
    document.fonts.load('700 52px ClearJP'),
  ]).then(results => { if (results.some(result => !result.length)) throw new Error('font'); });
  // A rejection is also observed here while the first image is still loading.
  fonts.catch(() => {});
  const textures = new Map();
  function textureFor(flavor, part) {
    const key = flavor === 'sudachi' ? 'sudachi-sampled' : `${flavor}-${part}`;
    if (!textures.has(key)) textures.set(key, new Promise(resolve => {
      const image = new Image();
      image.onload = async () => { try { await image.decode(); resolve(image); } catch { resolve(null); } };
      image.onerror = () => resolve(null);
      image.src = flavor === 'sudachi' ? 'assets/citrus-award-v1.webp' : `assets/material-${key}.webp`;
    }));
    return textures.get(key);
  }
  function render(selection) {
    const request = ++token;
    rendering = true;
    updateButton();
    latest = (async () => {
      try {
        await fonts;
        const { part, flavor, image } = selection;
        const gesture = { spread: Math.max(0, Math.min(1, selection.gesture?.spread ?? .5)), tilt: Math.max(-10, Math.min(10, selection.gesture?.tilt ?? 0)) };
        const sample = { u: Math.max(0, Math.min(1, selection.sample?.u ?? (part === 'peel' ? .35 : .70))), v: Math.max(0, Math.min(1, selection.sample?.v ?? (part === 'peel' ? .90 : .68))) };
        if (!image?.naturalWidth || !image?.naturalHeight) throw new Error('image');
        const texture = await textureFor(flavor, part);
        if (destroyed || request !== token) return false;
        const sheet = document.createElement('canvas');
        sheet.width = 1080; sheet.height = 1350;
        const ctx = sheet.getContext('2d');
        if (!ctx || !canvas?.getContext('2d')) throw new Error('canvas');
        const peel = part === 'peel', natsu = flavor === 'natsumikan';
        const ink = peel ? natsu ? '#b8500c' : '#123c31' : natsu ? '#ffd496' : '#f7f1a8';
        ctx.fillStyle = peel ? natsu ? '#fff0d8' : '#f2f0dc' : natsu ? '#3c271c' : '#0f382b';
        ctx.fillRect(0, 0, 1080, 1350);
        const groundColor = ctx.fillStyle;
        ctx.fillStyle = ink;
        ctx.textBaseline = 'alphabetic';
        ctx.font = '700 52px ClearJP';
        ctx.fillText('西岡ソーダ店', 70, 90);
        ctx.font = '500 25px ClearJP'; ctx.textAlign = 'right';
        ctx.fillText('TODAY’S CITRUS NOTE', 1010, 86);
        const word = peel ? natsu ? 'ほろっ' : 'ふわっ' : natsu ? 'じゅわっ' : 'きゅっ';
        const shape = wordGlyphs(word, part, gesture.spread);
        const base = Math.min(900 / shape.width, 700 / shape.height), originX = 540, originY = 560;
        const colors = WORD_COLORS[natsu ? 'natsumikan' : 'sudachi'][part];
        const layer = document.createElement('canvas'); layer.width = 1080; layer.height = 1350;
        const glyphContext = layer.getContext('2d');
        if (!glyphContext) throw new Error('canvas');
        const place = (context, g) => {
          const tilt = (g.rotation + gesture.tilt * .5) * Math.PI / 180, size = g.size * base;
          context.translate(originX + g.x * base, originY + g.y * base); context.rotate(tilt);
          context.transform(1, 0, Math.tan(-8 * Math.PI / 180), 1, 0, 0); context.scale(g.sx, 1);
          context.font = `900 ${size}px BurstJP`; context.textAlign = 'center'; context.textBaseline = 'middle';
          return size;
        };
        // Ground-coloured rim first, so overlapping letters stay apart.
        ctx.save(); ctx.strokeStyle = groundColor; ctx.lineJoin = 'round';
        shape.glyphs.forEach(g => { ctx.save(); const size = place(ctx, g); ctx.lineWidth = Math.max(10, size * .12); ctx.strokeText(g.ch, 0, 0); ctx.restore(); });
        // On the pale peel cards a thin dark outline keeps the yellow foot of each letter off the ground.
        if (peel) { ctx.strokeStyle = colors[0]; shape.glyphs.forEach(g => { ctx.save(); const size = place(ctx, g); ctx.lineWidth = Math.max(5, size * .05); ctx.strokeText(g.ch, 0, 0); ctx.restore(); }); }
        ctx.restore();
        shape.glyphs.forEach(g => {
          glyphContext.save(); const size = place(glyphContext, g);
          const fill = glyphContext.createLinearGradient(0, -size * .45, 0, size * .45);
          colors.forEach((color, i) => fill.addColorStop([0, .38, .7, 1][i], color));
          glyphContext.fillStyle = fill; glyphContext.fillText(g.ch, 0, 0); glyphContext.restore();
        });
        if (texture) {
          glyphContext.globalCompositeOperation = 'source-atop'; glyphContext.globalAlpha = peel ? .3 : .34;
          if (flavor === 'sudachi') {
            const size = Math.min(texture.naturalWidth, texture.naturalHeight) * .34;
            const sx = Math.max(0, Math.min(texture.naturalWidth - size, sample.u * texture.naturalWidth - size / 2));
            const sy = Math.max(0, Math.min(texture.naturalHeight - size, sample.v * texture.naturalHeight - size / 2));
            glyphContext.drawImage(texture, sx, sy, size, size, 40, 120, 1000, 850);
          } else glyphContext.drawImage(texture, 40, 120, 1000, 850);
        }
        ctx.drawImage(layer, 0, 0);
        ctx.save(); ctx.beginPath(); ctx.arc(890, 1110, 118, 0, Math.PI * 2); ctx.clip();
        const scale = Math.max(236 / image.naturalWidth, 236 / image.naturalHeight);
        const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
        const left = Math.max(1008 - w, Math.min(772, 890 - w * .575));
        ctx.drawImage(image, left, 1110 - h / 2, w, h); ctx.restore();
        ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(890, 1110, 126, 0, Math.PI * 2); ctx.stroke();
        const mood = peel ? natsu ? 'ほろっ、ほろ苦さ派' : 'ふわっ、香り派' : natsu ? 'じゅわっ、甘酸っぱさ派' : 'きゅっ、酸味派';
        const caption = `${natsu ? '夏みかん' : 'すだち'} / ${mood}`;
        const howto = peel ? natsu ? '果皮はマーマレードにして、ほろ苦さを。' : '果皮は、すりおろして薬味にも。' : natsu ? '果肉はそのまま、甘酸っぱさを。' : '果汁をしぼって、さわやかな酸味を。';
        ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.font = '700 35px ClearJP';
        if (ctx.measureText(caption).width > 660) ctx.font = '700 31px ClearJP';
        ctx.fillText(caption, 70, 1080);
        ctx.font = '500 36px ClearJP';
        let split = -1;
        if (ctx.measureText(howto).width > 660) {
          for (let i = 0; i < howto.length - 1; i++) {
            if (howto[i] === '、' && ctx.measureText(howto.slice(0, i + 1)).width <= 660) split = i + 1;
          }
        }
        if (split > 0 && !/^[。、）」』】]/.test(howto.slice(split))) {
          ctx.fillText(howto.slice(0, split), 70, 1150, 660);
          ctx.fillText(howto.slice(split), 70, 1199, 660);
        } else ctx.fillText(howto, 70, 1150, 660);
        ctx.font = '500 22px ClearJP'; ctx.fillText('NISHIOKA SODA / CITRUS NOTE', 70, 1290);
        if (destroyed || request !== token) return false;
        canvas.width = 1080; canvas.height = 1350;
        canvas.getContext('2d').drawImage(sheet, 0, 0);
        canvas.setAttribute('aria-label', `${caption}のシトラスノート`);
        canvas.hidden = false;
        const fallback = document.querySelector('#note-fallback');
        if (fallback) fallback.hidden = true;
        current = { part, flavor, gesture: { ...gesture }, sample: { ...sample } }; ready = true;
        say(`${caption}のカードを保存できます。`);
        return true;
      } catch (error) {
        if (request === token && !destroyed) say('カードを作れませんでした。画像やフォントを読み込んでから、もう一度お試しください。');
        throw error;
      } finally {
        if (request === token) { rendering = false; updateButton(); }
      }
    })();
    latest.catch(() => {});
    return latest;
  }
  async function save() {
    if (busy || destroyed) return;
    busy = true; updateButton();
    try {
      let blob, selection, exportToken;
      do {
        let pending;
        do { pending = latest; await pending; } while (pending !== latest);
        if (!ready || destroyed) return;
        exportToken = token; selection = { ...current };
        blob = await new Promise((resolve, reject) => {
          try { canvas.toBlob(value => value ? resolve(value) : reject(new Error('png')), 'image/png'); }
          catch (error) { reject(error); }
        });
        if (destroyed) return;
      } while (exportToken !== token);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `nishioka-soda-${selection.flavor}-${selection.part}.png`;
      document.body.append(link); link.click(); link.remove();
      const timer = setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); }, 30000);
      urls.set(url, timer);
      say('カードの保存を開始しました。');
    } catch { say('画像を保存できませんでした。もう一度お試しください。'); }
    finally { busy = false; updateButton(); }
  }
  button?.addEventListener('click', save);
  async function openPreview() {
    try {
      let pending;
      do { pending = latest; await pending; } while (pending !== latest);
      if (!ready || destroyed || !dialog || !large) return;
      large.src = canvas.toDataURL('image/png');
      large.alt = canvas.getAttribute('aria-label') || '選んだシトラスノート';
      large.width = canvas.width; large.height = canvas.height;
      if (!dialog.open) dialog.showModal();
    } catch { say('大きな画像を表示できませんでした。もう一度お試しください。'); }
  }
  const closePreview = () => { if (dialog?.open) dialog.close(); };
  const closeOutside = event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePreview();
  };
  expand?.addEventListener('click', openPreview);
  close?.addEventListener('click', closePreview);
  dialog?.addEventListener('click', closeOutside);
  updateButton();
  return Object.freeze({
    render,
    destroy() {
      destroyed = true; token++; rendering = false;
      button?.removeEventListener('click', save);
      expand?.removeEventListener('click', openPreview);
      close?.removeEventListener('click', closePreview);
      dialog?.removeEventListener('click', closeOutside);
      closePreview();
      urls.forEach((timer, url) => { clearTimeout(timer); URL.revokeObjectURL(url); });
      urls.clear(); updateButton();
    },
    snapshot: () => Object.freeze({ ready, rendering, busy, part: current?.part, flavor: current?.flavor, gesture: current ? Object.freeze({ ...current.gesture }) : null, sample: current ? Object.freeze({ ...current.sample }) : null }),
  });
}

// The pour heading sits on the dark photo: peel gets a cream rim, juice a deep green one.
export const POUR_DEFS = svgGradient('pour-peel', 'sudachi', 'peel') + svgGradient('pour-juice', 'sudachi', 'juice');
export function pourWordMarkup(part) {
  return svgWord(part === 'peel' ? 'ふわっ' : 'きゅっ', part, { cx: 300, cy: 180, maxWidth: 540, maxHeight: 300, fill: `url(#pour-${part})`, rim: part === 'peel' ? '#f4f4df' : '#0f382b' });
}
