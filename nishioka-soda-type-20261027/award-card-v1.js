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


// The pour heading sits on the dark photo: peel gets a cream rim, juice a deep green one.
export const POUR_DEFS = svgGradient('pour-peel', 'sudachi', 'peel') + svgGradient('pour-juice', 'sudachi', 'juice');
export function pourWordMarkup(part) {
  return svgWord(part === 'peel' ? 'ふわっ' : 'きゅっ', part, { cx: 300, cy: 180, maxWidth: 540, maxHeight: 300, fill: `url(#pour-${part})`, rim: part === 'peel' ? '#f4f4df' : '#0f382b' });
}
