"use client";
import { useSyncExternalStore } from "react";
import { hasSeenAnimation, subscribeToSeenAnimations } from "./seenAnimations";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(listener: () => void): () => void {
  const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
  query?.addEventListener("change", listener);
  return () => query?.removeEventListener("change", listener);
}

/** `true` si el sistema pide reducir el movimiento. En el servidor se asume que no. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false,
    () => false,
  );
}

/**
 * Si este navegador ya vio la animación. En el servidor y durante la hidratación contesta `true`:
 * así nada arranca solo antes de saber de verdad que es la primera vez.
 */
export function useHasSeenAnimation(animationId: string): boolean {
  return useSyncExternalStore(
    subscribeToSeenAnimations,
    () => hasSeenAnimation(animationId),
    () => true,
  );
}
