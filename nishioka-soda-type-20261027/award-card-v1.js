// Colour A (fruit cross-section) and its juice / natsumikan counterparts, top to bottom.
export const WORD_COLORS = {
  sudachi: { peel: ['#0f3a2c', '#2e6a2c', '#9cc83c', '#ece33c'], juice: ['#fdfbd2', '#f3ec7a', '#cfe05a', '#9cc83c'] },
  natsumikan: { peel: ['#5a2408', '#a8460c', '#ec8a1e', '#ffd26a'], juice: ['#fff6dc', '#ffe0a0', '#f8b45a', '#ec8a1e'] }
};
const STOPS = [0, .38, .7, 1];
export function svgGradient(id, flavor, part, space) {
  const box = space ? `gradientUnits="userSpaceOnUse" x1="0" y1="${space.y1.toFixed(1)}" x2="0" y2="${space.y2.toFixed(1)}"` : 'x1="0" y1="0" x2="0" y2="1"';
  return `<linearGradient id="${id}" ${box}>${WORD_COLORS[flavor][part].map((c, i) => `<stop offset="${STOPS[i]}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}


// Chapter 2 "味を選ぶ": the two flavours, compared on the same four scales (5 = strongest).
export const FLAVORS = {
  sudachi: { name: 'すだち', say: 'きりっと酸っぱく、青く香る。', pair: '唐揚げ、焼き魚、お昼ごはん', photo: 'assets/taste-sudachi-v1.webp', alt: '水しぶきの中に立つ、すだちソーダの瓶', scores: [5, 5, 1, 1],
    letters: [['す', 150, 200, 196, -6], ['だ', 310, 136, 124, 9], ['ち', 445, 192, 128, -5]] },
  natsumikan: { name: '夏みかん', say: 'ほろ苦く、あとから甘い。', pair: '午後のおやつ、ひと休み', photo: 'assets/taste-natsu-v1.webp', alt: '水しぶきの中に立つ、夏みかんソーダの瓶', scores: [3, 3, 3, 4],
    letters: [['夏', 120, 196, 170, -6], ['み', 262, 140, 100, 8], ['か', 372, 196, 106, -4], ['ん', 480, 150, 100, 10]] }
};
export const TASTE_SCALES = ['酸っぱさ', '香り', '甘さ', 'ほろ苦さ'];
// 「大きさで弾む」 like the hero: a big first letter and smaller letters bouncing.
export function flavorWordMarkup(flavor) {
  const { letters } = FLAVORS[flavor];
  return `<defs>${svgGradient('flavor-grad-' + flavor, flavor, 'peel')}</defs>` + letters.map(([ch, x, y, size, angle]) => `<g transform="translate(${x} ${y}) rotate(${angle}) skewX(-8)"><g class="flavor-letter"><text text-anchor="middle" style="font-size:${size}px;fill:url(#flavor-grad-${flavor});stroke-width:${(size * .07).toFixed(1)}px">${ch}</text></g></g>`).join('');
}
export function tasteRowsMarkup(flavor) {
  const order = flavor === 'sudachi' ? ['sudachi', 'natsumikan'] : ['natsumikan', 'sudachi'];
  return TASTE_SCALES.map((scale, row) => `<div class="taste-row"><b>${scale}</b><div class="taste-lines">${order.map(f => `<div class="taste-line" data-line="${f}" role="img" aria-label="${FLAVORS[f].name}、${scale}は5段階の${FLAVORS[f].scores[row]}"><span class="taste-who" aria-hidden="true">${FLAVORS[f].name}</span>${[1, 2, 3, 4, 5].map(i => `<i class="taste-bubble${i <= FLAVORS[f].scores[row] ? ' on' : ''}"></i>`).join('')}</div>`).join('')}</div></div>`).join('');
}

// Chapter 4 "買い方": a fictional price list. Nothing is ordered or charged.
export const SIZES = { 250: { label: '250 ml 瓶', price: 380 }, 500: { label: '500 ml 瓶', price: 680 } };
export const yen = n => `${n.toLocaleString('ja-JP')}円`;
// The chosen bottles in a 12-slot crate; a 500 ml bottle stands taller than a 250 ml one.
function bottlePath(h, w) {
  const x = (60 - w) / 2, top = 178 - h, neck = w * .4, nx = (60 - neck) / 2, shoulder = top + h * .36;
  return `M${nx.toFixed(1)} ${top} h${neck.toFixed(1)} v${(h * .12).toFixed(1)} C${nx + neck} ${(shoulder - h * .06).toFixed(1)} ${x + w} ${(shoulder - h * .05).toFixed(1)} ${x + w} ${(shoulder + h * .07).toFixed(1)} V174 q0 4 -4 4 H${x + 4} q-4 0 -4 -4 V${(shoulder + h * .07).toFixed(1)} C${x} ${(shoulder - h * .05).toFixed(1)} ${nx} ${(shoulder - h * .06).toFixed(1)} ${nx} ${(top + h * .12).toFixed(1)} Z`;
}
export function crateMarkup(size, qty) {
  const h = size === 500 ? 168 : 124, w = size === 500 ? 44 : 38, top = 178 - h, neck = w * .4;
  const body = bottlePath(h, w), label = top + h * .56;
  return Array.from({ length: 12 }, (_, i) => i < qty
    ? `<svg class="crate-slot is-filled" viewBox="0 0 60 180"><path class="bottle-glass" d="${body}"/><rect class="bottle-label" x="${(60 - w) / 2}" y="${label.toFixed(1)}" width="${w}" height="${(h * .2).toFixed(1)}"/><rect class="bottle-cap" x="${((60 - neck) / 2 - 1.5).toFixed(1)}" y="${top - 7}" width="${(neck + 3).toFixed(1)}" height="9" rx="2"/></svg>`
    : `<svg class="crate-slot" viewBox="0 0 60 180"><path class="bottle-empty" d="${body}"/></svg>`).join('');
}
