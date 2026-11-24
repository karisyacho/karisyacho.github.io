(() => {
	const hero = document.querySelector('[data-hero-motion]');
	if (!hero) return;

	const poster = hero.querySelector('.hero__poster');
	const video = hero.querySelector('.hero__video');
	const toggle = hero.querySelector('.hero__motion-toggle');
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const smallScreen = window.matchMedia('(max-width: 760px)');

	function refreshToggle() {
		toggle.textContent = video.paused ? '背景の動画を再生' : '背景の動画を一時停止';
	}

	function showPoster() {
		hero.classList.remove('hero--has-video');
		toggle.hidden = true;
	}

	function playVideo() {
		if (reducedMotion.matches) return;
		if (!video.hasAttribute('src')) {
			video.src = smallScreen.matches ? video.dataset.srcSmall : video.dataset.src;
		}
		video.play().catch((error) => {
			if (error.name === 'NotAllowedError' && !reducedMotion.matches) {
				refreshToggle();
				toggle.hidden = false;
			}
		});
	}

	function startAutoplay() {
		if (!navigator.connection?.saveData) window.requestAnimationFrame(playVideo);
	}

	video.addEventListener('playing', () => {
		if (reducedMotion.matches) return;
		hero.classList.add('hero--has-video');
		refreshToggle();
		toggle.hidden = false;
	});
	video.addEventListener('pause', refreshToggle);
	video.addEventListener('error', showPoster);
	toggle.addEventListener('click', () => {
		if (video.paused) playVideo();
		else video.pause();
	});

	reducedMotion.addEventListener('change', () => {
		if (reducedMotion.matches) {
			video.pause();
			video.removeAttribute('src');
			video.load();
			showPoster();
		} else {
			startAutoplay();
		}
	});

	if (poster.complete) startAutoplay();
	else {
		poster.addEventListener('load', startAutoplay, { once: true });
		poster.addEventListener('error', startAutoplay, { once: true });
	}
})();
