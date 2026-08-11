/**
 * Next dev compila **cada ruta la primera vez que alguien la pide**, no al arrancar. Playwright ya
 * espera a que el puerto responda (`webServer.url`), pero responder no es lo mismo que tener
 * `/productos` compilada: el primer escenario que la visita paga la compilación **dentro** de su
 * presupuesto de espera, y ahí es donde revienta.
 *
 * Ya mordió tres veces en la misma corrida —`about.spec.ts`, `createPost.spec.ts` y el submenú
 * sobre el mapa—, las tres tras borrar `.next`, y las tres pasaron en aislamiento sin tocar una
 * línea. Un fallo que no distingue "está roto" de "aún no compila" no informa de nada.
 *
 * Dormir unos segundos no lo arregla: corto sigue fallando y largo se lo cobra a todas las
 * corridas, incluidas las calientes. Esto espera **el hecho** —la ruta respondió— y cuando ya está
 * caliente cuesta milisegundos.
 */

/**
 * No son URLs, son **unidades de compilación**: Next compila por segmento de ruta, así que
 * `/buscar?q=pan` calienta todas las búsquedas y `/productos` calienta el mapa para quien lo pida
 * después.
 *
 * La lista es corta a propósito. Calentar una ruta que la corrida no va a visitar es pagar una
 * compilación de balde, así que aquí solo están las que la suite pisa casi siempre o las que ya
 * fallaron por frías.
 */
const RUTAS = [
  "/", // Casi todos los escenarios empiezan aquí.
  "/productos", // El mapa entra por import dinámico: es la más cara de todas.
  "/productores-locales",
  "/negocios-locales",
  "/publicar", // El formulario; fue uno de los tres fallos en frío.
  "/info", // Fue otro.
  "/buscar?q=pan",
  /* `/cuenta`. Entra por los dos motivos de esta lista a la vez: la pisan siete specs —los cuatro
     de `sellerStore` y los tres de `compartir`— y ya falló en frío. Se volvió cara: arrastra el
     desplegable de Radix del menú de compartir, sus iconos, y el `ImageVideoUploader` con la
     medición de imágenes, que `page.tsx` importa siempre aunque solo lo pinte quien ya tiene
     tienda. El síntoma era el de siempre: un `click` esperando 90 s un formulario que aún no
     existía, y verde al reintentarlo solo. */
  "/cuenta",

  /* Las tres del carrito y los pedidos. Entraron aquí por el mismo camino que `/cuenta`: la
     corrida siguiente a estrenarlas dio **siete fallos** repartidos por tres archivos, todos
     esperando un elemento de una ruta que aún no existía compilada, y todos verdes al reintentar.
     Las pisa cada escenario de `orders`. */
  "/carrito",
  "/pedidos",
  /* Sin sesión redirige a identificarse, y eso basta: lo que se busca es compilar el segmento, no
     ver un pedido. El uuid de ceros no existe ni existirá. */
  "/pedido/00000000-0000-0000-0000-000000000000",

  /* `/buscar/[term]/page/[page]` es **otra unidad de compilación** que `/buscar`: comparten el
     primer segmento y nada más. La usan los dos escenarios de `cartFromSearch`, que fueron dos de
     aquellos siete fallos. */
  "/buscar/pan/page/1",
  "/habitos/sueno",
  "/habitos/alimentacion",
  "/habitos/movimiento",
  "/habitos/mente-espiritu",
] as const;

/** Compilar una ruta pesada en frío pasa de largo cualquier plazo corto. */
const MARGEN_MS = 90_000;

async function calentar(baseUrl: string, ruta: string): Promise<void> {
  await fetch(new URL(ruta, baseUrl), {
    // El sitio decide el idioma por `Accept-Language` y la suite corre en español (ver
    // `playwright.config.ts`). Sin esto calentaríamos `/en/...`, que son otras rutas.
    headers: { "Accept-Language": "es-MX" },
    signal: AbortSignal.timeout(MARGEN_MS),
  });
}

/**
 * Nunca tumba la suite. Si una ruta no responde, el escenario que la use dirá qué pasa con mucho
 * más contexto que un fallo aquí, en un gancho que el informe apenas menciona.
 *
 * Por eso no se mira el código de estado: un 500 —la base tarda en despertar más de lo que aguanta
 * el pool— también compila la ruta, que es lo único que se busca. El único hueco conocido es que si
 * el render del servidor revienta, sus imports dinámicos de cliente no llegan a compilar; el mapa
 * de `/productos` es el caso a vigilar.
 */
export async function warmRoutes(baseUrl: string): Promise<void> {
  const inicio = Date.now();
  const frias: string[] = [];

  /*
   * De una en una, y no con `Promise.allSettled`.
   *
   * En paralelo Next compila varias rutas a la vez y **cada compilación reescribe**
   * `.next/dev/prerender-manifest.json`. Sin reemplazo atómico, dos escrituras solapadas dejan el
   * archivo con un JSON válido seguido de basura, y a partir de ahí el servidor responde 500 a todo
   * con un `SyntaxError` que no menciona ni el archivo ni la ruta. Se diagnostica fatal: parece un
   * fallo de la aplicación.
   *
   * Calentar en serie tarda más, pero es una vez por corrida y fuera del presupuesto de cualquier
   * escenario. Un calentamiento que rompe el servidor no calienta nada.
   */
  for (const ruta of RUTAS) {
    try {
      await calentar(baseUrl, ruta);
    } catch {
      frias.push(ruta);
    }
  }

  if (frias.length > 0) {
    console.warn(
      `[e2e] no respondieron al calentarlas: ${frias.join(", ")}. ` +
        "Si un escenario de esas rutas falla por tiempo, es esto y no una regresión.",
    );
  }

  console.log(
    `[e2e] ${RUTAS.length - frias.length}/${RUTAS.length} rutas calientes en ${Math.round((Date.now() - inicio) / 1000)} s.`,
  );
}
