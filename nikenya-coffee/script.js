const buttons = [...document.querySelectorAll('[data-menu]')];
const lists = [...document.querySelectorAll('.menu-list')];
function showMenu(id, animate = false) {
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.menu === id));
  for (const list of lists) {
    list.hidden = list.id !== id;
    list.classList.remove('is-changing');
    if (!list.hidden && animate) {
      void list.offsetWidth;
      list.classList.add('is-changing');
    }
  }
}
showMenu('drinks');
for (const button of buttons) button.addEventListener('click', () => showMenu(button.dataset.menu, true));
