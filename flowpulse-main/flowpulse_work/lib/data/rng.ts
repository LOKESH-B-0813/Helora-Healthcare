// Deterministic pseudo-random generator so server and client render identical
// mock data (avoids hydration mismatches). Mulberry32 — small, fast, stable.

export function createRng(seed: number) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer in [min, max] inclusive. */
export function rngInt(next: () => number, min: number, max: number) {
  return Math.floor(next() * (max - min + 1)) + min
}

/** Pick a random element. */
export function rngPick<T>(next: () => number, arr: readonly T[]): T {
  return arr[Math.floor(next() * arr.length)]
}

/** Weighted pick — weights need not sum to 1. */
export function rngWeighted<T>(
  next: () => number,
  entries: readonly (readonly [T, number])[],
): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let r = next() * total
  for (const [value, weight] of entries) {
    if (r < weight) return value
    r -= weight
  }
  return entries[entries.length - 1][0]
}
