// 窓口に近づく・触れる・選ぶと、プリズムの輪郭に光が走る（言葉の中身は使わない）
(() => {
  const scene = document.querySelector('.c-scene');
  const near = (on) => scene.classList.toggle('is-near', on);
  document.querySelectorAll('.c-way').forEach((a) => {
    a.addEventListener('pointerenter', () => near(true));
    a.addEventListener('pointerleave', () => near(false));
    a.addEventListener('focus', () => near(true));
    a.addEventListener('blur', () => near(false));
    a.addEventListener('touchstart', () => near(true), { passive: true });
  });
})();
