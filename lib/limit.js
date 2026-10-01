const m = new Map();
export function limited(k, max = 10, win = 15 * 60 * 1000) {
  const n = Date.now(), a = (m.get(k) || []).filter(t => n - t < win);
  a.push(n); m.set(k, a); return a.length > max;
}
