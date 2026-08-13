# Bitacora - Invitacion a practicar

## 2026-08-12 - Slice 1: la banda que invita a practicar

### Objetivo

Dar al inicio una puerta para sumar la propia practica, justo despues del jardin que cuenta la de la
comunidad. El jardin medía la participacion sin ofrecer ninguna forma de participar.

### Decisiones y racional

- **El destino es `/pilares`, no `/habitos`.** Los dos indices existen y los dos estan en el sitemap,
  pero `fusion-pilares-habitos.feature` marca en su `@slice-3` que el indice de Pilares sustituye al
  de Habitos. Enlazar al que se retira era construir un enlace con fecha de caducidad.
- **Es un enlace, no un boton.** `Button` del design system renderiza un `<button>` y es
  `"use client"`; esto navega. Con un boton se perderian el clic derecho, el «abrir en pestaña nueva»
  y el anuncio del destino en un lector de pantalla, y se enviaria JavaScript al cliente para algo
  que resuelve un `<a>`.
- **`PILLARS_OVERVIEW_HREF` se mudo de `presentation/chrome/Header/menuItems.ts` a `i18n/routes.ts`.**
  El menu era el unico que llevaba a la portada de pilares; desde que el inicio tambien lo hace,
  dejar el literal en el header significaba una segunda copia del objeto de ruta. `menuItems.ts` lo
  reexporta, asi que `Nav` y `MobileNav` siguen importandolo de donde siempre. Es el mismo patron que
  ya usaban `cuenta/storePath.ts` y `cuenta/profilePath.ts` con `pillarHref`.
- **La banda va fuera de la rejilla de dos columnas.** Como tercera celda quedaba desnivelada y
  encogida; a todo lo ancho es lo ultimo que se lee antes de que el feed cambie de tema. Se descarto
  la variante «debajo del jardin, en su columna» por eso mismo.
- **El componente no recibe nada del jardin.** No consulta la base ni acepta conteos: un jardin en
  cero es precisamente cuando mas falta hace que la puerta siga abierta. Eso lo fija una prueba.
- **Vive en `src/app/(home)/`, junto a `HomeHero`.** Hoy solo la usa el inicio. El dia que
  `PilaresOverviewPage` la quiera, se promueve a `src/presentation/habits/` — mudanza, no copia.
- El texto entero sale de `habitCommunity.invitation.*`, con las claves escritas enteras. La flecha
  del enlace va con `aria-hidden`: dice «esto lleva a otro sitio» a quien mira y no se deletrea a
  quien escucha.

### Archivos tocados

**Presentacion**

- `src/app/(home)/CommunityPracticeInvitation.tsx` (nuevo).
- `src/app/[locale]/page.tsx` monta la banda entre la fila de comunidad y `PostsWithLoadMore`.

**Rutas y catalogos**

- `src/i18n/routes.ts` acoge `PILLARS_OVERVIEW_HREF`.
- `src/presentation/chrome/Header/menuItems.ts` lo reexporta en vez de definirlo.
- `src/i18n/messages/es.json` y `en.json`: namespace `habitCommunity.invitation`.

**Especificacion y pruebas**

- `docs/features/invitacion-a-practicar.md` (roadmap).
- `src/e2e/habits/invitacionAPracticar.feature` y `invitacionAPracticar.spec.ts`.
- `src/app/(home)/CommunityPracticeInvitation.test.tsx`.
- `src/i18n/routes.test.ts` cubre el href de la portada en ambos idiomas.

### Comandos clave

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/habits/invitacionAPracticar.spec.ts`
- `pnpm exec playwright test --shard=1/2` y `--shard=2/2`

### Resultados de validacion

- Vitest: 1441 pruebas en 146 archivos, todas verdes. Las 4 nuevas del componente y las 2 nuevas de
  `routes.test.ts` incluidas.
- `typecheck` y `typecheck:tests`: sin errores. El tipado de next-intl confirma que
  `habitCommunity.invitation` existe en los dos catalogos con la misma forma.
- `lint`: 781 archivos, sin hallazgos. Biome reformateo dos archivos de prueba antes de quedar limpio.
- E2E del escenario: 3 de 3 en verde (español, ingles y el orden en el DOM), 3.4 min.
- E2E completa: pendiente de anotar al cierre de las dos mitades.

### Desviaciones del roadmap

- Ninguna en alcance. Aparecio un trabajo no previsto: mudar `PILLARS_OVERVIEW_HREF` a `i18n/routes.ts`
  para no duplicar el objeto de ruta. Es refactor, no comportamiento, y queda cubierto por
  `routes.test.ts` y por los escenarios de menu que ya existian.

### Pendientes

- El slice 2 (`@future`) sigue sin construir: los cuatro atajos directos a cada pilar dentro de la
  misma banda.
- La suite e2e no cubre el aspecto de la banda en movil; el reparto en una o dos columnas lo decide
  `@container` y solo lo verifica la vista.

### Recap

El inicio ya no se limita a contar lo que la comunidad lleva hecho: despues del jardin y de las
celebraciones aparece una banda a todo el ancho que invita a practicar y lleva a `/pilares`,
conservando el idioma activo. Es un componente de servidor sin estado ni consultas, con todo su texto
en el catalogo, y el objeto de ruta de la portada de pilares vive ahora en un solo sitio que comparten
el menu y el inicio.

### Proximos pasos (opciones)

1. **Construir el slice 2**: cuatro atajos por pilar dentro de la banda, para quien ya sabe cual
   quiere practicar y no necesita pasar por el hub.
2. **Medir antes de ampliar**: dejar la banda como esta y decidir el slice 2 con evidencia de cuanta
   gente la usa, en vez de por intuicion.
3. **Llevar la invitacion a `/pilares`**: hoy la portada de pilares muestra el jardin sin invitar a
   nada; promover el componente a `src/presentation/habits/` cerraria el mismo circulo alli.
4. **Revisar el destino cuando `/habitos` se retire**: al cumplirse el `@slice-3` de
   `fusion-pilares-habitos`, comprobar que esta invitacion sigue siendo coherente con el nuevo indice.

**Acciones pendientes del usuario:** ninguna. La rama `feat/invitacion-a-practicar` esta lista para
revisar; el push y el PR se hacen cuando lo pidas.
