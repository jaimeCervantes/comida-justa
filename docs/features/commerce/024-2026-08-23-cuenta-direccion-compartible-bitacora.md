# Bitácora — La dirección de la tienda, corta y compartible

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.15 · /cuenta**.

---

## Slice 1 — Lo que ya estaba, y lo que sobraba (2026-08-23)

### Las tres anotaciones del 5.15, revisadas

| Anotación | Estado |
| --- | --- |
| «Tres campos y ya hay tienda… con el nombre en foco al entrar» | **ya estaba** |
| «La dirección se ve antes de existir… con la misma función que usa el servidor» | **ya estaba** (`generateSellerHandle`) |
| «Se lee corto, se comparte completo» | **ya estaba** en `PublicAddressRow`… y sin afirmar en ninguna prueba |

Este slice no añade pantalla. Añade la **prueba que faltaba** y retira **código que prometía esa
pantalla y no llegaba a ejecutarse nunca**.

### El componente que nadie veía

`BecomeSellerForm` tenía un `StoreReadyMessage` —«tu tienda está en línea, repártela»— que se
pintaba cuando la acción devolvía el `handle`. Enseñaba la dirección **absoluta** en un enlace con
`break-all` y **no ofrecía compartirla**, justo en el momento en que su propio título dice que hay
que hacerlo.

Iba a arreglarlo reusando `PublicAddressRow`. Antes de darlo por bueno, se midió en el navegador:

```
url: /cuenta
store-ready -> 0
store-card  -> 1
```

**Nunca se pintaba.** La Server Action revalida `/cuenta` al terminar, y la página vuelve con
`StoreCard` en el sitio del formulario. Así que el arreglo habría sido pulir una pantalla muerta —y
habría parecido que funcionaba, porque la de al lado sí—. Se retira.

Quien abre su tienda aterriza en `StoreCard`, que ya usa `PublicAddressRow`: camino corto para leer,
dirección absoluta para repartir y pestaña nueva para no perder la cuenta a medio configurar. Las
tres decisiones del 5.15, escritas y comentadas desde antes.

### Un `data-testid` que engaña

`ShareMenu` cuelga su identificador de `` `${testId}-trigger` ``, no del `testId` a secas. Buscar
`share-store` da **cero** sin que nada esté roto — y eso es exactamente lo que hizo dudar de si el
botón existía. Queda escrito en el page object para que no vuelva a costar una vuelta.

### Lo que ahora sí está afirmado

Tras abrir la tienda: el enlace dice **solo** `/tienda/<handle>` —no la dirección absoluta, que es
lo que dejaba sin sitio al botón—, se abre en otra pestaña, y el disparador de compartir está a la
vista.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` · `lint` | limpios (1003 archivos) |
| `pnpm exec vitest --run "…/cuenta"` | **4 en verde** |
| `pnpm exec playwright test src/e2e/sellerStore` | **34/34** |

### Recap

El 5.15 ya estaba entregado; lo que faltaba era la prueba que lo sostiene y la retirada de una
tarjeta que prometía ese mismo momento sin llegar a ejecutarse. Se midió en el navegador antes de
tocarla, que es lo único que distinguió «arreglar» de «pulir código muerto».
