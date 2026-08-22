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
