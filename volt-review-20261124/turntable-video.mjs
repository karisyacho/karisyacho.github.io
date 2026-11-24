const wrap = value => ((value % 1) + 1) % 1;

const vertexSource = [
  'attribute vec2 point;',
  'uniform vec2 fit;',
  'varying vec2 surface;',
  'void main() {',
  '  surface = vec2(point.x * .5 + .5, .5 - point.y * .5);',
  '  gl_Position = vec4(point * fit, 0., 1.);',
  '}',
].join('\n');
const fragmentSource = [
  'precision mediump float;',
  'uniform sampler2D videoTexture;',
  'varying vec2 surface;',
  'void main() {',
  '  vec3 color = texture2D(videoTexture, vec2(surface.x, surface.y * .5)).rgb;',
  '  float mask = texture2D(videoTexture, vec2(surface.x, .5 + surface.y * .5)).g;',
  '  float alpha = clamp((mask - .006) * 1.006, 0., 1.);',
  '  gl_FragColor = vec4(color * alpha, alpha);',
  '}',
].join('\n');

function fitFrame(canvas, video) {
  const aspect = (video.videoWidth * 2) / video.videoHeight;
  const viewport = canvas.width / canvas.height;
  return [Math.min(1, aspect / viewport), Math.min(1, viewport / aspect)];
}

function renderer(canvas, video) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const plate = document.createElement('canvas');
    plate.width = video.videoWidth;
    plate.height = video.videoHeight;
    const buffer = plate.getContext('2d', { willReadFrequently: true });
    const height = plate.height / 2;
    return {
      draw() {
        buffer.drawImage(video, 0, 0);
        const { data } = buffer.getImageData(0, 0, plate.width, plate.height);
        const half = plate.width * height * 4;
        for (let i = 3; i < half; i += 4) data[i] = data[half + i - 2];
        buffer.putImageData(new ImageData(data.subarray(0, half), plate.width, height), 0, 0);
        const [sx, sy] = fitFrame(canvas, video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(plate, 0, 0, plate.width, height, (1 - sx) * canvas.width / 2,
          (1 - sy) * canvas.height / 2, canvas.width * sx, canvas.height * sy);
      },
      dispose() {},
    };
  }

  const program = gl.createProgram();
  for (const [kind, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
    const shader = gl.createShader(kind);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const point = gl.getAttribLocation(program, 'point');
  const fit = gl.getUniformLocation(program, 'fit');
  gl.enableVertexAttribArray(point);
  gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  for (const [parameter, value] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) {
    gl.texParameteri(gl.TEXTURE_2D, parameter, value);
  }
  gl.clearColor(0, 0, 0, 0);
  return {
    draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(fit, ...fitFrame(canvas, video));
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.deleteBuffer(quad);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    },
  };
}

function load(video, signal) {
  if (video.readyState >= 2) return Promise.resolve();
  if (video.error) return Promise.reject(new Error(video.error.message));
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => done(false, 'Timed out waiting for a decoded video frame.'), 14000);
    function done(ok, reason) {
      clearTimeout(timer);
      controller.abort();
      if (ok) resolve();
      else reject(new Error(reason || 'The turntable video did not load.'));
    }
    video.addEventListener('loadeddata', () => done(true), { signal: controller.signal, once: true });
    video.addEventListener('error', () => done(false, video.error?.message), { signal: controller.signal, once: true });
    signal.addEventListener('abort', () => done(false), { signal: controller.signal, once: true });
    if (signal.aborted) done(false);
  });
}

export async function mountTurntable(stage, signal) {
  const canvas = stage.querySelector('canvas');
  const video = stage.querySelector('video');
  await load(video, signal);
  if (signal.aborted) return;
  if (!(video.duration > 0 && video.videoHeight % 2 === 0)) throw new Error('Invalid turntable video.');
  const view = renderer(canvas, video);
  if (!view) throw new Error('The turntable canvas is unavailable.');
  const duration = video.duration;
  let desired = 0;
  let frame = 0;

  function paint() {
    if (video.readyState >= 2 && !video.seeking && canvas.width && canvas.height) {
      view.draw();
      stage.dataset.videoTime = String(video.currentTime);
    }
  }

  function seek() {
    const time = Math.min(desired * duration, duration - 1 / 48);
    if (video.seeking || Math.abs(video.currentTime - time) <= 1 / 72) return;
    video.currentTime = time;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);
    if (!width || !height) return;
    canvas.width = width;
    canvas.height = height;
    paint();
  }

  function playFrame() {
    frame = 0;
    if (video.paused || signal.aborted) return;
    if (Number(stage.dataset.videoTime) !== video.currentTime) paint();
    frame = requestAnimationFrame(playFrame);
  }

  video.addEventListener('playing', () => {
    if (!frame) frame = requestAnimationFrame(playFrame);
  }, { signal });
  video.addEventListener('seeked', () => {
    paint();
    if (video.paused) seek();
  }, { signal });
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    view.dispose();
  }, { once: true });

  return {
    turn(delta) {
      desired = wrap(desired + delta);
      seek();
    },
    setAutoplay(enabled) {
      if (enabled) {
        if (video.paused) video.play().catch(() => {});
        return;
      }
      if (video.paused) return;
      desired = wrap(video.currentTime / duration);
      video.pause();
      paint();
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
