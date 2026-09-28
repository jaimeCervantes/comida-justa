"use client";
import { useEffect, useState } from "react";

/**
 * - `idle`: no se ha pedido (o ya se soltó a propósito).
 * - `held`: el navegador no apagará la pantalla sola mientras la página esté a la vista.
 * - `unavailable`: el navegador no lo soporta o lo negó (ahorro de batería, política del sistema).
 */
export type WakeLockStatus = "idle" | "held" | "unavailable";

/**
 * Pide que la pantalla no se apague sola mientras `enabled` sea verdadero (Screen Wake Lock API).
 *
 * **El navegador lo suelta solo cuando la página deja de verse** —cambiar de app, de pestaña, o
 * apagar la pantalla con el botón—, así que al volver a estar visible se pide otra vez. No mantiene
 * nada en segundo plano: solo evita que la pantalla se apague por inactividad, que es lo que hacía
 * que una página abierta en el soporte de la moto dejara de funcionar a los 30 segundos.
 */
export function useScreenWakeLock(enabled: boolean): WakeLockStatus {
  const [status, setStatus] = useState<WakeLockStatus>("idle");

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    if (!("wakeLock" in navigator)) {
      setStatus("unavailable");
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async (): Promise<void> => {
      if (document.visibilityState !== "visible") return;

      try {
        const acquired = await navigator.wakeLock.request("screen");

        if (cancelled) {
          await acquired.release();
          return;
        }

        sentinel = acquired;
        setStatus("held");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, [enabled]);

  return status;
}
