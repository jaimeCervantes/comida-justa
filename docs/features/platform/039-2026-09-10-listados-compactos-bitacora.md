# Bitácora — Listados compactos

## Slice 1 — Las facetas, arriba (2026-09-10)

### Objetivo

Sacar los filtros de la búsqueda de la barra lateral y ponerlos en una fila encima de los
resultados, para que dejen de costar 264 px de ancho en escritorio y unos 360 px de alto en el
teléfono.

### Decisiones y por qué

**1. No se escribió una fila de chips: se reusó la que ya existía.** El plan decía «reusando el
patrón de `NearbyBar`», y al buscarlo apareció algo mejor que un patrón: `PublicationPillarFilter`
ya **es** este control —«Todo» más los cuatro pilares, con su `BadgeCounter`, su color por par, su
`shrink-0` para filas deslizables y su `min-h-10`—, y ya lo montan el home, la barra de cercanía,
categoría, tienda y perfil. Escribir aquí una segunda fila habría sido copiar cinco colores y un
estado activo para que divergieran a la primera vez que alguien tocara uno de los dos.

Lo que la búsqueda añade viaja como prop: `counts` (las cuentas por pilar, que es lo que convierte
un filtro en una faceta) y `testIdPrefix` (para que los chips sigan publicando `facet-pillar-<key>`,
que es el nombre que conocen sus pruebas). Mudar un control no es motivo para romper a quien lo
apuntaba.

**2. Se perdió el «quitar el filtro pulsando el pilar activo», a propósito.** El `SearchFacets`
viejo hacía `hrefWith(query, isActive ? null : key, …)`: pulsar el pilar puesto lo quitaba. El
control compartido no hace eso —el camino de vuelta es «Todo»—, y conservarlo habría pedido una
tercera prop cuyo único trabajo sería que dos listados del mismo sitio se comportaran distinto. En
la barra lateral tenía sentido, porque «Todo» quedaba arriba en una lista de cinco renglones; en la
fila, «Todo» es el primer chip y está siempre a la vista. **Es un cambio de comportamiento y por eso
está escrito aquí**, no escondido en el diff.

**3. `FILTER_CHIP` se exporta.** «Solo con existencia» va en la misma fila que los cinco pilares, y
lo que no puede decidirse dos veces es el alto, el radio y el relleno — es justo lo que se nota
cuando difiere. El color y el estado sí los decide cada uno.

**4. Los rótulos «Pilar» y «Disponibilidad» dejaron de ser `Heading` y son versalitas en la fila.**
Como encabezados costaban dos renglones verticales, que es lo que este slice vino a quitar. Se
esconden por debajo de `sm`, donde el ancho es el caro y los propios chips ya se explican.

**5. Dos arreglos de herramienta que no eran del slice pero lo bloqueaban.** Ver «Desviaciones».

### Archivos tocados

**La mudanza**

- `src/app/[locale]/buscar/ui/SearchFacets.tsx` — reescrito: una fila deslizable que compone
  `PublicationPillarFilter` más el interruptor de existencias.
- `src/app/[locale]/buscar/page.tsx` — fuera la rejilla `lg:grid-cols-[240px_1fr]`; los resultados
  estrenan `data-testid="search-results"` para poder localizarlos sin depender de su forma.
- `src/presentation/post/PublicationPillarFilter.tsx` — props `counts` y `testIdPrefix`, ambas
  opcionales y sin efecto en los cinco montajes que ya existían; `BASE_LINK` pasa a exportarse como
  `FILTER_CHIP`.

**Las pruebas**

- `src/e2e/listadosCompactos/listadosCompactos.feature` — nuevo. Slice 1 detallado, slices 2 y 3
  como esqueletos `@future`.
- `src/e2e/listadosCompactos/listadosCompactos.spec.ts` — nuevo, dos escenarios.

**La herramienta**

- `playwright.config.ts` — `webServer.timeout` de 180 s a 300 s.
- `src/e2e/testUtils/warmRoutes.ts` — entra `/api/search?q=pan`.

### Comandos

```sh
pnpm run typecheck && pnpm run lint && pnpm run test:run
pnpm exec playwright test src/e2e/listadosCompactos src/e2e/busquedaFacetada \
  src/e2e/busquedaRelevante src/e2e/publicationPillarFilter --shard=1/3 --reporter=line
# … y 2/3 y 3/3, uno detrás de otro, con `rm -rf .next` antes de cada uno
```

### Validación

