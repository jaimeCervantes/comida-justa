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

/**
 * El cero, que por omisión se calla y a veces es el dato.
 *
 * La regla de callarse existe para el anuncio sin precio: «$0.00» bajo su título diría que es
 * gratis. Pero el renglón agotado del carrito necesita justo lo contrario —el 5.14 lo pide «en
 * cero» y no en blanco—, así que quien llama elige.
 */
describe("El importe en cero", () => {
  const renderAmount = (node: React.ReactNode) =>
    render(
      <NextIntlClientProvider locale="es" messages={{}} timeZone="UTC">
        {node}
      </NextIntlClientProvider>,
    );

  it("no se pinta por omisión", () => {
    const { container } = renderAmount(<CurrencyAmount value={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("se pinta cuando quien llama lo pide", () => {
    renderAmount(<CurrencyAmount value={0} showZero />);

    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it("sigue sin inventar nada cuando no hay número", () => {
    const { container } = renderAmount(
      <CurrencyAmount value={undefined as unknown as number} showZero />,
    );

    /* `showZero` habla del cero, no de «pinta lo que sea». */
    expect(container.textContent).not.toMatch(/[1-9]/);
  });
});
