# Bitácora — El chrome estrena v2

Roadmap: `docs/features/platform/007-2026-08-21-chrome-v2.md`.

---

## Slice 1 — La ubicación sube al chrome, y la búsqueda dice qué buscar (2026-08-21)

### Objetivo

Devolver al sitio el control para corregir la ubicación —que la ruta de entrada había perdido— y
dejar de escribirlo una vez por página. De paso, que el campo de búsqueda diga qué se puede buscar.

### El hallazgo que cambió el encuadre

El usuario lo pidió como una carencia de diseño («falta un botón para actualizar mi ubicación»). No
era una carencia: era una **regresión de cuatro días**.

`HomeHero` llevaba el `LocationBanner` en la portada, y el commit `8b4d9bf`
("refactor(home): simplify main feed surface", 2026-08-17) dejó de montarlo. `HomeHero.tsx` y
`CommunityPracticeInvitation.tsx` seguían en el repo, con sus tests verdes, sin que nadie los
renderizara.

**Y nada falló.** El `.feature` de `ubicacionFresca` (slice 3) listaba `/` en la tabla de rutas que
enseñan el chip, pero `chip.spec.ts` recorría solo tres rutas y `homeCards.spec.ts` probaba
«corregir desde el chip» contra `/productos`. Dos listas de rutas —una en la especificación y otra
en el spec— que se desincronizaron en silencio. Eso, y no el hero, es el defecto de fondo: por eso
este slice retira las listas duplicadas en vez de arreglarlas.

### Decisiones y por qué

1. **La barra va después de `</header>`, no dentro.** El header es `sticky` y en un teléfono ya
   apila dos filas (64px de acciones + ~52px de búsqueda). Una tercera fila fija se comería ~152px
   de una pantalla de 640: casi un cuarto del sitio, permanentemente. Corregir la ubicación es una
   acción rara; anclarla cuesta más de lo que ahorra. La barra es chrome —una sola escritura, todas
   las rutas— y se desplaza con la página.

2. **`LocationBanner` se borra, no se reutiliza.** Su razón de existir estaba escrita en su propio
   docstring: «esa decisión estaba repetida en seis páginas». Con la decisión ocurriendo en un solo
   sitio, era una indirección sin trabajo. `NearbyBar` lee el contexto y elige cara.

3. **Las dos caras son las de siempre.** `LocationChip` y `LocationNotice`, con sus mismos
   `data-testid`. Lo que cambió es dónde se montan, no qué dicen — por eso ningún test de contenido
   se tocó.

4. **`LocationNotice` deja de ser una caja.** Se dibujaba con borde y relleno propios porque la
   montaban seis páginas sueltas; ahora su único montaje es la barra, que ya pone la superficie.
   Queda como una fila que se parte cuando no cabe, para no plantar un recuadro en el chrome de
   todas las rutas. Ambos componentes pierden su prop `className`, que solo servía para que cada
   página ajustara su hueco.

5. **El «¿Vendes algo? Abre tu tienda» sube con el aviso.** Solo existía en `LocationNotice.tsx:75`
   y solo se pinta a quien no tiene ubicación *ni* tienda. Retirarlo de las páginas sin recogerlo lo
   habría borrado del sitio. Su enlace pasa de `text-pw-green` a `text-highlight`, que es el token
   que el slice 12 dejó para las tintas.

6. **Los ejemplos del buscador van al catálogo de mensajes, no a una consulta.** Generarlos desde la
   base haría que el header pagara una lectura por render y que el texto bailara en cada visita. Los
   valores salen de publicaciones reales consultadas hoy.

7. **`showSellerCta` se retira de los tres `data.ts`.** Sin el aviso en las páginas, ese campo se
   quedaba sin consumidor. Un dato que nadie lee es el error que este repo ya documentó con los
   tokens del slice 2.

### Lo que la base obligó a apartarse del canvas

El diseño ilustra el header con «Xalapa · 34 productores activos». Consultada la base el
**2026-08-21**: **2 tiendas** (`Hazlo Sano`, `Panadería de prueba`), ancla en **Tezonapa, Veracruz**
(`18.6005, -96.6872`), **31 publicaciones**. Un contador de productores con dos tiendas delata en vez
de dar confianza, y el nombre de la ciudad exigiría geocodificación inversa que no existe. La barra
dice **desde dónde se mide y desde cuándo**, que es lo que el sitio sí sabe.

