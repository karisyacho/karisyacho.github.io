// TOP の場面：暗い部屋に集まる立体の AWAI.（2026-10-23 確定の動く絵コンテ 第11版の直しを移植）。
// 原本：docs/awai-top-letters-20261023/index.html。動き・光・素材の数値は原本のまま。
// experience.js が create() で作り、毎コマ frame(now, p, dim) を呼ぶ（p：0＝TOP、1＝WORKS）。
// WORKS へ移る時は、字が集まった時の逆回しで奥へ帰る。TOP へ戻ると同じ道を通って集まる。
import * as THREE from './three/three.module.min.js';
import { Reflector } from './three/addons/objects/Reflector.js';
import { EffectComposer } from './three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './three/addons/postprocessing/RenderPass.js';
import { BokehPass } from './three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from './three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from './three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from './three/addons/postprocessing/OutputPass.js';

export function create({ canvas, reduce, hint, copyEl }) {
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
let dprMax = 2;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprMax));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const BG = 0x060708;
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 10, 30);
const pmrem = new THREE.PMREMGenerator(renderer);
// 映り込みの部屋：真上やや奥の大きな明かり・奥の低い帯・右奥の縦の明かり・手前の高い所の弱い明かり。
// 正面を向いている時、字の面にはカメラの後ろが映る。そこに大きく弱い明かりを置いて、つや消し銀の明るさを保つ。
// その外側、左右の斜め後ろに細長い明かりを立てる。字が振り向くと、面に映る先がこの明かりへ移り、光の帯が面を横切る
// （面の向きが θ 変わると映る先は 2θ 動く）。明かりと明かりの間は弱い明かりで埋め、字ごとの明暗の差を抑える
function studio() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x030405, side: THREE.BackSide })));
  const panel = (w, h, v, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v * 1.01, v * 1.03), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); s.add(m);
  };
  panel(10, 3.0, 6.0, [0, 9, -1.5], [0, 0, 0]);
  panel(18, 0.5, 5.0, [0, 1.2, -9], [0, 1, 0]);
  panel(0.6, 7, 3.2, [9, 3, -3], [0, 1, 0]);
  panel(14, 2.4, 0.9, [0, 7.5, 7], [0, 0, 0]);
  const at = (deg, el, d = 9) => { const a = THREE.MathUtils.degToRad(deg), e = THREE.MathUtils.degToRad(el);
    return [Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d]; };
  panel(11, 4.2, 0.8, at(-12, 6), [0, 0, 0]);       // 正面の後ろ：横に広くやわらかい明かり
  panel(2.0, 9.0, 2.2, at(44, 14), [0, 0, 0]);      // 右の斜め後ろ：細長い明かり（右を向くと帯が走る）
  panel(2.0, 9.0, 2.0, at(-64, 14), [0, 0, 0]);     // 左の斜め後ろ：細長い明かり（左を向くと帯が走る）
  panel(30, 3.6, 0.55, at(-10, 4, 12), [0, 0, 0]);  // 間を埋める横長の弱い明かり
  panel(16, 0.45, 2.2, at(-8, 34), [0, 0, 0]);      // 上の横長の明かり（見上げると上から帯が下りる）
  panel(12, 3.5, 0.35, at(-160, 12), [0, 0, 0]);    // 字の後ろの弱い明かり（横の面が真っ黒の穴に見えないように）
  return s;
}
const ENV = pmrem.fromScene(studio(), 0.02).texture;
scene.environment = ENV;
scene.environmentIntensity = 1.0;

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

// 光：右から字の面をなめるように低く当て、真後ろから縁を光らせる
const key = new THREE.SpotLight(0xf3f5f8, 90, 0, 0.55, 0.9, 2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xa9b6c2, 0.9);
scene.add(rim);
const keyI = 120;
const KEYDIR = new THREE.Vector3(6.0, 3.4, 0.9).normalize(), KEY0 = Math.max(0, KEYDIR.z);   // 主光の向きと、正面を向いた時の当たり方
key.position.set(6.0, 3.4, 0.9); key.target.position.set(-0.6, 0.6, 0);
rim.position.set(0.6, 2.6, -6); rim.intensity = 2.6;
// 振り向き・押す・にじみの効き方（第10版の動き＋第11版の素材）。
// 白飛びは角度ではなく、主光へ向いた分だけ字の面を沈めて抑える（comp）。左を向いて主光を受けた右の側面が見える分も沈める（compS）。
// 字ごとの映り込みの回し方（envEq）：左端の字と真ん中の字ではカメラから見る角度が違い、同じ向きでも面に映る場所が違う。
// 見る角度の分だけ映り込みを回して、同じ瞬間の字ごとの明暗をそろえる
const T = { yaw: [-0.45, 0.55], gain: 1, pitch: [-0.26, 0.22], pg: 0.42, pdamp: 6.5, damp: 6.5, comp: 0.85, compS: 0.3, push: 0.17, turn: 0.2, cap: 0.3, k: 22, c: 6, ak: 18, ac: 5, rotX: [-0.24, 0.1], rotZ: 0.16, bloom: [0.22, 0.92],
  rough: 0.42, aniso: 0.85, arot: Math.PI / 2, bump: 0.12, beamLow: 0.55, envEq: -0.8 };

