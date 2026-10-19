import { findVariant } from './catalog.js';

export const STORAGE_KEY = 'maison-void-bag-v1';
export const MAX_QUANTITY = 10;

// Persist only variant IDs and counts. Prices and descriptions always come from the catalog.
export function normalizeBag(value) {
  if (!Array.isArray(value)) return [];
  const quantities = new Map();
  for (const line of value) {
    if (!line || typeof line.variantId !== 'string' || !findVariant(line.variantId)) continue;
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) continue;
    quantities.set(line.variantId, Math.min(MAX_QUANTITY, (quantities.get(line.variantId) || 0) + Math.min(MAX_QUANTITY, line.quantity)));
  }
  return [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export function addItem(items, variantId, quantity = 1) {
  return normalizeBag([...normalizeBag(items), { variantId, quantity }]);
}

export function setQuantity(items, variantId, quantity) {
  const bag = normalizeBag(items);
  if (quantity === 0) return removeItem(bag, variantId);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !findVariant(variantId)) return bag;
  return bag.map(line => line.variantId === variantId ? { variantId, quantity: Math.min(MAX_QUANTITY, quantity) } : line);
}

export function removeItem(items, variantId) {
  return normalizeBag(items).filter(line => line.variantId !== variantId);
}

export function totals(items) {
  return normalizeBag(items).reduce((result, line) => {
    const amount = findVariant(line.variantId).variant.price * line.quantity;
    return { quantity: result.quantity + line.quantity, subtotal: result.subtotal + amount, total: result.total + amount };
  }, { quantity: 0, subtotal: 0, total: 0 });
}

export function readBag(storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    const raw = target.getItem(STORAGE_KEY);
    if (raw === null) return { items: [], available: true };
    try { return { items: normalizeBag(JSON.parse(raw)), available: true }; }
    catch { return { items: [], available: true }; }
  } catch { return { items: [], available: false }; }
}

export function saveBag(items, storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    target.setItem(STORAGE_KEY, JSON.stringify(normalizeBag(items)));
    return true;
  } catch { return false; }
}
