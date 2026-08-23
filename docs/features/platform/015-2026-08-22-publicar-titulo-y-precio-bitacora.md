# Bitácora — El contador del título y la moneda del precio

> Fuente: `Hazlo Sano — Sistema de diseño v2`, sección **5.3 · publicar**, los controles.
> Continúa [014 — la vista previa](014-2026-08-22-publicar-vista-previa-bitacora.md).

---

## Slice 3 — Dos números que faltaban (2026-08-22)

### El tope del título salió de la base, no del canvas

El canvas dibuja «29/70». Setenta es un número creíble, pero antes de imponerlo había que saber a
quién recorta. Los 59 títulos publicados dicen esto:

| | |
| --- | --- |
| El más largo | **61** |
| Media | 32 |
| Percentil 95 | 57 |
| Pasan de 70 | **0** |

Así que setenta **no recorta nada de lo que ya existe** y sí evita el título que se corta con puntos
suspensivos en la tarjeta del listado, que es lo único donde el título se lee entero. El canvas
acertó; lo que hacía falta era comprobarlo.

`POST_TITLE_MAX_LENGTH` va sin `process.env`, a diferencia de su vecino `POST_CONTENT_MAX_LENGTH`:
no hay razón para que cambie por entorno, y una constante configurable es una constante que en CI
vale otra cosa — algo que ya costó un spec que fallaba siempre en GitHub y nunca en local.

**El tope se aplica también al editar.** Un límite que solo existe en una de las dos pantallas no es
un límite: se esquiva editando, y la tarjeta vuelve a cortar títulos. Una prueba lee el fuente de
`/editar` para que siga siendo así.

### El contador cuenta desde donde ya se estaba contando

El número sale de `draft`, el mismo que alimenta la vista previa. Una segunda lectura del campo
habría sido una segunda fuente para el mismo dato, con la ventaja de nada.

Va en el `labelSuffix` del propio `TextField` —el design system ya tenía el hueco— y **sí entra en
el nombre accesible** del campo: quien usa lector de pantalla oye «Título de la publicación,
obligatorio, 29/70» al enfocarlo, que es exactamente lo que el contador vino a decir. No se
re-anuncia al teclear, así que no molesta.

La prueba busca el contador por su **forma** (`\d+/70`) y no por su texto completo: el rótulo
antepone un separador « · » que es decisión del design system y no de esta pantalla.

### La moneda, escrita

El 5.3 pone `$ 180 MXN`. Aquí el campo ya llevaba el icono de precio del design system, así que se
añade solo el sufijo `MXN` —de `SITE_CURRENCY`, no escrito a mano— y no un `$` que junto a `MXN`
sería la misma información dos veces. Se pone en las dos pantallas: un número suelto no dice en qué
está.

### Lo que queda del 5.3

El **tipo como píldoras segmentadas** se deja para su propio slice. No es más difícil de pintar,
pero cambia un `<select>` por un grupo de radios y eso toca tres page objects, un spec y dos
ayudantes de Vitest. Merece hacerse una vez y bien —con un solo sitio que sepa elegir el tipo—, no
de propina al final de otro slice.

### Archivos tocados

**Nuevos**
- `publicar/tituloYPrecio.test.tsx`

**Modificados**
- `infra/constants/index.ts` — `POST_TITLE_MAX_LENGTH`
- `publicar/PublishForm.tsx` — contador, pista, tope y sufijo de moneda
- `editar/[slug]/ui/EditPostForm.tsx` — el mismo tope y el mismo sufijo
- `src/i18n/messages/{es,en}.json` — dos rótulos

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "…/publicar" "…/editar"` | **95 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (994 archivos) |
| `pnpm exec playwright test src/e2e/publicar createPost publishProduct validacionFormularios` | **17 en verde**, 1 saltada, 0 rojas |

### Recap

El título dice cuánto llevas y cuánto cabe, y el tope es el mismo al publicar y al editar. El precio
dice en qué moneda está. Los dos números salen de una constante y de la base, no de la maqueta.

### Próximos pasos (opciones)

1. **El tipo como píldoras segmentadas**, con un único ayudante que sepa elegirlo.
2. **Adoptar en la hidratación lo que ya esté elegido** en `kind`/`category`.
3. **Seguir con el resto de secciones del canvas.**
