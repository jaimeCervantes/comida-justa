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
          await shareLocation(data);
        });
      },
      () => setState("failed"),
    );
  };

  return { state, isBusy: state === "locating" || isPending, share };
}
