import { WaterScene } from './water.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#water-canvas');
const soundButton = $('#sound-toggle');
const pauseButton = $('#pause-toggle');
const waveButton = $('#ripple-button');
const heroWaveButton = $('#hero-ripple');
const heroWaveLabel = $('[data-hero-wave-label]');
const heroMotionStatus = $('#hero-motion-status');
const garden = $('#garden');
const keepSection = $('#keep');
const momentPreview = $('#moment-preview');
const momentCaption = $('#moment-caption');
const captureButton = $('#capture-button');
const saveButton = $('#save-button');
const interactionState = $('#interaction-state');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const moodNames = ['朝の光', '午後の光', '夜の光'];
let touches = 0;
let mood = 1;
let userPaused = motionPreference.matches;
let toastTimer;
let fallback = false;
let audioContext;
let audioGain;
let audioNodes = [];
let soundOn = false;
let soundBusy = false;
let scrollPending = false;
let capturedMoment = null;
let capturePromise = null;
let saveBusy = false;
let keepEntered = false;

function announce(message) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => { toast.classList.remove('visible'); toast.textContent = ''; }, 6000);
}

function recordTouch() {
  touches += 1;
  if (soundOn && audioContext?.state === 'running') {
    const now = audioContext.currentTime;
    const chime = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    chime.type = 'sine';
    chime.frequency.value = [261.63, 293.66, 329.63, 392, 440][(touches - 1) % 5];
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.018, now + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    chime.connect(envelope).connect(audioGain);
    chime.start(now);
    chime.stop(now + 0.26);
    chime.onended = () => { chime.disconnect(); envelope.disconnect(); };
  }
  $('#touch-count').textContent = String(touches).padStart(2, '0');
  interactionState.textContent = userPaused ? '水面を止めています。再生すると波が広がります。' : '波が、ゆっくり広がっていきます。';
}

const scene = new WaterScene(canvas, {
  reducedMotion: motionPreference.matches,
  onTouch: recordTouch,
});

function syncPause() {
  scene.setPaused(userPaused || document.hidden || fallback);
  pauseButton.setAttribute('aria-pressed', String(userPaused));
  pauseButton.querySelector('[data-pause-label]').textContent = userPaused ? '動きを再生' : '動きを止める';
  pauseButton.setAttribute('aria-label', userPaused ? '水面の動きを再生' : '水面の動きを止める');
  if (heroWaveLabel) heroWaveLabel.textContent = fallback ? '静止画を表示しています' : userPaused ? '動かして、波をひとつ' : '水面に、触れてみる。';
  if (heroMotionStatus) heroMotionStatus.textContent = fallback ? 'この端末では静止画を表示しています。' : userPaused ? '動きを止めて表示しています。' : '';
}

function useFallback() {
  fallback = true;
  pauseButton.disabled = true;
  waveButton.disabled = true;
  if (heroWaveButton) heroWaveButton.disabled = true;
  interactionState.textContent = 'この端末では静止画を表示しています。画像は保存できます。';
  syncPause();
}

function setMood(next) {
  mood = next;
  scene.setMood(next);
  document.documentElement.dataset.mood = String(next);
  document.querySelectorAll('button[data-mood]').forEach((button) => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.mood) === next));
  });
  $('#mood-name').textContent = moodNames[next];
}

document.querySelectorAll('button[data-mood]').forEach((button) => {
  button.addEventListener('click', () => setMood(Number(button.dataset.mood)));
});
pauseButton.addEventListener('click', () => {
  userPaused = !userPaused;
  syncPause();
  interactionState.textContent = userPaused ? '水面の動きを止めています。' : '水面に、そっと触れてください。';
});
function addOneWave() {
  if (fallback) return;
  if (userPaused) {
    userPaused = false;
    syncPause();
  }
  const before = touches;
  scene.addRipple(0, 0, 1);
  if (touches === before) recordTouch();
}
waveButton.addEventListener('click', addOneWave);
heroWaveButton?.addEventListener('click', addOneWave);
$('#reset-button').addEventListener('click', () => {
  scene.reset();
  scene.setMood(mood);
  syncPause();
  touches = 0;
  $('#touch-count').textContent = '00';
  if (!fallback) interactionState.textContent = userPaused ? '水面の動きを止めています。' : '水面に、そっと触れてください。';
  announce('水面をはじめの状態に戻しました。');
});

motionPreference.addEventListener('change', (event) => {
  userPaused = event.matches;
  syncPause();
  if (!fallback) interactionState.textContent = userPaused ? '水面の動きを止めています。' : '水面に、そっと触れてください。';
});
document.addEventListener('visibilitychange', syncPause);
canvas.addEventListener('webglcontextlost', useFallback);
setMood(1);
syncPause();
if (!scene.supported) useFallback();
else if (userPaused) interactionState.textContent = '水面の動きを止めています。';
$('#year').textContent = String(new Date().getFullYear());

function updateProgress() {
  scrollPending = false;
  const rect = garden.getBoundingClientRect();
  scene.setProgress(Math.max(0, 1 - Math.abs(rect.top) / Math.max(1, window.innerHeight)));
}
function scheduleProgress() {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(updateProgress);
}
window.addEventListener('scroll', scheduleProgress, { passive: true });
window.addEventListener('resize', scheduleProgress, { passive: true });
updateProgress();

function buildSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Audio unavailable');
  audioContext = new AudioContextClass();
  audioGain = audioContext.createGain();
  audioGain.gain.value = 0;
  audioGain.connect(audioContext.destination);
  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < samples.length; i += 1) {
    previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
    samples[i] = previous;
  }
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 480;
  const noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0.14;
  noise.connect(filter).connect(noiseGain).connect(audioGain);
  noise.start();
  audioNodes = [noise];
  [130.81, 196, 261.63].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = [-3, 2, -1][index];
    const gain = audioContext.createGain();
    gain.gain.value = 0.009;
    oscillator.connect(gain).connect(audioGain);
    oscillator.start();
    audioNodes.push(oscillator);
  });
}
function setAudioLevel() {
  if (!audioContext || !audioGain) return;
  const now = audioContext.currentTime;
  audioGain.gain.cancelScheduledValues(now);
  audioGain.gain.setTargetAtTime(soundOn && !document.hidden ? 0.65 : 0, now, 0.3);
}
soundButton.addEventListener('click', async () => {
  if (soundBusy) return;
  soundBusy = true;
  try {
    if (!audioContext || audioContext.state === 'closed') buildSound();
    await audioContext.resume();
    soundOn = !soundOn;
    setAudioLevel();
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.querySelector('[data-sound-label]').textContent = soundOn ? '音を止める' : '音を聴く';
    soundButton.setAttribute('aria-label', soundOn ? '環境音を止める' : '環境音を聴く');
  } catch {
    soundOn = false;
    soundButton.setAttribute('aria-pressed', 'false');
    soundButton.querySelector('[data-sound-label]').textContent = '音を聴く';
    announce('音を再生できませんでした。もう一度お試しください。');
  } finally {
    soundBusy = false;
  }
});
document.addEventListener('visibilitychange', setAudioLevel);
window.addEventListener('pagehide', () => {
  audioNodes.forEach((node) => { try { node.stop(); } catch {} });
  audioNodes = [];
  if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
});

function captureMoment(forSave = false) {
  if (capturePromise) return capturePromise;
  if (saveBusy && !forSave) return Promise.resolve(capturedMoment);
  captureButton.disabled = true;
  captureButton.setAttribute('aria-busy', 'true');
  capturePromise = (async () => {
    await scene.ready;
    if (document.fonts?.ready) await document.fonts.ready;
    const capturedArt = scene.renderStill(1400, 1400);
    const art = document.createElement('canvas');
    art.width = 1400;
    art.height = 1400;
    const artContext = art.getContext('2d');
    const previewContext = momentPreview.getContext('2d');
    if (!artContext || !previewContext) throw new Error('Canvas unavailable');
    artContext.drawImage(capturedArt, 0, 0, 1400, 1400);
    const now = new Date();
    const random = new Uint8Array(4);
    crypto.getRandomValues(random);
    const next = {
      art,
      mood,
      date: new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }).format(now),
      filenameDate: now.toISOString().slice(0, 10),
      id: Array.from(random, (value) => value.toString(16).padStart(2, '0')).join('').toUpperCase(),
    };
    previewContext.drawImage(art, 0, 0, momentPreview.width, momentPreview.height);
    capturedMoment = next;
    momentCaption.textContent = 'この水面を、そのまま保存できます。';
    return next;
  })().finally(() => {
    capturePromise = null;
    captureButton.disabled = saveBusy;
    captureButton.removeAttribute('aria-busy');
  });
  return capturePromise;
}

captureButton.addEventListener('click', () => {
  captureMoment().catch(() => announce('水面を撮れませんでした。もう一度お試しください。'));
});
if ('IntersectionObserver' in window) {
  const keepObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const entered = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      if (entered && !keepEntered) {
        captureMoment().catch(() => announce('水面を撮れませんでした。もう一度お試しください。'));
      }
      keepEntered = entered;
    });
  }, { threshold: [0, 0.15] });
  keepObserver.observe(keepSection);
} else {
  captureMoment().catch(() => announce('水面を撮れませんでした。もう一度お試しください。'));
}

saveButton.addEventListener('click', async () => {
  if (saveButton.disabled) return;
  saveBusy = true;
  saveButton.disabled = true;
  captureButton.disabled = true;
  saveButton.setAttribute('aria-busy', 'true');
  const label = saveButton.querySelector('[data-save-label]');
  const originalLabel = label.textContent;
  label.textContent = '画像を準備中';
  let downloadUrl;
  try {
    const moment = await (capturePromise || (capturedMoment ? Promise.resolve(capturedMoment) : captureMoment(true)));
    const postcard = document.createElement('canvas');
    postcard.width = 1600;
    postcard.height = 2000;
    const context = postcard.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.fillStyle = '#f4f1e9';
    context.fillRect(0, 0, 1600, 2000);
    context.drawImage(moment.art, 100, 100, 1400, 1400);
    context.fillStyle = '#262c2c';
    context.textAlign = 'left';
    context.font = '500 27px Inter, sans-serif';
    context.fillText('STILLWATER', 100, 1610);
    context.font = 'italic 82px Cormorant, Georgia, serif';
    context.fillText('A moment, kept.', 100, 1730);
    context.font = '400 24px Inter, "Yu Mincho", serif';
    context.fillText(`${moment.date}  /  ${moodNames[moment.mood]}`, 100, 1860);
    context.textAlign = 'right';
    context.font = '400 22px Inter, sans-serif';
    context.fillText(`NO. ${moment.id}`, 1500, 1860);
    const blob = await new Promise((resolve, reject) => postcard.toBlob((result) => result ? resolve(result) : reject(new Error('PNG unavailable')), 'image/png'));
    downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `stillwater-${moment.filenameDate}-${moment.id.toLowerCase()}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    announce('保存用の画像を用意しました。ダウンロードをご確認ください。');
  } catch {
    announce('画像を保存できませんでした。もう一度お試しください。');
  } finally {
    if (downloadUrl) setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    saveBusy = false;
    captureButton.disabled = Boolean(capturePromise);
    saveButton.disabled = false;
    saveButton.removeAttribute('aria-busy');
    label.textContent = originalLabel;
  }
});


