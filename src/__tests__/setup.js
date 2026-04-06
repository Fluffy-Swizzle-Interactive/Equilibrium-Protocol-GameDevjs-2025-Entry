import '@testing-library/jest-dom'

// Node 25+ ships a built-in `localStorage` that is broken without --localstorage-file.
// Replace it with a reliable in-memory implementation whenever the native one is
// missing, incomplete, or throws at runtime (probe with an actual set/get round-trip).
const store = {}
const inMemoryLocalStorage = {
  setItem(key, value) { store[key] = String(value) },
  getItem(key) { return key in store ? store[key] : null },
  removeItem(key) { delete store[key] },
  clear() { Object.keys(store).forEach(k => delete store[k]) },
  get length() { return Object.keys(store).length },
  key(i) { return Object.keys(store)[i] ?? null },
}

let shouldReplace =
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage.setItem !== 'function' ||
  typeof globalThis.localStorage.getItem !== 'function' ||
  typeof globalThis.localStorage.removeItem !== 'function'

if (!shouldReplace) {
  const probeKey = '__test_localStorage_probe__'
  try {
    globalThis.localStorage.setItem(probeKey, 'ok')
    if (globalThis.localStorage.getItem(probeKey) !== 'ok') shouldReplace = true
    globalThis.localStorage.removeItem(probeKey)
  } catch {
    shouldReplace = true
  }
}

if (shouldReplace) {
  globalThis.localStorage = inMemoryLocalStorage
}
