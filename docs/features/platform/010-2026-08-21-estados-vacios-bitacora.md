# Bitácora — Un vacío dice tres cosas

> Fuente: `Hazlo Sano — Sistema de diseño v2`, sección **06 · Estados y patrones de UX**.
> Continúa la serie de `007`, `008` y `009`.

---

## Slice 1 — Los vacíos dejan de ser callejones (2026-08-21)

### Objetivo

La sección 06 del canvas lo resume en una línea: **un vacío siempre dice tres cosas — qué falta, por
qué está bien que falte, y qué hacer ahora**. Aplicarlo donde más se nota.

### La auditoría

El catálogo de mensajes tiene **33 estados vacíos**. Repartidos así:

| Cómo estaban | Cuántos | Ejemplo |
| --- | --- | --- |
| Dicen las tres cosas | 6 | `pillarLocal.*.empty`: «Todavía nadie ha publicado nada de movimiento cerca de ti. Si das clases, entrenas o abres una cancha, **esta sección es tuya**.» |
| Dicen dos (falta + acción) | 2 | `cart.empty` + `cart.emptyCta` |
| **Dicen solo qué falta** | 25 | `feed.empty`: «No hay comidas publicadas aún.» Y punto. |

Los 25 no son todos iguales. El de una tienda ajena —«Esta tienda todavía no ha publicado nada»— no
tiene acción que ofrecer a quien mira, y está bien que se quede corto. Pero los del **catálogo y la
búsqueda** sí: son los que pisa quien llega por primera vez, y los cinco eran callejones.

### Decisiones y por qué

1. **Las tres partes son props separadas, no una cadena.** Con un solo texto, la tentación es
   escribir las tres cosas en una frase larga — y la que se cae al traducir es siempre la tercera,
   que es la única que sirve para algo.

2. **`EmptyState` vive en el design system y no traduce nada.** Tiene que poder pintarse fuera del
   árbol de next-intl (`app/not-found.tsx` está fuera de `[locale]`), así que los textos llegan
   hechos y la acción llega como nodo.

3. **El título es un encabezado de verdad** (`Heading level={2}`). La sección se quedó sin
   contenido, no sin título: quien navega por encabezados tiene que poder encontrar dónde está.

4. **La acción cambia según la superficie.** En el home, productos y eventos es *publicar* —el vacío
   se llena publicando—; en categoría y búsqueda es *ver el catálogo completo*, porque ahí el
   problema no es que no haya nada, es que no hay nada **de eso**.

5. **El botón secundario pide el par `default`, no `white`.** La tarjeta del vacío ya es blanca, y
   `white` dejaba el botón sin silueta: se veía como texto suelto. Comprobado en pantalla, que es
   donde se vio.

### Archivos tocados

**Nuevos**
- `src/presentation/design_system/feedback/EmptyState.tsx` · `EmptyState.test.tsx`
- este documento

**Superficies**
- `src/app/(home)/PostsWithLoadMore.tsx` · `productos/ui/ProductsList.tsx` ·
  `eventos/ui/EventsList.tsx` · `categoria/[key]/ui/CategoryPosts.tsx` · `buscar/page.tsx`

