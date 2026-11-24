import { angles, articles, colors, craftsmanship, products, sizes, story, technology } from './catalog.mjs';
import { addItem, clearCart, readCart, readFavorites, setItemQuantity, toggleFavorite } from './shop.mjs';

const main = document.querySelector('#main');
const header = document.querySelector('#header');
const footer = document.querySelector('#footer');
const overlay = document.querySelector('#overlay');
const toast = document.querySelector('#toast');
const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });
const productById = new Map(products.map(product => [product.id, product]));
const paths = ['home', 'collection', 'product', 'our-story', 'technology', 'craftsmanship', 'lookbook', 'journal', 'article', 'contact', 'cart', 'checkout'];
const navigation = [
  ['collection', 'Collection'], ['our-story', 'Our Story'], ['technology', 'Technology'],
  ['craftsmanship', 'Craftsmanship'], ['lookbook', 'Lookbook'], ['journal', 'Journal'],
];
const iconPaths = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  diagonal: '<path d="M5 19 19 5M5 5h14v14"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  next: '<path d="m10 6 6 6-6 6"/>',
  menu: '<path d="M2 8h20M2 16h20"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
  bag: '<path d="M5 8h14l1.5 13h-17zM9 9V6a3 3 0 1 1 6 0v3"/>',
  heart: '<path d="M12 20 4.7 13a4.6 4.6 0 0 1 7.3-5.4 4.6 4.6 0 0 1 7.3 5.4z"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  expand: '<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;
const url = (page = 'home', slug = '') => page === 'home' ? '#/' : `#/${page}${slug ? '/' + slug : ''}`;
const image = (name, className = '', alt = '', priority = 'lazy') =>
  `<img src="assets/${name}.webp" class="${className}" alt="${alt}" ${priority === true ? 'fetchpriority="high"' : `loading="${priority}"`} decoding="async">`;
const action = (label, href, style = 'solid') => `<a class="action action--${style}" href="${href}">${label}${icon('arrow')}</a>`;
const circle = (name, label) => `<span class="circle" aria-hidden="true">${icon(name)}</span><span class="sr">${label}</span>`;
const brand = () => `<a class="wordmark" href="${url()}" aria-label="VOLT. ホーム">VOLT<span>.</span></a>`;
const visibleCart = () => readCart().filter(item => productById.get(item.id)?.colors.includes(item.color) && sizes.includes(item.size));
const format = amount => yen.format(amount);
const total = items => items.reduce((sum, item) => sum + productById.get(item.id).price * item.quantity, 0);
const thumbAsset = (product, color) => product.id === 'orbit' ? `orbit-side-${color}` : product.shot;
let routeKey = '';
let productState;
let lookIndex = 0;
let journalFilter = 'ALL';
let confirmation = null;
let toastTimer;

function getRoute() {
  const [page = 'home', slug = ''] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { page: paths.includes(page) ? page : 'missing', slug };
}

function updateCount() {
  const count = visibleCart().reduce((sum, item) => sum + item.quantity, 0);
  const badge = header.querySelector('.bag-count');
  badge.textContent = count || '';
  badge.hidden = count === 0;
  badge.parentElement.setAttribute('aria-label', `カート（${count}点）`);
}