Los ejemplos del buscador salen de títulos reales: `Suero natural` ($35), `Dona Chocolate Keto`
($35), `Açaí Glow` ($75), `Caminata de Tezonapa a Motzorongo`.

### Archivos tocados

**Nuevos**
- `src/presentation/chrome/NearbyBar/NearbyBar.tsx` · `NearbyBar.test.tsx`
- `src/e2e/chrome/chrome.feature` · `src/e2e/chrome/nearbyBar.spec.ts`
- `docs/features/platform/007-2026-08-21-chrome-v2.md` y esta bitácora

**Borrados** (código muerto desde `8b4d9bf`, más la indirección que sobraba)
- `src/app/(home)/HomeHero.tsx` · `HomeHero.test.tsx`
- `src/app/(home)/CommunityPracticeInvitation.tsx` · `CommunityPracticeInvitation.test.tsx`
- `src/presentation/location/LocationBanner.tsx`

**Chrome y ubicación**
- `src/app/[locale]/layout.tsx` — monta `<NearbyBar/>` entre el header y el mensaje del sitio
- `src/presentation/location/LocationChip.tsx` · `LocationNotice.tsx` — forma de fila, sin margen ni
  `className` propios

**Páginas que dejan de montar el aviso**
- `productos/page.tsx` · `productos/page/[page]/page.tsx`
- `categoria/[key]/page.tsx` · `categoria/[key]/page/[page]/page.tsx`
- `directorio/DirectoryPage.tsx`
- `pilares/components/PillarLocal.tsx` · `PillarLocalSection.tsx` (pierde el prop `locationBanner`)
- `productos/data.ts` · `categoria/[key]/data.ts` · `pilares/pillarLocalData.ts` (sin `showSellerCta`)

**Catálogos**
- `src/i18n/messages/{es,en}.json` — `distance.barLabel` nuevo; `search.placeholder` reescrito

**Specs que dejan de duplicar listas de rutas**
- `src/e2e/ubicacionFresca/chip.spec.ts` — se queda solo con el caso de la cookie sin fecha
- `src/e2e/localProducers/locationNotice.spec.ts` — se queda con lo que solo él prueba
- `src/e2e/ubicacionFresca/homeCards.spec.ts` — la corrección se prueba en `/`, como decía el escenario
- `src/e2e/ubicacionFresca/ubicacionFresca.feature` — la tabla de rutas se retira, con el motivo escrito

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **200 archivos, 2143 pruebas en verde** (209s) |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio (953 archivos) tras `pnpm run format` |
| `pnpm run check:i18n` | «No queda texto en español escrito a mano en los componentes» |
| `pnpm run build` | compila |
| `pnpm run typecheck:tests` | 8 errores, **todos preexistentes** (eran 10 en `dev` antes de tocar nada; los dos que este slice introdujo se arreglaron). No está en `validate`. |

**Las clases, verificadas en el CSS compilado** —la costumbre del slice 13, porque en Tailwind v4
una clase mal escrita no falla: desaparece—. `text-label`, `text-text-muted`, `border-separator`,
`bg-surface-elevation-1`, `text-highlight`, `container-width` y el `letter-spacing: .14em` del
`tracking-[0.14em]` existen todos en `.next/static/chunks/*.css`.

**Comprobado contra el servidor de producción** (`pnpm run start`, puerto 3123):

| Ruta | Sin cookie | Con cookie de hace 2 h |
| --- | --- | --- |
| `/` | `nearby-bar` ×1, `location-notice` ×1, `share-location` ×1, `seller-location-cta` ×1 | — |
| `/productos` | — | `nearby-bar` ×1, `location-chip` ×1, `refresh-location` ×1, `location-age` ×1 |
| `/carrito` | — | `nearby-bar` ×1, `location-chip` ×1 |

Y capturas en 1280×900 y 390×780, en los dos estados: la barra se lee en una línea con ubicación
conocida y el rótulo «CERCA DE TI» se esconde por debajo de `sm`, donde el propio control ya se
explica solo.

### Pendiente declarado

**La e2e no se corrió aquí** — la corre el usuario:

```bash
pnpm run test:e2e:run --grep "chrome"          # el spec nuevo
pnpm run test:e2e:run src/e2e/ubicacionFresca  # los tres specs corregidos
pnpm run test:e2e:run src/e2e/localProducers
```

Conviene correrla por directorios: la suite completa se cae por RAM y por duración.

