import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import SellerAccountPage from "../sellerStore/SellerAccountPage";
import {
  claimUsernameFor,
  findAnotherUserId,
  releaseUsername,
} from "../testUtils/claimTestUsername";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";

/**
 * La navegación interna del 5.15: siempre visible, cinco entradas y dos de ellas condicionadas.
 *
 * Por `data-testid` y no por rol+nombre: el menú principal del header también es un `<nav>` con
 * `aria-label`, y es el primero en el DOM — `getByRole("navigation", { name: … })` encontraba ese,
 * no este.
 */
function accountNav(page: import("@playwright/test").Page) {
  return page.getByTestId("account-nav");
}

// Slice 3 de docs/features/content/004-2026-08-08-compartir-y-cuenta.md.

test.describe("Cuando una vendedora abre su cuenta", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /* Había tres: el de la página, el de la tarjeta de la tienda y el del alta. Un lector de pantalla
     anunciaba tres títulos principales para una sola pantalla, y quien navega por encabezados no
     tenía forma de saber cuál era el de verdad.

     El slice 1 de `005-2026-09-04-cuenta-configurable` cambia **qué dice** ese único título: era
     «Mi cuenta», que es lo mismo que dice el menú de la izquierda dos centímetros más allá. Ahora
     lo gasta en nombrar la tienda, que es lo único que esta pantalla puede decir y el menú no. */
  test("Entonces la página tiene un solo título principal, y nombra la tienda", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(store.name);
  });

  test("Entonces cada bloque cuelga de ese título, en su propia tarjeta", async ({
    page,
  }) => {
    for (const title of [
      es.account.setupHeading,
      es.account.usernameTitle,
      es.account.storeProfileTitle,
      es.account.branchesHeading,
      es.account.addBranchTitle,
    ]) {
      /* `exact` no es opcional aquí: por omisión el nombre se compara por subcadena, y "Tu tienda"
         casaba también con "La ficha de tu tienda". */
      await expect(
        page.getByRole("heading", { level: 2, name: title, exact: true }),
      ).toBeVisible();
    }
  });

  /* La regla de antes era «lo que se reparte va antes que lo que se edita», repartido entre las dos
     columnas. El slice 1 la endurece: lo que se reparte ya no compite por una columna, está en la
     cabecera, **encima de todo lo demás**. Se afirma la promesa —mis direcciones son lo primero que
     veo— y no el orden de dos títulos concretos, que es lo que se rompía cada vez que un bloque
     cambiaba de sitio. */
  test("Entonces mis direcciones públicas van antes que cualquier bloque que editar", async ({
    page,
  }) => {
    const cabecera = page.getByTestId("account-identity");

    await expect(cabecera).toBeVisible();
    await expect(
      cabecera.getByRole("link", {
        name: new RegExp(`/tienda/${store.handle}$`),
      }),
    ).toBeVisible();

    const primerBloque = page.getByRole("heading", { level: 2 }).first();

    /* `toBeLessThan(0)` sería un falso positivo si la cabecera no estuviera: `compareDocumentPosition`
       devuelve 0 para el mismo nodo, así que se compara contra la máscara de "va después". */
    const cabeceraVaAntes = await cabecera.evaluate(
      (header, heading) =>
        Boolean(
          header.compareDocumentPosition(heading as Node) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      await primerBloque.elementHandle(),
    );

    expect(cabeceraVaAntes).toBe(true);
  });

  /* Quien vende sí necesita su agenda: es de lo poco que se revisa a diario. Sin dirección
     personal reclamada en este `beforeEach`, "Mis publicaciones" no tiene a dónde llevar y no debe
     ofrecerse — el mismo filtro que ya usa `UserMenu` para "Mi perfil". */
  test("Entonces la navegación ofrece la agenda, y todavía no las publicaciones", async ({
    page,
  }) => {
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.myAccount, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.myOrders }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: es.nav.schedule }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: es.nav.myHabits }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: es.nav.myPublications }),
    ).toHaveCount(0);
  });
});

test.describe("Cuando la navegación viaja a /pedidos y /cuenta/agenda", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería del Amanecer");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /* No es la misma pantalla con otro título: es la misma sección. Si `/pedidos` dejara de montar
     `AccountNav`, quien llegó desde `/cuenta` perdería la navegación a mitad de camino. */
  test("Entonces /pedidos monta la misma navegación, con «Mis pedidos» activo", async ({
    page,
  }) => {
    await page.goto("/pedidos");
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.myOrders }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.myAccount, exact: true }),
    ).not.toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.schedule }),
    ).toBeVisible();
  });

  test("Entonces /cuenta/agenda monta la misma navegación, con «Mi agenda» activo", async ({
    page,
  }) => {
    await page.goto("/cuenta/agenda");
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.schedule }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.myOrders }),
    ).not.toHaveAttribute("aria-current", "page");
  });
});

