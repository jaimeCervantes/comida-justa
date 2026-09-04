import { describe, expect, it, vi } from "vitest";

/*
 * La acción de disponibilidad es un Server Action y arrastra `next-auth`, que no resuelve en el
 * entorno de Vitest. Aquí se prueba lo que pinta la tarjeta, no lo que hace el servidor cuando se
 * aprieta el botón —eso vive en el e2e—, así que se corta la cadena en el borde.
 */
vi.mock("~/presentation/post/availabilityAction", () => ({
  setAvailability: vi.fn(),
}));

// Lo mismo, por el mismo motivo: el campo de existencias también dispara un Server Action.
vi.mock("~/presentation/post/stockAction", () => ({
  setStock: vi.fn(),
}));

import userEvent from "@testing-library/user-event";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import CardForList from "./CardForList";

const baseProps = {
  id: "post-1",
  title: "Miel de abeja",
  price: 120,
  createdAt: new Date("2026-07-01").toISOString(),
  user: { id: "user-1", name: "Hazlo Sano" },
  to: "/miel-de-abeja",
  media: [{ url: "https://ruta/de/imagen/1.webp", type: "image", alt: "Miel" }],
};

describe("When a card is listed", () => {
  it("shows the Hazlo Sano badge for a hazlo_sano_* origin", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} origin="hazlo_sano_propio" />,
    );

    expect(getByTestId("provenance-badge")).toHaveTextContent("Hazlo Sano");
  });

  it("shows the Local badge for a resale the seller got nearby", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} origin="reventa_cercana" />,
    );

    expect(getByTestId("provenance-badge")).toHaveTextContent("Local");
  });

  /* Una tarjeta de listado no consulta distancias, así que un productor afirma lo que sí sabe. */
  it("says who made it, not where it is, for a producer", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} origin="productor" />,
    );

    expect(getByTestId("provenance-badge")).toHaveTextContent(
      "Lo hace quien lo vende",
    );
  });

  /*
   * El camino real de un vendedor es mirar su catálogo y arreglar lo que ve. Ocultar los controles
   * a los demás es cortesía, no seguridad: quien decide es el servidor.
   */
  it("le ofrece a su dueño editar y marcar agotado sin salir del listado", () => {
    const { getByTestId } = render(
      <CardForList
        {...baseProps}
        kind="producto"
        isAvailable={true}
        viewerId="user-1"
      />,
    );

    expect(getByTestId("card-owner-controls")).toBeInTheDocument();
  });

  /*
   * `to` viene absoluto del mapper, así que recortarle el primer `/` producía
   * `/editar/http://localhost:3000/suero-natural`. El enlace se arma con el `slug` suelto.
   */
  it("enlaza a editar con el slug, no con la URL absoluta", () => {
    const { getByTestId } = render(
      <CardForList
        {...baseProps}
        to="http://localhost:3000/suero-natural"
        slug="suero-natural"
        kind="producto"
        viewerId="user-1"
      />,
    );

    const enlace = getByTestId("card-owner-controls").querySelector("a");

    expect(enlace).toHaveAttribute("href", "/editar/suero-natural");
  });

  it("y si la tarjeta llega sin slug, lo saca del último tramo de la URL", () => {
    const { getByTestId } = render(
      <CardForList
        {...baseProps}
        to="http://localhost:3000/suero-natural"
        kind="producto"
        viewerId="user-1"
      />,
    );

    expect(
      getByTestId("card-owner-controls").querySelector("a"),
    ).toHaveAttribute("href", "/editar/suero-natural");
  });

  it("no se los ofrece a quien solo está mirando", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} kind="producto" viewerId="otra-persona" />,
    );

    expect(queryByTestId("card-owner-controls")).not.toBeInTheDocument();
  });

  it("ni a quien no ha entrado", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} kind="producto" />,
    );

    expect(queryByTestId("card-owner-controls")).not.toBeInTheDocument();
  });

  it("a un producto disponible le ofrece agregar al carrito", () => {
    const { getByTestId, queryByTestId } = render(
      <CardForList {...baseProps} kind="producto" isAvailable={true} />,
    );

    expect(getByTestId("add-to-cart")).toBeInTheDocument();
    expect(queryByTestId("card-book-service")).not.toBeInTheDocument();
  });

  it("a un servicio disponible le ofrece agendar, no agregar al carrito", () => {
    const { getByTestId, queryByTestId } = render(
      <CardForList {...baseProps} kind="servicio" isAvailable={true} />,
    );

    expect(getByTestId("card-book-service")).toHaveAttribute(
      "href",
      "/miel-de-abeja",
    );
    expect(getByTestId("card-book-service")).toHaveTextContent("Agendar");
    expect(queryByTestId("add-to-cart")).not.toBeInTheDocument();
  });

  it("a un servicio agotado no le ofrece agendar ni carrito", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} kind="servicio" isAvailable={false} />,
    );

    expect(queryByTestId("card-book-service")).not.toBeInTheDocument();
    expect(queryByTestId("add-to-cart")).not.toBeInTheDocument();
  });

  /* Un anuncio no se agota: a su dueño se le ofrece editarlo y nada más. */
  it("a un anuncio propio solo le ofrece editar", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} kind="anuncio" viewerId="user-1" />,
    );

    const controls = getByTestId("card-owner-controls");

    expect(controls).toHaveTextContent(/editar/i);
    expect(controls).not.toHaveTextContent(/agotado/i);
  });

  it("shows no badge when the post has no origin", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} origin={null} />,
    );

    expect(queryByTestId("provenance-badge")).not.toBeInTheDocument();
  });

  /*
   * `Scenario` "La tarjeta dice de qué tienda es" de `sellerStore.feature`.
   *
   * Sin esto un listado decía "a 2 km" sin decir de quién: la distancia salía de `p.seller_id`
   * pero el nombre de la tienda no se pedía en la consulta.
   */
  describe("con tienda", () => {
    const CON_TIENDA = {
      ...baseProps,
      seller: {
        handle: "hazlo-sano",
        name: "Hazlo Sano",
        logoUrl: "/logo.webp",
      },
    };

    it("enlaza a la tienda desde la línea de insignias", () => {
      const { getByTestId } = render(<CardForList {...CON_TIENDA} />);

      expect(getByTestId("card-store")).toHaveAttribute(
        "href",
        "/tienda/hazlo-sano",
      );
    });

    /* El logo es decorativo, así que el nombre de la tienda es lo único que nombra el enlace. */
    it("nombra la tienda para quien escucha, aunque solo se vea el logo", () => {
      const { getByRole } = render(<CardForList {...CON_TIENDA} />);

      expect(getByRole("link", { name: "Hazlo Sano" })).toBeInTheDocument();
    });

    it("se calla la procedencia cuando el logo ya dice lo mismo", () => {
      const { queryByTestId } = render(
        <CardForList {...CON_TIENDA} origin="hazlo_sano_propio" />,
      );

      expect(queryByTestId("provenance-badge")).not.toBeInTheDocument();
    });

    /* Que lo haga quien lo vende no se deduce de ningún logo: esa insignia se queda. */
    it("pero mantiene la de productor, que el logo no dice", () => {
      const { getByTestId } = render(
        <CardForList {...CON_TIENDA} origin="productor" />,
      );

      expect(getByTestId("provenance-badge")).toBeInTheDocument();
    });
  });

  it("sin tienda no deja un hueco en la línea", () => {
    const { queryByTestId } = render(<CardForList {...baseProps} />);

    expect(queryByTestId("card-store")).not.toBeInTheDocument();
  });

  /* El precio caía en su propia línea, con `block mt-1`, debajo de las insignias. Es uno de los
     datos con los que se decide si vale la pena abrir la tarjeta, así que va en el mismo renglón
     que el resto — y ese renglón se parte solo cuando no cabe. */
  describe("la línea con la que se decide", () => {
    it("lleva el precio junto a las insignias, no en una línea aparte", () => {
      const { getByTestId } = render(<CardForList {...baseProps} />);

      expect(getByTestId("card-facts")).toHaveTextContent(/\$120/);
    });

    it("no deja hueco cuando no hay precio, como en un anuncio", () => {
      const { getByTestId } = render(
        <CardForList {...baseProps} price={null} kind="anuncio" />,
      );

      expect(getByTestId("card-facts")).not.toHaveTextContent(/\$/);
    });

    /* Los 10 anuncios de la base van sin precio, sin categoría y sin origen, y 5 tampoco tienen
       tienda: ahí todos los hijos de la fila deciden no pintarse y quedaba un elemento sin nada
       dentro ocupando su separación, que es el hueco que aparecía bajo el título.

       Se afirma que la fila queda **sin hijos**, no que esté oculta: `:empty` lo resuelve el
       navegador y jsdom no aplica hojas de estilo. Que no tenga hijos es la condición que dispara
       la regla, y es lo que esta prueba puede garantizar de verdad. */
    it("un anuncio pelado no deja ni un elemento que ocupe sitio", () => {
      const { getByTestId } = render(
        <CardForList
          {...baseProps}
          price={null}
          kind="anuncio"
          origin={null}
          categoryLabel={undefined}
        />,
      );

      const facts = getByTestId("card-facts");

      expect(facts.childElementCount).toBe(0);
      expect(facts.className).toContain("empty:hidden");
    });
  });

  describe("cuando se comparte desde la tarjeta", () => {
    it("ofrece compartir sin tener que abrir la publicación", () => {
      const { getByTestId } = render(<CardForList {...baseProps} />);

      expect(getByTestId("card-share-trigger")).toBeInTheDocument();
    });

    /* `to` llega absoluta desde `mapPostsToCards`, pero una tarjeta armada a mano —como la de esta
       prueba— la trae relativa. Compartir "/miel-de-abeja" produce un enlace que no resuelve en
       ninguna otra aplicación, que es justo donde va a acabar pegado. */
    it("reparte una dirección absoluta aunque la tarjeta traiga un camino", async () => {
      const user = userEvent.setup();
      const { getByTestId } = render(<CardForList {...baseProps} />);

      await user.click(getByTestId("card-share-trigger"));

      expect(getByTestId("share-whatsapp").getAttribute("href")).toContain(
        encodeURIComponent(`${PUBLIC_BASE_URL}/miel-de-abeja`),
      );
    });

    it("no toca una dirección que ya venía absoluta", async () => {
      const user = userEvent.setup();
      const { getByTestId } = render(
        <CardForList {...baseProps} to="https://hazlosano.com/miel-de-abeja" />,
      );

      await user.click(getByTestId("card-share-trigger"));

      expect(getByTestId("share-whatsapp").getAttribute("href")).toContain(
        encodeURIComponent("https://hazlosano.com/miel-de-abeja"),
      );
    });
  });

  /*
   * La portada no cambia —sigue siendo el archivo de `sort_order` 0, el mismo que leen el carrito,
   * los pedidos y el bot—; lo que se añade es el aviso de que detrás hay más. Sin él, una
   * publicación con cuatro fotos se ve idéntica a una con una y nadie la abre por ellas.
   */
  describe("cuántos archivos hay", () => {
    it("no dice nada cuando solo hay uno, que es el caso de siempre", () => {
      const { queryByTestId } = render(<CardForList {...baseProps} />);

      expect(queryByTestId("post-media-count")).not.toBeInTheDocument();
    });

    it("los cuenta cuando hay más de uno", () => {
      const { getByTestId } = render(
        <CardForList
          {...baseProps}
          media={[
            { url: "https://ruta/1.webp", type: "image", alt: "Miel" },
            { url: "https://ruta/2.webp", type: "image", alt: "Miel" },
            { url: "https://ruta/3.webp", type: "image", alt: "Miel" },
            { url: "https://ruta/4.mp4", type: "video", alt: "Miel" },
          ]}
        />,
      );

      expect(getByTestId("post-media-count")).toHaveTextContent("4");
    });

    it("la portada sigue siendo el primero", () => {
      const { getByRole } = render(
        <CardForList
          {...baseProps}
          media={[
            { url: "https://ruta/portada.webp", type: "image", alt: "Miel" },
            { url: "https://ruta/segunda.webp", type: "image", alt: "Miel" },
          ]}
        />,
      );

      expect(getByRole("img").getAttribute("src")).toContain("portada.webp");
    });
  });
});

