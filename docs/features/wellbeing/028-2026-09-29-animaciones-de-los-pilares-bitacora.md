# Bitácora — Animaciones de los pilares

> Roadmap: `028-2026-09-29-animaciones-de-los-pilares.md`. Escenarios:
> `src/e2e/pilares/animacionesPilares.feature`.

## 2026-09-29 — Slice 1: la animación de los cuatro pilares en `/pilares`

### Objetivo

Que quien llega a `/pilares` entienda en ~100 s qué son los cuatro pilares y **por qué existen**,
antes de pedirle que elija una práctica, y dejar el guion listo para exportarse después a video.

### Decisiones y por qué

- **El guion creció de ~35 s a ~100 s a pedido.** La primera versión decía qué es cada pilar, no
  de dónde viene; sin el antecedente, «dormir al ritmo de la luz» suena a un consejo más. Cada
  pilar se cuenta en tres tiempos fijos (antes · lo que cambió · el regreso), con gancho en los
  primeros segundos, alivio en vez de culpa («no es un fallo tuyo: es un desajuste») y un cierre
  con un paso mínimo. Todas las afirmaciones salen de las páginas de cada pilar.
- **El logo no habla.** Se valoró convertirlo en narrador con boca animada. Se descartó: es una
  imagen 3D, no un vector por partes, y un personaje fotorrealista entre ilustraciones planas se ve
  pegado encima. Se usa `public/logo.webp` tal cual, grande al abrir y al cerrar, en la esquina
  mientras se cuenta el gancho y el templo, y ausente en las escenas de cada pilar.
- **Escenas en SVG + CSS, sin dependencias nuevas.** Los textos salen de `next-intl` (es/en sin
  volver a producir nada). Los colores del escenario son fijos, no tokens de tema: el escenario es
  un cuadro, como un video, y tiene que verse igual en claro, en oscuro y exportado.
- **El tiempo es una función pura** (`playheadAt`). El reloj guarda lo transcurrido en una ref y
  solo publica estado al cambiar de escena o subtítulo: re-renderizar 60 veces por segundo para un
  texto que cambia cada seis no tenía sentido. Las ilustraciones se mueven con CSS.
- **Arranca sola solo la primera vez y solo a la vista** (IntersectionObserver al 50 %): en un
  teléfono el reproductor queda debajo del héroe, y arrancar al cargar sería reproducirlo para
  nadie. «Ya vista» vive en `localStorage`; si el almacenamiento falla, se trata como vista.
- **Movimiento reducido:** no arranca, todos los subtítulos de la escena se leen juntos y la
  escena se ve ya completa.
- **Claves de traducción escritas enteras** (`OVERVIEW_CAPTION_KEYS`) y no armadas con plantilla:
  el producto cartesiano escena × subtítulo generaba claves que no existen (`closing.b3`) y
  `next-intl` las rechazaba en compilación, con razón.

### Tropiezos que conviene recordar

- **`transform-box: fill-box` en todo el escenario desplaza las figuras.** También cambia el
  pivote de los `transform` escritos como atributo (`translate(...) scale(...)`). Se limitó a las
  clases que escalan o giran.
- **Pausar con `.stage *` dejaba la escena lavada.** Congelaba también el fundido de entrada de la
  escena y el del logo. La pausa ahora solo alcanza a `svg *`.
- **Un icono dentro de un botón `inline-flex` se encoge a 8 px** si no lleva `shrink-0`.
- **`test.use({ reducedMotion })` no aplicó la preferencia**; `page.emulateMedia` antes de
  `goto` sí. Era la prueba, no la app.
- **Editar con Python en Windows escribe CRLF** y `biome` lo marca; se normalizó a LF.

### Archivos

- Reproductor y guion: `src/presentation/habits/animations/` (`playhead.ts`,
  `useAnimationClock.ts`, `usePlaybackPreferences.ts`, `seenAnimations.ts`,
  `PillarAnimationPlayer.tsx`, `PillarsOverviewAnimation.tsx`, `pillarsOverviewScript.ts`,
  `PillarAnimation.module.css`).
- Escenas: `src/presentation/habits/animations/scenes/` (gancho, cuatro pilares, cierre y piezas
  comunes).
- Página: `src/app/[locale]/pilares/components/PilaresOverviewPage.tsx` (entre el héroe y las
  tarjetas).
- Textos: `pillarAnimations` en `src/i18n/messages/{es,en}.json`.
- Pruebas: `playhead.test.ts`, `pillarsOverviewScript.test.ts`,
  `src/e2e/pilares/animacionesPilares.{feature,spec.ts}`.

### Validación

- `pnpm run test:run`: 294 archivos, 3105 pruebas en verde (antes de los últimos retoques
  visuales); tras ellos, `vitest` de `src/presentation/habits` y `src/app/[locale]/pilares`: 234 en
  verde.
- `pnpm run typecheck`: limpio. `pnpm run lint`: limpio.
- `pnpm exec playwright test src/e2e/pilares/animacionesPilares.spec.ts`: **17/17** (2,3 min),
  con `.next` borrado antes de cada corrida. Solo lee `/pilares`; no escribe en la base.
- Revisión visual: capturas de las 17 viñetas en escritorio y del cierre a 390 px.

### Desviaciones del roadmap

- Duración ≈ 100 s en vez de los ≈ 90 s del roadmap: las duraciones salen de ~250 ms por palabra
  más 1,5 s de aire, y el guion aprobado tiene ~270 palabras.

### Pendientes

- La locución (slice 8) tendrá que respetar las mismas duraciones o ajustarlas en
  `PILLARS_OVERVIEW_SCRIPT`, que es la única fuente.

### Recap

`/pilares` tiene, entre el héroe y las tarjetas, una animación de seis escenas y diecisiete
subtítulos que cuenta el antecedente de cada pilar y termina en «Elegir mi práctica». Arranca sola
la primera vez que se ve, respeta movimiento reducido, funciona en español e inglés y está cubierta
por 17 escenarios de Playwright y 18 pruebas unitarias. El guion es una función pura del tiempo,
lista para reutilizarse en el video.

### Próximos pasos (opciones)

1. **Slice 2 — invitación en la primera visita a cualquier página** (lo más alineado con captar
   gente nueva).
2. **Slice 3 — animación de Sueño** bajo el héroe de su página, como plantilla de las otras tres.
3. **Slice 7 — exportar a video** vertical y cuadrado para redes.
4. **Pendiente del usuario:** ver la animación en `/pilares` y decir qué escena o frase ajustar
   (ritmo, dibujos, textos) antes de replicar el estilo en las animaciones de cada pilar.
