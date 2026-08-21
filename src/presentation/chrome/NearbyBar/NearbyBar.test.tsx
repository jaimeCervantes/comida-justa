import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";
import type { ViewerLocationContext } from "~/infra/location/viewerLocationContext";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import NearbyBar from "./NearbyBar";

/**
 * La barra es un Server Component: `getTranslations` no tiene configuración que leer fuera de una
 * petición de Next. Se sustituye por un traductor armado con el catálogo **real**, para que borrar
 * una clave rompa la prueba — el mismo criterio que `renderWithIntl`.
 */
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("~/i18n/messages/es.json")).default;

  return {
    getTranslations: async (namespace: "distance") =>
      createTranslator({ locale: "es", messages, namespace }),
  };
});

const { readViewerLocationContext } = vi.hoisted(() => ({
  readViewerLocationContext: vi.fn(),
}));

vi.mock("~/infra/location/viewerLocationContext", () => ({
  readViewerLocationContext,
}));

/* Las dos caras son componentes de cliente y las dos llaman a la misma server action. */
vi.mock("~/presentation/location/actions", () => ({ shareLocation: vi.fn() }));

function contextWith(hoursAgo: number | null): ViewerLocationContext {
  if (hoursAgo === null) {
    return { visitor: null, fix: null, showSellerCta: true };
  }

  return {
    visitor: COMMUNITY_ANCHOR,
    fix: {
      coordinates: COMMUNITY_ANCHOR,
      fixedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
    },
    showSellerCta: false,
  };
}

async function renderBar(context: ViewerLocationContext): Promise<void> {
  readViewerLocationContext.mockResolvedValue(context);
  renderWithIntl(await NearbyBar());
}

describe("NearbyBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /*
   * Lo que se había caído: `HomeHero` llevaba el control y dejó de montarse en 8b4d9bf. Ahora lo
   * lleva el chrome, así que ninguna página tiene que acordarse de montarlo.
   */
  it("ofrece corregir la ubicación cuando el sitio ya sabe dónde estás", async () => {
    await renderBar(contextWith(2));

    expect(screen.getByTestId("location-chip")).toBeInTheDocument();
    expect(screen.getByTestId("refresh-location")).toBeInTheDocument();
    expect(screen.getByTestId("location-age")).toHaveTextContent(
      /hace 2 horas/i,
    );
  });

  it("explica por qué no hay distancias cuando no lo sabe", async () => {
    await renderBar(contextWith(null));

    expect(screen.getByTestId("location-notice")).toHaveTextContent(
      /no podemos decirte qué tan cerca/i,
    );
    expect(screen.getByTestId("share-location")).toBeInTheDocument();
  });

  /* No inventa una tercera cara: o una o la otra, nunca las dos ni ninguna. */
  it.each<[string, number | null, string, string]>([
    ["con ubicación", 2, "location-chip", "location-notice"],
    ["sin ubicación", null, "location-notice", "location-chip"],
  ])("monta una sola cara, %s", async (_caso, horas, presente, ausente) => {
    await renderBar(contextWith(horas));

    expect(screen.getByTestId(presente)).toBeInTheDocument();
    expect(screen.queryByTestId(ausente)).not.toBeInTheDocument();
  });

  /*
   * `sellerCta` solo existe dentro de `LocationNotice` (`LocationNotice.tsx:75`). Al retirar el
   * aviso de las seis páginas, si la barra no lo recogiera desaparecería del sitio entero.
   */
  it("recoge la invitación a abrir tienda, que solo vivía en el aviso", async () => {
    await renderBar(contextWith(null));

    expect(screen.getByTestId("seller-location-cta")).toHaveTextContent(
      /abrir tu tienda/i,
    );
  });

  it("no la repite a quien ya tiene tienda", async () => {
    await renderBar({ visitor: null, fix: null, showSellerCta: false });

    expect(screen.queryByTestId("seller-location-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("location-notice")).toBeInTheDocument();
  });

  it("se rotula como lo que es, para que la barra no sea un adorno", async () => {
    await renderBar(contextWith(2));

    expect(screen.getByTestId("nearby-bar")).toHaveTextContent(/cerca de ti/i);
  });
});
