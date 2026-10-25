// TOP と WORKS（1枚の体験）。
// 入口：読み込み → 触れる → 始まる（その回の閲覧で1度だけ）。
// TOP：暗い部屋に立体の AWAI. が飛んできて集まり、近づくとこちらを向く（letters.js、2026-10-23 確定の動く絵コンテを移植）。
// TOP→WORKS：字が集まった道を逆にたどって奥へ帰り、同じ部屋の奥から作品の板が来る。
// 立体が読めない・描けない時は、部屋と字の静止画で同じ流れを見せる。
(() => {
const A = window.AWAI, body = document.body;
const ROOT = new URL(A.root, location.href);
const url = (p) => new URL(p + (A.preview && (p === '' || p.endsWith('/')) ? 'index.html' : ''), ROOT).href;
// pushState で URL が変わっても相対リンクがずれないよう、先に全部を絶対にしておく
document.querySelectorAll('link[href]').forEach((l) => { l.href = l.href; });
document.querySelectorAll('a[href]').forEach((a) => { if (!/^(https?:|mailto:|#)/.test(a.getAttribute('href'))) a.href = a.href; });

const cv = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = matchMedia('(max-aspect-ratio:4/5)').matches;
const WORKS = A.works;
const start = body.dataset.start;
// 予備の絵：字のない部屋（WORKS の背景）と、字が集まった TOP。どちらも letters.js の場面をそのまま撮ったもの
const CFG = phone
  ? { room: 'assets/media/letters-room-phone.webp', still: 'assets/media/letters-still-phone.webp' }
  : { room: 'assets/media/letters-room-pc.webp', still: 'assets/media/letters-still-pc.webp' };

// ---------- 作品の板 ----------
const panelsEl = document.getElementById('panels');
const panels = WORKS.map((w, i) => {
  const a = document.createElement('a');
  a.className = 'panel'; a.href = url(w.href); a.tabIndex = -1;
  a.setAttribute('aria-label', `${w.no} ${w.title}（${w.category}）の詳細を見る`);
  a.innerHTML = `<div class="face"><img data-src="${new URL(w.img, ROOT).href}" alt="" decoding="async"><span class="no">${w.no}</span></div>`;
  a.addEventListener('click', (e) => { e.preventDefault(); if (dragged || p < .98) return; openDetail(i); });
  a.addEventListener('focus', () => { if (p > .98 && i !== idx) setWork(i); });
  panelsEl.appendChild(a); return a;
});
// 表紙は入口を抜けてから読む（入口の間は部屋と動画だけに回線を使う）
const loadPanels = () => panels.forEach((a) => { const im = a.querySelector('img'); if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } });

// ---------- 立体の字 ----------
body.classList.add('exp-on');
// 部屋（字なし）の上に、字が集まった静止画を敷く。立体が描けるまで・描けない時はこの絵が見える
const sceneEl = document.getElementById('scene');
sceneEl.style.backgroundImage = `url(${new URL(CFG.room, ROOT).href})`;
const still = document.createElement('div'); still.className = 'still'; still.style.opacity = 0;
still.style.backgroundImage = `url(${new URL(CFG.still, ROOT).href})`;
sceneEl.insertBefore(still, cv);
let roomReady = false, stillReady = false, modReady = false, sceneReady = false, failed = false, live = false, stillShown = false, three = null;
const stillImg = new Image();
stillImg.onload = stillImg.onerror = () => { stillReady = true; progress(); loose(); };
stillImg.src = new URL(CFG.still, ROOT).href;
const roomImg = new Image();
roomImg.onload = roomImg.onerror = () => { roomReady = true; progress(); loose(); };
roomImg.src = new URL(CFG.room, ROOT).href;
// 立体が使えるようになった時：入口の後なら、字を飛ばして始める（静止画を先に見せていた時は、集まった姿のまま重ねる）
function show3d(fly) {
  if (live || !three) return;
  three.start(fly); live = true;
  // 字が集まるのを待たず、何をするサイトかと作品への入口を先に読めるようにする。
  if (intro < 1 && introT0 === Infinity) introT0 = performance.now() + (fly && !reduce ? 450 : 0);
}
function sceneUp() { if (!gated && sceneReady && !live) show3d(!stillShown && start === 'top' && target === 0); }
import(new URL('assets/js/letters.js', ROOT).href).then((m) => {
  modReady = true; progress();
  three = m.create({ canvas: cv, reduce, hint: document.getElementById('hint'), copyEl: document.getElementById('top') });
  return three.ready;
}).then(() => { sceneReady = true; progress(); sceneUp(); })
  .catch((err) => { console.error('letters', err); failed = true; three = null; loose(); useStill(); });
// 静止画で始める：立体が遅い・使えない時
function useStill() {
  if (live || stillShown) return;
  stillShown = true;
  if (intro < 1 && introT0 === Infinity) introT0 = performance.now() + 300;
}

// ---------- 入口 ----------
const gate = document.getElementById('gate');
let gated = false, intro = start === 'top' ? 0 : 1, introT0 = Infinity, late = false;
// 立体が遅い時は、部屋と静止画が出た時点で開ける。立体は届き次第、静止画の上に重なる
const loose = () => { if (gated && roomReady && stillReady && (late || failed)) ready(); };
let entered = false; try { entered = sessionStorage.getItem('awai-entered') === '1'; } catch (e) {}
function progress() {
  if (!gated) return;
  gate.querySelector('.g-bar i').style.width = Math.round(((roomReady ? .1 : 0) + (stillReady ? .1 : 0) + (modReady ? .4 : 0) + (sceneReady ? .4 : 0)) * 100) + '%';
  if (roomReady && sceneReady) ready();
}
function ready() {
  if (gate.classList.contains('is-ready')) return;
  const b = gate.querySelector('.g-start'); b.hidden = false;
  requestAnimationFrame(() => gate.classList.add('is-ready'));
  b.focus({ preventScroll: true });
}
// 入口の間は、後ろの見えないメニューや作品へ Tab で移れないようにする
const behind = [document.querySelector('.skip'), document.querySelector('.site-header'), document.querySelector('main')];
const setInert = (on) => behind.forEach((el) => { if (el) el.inert = on; });
function begin(e) {
  if (!gated || !gate.classList.contains('is-ready')) return;
  gated = false; try { sessionStorage.setItem('awai-entered', '1'); } catch (err) {}
  setInert(false); loadPanels();
  // 入口が消えていく間に字が飛び始める。立体がまだなら静止画で始め、届いたら重ねる
  if (sceneReady) setTimeout(() => show3d(true), 250); else useStill();
  // キーボードで入った時は、一文が出てから TOP の「制作を見る」へ選択を渡す
  if (e && e.type === 'keydown') setTimeout(() => document.querySelector('#top .cta').focus({ preventScroll: true }), 1200);
  gate.classList.add('is-out'); body.classList.remove('is-gated');
  setTimeout(() => { gate.hidden = true; }, 600);
}
if (start === 'top' && !entered) {
  gated = true; gate.hidden = false; body.classList.add('is-gated'); setInert(true);
  setTimeout(() => { late = true; loose(); }, 5000);
  gate.addEventListener('click', begin);
  addEventListener('keydown', (e) => { if (gated && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); begin(e); } });
} else {
  loadPanels();
  setTimeout(() => { if (!live) useStill(); }, 3500);
}

// ---------- 移り変わり ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const io = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const oc = (t) => 1 - Math.pow(1 - t, 3);
let p = start === 'works' ? 1 : 0, target = p, from = p, t0 = 0, dur = 1;
let idx = 0, shown = 0, lift = 0, leaving = false;

const navWorks = document.querySelector('[data-nav="works"]');
function setNav() {
  if (target === 1) navWorks.setAttribute('aria-current', 'page'); else navWorks.removeAttribute('aria-current');
  document.title = target === 1 ? 'WORKS — AWAI.' : 'AWAI. — 魅力は、もうある。まだ、伝わっていないだけ。';
  panels.forEach((el) => { el.tabIndex = target === 1 ? 0 : -1; });
}
const dur0 = (to) => reduce ? 450 : to > p ? 1300 : 1100;
function go(to, push = true) {
  if (to === target) return;
  from = p; target = to; t0 = performance.now();
  dur = dur0(to);
  setNav();
  if (push) {
    try { history.pushState({ awai: to }, '', to === 1 ? url('works/') + '#' + WORKS[idx].slug : url('')); } catch (e) {}
  }
}
document.querySelectorAll('[data-go="works"], [data-nav="works"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); go(1); }));
document.querySelector('[data-nav="top"]').addEventListener('click', (e) => { e.preventDefault(); go(0); });
// 「作品の一覧へ」：画面に見えている WORKS へ移り、落ち着いたら選んでいる作品の板へ選択を渡す
document.querySelector('.skip').addEventListener('click', (e) => {
  e.preventDefault(); const wait = target === 1 ? 0 : dur0(1) + 100; go(1);
  setTimeout(() => panels[idx].focus({ preventScroll: true }), wait);
});
addEventListener('popstate', () => {
  const works = /\/works\/(index\.html)?$/.test(location.pathname);
  const h = location.hash.slice(1); const j = WORKS.findIndex((w) => w.slug === h);
  if (j >= 0) setWork(j, false);
  go(works ? 1 : 0, false);
});

const wt = document.getElementById('works-text');
const $ = (id) => document.getElementById(id);
function setWork(i, record = true) {
  i = clamp(i, 0, WORKS.length - 1); if (i === idx && $('wname').dataset.set) return;
  idx = i; const w = WORKS[idx];
  const apply = () => {
    $('wno').textContent = w.no; $('cno').textContent = w.no;
    $('wname').innerHTML = `${w.title}<small>${w.sub}</small>`; $('wname').dataset.set = '1';
    $('wcat').textContent = `${w.category} — ${w.media}`;
    $('wlabel').textContent = w.label; $('wlabel').classList.toggle('real', w.label === '実案件');
    $('wroles').replaceChildren(...w.roles.split('・').flatMap((s, i) => (i ? ['・', document.createElement('wbr'), s] : [s])));
    $('wlink').href = url(w.href);
    wt.classList.remove('is-swapping');
  };
  if (p > .9 && !reduce) { wt.classList.add('is-swapping'); setTimeout(apply, 260); } else apply();
  $('cbar').style.width = ((idx + 1) / WORKS.length * 100) + '%';
  if (record && target === 1) { try { history.replaceState({ awai: 1 }, '', url('works/') + '#' + w.slug); } catch (e) {} }
}
['wname', 'wcat', 'wlabel', 'wroles'].forEach((id) => $(id).closest('h2,p,dl').classList.add('swap'));
{ const h = location.hash.slice(1); let j = WORKS.findIndex((w) => w.slug === h);
  if (j < 0) { try { j = WORKS.findIndex((w) => w.slug === sessionStorage.getItem('awai-work')); } catch (e) {} }
  setWork(Math.max(0, j), false); shown = idx; setNav(); }

function openDetail(i) {
  if (leaving) return;
  if (i !== idx) setWork(i);
  leaving = true; try { sessionStorage.setItem('awai-work', WORKS[i].slug); } catch (e) {}
  const href = url(WORKS[i].href);
  if (reduce) { location.href = href; return; }
  setTimeout(() => document.getElementById('veil').classList.add('is-on'), 320);
  setTimeout(() => { location.href = href; }, 1050);
}
$('wlink').addEventListener('click', (e) => { e.preventDefault(); openDetail(idx); });
addEventListener('pageshow', () => { leaving = false; lift = 0; document.getElementById('veil').classList.remove('is-on'); });

let lock = 0;
function step(dir, direct = false) {
  if (gated || leaving) return;
  const now = performance.now(); if (now < lock) return; lock = now + 650;
  if (target === 0) { if (dir > 0) go(1); return; }
  // 移動中の連続ホイールで何作も飛ばさず、ボタン・キー・スワイプはすぐ受け付ける。
  if (p < .98 && !direct) return;
  if (dir < 0 && idx === 0) { go(0); return; }
  document.body.classList.add('w-moved');
  setWork(idx + dir);
}
addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > 8) step(Math.sign(e.deltaY)); }, { passive: true });
document.querySelectorAll('#counter .step').forEach((b) => b.addEventListener('click', () => { lock = 0; step(+b.dataset.step, true); }));
addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input,textarea')) return;
  if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); step(1, true); }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1, true); }
});
// 指やマウスでの送り：縦のスワイプも横のドラッグも同じ「次・前」。
// TOP で字の上から始めた指は、字をなぞる・押す動きなので送らない
let sx = null, sy = null, dragged = false, onLetters = false;
addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; dragged = false; onLetters = live && target === 0 && three.hits(e.clientX, e.clientY); });
addEventListener('pointermove', (e) => { if (sx != null && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) dragged = true; });
addEventListener('pointerup', (e) => {
  if (sx == null) return;
  const dx = e.clientX - sx, dy = e.clientY - sy; sx = sy = null;
  if (onLetters) { onLetters = false; return; }
  if (e.pointerType === 'mouse' && Math.abs(dx) < 60) return;
  if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) step(Math.sign(-dy), true);
  else if (Math.abs(dx) > 60) step(Math.sign(-dx), true);
  setTimeout(() => { dragged = false; }, 0);
});

