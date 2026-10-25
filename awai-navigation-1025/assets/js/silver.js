// DETAIL・ABOUT の小さな仕掛け：作品の板の傾き（カーソルで微か・ドラッグで左右18度まで）、PC／SP切替、制作意図のタブ、設計を見る、表示のフェード
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 板の傾き。読んでいる間（カーソルが離れている間）は正面へ戻って止まる
  const stage = document.querySelector('[data-tilt]');
  const dev = stage && stage.querySelector('.device');
  // 床の地平を板の足もとに合わせる（PC／SP切替で板の高さが変わる間も追う）
  if (dev) new ResizeObserver(() => stage.style.setProperty('--floor', `${dev.offsetTop + dev.offsetHeight}px`)).observe(dev);
  if (dev && !reduce) {
    let tx = 0, ty = 0, x = 0, y = 0, drag = null, raf = 0;
    // 止まっているときの向き（PCは少し斜め）。CSS の --yaw から読む
    const yaw = () => parseFloat(getComputedStyle(dev).getPropertyValue('--yaw')) || 0;
    const tick = () => {
      x += (tx - x) * .1; y += (ty - y) * .1;
      dev.style.transform = `rotateY(${(yaw() + x).toFixed(2)}deg) rotateX(${y.toFixed(2)}deg)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > .02 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      if (drag) { tx = Math.max(-18, Math.min(18, drag.base + (e.clientX - drag.x) / r.width * 60)); }
      else if (e.pointerType === 'mouse') { tx = ((e.clientX - r.left) / r.width - .5) * 5; ty = -((e.clientY - r.top) / r.height - .5) * 4; }
      kick();
    });
    stage.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; drag = { x: e.clientX, base: tx }; stage.setPointerCapture?.(e.pointerId); });
    const release = () => { drag = null; tx = 0; ty = 0; kick(); };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('pointerleave', () => { if (!drag) release(); });
  }

  // PC／SP切替
  document.querySelectorAll('.switch button').forEach((b, _, all) => b.addEventListener('click', () => {
    all.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    dev.dataset.mode = b.dataset.mode;
    dev.dispatchEvent(new Event('modechange'));
  }));

  // 広告動画は、押したときだけ再生（勝手に動かさない）
  const v = document.querySelector('.device video'), pb = document.querySelector('.play');
  if (v && pb) pb.addEventListener('click', () => {
    if (v.paused) { v.play(); pb.textContent = '止める'; pb.setAttribute('aria-pressed', 'true'); }
    else { v.pause(); pb.textContent = '再生する'; pb.setAttribute('aria-pressed', 'false'); }
  });

  // 触った映像：画面に入ったら音なしで繰り返す。止めるボタンを常に置く（動きを減らす設定では最初から止めておく）
  const fv = document.querySelector('.device video.pc'), fb = document.querySelector('.f-play');
  if (fv && fb) {
    let stopped = reduce;
    const set = (play) => { fb.textContent = play ? '止める' : '再生する'; };
    set(!stopped);
    fb.addEventListener('click', () => { stopped = !stopped; if (stopped) fv.pause(); else fv.play().catch(() => {}); set(!stopped); });
    // スマホ表示に切り替えている間は、見えない映像を止めておく
    let seen = false;
    const sync = () => { if (seen && !stopped && dev.dataset.mode !== 'sp') { fv.preload = 'auto'; fv.play().catch(() => {}); } else fv.pause(); };
    dev.addEventListener('modechange', sync);
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => { seen = e.isIntersecting; sync(); }), { threshold: 0.25 }).observe(fv);
  }

  // タブ（左右キーでも移れる）
  const tabs = [...document.querySelectorAll('.tablist [role="tab"]')];
  const select = (t) => {
    tabs.forEach((o) => { const on = o === t; o.setAttribute('aria-selected', String(on)); o.tabIndex = on ? 0 : -1; document.getElementById(o.getAttribute('aria-controls')).hidden = !on; });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); }
    });
  });

  // 設計を見る：板に触れると層に分かれる。一覧で層を選ぶと、その層だけが濃く残る
  const bs = document.querySelector('.b-stage');
  if (bs) {
    const stack = bs.querySelector('.b-stack');
    const items = [...document.querySelectorAll('.layers li')];
    const sheets = [...bs.querySelectorAll('.sheet')];
    const pick = (k) => {
      bs.classList.add('is-open'); bs.dataset.on = k; stack.setAttribute('aria-pressed', 'true');
      items.forEach((li) => { const on = li.dataset.k === k; li.classList.toggle('is-on', on); li.querySelector('button').setAttribute('aria-selected', String(on)); });
      sheets.forEach((el) => el.classList.toggle('is-on', el.dataset.k === k));
    };
    const close = () => {
      bs.classList.remove('is-open'); delete bs.dataset.on; stack.setAttribute('aria-pressed', 'false');
      items.forEach((li) => { li.classList.remove('is-on'); li.querySelector('button').setAttribute('aria-selected', 'false'); });
      sheets.forEach((el) => el.classList.remove('is-on'));
    };
    const toggle = () => (bs.classList.contains('is-open') ? close() : pick(items[0].dataset.k));
    stack.addEventListener('click', toggle);
    stack.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    items.forEach((li) => li.querySelector('button').addEventListener('click', () => pick(li.dataset.k)));
  }

  // ABOUT の板：問いかけが1つずつ届く。見えたときに1回だけ流し、最後は相手の「…」が点滅し続ける
  const log = document.querySelector('.t-log');
  if (log && !reduce && 'IntersectionObserver' in window) {
    const lis = [...log.children];
    const last = lis[lis.length - 1];
    let n = 0;
    // まだ届いていない吹き出しの高さ（間の空きを含む）だけ、届いた分を下げておく。位置は top でずらしているので、その分を引いた元の位置で測る
    const at = (li) => li.offsetTop - (parseFloat(getComputedStyle(li).top) || 0);
    const lift = () => {
      const cur = lis[n - 1];
      const y = cur ? at(last) + last.offsetHeight - (at(cur) + cur.offsetHeight) : at(last) + last.offsetHeight - at(lis[0]);
      log.style.setProperty('--y', y + 'px');
    };
    lift();
    addEventListener('resize', lift);
    const gaps = [600, 1000, 1100, 1100, 1400];
    const next = () => {
      if (n >= lis.length) return;
      lis[n].classList.add('on');
      n++;
      lift();
      if (n < lis.length) setTimeout(next, gaps[n]);
    };
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      log.offsetWidth;
      log.classList.add('is-run');
      setTimeout(next, gaps[0]);
    }, { threshold: 0.6 });
    io.observe(log);
  } else if (log) log.querySelectorAll('li').forEach((li) => li.classList.add('on'));

  // ABOUT の DESIGN の例：見えたら1回だけ墨色の場面へ塗り替わる。板に触ると行き来できる
  const eg = document.querySelector('.eg-board');
  if (eg) {
    const set = (on) => {
      eg.classList.toggle('is-ink', on);
      eg.setAttribute('aria-pressed', String(on));
      eg.setAttribute('aria-label', on ? '珈琲豆店の見本を、今週の豆の場面に戻す' : '珈琲豆店の見本を、焙煎日の場面に切り替える');
    };
    eg.addEventListener('click', () => set(!eg.classList.contains('is-ink')));
    if (!reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        setTimeout(() => set(true), 1200);
      }, { threshold: 0.6 });
      io.observe(eg);
    }
  }

  // ABOUT の FLOW：見えたら1回だけ 01→05 とやりとりが進み、05 で止まる。段に触るとその段まで
  const fl = document.querySelector('.fl-log');
  if (fl) {
    const lis = [...fl.children];
    const last = lis[lis.length - 1];
    const rows = [...document.querySelectorAll('.fl-steps li')];
    const move = !reduce && 'IntersectionObserver' in window;
    let n = 0, timer = 0;
    // ABOUT の板と同じ測り方（top でずらした分を引いた元の位置で測る）
    const at = (li) => li.offsetTop - (parseFloat(getComputedStyle(li).top) || 0);
    const lift = () => {
      const cur = lis[n - 1];
      const y = cur ? at(last) + last.offsetHeight - (at(cur) + cur.offsetHeight) : at(last) + last.offsetHeight - at(lis[0]);
      fl.style.setProperty('--y', y + 'px');
    };
    const mark = (s) => rows.forEach((li, i) => {
      li.classList.toggle('is-at', i + 1 === s);
      li.querySelector('button').setAttribute('aria-pressed', String(i + 1 === s));
    });
    // 吹き出しを k 個目まで届いた形にする
    const show = (k) => {
      n = k;
      lis.forEach((li, i) => li.classList.toggle('on', i < k));
      lift();
      mark(k ? +lis[k - 1].dataset.s : 0);
    };
    rows.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
      if (!move) { fl.dataset.at = i + 1; mark(i + 1); return; }
      clearTimeout(timer);
      fl.classList.add('is-run');
      show(lis.filter((m) => +m.dataset.s <= i + 1).length);
    }));
    if (move) {
      fl.removeAttribute('data-at');
      show(0);
      addEventListener('resize', lift);
      fl.querySelectorAll('img').forEach((img) => img.addEventListener('load', lift));
      // 案の画像が届いたあとは、見る間を長めにとる
      const next = () => {
        show(n + 1);
        if (n < lis.length) timer = setTimeout(next, lis[n - 1].classList.contains('card') ? 2000 : 1300);
      };
      const io = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        if (n) return; // 先に段へ触っていたら流さない
        fl.offsetWidth;
        fl.classList.add('is-run');
        timer = setTimeout(next, 700);
      }, { threshold: 0.6 });
      io.observe(fl);
    }
  }

  // 見えたら静かに現れる（文字は最初から読める位置にある。止める設定では何もしない）
  if (!reduce && 'IntersectionObserver' in window) {
    const els = document.querySelectorAll('.d-col,.d-tabs,.d-build,.d-cuts,.scene,.a-step,.a-studio,.fl-head,.fl-copy');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('reveal'); io.observe(el); } });
  }
})();