// 空気の光：右上奥から、字の後ろへふわっと広がる柔らかい光の束と、床の奥に横へ伸びる光
const BEAM_FROM = new THREE.Vector3(5.2, 9.5, -5.5), BEAM_TO = new THREE.Vector3(2.6, 0, -4.2);
const beamMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uI: { value: 0 }, uLow: { value: T.beamLow } },
  vertexShader: `varying vec3 vN; varying vec3 vP; varying vec2 vUv;
    void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uI; uniform float uLow; varying vec3 vN; varying vec3 vP; varying vec2 vUv;
    void main(){
      vec3 v = normalize(cameraPosition - vP);
      float core = pow(abs(dot(normalize(vN), v)), 1.5);
      float along = smoothstep(0.0, uLow, vUv.y) * (1.0 - smoothstep(0.86, 1.0, vUv.y)) * (0.7 + 0.3 * vUv.y);
      float a = vUv.x * 6.2831;
      float mura = 0.72 + 0.16 * sin(a * 5.0 + vUv.y * 2.0) + 0.12 * sin(a * 11.0 - vUv.y * 3.0);
      gl_FragColor = vec4(vec3(0.86, 0.89, 0.93) * core * along * mura * uI, 1.0);
    }`,
});
const beamLen = BEAM_FROM.distanceTo(BEAM_TO);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 4.2, beamLen, 96, 1, true), beamMat);
beam.position.copy(BEAM_FROM).add(BEAM_TO).multiplyScalar(0.5);
beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), BEAM_FROM.clone().sub(BEAM_TO).normalize());
beam.renderOrder = 2;
scene.add(beam);
function glowMat(cx, cz, ax, az, k) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uI: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uI; varying vec3 vP;
      void main(){ vec2 d = vec2((vP.x - ${cx.toFixed(2)}) / ${ax.toFixed(2)}, (vP.z - ${cz.toFixed(2)}) / ${az.toFixed(2)});
        float g = exp(-dot(d, d)); gl_FragColor = vec4(vec3(0.82, 0.85, 0.9) * g * ${k.toFixed(2)} * uI, 1.0); }`,
  });
}
const glows = [glowMat(0.4, -5.5, 9.0, 1.0, 0.32), glowMat(BEAM_TO.x, BEAM_TO.z, 2.6, 1.5, 0.4)].map((m) => {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), m);
  g.rotation.x = -Math.PI / 2; g.position.y = 0.006; g.renderOrder = 1;
  scene.add(g); return m;
});
const beamLight = new THREE.SpotLight(0xe6ebf1, 40, 0, 0.42, 1, 2);
beamLight.position.copy(BEAM_FROM); beamLight.target.position.copy(BEAM_TO);
scene.add(beamLight, beamLight.target);
const AIR = { beam: 0.44, band: 0.35, pool: 0.8 };
function setAir(k) { beamMat.uniforms.uI.value = AIR.beam * k; glows[0].uniforms.uI.value = AIR.band * k; glows[1].uniforms.uI.value = AIR.pool * k; beamLight.intensity = 40 * k; }

// 床：うっすら映り込む黒い床。映り込みは字の根元ではくっきり、手前へ離れるほどぼける
const BlurReflector = {
  name: 'BlurReflector',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    uTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) }, uBlur: { value: 1 } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
    void main(){ vUv = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uBlur; varying vec4 vUv; varying vec3 vW;
    float bo(float b, float c){ return (b < 0.5) ? (2.0 * b * c) : (1.0 - 2.0 * (1.0 - b) * (1.0 - c)); }
    void main(){
      vec2 uv = vUv.xy / vUv.w;
      float r = (0.6 + smoothstep(0.08, 1.6, vW.z) * 9.0) * uBlur;
      vec4 acc = vec4(0.0); float ws = 0.0;
      for (int i = 0; i < 20; i++) {
        float d = sqrt((float(i) + 0.5) / 20.0), a = float(i) * 2.39996;
        float w = 1.0 - 0.6 * d;
        acc += texture2D(tDiffuse, uv + vec2(cos(a), sin(a)) * d * r * uTexel) * w; ws += w;
      }
      vec3 base = (acc / ws).rgb;
      gl_FragColor = vec4(bo(base.r, color.r), bo(base.g, color.g), bo(base.b, color.b), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};
const mirror = new Reflector(new THREE.PlaneGeometry(60, 60), { color: 0x8a8f94, textureWidth: 1024, textureHeight: 1024, shader: BlurReflector });
mirror.rotation.x = -Math.PI / 2;
scene.add(mirror);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: 0x0c0e10, roughness: 0.92, metalness: 0, transparent: true, opacity: 0.8 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = 0.002; floor.receiveShadow = true;
scene.add(floor);
// 字のすぐ手前で床が黒く切れると崖の縁に見えるので、カメラから見下ろす角度で暗くし、画面の下へなだらかに沈める
const veil = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms: { uC: { value: new THREE.Vector3(0.0018, 0.0021, 0.0024) } },
  vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 uC; varying vec3 vP;
    void main(){
      float down = atan(cameraPosition.y - vP.y, length(vP.xz - cameraPosition.xz));
      float t = smoothstep(0.05, 0.17, down);
      gl_FragColor = vec4(uC, pow(t, 0.7) * 0.97); }`,
}));
veil.rotation.x = -Math.PI / 2; veil.position.y = 0.004; veil.renderOrder = 0.5;
scene.add(veil);
// 床の照り返し：右から低く当たる主光が、字の手前の床をなめて薄く光る
const sheen = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uI: { value: 1 } },
  vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uI; varying vec3 vP;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
    void main(){
      float side = smoothstep(-3.5, 3.0, vP.x);
      float depth = smoothstep(0.05, 0.5, vP.z) * exp(-pow(max(vP.z - 0.5, 0.0) / 2.6, 1.6));
      float mura = 0.75 + 0.25 * n(vP.xz * vec2(1.4, 0.9)) + 0.08 * (n(vP.xz * 9.0) - 0.5);
      gl_FragColor = vec4(vec3(0.75, 0.79, 0.85) * side * depth * mura * 0.05 * uI, 1.0);
    }`,
});
{
  const s = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), sheen);
  s.rotation.x = -Math.PI / 2; s.position.y = 0.006; s.renderOrder = 1;
  scene.add(s);
}

// 字の形（Jost の幾何の骨格に合わせた直線の字）
const ST = 0.15;
function shapeA(W = 0.84, d = ST) {
  const s = new THREE.Shape();
  const at = (y) => W / 2 * y;
  s.moveTo(0, 0); s.lineTo(d, 0); s.lineTo(d + at(0.22), 0.22); s.lineTo(W - d - at(0.22), 0.22);
  s.lineTo(W - d, 0); s.lineTo(W, 0); s.lineTo(W / 2, 1); s.lineTo(0, 0);
  const h = new THREE.Path();
  h.moveTo(d + at(0.33), 0.33); h.lineTo(W / 2, (W - 2 * d) / W); h.lineTo(W - d - at(0.33), 0.33); h.lineTo(d + at(0.33), 0.33);
  s.holes.push(h);
  return [s];
}
function shapeV(ox, w, d, f) {
  const yi = 1 - (w - 2 * d) / (w - 2 * f);
  const s = new THREE.Shape();
  s.moveTo(ox, 1); s.lineTo(ox + d, 1); s.lineTo(ox + w / 2, yi); s.lineTo(ox + w - d, 1); s.lineTo(ox + w, 1);
  s.lineTo(ox + w / 2 + f, 0); s.lineTo(ox + w / 2 - f, 0); s.lineTo(ox, 1);
  return s;
}
function shapeW(w = 0.62, d = 0.145, f = 0.05) { return [shapeV(0, w, d, f), shapeV(w - d, w, d, f)]; }
function shapeI(d = ST) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(d, 0); s.lineTo(d, 1); s.lineTo(0, 1); s.lineTo(0, 0); return [s]; }
// 点：I と同じ幅の四角（丸い点は立てるとコインや玉軸受けに見えた。本人「四角でもいいよ」）
function shapeSq(d = ST) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(d, 0); s.lineTo(d, d); s.lineTo(0, d); s.lineTo(0, 0); return [s]; }

const DEPTH = 0.24;
// 角を45度に面取りして、光を細い線で拾う（字の太さは変えないよう、面を内側へ寄せてから斜めに落とす）
function build(shapes) {
  const opt = { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.024, bevelSize: 0.022, bevelOffset: -0.022, bevelSegments: 1, curveSegments: 40 };
  const g = new THREE.ExtrudeGeometry(shapes, opt);
  g.computeBoundingBox();
  const b = g.boundingBox;
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  g.computeVertexNormals();
  return { g, w: b.max.x - b.min.x };
}

// つや消し銀：横に細く擦ったヘアラインと、触った跡のようなごく薄いむら
function brushed() {
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, N, N);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 14; i++) {
    const x = rnd() * N, y = rnd() * N, r = 120 + rnd() * 260, v = rnd() < 0.5 ? 0 : 255;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${v},${v},${v},0.10)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 16000; i++) {
    const x = rnd() * N, y = Math.floor(rnd() * N), len = 60 + rnd() * 520, v = rnd() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${0.025 + rnd() * 0.07})`;
    g.fillRect(x, y, len, 1); g.fillRect(x - N, y, len, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.4, 1.4);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
