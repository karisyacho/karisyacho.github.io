const MAX_QUANTITY = 9;

function validString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sameVariant(item, id, color) {
  return item.id === id && item.color === color;
}

function sameCartItem(item, id, color, size) {
  return sameVariant(item, id, color) && item.size === size;
}

function cleanCart(entries) {
  const cart = [];
  for (const { id, color, size, quantity } of entries.filter(Boolean)) {
    if (!validString(id) || !validString(color) || !validString(size) ||
        !Number.isInteger(quantity) || quantity < 1) continue;
    const existing = cart.find(item => sameCartItem(item, id, color, size));
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY);
    } else {
      cart.push({ id, color, size, quantity: Math.min(quantity, MAX_QUANTITY) });
    }
  }
  return cart;
}

function cleanFavorites(entries) {
  const favorites = [];
  for (const { id, color } of entries.filter(Boolean)) {
    if (!validString(id) || !validString(color)) continue;
    if (favorites.some(item => sameVariant(item, id, color))) continue;
    favorites.push({ id, color });
  }
  return favorites;
}

function createStore(key, clean) {
  let snapshot = '[]';
  let canPersist = true;

  return {
    read() {
      if (canPersist) {
        try {
          snapshot = globalThis.localStorage.getItem(key) ?? '[]';
        } catch {
          canPersist = false;
        }
      }
      try {
        const entries = JSON.parse(snapshot);
        return Array.isArray(entries) ? clean(entries) : [];
      } catch {
        return [];
      }
    },
    write(entries) {
      snapshot = JSON.stringify(entries);
      if (canPersist) {
        try {
          globalThis.localStorage.setItem(key, snapshot);
        } catch {
          canPersist = false;
        }
      }
      return entries;
    }
  };
}

const cartStore = createStore('volt.cart', cleanCart);
const favoriteStore = createStore('volt.favorites', cleanFavorites);

export function readCart() {
  return cartStore.read();
}

export function addItem({ id, color, size } = {}) {
  const cart = readCart();
  if (!validString(id) || !validString(color) || !validString(size)) return cart;
  const existing = cart.find(item => sameCartItem(item, id, color, size));
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, MAX_QUANTITY);
  } else {
    cart.push({ id, color, size, quantity: 1 });
  }
  return cartStore.write(cart);
}

export function setItemQuantity(id, color, size, quantity) {
  const cart = readCart();
  const index = cart.findIndex(item => sameCartItem(item, id, color, size));
  if (index === -1 || !Number.isInteger(quantity) || quantity < 0) return cart;
  if (quantity === 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = Math.min(quantity, MAX_QUANTITY);
  }
  return cartStore.write(cart);
}

export function clearCart() {
  return cartStore.write([]);
}

export function readFavorites() {
  return favoriteStore.read();
}

export function toggleFavorite(id, color) {
  const favorites = readFavorites();
  if (!validString(id) || !validString(color)) return favorites;
  const index = favorites.findIndex(item => sameVariant(item, id, color));
  if (index === -1) {
    favorites.push({ id, color });
  } else {
    favorites.splice(index, 1);
  }
  return favoriteStore.write(favorites);
}
