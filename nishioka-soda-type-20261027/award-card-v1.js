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
        ctx.fillStyle = ink;
        ctx.textBaseline = 'alphabetic';
        ctx.font = '700 52px ClearJP';
        ctx.fillText('西岡ソーダ店', 70, 90);
        ctx.font = '500 25px ClearJP'; ctx.textAlign = 'right';
        ctx.fillText('TODAY’S CITRUS NOTE', 1010, 86);
        const letters = [...(peel ? natsu ? 'ほろっ' : 'ふわっ' : natsu ? 'じゅわっ' : 'きゅっ')];
        const places = peel ? [[300,650,360,-18,1],[630,485,380,-6,1],[865,810,310,12,1]] : natsu ? [[250,540,330,-16,.7],[460,590,280,-5,.65],[665,640,330,5,.7],[860,720,240,18,.65]] : [[410,560,430,-16,.64],[600,680,340,0,.68],[795,740,300,15,.67]];
        const layer = document.createElement('canvas'); layer.width = 1080; layer.height = 1350;
        const glyphContext = layer.getContext('2d');
        if (!glyphContext) throw new Error('canvas');
        glyphContext.textAlign = 'center'; glyphContext.textBaseline = 'alphabetic';
        const glyph = (text, x, y, size, angle, scaleX = 1) => {
          glyphContext.save(); glyphContext.translate(x, y); glyphContext.rotate(angle * Math.PI / 180);
          glyphContext.transform(1, 0, Math.tan(-8 * Math.PI / 180), 1, 0, 0);
          glyphContext.scale(scaleX, 1);
          glyphContext.font = `900 ${size}px BurstJP`; glyphContext.fillText(text, 0, 0); glyphContext.restore();
        };
        places.forEach(([x, y, size, angle, scaleX], i) => {
          const side = i === 0 ? -1 : i === places.length - 1 ? 1 : 0;
          glyph(letters[i], x + side * (peel ? 50 : natsu ? 45 : 60) * (gesture.spread - .5), y, size, angle + gesture.tilt * .3, scaleX);
        });
        glyph('!', peel ? 920 : 900, peel ? 280 : natsu ? 260 : 290, peel ? 220 : natsu ? 210 : 240, 16 + gesture.tilt * .3);
        glyphContext.globalCompositeOperation = 'source-in'; glyphContext.fillStyle = ink;
        glyphContext.fillRect(0, 0, 1080, 1350);
        if (texture) {
          glyphContext.globalCompositeOperation = 'source-atop'; glyphContext.globalAlpha = peel ? .32 : .72;
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
        const mood = peel ? natsu ? 'ほろ苦派' : 'ふわっと香り派' : natsu ? 'じゅわっと甘酸っぱ派' : 'きゅっと酸味派';
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
