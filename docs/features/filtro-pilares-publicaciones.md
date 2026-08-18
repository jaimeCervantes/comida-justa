# Filtro de pilares en listados de publicaciones

Roadmap para que los listados publicos de publicaciones dejen de leerse como un catalogo de comida
y muestren que la busqueda y el descubrimiento se organizan por los cuatro pilares de Hazlo Sano.

La bitacora del slice vive en `docs/features/filtro-pilares-publicaciones-bitacora.md`.

## Alineamiento

- **Problem:** el home y las secciones que listan publicaciones se leen como listados de
  comida/productos, aunque el proyecto ya esta organizado alrededor de los 4 pilares.
- **Savings:** menos confusion para visitantes; encuentran antes contenido no alimentario y no hay
  que explicar manualmente que Hazlo Sano no es solo catalogo de comida.
- **Why:** refuerza el modelo central del sitio: Sueno, Alimentacion, Movimiento y
  Mente/Espiritu como las cuatro entradas principales al bienestar.

## Modelo acordado

- Las superficies publicas principales que listan publicaciones ganan un filtro visible por pilar:
  home (`/` y `/page/[page]`), productos, categoria, busqueda, tienda y perfil publico.
- La busqueda rapida que vive en el menu principal (`Header` -> `SearchBar`) tambien entiende el
  pilar activo.
- La opcion inicial es **Todo**, para conservar el comportamiento actual.
- Los cuatro pilares son los ya publicados en `/pilares`: Sueno, Alimentacion, Movimiento y
  Mente/Espiritu.
- El filtro cambia el contenido listado, no solo la decoracion de la pagina.
- La seleccion queda en la URL para que el estado sea compartible y recuperable al volver.
- La paginacion y `Cargar mas` conservan el pilar elegido.
- El texto visible sale de i18n en `es` y `en`; los colores salen de los tokens existentes de cada
  pilar.
- Listas contextuales pequeñas como "relacionados" en el detalle de una publicacion y la seccion
  local dentro de cada pilar no entran al primer slice: ya viven dentro de un contexto editorial
  mas fuerte y meter un segundo filtro ahi puede distraer. Si luego hace falta, reutilizan el mismo
  modelo.

## Slices

### Slice 1 - Listados publicos y busqueda del Header entienden los 4 pilares

**Estado:** implementado; pendiente de prueba manual y e2e por el usuario.

- Crear un modelo compartido para leer/escribir el parametro `pillar` de la URL.
- Crear un control reutilizable de filtro con Todo + los cuatro pilares.
- Aplicar el filtro a los listados publicos principales:
  - home (`/` y scroll infinito);
  - home paginado (`/page/[page]`);
  - productos;
  - categoria;
  - busqueda;
  - tienda;
  - perfil publico.
- Pasar el filtro a `PostsWithLoadMore`, a la paginacion tradicional y a la busqueda rapida del
  `Header`.
- Mostrar estados vacios especificos del pilar cuando no haya publicaciones para esa seleccion.
- Cubrir el comportamiento con Gherkin, Playwright y pruebas de componente/unidad donde el cambio
  sea local.

**Aceptacion:**

- Un visitante ve los cuatro pilares en los listados principales y entiende que no solo hay comida.
- Al elegir Movimiento, el listado activo solo muestra publicaciones de Movimiento.
- Al elegir Todo, la seccion vuelve a su listado actual.
- La URL refleja el filtro activo con `pillar=movement`, `pillar=sleep`, `pillar=nutrition` o
  `pillar=mindSpirit`.
- `Cargar mas`, la paginacion y "Ver todo" en la busqueda del `Header` no pierden el filtro.
- La misma experiencia existe en espanol e ingles.

### Slice 2 - Entradas editoriales hacia listados filtrados *(futuro)*

- Reutilizar el filtro como destino desde tarjetas o llamadas a la accion de `/pilares`.
- Evitar duplicar una segunda navegacion paralela de pilares.

**Aceptacion futura:**

- Un enlace "Ver publicaciones de Movimiento" aterriza en el home con Movimiento activo.
- El visitante puede volver a Todo sin perder el contexto del home.

### Slice 3 - Listas contextuales pequeñas *(futuro si hace falta)*

- Evaluar "relacionados" en el detalle de publicacion y el bloque local dentro de las paginas de
  pilar.
- Aplicar el filtro solo si no compite con el contexto principal de esas secciones.

**Aceptacion futura:**

- Si una lista contextual gana filtro, usa el mismo parametro `pillar` y el mismo control.
- Si se decide no filtrarla, queda documentado por que esa lista debe quedarse contextual.

## Validacion prevista

```bash
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run test:e2e:run
```
