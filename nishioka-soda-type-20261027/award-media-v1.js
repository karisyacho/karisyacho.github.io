// Essential photographs load near their scene, not alongside the opening image.
(() => {
  const pictures = [...document.querySelectorAll('[data-deferred-picture]')];
  const load = picture => {
    if (picture.dataset.started) return;
    picture.dataset.started = 'true';
    const image = picture.querySelector('img'), placeholder = image.src;
    image.addEventListener('error', () => {
      picture.querySelectorAll('source').forEach(source => source.removeAttribute('srcset'));
      image.src = placeholder;
      picture.dataset.failed = 'true';
    }, { once: true });
    image.addEventListener('load', () => { picture.dataset.loaded = 'true'; }, { once: true });
    picture.querySelectorAll('source[data-srcset]').forEach(source => { source.srcset = source.dataset.srcset; });
    image.loading = 'eager';
    image.src = image.dataset.src;
  };
  if (!('IntersectionObserver' in window)) { pictures.forEach(load); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target); load(entry.target);
  }), { rootMargin: '400px' });
  pictures.forEach(picture => observer.observe(picture));
})();
