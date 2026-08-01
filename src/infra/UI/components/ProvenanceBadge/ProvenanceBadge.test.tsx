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
  it.each<[string, AppLocale, string]>([
    ["hazlo_sano_propio", "es", "🌿 Hazlo Sano"],
    ["hazlo_sano_propio", "en", "🌿 Hazlo Sano"],
    ["hazlo_sano_reventa", "es", "🌿 Hazlo Sano"],
    ["productor_local", "es", "📍 Local"],
    ["productor_local", "en", "📍 Local"],
    ["reventa_local", "en", "📍 Local"],
  ])("pinta el origin %s en %s como %s", (origin, locale, expected) => {
    renderWithIntl(<ProvenanceBadge origin={origin} />, { locale });

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders nothing for unset or community-foreign origins", () => {
    const { container: none } = renderWithIntl(
      <ProvenanceBadge origin={null} />,
    );
    expect(none).toBeEmptyDOMElement();

    const { container: foraneo } = renderWithIntl(
      <ProvenanceBadge origin="productor_foraneo" />,
    );
    expect(foraneo).toBeEmptyDOMElement();
  });
});
