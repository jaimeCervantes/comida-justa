"use client";
import type { VisitorFix } from "~/domain/entities/seller/locationFreshness";
import { useLocationRefresh } from "./useLocationRefresh";

/**
 * El único cliente que necesita `useLocationRefresh`, montado una sola vez en el layout.
 *
 * No pinta nada a propósito: la ubicación no es una pantalla, es un dato que tiene que estar al
 * día para que las distancias sean ciertas. Lo que se ve es el chip (`LocationChip`) y el aviso
 * (`LocationNotice`); esto solo se ocupa de que lo que ellos muestran no sea de hace meses.
 *
 * Vive en el layout y no en cada página porque así el efecto corre una vez por carga completa —no
 * en cada navegación de cliente— y el `visibilitychange` cubre el resto de la sesión.
 */
export default function LocationRefresher({
  fix,
}: {
  fix: VisitorFix | null;
}): null {
  useLocationRefresh(fix);

  return null;
}
