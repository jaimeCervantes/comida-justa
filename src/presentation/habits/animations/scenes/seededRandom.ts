/**
 * Números pseudoaleatorios con semilla (mulberry32): el mismo «azar» en cada reproducción, para
 * que una exportación a video salga idéntica a lo que se ve en la web.
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) % 4294967296;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Una semilla estable a partir de un nombre: cada efecto tiene su propio azar, siempre el mismo. */
export function seedFrom(name: string): number {
  let hash = 2166136261;
  for (const character of name) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}