/**
 * Slice 4: el número se recuenta desde la tarjeta.
 *
 * La tarjeta ya ofrecía editar y marcar agotado; lo que faltaba era la cuenta, y que el permiso lo
 * decidiera la misma regla que autoriza la escritura y no sólo «quién publicó».
 */
describe("las existencias en la tarjeta", () => {
  const producto = { ...baseProps, kind: "producto" } as const;

  it("quien publicó puede recontar sin abrir la publicación", () => {
    const { getByTestId } = render(
      <CardForList {...producto} viewerId="user-1" stockQuantity={12} />,
    );

    expect(getByTestId("stock-control")).toBeInTheDocument();
    expect(getByTestId("stock-input")).toHaveValue(12);
  });

  /* Dos mandos para lo mismo podrían contradecirse: un producto agotado a mano con 12 unidades
     guardadas no sabría qué contestar. Misma regla que en la ficha. */
  it("con inventario ya no ofrece además marcar agotado", () => {
    const { queryByRole } = render(
      <CardForList {...producto} viewerId="user-1" stockQuantity={12} />,
    );

    expect(
      queryByRole("button", { name: /agotado|disponible/i }),
    ).not.toBeInTheDocument();
  });

  it("sin inventario conserva su interruptor y el campo nace vacío", () => {
    const { getByRole, getByTestId } = render(
      <CardForList {...producto} viewerId="user-1" stockQuantity={null} />,
    );

    expect(getByRole("button", { name: /agotado/i })).toBeInTheDocument();
    expect(getByTestId("stock-input")).toHaveValue(null);
  });

  /* La segunda vía: el dueño de la tienda administra su catálogo aunque cada ficha la escribiera
     otra mano. Es el hueco que el slice 1 cerró en la ficha y que aquí seguía abierto. */
  it("el dueño de la tienda recuenta lo que publicó otra cuenta", () => {
    const { getByTestId } = render(
      <CardForList
        {...producto}
        user={{ id: "otra-cuenta", name: "Quien lo escribió" }}
        sellerId="tienda-1"
        viewerId="dueño-de-la-tienda"
        viewerSellerId="tienda-1"
        stockQuantity={5}
      />,
    );

    expect(getByTestId("stock-control")).toBeInTheDocument();
  });

  it("el dueño de otra tienda no", () => {
    const { queryByTestId } = render(
      <CardForList
        {...producto}
        user={{ id: "otra-cuenta", name: "Quien lo escribió" }}
        sellerId="tienda-1"
        viewerId="dueño-de-otra"
        viewerSellerId="tienda-2"
        stockQuantity={5}
      />,
    );

    expect(queryByTestId("card-owner-controls")).not.toBeInTheDocument();
  });

  /* Dos nulos no se parecen: sin tienda a un lado o al otro, la vía de la tienda no existe. */
  it("sin tienda, la vía de la tienda no abre nada", () => {
    const { queryByTestId } = render(
      <CardForList
        {...producto}
        user={{ id: "otra-cuenta", name: "Quien lo escribió" }}
        sellerId={null}
        viewerId="alguien"
        viewerSellerId={null}
        stockQuantity={5}
      />,
    );

    expect(queryByTestId("card-owner-controls")).not.toBeInTheDocument();
  });

  it.each([
    ["servicio", 45],
    ["evento", null],
    ["anuncio", null],
  ])("un %s no cuenta ejemplares en su tarjeta", (kind) => {
    const { queryByTestId } = render(
      <CardForList
        {...baseProps}
        kind={kind}
        viewerId="user-1"
        stockQuantity={null}
      />,
    );

    expect(queryByTestId("stock-control")).not.toBeInTheDocument();
  });
});
