import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { setAvailabilityMock } = vi.hoisted(() => ({
  setAvailabilityMock: vi.fn(),
}));

/*
 * La tarjeta arrastra el Server Action de disponibilidad, y con él `next-auth`, que no resuelve en
 * el entorno de Vitest. Aquí se prueba de dónde saca el feed sus tarjetas, no lo que hace el
 * servidor cuando se aprieta un botón —eso vive en el e2e—, así que se corta la cadena en el borde.
 */
vi.mock("~/presentation/post/availabilityAction", () => ({
  setAvailability: setAvailabilityMock,
}));

// Lo mismo, por el mismo motivo: el campo de existencias de la tarjeta también es un Server Action.
vi.mock("~/presentation/post/stockAction", () => ({
  setStock: vi.fn(),
}));

import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import { homeFeedKey } from "./homeFeedKey";
import PostsWithLoadMore from "./PostsWithLoadMore";

/** Encima de la panadería y a 40 km de ella: los dos sitios del escenario del slice 5. */
const ENCIMA: Coordinates = { latitude: 18.6, longitude: -96.68 };
const A_CUARENTA_KM: Coordinates = { latitude: 18.96, longitude: -96.68 };

type TarjetaSembrada = ReturnType<typeof tarjeta>;

function tarjeta(id: string, distanceMeters: number) {
  return {
    id,
    title: `E2E Pan ${id}`,
    price: 96,
    createdAt: "2026-08-01T00:00:00.000Z",
    user: { id: "user-1", name: "Panadería La Luz" },
    to: `/pan-${id}`,
    media: [
      { url: "https://ruta/de/imagen/1.webp", type: "image", alt: "Pan" },
    ],
    distanceMeters,
  };
}

/** El feed montado como lo monta la página: con su `key`, que es de dónde salen las distancias. */
function feed(
  visitor: Coordinates | null,
  initialPosts: TarjetaSembrada[],
  totalPosts: number,
  currentPillar: PublicationPillar | null = null,
) {
  return (
    <PostsWithLoadMore
      key={homeFeedKey(visitor, currentPillar)}
      initialPosts={initialPosts}
      totalPosts={totalPosts}
      totalPages={1}
      locale="es"
      currentPillar={currentPillar}
    />
  );
}

/** Lo que dice cada tarjeta sobre su distancia, en el orden en que se leen. */
function distancias(): string[] {
  return screen
    .queryAllByTestId("store-distance")
    .map((nodo) => nodo.textContent ?? "");
}

function respondeConUnaPaginaMas(posts: TarjetaSembrada[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ posts, nextPage: null }),
    })),
  );
}

