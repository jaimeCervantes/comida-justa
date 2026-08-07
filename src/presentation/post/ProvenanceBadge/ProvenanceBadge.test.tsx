import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AppLocale } from "~/i18n/routing";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import ProvenanceBadge from "./ProvenanceBadge";

/**
 * Cubre el `Scenario Outline` "Las etiquetas de vocabulario se traducen sin tocar la allowlist"
 * de `src/e2e/i18n/i18n.feature`. Va en Vitest y no en Playwright porque es el armado de la
 * insignia a partir del catálogo: no hace falta ni base ni navegador.
 */
describe("ProvenanceBadge", () => {
  /*
   * La insignia solo afirma lo que el dato respalda. Un `productor` **no** presume locación: si es
   * local o no lo dice la distancia de su sucursal, que esta tarjeta no consulta. Dice entonces lo
   * único que el vendedor sí respaldó —que lo hace él— y la locación se resuelve en el directorio.
   */
  it.each<[string, AppLocale, string]>([
    ["hazlo_sano_propio", "es", "🌿 Hazlo Sano"],
    ["hazlo_sano_propio", "en", "🌿 Hazlo Sano"],
    ["hazlo_sano_reventa", "es", "🌿 Hazlo Sano"],
    ["productor", "es", "🧑‍🌾 Lo hace quien lo vende"],
    ["productor", "en", "🧑‍🌾 Made by the seller"],
    ["reventa_cercana", "es", "📍 Local"],
    ["reventa_cercana", "en", "📍 Local"],
  ])("pinta el origin %s en %s como %s", (origin, locale, expected) => {
    renderWithIntl(<ProvenanceBadge origin={origin} />, { locale });

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders nothing for unset or far-away origins", () => {
    const { container: none } = renderWithIntl(
      <ProvenanceBadge origin={null} />,
    );
    expect(none).toBeEmptyDOMElement();

    const { container: lejana } = renderWithIntl(
      <ProvenanceBadge origin="reventa_lejana" />,
    );
    expect(lejana).toBeEmptyDOMElement();
  });
});
