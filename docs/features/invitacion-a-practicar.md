# Invitacion a practicar

Roadmap para que el inicio, justo despues de contar lo que la comunidad lleva hecho, ofrezca una
puerta para sumar la propia practica. La especificacion vive en
`src/e2e/habits/invitacionAPracticar.feature` y la bitacora en
`docs/features/invitacion-a-practicar-bitacora.md`.

## Alineacion

- **Problem:** el jardin cuenta las repeticiones compartidas de los cuatro pilares, pero el inicio no
  ofrece ninguna puerta para aportar la propia. Quien ve los canteros entiende que hay actividad
  colectiva y se queda sin saber por donde se entra a ella.
- **Savings:** se ahorra el rodeo por el menu —hoy la unica via desde el inicio hacia `/pilares`— en
  el momento exacto en que la persona esta mirando el dato que la motiva, y se ahorra la frustracion
  de leer un numero colectivo sin poder sumarse a el.
- **Why:** el jardin solo crece con repeticiones reales y voluntarias. Si la portada mide la practica
  de la comunidad pero no invita a practicar, mide algo que no ayuda a que ocurra.

## Modelo acordado

- La invitacion es una banda **a todo el ancho** entre la fila de comunidad (jardin + celebraciones)
  y el feed de publicaciones. No entra como tercera celda de la rejilla de dos columnas: la
  desnivelaria y encogeria la llamada a la accion.
- El destino es `/pilares`, el hub de los cuatro pilares, donde cada uno ya reune explicacion,
  practica y ritual. **No** es `/habitos`: el `.feature` de fusion lo marca como indice a retirar
  (`@slice-3` de `fusion-pilares-habitos.feature`).
- Es un enlace, no un boton: navega. `Button` del design system renderiza un `<button>` y es
  `"use client"`; un `<a>` conserva la semantica, el menu contextual y el render de servidor.
- Usa el `Link` de `~/i18n/navigation` con la ruta tipada, para que el idioma activo se conserve
  (`/pilares` en español, `/en/pillars` en ingles).
- El texto vive en el catalogo `habitCommunity.invitation.*`, junto al del jardin al que acompaña, y
  con las claves escritas enteras.
- La invitacion es estatica: no consulta la base de datos ni depende de cuantas repeticiones tenga el
  jardin. Un jardin en cero es precisamente cuando mas hace falta.
- El encabezado es un `h2`, hermano del jardin y de las celebraciones. El unico `h1` del inicio
  sigue siendo el del hero.
- La invitacion no distingue si hay sesion iniciada. La puerta es la misma; el acceso ya lo resuelve
  el panel del reto dentro del pilar.

## Roadmap

### Slice 1 - La banda que invita a practicar

**Alcance**

- Añadir `habitCommunity.invitation.*` a `es.json` y `en.json` (eyebrow, titulo, cuerpo y etiqueta
  del enlace).
- Crear `CommunityPracticeInvitation` en `src/app/(home)/`, junto a `HomeHero`: hoy solo la usa el
  inicio. El dia que `/pilares` la quiera, se promueve a `src/presentation/habits/`.
- Montarla en `src/app/[locale]/page.tsx` despues de la seccion de comunidad y antes de
  `PostsWithLoadMore`.
- Cubrirla con una prueba de componente y con un spec de Playwright que siga el enlace en ambos
  idiomas.

**Criterios de aceptacion**

- En `/` la invitacion se ve despues del jardin y de las celebraciones, y antes del feed.
- Activar «Elegir mi practica» desde `/` lleva a `/pilares`.
- Activar «Choose my practice» desde `/en` lleva a `/en/pillars`, no a `/pilares`.
- El inicio conserva un solo `h1` y el encabezado de la invitacion es un `h2`.
- Ningun texto de la invitacion esta escrito en el componente: todos salen del catalogo.
- `es.json` y `en.json` siguen siendo estructuralmente identicos (lo verifica `typecheck`).

### Slice 2 - Atajos por pilar

@future

**Alcance**

- Ofrecer dentro de la misma banda cuatro atajos directos a `/pilares/sueno`,
  `/pilares/alimentacion`, `/pilares/movimiento` y `/pilares/mente-espiritu`, para quien ya sabe cual
  quiere practicar y no necesita pasar por el hub.

**Criterios de aceptacion**

- Cada atajo lleva a su pilar conservando el idioma activo.
- El enlace al hub sigue existiendo para quien no sabe por donde empezar.

## Validacion

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:e2e:run`
