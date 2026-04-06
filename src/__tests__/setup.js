import '@testing-library/jest-dom'

// Node.js 25 ships a built-in `localStorage` on globalThis that is broken
// without the --localstorage-file flag. Replace it with an in-memory
// implementation so localStorage-dependent tests work under jsdom.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  const store = {}
  globalThis.localStorage = {
    setItem(key, value) { store[key] = String(value) },
    getItem(key) { return key in store ? store[key] : null },
    removeItem(key) { delete store[key] },
    clear() { Object.keys(store).forEach(k => delete store[k]) },
    get length() { return Object.keys(store).length },
    key(i) { return Object.keys(store)[i] ?? null },
  }
}
