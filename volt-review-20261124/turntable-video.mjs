const wrap = value => ((value % 1) + 1) % 1;
const framesPerSecond = 24;

const vertexSource = [
  'attribute vec2 point;',
  'varying vec2 surface;',
  'void main() {',
  '  surface = vec2(point.x * .5 + .5, .5 - point.y * .5);',
  '  gl_Position = vec4(point, 0., 1.);',
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

function renderer(stage, video) {
  const canvas = stage.querySelector('canvas');
  const gpuCanvas = canvas.cloneNode(false);
  const gl = gpuCanvas.getContext('webgl', {
    alpha: true, antialias: false, premultipliedAlpha: true, failIfMajorPerformanceCaveat: true,
  });
  const debug = gl?.getExtension('WEBGL_debug_renderer_info');
  const gpu = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : '';
  if (!gl || /swiftshader|llvmpipe|software|basic render driver|\bwarp\b/i.test(gpu)) {
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const plate = document.createElement('canvas');
    const buffer = plate.getContext('2d', { willReadFrequently: true });
    return {
      canvas,
      draw() {
        const { width, height } = canvas;
        if (plate.width !== width || plate.height !== height * 2) {
          plate.width = width;
          plate.height = height * 2;
        }
        buffer.drawImage(video, 0, 0, width, height * 2);
        const { data } = buffer.getImageData(0, 0, width, height * 2);
        const half = width * height * 4;
        for (let i = 3; i < half; i += 4) data[i] = data[half + i - 2];
        ctx.putImageData(new ImageData(data.subarray(0, half), width, height), 0, 0);
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
  gl.enableVertexAttribArray(point);
  gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  for (const [parameter, value] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) {
    gl.texParameteri(gl.TEXTURE_2D, parameter, value);
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, video.videoWidth, video.videoHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  canvas.replaceWith(gpuCanvas);
  return {
    canvas: gpuCanvas,
    resize() {
      gl.viewport(0, 0, gpuCanvas.width, gpuCanvas.height);
    },
    draw() {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
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
  const video = stage.querySelector('video');
  await load(video, signal);
  if (signal.aborted) return;
  if (!(video.duration > 0 && video.videoHeight % 2 === 0)) throw new Error('Invalid turntable video.');
  const view = renderer(stage, video);
  if (!view) throw new Error('The turntable canvas is unavailable.');
  const { canvas } = view;
  const duration = video.duration;
  const frameCount = Math.round(duration * framesPerSecond);
  const aspect = video.videoWidth * 2 / video.videoHeight;
  const decodedCallbacks = typeof video.requestVideoFrameCallback === 'function';
  const requestFrame = decodedCallbacks ? video.requestVideoFrameCallback.bind(video) : requestAnimationFrame;
  const cancelFrame = decodedCallbacks ? video.cancelVideoFrameCallback.bind(video) : cancelAnimationFrame;
  let desired = 0;
  let frame = 0;
  let lastPaint = -1;

  function paint(time = video.currentTime) {
    if (video.readyState >= 2 && !video.seeking && canvas.width && canvas.height) {
      view.draw();
      lastPaint = time;
      stage.dataset.videoTime = String(time);
    }
  }

  function seek() {
    const target = Math.min(frameCount - 1, Math.floor(desired * frameCount));
    if (video.seeking || target === Math.floor(video.currentTime * framesPerSecond + .01)) return;
    video.currentTime = (target + .5) / framesPerSecond;
  }

  function resize() {
    const displayWidth = Math.min(stage.clientWidth, stage.clientHeight * aspect);
    if (!displayWidth) return;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayWidth / aspect}px`;
    const width = Math.min(video.videoWidth, Math.round(displayWidth * Math.min(devicePixelRatio || 1, 1.5)));
    const height = Math.round(width / aspect);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    view.resize?.();
    paint();
  }

  function playFrame(_, metadata) {
    frame = 0;
    if (video.paused || signal.aborted) return;
    const time = metadata?.mediaTime ?? Math.floor(video.currentTime * framesPerSecond) / framesPerSecond;
    if (lastPaint !== time) paint(time);
    frame = requestFrame(playFrame);
  }

  video.addEventListener('playing', () => {
    if (!frame) frame = requestFrame(playFrame);
  }, { signal });
  video.addEventListener('seeked', () => {
    if (video.paused) {
      paint();
      seek();
    }
  }, { signal });
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  signal.addEventListener('abort', () => {
    if (frame) cancelFrame(frame);
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
      if (frame) cancelFrame(frame);
      frame = 0;
    },
  };
}
