"use client";
import { useEffect, useRef, useState } from "react";
import {
  useScreenWakeLock,
  type WakeLockStatus,
} from "~/infra/UI/hooks/useScreenWakeLock";
import { shareCourierLocation } from "../actions";

export type CourierSharingState =
  | "idle"
  | "sending"
  | "active"
  | "denied"
  | "stopped";

/**
 * Cada cuánto se manda de nuevo, mientras la pestaña siga abierta.
 *
 * Mismo intervalo que `CourierMap` del lado del comprador: no tiene sentido que uno mande más
 * rápido de lo que el otro va a mirar.
 */
const SHARE_INTERVAL_MS = 15_000;

export interface ShareCourierLocation {
  state: CourierSharingState;
  start: () => void;
  /** Si la pantalla se queda encendida sola mientras se comparte (`useScreenWakeLock`). */
  screen: WakeLockStatus;
}

/** `getCurrentPosition` con callbacks, prometizado para poder encadenarlo con `await`. */
function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

/**
 * El trámite del repartidor: pedirle la posición al navegador y mandarla, repetido.
 *
 * **No usa `useActionState`.** Ese hook está pensado para un envío —clic, pendiente, resultado—, y
 * aquí hay que repetir el envío solo, sin que nadie vuelva a apretar nada. Es el mismo trámite que
 * `useShareLocation`, una vez en vez de en bucle.
 *
 * **`"active"` significa que el servidor ya confirmó el guardado, no que se apretó el botón.** La
 * primera versión pasaba a "compartiendo" en cuanto se llamaba a `start()`, antes de que
 * `getCurrentPosition` y el propio `shareCourierLocation` terminaran — quien mirara la pantalla
 * creía que ya había una posición guardada cuando todavía no la había. Con **await** de por medio,
 * el estado sólo cambia cuando el primer envío de verdad terminó.
 *
 * Si el servidor contesta que el token ya no vale —el pedido se entregó o se canceló mientras la
 * pestaña seguía abierta— el bucle se detiene solo: seguir mandando posiciones a un enlace muerto
 * no tiene destinatario.
 *
 * **Una página web no puede leer el GPS en segundo plano.** Mientras comparte se pide que la
 * pantalla no se apague sola (`useScreenWakeLock`), y cuando la página vuelve a estar a la vista
 * —tras abrir Google Maps o desbloquear el teléfono— se manda la posición **en ese momento**, sin
 * esperar al siguiente turno: es cuando más vieja está la que tiene el comprador.
 */
export function useShareCourierLocation(
  orderId: string,
  token: string,
): ShareCourierLocation {
  const [state, setState] = useState<CourierSharingState>("idle");
  const intervalId = useRef<number | null>(null);
  /* Lo que hace cada envío repetido. En una ref porque lo llaman el intervalo y el regreso a la
     página, y los dos tienen que usar la versión de este render. */
  const repeat = useRef<() => void>(() => {});
  const screen = useScreenWakeLock(state === "active");

  useEffect(() => {
    return () => {
      if (intervalId.current !== null) window.clearInterval(intervalId.current);
    };
  }, []);

  /** Manda una posición y dice si el enlace sigue vivo. No lanza: un fallo de geolocalización se
      resuelve en el llamador de la primera vez, y en los repetidos se ignora sin más. */
  const sendOnce = async (): Promise<"ok" | "stopped"> => {
    const position = await currentPosition();
    const data = new FormData();
    data.set("orderId", orderId);
    data.set("token", token);
    data.set("lat", String(position.coords.latitude));
    data.set("lng", String(position.coords.longitude));

    const result = await shareCourierLocation({}, data);

    return result.error === "invalid-token" ? "stopped" : "ok";
  };

  const stop = (): void => {
    setState("stopped");

    if (intervalId.current !== null) {
      window.clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  /* Los repetidos son de mejor esfuerzo: sólo importa el resultado si el enlace murió. Un fallo
     aislado de geolocalización no apaga el envío entero por un tropiezo. */
  repeat.current = () => {
    sendOnce()
      .then((outcome) => {
        if (outcome === "stopped") stop();
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (state !== "active") return;

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") repeat.current();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [state]);

  const start = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setState("denied");
      return;
    }

    setState("sending");

    try {
      const outcome = await sendOnce();

      if (outcome === "stopped") {
        stop();
        return;
      }

      setState("active");
      intervalId.current = window.setInterval(
        () => repeat.current(),
        SHARE_INTERVAL_MS,
      );
    } catch {
      setState("denied");
    }
  };

  return { state, start, screen };
}
