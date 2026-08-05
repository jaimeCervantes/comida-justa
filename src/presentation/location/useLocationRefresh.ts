"use client";
import { useEffect, useRef } from "react";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import {
  needsRefresh,
  RECHECK_AFTER_MS,
  type VisitorFix,
} from "~/domain/entities/seller/locationFreshness";
import { refreshLocation } from "./actions";

/**
 * Cómo se le pide la posición al navegador cuando nadie ha apretado nada.
 *
 * `maximumAge` deja que entregue su propia posición cacheada si es reciente: respuesta instantánea,
 * sin encender el GPS y sin gastar batería. `enableHighAccuracy: false` porque a escala de "¿a
 * cuántos kilómetros está esta tienda?" la precisión de red y wifi sobra, y la buena cuesta
 * segundos y batería. El `timeout` evita que un GPS que no contesta deje la comprobación colgada.
 */
const POSITION_OPTIONS: PositionOptions = {
  maximumAge: 5 * 60 * 1000,
  timeout: 8_000,
  enableHighAccuracy: false,
};

/**
 * Vuelve a detectar dónde está quien mira, sin pedirle nada.
 *
 * La app pedía la ubicación **una sola vez** y la guardaba un año. Quien se movía —al trabajo, de
 * viaje, a otro estado— seguía leyendo distancias medidas desde donde estuvo la primera vez.
 *
 * El permiso de geolocalización lo guarda el navegador **por origen, no por sesión**: una vez
 * concedido a este dominio, `getCurrentPosition` ya no vuelve a abrir el diálogo. Eso es lo que
 * permite preguntar cuantas veces haga falta sin molestar. Por eso el orden es siempre **permiso
 * primero, posición después**: si el permiso no está concedido no se pregunta nada, porque
 * preguntarlo abriría el diálogo sin que nadie lo pidiera —lo que Chrome penaliza y lo que en móvil
 * lleva a la gente a bloquear el permiso para siempre—. Para ese caso está el botón, que es a clic.
 *
 * Se mira al montar (una carga completa) y al volver a la pestaña, que es el caso "cerré la laptop
 * en casa y la abrí en el trabajo": sin lo segundo, una pestaña que nunca se recarga conserva la
 * ubicación de ayer.
 *
 * Y se **escribe** solo si la lectura dice algo distinto (`needsRefresh`). Cada escritura arrastra
 * un `revalidatePath("/", "layout")`, que invalida el árbol entero de rutas; hacerlo en cada carga
 * sería pagar un render completo por confirmar que no te has movido.
 */
export function useLocationRefresh(fix: VisitorFix | null): void {
  /* En una ref y no en las dependencias del efecto: cuando la escritura revalida, llega un `fix`
     nuevo, y con él en las dependencias el efecto volvería a correr — y a escribir, y a revalidar. */
  const latest = useRef(fix);
  latest.current = fix;

  const lastCheckedAt = useRef(0);
  const isChecking = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async (): Promise<void> => {
      if (isChecking.current) return;
      isChecking.current = true;

      try {
        if (!(await isAlreadyGranted())) return;

        const coordinates = await currentPosition();

        if (cancelled || !coordinates) return;
        if (!needsRefresh(latest.current, coordinates, new Date())) return;

        await refreshLocation(coordinates);
      } finally {
        lastCheckedAt.current = Date.now();
        isChecking.current = false;
      }
    };

    void check();

    const onVisibilityChange = (): void => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheckedAt.current < RECHECK_AFTER_MS) return;

      void check();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}

/**
 * ¿Ya nos dieron permiso, sin tener que preguntar?
 *
 * Ante cualquier duda —no hay API de permisos, la consulta revienta— la respuesta es que no. Nunca
 * se adivina hacia el lado ruidoso: equivocarse hacia "sí" significa abrir un diálogo que nadie
 * pidió.
 */
async function isAlreadyGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });

    return status?.state === "granted";
  } catch {
    return false;
  }
}

/** La posición actual, o `null` si el navegador no la pudo dar. Un fallo aquí no es un error. */
async function currentPosition(): Promise<Coordinates | null> {
  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(null),
      POSITION_OPTIONS,
    );
  });
}
