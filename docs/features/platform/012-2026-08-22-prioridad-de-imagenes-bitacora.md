# Bitácora — La prioridad de las imágenes

> Sale de una comprobación hecha al añadir la portada del home
> (`008-2026-08-21-home-v2-bitacora.md`, slice 4), que la dejó anotada como slice propio.

---

## Slice 1 — `priority` estaba deprecado, y `fetchPriority` no se derivaba (2026-08-22)

### Corrección de lo que se había reportado

Al construir la portada se dijo que «`priority` no hace nada». **Era inexacto y conviene dejarlo
escrito**, porque la mitad correcta es la que explica el arreglo.

Medido sobre el HTML del servidor de producción, antes de tocar nada:

| Ruta | `<link rel="preload" as="image">` | `<img>` | con `fetchpriority` | con `loading="lazy"` |
| --- | --- | --- | --- | --- |
| `/` | **2** | 17 | **0** | 15 |
| `/suero-natural` | **2** | 13 | **0** | 11 |

O sea: `priority` **sí funcionaba** —precargaba y quitaba el `lazy` a las dos imágenes correctas—.
Lo que no ocurría era `fetchpriority`.

### Por qué

Leído en `node_modules/next/dist/shared/lib/get-img-props.js` (Next 16.2.1):

```js
const props = { ...rest, loading: loadingFinal, fetchPriority, ... };
const meta  = { ..., preload: preload || priority, ... };
```

`priority` alimenta **solo** `meta.preload`. `fetchPriority` es una prop **independiente** que hay
que pasar. Y en los tipos:

```ts
/** @deprecated Use `preload` prop instead. */
priority?: boolean;
```

No fue un cambio de nombre. `priority` hacía **dos cosas** —adelantar la descarga y ponerla por
delante de las demás— y Next 16 las separó: `preload` y `fetchPriority`. Al partirlas dejó de
derivar la segunda, y las seis llamadas del sitio se quedaron con la mitad sin que nada avisara.

### La decisión que no es un reemplazo mecánico

Cambiar los seis `priority` por `preload fetchPriority="high"` habría sido lo rápido y lo
equivocado. **Son dos cosas distintas y merecen respuestas distintas:**

| Imagen | `preload` | `fetchPriority="high"` | Por qué |
| --- | --- | --- | --- |
| Portada del home (cover) | ✅ | ✅ | Es lo que el navegador mide como contenido más grande |
| Galería de una ficha (la visible) | ✅ | ✅ | La imagen por la que se entra a esa página |
| Logo de la tienda (400px) | ✅ | ✅ | La imagen grande de la tienda, arriba del todo |
| **Logo del header (40px)** | ✅ | ❌ | Está en **todas** las páginas: marcarlo urgente le quita el turno a la imagen que la persona vino a ver |
| Logo de `/nosotros` (100px) | ✅ | ❌ | Acompaña a un titular; no es el contenido más grande |
| Avatar de perfil (96px) | ✅ | ❌ | Un avatar no es el contenido más grande de nada |

**Si todo es urgente, nada lo es.** Tres de las seis se adelantan sin priorizarse.

### El renombrado hacia dentro

`MediaContent` y `MediaGallery` exponían `priority`. Pasan a `preload`, y ganan `fetchPriority` como
prop propia: así el vocabulario del repo es el de Next y no hay que traducir mentalmente en cada
llamada. `ImageWithSkeleton` no necesitó nada — extiende `ImageProps`, así que las dos props ya
pasaban de largo.

En la galería, `fetchPriority` va **solo a la que se está viendo** y depende de `preload`: las
miniaturas de abajo no llevan ninguna de las dos.

### El guardián

`imagePriority.test.ts` comprueba las dos mitades, y la primera contra **el tipo del propio Next**,
no contra una constante escrita a mano: si una versión futura retira `preload` o resucita
`priority`, la prueba lo dice. La segunda recorre el árbol y falla si alguien vuelve a escribir la
prop deprecada — con un patrón que distingue una prop de JSX de un comentario que la mencione.

Y una tercera, que es la que habría evitado todo esto: **alguien tiene que pedir `fetchPriority`**.
Si nadie lo hace, no se prioriza nada y el arreglo se deshace en silencio, que es exactamente como
llegó aquí.

### Archivos tocados

- `src/presentation/media/MediaContent/MediaContent.tsx` · `MediaGallery/MediaGallery.tsx`
- `src/app/(home)/HomeHero.tsx` · `[slug]/ui/PostDetail.tsx`
- `src/presentation/chrome/Header/Header.tsx` · `nosotros/page.tsx` ·
  `tienda/[slug]/ui/StoreHeader.tsx` · `u/[username]/ui/ProfileHeader.tsx`
- `src/presentation/media/imagePriority.test.ts` (nuevo)

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | 209 archivos, **2260 pruebas** en verde |
| `pnpm run typecheck` · `lint` | limpios (977 archivos) |
| `pnpm run build` | compila, **sin el aviso de deprecación** |
| `pnpm exec playwright test home multimedia sellerStore dimensionesMedia` | **57/57 en verde** |

Medido después, sobre el HTML del servidor de producción:

| Ruta | preloads | `fetchpriority="high"` | Cuál |
| --- | --- | --- | --- |
| `/` | 2 | **1** | «Sesión de yoga para dolor de espalda, principiantes» |
| `/suero-natural` | 2 | **1** | «Suero natural» |
| `/tienda/hazlo-sano` | 2 | **1** | «Logo de Hazlo Sano» |

Una por página, y la correcta en cada una.

### Recap

`priority` no era un no-op: precargaba bien, y lo que faltaba era la otra mitad que Next 16 dejó de
derivar al deprecarlo. Ahora las seis llamadas hablan el vocabulario nuevo, y solo tres de ellas
piden ir por delante — las que de verdad son el contenido más grande de su página. Tres pruebas
impiden la recaída, y una de ellas vigila el tipo de Next para enterarse antes que nadie del
siguiente cambio.
