(() => {
  'use strict';

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const qa = window.__fizzQA = {
    runs: 0, running: false, reducedMotion: preference.matches, lastDurationMs: 0
  };
  let generation = 0;
  let animations = [];
  let stopBurst = () => {};
  let stage, canvas, bottle, splash;

  const ready = (async () => {
    if (document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }
    stage = document.querySelector('#stage');
    canvas = document.querySelector('#fizz-canvas');
    bottle = stage?.querySelector('.bottle-motion');
    splash = stage?.querySelector('.splash-motion');
    await Promise.all([
      document.fonts?.ready,
      ...Array.from(stage?.querySelectorAll('img') || [], img => {
        if (typeof img.decode === 'function') return img.decode().catch(() => {});
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      })
    ]);
    syncMotionStatus();
    document.querySelector('#replay')?.addEventListener('click', () => { void replay(); });
  })();

  function syncMotionStatus() {
    const status = document.querySelector('#motion-status');
    if (status) status.textContent = preference.matches
      ? '端末設定により、静止画で表示中'
      : '修正案｜すだち味の見た目と動き';
  }

  function clearCanvas() {
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function settle() {
    animations.forEach(animation => animation.cancel());
    animations = [];
    stopBurst();
    clearCanvas();
    // Parents carry motion only; the image's own steady transform stays untouched.
    for (const element of [bottle, splash]) {
      if (!element) continue;
      element.style.transform = 'none';
      element.style.opacity = '1';
    }
  }

  function burst() {
    const ctx = canvas?.getContext('2d');
    if (!ctx || !stage) return Promise.resolve();
    return new Promise(resolve => {
      let raf = 0, complete = false;
      const duration = 1400;
      const start = performance.now();
      let previous = start;
      let width = 0, height = 0;
      Object.assign(canvas.style, {
        position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none'
      });
      function size() {
        const rect = stage.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      size();
      const spread = Math.min(width, height);
      const particles = Array.from({ length: 48 }, (_, i) => {
        const angle = -Math.PI + Math.random() * Math.PI;
        const speed = spread * (0.18 + Math.random() * 0.34);
        return {
          x: width * 0.52 + (Math.random() - 0.5) * spread * 0.12,
          y: height * 0.57 + (Math.random() - 0.5) * spread * 0.09,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - spread * 0.06,
          radius: 0.5 + Math.random() * 4.5,
          alpha: 0.3 + Math.random() * 0.4,
          delay: i * 2.3,
          life: 750 + Math.random() * 530
        };
      });
      function finish() {
        if (complete) return;
        complete = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', size);
        clearCanvas();
        stopBurst = () => {};
        resolve();
      }
      stopBurst = finish;
      window.addEventListener('resize', size, { passive: true });
      function frame(now) {
        if (complete) return;
        const elapsed = now - start;
        const dt = Math.min((now - previous) / 1000, 0.04);
        previous = now;
        ctx.clearRect(0, 0, width, height);
        if (elapsed >= duration) return finish();
        for (const p of particles) {
          const age = elapsed - p.delay;
          if (age < 0 || age > p.life) continue;
          const damping = Math.exp(-1.6 * dt);
          p.vx *= damping;
          p.vy = p.vy * damping + spread * 0.17 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const fade = Math.min(age / 65, 1) * Math.pow(1 - age / p.life, 1.1);
          const r = p.radius * (0.85 + 0.15 * age / p.life);
          ctx.lineWidth = Math.max(0.55, r * 0.15);
          ctx.strokeStyle = `rgba(255,255,255,${p.alpha * fade})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.stroke();
          // A short bright reflection makes each bubble a transparent ring.
          ctx.lineWidth = Math.max(0.65, r * 0.23);
          ctx.strokeStyle = `rgba(255,255,255,${0.9 * fade})`;
          ctx.beginPath();
          ctx.arc(p.x - r * 0.08, p.y - r * 0.08, r * 0.72, -2.8, -1.6);
          ctx.stroke();
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    });
  }

  async function replay() {
    const id = ++generation;
    settle();
    qa.running = false;
    await ready;
    if (id !== generation) return;
    settle();
    qa.runs += 1;
    qa.reducedMotion = preference.matches;
    qa.lastDurationMs = 0;
    if (qa.reducedMotion || !stage) return;
    qa.running = true;
    const start = performance.now();
    const distance = Math.min(stage.getBoundingClientRect().height * 0.025, 18);
    if (bottle) animations.push(bottle.animate([
      { transform: 'translate3d(0,0,0) rotate(0deg)', offset: 0 },
      { transform: `translate3d(0,${distance * 0.35}px,0) rotate(-0.5deg)`, offset: 150 / 1550, easing: 'cubic-bezier(.2,.7,.25,1)' },
      { transform: `translate3d(0,${-distance}px,0) rotate(1deg)`, offset: 450 / 1550, easing: 'cubic-bezier(.3,0,.3,1)' },
      { transform: `translate3d(0,${distance * 0.12}px,0) rotate(-0.15deg)`, offset: 0.71, easing: 'cubic-bezier(.22,1,.36,1)' },
      { transform: 'translate3d(0,0,0) rotate(0deg)', offset: 1 }
    ], { duration: 1550, easing: 'cubic-bezier(.45,0,.25,1)' }));
    if (splash) animations.push(splash.animate([
      { opacity: 0, transform: 'scale(.75) rotate(-7deg)', offset: 0, easing: 'cubic-bezier(.15,.7,.25,1)' },
      { opacity: 1, transform: 'scale(1.03) rotate(1deg)', offset: 0.4, easing: 'cubic-bezier(.22,1,.36,1)' },
      { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: 1 }
    ], { duration: 1100, delay: 80, fill: 'backwards' }));
    const finished = animations.map(animation => animation.finished.catch(() => {}));
    await Promise.all([...finished, burst()]);
    if (id !== generation) return;
    qa.lastDurationMs = Math.round(performance.now() - start);
    qa.running = false;
    settle();
  }

  preference.addEventListener('change', () => {
    qa.reducedMotion = preference.matches;
    syncMotionStatus();
    if (preference.matches) {
      generation += 1;
      settle();
      qa.running = false;
      qa.lastDurationMs = 0;
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      generation += 1;
      settle();
      qa.running = false;
    }
  });
  window.replayFizz = replay;
  void replay();
})();