### Desviaciones del roadmap

Ninguna en alcance. Dos añadidos que el roadmap no anticipaba y que el trabajo destapó:
`LocationBanner` se borra (era indirección muerta) y `showSellerCta` sale de los tres `data.ts` (se
quedaba sin consumidor). Ambos son consecuencia directa de que la decisión ocurra ahora en un solo
sitio.

### Escrituras en recursos compartidos

**Ninguna.** A la base compartida solo se le hicieron **lecturas** (`SELECT` de tiendas, sucursales,
categorías y publicaciones) para fijar los datos reales del roadmap y del Gherkin. No se creó,
modificó ni borró un solo registro. No hay nada que deshacer.

### Recap

El control para corregir la ubicación vive ahora en el chrome (`NearbyBar`), montado una sola vez en
el layout y presente en todas las rutas: la portada recupera lo que perdió el 17 de agosto y las seis
páginas que lo escribían a mano dejan de hacerlo. Las dos caras siguen siendo `LocationChip` y
`LocationNotice`, con sus mismos textos y `data-testid`; lo que cambió es dónde se montan y que ya no
se dibujan como una caja. El buscador del header dice qué buscar con títulos que existen en la base.
Se borró el código muerto que dejó `8b4d9bf` y, sobre todo, se retiraron las listas de rutas
duplicadas entre `.feature` y spec, que es lo que permitió que la regresión pasara inadvertida.
Vitest, typecheck, lint, check:i18n y build en verde; la e2e queda pendiente para el usuario.

### Próximos pasos (opciones)

1. **Correr la e2e** con los tres comandos de arriba y cerrar el slice. *(Pendiente en el usuario.)*
2. **Slice 2 — el menú principal**: «4 Pilares» con sus cuatro puntos de color en la píldora y la
   sección activa distinguible. Es lo siguiente que pidió el usuario («empieza por el header y el
   menú principal») y no toca ningún recorrido.
3. **Slice 3 — una sola fila de acciones**: hoy compiten Publicar, carrito, avatar/acceso e idioma.
   Es también lo que devuelve alto al header en el teléfono.
4. **Saltar al home (5.2)**: la portada con su titular en serif, los dos CTA y la cabecera «Recién
   publicado» del canvas. Era la petición original antes de la redirección al header.

---

## Slice 2 — El menú principal se ve como los cuatro pilares (2026-08-21)

### Objetivo

Que la barra diga en qué sección estás, y que «4 Pilares» —el eje narrativo del sitio— deje de
leerse igual que «Nosotros».

### Decisiones y por qué

1. **La sección activa se decide contra la plantilla interna, no contra la URL.** `usePathname` de
   `~/i18n/navigation` traduce la dirección visible de vuelta a su clave: `/categoria/[key]` tanto
   para `/categoria/jugos` como para `/en/category/jugos`. Se comprobó leyendo la implementación
   (`createNavigation.js` → `getRoute`), no suponiéndolo. Así la regla se escribe **una vez** y vale
   en los dos idiomas. Escribirla contra la URL habría exigido dos listas — y este roadmap existe
   porque dos listas de rutas desincronizadas dejaron al home sin su control de ubicación.

2. **`activeMenuSection()` vive en `menuItems.ts`, que ya era la fuente única del menú.** La
   consumen `Nav` (escritorio) y `MobileNav` (teléfono): los dos menús no pueden decir que estás en
   secciones distintas. Es una función pura, así que la prueba es Vitest y no navegador.

3. **`null` es una respuesta, no un olvido.** El carrito, la búsqueda, publicar, una ficha de
   publicación y una tienda no son secciones del menú. La píldora dice «estás en esta sección del
   menú», no «esto se le parece».

4. **Una sección sin publicar no puede marcarse.** Las cuatro de `COMMUNITY_ITEMS` que siguen siendo
   stubs responden 404; marcarlas sería señalar una puerta cerrada. Por eso la lista sale de
   `VISIBLE_COMMUNITY_ITEMS`, y hay una prueba por cada mitad: ninguna oculta se marca, todas las
   visibles se marcan.

5. **Los ids de los paneles raíz de `MobileNav` se tipan como `MenuSection`.** Coincidían por
   casualidad; ahora renombrar una sección rompe el compilador en vez de apagar la marca en
   silencio.

