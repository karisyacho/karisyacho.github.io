import { findProduct, findVariant, yen } from './catalog.js';
import { STORAGE_KEY, MAX_QUANTITY, readBag, saveBag, addItem, setQuantity, removeItem, totals } from './bag-store.js';

const root = document.body.dataset.root || './';
const initial = readBag();
let bag = initial.items;
let storageAvailable = initial.available;
const select = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const asset = image => new URL(`${root}assets/${image}`, location.href).href;

function storageNotice() {
  const notice = select('#storage-notice');
  if (notice) {
    notice.hidden = storageAvailable;
    notice.textContent = 'このブラウザではバッグを保存できません。このページを開いている間だけ保持します。';
  }
}
function updateHeader() {
  const { quantity } = totals(bag);
  all('[data-bag-count]').forEach(node => {
    node.textContent = String(quantity);
    const link = node.closest('a');
    if (link) link.setAttribute('aria-label', `バッグ（${quantity}点）`);
  });
  storageNotice();
}
function commit(next) {
  bag = next;
  storageAvailable = saveBag(bag);
  updateHeader();
}
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function status(text) { const target = select('#bag-status'); if (target) target.textContent = text; }

function renderBag(focusTarget) {
  const content = select('#bag-content');
  if (!content) return;
  content.replaceChildren();
  if (!bag.length) {
    const empty = node('div', 'bag-empty');
    empty.append(node('h2', '', 'バッグは空です。'), node('p', '', '気になるオブジェクトを、コレクションから選んでください。'));
    const link = node('a', 'button', 'コレクションを見る');
    link.href = `${root}collection/`;
    empty.append(link);
    content.append(empty);
  }
  for (const line of bag) {
    const { product, variant } = findVariant(line.variantId);
    const row = node('article', 'bag-item');
    row.dataset.variant = line.variantId;
    const imageLink = node('a', 'bag-item-image');
    imageLink.href = `${root}object/${product.id}/`;
    const image = node('img');
    image.src = asset(product.image); image.alt = product.alt; image.width = 400; image.height = 500;
    imageLink.append(image);
    const body = node('div', 'bag-item-body');
    const heading = node('h2');
    const link = node('a', '', product.name); link.href = imageLink.href; heading.append(link);
    body.append(heading, node('p', 'bag-item-meta', variant.label));
    const price = node('p', 'bag-item-price', `小計 ${yen(variant.price * line.quantity)}`);
    const quantity = node('div', 'quantity');
    const decrease = node('button', '', '−');
    decrease.type = 'button'; decrease.dataset.decrease = line.variantId;
    decrease.setAttribute('aria-label', `${product.name} ${variant.label} の数量を減らす`);
    decrease.disabled = line.quantity <= 1;
    const count = node('span', '', String(line.quantity));
    count.setAttribute('aria-label', `数量 ${line.quantity}`);
    const increase = node('button', '', '+');
    increase.type = 'button'; increase.dataset.increase = line.variantId;
    increase.setAttribute('aria-label', `${product.name} ${variant.label} の数量を増やす`);
    increase.disabled = line.quantity >= MAX_QUANTITY;
    quantity.append(decrease, count, increase);
    const remove = node('button', 'remove-item', '削除');
    remove.type = 'button'; remove.dataset.remove = line.variantId;
    remove.setAttribute('aria-label', `${product.name} ${variant.label} を削除`);
    body.append(quantity, remove); row.append(imageLink, body, price); content.append(row);
  }
  const summary = select('#bag-summary');
  if (summary) summary.hidden = !bag.length;
  const total = totals(bag);
  all('[data-bag-subtotal]').forEach(element => { element.textContent = yen(total.subtotal); });
  all('[data-bag-total]').forEach(element => { element.textContent = yen(total.total); });
  all('[data-bag-units]').forEach(element => { element.textContent = String(total.quantity); });
  if (focusTarget) {
    const row = [...content.querySelectorAll('[data-variant]')].find(element => element.dataset.variant === focusTarget.variantId);
    const target = row?.querySelector(`[data-${focusTarget.action}]:not(:disabled)`) || row?.querySelector('button:not(:disabled)') || content.querySelector('button:not(:disabled), a');
    target?.focus();
  }
}

select('#bag-content')?.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const action = ['decrease', 'increase', 'remove'].find(key => button.dataset[key]);
  if (!action) return;
  const variantId = button.dataset[action];
  const line = bag.find(item => item.variantId === variantId);
  if (!line) return;
  if (action === 'remove') { commit(removeItem(bag, variantId)); status('商品をバッグから削除しました。'); }
  else {
    const next = line.quantity + (action === 'increase' ? 1 : -1);
    commit(setQuantity(bag, variantId, next));
    status(next >= MAX_QUANTITY ? '同じ仕様の商品は10点まで選べます。' : '数量を変更しました。');
  }
  renderBag({ variantId, action });
});

const menuToggle = select('[data-menu-toggle]');
const menu = select('#mobile-menu');
function closeMenu() {
  if (menu) menu.hidden = true;
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'メニューを開く');
}
menuToggle?.addEventListener('click', () => {
  if (!menu) return;
  menu.hidden = !menu.hidden;
  menuToggle.setAttribute('aria-expanded', String(!menu.hidden));
  menuToggle.setAttribute('aria-label', menu.hidden ? 'メニューを開く' : 'メニューを閉じる');
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });

all('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  all('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  all('[data-product-card][data-category]').forEach(card => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
    if (!card.hidden) count++;
  });
  const result = select('#filter-result'); if (result) result.textContent = `${count}点のオブジェクト`;
}));

function openDialog(dialog) { if (dialog && !dialog.open) dialog.showModal(); }
all('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
all('[data-go-bag]').forEach(link => { link.href = `${root}bag/`; });
all('[data-concept-info]').forEach(button => button.addEventListener('click', () => openDialog(select('#concept-dialog'))));

all('[data-add-form]').forEach(form => {
  const product = findProduct(form.dataset.product);
  if (!product) return;
  function selectedVariant() {
    const checked = form.querySelector('input[name="variant"]:checked');
    return product.variants.find(variant => variant.id === checked?.value) || product.variants[0];
  }
  function updateVariant() {
    const variant = selectedVariant();
    const price = select('#product-price'); if (price) price.textContent = yen(variant.price);
    all('[data-selected-size]').forEach(element => { element.textContent = variant.label; });
  }
  form.addEventListener('change', updateVariant);
  updateVariant();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const variant = selectedVariant();
    const old = bag.find(line => line.variantId === variant.id);
    const message = select('#added-message');
    if (old?.quantity >= MAX_QUANTITY) {
      if (message) message.textContent = '同じ仕様の商品は10点まで選べます。';
      return;
    }
    commit(addItem(bag, variant.id));
    const name = select('[data-added-name]'); if (name) name.textContent = product.name;
    const label = select('[data-added-variant]'); if (label) label.textContent = variant.label;
    const image = select('[data-added-image]'); if (image) { image.src = asset(product.image); image.alt = product.alt; }
    if (message) message.textContent = `${product.name} ${variant.label} をバッグに追加しました。`;
    openDialog(select('#added-dialog'));
  });
});

window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  if (!storageAvailable) return;
  const next = readBag(); bag = next.items; storageAvailable = next.available;
  updateHeader(); renderBag();
});
const year = select('#year'); if (year) year.textContent = '2026';
updateHeader(); renderBag();