| Qué                                                | Resultado                                                   |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `pnpm run typecheck`                               | limpio                                                       |
| `pnpm run lint`                                    | limpio, 1205 archivos                                        |
| `pnpm run test:run`                                | **2901 pruebas en 277 archivos, todas en verde** (258 s)     |
| `listadosCompactos.spec.ts` **antes** del cambio   | **2 en rojo** (con las fuentes en `git stash`)               |
| `listadosCompactos.spec.ts` después                | **2 en verde**                                               |
| Playwright acotado, 28 escenarios en 3 tramos      | tramo 1: 10/10 · tramo 2: 9/9 · tramo 3: 8/9                 |

**El contrato de regresión se cumplió:** los 8 escenarios de `busquedaFacetada.spec.ts` pasaron
**sin editar una línea**. Localizan por `data-testid` y por `aria-pressed`, no por posición, así que
la mudanza les resultó invisible — que es exactamente lo que un spec bien escrito tiene que hacer
cuando el diseño se mueve.

**El 8/9 del tramo 3 fue intermitencia en frío, no una regresión, y está demostrado**: falló un
escenario **distinto** en cada una de las dos corridas —`:95` la primera, `:50` la segunda—, las dos
veces en su primera interacción, y los **3 pasan en aislamiento**. Es la firma que `AGENTS.md`
describe palabra por palabra.

### Desviaciones del plan

1. **La reutilización llegó más lejos de lo planeado** (decisión 1). El plan hablaba de copiar un
   patrón de maquetación; acabó siendo el mismo componente. Es mejor de lo escrito, no distinto.
2. **`webServer.timeout`: 180 s → 300 s.** La suite moría en «Timed out waiting from
   config.webServer» antes de correr un solo escenario. El servidor levanta en 2.6 s; lo que tarda
   es la primera petición: la sonda pide `/`, la ruta más cara del sitio, y con `.next` borrado
   —obligatorio antes de cada corrida— compilar desde cero se midió en **101 s** con la caché a
   medias. Desde frío se pasaba de los tres minutos. El mensaje no dice nada de la aplicación y
   manda a buscar el fallo donde no está.
3. **`/api/search` entra en `warmRoutes.ts`.** Es la tercera de la familia de `/api/auth/providers`
   y `/api/posts/page/N`: `/buscar` no la calienta, porque esa consulta la hace el servidor llamando
   al caso de uso directamente; sólo la pide `SearchBar` desde el navegador, así que nadie la
   compilaba en toda la corrida y el primer escenario que tecleaba en el buscador pagaba esa
   compilación dentro del plazo de 5 s de un `toBeVisible`. Tumbó a
   `publicationPillarFilter.spec.ts:95`; con la ruta caliente, pasa.
4. **`aria-current` de las facetas pasó de `"true"` a `"page"`**, que es el valor del control
   compartido y el correcto para un enlace que representa la vista actual. Ninguna prueba lo
   afirmaba.

### Pendientes que deja

- El «quitar filtro pulsando el pilar activo» (decisión 2), si se quiere de vuelta, conviene
  resolverlo **en el control compartido y para los cinco listados**, no con una excepción para la
  búsqueda.
- `FILTER_CHIP` vive en `src/presentation/post/`. Su casa natural es `design_system/`, pero moverlo
  arrastra los cinco montajes: es una mudanza propia, no un renglón de este slice.

### Recap

La búsqueda ya no tiene barra lateral: los cinco pilares con sus cuentas y el interruptor de
existencias viven en una fila deslizable encima de los resultados, y esa fila la pinta el mismo
`PublicationPillarFilter` que ya usaban el home, la barra de cercanía, categoría, tienda y perfil —
un control menos que mantener, no uno más. Los resultados recuperaron los 264 px que se llevaba el
`aside` y quedan con los mismos 1216 px que el resto del sitio, que es la condición que los slices 2
y 3 necesitaban para que las cuatro columnas salgan iguales en todos los listados. Todo verde:
2901 pruebas unitarias, 28 escenarios acotados, y los 8 de las facetas pasando sin una sola edición.

### Próximos pasos (opciones)

1. **Slice 2 — la tarjeta habla por iconos.** Carrito, apoyar y compartir sin texto; compartir sobre
   la imagen; editar, marcar agotado y guardar existencias a un menú «⋯»; y el mismo criterio en la
   ficha de la publicación, que es el alcance acordado. Es el que más cambia lo que se ve.
2. **Saltar al slice 3 (las columnas) antes que al 2.** Se puede, pero con la tarjeta actual una
   columna de 156 px en el teléfono deja 116 px útiles y la firma no cabe: se vería roto hasta que
   llegue el slice 2. No lo recomiendo.
3. **Mirarlo primero en el navegador.** El slice está verde pero nadie lo ha visto con ojos: la fila
   con 5 chips, sus cuentas y el interruptor, en 1280 y en 390.

**Pendiente de tu parte:** decidir entre 1 y 3, y si el «quitar filtro pulsando el pilar activo»
vuelve o se queda como está.
