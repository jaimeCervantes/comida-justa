# Bitácora — El teléfono y la búsqueda

> Fuente: `Hazlo Sano — Sistema de diseño v2`, secciones **5.1** (bottom nav, ⌘K) y **5.7**
> (búsqueda y filtros). Son las piezas que v2 dejó registradas como UX nueva, pedidas ahora.

---

## Slice 1 — La barra inferior de cinco pestañas (2026-08-22)

### Objetivo

Que las cinco cosas que se hacen aquí estén al alcance del pulgar, en vez de dentro del menú de
hamburguesa.

### El problema

En un teléfono **todo** colgaba de la hamburguesa: buscar, ver tus pedidos o entrar a tu cuenta
costaban dos toques y leer una lista de treinta filas. El pulgar llega abajo; a la esquina superior
izquierda, no.

### Decisiones y por qué

1. **No sustituye al menú de hamburguesa.** Ese sigue teniendo el catálogo entero, las categorías y
   las secciones. La barra son los cinco destinos que se repiten todos los días. Un bottom nav que
   intenta contener un sitio entero acaba siendo el mismo menú con otra forma.

2. **«Publicar» es la acción, no un destino más.** Va en un círculo relleno y levantado, como en el
   5.1: las otras cuatro son sitios a los que se va, esta es algo que se hace, y esa diferencia
   tiene que verse sin leer.

3. **Y se retira del header por debajo de `lg`.** Tenerla en las dos partes duplicaba la única
   acción primaria del sitio y le quitaba sitio al buscador, que es lo que el 5.1 quería recuperar.

4. **Qué ruta marca qué pestaña vive aparte del componente** (`bottomNavTabs.ts`), como
   `menuItems.ts`: es una regla, no una decisión de pintado, y así se prueba sin navegador. Se
   compara contra la plantilla interna, así que vale en los dos idiomas sin escribirse dos veces.

5. **Una ficha no marca ninguna pestaña.** Se llega a ella desde cualquier parte; decir «estás en
   Inicio» mientras alguien mira un producto sería mentir sobre dónde está.

6. **`pb-[env(safe-area-inset-bottom)]`.** En un iPhone la franja del gesto de inicio se come los
   últimos ~34px y la fila de etiquetas quedaría debajo. Y `main` gana `pb-28` en el teléfono: la
   barra es `fixed`, así que sin hueco propio taparía el final de cada página.

7. **Solo por debajo de `lg`**, que es exactamente donde la barra de escritorio se esconde: las dos
   nunca se ven a la vez. Verificado en el navegador, no supuesto.

### Archivos tocados

- `src/presentation/chrome/BottomNav/BottomNav.tsx` · `bottomNavTabs.ts` · `bottomNavTabs.test.ts`
- `src/app/[locale]/layout.tsx` — monta la barra y abre el hueco
- `src/presentation/chrome/Header/Header.tsx` — «Publicar» pasa a `hidden lg:block`
- `src/i18n/messages/{es,en}.json` — cinco rótulos y el nombre accesible de la barra
- `src/e2e/chrome/bottomNav.spec.ts` (nuevo)

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run …/BottomNav` | **15 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (970 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test src/e2e/chrome src/e2e/menu` | **44/44 en verde** |

Medido en el navegador: 71px de alto, «Inicio» marcada en `/`, «Buscar» en `/buscar`, ninguna en una
ficha, y **oculta en escritorio** mientras la barra de navegación sí se ve.

### Recap

El teléfono tiene ya sus cinco accesos permanentes, con «Publicar» como el círculo levantado que el
5.1 pedía — y una sola vez, porque el header se lo cede por debajo de `lg`. La regla de qué ruta
marca qué pestaña vive en datos, se prueba sin navegador y se escribe una vez para los dos idiomas.

---

## Slice 2 — El atajo ⌘K (2026-08-22)

### Objetivo

Poner el buscador a un gesto de distancia desde cualquier página, que es la otra mitad de la
anotación del 5.1: el campo ya nombra ejemplos del catálogo, y ahora se llega a él sin apuntar con
el ratón.

### Tres decisiones que no son cosméticas

1. **`preventDefault` es obligatorio.** Ctrl+K ya está cogido en Firefox —enfoca su propia barra de
   búsqueda— y en algunos gestores de contraseñas. Sin él, el atajo del sitio pierde contra el del
   navegador justo donde más falta hace tenerlo.

2. **Solo actúa sobre el campo que se ve.** El header pinta **dos** buscadores —uno de escritorio y
   otro de teléfono— y esconde el que no toca, así que sin comprobarlo el atajo enfocaría un
   `display: none`, que es enfocar nada. `offsetParent === null` es la pregunta barata que lo
   contesta.

3. **La tecla se resuelve después de montar, no durante el render.** El servidor no sabe qué teclado
   hay al otro lado: pintar «⌘K» y corregirlo en el cliente sería una discrepancia de hidratación y,
   en un Windows, un parpadeo enseñando la tecla equivocada. Hasta saberlo no se pinta nada — es una
   ayuda, no información.

Y una de accesibilidad: la pista va `aria-hidden`. El atajo funciona igual sin oírla, y anunciarla
alargaría el nombre accesible del campo en cada página sin decir nada nuevo.

**Al enfocar se selecciona lo que hubiera.** Quien pulsa el atajo viene a buscar otra cosa, no a
añadirle letras a la búsqueda anterior.

### Archivos tocados

- `src/presentation/search/useSearchShortcut.ts` · `useSearchShortcut.test.tsx` (nuevos)
- `src/presentation/search/SearchBar.tsx` — la pista en `iconEnd` y el `ref` del campo
- `src/e2e/chrome/searchShortcut.spec.ts` (nuevo)

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run src/presentation/search` | 2 archivos, **22 pruebas** en verde |
| `pnpm run typecheck` · `lint` | limpios (973 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test src/e2e/chrome` | **27/27 en verde** |

