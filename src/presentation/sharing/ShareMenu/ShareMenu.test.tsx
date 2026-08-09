import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import ShareMenu from "./ShareMenu";

const STORE = {
  url: "https://hazlosano.com/tienda/hazlo-sano",
  title: "Hazlo Sano",
  text: "Mira mi tienda: Hazlo Sano",
};

/**
 * `navigator.share` no existe en jsdom, que es justo el caso "escritorio sin soporte". Para el otro
 * se instala un doble y se retira al terminar, porque `navigator` es global entre pruebas.
 */
function givenNativeShare(
  implementation: () => Promise<void> = () => Promise.resolve(),
) {
  const share = vi.fn(implementation);
  Object.defineProperty(navigator, "share", {
    value: share,
    configurable: true,
    writable: true,
  });
  return share;
}

function givenClipboard(
  implementation: () => Promise<void> = () => Promise.resolve(),
) {
  const writeText = vi.fn(implementation);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  return writeText;
}

afterEach(() => {
  // @ts-expect-error se retira la propiedad que se inyectó, que en jsdom no existe de origen.
  delete navigator.share;
  vi.restoreAllMocks();
});

/**
 * `userEvent.setup()` **instala su propio `navigator.clipboard`**, así que se llama primero y los
 * dobles de cada prueba se ponen encima. Al revés, el portapapeles de mentira lo pisaba `userEvent`
 * y las dos pruebas de copiado afirmaban sobre un doble que nadie miraba.
 */
const setupUser = () => userEvent.setup({ writeToClipboard: false });

async function clickTrigger(user: ReturnType<typeof setupUser>) {
  await user.click(screen.getByRole("button", { name: es.share.trigger }));
}

describe("Cuando alguien comparte desde un navegador con hoja nativa", () => {
  it("Entonces se le ofrece la hoja del sistema, con título, texto y dirección", async () => {
    const user = setupUser();
    const share = givenNativeShare();
    renderWithIntl(<ShareMenu {...STORE} />);

    await clickTrigger(user);

    expect(share).toHaveBeenCalledWith({
      title: STORE.title,
      text: STORE.text,
      url: STORE.url,
    });
  });

  /* Es la ÚNICA vía a Instagram y TikTok, que no tienen URL de compartir web. Si además se
     desplegara el menú, el vendedor vería dos cosas abiertas a la vez por un solo clic. */
  it("Entonces no se despliega además el menú de destinos", async () => {
    const user = setupUser();
    givenNativeShare();
    renderWithIntl(<ShareMenu {...STORE} />);

    await clickTrigger(user);

    expect(screen.queryByText(es.share.copyLink)).not.toBeInTheDocument();
  });

  /* Cerrar la hoja del sistema rechaza la promesa con `AbortError`. No es un fallo: es alguien que
     se arrepintió. Sin capturarlo, queda un rechazo sin manejar en la consola. */
  it("Entonces cancelarla no rompe nada", async () => {
    const user = setupUser();
    givenNativeShare(() =>
      Promise.reject(
        Object.assign(new Error("Share canceled"), { name: "AbortError" }),
      ),
    );
    renderWithIntl(<ShareMenu {...STORE} />);

    await clickTrigger(user);

    expect(
      screen.getByRole("button", { name: es.share.trigger }),
    ).toBeInTheDocument();
  });
});

describe("Cuando alguien comparte desde un navegador sin hoja nativa", () => {
  it("Entonces se despliegan los destinos y copiar el enlace", async () => {
    const user = setupUser();
    renderWithIntl(<ShareMenu {...STORE} />);

    await clickTrigger(user);

    for (const label of [
      es.share.whatsapp,
      es.share.facebook,
      es.share.x,
      es.share.telegram,
      es.share.email,
      es.share.copyLink,
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("Entonces cada destino lleva la dirección ya codificada", async () => {
    const user = setupUser();
    renderWithIntl(<ShareMenu {...STORE} />);

    await clickTrigger(user);

    const hrefFor = (label: string) =>
      screen.getByText(label).closest("a")?.getAttribute("href");
    const encodedUrl = encodeURIComponent(STORE.url);

    expect(hrefFor(es.share.whatsapp)).toBe(
      `https://wa.me/?text=${encodeURIComponent(`${STORE.text} ${STORE.url}`)}`,
    );
    expect(hrefFor(es.share.facebook)).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    );
    expect(hrefFor(es.share.telegram)).toContain(encodedUrl);
    expect(hrefFor(es.share.email)).toMatch(/^mailto:/);
  });

  /* Un enlace a otro dominio que abre en pestaña nueva sin `noopener` le da a la página destino
     acceso a `window.opener`. */
  it("Entonces los destinos externos se abren sin dejar acceso a la pestaña", async () => {
    const user = setupUser();
    renderWithIntl(<ShareMenu {...STORE} />);

    await clickTrigger(user);

    const link = screen.getByText(es.share.whatsapp).closest("a");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("Entonces copiar el enlace lo deja en el portapapeles y lo confirma", async () => {
    const user = setupUser();
    const writeText = givenClipboard();
    renderWithIntl(<ShareMenu {...STORE} />);

    await clickTrigger(user);
    await user.click(screen.getByText(es.share.copyLink));

    expect(writeText).toHaveBeenCalledWith(STORE.url);
    expect(await screen.findByText(es.share.copied)).toBeInTheDocument();
  });

  /* En una tarjeta de listado el botón es solo el icono, porque doce botones con texto compiten
     con los doce títulos. Lo que NO se acorta es el nombre accesible: sin `aria-label` el botón se
     anunciaría como "botón" a secas, que es lo mismo que no estar. */
  it("Entonces la variante de icono conserva su nombre accesible", async () => {
    const user = setupUser();
    renderWithIntl(<ShareMenu {...STORE} variant="icon" />);

    const trigger = screen.getByRole("button", { name: es.share.trigger });

    expect(trigger).toHaveTextContent("");

    await user.click(trigger);

    expect(screen.getByText(es.share.whatsapp)).toBeInTheDocument();
  });

  /* Sin contexto seguro, `writeText` rechaza. Decirlo es mejor que un botón que no hace nada: la
     dirección está escrita justo encima y se puede seleccionar a mano. */
  it("Entonces un portapapeles que falla se dice, no se calla", async () => {
    const user = setupUser();
    givenClipboard(() => Promise.reject(new Error("Denied")));
    renderWithIntl(<ShareMenu {...STORE} />);

    await clickTrigger(user);
    await user.click(screen.getByText(es.share.copyLink));

    expect(await screen.findByText(es.share.copyFailed)).toBeInTheDocument();
  });
});
