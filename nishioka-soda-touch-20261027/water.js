// A finite, local water refraction renderer. Origins use top-left normalized coordinates.
export async function createWaterScene({ canvas, image, onUnavailable = () => {} }) {
  let gl, program, buffer, raf = 0, destroyed = false, failed = false;
  let current = null, previous = null, transition = null, ripple = null;
  let frames = 0, lastDurationMs = 0, lastTime = 0;
  let pressValue = 0, pressTarget = 0, pressOrigin = { x: .5, y: .5 };
  const textures = new Set();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const originOf = p => ({ x: clamp(Number(p?.x) || 0, 0, 1), y: clamp(Number(p?.y) || 0, 0, 1) });
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  function unavailable(error) {
    if (failed || destroyed) return;
    failed = true;
    stop();
    try { onUnavailable(error instanceof Error ? error : new Error(String(error))); } catch (_) { /* host owns fallback */ }
  }
  const lost = e => { e.preventDefault(); unavailable(new Error('WebGL context lost')); cleanup(); };
  canvas.addEventListener('webglcontextlost', lost, false);
  function drop(texture) {
    if (!texture || !textures.has(texture)) return;
    textures.delete(texture);
    gl.deleteTexture(texture);
  }
  function cleanup() {
    stop();
    canvas.removeEventListener('webglcontextlost', lost);
    if (!gl) return;
    for (const texture of [...textures]) drop(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
  }
  const vertex = `attribute vec2 aPosition;
    varying vec2 vUv;
    void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment = `precision highp float;
    varying vec2 vUv;
    uniform sampler2D uOld,uNew;
    uniform vec2 uOldCover,uNewCover,uPressOrigin,uRippleOrigin,uRevealOrigin;
    uniform float uAspect,uPress,uRipple,uReveal,uHasReveal;
    vec2 metric(vec2 p){return p*vec2(uAspect,1.);}
    vec2 unmetric(vec2 p){return p/vec2(uAspect,1.);}
    vec2 cover(vec2 p,vec2 c){return (vec2(p.x,1.-p.y)-.5)*c+.5;}
    void main(){
      vec2 p=vec2(vUv.x,1.-vUv.y);
      vec2 d=metric(p-uPressOrigin);
      float r=length(d);
      // A soft local indentation, bounded to the contact patch.
      vec2 warp=unmetric(d)*(.19*uPress*exp(-r*r/0.018));
      float reflection=0.;
      vec2 rd=metric(p-uRippleOrigin); float rr=length(rd);
      if(uRipple>=0. && uRipple<1.){
        float radius=uRipple*1.32;
        float envelope=exp(-pow((rr-radius)/.045,2.))*pow(1.-uRipple,1.65);
        float wave=sin((rr-radius)*83.);
        warp+=unmetric(rd/max(rr,.001))*.010*wave*envelope;
        reflection+=.018*cos((rr-radius)*65.)*envelope;
      }
      vec2 revealD=metric(p-uRevealOrigin); float revealR=length(revealD);
      float farthest=length(metric(max(uRevealOrigin,1.-uRevealOrigin)))+.10;
      float radius=uReveal*farthest;
      float edge=exp(-pow((revealR-radius)/.038,2.));
      if(uHasReveal>.5){
        warp+=unmetric(revealD/max(revealR,.001))*.016*sin((revealR-radius)*65.)*edge*sin(uReveal*3.14159265);
        reflection+=.018*edge*sin(uReveal*3.14159265);
      }
      vec2 q=clamp(p+warp,vec2(0.),vec2(1.));
      vec4 fresh=texture2D(uNew,cover(q,uNewCover));
      vec4 color=fresh;
      if(uHasReveal>.5){
        vec4 old=texture2D(uOld,cover(q,uOldCover));
        float mask=1.-smoothstep(radius-.025,radius+.025,revealR);
        if(uReveal<=0.)mask=0.;
        if(uReveal>=1.)mask=1.;
        color=mix(old,fresh,mask);
      }
      gl_FragColor=vec4(clamp(color.rgb+reflection,0.,1.),color.a);
    }`;
  let uniforms;
  function makeTexture(img) {
    const handle = gl.createTexture();
    if (!handle) throw new Error('Unable to allocate image texture');
    textures.add(handle);
    try {
      gl.bindTexture(gl.TEXTURE_2D, handle);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Unable to upload image texture');
      return { handle, aspect: (img.naturalWidth || img.width) / (img.naturalHeight || img.height) };
    } catch (error) { drop(handle); throw error; }
  }
  function finishTransition() {
    if (previous) drop(previous.handle);
    previous = null;
    transition = null;
  }
  function resizeBuffer() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    const scale = Math.min(window.devicePixelRatio || 1, 1.5, 2000 / w);
    const width = Math.max(1, Math.round(w * scale)), height = Math.max(1, Math.round(h * scale));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function draw(now) {
    if (destroyed || failed || !current) return;
    const start = performance.now();
    gl.useProgram(program);
    const aspect = canvas.width / canvas.height;
    const coverValue = tex => aspect > tex.aspect ? [1, tex.aspect / aspect] : [aspect / tex.aspect, 1];
    const old = previous || current;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, old.handle);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, current.handle);
    gl.uniform1i(uniforms.uOld, 0); gl.uniform1i(uniforms.uNew, 1);
    gl.uniform2fv(uniforms.uOldCover, coverValue(old)); gl.uniform2fv(uniforms.uNewCover, coverValue(current));
    gl.uniform1f(uniforms.uAspect, aspect);
    gl.uniform2f(uniforms.uPressOrigin, pressOrigin.x, pressOrigin.y); gl.uniform1f(uniforms.uPress, pressValue);
    const rp = ripple?.origin || { x: .5, y: .5 };
    gl.uniform2f(uniforms.uRippleOrigin, rp.x, rp.y);
    gl.uniform1f(uniforms.uRipple, ripple ? clamp((now - ripple.start) / 900, 0, 1) : -1);
    const tr = transition?.origin || { x: .8, y: .82 };
    gl.uniform2f(uniforms.uRevealOrigin, tr.x, tr.y);
    gl.uniform1f(uniforms.uHasReveal, transition ? 1 : 0);
    const progress = transition ? clamp((now - transition.start) / transition.duration, 0, 1) : 1;
    gl.uniform1f(uniforms.uReveal, progress * progress * (3 - 2 * progress));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    frames++; lastDurationMs = performance.now() - start;
  }
  function tick(now) {
    raf = 0;
    if (destroyed || failed) return;
    const dt = Math.min(64, now - (lastTime || now - 16)); lastTime = now;
    pressValue += (pressTarget - pressValue) * (1 - Math.exp(-dt / 65));
    if (Math.abs(pressTarget - pressValue) < .0005) pressValue = pressTarget;
    if (ripple && now - ripple.start >= 900) ripple = null;
    if (transition && now - transition.start >= transition.duration) finishTransition();
    draw(now);
    if (ripple || transition || pressValue !== pressTarget) schedule();
    else lastTime = 0;
  }
  function schedule() { if (!raf && !failed && !destroyed) raf = requestAnimationFrame(tick); }
  try {
    // Keep the finite renderer's last frame when an initially hidden canvas becomes visible (WebKit).
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL unavailable');
    const shaders = [];
    try {
      for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Unable to allocate shader');
        shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Water shader compilation failed');
      }
      program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate shader program');
      shaders.forEach(s => gl.attachShader(program, s)); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Water shader link failed');
    } finally { shaders.forEach(s => gl.deleteShader(s)); }
    gl.useProgram(program);
    buffer = gl.createBuffer();
    if (!buffer) throw new Error('Unable to allocate vertex buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    uniforms = Object.fromEntries(['uOld','uNew','uOldCover','uNewCover','uPressOrigin','uRippleOrigin','uRevealOrigin','uAspect','uPress','uRipple','uReveal','uHasReveal'].map(name => [name, gl.getUniformLocation(program, name)]));
    current = makeTexture(image); resizeBuffer(); draw(performance.now());
  } catch (error) { unavailable(error); cleanup(); return null; }
  return {
    // Interrupted reveals commit their newest target before the next reveal; no stale image can return.
    setImage(img, { animate = false, origin = { x: .8, y: .82 }, duration = 950 } = {}) {
      if (destroyed || failed) return;
      try {
        const next = makeTexture(img);
        finishTransition();
        if (animate) {
          previous = current; current = next;
          transition = { start: performance.now(), duration: clamp(Number(duration) || 950, 100, 5000), origin: originOf(origin) };
          schedule();
        } else {
          drop(current.handle); current = next; draw(performance.now());
        }
      } catch (error) { unavailable(error); cleanup(); }
    },
    // Strength zero releases the local indentation with a short finite relaxation.
    press(origin, strength = 1) {
      if (destroyed || failed) return;
      pressOrigin = originOf(origin); pressTarget = clamp(Number(strength) || 0, 0, 1); schedule();
    },
    burst(origin) {
      if (destroyed || failed) return;
      ripple = { origin: originOf(origin), start: performance.now() }; schedule();
    },
    // Immediately resolve all effects to the newest photograph; used for reduced motion.
    settle() {
      if (destroyed || failed) return;
      stop(); lastTime = 0; pressValue = pressTarget = 0; ripple = null; finishTransition(); draw(performance.now());
    },
    resize() { if (!destroyed && !failed) { resizeBuffer(); draw(performance.now()); } },
    destroy() { if (!destroyed) { cleanup(); destroyed = true; current = previous = transition = ripple = null; } },
    getState() { return { renderer: 'webgl', running: !!raf, frames, textureCount: textures.size, lastDurationMs }; }
  };
}
