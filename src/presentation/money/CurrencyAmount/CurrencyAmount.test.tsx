import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import type { routing } from "~/i18n/routing";
import CurrencyAmount from "./CurrencyAmount";

// Derivado de `routing.locales` en vez de `string`: si mañana entra un idioma, este test se entera.
function renderIn(locale: (typeof routing.locales)[number], value: number) {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}} timeZone="UTC">
      <CurrencyAmount value={value} />
    </NextIntlClientProvider>,
  );
}

describe("CurrencyAmount", () => {
  /* El idioma del routing es `es` a secas, e `Intl` lo interpreta como español de España: escribía
     "35,00 MXN" —coma decimal y código en vez de símbolo—, que para quien compra en México se lee
     como otro precio. `FORMATTING_LOCALE` es lo que lo ancla a es-MX. */
  it("Then a price in Spanish is written the Mexican way", () => {
    renderIn("es", 35);

    expect(screen.getByText("$35.00")).toBeInTheDocument();
  });

  it("Then thousands are grouped with a comma, not a dot", () => {
    renderIn("es", 1234.5);

    expect(screen.getByText("$1,234.50")).toBeInTheDocument();
  });

  it("Then in English the currency is marked as Mexican pesos", () => {
    renderIn("en", 35);

    // "MX$" y no "$" a secas: para quien lee en inglés, un "$" suelto se entiende como dólares.
    expect(screen.getByText("MX$35.00")).toBeInTheDocument();
  });

  it("Then a zero amount renders nothing", () => {
    const { container } = renderIn("es", 0);

    expect(container).toBeEmptyDOMElement();
  });
});
