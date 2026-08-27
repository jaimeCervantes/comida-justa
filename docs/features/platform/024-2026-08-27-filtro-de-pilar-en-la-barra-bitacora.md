# Bitácora — El filtro de pilares se une a la barra de cercanía

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **05–06**, punto «barra fija de
> pilar+distancia» — uno de los que quedaron fuera de alcance del roadmap original. Cierra el
> `@slice-4` que `chrome.feature` dejó escrito como `@future`.

## Slice 1 — /, /productos y el criterio de NearbyBar, no el del canvas (2026-08-27)

### Dos conflictos, resueltos antes de escribir código

El canvas pedía una barra **fija** de pilar+distancia. `NearbyBar` —donde ya vive la ubicación—
tiene escrito en su propio docstring por qué no es `sticky`: en un teléfono, header y búsqueda ya
ocupan ~116px, y una tercera fila fija se comería ~152px de una pantalla de 640. Esa decisión ya se
tomó una vez. Se acordó con el usuario que el filtro **hereda el criterio de la barra que lo
aloja**, no al revés: se une a `NearbyBar`, sigue sin ser fija.

El segundo conflicto era de arquitectura: `PublicationPillarFilter` construye enlaces atados a
`pathname`/`params`/`query` de la página donde vive, y `NearbyBar` se monta **una sola vez** en
`RootLayout`, que no recibe `searchParams` — un layout es compartido por rutas hermanas con
parámetros distintos, así que no puede depender de ellos. Se acordó también el alcance: este slice
solo cubre `/` y `/productos`, las dos rutas donde el filtro ya vivía con más tráfico; categoría,
directorio, perfil y tienda se quedan como estaban.

### La solución: hooks de cliente, no plomería de servidor

La alternativa era inyectar la ruta actual al layout vía un header de `proxy.ts` (el equivalente de
middleware en Next 16) — funciona, pero es plomería nueva que toca **cada** petición del sitio por
un filtro que hoy solo importa en dos rutas. En vez de eso, `NearbyPillarFilter` es un Client
Component que lee `usePathname()` y `useSearchParams()` por su cuenta: decide solo, por ruta, si
hay algo que mostrar. `NearbyBar` sigue sin saber en qué página está — el mismo principio de
responsabilidad que ya tenía.

### Reusa el primitivo, no lo reescribe

`PublicationPillarFilter` no cambió de comportamiento: los mismos cinco enlaces, el mismo
`data-testid`, el mismo criterio de contraste por pilar. Ganó un `className` opcional —antes tenía
`pt-4` fijo, pensado para ir justo debajo de un título—, porque dentro de la fila de `NearbyBar` ese
espaciado sobraba. `NearbyPillarFilter` lo pasa en `pt-0`; los otros cuatro usos existentes no
tocan la prop y siguen con su espaciado de siempre.

### Qué se quitó, y qué no

Se retiró `<PublicationPillarFilter />` de `PostsWithLoadMore.tsx` (home) y de las dos ramas de
`ProductsList.tsx` (vacío y con resultados). `currentPillar` se queda en las dos: `PostsWithLoadMore`
lo sigue usando para pedir la página siguiente del feed, `ProductsList` para el mensaje de vacío y
para que la paginación conserve el pilar activo. Solo se fue el chip visual, no el dato.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Presentación | `src/presentation/location/NearbyPillarFilter.tsx` (+ test, nuevo), `src/presentation/post/PublicationPillarFilter.tsx` (+`className`) |
| Chrome | `src/presentation/chrome/NearbyBar/NearbyBar.tsx` (+ test) |
| Rutas | `src/app/(home)/PostsWithLoadMore.tsx`, `src/app/[locale]/productos/ui/ProductsList.tsx` (retiran el filtro propio) |
| Especificación | `src/e2e/chrome/chrome.feature` (`@slice-4` deja de ser `@future`; nuevo `@future` acotado a las cuatro rutas que faltan) |

### Comandos y resultados

```
pnpm exec vitest --run src/presentation/location src/presentation/chrome/NearbyBar \
  "src/app/(home)" "src/app/[locale]/productos" src/presentation/post   # 165 en verde, 24 archivos
pnpm run typecheck   # limpio
pnpm run lint        # limpio
pnpm run check:i18n  # limpio
pnpm exec playwright test src/e2e/publicationPillarFilter   # 3/3, sin tocarlo
```

Verificado a ojo en `next dev`, escritorio y un iPhone 13 emulado, en `/` y `/productos`: el filtro
envuelve en su propia fila dentro de la misma barra con borde, sin fijarse al hacer scroll, y
`/productos` ya no lo repite bajo el título.

### Recap

El filtro de pilares dejó de vivir dentro de cada feed y se unió a `NearbyBar`, en `/` y
`/productos`. No se construyó una barra fija —esa idea ya se había descartado por costo de
pantalla— ni se le enseñó al layout raíz a leer la ruta: `NearbyPillarFilter` decide por su cuenta,
con los mismos hooks que ya usa el resto del chrome de cliente, y calla en las rutas que no tienen
nada que filtrar.

### Próximos pasos (opciones)

1. **El editor enriquecido** (`docs/features/content/027`) — sigue siendo lo pedido y lo único
   pendiente que arregla algo roto hoy.
2. **Las cuatro rutas que faltan** —categoría, directorio, perfil, tienda—, si se decide que
   también deben unirse a la barra. `NearbyPillarFilter` solo necesita sumarlas a su lista.
3. **Cola offline optimista** — la otra pieza pendiente de la lista de "fuera de alcance". Más
   grande que esta: falta decidir qué dispara la cola, cuánto reintenta y qué se ve mientras espera.