describe("El feed del home", () => {
  beforeEach(() => {
    setAvailabilityMock.mockReset();
    setAvailabilityMock.mockResolvedValue({});

    /* jsdom no trae `IntersectionObserver`, y el feed monta uno para el scroll infinito. Aquí el
       scroll no existe: las páginas siguientes se piden apretando "Cargar más". */
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
  });

  it("pinta la primera página tal como se la manda el servidor", () => {
    renderWithIntl(feed(ENCIMA, [tarjeta("uno", 2000)], 1));

    expect(distancias()).toEqual(["a 2 km"]);
  });

  it("y le suma lo que trae Cargar más", async () => {
    respondeConUnaPaginaMas([tarjeta("dos", 2500)]);
    renderWithIntl(feed(ENCIMA, [tarjeta("uno", 2000)], 2));

    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));

    await waitFor(() => expect(distancias()).toEqual(["a 2 km", "a 2.5 km"]));
  });

  it("no intenta parsear como JSON una respuesta HTML de error", async () => {
    const json = vi.fn();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "text/html" }),
        json,
      })),
    );
    renderWithIntl(feed(ENCIMA, [tarjeta("uno", 2000)], 2));

    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));

    await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1));
    expect(json).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "E2E Pan uno" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cargar más" })).toBeEnabled();
    consoleError.mockRestore();
  });

  /*
   * El fallo que reportó el usuario: al cargar más, las tarjetas ya vistas se recolocaban y varias
   * subían por encima de donde él estaba mirando. Era la multi-columna de CSS, que reparte de nuevo
   * TODAS al añadir una.
   *
   * Ahora reparte `MasonryColumns`, en orden y a la columna más corta. Que ese reparto sea estable
   * al añadir se prueba donde vive la regla (`MasonryColumns.test.tsx`); aquí se afirma lo que le
   * toca al feed: todo sigue en un único listado continuo —sin tandas ni costuras— y la tarjeta que
   * ya estaba **no se vuelve a montar**, que es la condición para que no salte.
   */
  it("y lo ya pintado no se vuelve a montar al cargar más", async () => {
    respondeConUnaPaginaMas([tarjeta("dos", 2500)]);
    renderWithIntl(feed(ENCIMA, [tarjeta("uno", 2000)], 2));

    const primeraTarjeta = screen.getAllByRole("article")[0];
    expect(screen.getAllByTestId("feed-masonry")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));

    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(screen.getAllByRole("article")[0]).toBe(primeraTarjeta);
    // Un solo listado: ya no hay un bloque por página que deje huecos entre uno y otro.
    expect(screen.getAllByTestId("feed-masonry")).toHaveLength(1);
  });

  it("actualiza solo la disponibilidad afectada y conserva lo cargado", async () => {
    setAvailabilityMock.mockResolvedValue({ isAvailable: false });
    respondeConUnaPaginaMas([tarjeta("dos", 2500)]);
    renderWithIntl(
      <PostsWithLoadMore
        initialPosts={[
          {
            ...tarjeta("uno", 2000),
            kind: "producto",
            isAvailable: true,
          },
        ]}
        totalPosts={2}
        totalPages={1}
        locale="es"
        viewerId="user-1"
        currentPillar={null}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "E2E Pan dos" }),
      ).toBeVisible(),
    );

    const primeraTarjeta = screen
      .getByRole("heading", { name: "E2E Pan uno" })
      .closest("article");
    expect(primeraTarjeta).not.toBeNull();

    await userEvent.click(
      within(primeraTarjeta as HTMLElement).getByRole("button", {
        name: "Marcar agotado",
      }),
    );

    await waitFor(() => {
      const tarjetaActualizada = screen
        .getByRole("heading", { name: "E2E Pan uno" })
        .closest("article");
      expect(tarjetaActualizada).not.toBeNull();
      expect(
        within(tarjetaActualizada as HTMLElement).getByTestId("sold-out-badge"),
      ).toBeVisible();
    });
    expect(screen.getByRole("heading", { name: "E2E Pan dos" })).toBeVisible();
  });

  /*
   * El escenario "El feed obedece al servidor cuando cambia desde dónde se mide" de
   * `ubicacionFresca.feature`.
   *
   * Lo que el feed acumula es una copia de cliente, y `useState` no vuelve a mirar sus props: sin
   * la `key`, corregir la ubicación repintaba el chip de arriba y dejaba estas tarjetas midiendo
   * desde donde el lector ya no está. Y hay que tirar las dos, no solo la primera página: la que
   * trajo el scroll se midió desde el mismo sitio equivocado.
   */
  it("y empieza de nuevo cuando cambia desde dónde se miden sus distancias", async () => {
    respondeConUnaPaginaMas([tarjeta("dos", 2500)]);
    const { rerender } = renderWithIntl(
      feed(ENCIMA, [tarjeta("uno", 2000)], 2),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    await waitFor(() => expect(distancias()).toHaveLength(2));

    rerender(feed(A_CUARENTA_KM, [tarjeta("uno", 39_800)], 1));

    expect(distancias()).toEqual(["a 39.8 km"]);
  });

  it("y empieza de nuevo cuando cambia el pilar activo", async () => {
    const { rerender } = renderWithIntl(
      feed(ENCIMA, [tarjeta("alimentacion", 2000)], 1, null),
    );

    expect(
      screen.getByRole("heading", { name: "E2E Pan alimentacion" }),
    ).toBeVisible();

    rerender(feed(ENCIMA, [tarjeta("movimiento", 2500)], 1, "movement"));

    expect(
      screen.getByRole("heading", { name: "E2E Pan movimiento" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "E2E Pan alimentacion" }),
    ).not.toBeInTheDocument();
  });

  it("conserva el pilar activo al cargar mas", async () => {
    /* El parámetro se declara aunque el doble no lo use: sin él, `vi.fn` tipa las llamadas como
       tupla vacía y `mock.calls[0][0]` —la dirección que este caso afirma— deja de existir para
       TypeScript. Nombrarlo describe además qué se está inspeccionando. */
    const fetchMock = vi.fn(async (_url: string) => ({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ posts: [tarjeta("dos", 2500)], nextPage: null }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithIntl(
      <PostsWithLoadMore
        initialPosts={[tarjeta("uno", 2000)]}
        totalPosts={2}
        totalPages={1}
        locale="es"
        currentPillar="movement"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toContain("pillar=movement");
  });
});