// カーソルで奥の絵がわずかに傾く（最大1度）
let mx = 0, my = 0, cx = 0, cy = 0;
if (!reduce) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

const topEl = $('top'), scrollEl = document.querySelector('.scroll-cue'), counter = $('counter');

function panelTransform(i, arrive) {
  const r = i - shown;
  let x, y, z, ry, op, br;
  if (phone) { x = r * 16; y = -r * 4.5; z = -r * 380; ry = -16; } else { x = r * 19; y = -r * .6; z = -r * 420; ry = -24; }
  op = clamp(1 - r * .16, 0, 1);
  br = 1 - .62 * ss(0, .6, Math.abs(r));
  // 送った板は、いまの位置から続けて左手前へ抜けていく（途中で跳ばない）
  if (r < 0) { const t = clamp(-r); x = -34 * t; y = 0; z = 360 * t; ry += (-4 - ry) * t; op = 1 - ss(.1, .85, t); }
  const a = oc(clamp((arrive - Math.max(0, r) * .09) / .62));
  z += -2600 * (1 - a); x += 6 * (1 - a); op *= a; br *= .35 + .65 * a;
  // 選んだ板だけ少し手前へ、ほかは薄く
  if (lift > 0) { if (i === idx) { z += 260 * lift; ry *= 1 - .6 * lift; br = 1 + .08 * lift; } else op *= 1 - lift; }
  return { z: Math.round(100 - r * 10), t: `translate3d(${x}vw,${y}vh,${z}px) rotateY(${ry}deg)`, op, br };
}