Comprobado en el navegador: la pista dice `Ctrl K` en esta máquina, y tras pulsarla el elemento
activo es `input[name="search"]`.

### Recap

El buscador se abre desde cualquier página con ⌘K o Ctrl+K, con la tecla correcta según el teclado
—resuelta tras montar para no mentir en la hidratación— y sin pelearse con el campo escondido del
otro tamaño de pantalla.

---

## Slice 3 — La búsqueda facetada (2026-08-22)

### Objetivo

La pantalla 5.7 del canvas: saber cuántos resultados hay, en qué pilar caen, y poder soltar un
filtro sin buscar dónde se puso.

### Lo que entra, lo que no, y por qué

El 5.7 dibuja seis facetas. **Tres no entran, y ninguna por falta de tiempo:**

| Del canvas | Por qué no |
| --- | --- |
| Deslizador de distancia (0–20 km) | El repositorio de búsqueda **ya lo tenía decidido y escrito**: «no hay filtro por radio en ninguna parte: esconder algo que alguien pidió por su nombre sería el peor fallo posible». La distancia desempata el orden; no recorta la lista |
| «Envase retornable» | No existe esa columna. Fingirla desde la interfaz sería inventar un modelo de datos |
| «Ordenar: cercanía ▾» | El orden es deliberado y está documentado —relevancia, luego distancia como desempate, luego fecha— y hay un spec (`ordenDeterminista`) que lo fija |

Entran las tres que los datos sostienen: **contadores por pilar**, **solo con existencia**
(`is_available` sí existe) y **los chips de filtro activo** con su «Limpiar todo».

### La decisión que hizo posible contar

Contar por pilar parecía necesitar cuatro consultas o un segundo camino paralelo. No: la búsqueda
tiene **dos estrategias y solo una a la vez** — el rescate semántico se ejecuta *únicamente* si el
texto no encontró nada (`SearchPostsUseCase`). De ahí sale todo:

- Cuando responde el texto, contar el **mismo texto** agrupado por categoría raíz da números
  exactos. Una consulta, un `GROUP BY`.
- Cuando responde la semántica, esos números serían todos cero al lado de resultados que sí existen:
  **mentirían**. Así que `counts` vuelve `null` y la interfaz no enseña ninguno. Por eso `strategy`
  sale ahora a la superficie del caso de uso: cambia lo que se puede afirmar.

Y **se cuenta sin el filtro de pilar aplicado**. Es lo que separa una faceta de un marcador: con el
filtro puesto, los otros tres saldrían en cero y no habría por dónde volver.

### Otras tres decisiones

1. **Las facetas son enlaces, no casillas.** La búsqueda entera vive en la dirección, así que cada
   filtro se comparte, se guarda y vuelve con el botón de atrás. Una casilla controlada por
   JavaScript no haría ninguna de las tres.
2. **El cero se dice.** `countByCategory` solo devuelve categorías con filas, así que un pilar vacío
   no viene en el mapa; se rellena con cero en vez de callarlo. «Mente y Espíritu 0» ahorra el clic
   que no lleva a ninguna parte. `undefined` queda reservado para «no se puede afirmar».
3. **Contar nunca tumba la búsqueda.** Si la consulta de cuentas falla, `counts` es `null` y los
   resultados llegan igual: una faceta sin números sigue siendo un filtro que funciona.

### Archivos tocados

**Dominio y casos de uso**
- `ISearchPostRepository` — `countByCategory` y `onlyAvailable` en los dos métodos de búsqueda
- `ISearchPostDTO` — `onlyAvailable`
- `SearchPostsUseCase` — devuelve `SearchPostsResult` (`strategy` + `counts`), cuenta en paralelo

**Infraestructura**
- `PostgresSearchPostRepository` — `countByCategory`, `availableWhere`, y el filtro enhebrado por
  las tres consultas (`rankedMatches`, `semanticMatches`, `newestFirst`)

**Interfaz**
- `buscar/ui/SearchFacets.tsx` · `buscar/ui/SearchSummary.tsx` (nuevos)
- `buscar/page.tsx` — rejilla con las facetas al lado; la paginación conserva la faceta
- `buscar/data.ts` · `src/i18n/messages/{es,en}.json`

**Pruebas**
- `SearchPostsUseCase.test.ts` — cinco escenarios nuevos de facetas, y los dobles del puerto al día
- `src/e2e/busquedaFacetada/busquedaFacetada.spec.ts` (nuevo)

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | 208 archivos, **2252 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (976 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test busquedaFacetada busquedaRelevante busquedaEntreIdiomas` | **29/29 en verde** |

Medido contra la base real: «pollo» da 3 resultados y las cuentas salen `{sueño 0, alimentación 3,
movimiento 0, mente 0}`; «caminata» da 2 y son todas de Movimiento. Con el pilar ya elegido, las
cuentas **no cambian** — que es justo lo que se quería probar.

### Recap

La búsqueda tiene facetas de verdad: cuentan lo que hay en cada pilar antes de filtrar, dicen cero
cuando es cero, y se sueltan desde chips que están donde se miran los resultados. De las seis que
dibuja el canvas entran las tres que la base sostiene; las otras tres se quedan fuera por razones
escritas —una de ellas ya estaba escrita en el propio repositorio antes de que este slice empezara—.

### Próximos pasos (opciones)

1. **`priority` no emite `fetchpriority`** en ninguna imagen del sitio: seis llamadas afectadas.
2. **La cola offline** del 06, que sigue siendo la última pieza del canvas sin construir.
3. **«Avísame cuando haya»** para lo agotado — ahora que existe la faceta de disponibilidad, es su
   pareja natural.
