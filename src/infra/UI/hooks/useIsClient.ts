"use client";
import { useSyncExternalStore } from "react";

const noop = () => {};
const emptySubscribe = () => noop;

/** Returns true after hydration. Avoids the setState-in-effect lint warning. */
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

