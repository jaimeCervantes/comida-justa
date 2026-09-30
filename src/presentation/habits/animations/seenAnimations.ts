/**
 * Qué animaciones ya vio este navegador.
 *
 * Vive en `localStorage` y no en la cuenta porque a quien va dirigida la primera reproducción es a
 * alguien **nuevo**, que todavía no tiene cuenta. Cualquier fallo del almacenamiento (modo
 * privado, cookies bloqueadas) se lee como «ya vista»: si no se puede recordar, es preferible no
 * arrancar sola en cada visita.
 */
export const PILLAR_ANIMATION_SEEN_KEY_PREFIX = "pillarAnimations.seen.";

const listeners = new Set<() => void>();

function storageKey(animationId: string): string {
  return `${PILLAR_ANIMATION_SEEN_KEY_PREFIX}${animationId}`;
}

export function hasSeenAnimation(animationId: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(animationId)) !== null;
  } catch {
    return true;
  }
}

export function markAnimationSeen(animationId: string): void {
  try {
    window.localStorage.setItem(storageKey(animationId), "1");
  } catch {
    /* Sin almacenamiento no hay nada que recordar; la animación sigue funcionando. */
  }
  for (const listener of listeners) listener();
}

export function subscribeToSeenAnimations(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