6. **Los cuatro puntos van `aria-hidden`.** `pillarPalette.contrast.test.ts` dejó medido que
   Movimiento y Mente contrastan 1.14 entre sí, de donde salió la regla: el color nunca puede ser el
   único portador del significado de un pilar. Aquí se cumple porque **ningún punto identifica a un
   pilar concreto** — quien nombra es la etiqueta «4 Pilares». Son la firma del grupo. Quien no
   distingue los tonos, o no los ve, no se pierde nada.

7. **El par de la píldora activa ya estaba medido.** `bg-brand-green-soft` + `text-brand-green-900`
   es el mismo par de la variante `brand` de `Badge`, 7.55 en claro, y los dos tokens cambian con el
   tema: ni una `dark:` escrita a mano.

### El fallo que solo se vio mirando

La primera versión rompió lo que el propio docstring de `Nav.tsx` documentaba: **«4 Pilares» se
partió en dos renglones**. Los cuatro puntos le quitan ancho a la etiqueta y la píldora no daba de
sí. No lo detectó ningún test —el DOM era correcto y `aria-current` también—, solo la captura.
Arreglado con `whitespace-nowrap` en `PILL_BASE`, con el motivo escrito al lado para que no se
retire por parecer decoración.

### Archivos tocados

- `src/presentation/chrome/Header/menuItems.ts` — `MenuSection`, `SECTION_PATHNAMES`,
  `activeMenuSection()`; `PILLARS_OVERVIEW_HREF` pasa de reexport puro a import + reexport para
  poder leer su `pathname`
- `menuItems.test.ts` — 18 casos nuevos (11 rutas con sección, 5 sin, y las dos mitades de publicadas/ocultas)
- `Nav.tsx` — píldoras, `aria-current`, `PillarDots`, caret en `text-current`, `whitespace-nowrap`
- `MobileNav.tsx` — la misma marca en las tres filas raíz; ids tipados
- `src/e2e/chrome/mainMenu.spec.ts` (nuevo) · `chrome.feature` — slice 2 detallado, sin `@future`

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **200 archivos, 2161 pruebas en verde** (147s) |
| `pnpm run typecheck` · `lint` | limpios (954 archivos) |
| `pnpm run build` | compila |

**Clases en el CSS compilado** —las nueve—: `bg-brand-green-soft`, `text-brand-green-900`, los
cuatro `bg-pillar-*-solid`, `rounded-l-full`, `rounded-r-full`, `size-1.5`, `gap-[3px]`,
`whitespace-nowrap`.

**Comprobado contra el servidor de producción**, leyendo el `aria-current` real de la barra:

| Ruta | `a[aria-current="page"]` |
| --- | --- |
| `/` | `["Comunidad"]` |
| `/pilares/alimentacion` | `["4 Pilares"]` |
| `/carrito` | `[]` |

*(Nota de tooling: construir con `next start` encima corrompe `.next` y produce hidratación rota —
`aria-current` vacío en las tres rutas y un `module-not-found` de las fuentes en el build siguiente.
Se arregla con `rm -rf .next`. No era el código.)*

### Pendiente declarado

La e2e la corre el usuario:

```bash
pnpm run test:e2e:run src/e2e/chrome    # nearbyBar + mainMenu
pnpm run test:e2e:run src/e2e/menu      # los desplegables, que no se tocaron
```

### Recap

La barra principal son ahora píldoras y marca la sección activa con el par verde ya medido; «4
Pilares» lleva los cuatro colores de la rampa como firma decorativa, sin romper la regla de que el
color no puede ser el único portador. Qué ruta pertenece a qué sección lo decide una función pura en
`menuItems.ts` que consumen los dos menús, comparando la plantilla interna que devuelve
`usePathname`, así que la regla no se escribe dos veces ni se desincroniza entre idiomas. Vitest,
typecheck, lint y build en verde, y el comportamiento verificado contra el servidor real; la e2e
queda para el usuario.

### Próximos pasos (opciones)

1. **Correr la e2e** de `src/e2e/chrome` y `src/e2e/menu`. *(Pendiente en el usuario.)*
2. **Slice 3 — una sola fila de acciones**: hoy compiten Publicar, carrito, avatar/acceso e idioma;
   es lo que devuelve alto al header en el teléfono.
3. **Slice 4 — el pilar y la distancia como filtros en la barra**, que es la barra completa del 5.1.
4. **Saltar al home (5.2)**: titular en serif, los dos CTA y la cabecera «Recién publicado». Era la
   petición original antes de la redirección al header.