let sv = 0, lastNow = 0, shownGL = null, stillK = 0; const SK = 6.5;
function frame(now) {
  if (p !== target) { const k = clamp((now - t0) / dur); p = from + (target - from) * (target > from ? k : io(k)); if (k >= 1) p = target; }
  // 板の送り：ばねで追う（止まった所から静かに動き出し、静かに止まる。コマ落ちしても速さは同じ）
  const dt = Math.min(.05, (now - (lastNow || now)) / 1000); lastNow = now;
  if (reduce) shown = idx;
  else { sv += ((idx - shown) * SK * SK - 2 * SK * sv) * dt; shown += sv * dt; if (Math.abs(idx - shown) < .0005 && Math.abs(sv) < .002) { shown = idx; sv = 0; } }
  if (leaving) lift = Math.min(1, lift + .045);
  if (intro < 1 && now > introT0) intro = Math.min(1, (now - introT0) / 700);

  const mix = ss(0, .16, p), dim = 1 - .3 * ss(.35, 1, p);
  // 立体：字が奥へ帰り、部屋ごと少し沈む（letters.js）。描けない間は、黒い canvas を隠して静止画を見せる
  if (live) three.frame(now, p, dim);
  if (live !== shownGL) { shownGL = live; cv.style.opacity = live ? 1 : 0; }
  stillK += ((stillShown && !live ? 1 : 0) - stillK) * (live ? .05 : 1);
  still.style.opacity = stillK * (1 - mix);
  const f = live ? '' : dim < .999 ? `brightness(${dim})` : '';
  if (sceneEl.style.filter !== f) sceneEl.style.filter = f;

  cx += (mx - cx) * .05; cy += (my - cy) * .05;
  cv.style.transform = `rotateY(${cx * 2}deg) rotateX(${-cy * 2}deg)`;

  const tOut = ss(0, .2, p), iK = oc(intro);
  topEl.style.opacity = (1 - tOut) * iK;
  topEl.style.transform = `translateY(${-tOut * 18 + (1 - iK) * 14}px)`;
  topEl.style.visibility = p > .3 ? 'hidden' : 'visible';
  topEl.style.pointerEvents = p < .1 ? 'auto' : 'none';
  scrollEl.style.opacity = (1 - tOut) * iK;
  const wIn = ss(.74, 1, p) * (1 - lift);
  wt.style.opacity = wIn; counter.style.opacity = wIn;
  wt.style.visibility = counter.style.visibility = wIn > .01 ? 'visible' : 'hidden';
  wt.style.transform = (phone ? '' : 'translateY(-50%) ') + `translateY(${(1 - wIn) * 14}px)`;
  wt.style.pointerEvents = p > .9 ? 'auto' : 'none';
  panelsEl.style.pointerEvents = p > .98 && !leaving ? 'auto' : 'none';
  const arrive = clamp((p - .58) / .42);
  panels.forEach((el, i) => { const T = panelTransform(i, arrive); el.style.transform = T.t; el.style.opacity = T.op; el.style.filter = `brightness(${T.br})`; el.style.zIndex = T.z; el.style.visibility = T.op < .01 ? 'hidden' : 'visible'; });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__awai = { go, setWork, get p() { return p; }, get idx() { return idx; }, get live() { return live; }, get still() { return stillShown; }, get lowered() { return !!three && three.lowered; }, get three() { return three; } };
})();