const brushTex = brushed();
const mat = new THREE.MeshPhysicalMaterial({ color: 0xc4c8cc, metalness: 1, roughness: T.rough, roughnessMap: brushTex,
  bumpMap: brushTex, bumpScale: T.bump, anisotropy: T.aniso, anisotropyRotation: T.arot });
const BASE = mat.color.clone();
const dotGeo = build(shapeSq()).g;

const defs = [shapeA(), shapeW(), shapeA(), shapeI(), shapeSq()];
const GAP = 0.16;
const group = new THREE.Group();
scene.add(group);
const L = [];
let x = 0;
// 接地の影：字の根元の床だけをうっすら暗くする（字について動き、浮くと消える）
const contactMat = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms: { uK: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform float uK; varying vec2 vUv;
    void main(){ vec2 p = vUv * 2.0 - 1.0;
      float sx = 1.0 - smoothstep(0.55, 1.0, abs(p.x));
      float sz = exp(-p.y * p.y * 9.0);
      gl_FragColor = vec4(0.0, 0.0, 0.0, sx * sz * 0.75 * uK); }`,
});
const shadows = [];
defs.forEach((sh, i) => {
  const { g, w } = build(sh);
  const m = new THREE.Mesh(i === 4 ? dotGeo : g, mat.clone());   // 字ごとに面の明るさと映り込みの向きを変えるので素材は字ごと
  m.castShadow = true; m.visible = false;
  const cs = new THREE.Group();
  const cp = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.22, 0.5), contactMat());
  cp.rotation.x = -Math.PI / 2; cp.position.y = 0.005; cp.renderOrder = 0.6;
  cs.add(cp); scene.add(cs);
  shadows.push({ cs, u: cp.material.uniforms.uK });
  const gap = i === 4 ? 0.08 : (i ? GAP : 0);
  x += gap;
  const rest = new THREE.Vector3(x + w / 2, 0, 0);
  x += w;
  group.add(m);
  L.push({ m, w, rest, off: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Vector3(), av: new THREE.Vector3(),
    ly: 0, lp: 0, vy: 0, vp: 0, k: [30, 23, 27, 20, 36][i] });
});
const TOTAL = x;
L.forEach((l) => { l.rest.x -= TOTAL / 2; });

// 飛んでくる前の位置（字ごとの奥・向き）と出発の時刻
const FROM = [
  { p: [-5.5, 2.6, -9], r: [0.9, -1.4, 0.6], t: 0.25, d: 2.1 },
  { p: [1.5, 5.6, -14], r: [-1.2, 0.8, -0.4], t: 0.5, d: 2.1 },
  { p: [6.2, 1.2, -8], r: [0.5, 1.6, -0.8], t: 0.75, d: 2.1 },
  { p: [0.4, 3.6, -20], r: [1.6, 0.2, 1.2], t: 1.0, d: 2.1 },
  { p: [1.6, 4.4, -1.5], r: [0, 0, 0], t: 2.45, d: 0.9 },
];
// 奥へ帰る順番（WORKS へ移る p の上で）：集まった順の逆。点が最初に飛び立ち、最初の A が最後に帰る。
// TOP へ戻る時は p が減るので、同じ表のまま最初の A から集まり、点が最後に乗る
const LEAVE = [0.24, 0.18, 0.12, 0.06, 0], LEAVE_LEN = 0.36, FAR = 2.2;
const easeQuint = (t) => 1 - Math.pow(1 - t, 5);
const easeCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function bounce(t) { const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }

// 仕上げ：奥行きのピント・明るい縁のにじみ・粒子・周辺を落として色を締める。WORKS では部屋ごと沈める（uDim）。
// 仕上げの段を通すと描画の時の縁のなめらかさが効かないので、重ねて描く下地に4倍の縁取りを付ける
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 4, aperture: 0.0012, maxblur: 0.008 });
composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), T.bloom[0], 0.5, T.bloom[1]);
composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uAsp: { value: 1 }, uDim: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT; uniform float uAsp; uniform float uDim; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uT * 0.37) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb * uDim;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(c * vec3(0.93, 0.98, 1.06), c, smoothstep(0.0, 0.35, l));
      vec2 q = (vUv - 0.5) * vec2(uAsp, 1.0);
      c *= mix(1.0, 0.52, smoothstep(0.35, 1.05, length(q) / max(uAsp, 1.0) * 1.35));
      c += (h(vUv * 1000.0) - 0.5) * 0.045 * (0.35 + l);
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(grade);
composer.addPass(new OutputPass());

// 画面の形に合わせたカメラ：床すれすれの低い所から寄り、字を見上げる。
// 横長では一文と「制作を見る」を字の下に置くので、字を絵コンテより少し上に写す（LOOK_Y）
const camRest = new THREE.Vector3(), camLook = new THREE.Vector3();
let W = 1, H = 1;
// 縦長は字の手前の面が近く大きく写り、斜めのカメラで左へ寄る。並んだ字の箱を実際に写してみて、
// 中央に置き、左右に余白が残る距離まで引く（最初の A の足が左端で切れていた）
const fitBox = new THREE.Box3(), corner = new THREE.Vector3();
L.forEach((l) => { l.m.geometry.computeBoundingBox(); fitBox.union(l.m.geometry.boundingBox.clone().translate(l.rest)); });
function fitPortrait() {
  const want = 0.84 / 1.03;
  for (let n = 0; n < 4; n++) {
    camera.position.copy(camRest); camera.lookAt(camLook); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? fitBox.max.x : fitBox.min.x, i & 2 ? fitBox.max.y : fitBox.min.y, i & 4 ? fitBox.max.z : fitBox.min.z).project(camera);
      lo = Math.min(lo, corner.x); hi = Math.max(hi, corner.x);
    }
    const shift = (lo + hi) / 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * camRest.z;
    camRest.x += shift; camLook.x += shift;
    camRest.z *= (hi - lo) / 2 / want;
  }
}
function layout() {
  const r = canvas.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  const a = W / H;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprMax));
  renderer.setSize(W, H, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(W, H);
  grade.uniforms.uAsp.value = a;
  camera.aspect = a;
  camera.fov = a >= 1 ? 36 : 40;
  const fill = (a >= 1 ? 0.8 : 0.92) / 1.03;   // canvas は傾けるために画面より3%大きい。字の幅は見えている画面に合わせる
  const dist = (TOTAL / fill) / 2 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * a);
  camRest.set(a >= 1 ? 0.9 : 0.4, a >= 1 ? 0.26 : 0.34, dist); camLook.set(a >= 1 ? 0.3 : 0.1, a >= 1 ? 0.5 : 0.05, 0);
  if (a < 1) fitPortrait();
  bokeh.uniforms.focus.value = camRest.length() - 0.1;
  camera.updateProjectionMatrix();
  const rs = 0.5, rw = Math.round(W * renderer.getPixelRatio() * rs), rh = Math.round(H * renderer.getPixelRatio() * rs);
  mirror.getRenderTarget().setSize(rw, rh);
  mirror.material.uniforms.uTexel.value.set(1 / rw, 1 / rh);
  dirty = 4;
}
let dirty = 4;
addEventListener('resize', layout);
layout();

// 触れる：近づくと字がこちらに気づいて向く（字ごとに少し遅れて振り向く）／押すと指から離れる向きへ押され、重さで戻る
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.12);
const front = new THREE.Plane(new THREE.Vector3(0, 0, 1), -5);
const ptr = new THREE.Vector3(), ptrPrev = new THREE.Vector3(), ptrVel = new THREE.Vector3(), gaze = new THREE.Vector3(), probe = new THREE.Vector3();
let ptrDown = false, ptrHas = false, touched = false, seenAt = -1e9, ptrNy = 0;
const mid = new THREE.Vector3();
const hover = matchMedia('(hover: hover)').matches;
let active = false;   // TOP にいて字が集まり終えた時だけ触れる
function toNdc(cx, cy) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function toWorld(e) {
  toNdc(e.clientX, e.clientY); ptrNy = ndc.y;
  ray.ray.intersectPlane(front, gaze);
  seenAt = performance.now();
  return ray.ray.intersectPlane(plane, ptr) !== null;
}
const onUi = (e) => e.target && e.target.closest && e.target.closest('a,button,#gate');
addEventListener('pointerdown', (e) => { if (!active || onUi(e)) return; if (toWorld(e)) { ptrPrev.copy(ptr); ptrHas = true; ptrDown = true; } });
addEventListener('pointermove', (e) => {
  if (!active) return;
  if (e.pointerType !== 'mouse' && !ptrDown) return;
  if (toWorld(e)) { if (!ptrHas) ptrPrev.copy(ptr); ptrHas = true; }
});
addEventListener('pointerup', () => { ptrDown = false; });
addEventListener('pointercancel', () => { ptrDown = false; ptrHas = false; });
document.documentElement.addEventListener('pointerleave', () => { ptrDown = false; ptrHas = false; });
// 指が字の上（少し広め）から始まったか。experience.js はこの時、なぞりを「次へ送る」と取り違えない
function hits(cx, cy) {
  if (!active) return false;
  toNdc(cx, cy);
  if (!ray.ray.intersectPlane(plane, probe)) return false;
  return probe.y > -0.15 && probe.y < 1.25 && L.some((l) => Math.abs(probe.x - (l.rest.x + l.off.x)) < l.w / 2 + 0.2);
}

// 案内：字の根元のすぐ下、画面の中に。一文より上に収める
if (hint && !hover) hint.textContent = '触れて、なぞる';
function placeHint() {
  const r = canvas.getBoundingClientRect();
  const v = new THREE.Vector3(0, 0, 0.3).project(camera);
  const below = r.top + (1 - v.y) / 2 * r.height + 40;
  const roof = copyEl ? copyEl.getBoundingClientRect().top - 28 : innerHeight;
  hint.style.top = Math.min(below, roof, innerHeight - 120) + 'px';
  hint.style.left = (r.left + (v.x + 1) / 2 * r.width) + 'px';
}

const OPEN_END = 3.4;
let t0 = 0, started = false, opening = false, last = 0, hintOn = false, hidden = false;
// 重い端末：最初の約2秒の描画が遅ければ、細かさを1段下げる（画素の密度を1倍に・奥行きのぼかしを外す）
let slowN = 0, slowSum = 0, lowered = false;
function start(fly) {
  started = true; t0 = performance.now(); opening = !!fly && !reduce;
  L.forEach((l) => { l.m.visible = true; });
  if (!opening) setAir(1);
  dirty = 4;
}

function frame(now, p, dim) {
  if (!started) return false;
  const dt = Math.min((now - (last || now)) / 1000, 1 / 30); last = now;
  if (!lowered && slowN < 120 && dt > 0) {
    slowN++; slowSum += dt;
    if (slowN === 120 && slowSum / slowN > 0.034) { lowered = true; dprMax = 1; bokeh.enabled = false; layout(); }
  }
  const t = (now - t0) / 1000;
  if (opening && p > 0.001) opening = false;   // 集まる途中で WORKS へ移ったら、集まった所から帰る

  const ct = opening ? easeInOut(Math.min(t / 3.6, 1)) : 1;
  camera.position.copy(camRest).multiplyScalar(1 + 0.14 * (1 - ct));
  if (!reduce) camera.position.x += Math.sin(now / 5200) * 0.06;
  camera.lookAt(camLook);
  key.intensity = keyI * (opening ? 0.15 + 0.85 * easeCubic(Math.min(t / 2.8, 1)) : 1);
  setAir(opening ? easeCubic(Math.min(t / 3.2, 1)) : 1);

  let landed = !opening;
  if (opening && t < OPEN_END) {
    L.forEach((l, i) => {
      const f = FROM[i];
      const k = THREE.MathUtils.clamp((t - f.t) / f.d, 0, 1);
      if (i === 4) {
        l.m.position.set(l.rest.x + f.p[0] * (1 - easeCubic(k)), f.p[1] * (1 - bounce(k)), l.rest.z + f.p[2] * (1 - easeCubic(k)));
        l.m.visible = t >= f.t;
        l.m.rotation.set(0, 0, 0);
      } else {
        const e = easeQuint(k), r = easeCubic(k);
        l.m.position.set(l.rest.x + f.p[0] * (1 - e), f.p[1] * (1 - e), f.p[2] * (1 - e));
        l.m.rotation.set(f.r[0] * (1 - r), f.r[1] * (1 - r), f.r[2] * (1 - r));
        l.m.visible = true;
      }
    });
  } else {
    if (opening) { // 着地：重さで少し揺れてから止まる
      opening = false; landed = true;
      L.forEach((l, i) => { l.av.set(i % 2 ? 0.5 : -0.5, 0, i % 2 ? -0.3 : 0.3); });
    }
    active = p < 0.02;
    if (!active) { ptrDown = false; ptrHas = false; }
    const looking = active && ((ptrDown && ptrHas) || (now - seenAt) < (hover && ptrHas ? 1e9 : 900));
    if (ptrHas) { ptrVel.subVectors(ptr, ptrPrev).divideScalar(Math.max(dt, 1e-3)); ptrPrev.copy(ptr); }
    const speed = Math.min(ptrVel.length(), 8);
    const midY = mid.set(0, 0.5, 0).project(camera).y;
    L.forEach((l) => {
      if (looking) {
        // 指の方へ向く。字ごとの位置の差は半分だけ効かせ、5字がそろって同じ側へ振り向くようにする
        const dx = ptr.x - 0.45 * (l.rest.x + l.off.x), dz = 2.2;
        const ty = THREE.MathUtils.clamp(Math.atan2(dx, dz) * T.gain, T.yaw[0], T.yaw[1]);
        // 上下は画面の上で字の真ん中より上か下かで決める（上を指せば見上げ、下を指せば見下ろす）
        const tp = THREE.MathUtils.clamp(-(ptrNy - midY) * T.pg * 1.6, T.pitch[0], T.pitch[1]);
        l.vy += (ty - l.ly) * l.k * 3 * dt; l.vp += (tp - l.lp) * l.k * 3 * dt;
        touched = true;
      } else { l.vy -= l.ly * 40 * dt; l.vp -= l.lp * 40 * dt; }
      l.vy *= Math.max(0, 1 - T.damp * dt); l.vp *= Math.max(0, 1 - T.pdamp * dt);
      l.ly += l.vy * dt; l.lp += l.vp * dt;
      if (active && ptrDown && ptrHas) {
        const cx = l.rest.x + l.off.x, cy = 0.5 + l.off.y;
        const dx = cx - ptr.x, dy = cy - ptr.y;
        const dist = Math.hypot(dx, dy), R = 0.85;
        if (dist < R) {
          const s = Math.pow(1 - dist / R, 1.5) * (1.2 + speed * 1.4);
          const nx = dist > 1e-4 ? dx / dist : 0;
          l.vel.x += (nx * s * dt * 16 + ptrVel.x * s * dt * 1.2) * T.push;
          l.vel.z -= s * dt * 10 * T.push;
          l.av.x -= s * dt * 16 * T.turn;
          l.av.z -= nx * s * dt * 8 * T.turn;
          l.av.y += nx * s * dt * 5 * T.turn;
          touched = true;
        }
      }
      // ばね：元の場所へ戻る（重い金属が元の場所へ据わり直す）
      l.vel.addScaledVector(l.off, -T.k * dt).multiplyScalar(Math.max(0, 1 - T.c * dt));
      l.av.addScaledVector(l.rot, -T.ak * dt).multiplyScalar(Math.max(0, 1 - T.ac * dt));
      l.off.addScaledVector(l.vel, dt);
      l.rot.addScaledVector(l.av, dt);
      if (l.off.length() > T.cap) { l.off.setLength(T.cap); l.vel.multiplyScalar(0.5); }
      l.rot.x = THREE.MathUtils.clamp(l.rot.x, T.rotX[0], T.rotX[1]);
      l.rot.z = THREE.MathUtils.clamp(l.rot.z, -T.rotZ, T.rotZ);
    });
    // 字どうしはすり抜けない：近づきすぎたら押し合う（押した字が隣を押す）
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < L.length - 1; i++) {
      const a = L[i], b = L[i + 1];
      if (Math.abs(a.off.z - b.off.z) > DEPTH + 0.12) continue;
      const need = (a.w + b.w) / 2 + 0.03;
      const gap = (b.rest.x + b.off.x) - (a.rest.x + a.off.x);
      if (gap < need) {
        const push = (need - gap) / 2;
        a.off.x -= push; b.off.x += push;
        const va = a.vel.x, vb = b.vel.x;
        if (va > vb) { const m = (va + vb) / 2; a.vel.x = m; b.vel.x = m; b.av.z -= (va - vb) * 0.4; }
      }
    }
    // WORKS へ：字ごとに順に、集まった道を逆にたどって奥へ帰る（ゆっくり離れ、霧の向こうへ速く抜ける）
    L.forEach((l, i) => {
      const f = FROM[i];
      const q = 1 - THREE.MathUtils.clamp((p - LEAVE[i]) / LEAVE_LEN, 0, 1);
      if (reduce) {
        l.m.visible = p < 0.3;
        l.m.position.set(l.rest.x + l.off.x, 0, l.off.z);
        l.m.rotation.set(l.rot.x + l.lp, l.rot.y + l.ly, l.rot.z);
        l.q = l.m.visible ? 1 : 0;
        return;
      }
      const away = 1 - q, fp = away * away * away * FAR, fr = away * away * 1.3;
      l.m.visible = q > 0;
      l.m.position.set(l.rest.x + l.off.x * q + f.p[0] * fp, f.p[1] * fp, l.off.z * q + f.p[2] * fp);
      l.m.rotation.set((l.rot.x + l.lp) * q + f.r[0] * fr, (l.rot.y + l.ly) * q + f.r[1] * fr, l.rot.z * q + f.r[2] * fr);
      l.q = q;
    });
  }
  if (hidden) L.forEach((l) => { l.m.visible = false; });
  // 主光へ向いた分だけ面を沈める
  L.forEach((l) => {
    const a = l.m.rotation.y, n = new THREE.Vector3(0, 0, 1).applyEuler(l.m.rotation);
    const f = Math.max(0, n.dot(KEYDIR)) - KEY0, side = Math.max(0, -a - 0.12);
    l.m.material.color.copy(BASE).multiplyScalar(1 - THREE.MathUtils.clamp(f * T.comp + side * T.compS, 0, 0.6));
    const az = Math.atan2(l.m.position.x - camera.position.x, camera.position.z - l.m.position.z);
    l.m.material.envMapRotation.set(0, T.envEq * az, 0);
  });
  L.forEach((l, i) => {
    const s = shadows[i], q = l.q ?? 1, ps = l.m.position;
    s.cs.position.set(ps.x, 0, ps.z); s.cs.rotation.y = l.m.rotation.y;
    s.u.value = l.m.visible ? THREE.MathUtils.clamp(1 - ps.y / 0.6, 0, 1) * (1 - THREE.MathUtils.clamp(Math.abs(l.m.rotation.x) / 1.2, 0, 1)) * q : 0;
  });
  ptrVel.multiplyScalar(0.8);

  // 案内：集まり終えて、まだ触れていない時だけ
  if (hint) {
    const want = landed && !touched && p < 0.02 && t > OPEN_END + 0.6;
    if (want) placeHint();
    if (want !== hintOn) { hintOn = want; hint.classList.toggle('on', want); }
  }

  // WORKS で止まっている間は描き直さない（字はいなくなり、部屋は動かない）
  const still = p >= 1 && L.every((l) => !l.m.visible);
  if (still && dirty <= 0) return true;
  dirty = still ? dirty - 1 : 4;
  grade.uniforms.uDim.value = dim;
  grade.uniforms.uT.value = (now / 1000) % 100;
  composer.render(dt);
  return true;
}

// 最初の1コマを描く前に、使う描き方を全部用意しておく（入口が開いた直後に引っかからないように）
const ready = (async () => {
  L.forEach((l) => { l.m.visible = true; });
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); } catch (e) {}
  composer.render(0);
  L.forEach((l) => { l.m.visible = false; });
})();

// 予備の静止画を撮る時だけ使う：字を隠す
const setHidden = (on) => { hidden = on; dirty = 4; };
return { ready, start, frame, hits, setHidden, get lowered() { return lowered; } };
}
