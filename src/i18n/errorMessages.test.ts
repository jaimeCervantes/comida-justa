import { describe, expect, it } from "vitest";
import en from "./messages/en.json";
import es from "./messages/es.json";

/**
 * La segunda regla de la sección 06 del canvas de v2: **ningún mensaje termina en el diagnóstico**
 * — dice el dato concreto y ofrece la acción que lo arregla.
 *
 * De los 26 mensajes de error del catálogo, la mayoría ya la cumplía («Ese archivo no es un GPX.
 * Expórtalo de tu reloj o de Strava»). Cuatro no: los dos del carrito, el del archivo vacío y, el
 * peor, el genérico de publicar, que además bromeaba —«No eres tu, soy yo, tu servidor :(»— con dos
 * erratas y sin ninguna salida, justo en el momento en que alguien acaba de perder un formulario.
 *
 * Esta prueba fija los cuatro. No mide «buena redacción»: mide que la frase **siga después del
 * punto**, que es lo único comprobable — un diagnóstico solo es una oración.
 */
const CON_SALIDA = [
  "publish.errorUnexpected",
  "publish.errorRouteEmpty",
  "orders.errorEmpty",
  "orders.errorUnavailable",
] as const;

function messageAt(catalog: unknown, path: string): string {
  return path.split(".").reduce<unknown>((node, key) => {
    return (node as Record<string, unknown>)[key];
  }, catalog) as string;
}

/** Cuántas oraciones tiene: un diagnóstico a secas es una. */
function sentences(message: string): number {
  return message.split(/[.:]\s+/).filter(Boolean).length;
}

describe("los errores no terminan en el diagnóstico", () => {
  it.each(CON_SALIDA)("%s ofrece una salida en español", (path) => {
    const message = messageAt(es, path);

    expect(message, `${path} no existe`).toBeTruthy();
    expect(
      sentences(message),
      `${path} se queda en el diagnóstico: "${message}"`,
    ).toBeGreaterThan(1);
  });

  it.each(CON_SALIDA)("%s ofrece una salida en inglés", (path) => {
    expect(sentences(messageAt(en, path))).toBeGreaterThan(1);
  });

  /*
   * El genérico de publicar afirma que lo escrito sigue en el formulario. Es cierto porque
   * `PublishForm` usa `useActionState` sin `reset()`: un fallo del servidor re-renderiza, no navega,
   * y los campos conservan lo que la persona tecleó. Si alguien añade un `reset()`, el mensaje pasa
   * a mentir — y mentir al final de un formulario largo es peor que la broma que había antes.
   */
  it("el genérico de publicar promete que lo escrito sigue ahí", () => {
    expect(messageAt(es, "publish.errorUnexpected")).toMatch(
      /sigue en el formulario/i,
    );
    expect(messageAt(en, "publish.errorUnexpected")).toMatch(
      /still in the form/i,
    );
  });

  /* Y ya no bromea ni echa la culpa: alguien acaba de perder un formulario largo. */
  it("y no bromea con quien acaba de perder su trabajo", () => {
    const message = messageAt(es, "publish.errorUnexpected");

    expect(message).not.toMatch(/:\(|soy yo|no eres tu/i);
  });
});
