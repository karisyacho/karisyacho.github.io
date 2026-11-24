const form = document.getElementById('public-form');
const result = document.getElementById('public-form-result');

form.addEventListener('submit', event => {
	event.preventDefault();
	result.textContent = 'デモ送信が完了しました。入力内容の保存やメール送信は行われません。';
	result.hidden = false;
	result.focus();
	form.reset();
});

form.querySelector('button[type="submit"]').disabled = false;
