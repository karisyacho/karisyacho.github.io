/* A single film, with deliberate stops. No playback starts without a fresh input. */
(() => {
  'use strict';
  function validateTimeline(data) {
    if (!data || !Number.isFinite(data.duration) || data.duration <= 0 || !Array.isArray(data.chapters) || data.chapters.length !== 7) throw new Error('場面の情報を読み込めませんでした。');
    let previousEnd = 0;
    const chapters = data.chapters.map((chapter, index) => {
      const { start, end, hold } = chapter;
      if (![start, end, hold].every(Number.isFinite) || start < 0 || end <= start || hold < start || hold >= end || end > data.duration + 0.05 || start < previousEnd - 0.05 || (index === 0 && start !== 0)) throw new Error('場面の時間を確認できませんでした。');
      previousEnd = end;
      return { ...chapter, poster: typeof chapter.poster === 'string' && /^[\w.-]+\.jpg$/.test(chapter.poster) ? chapter.poster : ['w0.jpg', 'w1-poster.jpg', 'w2-poster.jpg', 'w3-poster.jpg', 'w4-poster.jpg', 'w5b-poster.jpg', 's6c-poster.jpg'][index] };
    });
    return chapters;
  }
  function isUpwardFlick(start, end) { return start.y - end.y >= 40 && start.y - end.y > Math.abs(start.x - end.x); }
  function hasReachedHold(time, chapter) { return time >= chapter.hold; }
  const gestureProgress = (delta) => Math.max(0, Math.min(1, delta / 100));
  const gestureTime = (chapter, delta) => Math.min(chapter.hold - .01, chapter.start + (12 + (32 - 12) * gestureProgress(delta)) / 24);
  const releaseRate = (distance, milliseconds) => Math.max(.85, Math.min(1.2, .85 + Math.max(0, distance) / Math.max(1, milliseconds) * .35));
  globalThis.AWAIExperienceLogic = { validateTimeline, isUpwardFlick, hasReachedHold, gestureProgress, gestureTime, releaseRate };
  if (typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const video = $('film'), still = $('still'), stage = $('stage');
  const frameContact = $('frame-contact'), filmOverlay = $('film-overlay');
  // Read-only browser inspection transports DOM attributes reliably; media
  // element properties may be represented by defaults in its isolated scope.
  const recordMediaState = () => {
    video.dataset.mediaTime = String(video.currentTime);
    video.dataset.mediaPaused = String(video.paused);
    video.dataset.mediaReady = String(video.readyState);
  };
  for (const event of ['timeupdate','seeked','pause','playing']) video.addEventListener(event,recordMediaState);
  const advance = $('advance'), previous = $('previous'), play = $('play'), status = $('status'), retry = $('retry');
  const chapterButtons = [...document.querySelectorAll('[data-chapter]')];
  const copies = [...document.querySelectorAll('[data-copy]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const staticPreferred = () => motion.matches || Boolean(connection?.saveData);
  let chapters = [], current = 0, started = false, reachedHold = false, pending = false, frame = 0, request = 0, mediaFailed = false;
  let visible = true, drag = null, scrubFrame = 0, queuedSeek = null, mediaLoading = null;
  const announce = (message) => { status.textContent = message; };
  function updateControls() {
    const ready = chapters.length === 7;
    previous.disabled = !ready || current === 0;
    advance.disabled = !ready || pending || (current === 6 && reachedHold);
    play.disabled = !ready;
    chapterButtons.forEach((button, index) => {
      button.disabled = !ready;
      if (index === current) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    const selected = chapterButtons[current], nav = selected?.parentElement;
    if (nav?.scrollTo && nav.scrollWidth > nav.clientWidth) {
      const target = nav.scrollLeft + selected.getBoundingClientRect().left - nav.getBoundingClientRect().left - (nav.clientWidth - selected.clientWidth) / 2;
      nav.scrollTo({ left: Math.max(0, target), behavior: 'instant' });
    }
    advance.textContent = !started ? 'ENTER — 体験をはじめる' : current === 3 && !reachedHold ? '弾いてみる' : current === 6 ? (reachedHold ? '体験の終わり' : '最後の映像を見る') : '次へ';
    play.textContent = pending ? '読み込みを中止' : video.paused ? reachedHold ? 'この場面をもう一度見る' : '映像を再生' : '映像を止める';
  }
  function pause(message) {
    request += 1; pending = false; video.pause(); cancelAnimationFrame(frame);
    cancelAnimationFrame(scrubFrame); scrubFrame = 0; queuedSeek = null; drag = null;
    stage.dataset.dragging = 'false'; video.playbackRate = 1;
    if (message) announce(message);
    updateControls();
  }
  function showEnding(ending) {
    frameContact.hidden = !ending; stage.dataset.ending = String(ending);
  }
  function showPoster() { video.hidden = true; still.hidden = false; showEnding(current === 6); }
  function select(index) {
    pause(); current = index; reachedHold = false;
    stage.dataset.entry = String(index === 0);
    const chapter = chapters[index];
    still.src = chapter.poster;
    still.alt = `${String(index).padStart(2, '0')} ${chapter.title || '場面'}の静止画`;
    video.poster = chapter.poster;
    showPoster();
    copies.forEach((copy, i) => { copy.hidden = i !== current; });
    document.querySelector('.gesture-hint').hidden = current !== 3;
    announce(current === 3 ? '上へ引いて離すと、ページが弾かれます。ボタンでも進めます。' : staticPreferred() ? '静止画で表示しています。映像は再生ボタンから選べます。' : '映像は操作するまで止まっています。');
    updateControls();
  }
  function finishChapter() {
    const chapter = chapters[current];
    if (!chapter || reachedHold) return;
    // Mark the stop before pausing/seeking: either can dispatch media events.
    reachedHold = true;
    pause();
    video.currentTime = chapter.hold;
    announce(current === 6 ? '体験はここまでです。下の相談へ進めます。' : 'この場面の終わりです。次へ進めます。');
    showEnding(current === 6);
    updateControls();
  }
  function monitor() {
    if (video.paused) return;
    if (hasReachedHold(video.currentTime, chapters[current])) { finishChapter(); return; }
    frame = requestAnimationFrame(monitor);
  }
  function ensureMedia() {
    if (mediaLoading) return mediaLoading;
    if (video.getAttribute('src') && !mediaFailed && video.readyState >= 1) return Promise.resolve();
    mediaLoading = new Promise((resolve, reject) => {
      let timer;
      const cleanup = () => { clearTimeout(timer); video.removeEventListener('loadedmetadata', done); video.removeEventListener('error', error); };
      const done = () => { cleanup(); resolve(); };
      const error = () => { cleanup(); reject(new Error('映像を読み込めませんでした。')); };
      video.addEventListener('loadedmetadata', done, { once: true });
      video.addEventListener('error', error, { once: true });
      timer = setTimeout(() => { cleanup(); reject(new Error('映像の読み込みに時間がかかっています。')); }, 15000);
      if (!video.getAttribute('src') || mediaFailed) { video.src = 'flow-complete.mp4'; mediaFailed = false; video.load(); }
    }).finally(() => { mediaLoading = null; });
    return mediaLoading;
  }
  async function playChapter({ release = current === 3 && !reachedHold, rate = 1 } = {}) {
    if (!chapters.length || pending || !visible || document.hidden) return;
    const token = ++request;
    showEnding(false);
    pending = true; updateControls();
    announce('映像を読み込んでいます。');
    let timer;
    try {
      const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('映像の読み込みに時間がかかっています。')), 15000); });
      const start = async () => {
        await ensureMedia();
        if (token !== request) return;
        const chapter = chapters[current];
        if (release) video.currentTime = gestureTime(chapter, 100);
        else if (reachedHold || video.currentTime < chapter.start || video.currentTime >= chapter.hold || video.hidden) video.currentTime = chapter.start;
        video.playbackRate = rate;
        reachedHold = false;
        await video.play();
      };
      await Promise.race([start(), deadline]);
      // A stale play promise must not pause a newer chapter's playback.
      if (token !== request) return;
      video.hidden = false; still.hidden = true; retry.hidden = true;
      announce('映像を再生しています。場面の終わりで止まります。');
      monitor();
    } catch (error) {
      if (token !== request) return;
      request += 1; video.pause(); mediaFailed = true; showPoster(); retry.hidden = false;
      announce(`${error.message || '映像を再生できませんでした。'} 静止画と文章で引き続きご覧いただけます。`);
    } finally {
      clearTimeout(timer);
      if (token === request || mediaFailed) { pending = false; updateControls(); }
    }
  }
  async function loadTimeline() {
    pause(); chapters = []; retry.hidden = true; updateControls();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('timeline.json', { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('場面の情報を読み込めませんでした。');
      chapters = validateTimeline(await response.json());
      document.documentElement.classList.add('enhanced'); select(0);
    } catch {
      document.documentElement.classList.remove('enhanced');
      showPoster(); copies.forEach((copy) => { copy.hidden = false; });
      announce('場面の情報を読み込めませんでした。下の文章と相談先はそのまま読めます。'); retry.hidden = false;
    } finally { clearTimeout(timer); updateControls(); }
  }
  $('controls').hidden = false;
  advance.addEventListener('click', () => {
    if (!started) { started = true; updateControls(); if (!staticPreferred()) playChapter(); else announce('静止画で体験を始めました。次へ進めます。'); return; }
    if (current === 3 && !reachedHold) {
      if (staticPreferred()) { reachedHold = true; announce('静止画で表示しています。映像は再生ボタンから選べます。'); updateControls(); } else playChapter();
      return;
    }
    if (current < 6) { select(current + 1); if (!staticPreferred() && current !== 3) playChapter(); }
    else if (!staticPreferred()) playChapter();
    else { reachedHold = true; updateControls(); announce('体験はここまでです。下の相談へ進めます。'); }
  });
  previous.addEventListener('click', () => { started = true; select(Math.max(0, current - 1)); });
  chapterButtons.forEach((button, index) => button.addEventListener('click', () => { started = true; select(index); }));
  play.addEventListener('click', () => { started = true; if (!video.paused || pending) pause('映像を止めました。'); else playChapter(); });
  retry.addEventListener('click', () => chapters.length ? playChapter() : loadTimeline());
  video.addEventListener('timeupdate', () => { if (!video.paused && chapters.length && hasReachedHold(video.currentTime, chapters[current])) finishChapter(); });
  video.addEventListener('ended', finishChapter);
  video.addEventListener('pause', () => { cancelAnimationFrame(frame); updateControls(); });
  video.addEventListener('error', () => { if (!chapters.length) return; pause(); mediaFailed = true; showPoster(); retry.hidden = false; announce('映像を読み込めませんでした。静止画と文章でご覧いただけます。'); });
  function flushScrub() {
    scrubFrame = 0;
    if (!drag || current !== 3 || !visible || document.hidden || staticPreferred()) { queuedSeek = null; return; }
    if (queuedSeek !== null && video.readyState >= 1 && !video.seeking) {
      const target = queuedSeek; queuedSeek = null;
      video.currentTime = target; video.hidden = false; still.hidden = true;
    }
    if (queuedSeek !== null) scrubFrame = requestAnimationFrame(flushScrub);
  }
  function queueScrub(delta) {
    queuedSeek = gestureTime(chapters[3], delta);
    if (!scrubFrame) scrubFrame = requestAnimationFrame(flushScrub);
  }
  function beginDrag(x, y, id, kind) {
    if (current !== 3 || reachedHold || pending || !visible || document.hidden || staticPreferred()) return;
    pause();
    const rect = stage.getBoundingClientRect();
    drag = { x, y, id, kind, time: performance.now(), lastY: y, lastTime: performance.now(), speed: 0 };
    stage.style.setProperty('--drag-x', `${x - rect.left}px`);
    stage.style.setProperty('--drag-y', `${y - rect.top}px`);
    stage.dataset.dragging = 'true';
    const token = request;
    ensureMedia().then(() => { if (drag && token === request) queueScrub(drag.y - drag.lastY); }).catch(() => {
      if (token !== request) return;
      pause(); showPoster(); mediaFailed = true; retry.hidden = false;
      announce('映像を読み込めませんでした。静止画でご覧いただけます。');
    });
  }
  function moveDrag(x, y) {
    if (!drag) return;
    const now = performance.now(), rect = stage.getBoundingClientRect();
    const elapsed = now - drag.lastTime;
    if (elapsed > 0 && drag.lastY !== y) {
      drag.speed = Math.max(0, (drag.lastY - y) / elapsed);
      drag.lastTime = now;
    }
    drag.lastY = y;
    stage.style.setProperty('--drag-x', `${x - rect.left}px`);
    stage.style.setProperty('--drag-y', `${y - rect.top}px`);
    if (video.readyState >= 1) queueScrub(drag.y - y);
  }
  function endDrag(x, y) {
    if (!drag) return;
    const gesture = drag;
    moveDrag(x, y);
    const upward = isUpwardFlick(gesture, { x, y });
    const speed = performance.now() - gesture.lastTime > 120 ? 0 : gesture.speed;
    pause();
    if (upward && visible && !staticPreferred()) {
      started = true; playChapter({ release: true, rate: releaseRate(speed, 1) });
    } else { showPoster(); announce('上へ引いて離すと、ページが弾かれます。ボタンでも進めます。'); }
  }
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.isPrimary && event.button === 0) beginDrag(event.clientX, event.clientY, event.pointerId, 'pointer');
  });
  window.addEventListener('pointermove', (event) => { if (drag?.kind === 'pointer' && drag.id === event.pointerId) moveDrag(event.clientX, event.clientY); });
  window.addEventListener('pointerup', (event) => { if (drag?.kind === 'pointer' && drag.id === event.pointerId) endDrag(event.clientX, event.clientY); });
  window.addEventListener('pointercancel', (event) => { if (drag?.kind === 'pointer' && drag.id === event.pointerId) { pause(); showPoster(); } });
  // Touch owns touch gestures; pointer cancellation during natural scrolling
  // never cancels this passive touch stream or produces a second release.
  stage.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1) { if (drag) { pause(); showPoster(); } return; }
    const touch = event.touches[0]; beginDrag(touch.clientX, touch.clientY, touch.identifier, 'touch');
  }, { passive: true });
  window.addEventListener('touchmove', (event) => {
    if (drag?.kind !== 'touch') return;
    const touch = [...event.touches].find((item) => item.identifier === drag.id);
    if (touch) moveDrag(touch.clientX, touch.clientY);
  }, { passive: true });
  window.addEventListener('touchend', (event) => {
    if (drag?.kind !== 'touch') return;
    const touch = [...event.changedTouches].find((item) => item.identifier === drag.id);
    if (touch) endDrag(touch.clientX, touch.clientY);
  }, { passive: true });
  window.addEventListener('touchcancel', () => { if (drag?.kind === 'touch') { pause(); showPoster(); } }, { passive: true });
  // Native buttons provide Enter/Space input without capturing page scrolling.
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause('映像を止めました。再生ボタンで続けられます。'); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) pause('映像を止めました。再生ボタンで続けられます。'); }, { threshold: 0.1 }).observe(stage);
  motion.addEventListener('change', () => { if (staticPreferred()) { pause('静止画で表示しています。映像は再生ボタンから選べます。'); showPoster(); } });
  connection?.addEventListener?.('change', () => { if (staticPreferred()) { pause('静止画で表示しています。映像は再生ボタンから選べます。'); showPoster(); } });
  function fitOverlay() {
    // Align the native link with the uncropped 16:10 picture, including letterboxing.
    const width = Math.min(stage.clientWidth, stage.clientHeight * 1.6);
    filmOverlay.style.width = `${width}px`;
    filmOverlay.style.height = `${width / 1.6}px`;
  }
  if ('ResizeObserver' in window) new ResizeObserver(fitOverlay).observe(stage);
  else window.addEventListener('resize', fitOverlay);
  fitOverlay();
  loadTimeline();
})();