function renderChrome(page) {
  const home = page === 'home';
  const active = { product: 'collection', article: 'journal' }[page] || page;
  header.classList.toggle('header--home', home);
  header.innerHTML = `${brand()}<nav class="desktop-nav" aria-label="メインメニュー">
    ${navigation.map(([key, label]) => `<a href="${url(key)}" ${active === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav><div class="header-tools">
    <button class="icon-btn search-button" type="button" data-overlay="search" aria-label="商品を検索">${icon('search')}</button>
    <a class="icon-btn bag-button" href="${url('cart')}" aria-label="カート">${icon('bag')}<span class="bag-count" hidden></span></a>
    <button class="icon-btn menu-button" type="button" data-overlay="menu" aria-label="メニュー">${icon('menu')}</button>
  </div>`;
  footer.innerHTML = `<div class="foot"><div>${brand()}<p>MOVE BEYOND.</p></div>
    <nav aria-label="フッターメニュー">
      ${[...navigation, ['contact', 'Contact']].map(([key, label]) => `<a href="${url(key)}">${label}</a>`).join('')}
    </nav>
    <small>© VOLT. 架空のフットウェアブランド</small></div>`;
  updateCount();
}

function homePage() {
  return `<section class="hero" aria-labelledby="hero-title">
    ${image('hero-ribbon', 'hero-ribbon', '', true)}
    <h1 class="hero-title" id="hero-title" lang="en"><span>MOVE</span><span>BEYOND.</span></h1>
    ${image('orbit-hero', 'hero-shoe', 'ライム色のソールを備えた白いORBIT', true)}
    <div class="hero-action">${action('Explore collection', url('collection'), 'outline')}</div>
    <a class="hero-caption" href="${url('product', 'orbit')}">V-01 / ORBIT ${icon('diagonal')}</a>
  </section>
  <section class="home-products" aria-labelledby="home-products-title">
    <div class="section-heading"><h2 id="home-products-title">COLLECTION</h2>${action('View all', url('collection'), 'text')}</div>
    <div class="collection-grid collection-grid--home">${products.slice(0, 3).map(productCard).join('')}</div>
  </section>
  <section class="home-editorial">
    <a href="${url('technology')}">${image('reference-tech')}<h2>TECHNOLOGY</h2>${circle('diagonal', '技術を見る')}</a>
    <a href="${url('our-story')}">${image('reference-run')}<h2>OUR STORY</h2>${circle('diagonal', 'ブランドの成り立ちを読む')}</a>
  </section>`;
}

function productCard(product) {
  const light = ['nexus', 'flux'].includes(product.id);
  return `<a class="product-card product-card--${product.id} ${light ? 'product-card--light' : ''}" href="${url('product', product.id)}">
    ${image(product.shot, 'product-card-photo', '', true)}
    <div class="product-card-label"><span>${product.code}</span><h2>${product.name}</h2>${circle('arrow', `${product.name}の商品詳細`)}</div>
  </a>`;
}

function collectionPage() {
  return `<section class="collection-page">
    <div class="collection-title"><h1>COLLECTION</h1><span aria-hidden="true">${icon('diagonal')}</span></div>
    <div class="collection-grid">${products.map(productCard).join('')}<div class="collection-detail">${image('reference-structure')}</div></div>
  </section>`;
}

function productAsset(product, color, angle) {
  if (product.id !== 'orbit') return product.shot;
  if (angle === 'hero' && color === 'bone') return 'orbit-hero';
  return `orbit-${angle}-${color}`;
}

function stageImage(product, color, index, className = 'viewer-image') {
  const angle = angles[index];
  return image(productAsset(product, color, angle.id), className,
    `${product.name}、${colors[color].name}、${product.id === 'orbit' ? angle.label : '商品写真'}`, true);
}

function productPage(product) {
  const isOrbit = product.id === 'orbit';
  productState = { product, color: product.colors[0], size: '', index: 0 };
  return `<section class="product-page">
    <div class="product-visual ${isOrbit ? 'product-visual--orbit' : ''}">
      <div class="viewer" id="viewer" ${isOrbit ? 'tabindex="0" role="group" aria-label="商品ギャラリー。左右矢印キーで角度を切り替え"' : ''}>
        <div class="viewer-backdrop"></div>
        <div class="viewer-frame" id="viewer-frame">${stageImage(product, productState.color, 0)}</div>
        ${isOrbit ? `<button type="button" class="icon-btn viewer-nav viewer-prev" data-step="-1" aria-label="前の角度">${icon('back')}</button>
        <button type="button" class="icon-btn viewer-nav viewer-next" data-step="1" aria-label="次の角度">${icon('next')}</button>
        <span class="viewer-caption"><span id="view-index">01</span> / 05 <span>｜</span> ドラッグで角度を切替</span>` : ''}
        <button type="button" class="icon-btn zoom-button" data-overlay="zoom" aria-label="商品画像を拡大">${icon('expand')}</button>
      </div>
      ${isOrbit ? `<div class="thumbs" id="thumbs" aria-label="角度を選ぶ">
        ${angles.map((angle, i) => `<button type="button" data-angle="${i}" aria-label="${angle.label}" aria-pressed="${i === 0}">${image(productAsset(product, productState.color, angle.id), '', '', 'eager')}</button>`).join('')}
      </div>` : ''}
    </div>
    <div class="product-info">
      <a class="crumb" href="${url('collection')}">${icon('back')} Collection</a>
      <p class="product-code">VOLT. ${product.code}</p><h1>${product.name}</h1>
      <p class="product-price">${format(product.price)}</p>
      <p class="product-use">${product.use}</p>
      <form id="product-form">
        <fieldset><legend>COLOR <span id="color-name" aria-live="polite">${colors[productState.color].name}</span></legend>
          <div class="swatches">${product.colors.map(color => `<label title="${colors[color].name}"><input type="radio" name="color" value="${color}" ${color === productState.color ? 'checked' : ''}><span class="swatch" style="--swatch:${colors[color].hex}"><span class="sr">${colors[color].name}</span></span></label>`).join('')}</div>
        </fieldset>
        <fieldset>
          <legend>SIZE <span>CM</span></legend>
          <div class="sizes">${sizes.map(size => `<label><input type="radio" name="size" value="${size}" required><span>${size}</span></label>`).join('')}</div>
        </fieldset>
        <div class="product-actions"><button class="action action--solid" type="submit">Add to cart${icon('arrow')}</button>
        <button class="icon-btn save-button" type="button" aria-label="お気に入りに保存" aria-pressed="false" id="save-button">${icon('heart')}</button></div>
      </form>
      <p class="product-lead">${product.lead}</p>
      <details class="product-spec"><summary>主な仕様 ${icon('plus')}</summary><ul>${product.parts.map(part => `<li>${part}</li>`).join('')}</ul></details>
    </div>
  </section>
  ${isOrbit ? `<section class="detail-strip" aria-label="ORBITの素材と構造">${technology.map(([label, title, , src]) => `<a href="${url('technology')}">${image(src, '', title)}<span>${label}${icon('diagonal')}</span></a>`).join('')}</section>` : ''}`;
}

function updateFavorite() {
  const { product, color } = productState;
  const selected = readFavorites().some(item => item.id === product.id && item.color === color);
  const button = main.querySelector('#save-button');
  button.setAttribute('aria-pressed', selected);
  button.setAttribute('aria-label', selected ? 'お気に入りから削除' : 'お気に入りに保存');
}

function changeView(index, refreshThumbs = false) {
  const { product, color } = productState;
  productState.index = (index + angles.length) % angles.length;
  const frame = main.querySelector('#viewer-frame');
  const next = document.createElement('template');
  next.innerHTML = stageImage(product, color, productState.index);
  const shot = next.content.firstElementChild;
  const previous = frame.firstElementChild;
  if (previous.src === shot.src) return;
  frame.replaceChildren(shot);
  frame.classList.remove('viewer-frame--hero');
  if (productState.index === 0) frame.classList.add('viewer-frame--hero');
  const counter = main.querySelector('#view-index');
  if (!counter) return;
  counter.textContent = String(productState.index + 1).padStart(2, '0');
  for (const button of main.querySelectorAll('[data-angle]')) {
    const angle = Number(button.dataset.angle);
    button.setAttribute('aria-pressed', angle === productState.index);
    if (refreshThumbs) button.querySelector('img').src = `assets/${productAsset(product, color, angles[angle].id)}.webp`;
  }
}

function setupProduct() {
  const form = main.querySelector('#product-form');
  let startX = null;
  const viewer = main.querySelector('#viewer');
  viewer.querySelector('.viewer-frame').classList.add('viewer-frame--hero');
  updateFavorite();
  form.addEventListener('change', event => {
    if (event.target.name === 'size') productState.size = event.target.value;
    if (event.target.name !== 'color') return;
    productState.color = event.target.value;
    main.querySelector('#color-name').textContent = colors[productState.color].name;
    changeView(productState.index, true);
    updateFavorite();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const { product, color, size } = productState;
    if (!size) return;
    const before = visibleCart().find(item => item.id === product.id && item.color === color && item.size === size);
    if (before?.quantity === 9) {
      announce('この組み合わせは9点まで追加できます。');
      return;
    }
    addItem({ id: product.id, color, size });
    updateCount();
    openOverlay('added');
  });
  main.querySelector('#save-button').addEventListener('click', () => {
    const { product, color } = productState;
    toggleFavorite(product.id, color);
    updateFavorite();
    announce(main.querySelector('#save-button').getAttribute('aria-pressed') === 'true' ? 'お気に入りに保存しました。' : 'お気に入りから削除しました。');
  });
  if (productState.product.id !== 'orbit') return;
  viewer.addEventListener('dragstart', event => event.preventDefault());
  viewer.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || event.button !== 0) return;
    startX = event.clientX;
    viewer.setPointerCapture(event.pointerId);
  });
  viewer.addEventListener('pointerup', event => {
    if (startX !== null && Math.abs(event.clientX - startX) > 35) {
      changeView(productState.index + (event.clientX < startX ? 1 : -1));
    }
    startX = null;
  });
  viewer.addEventListener('pointercancel', () => { startX = null; });
  viewer.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    changeView(productState.index + (event.key === 'ArrowLeft' ? -1 : 1));
  });
}

function editorialHero(title, src, className, subtitle = '') {
  return `<section class="editorial-hero editorial-hero--${className}">
    ${image(src, 'editorial-hero-image', '', true)}
    <h1>${title}</h1><div class="editorial-sub">${subtitle || '<i></i>'}</div>
  </section>`;
}

function bands(rows) {
  return `<div class="editorial-bands">${rows.map(([label, title, prose, src], i) => `<section class="editorial-band editorial-band--${i % 2}">
    ${image(src, 'editorial-band-image')}<div class="editorial-band-text"><h2>${label}</h2><i></i><h3>${title}</h3><p>${prose}</p></div>
  </section>`).join('')}</div>`;
}

function storyPage() {
  return editorialHero('OUR<br>STORY', 'reference-story', 'story') + bands(story) +
    `<div class="editorial-end">${action('Explore collection', url('collection'))}</div>`;
}

function technologyPage() {
  return editorialHero('TECH<br>NOLOGY', 'reference-tech', 'technology', 'MOVE BEYOND.') +
    `<section class="tech-cards" aria-label="ORBITの技術">${technology.map(([label, title, prose, src]) =>
      `<details>${image(src)}<summary><span>${label}</span>${icon('plus')}</summary><div><h2>${title}</h2><p>${prose}</p></div></details>`).join('')}</section>
    <section class="construction"><div class="construction-visual"><h2>CONSTRUCTION</h2>${image('reference-construction', '', 'アッパー、クッション、フレーム、アウトソールを分解したORBITの構造図')}</div>
      <div class="construction-text"><h3>ORBITの断面を見る</h3><ol><li>メッシュアッパー</li><li>インソール</li><li>クッション</li><li>フレームソール</li><li>ラバーアウトソール</li></ol>${action('View ORBIT', url('product', 'orbit'), 'outline')}</div>
    </section>`;
}

function craftPage() {
  return editorialHero('CRAFTS<br>MANSHIP', 'reference-craft', 'craft') + bands(craftsmanship);
}

const looks = [
  { src: 'reference-origin', title: 'First Light', titleJa: '朝の空気', product: 'orbit' },
  { src: 'reference-run', title: 'Loose Ground', titleJa: '岩と砂利の道', product: 'rift' },
  { src: 'reference-story', title: 'Above the City', titleJa: '街の外へ', product: 'orbit' },
];

function lookbookPage() {
  return `<section class="lookbook">
    <div class="section-heading"><h1>LOOKBOOK</h1></div>
    <div class="look-grid"><div id="look-feature" class="look-feature"></div>
    <div class="look-options" aria-label="写真を選ぶ">${looks.map(({ src, title }, i) => `<button type="button" data-look="${i}" aria-pressed="${i === lookIndex}">${image(src)}<span>${title}</span></button>`).join('')}</div></div>
  </section>`;
}

function setLook(index) {
  lookIndex = index;
  const { src, title, titleJa, product } = looks[index];
  main.querySelector('#look-feature').innerHTML = `${image(src, '', titleJa, true)}<div><p>${titleJa}</p><h2>${title}</h2>${action(`View ${productById.get(product).name}`, url('product', product), 'outline')}</div>`;
  for (const button of main.querySelectorAll('[data-look]')) button.setAttribute('aria-pressed', Number(button.dataset.look) === index);
}

function journalPage() {
  return `<section class="journal"><div class="section-heading"><h1>JOURNAL</h1>
    <div class="journal-filters" aria-label="記事の絞り込み">${['ALL', 'DESIGN', 'FIELD', 'STUDIO'].map(filter => `<button type="button" data-filter="${filter}" aria-pressed="${journalFilter === filter}">${filter}</button>`).join('')}</div></div>
    <div class="journal-grid" id="journal-grid"></div></section>`;
}

function setJournal(filter) {
  journalFilter = filter;
  for (const button of main.querySelectorAll('[data-filter]')) button.setAttribute('aria-pressed', button.dataset.filter === filter);
  main.querySelector('#journal-grid').innerHTML = articles.filter(article => filter === 'ALL' || article.category === filter).map(article =>
    `<a class="journal-card" href="${url('article', article.id)}">${image(article.image)}<div><p class="eyebrow">${article.category} / ${article.date}</p><h2>${article.title}</h2><p>${article.ja}</p>${circle('diagonal', '記事を読む')}</div></a>`).join('');
}

function articlePage(article) {
  return `<article class="article-page">
    <header class="article-hero">${image(article.image, '', '', true)}<div>
      <a class="crumb" href="${url('journal')}">${icon('back')} Journal</a>
      <p class="eyebrow">${article.category} / ${article.date}</p><h1>${article.title}</h1></div>
    </header>
    <div class="article-body"><h2>${article.ja}</h2>
    ${article.body.map(([title, prose]) => `<section><h3>${title}</h3><p>${prose}</p></section>`).join('')}
    ${action('Back to journal', url('journal'), 'text')}</div>
  </article>`;
}

function contactPage() {
  return `<section class="form-page contact-page">
    <div><h1>CONTACT</h1><p>サイズ選び、シューズの仕様、VOLT.への取材について。</p><p class="form-note">このフォームはサイトの操作見本です。</p></div>
    <form id="contact-form" class="form-fields">
      <label>お名前<input name="name" autocomplete="name" required maxlength="100"></label>
      <label>メールアドレス<input name="email" type="email" autocomplete="email" required maxlength="160"></label>
      <label class="form-wide">お問い合わせの種類<select name="topic" required><option value="">選択してください</option><option>商品・サイズ</option><option>取材・コラボレーション</option><option>その他</option></select></label>
      <label class="form-wide">お問い合わせ内容<textarea name="message" rows="5" required maxlength="2000"></textarea></label>
      <button class="action action--solid form-wide" type="submit">入力内容を確認${icon('arrow')}</button>
    </form>
  </section>`;
}

function orderSummary(items, link = true) {
  return `<aside class="order-summary"><h2>ORDER SUMMARY</h2><dl>
    <div><dt>小計</dt><dd>${format(total(items))}</dd></div><div><dt>送料</dt><dd>${format(0)}</dd></div>
    <div class="order-total"><dt>合計 <small>税込</small></dt><dd>${format(total(items))}</dd></div></dl>
    ${link ? action('Proceed to checkout', url('checkout')) : ''}</aside>`;
}

function cartItem(item, index) {
  const product = productById.get(item.id);
  return `<li class="cart-line">
    <a class="cart-photo" href="${url('product', product.id)}" aria-label="${product.name}の商品詳細">${image(thumbAsset(product, item.color))}</a>
    <div class="cart-item-info"><a href="${url('product', product.id)}">${product.name}</a><p>${colors[item.color].name} / ${item.size} cm</p></div>
    <div class="quantity" aria-label="${product.name}の数量">
      <button class="icon-btn" type="button" data-qty="${index}" data-delta="-1" aria-label="${product.name}を1点減らす" ${item.quantity === 1 ? 'disabled' : ''}>${icon('minus')}</button>
      <span>${item.quantity}</span>
      <button class="icon-btn" type="button" data-qty="${index}" data-delta="1" aria-label="${product.name}を1点増やす" ${item.quantity === 9 ? 'disabled' : ''}>${icon('plus')}</button>
    </div>
    <strong>${format(product.price * item.quantity)}</strong>
    <button class="icon-btn cart-remove" type="button" data-qty="${index}" data-delta="0" aria-label="${product.name}を削除">${icon('close')}</button>
  </li>`;
}

function cartPage() {
  const items = visibleCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return `<section class="shop-page cart-page">
    <h1>CART${count ? ` <sup>(${count})</sup>` : ''}</h1>
    ${items.length ? `<div class="shop-grid"><div><ul class="cart-list">${items.map(cartItem).join('')}</ul>
    ${action('Continue shopping', url('collection'), 'text')}</div>${orderSummary(items)}</div>` :
      `<div class="empty"><p>カートに商品が入っていません。</p>${action('Explore collection', url('collection'))}</div>`}
  </section>`;
}

function checkoutPage() {
  const items = visibleCart();
  if (confirmation) return `<section class="shop-page checkout-page"><h1>CHECKOUT</h1>
      <div class="empty confirmation">${icon('check')}<h2>デモ注文が完了しました</h2>
      <p>${confirmation.count}点 / ${format(confirmation.amount)}</p><p>実際の決済や配送は発生しません。</p>
      ${action('Back to collection', url('collection'))}</div></section>`;
  if (!items.length) return `<section class="shop-page checkout-page"><h1>CHECKOUT</h1><div class="empty"><p>カートに商品を追加してください。</p>${action('Explore collection', url('collection'))}</div></section>`;
  return `<section class="shop-page checkout-page"><h1>CHECKOUT</h1>
    <div class="shop-grid"><form id="checkout-form" class="form-fields">
      <h2 class="form-wide">配送先情報</h2><p class="form-note form-wide">操作見本のため、架空の氏名・住所で試せます。</p>
      <label>お名前<input name="name" required maxlength="100"></label>
      <label>メールアドレス<input name="email" type="email" required maxlength="160"></label>
      <label>郵便番号<input name="postal" inputmode="numeric" placeholder="000-0000" pattern="[0-9]{3}-?[0-9]{4}" title="7桁の数字" required maxlength="8"></label>
      <label>都道府県<input name="prefecture" required maxlength="20"></label>
      <label class="form-wide">市区町村・番地<input name="address" required maxlength="150"></label>
      <button class="action action--solid form-wide" type="submit">デモ注文を確定${icon('arrow')}</button>
      <a class="crumb form-wide" href="${url('cart')}">${icon('back')} カートへ戻る</a>
    </form>
    <div><ul class="checkout-items">${items.map(item => {
      const product = productById.get(item.id);
      return `<li>${image(thumbAsset(product, item.color))}<span><b>${product.name}</b><small>${colors[item.color].name} / ${item.size} cm × ${item.quantity}</small></span><strong>${format(product.price * item.quantity)}</strong></li>`;
    }).join('')}</ul>${orderSummary(items, false)}</div></div></section>`;
}

function missingPage() {
  return `<section class="shop-page"><h1>PAGE NOT FOUND</h1><div class="empty"><p>お探しのページが見つかりません。</p>${action('Back to home', url())}</div></section>`;
}

function announce(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('toast--visible');
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2700);
}

function productRow(product, color = product.colors[0]) {
  return `<a class="search-row" href="${url('product', product.id)}">${image(thumbAsset(product, color))}<span><b>${product.name}</b><small>${product.code} / ${colors[color].name}</small></span>${icon('diagonal')}</a>`;
}

function showOverlay(title, body, className = '') {
  overlay.className = `overlay ${className}`;
  overlay.innerHTML = `<div class="overlay-inner"><div class="overlay-head"><h2 id="overlay-title">${title}</h2>
    <form method="dialog"><button class="icon-btn" aria-label="閉じる">${icon('close')}</button></form></div>${body}</div>`;
  if (!overlay.open) overlay.showModal();
}

function openOverlay(kind) {
  if (kind === 'menu') {
    showOverlay('MENU', `<nav class="menu-links" aria-label="すべてのメニュー">
      ${[...navigation, ['contact', 'Contact'], ['cart', 'Cart']].map(([key, label]) => `<a href="${url(key)}">${label}${icon('diagonal')}</a>`).join('')}
      <button type="button" data-overlay="favorites">Favorites${icon('heart')}</button>
      <button type="button" data-overlay="search">Search${icon('search')}</button>
    </nav>`, 'overlay--menu');
  }
  if (kind === 'search') {
    showOverlay('SEARCH', `<label class="search-field"><span class="sr">商品名を入力</span>
      <input type="search" placeholder="ORBIT、ランニングなど" id="search-input" autofocus></label>
      <div id="search-results" class="search-results" aria-live="polite"></div>`);
    const input = overlay.querySelector('#search-input');
    function updateResults() {
      const query = input.value.trim().toLowerCase();
      const matched = products.filter(product => `${product.name} ${product.code} ${product.use} ${product.lead}`.toLowerCase().includes(query));
      overlay.querySelector('#search-results').innerHTML = matched.length ? matched.map(product => productRow(product)).join('') : '<p>該当する商品が見つかりません。</p>';
    }
    input.addEventListener('input', updateResults);
    updateResults();
    input.focus();
  }
  if (kind === 'favorites') {
    const saved = readFavorites().filter(({ id, color }) => productById.get(id)?.colors.includes(color));
    showOverlay('FAVORITES', `<div class="search-results">${saved.length ? saved.map(({ id, color }) => productRow(productById.get(id), color)).join('') : '<p>お気に入りに保存した商品がありません。</p>'}</div>`);
    overlay.querySelector('button').focus();
  }
  if (kind === 'zoom' && productState) {
    const { product, color, index } = productState;
    showOverlay(`${product.name} / ${colors[color].name}`, stageImage(product, color, index, 'zoom-image'), 'overlay--zoom');
  }
  if (kind === 'added' && productState) {
    const { product, color, size } = productState;
    showOverlay('ADDED TO CART', `<div class="added-product">${image(thumbAsset(product, color))}<div><strong>${product.name}</strong><p>${colors[color].name} / ${size} cm</p><p>${format(product.price)}</p></div></div>
      <div class="added-actions">${action('View cart', url('cart'))}<form method="dialog"><button class="action action--outline">Continue shopping</button></form></div>`);
  }
}

function wirePage(page) {
  if (page === 'product' && productState) setupProduct();
  if (page === 'lookbook') setLook(lookIndex);
  if (page === 'journal') setJournal(journalFilter);
  main.querySelector('#contact-form')?.addEventListener('submit', event => {
    event.preventDefault();
    showOverlay('入力内容を確認しました', '<p class="form-note">フォームの入力チェックが完了しました。操作見本のため、内容は送信されません。</p>');
  });
  main.querySelector('#checkout-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const items = visibleCart();
    if (!items.length) return;
    confirmation = { count: items.reduce((sum, item) => sum + item.quantity, 0), amount: total(items) };
    clearCart();
    render(true);
    main.querySelector('h1').focus();
  });
}

function render(force = false, moveFocus = false) {
  const { page, slug } = getRoute();
  const key = page + '/' + slug;
  if (!force && routeKey === key) return;
  if (page !== 'checkout') confirmation = null;
  if (overlay.open) overlay.close();
  routeKey = key;
  productState = null;
  const product = productById.get(slug);
  const article = articles.find(entry => entry.id === slug);
  const views = {
    home: homePage, collection: collectionPage, product: () => product ? productPage(product) : missingPage(),
    'our-story': storyPage, technology: technologyPage, craftsmanship: craftPage, lookbook: lookbookPage,
    journal: journalPage, article: () => article ? articlePage(article) : missingPage(), contact: contactPage,
    cart: cartPage, checkout: checkoutPage, missing: missingPage,
  };
  renderChrome(page);
  main.innerHTML = views[page]();
  const heading = main.querySelector('h1');
  heading.tabIndex = -1;
  const title = page === 'home' ? 'MOVE BEYOND.' : heading.innerText.replace(/\s+/g, ' ').trim();
  document.title = `${title} — VOLT.`;
  wirePage(page);
  if (moveFocus) {
    window.scrollTo(0, 0);
    heading.focus({ preventScroll: true });
  }
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('button[data-overlay]');
  if (trigger) openOverlay(trigger.dataset.overlay);
  if (event.target.closest('.skip')) {
    event.preventDefault();
    main.focus();
  }
});

main.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const { angle, step, look, filter, qty, delta } = button.dataset;
  if (angle !== undefined) changeView(Number(angle));
  if (step !== undefined) changeView(productState.index + Number(step));
  if (look !== undefined) setLook(Number(look));
  if (filter !== undefined) setJournal(filter);
  if (qty === undefined) return;
  const item = visibleCart()[Number(qty)];
  if (!item) return;
  const quantity = delta === '0' ? 0 : item.quantity + Number(delta);
  setItemQuantity(item.id, item.color, item.size, quantity);
  render(true);
  const next = main.querySelector(`[data-qty="${qty}"][data-delta="${delta}"]:not(:disabled)`);
  (next || main.querySelector('.cart-remove, .empty .action'))?.focus({ preventScroll: true });
  announce(quantity ? '数量を更新しました。' : 'カートから削除しました。');
});

overlay.addEventListener('click', event => {
  if (event.target === overlay || event.target.closest('a')) overlay.close();
});

window.addEventListener('hashchange', () => render(false, true));
window.addEventListener('storage', () => {
  if (['cart', 'checkout'].includes(getRoute().page)) render(true);
  else updateCount();
  if (productState) updateFavorite();
});
render();
