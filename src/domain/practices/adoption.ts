/**
 * La adopción de una práctica: quién la lleva, desde cuándo y si la comparte.
 *
 * **Dejar una práctica no la borra.** `stoppedAt` marca cuándo se dejó, y volver reabre la misma
 * adopción en vez de crear otra. Es la misma decisión que atraviesa todo este producto: la regla es
 * «no faltar dos veces», no «no faltar», y volver después de faltar vale más que fingir perfección.
 */
export type PracticeSource = "web" | "telegram" | "whatsapp";

export type PracticeAdoption = {
  practiceKey: string;
  startedAt: Date;
  stoppedAt: Date | null;
  sharingEnabled: boolean;
  source: PracticeSource;
};

/** Si esta persona la está practicando ahora mismo. */
export function isActive(adoption: PracticeAdoption): boolean {
  return adoption.stoppedAt === null;
}

/**
 * Las claves de las prácticas que alguien lleva activas, para consultarlas de un vistazo.
 *
 * Un `Set` y no una lista porque la página pregunta «¿esta la lleva?» una vez por cada tarjeta —45
 * veces— y recorrer una lista en cada una convertiría el índice en cuadrático sin necesidad.
 */
export function activeKeys(
  adoptions: readonly PracticeAdoption[],
): ReadonlySet<string> {
  return new Set(
    adoptions.filter(isActive).map(({ practiceKey }) => practiceKey),
  );
}
