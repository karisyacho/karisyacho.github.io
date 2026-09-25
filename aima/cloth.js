/* Original WebGL textile: a deforming mesh, woven shading and spreading pigment. */
window.createAimaCloth = function (canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;
  const vertex = `
    precision highp float;
    attribute vec2 aUV;
    uniform float uTime, uAspect, uProgress;
    uniform vec2 uPointer;
    varying vec2 vUV;
    varying float vLight;
    void main(){
      vUV=aUV;
      float t=uTime*.8;
      float p=uProgress;
      float mobile=step(uAspect,.85);
      float w=mix(4.25,2.05,mobile);
      float x=(aUV.x-.5)*w;
      float y=(aUV.y-.5)*3.7;
      float wind=sin(aUV.y*7.5+t)*.21+sin(aUV.x*9.-aUV.y*4.+t*.71)*.13;
      float fold=sin(aUV.x*19.+aUV.y*2.-t*.4)*.085;
      float z=wind+fold+sin(aUV.x*3.14159)*.24;
      y+=sin(aUV.x*5.+t)*.09+sin(aUV.x*11.-t)*.03;
      x+=sin(aUV.y*4.+t*.65)*.075;
      float bend=smoothstep(.05,.8,p);
      z+=sin(aUV.x*6.2831+bend*3.)*bend*.8;
      x*=1.+bend*.24;
      y*=1.-bend*.20;
      float rz=-.18+bend*.72+uPointer.x*.035;
      float rx=.12+uPointer.y*.09;
      float ry=-.3+bend*.9;
      vec3 pos=vec3(x*cos(rz)-y*sin(rz),x*sin(rz)+y*cos(rz),z);
      pos=vec3(pos.x,pos.y*cos(rx)-pos.z*sin(rx),pos.y*sin(rx)+pos.z*cos(rx));
      pos=vec3(pos.x*cos(ry)+pos.z*sin(ry),pos.y,-pos.x*sin(ry)+pos.z*cos(ry));
      pos.x+=mix(.58,0.,mobile)-bend*.34;
      pos.y+=mix(.06,.13,mobile)+bend*.25;
      float distance=4.9-pos.z;
      gl_Position=vec4(pos.x*2.05/uAspect,pos.y*2.05,0.,distance);
      float nx=cos(aUV.x*19.+aUV.y*2.-t*.4)*.24+cos(aUV.x*9.-aUV.y*4.+t*.71)*.15;
      float ny=cos(aUV.y*7.5+t)*.21;
      vLight=.85+dot(normalize(vec3(-nx,-ny,1.)),normalize(vec3(-.7,.6,1.)))*.22+wind*.09;
    }`;
  const fragment = `
    precision highp float;
    varying vec2 vUV;
    varying float vLight;
    uniform float uTime,uProgress;
    uniform vec3 uColor;
    uniform vec3 uDrops[12];
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){
      float n=noise(vUV*18.)*.6+noise(vUV*47.)*.3+noise(vUV*120.)*.1;
      float dye=0.;
      for(int i=0;i<12;i++){
        if(uDrops[i].z>=0.){
          float age=max(0.,uTime-uDrops[i].z);
          float radius=min(.42,.028+age*.065);
          float d=distance(vUV,uDrops[i].xy)+(n-.5)*.11;
          float stain=1.-smoothstep(radius-.045,radius+.035,d);
          dye=max(dye,stain);
        }
      }
      dye=max(dye,smoothstep(.05,.52,uProgress)*(.83+n*.17));
      float thread=sin(vUV.x*650.)*sin(vUV.y*850.);
      float grain=hash(vUV*1400.)-.5;
      vec3 raw=vec3(.88,.885,.86);
      vec3 pigment=uColor*(.78+n*.34);
      vec3 color=mix(raw,pigment,clamp(dye,0.,1.));
      color*=vLight;
      color+=thread*.012+grain*.018;
      float edge=min(min(vUV.x,1.-vUV.x),min(vUV.y,1.-vUV.y));
      color*=.91+smoothstep(0.,.008,edge)*.09;
      gl_FragColor=vec4(color,1.);
    }`;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
  } catch {
    return null;
  }
  gl.useProgram(program);
  const points = [],
    indices = [],
    cols = 96,
    rows = 72;
  for (let y = 0; y <= rows; y++)
    for (let x = 0; x <= cols; x++) points.push(x / cols, y / rows);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const a = y * (cols + 1) + x,
        b = a + cols + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, "aUV");
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );
  const uniforms = Object.fromEntries(
    ["uTime", "uAspect", "uProgress", "uPointer", "uColor", "uDrops[0]"].map(
      (n) => [n, gl.getUniformLocation(program, n)],
    ),
  );
  let time = 0,
    progress = 0,
    playing = true,
    visible = true,
    last = performance.now(),
    raf = 0,
    frame = 0,
    pointer = [0, 0],
    color = [0.08, 0.2, 0.58],
    index = 1;
  const drops = new Float32Array(36);
  for (let i = 0; i < 12; i++) drops[i * 3 + 2] = -1;
  drops[0] = 0.57;
  drops[1] = 0.6;
  drops[2] = 0;
  function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform1f(uniforms.uAspect, canvas.clientWidth / canvas.clientHeight);
    gl.uniform1f(uniforms.uProgress, playing ? progress : 0);
    gl.uniform2fv(uniforms.uPointer, pointer);
    gl.uniform3fv(uniforms.uColor, color);
    gl.uniform3fv(uniforms["uDrops[0]"], drops);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    canvas.dataset.frame = String(++frame);
  }
  function tick(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (playing && visible && !document.hidden) {
      time += dt;
      render();
      raf = requestAnimationFrame(tick);
    }
  }
  function start() {
    if (!raf && playing && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.35);
    canvas.width = Math.min(1800, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.min(1250, Math.round(canvas.clientHeight * dpr));
    render();
    start();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (!visible) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  });
  visibilityObserver.observe(canvas);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    canvas.closest(".immersive-stage").classList.remove("has-webgl");
  });
  resize();
  return {
    setProgress(value) {
      progress = value;
      if (!playing) render();
    },
    setMotion(value) {
      playing = value;
      cancelAnimationFrame(raf);
      raf = 0;
      if (!value) {
        time = Math.max(time, 6);
        render();
      } else start();
    },
    setColor(hex) {
      color = hex.match(/[a-f\d]{2}/gi).map((v) => parseInt(v, 16) / 255);
      render();
    },
    setPointer(x, y) {
      pointer = [x, y];
    },
    paint(x, y) {
      const i = (index++ % 12) * 3;
      drops[i] = Math.max(0.03, Math.min(0.97, x));
      drops[i + 1] = Math.max(0.03, Math.min(0.97, y));
      drops[i + 2] = playing ? time : time - 6;
      render();
      start();
    },
    reset() {
      for (let i = 0; i < 12; i++) drops[i * 3 + 2] = -1;
      index = 0;
      render();
    },
    get frame() {
      return frame;
    },
  };
};
