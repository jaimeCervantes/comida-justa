import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Dos controles distintos no pueden llamarse igual.
 *
 * Antes convivían en pantallas distintas: `LocationNotice` lo montaban seis páginas y
 * `ShareLocationButton` iba dentro de una ficha. Al subir el aviso al chrome —slice 1 de
 * `docs/features/platform/007-2026-08-21-chrome-v2.md`— los dos empezaron a coincidir en la misma
 * pantalla, y `getByTestId("share-location")` sobre una ficha pasó a resolver **dos elementos**:
 * modo estricto, dos specs en rojo.
 *
 * No se descubrió al hacer el cambio porque los specs del aviso ya lo buscaban **con ámbito**
 * (`aviso.getByTestId(...)`), y los de la ficha no. Salió en la corrida completa por shards.
 *
 * Los dos siguen existiendo, y con razón: el de la barra es el ofrecimiento general del sitio, y el
 * de la ficha va en el hueco donde iría la distancia. Lo que no puede repetirse es el nombre.
 */
const NOTICE = readFileSync(
  "src/presentation/location/LocationNotice.tsx",
  "utf8",
);
const INLINE = readFileSync(
  "src/presentation/location/ShareLocationButton.tsx",
  "utf8",
);

function testIdsIn(source: string): string[] {
  return [...source.matchAll(/data-testid="([^"]+)"/g)].map(([, id]) => id);
}

describe("los dos botones de compartir ubicación", () => {
  it("no comparten ningún data-testid", () => {
    const shared = testIdsIn(NOTICE).filter((id) =>
      testIdsIn(INLINE).includes(id),
    );

    expect(
      shared,
      `${shared.join(", ")} está en los dos: sobre una ficha se ven a la vez, ` +
        "y un getByTestId sin ámbito resolvería dos elementos",
    ).toEqual([]);
  });

  it("y cada uno conserva el suyo", () => {
    expect(testIdsIn(NOTICE)).toContain("share-location");
    expect(testIdsIn(INLINE)).toContain("share-location-inline");
  });
});
