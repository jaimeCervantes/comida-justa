"use client";
import { useState, useTransition } from "react";
import { shareLocation } from "./actions";

export type ShareLocationState = "idle" | "locating" | "failed";

export interface ShareLocation {
  state: ShareLocationState;
  /** `true` mientras se pregunta al navegador o mientras el servidor guarda la respuesta. */
  isBusy: boolean;
  share: () => void;
}

/**
 * El trámite de pedirle la ubicación al navegador y mandarla al servidor.
 *
 * Vive en un hook porque lo necesitan dos componentes con **distinta cara**: el botón suelto que
 * acompaña a una publicación y el aviso que explica por qué no hay distancias. Duplicar el trámite
 * habría significado dos sitios donde arreglar el día que cambie, y dos sitios donde olvidarse de
 * que negar el permiso no es un error del que haya que reponerse.
 */
export function useShareLocation(): ShareLocation {
  const [state, setState] = useState<ShareLocationState>("idle");
  const [isPending, startTransition] = useTransition();

  const share = (): void => {
    if (!navigator.geolocation) {
      setState("failed");
      return;
    }

    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const data = new FormData();
        data.set("latitude", String(position.coords.latitude));
        data.set("longitude", String(position.coords.longitude));

        startTransition(async () => {
          try {
            await shareLocation(data);
          } catch {
            /* Un fallo del servidor no es `failed`: ese estado significa "dijiste que no" y saca
               copia que se lo reprocha ("No compartiste tu ubicación"), que es exactamente lo
               contrario de lo que acaba de pasar. Se vuelve a `idle`, que deja el botón vivo para
               reintentar, y no se relanza: lo que se cayó fue una corrección de ubicación, y
               tumbar la página entera por eso le cuesta a quien mira mucho más que la distancia
               desactualizada que se queda en pantalla. */
          } finally {
            /* Volver a `idle` es lo que apaga la ruedita, y hacía falta decirlo: `isPending` se
               apaga solo, pero `locating` lo prendimos nosotros y nadie lo apagaba. No se notaba
               desde `LocationNotice` ni desde `ShareLocationButton` porque a los dos se los lleva
               por delante la revalidación —el aviso se vuelve chip, el botón se vuelve distancia— y
               con ellos se iba el estado colgado. `LocationChip` sigue en pantalla después de
               corregir la ubicación, así que ahí el botón se quedaba cargando para siempre sobre
               una antigüedad que ya decía "hace unos segundos". */
            setState("idle");
          }
        });
      },
      () => setState("failed"),
    );
  };

  return { state, isBusy: state === "locating" || isPending, share };
}