test.describe("Cuando quien vende también reclamó su dirección personal", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería del Sol");
  const username = "e2e-cuenta-nav";

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    await claimUsernameFor(dbSession.userId, username);
    await page.reload();
  });

  test.afterEach(async () => {
    await releaseUsername(username);
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces «Mis publicaciones» aparece, y lleva al perfil público", async ({
    page,
  }) => {
    const enlace = accountNav(page).getByRole("link", {
      name: es.nav.myPublications,
    });

    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute("href", new RegExp(`/u/${username}$`));
  });

  /*
   * Slice 5: era un callejón sin salida. Se llegaba al perfil desde el menú y ahí se acababa la
   * sección — ni menú ni vuelta—. El hilo es una barra fina y **no** la columna del menú: ese
   * perfil es la página que ve cualquiera, así que su dueño tiene que seguir viéndola como la
   * reparte.
   */
  test("Y ese perfil devuelve a la cuenta, sin dejar de verse como lo ven los demás", async ({
    page,
  }) => {
    await page.goto(`/u/${username}`);

    const hilo = page.getByTestId("account-back-bar");

    await expect(hilo).toBeVisible();
    await expect(
      hilo.getByRole("link", { name: es.nav.myAccount }),
    ).toHaveAttribute("href", /\/cuenta$/);
    await expect(hilo).toContainText(es.nav.myPublications);
    // Lo que no cambia: el perfil no se mete en la columna de la cuenta.
    await expect(page.getByTestId("account-nav")).toHaveCount(0);
  });

  test("Y el hilo sobrevive a la paginación del perfil", async ({ page }) => {
    await page.goto(`/u/${username}/page/1`);

    await expect(page.getByTestId("account-back-bar")).toBeVisible();
  });

  /* Slice 5: «Mis hábitos» era la otra salida sin retorno. */
  test("Y /habitos monta la misma sección, con «Mis hábitos» activo", async ({
    page,
  }) => {
    await page.goto("/habitos");
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.myHabits }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.myAccount, exact: true }),
    ).toBeVisible();
  });
});

/*
 * `/habitos` se comparte, y quien llega por un enlace no tiene cuenta: cinco destinos que lo
 * mandan a identificarse no son navegación. Sin sesión, la página se queda como estaba.
 */
test.describe("Cuando alguien sin sesión abre /habitos", () => {
  test("Entonces la ve entera, y sin ninguna navegación de cuenta", async ({
    page,
  }) => {
    await page.goto("/habitos");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: es.atomicChallenges.indexTitle,
      }),
    ).toBeVisible();
    await expect(page.getByTestId("account-nav")).toHaveCount(0);
    await expect(page.getByTestId("account-back-bar")).toHaveCount(0);
  });
});

/*
 * El hilo dice «Mi cuenta»: en el perfil de otra persona eso no describe nada de la página que se
 * está mirando.
 */
test.describe("Cuando miro el perfil de otra persona", () => {
  let dbSession: DbSession | undefined;
  const ajeno = "e2e-perfil-ajeno";

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    /* Una cuenta real que no es la mía: la suite no crea usuarios, así que toma una que ya existe
       y le presta una dirección personal con el prefijo que el barrido limpia. */
    await claimUsernameFor(await findAnotherUserId(dbSession.userId), ajeno);
  });

  test.afterEach(async () => {
    await releaseUsername(ajeno);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces no se me ofrece ningún hilo de vuelta a mi cuenta", async ({
    page,
  }) => {
    await page.goto(`/u/${ajeno}`);

    await expect(page.getByTestId("account-back-bar")).toHaveCount(0);
  });
});

test.describe("Cuando alguien sin tienda abre su cuenta", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await page.goto("/cuenta");
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces también ve un solo título y dos bloques que explican qué gana", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveCount(1);

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: es.account.becomeSellerTitle,
      }),
    ).toBeVisible();
    await expect(page.getByText(es.account.becomeSellerIntro)).toBeVisible();

    await expect(
      page.getByRole("heading", { level: 2, name: es.account.usernameTitle }),
    ).toBeVisible();
    await expect(page.getByText(es.account.usernameIntro)).toBeVisible();
  });

  /* Sin tienda, la agenda no sirve para nada: se oculta en vez de llevar a dar de alta lo que
     falta. Mis pedidos y Mis hábitos no dependen de vender, así que se ofrecen igual. */
  test("Entonces la navegación no ofrece agenda, y sí pedidos y hábitos", async ({
    page,
  }) => {
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.myOrders }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: es.nav.myHabits }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: es.nav.schedule })).toHaveCount(
      0,
    );
  });
});
