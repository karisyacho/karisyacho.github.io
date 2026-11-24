const TAU = Math.PI * 2;
const root = 'assets/orbit-turn/';

export async function mountOrbitView(canvas, onAngle, signal) {
  const response = await fetch(root + 'manifest.json', { signal });
  if (!response.ok) return null;
  const { frames, fps } = await response.json();
  if (!Number.isInteger(frames) || frames < 8 || frames > 300 || !(fps > 0)) return null;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return null;
  const cache = new Map();
  const loaded = new Map();
  const maximumCached = innerWidth <= 600 ? 21 : 37;
  let progress = 0;
  let painted = -1;
  let wanted = 0;
  let frame = 0;
  let spinning = null;
  let disposed = false;
  const wrap = index => (index % frames + frames) % frames;

  function load(index, priority = 'auto') {
    const cached = cache.get(index);
    if (cached) return cached;
    const image = new Image();
    image.fetchPriority = priority;
    image.decoding = 'async';
    image.src = root + String(index).padStart(3, '0') + '.webp';
    const pending = image.decode().then(() => {
      if (disposed || signal.aborted) return null;
      loaded.set(index, image);
      if (cache.size > maximumCached) {
        for (const key of loaded.keys()) {
          if (key === painted || key === wanted || key === index) continue;
          loaded.delete(key);
          cache.delete(key);
          break;
        }
      }
      return image;
    }).catch(() => {
      cache.delete(index);
      return null;
    });
    cache.set(index, pending);
    return pending;
  }

  if (!await load(0, 'high') || signal.aborted) return null;

  function draw(index) {
    const image = loaded.get(index);
    if (!image || !canvas.width || !canvas.height) return;
    const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    painted = index;
  }

  function request(angle, warm) {
    const index = wrap(Math.round(angle * frames / TAU));
    wanted = index;
    onAngle((Math.round(angle * 360 / TAU) % 360 + 360) % 360);
    if (loaded.has(index)) {
      if (painted !== index) draw(index);
    } else {
      load(index, 'high').then(image => {
        if (image && wanted === index) draw(index);
      });
    }
    if (!warm) return;
    for (const offset of [-2, -1, 1, 2, 4]) load(wrap(index + offset), 'low');
  }

  function resize() {
    if (!canvas.clientWidth || !canvas.clientHeight) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    draw(loaded.has(wanted) ? wanted : painted);
  }

  function drawSpin(time) {
    frame = 0;
    if (!spinning || disposed) return;
    const fraction = Math.min(1, (time - spinning.at) / (frames * 1000 / fps));
    progress = (spinning.start + fraction * TAU) % TAU;
    request(progress, true);
    if (fraction < 1) frame = requestAnimationFrame(drawSpin);
    else spinning = null;
  }

  function stop() {
    spinning = null;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  draw(0);
  request(0, false);
  for (let i = 1; i <= 7; i += 1) load(wrap(Math.round(i * frames / 8)), 'low');

  return {
    turn(dx) {
      stop();
      progress = (progress + dx) % TAU;
      request(progress, true);
    },
    reset() {
      stop();
      progress = 0;
      request(0, false);
    },
    spin() {
      if (spinning) return;
      spinning = { at: performance.now(), start: progress };
      frame = requestAnimationFrame(drawSpin);
    },
    stop,
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      cache.clear();
      loaded.clear();
    },
  };
}