**Catálogos** — `feed`, `products`, `events`, `category` y `search` ganan su `*Body` y su `*Cta`,
en los dos idiomas.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | 205 archivos, **2213 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (965 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test publicationPillarFilter busquedaRelevante unifiedCatalog home` | 31 verdes + 1 caída |

**Sobre esa caída.** `publicationPillarFilter` («la búsqueda del header respeta el pilar activo»)
falló en la primera pasada. Se comprobó con `git stash` que el árbol limpio pasaba, y luego se
repitió **con los cambios puestos**: 3/3 en verde. Es la flakiness en frío que este repo ya tiene
documentada, no una regresión.

Revisado en pantalla: `/buscar?q=zzzzqx` y `/?pillar=mindSpirit`.

### Recap

Los cinco vacíos que pisa quien llega por primera vez —el feed del home, productos, eventos,
categoría y búsqueda— dejan de ser callejones: dicen qué falta, por qué está bien que falte y qué
hacer ahora, con una salida que lleva a algún sitio. El patrón queda como primitivo, así que el
sexto vacío no vuelve a discutirse.

### Próximos pasos (opciones)

1. **Los otros 20 vacíos**, uno por uno: varios son de contenido ajeno y está bien que se queden
   cortos, pero `account.scheduleEmpty` y `orders.sellerEmpty` sí tienen acción que ofrecer.
2. **La otra regla del 06**: «ningún mensaje termina en el diagnóstico». Toca auditar los errores.
3. **El admin**, si se decide meterlo en el alcance del rediseño.

---

## Slice 2 — Ningún error termina en el diagnóstico (2026-08-21)

### Objetivo

La otra regla de la sección 06: **un mensaje de error dice el dato concreto y ofrece la acción que
lo arregla**. El ejemplo del canvas es explícito: «No pudimos subir la foto. Pesa 34 MB y el límite
es 20 MB» → «Reducirla y reintentar».

### La auditoría

26 mensajes de error en el catálogo. **La mayoría ya cumplía**, y bien: «Ese archivo no es un GPX.
Expórtalo de tu reloj o de Strava», «Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116», «Ese
pedido cambió mientras lo mirabas. Recarga para ver cómo está».

Los «X es obligatorio» **se quedan como están**: son validación de campo y el campo está justo al
lado, así que «obligatorio» ya es la acción. Alargarlos añadiría ruido sin añadir salida.

Cuatro sí eran callejones:

| Mensaje | Qué tenía de malo |
| --- | --- |
| `publish.errorUnexpected` | El peor. Bromeaba —«No eres tu, soy yo, tu servidor :(»—, tenía dos erratas y no ofrecía nada, justo cuando alguien acaba de perder un formulario largo |
| `publish.errorRouteEmpty` | «El archivo está vacío.» Y punto |
| `orders.errorEmpty` | «Ya no tienes nada de esa tienda en el carrito.» ¿Y ahora? |
| `orders.errorUnavailable` | «Se agotó todo lo que llevabas de esta tienda.» Un callejón en el momento de pagar |

### Las dos cosas que hubo que verificar antes de prometerlas

1. **«Lo que escribiste sigue en el formulario».** Es cierto, y se comprobó: `PublishForm` usa
   `useActionState` y **no llama a `reset()`**, así que un fallo del servidor re-renderiza sin
   navegar y los campos conservan lo tecleado. Hay una prueba que lo fija, con el motivo escrito: si
   alguien añade un `reset()`, el mensaje pasa a mentir — y mentir al final de un formulario largo
   es peor que la broma que había antes.

2. **«Escríbenos por WhatsApp» se cayó del borrador.** `BRAND_SOCIAL_URLS` son TikTok, Facebook y un
   bot de Telegram: **la marca no tiene un WhatsApp de soporte**, así que esa instrucción habría
   sido hueca. Queda «espera un minuto e inténtalo otra vez», que sí se puede hacer. En cambio
   «pídele por WhatsApp» sí se queda en el error del carrito: ahí el WhatsApp es el del vendedor, y
   ese existe — es como se confirma cada pedido.

### La prueba

`src/i18n/errorMessages.test.ts` no mide «buena redacción», que no es comprobable. Mide que la frase
**siga después del punto**: un diagnóstico a secas es una sola oración. Y fija las dos promesas
concretas del genérico de publicar.

### Archivos tocados

- `src/i18n/messages/{es,en}.json` — cuatro mensajes reescritos en los dos idiomas
- `src/i18n/errorMessages.test.ts` (nuevo)

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | 206 archivos, **2223 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (966 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test validacionFormularios publishProduct` | **9/9 en verde** |

### Recap

De los 26 errores del sitio, 22 ya ofrecían salida; los cuatro que no la ofrecían la tienen ahora, y
el peor de todos —el genérico que bromeaba mientras alguien perdía un formulario— dice lo único que
importa en ese momento: que no fue culpa suya, que lo escrito no se perdió y qué hacer. Las dos
promesas que hace se verificaron antes de escribirlas, y una de ellas se cayó del borrador por no
ser cierta.

### Próximos pasos (opciones)

1. **Los 20 vacíos restantes** del slice 1, uno por uno.
2. **La cola offline** del 06 —«guardamos tu borrador aquí y lo publicamos en cuanto vuelvas»— es
   UX nueva de verdad: necesita almacenamiento local y reintento. Slice propio, si se decide.
3. **El admin**, si se decide meterlo en el alcance del rediseño.
