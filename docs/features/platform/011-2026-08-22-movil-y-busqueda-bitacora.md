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
