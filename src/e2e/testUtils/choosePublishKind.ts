import { expect, type Page } from "@playwright/test";
import { publishKindTestId } from "~/app/[locale]/publicar/publishKinds";
import { openPublishStep } from "./openPublishStep";

/**
 * Elige el tipo de publicación en `/publicar`.
 *
 * Desde el 5.3 el tipo son **píldoras** y no un `<select>`: `selectOption` ya no vale, y ese cambio
 * tocaba tres page objects y un spec. Vive aquí para que la próxima vez toque uno.
 *
 * Se localiza por `data-testid` y no por el rótulo porque este formulario existe en dos idiomas
 * —`/publicar` y `/en/publish`— y hay escenarios que lo conducen en los dos. El identificador lo
 * genera `publishKindTestId`, el mismo que usa el componente para escribirlo.
 *
 * Se pulsa la **etiqueta**, no el radio: el radio va con `sr-only`, que lo deja enfocable pero sin
 * área que pulsar. Es también lo que hace quien usa la página.
 *
 * Y se reintenta hasta que la píldora se declara elegida, por lo mismo que `selectWhenHydrated`: es
 * un control de React servido desde el servidor, y un clic antes de la hidratación no avisa a nadie
 * — el formulario se quedaba en «anuncio» sin error ninguno, y lo que fallaba tres líneas después
 * era otra cosa.
 */
export async function choosePublishKind(
  page: Page,
  kind: string,
): Promise<void> {
  await openPublishStep(page, "kind");

  const pill = page.getByTestId(publishKindTestId(kind));

  await expect(async () => {
    await pill.click();
    await expect(pill).toHaveAttribute("data-selected", "true");
  }).toPass({ timeout: 15_000 });
}
