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

## 2026-09-29 — Slice 1b: rediseño moderno con GSAP

### Objetivo

El usuario vio la primera versión y la encontró demasiado sencilla («que sea moderno, estamos en el
2026») y autorizó añadir una librería de animación. Objetivo: acabado de estudio con el mismo guion,
los mismos escenarios de aceptación y sin tocar el modelo.

### Decisiones y por qué

- **GSAP y no anime.js.** Los dos tienen línea de tiempo con salto a un instante. GSAP ganó por la
  deformación de figuras (el garabato que se vuelve una onda tranquila), el movimiento por ruta y el
  hook oficial de React que limpia al desmontar. Licencia: gratuita («Standard no-charge»), no MIT; su
  única restricción es no construir un editor visual que compita con Webflow.
- **La línea de tiempo nunca corre sola.** Cada escena construye una línea pausada y el reloj del
  guion le dice en qué segundo estar (`seek`) en cada cuadro, por un canal (`feed`) que no pasa por
  React. Pausar congela todo, también la llama o las estrellas; saltar de escena es exacto; y la misma
  escena se podrá exportar a video cuadro por cuadro.
- **Fotograma de póster.** El segundo cero de una escena es su escenario vacío. En pausa al inicio de
  una escena se muestra el segundo 2,2, ya construido; al reproducir arranca desde cero.
- **La escena saliente se queda debajo 1,1 s**, quieta en su último cuadro, mientras la nueva entra
  encima. Sin eso cada cambio era un corte a fondo vacío.
- **Subtítulo cinético.** Las palabras entran una a una con desenfoque, y la frase clave se subraya
  con el color del pilar. La marca (`<hl>`) vive en el catálogo porque el énfasis cambia de sitio con
  el idioma; el script que la añadió verificó que el texto sin marcas es idéntico al aprobado.
- **Barra de progreso por escenas, al estilo de las historias**, que además es la navegación; se
  llena escribiendo directo en el DOM en cada cuadro.
- **Pulido de la versión vectorial** (pedido explícito antes de pasar a ilustraciones): personas con
  antebrazo, manga, cuello, rubor, suela y sombra de contacto; respiración sutil; paralaje por capas;
  follaje en primer plano; transiciones entre actos con leve acercamiento de cámara. El gancho y el
  cierre subrayan con las tintas de marca (naranja y verde), que son las de Alimentación y Movimiento
  y ya tienen contraste verificado en claro y en oscuro.

### Tropiezos que conviene recordar

- **`<mark>` trae fondo amarillo de fábrica** y tapaba el color de cada pilar.
- **Next 16 no deja levantar dos `next dev` en la misma carpeta.** Si el usuario tiene el suyo en el
  3000, el de las vistas previas se cae con «Another next dev server is already running». Usar el
  suyo, o esperar a que lo apague.
- **Un `heredoc` muy largo con JSX rompe el shell**; los scripts de edición largos van a un archivo.

### Archivos

- Reproductor: `useAnimationClock.ts` (canal por cuadro), `PillarAnimationPlayer.tsx`,
  `SceneProgress.tsx`, `useSceneLayers.ts`, `KineticCaption.tsx`, `captionMarkup.ts` (+ prueba),
  `PillarAnimation.module.css`.
- Escenas: `scenes/useSceneTimeline.ts`, `scenes/kit.tsx` y una escena por archivo (gancho, cuatro
  pilares, cierre). Se borraron las escenas CSS del slice 1.
- Textos: marcas `<hl>` y etiqueta de escena en `pillarAnimations` (es/en).
- Dependencias: `gsap` 3.15.0 y `@gsap/react` 2.1.2.

### Validación

- `pnpm run test:run`: 295 archivos, **3110 pruebas** en verde. `typecheck` y `lint` limpios.
- `pnpm exec playwright test src/e2e/pilares/animacionesPilares.spec.ts`: **17/17** (3,1 min), con
  `.next` borrado antes. Solo lee `/pilares`; no escribe en la base.
- Revisión visual de las seis escenas en varios instantes: sin errores en consola.

### Recap

La animación de `/pilares` tiene escenas vectoriales animadas con GSAP y sincronizadas al segundo con
el guion, subtítulos cinéticos con la frase clave subrayada, progreso por escenas, transiciones con
cámara, paralaje y personajes que respiran. Los 17 escenarios de aceptación siguen en verde.

### Próximos pasos (opciones)

1. **En curso — ilustraciones 3D de arcilla con Gemini 3 Pro Image**, animadas en 2.5D sobre el mismo
   reproductor (autorizado por el usuario, costo estimado 3–10 USD).
2. Clips con Veo 3.1 a partir de esas ilustraciones, para redes (costo aparte, por decidir).
3. Slice 2 — invitación en la primera visita a cualquier página.

## 2026-09-29 — Slice 1c: ilustraciones 3D de arcilla

### Objetivo

El usuario vio la versión vectorial pulida y pidió un acabado «de agencia internacional de diseño»,
con personajes e imágenes que no parezcan de PowerPoint. Eligió la ruta de ilustraciones generadas
con animación 2.5D (antes que clips de video o seguir con vectores) y el estilo «3D suave, como el
logo». Autorizó el costo en su cuenta de Gemini (estimado 3–10 USD).

### Decisiones y por qué

- **Gemini 3 Pro Image**, disponible con la `GEMINI_API_KEY` del proyecto, con el logo como
  referencia de estilo y una **hoja de personajes** generada primero como referencia de cada escena:
  es lo que mantiene a Ana, Leo, la abuela Rosa y Tomás iguales en los 17 planos.
- **Una ilustración por subtítulo** con fundido cruzado de 1 s centrado en el cambio de texto, y una
  **cámara distinta en cada una** (acercarse, alejarse, recorrer): el mismo movimiento dos veces
  seguidas se nota.
- **Lo que se mueve encima de la imagen** —brasas, estrellas, polvo en la luz, rayos, ondas, vapor,
  resplandores— va anclado a coordenadas medidas sobre cada ilustración y dentro de la misma capa
  que la cámara, así que se mueve con ella. Todo sigue en la línea de tiempo del reloj del guion.
- **El logo real, no el generado**: se superpone al abrir (con un velo para leerse) y al cerrar
  (sobre el cielo, por encima de las cabezas, con confeti de los cuatro colores). Así la marca sale
  nítida y la prueba del logo sigue midiendo lo mismo.
- **Tres anchos por imagen** (960, 1440 y 1920 px en WebP): el proyecto sirve imágenes sin optimizar
  (`images.unoptimized`), así que el `srcSet` necesita los anchos hechos. **Precarga**: al empezar a
  reproducirse se descargan en oculto las ilustraciones que vienen; quien nunca reproduce no descarga
  nada de más.
- **El proceso queda en el repo** (`scripts/animations/` y
  `028-2026-09-29-animaciones-de-los-pilares-ilustraciones.md`) porque las animaciones de cada pilar
  lo van a repetir.

### Tropiezos que conviene recordar

- **El modelo cuela la mascota** en escenas intermedias si el logo va como referencia: hay que
  prohibirlo en la indicación. Dos escenas se regeneraron por eso, y una por poner a Tomás donde
  tocaba Leo.
- **`TaskStop` no mata el `next dev` hijo**: el puerto se queda ocupado por un proceso huérfano.
  Cerrarlo por el puerto.
- **Borré `.next` con el servidor del usuario encendido.** El comando comprobaba el puerto 3000 pero
  seguía aunque estuviera ocupado; su servidor pasó a responder 500 y hay que reiniciarlo. La
  comprobación tiene que **abortar** si hay un servidor, no solo informarlo.

### Archivos

- Escenas: `scenes/IllustratedScene.tsx`, `scenes/atmosphere.tsx`, `scenes/artSources.ts`,
  `scenes/seededRandom.ts`; configuración en `overviewScenes.ts` (+ prueba). Se borraron las escenas
  vectoriales y su kit (quedan en el historial, commit `e64b4ec`).
- Reproductor: precarga (`preload`); el hook de escena acepta cualquier elemento como raíz.
- Ilustraciones: `public/animations/pilares/` (51 archivos, 3,6 MB).
- Proceso: `scripts/animations/generate-illustrations.mjs`, `prepare-illustrations.mjs` y el
  manifiesto de indicaciones.

### Validación

- `pnpm run test:run`: 296 archivos, **3131 pruebas** en verde. `typecheck` limpio; `lint` limpio
  (1284 archivos).
- Revisión visual de las 17 ilustraciones animadas en escritorio y en teléfono (390 px): sin errores
  en consola.
- `pnpm exec playwright test src/e2e/pilares/animacionesPilares.spec.ts`: **17/17** (2,5 min), en
  cuanto el usuario detuvo su servidor; con `.next` borrado antes y solo tras comprobar que no había
  ningún servidor escuchando. Solo lee `/pilares`; no escribe en la base.

### Costo

21 imágenes generadas (18 + 3 regeneraciones), ≈ 2,8 USD con la tarifa publicada en 2025.

### Recap

La animación de `/pilares` cuenta los cuatro pilares con 17 ilustraciones 3D de arcilla en la
estética del logo, con personajes consistentes, cámara lenta, fundidos y efectos vivos encima de cada
imagen, sincronizados con los subtítulos. Pruebas unitarias, tipos, linter y los 17 escenarios de
Playwright en verde.

### Próximos pasos (opciones)

1. **Pendiente del usuario:** volver a levantar su `next dev` (`pnpm dev`) y revisar la animación.
2. Clips con Veo 3.1 a partir de estas mismas ilustraciones, para redes (costo aparte).
3. Slice 2 — invitación en la primera visita a cualquier página.
4. Slices 3–6 — la animación de cada pilar con el mismo proceso y los mismos personajes.

## 2026-09-29 — Slice 2: invitación en la primera visita y medición

### Objetivo

Llevar la animación a donde está quien llega por primera vez —casi nunca `/pilares`— y medir si se
ve, para decidir con datos si construir la animación de cada pilar. Orden acordado con el usuario:
este slice, luego exportar a video (7), luego los pilares según los datos, la voz, y Veo solo con su
autorización.

### Decisiones y por qué

- **Medición con Google Analytics 4**, que el layout ya carga en producción: nada de tablas nuevas
  (las migraciones son de `bot-whatsapp`) ni de otro servicio. Se llama a `gtag` si existe; fuera de
  producción no hace nada y no ensucia la consola.
- **Siete eventos, en un vocabulario cerrado** (`animationAnalytics.ts`): invitación mostrada,
  aceptada y descartada; reproducción (sola, con el botón, al continuar o al repetir); escena
  alcanzada; animación completa; clic en «Elegir mi práctica». Todos llevan `animation` y
  `placement` («page» o «invite»). Ningún dato personal.
- **El reproductor no sabe de analítica**: avisa por `onEvent` y quien lo monta decide adónde va.
- **La invitación es una tarjeta, no una ventana**: en una esquina (encima de la barra inferior en el
  teléfono), a los 6 s, sin robar el foco. Una sola vez por navegador y solo a quien no vio la
  animación; se recuerda en cuanto aparece. No aparece en `/pilares` ni donde se hace algo concreto
  (compra, pedidos, citas, publicar, cuenta, administración, entrar): lista cerrada en
  `inviteRoutes.ts`, con prueba.
- **Aceptarla abre la animación en un diálogo**, sin salir de la página, con el patrón accesible de
  `MediaPreviewDialog`. La animación se descarga al abrirlo: el resto del sitio no carga GSAP ni las
  escenas.
- **La suite de Playwright arranca con la invitación ya mostrada** (`storageState` en la
  configuración): una tarjeta a los pocos segundos podría tapar el botón que otro escenario pulsa.
  Su especificación empieza de cero.
- El ancla de las tarjetas de `/pilares` pasó a `pillarPageAnchors.ts`, para que la animación
  abierta desde otra página lleve al mismo sitio que la de la portada.

### Archivos

- Invitación: `PillarsInvite.tsx`, `PillarsAnimationDialog.tsx`, `inviteRoutes.ts` (+ prueba);
  montada en `src/app/[locale]/layout.tsx`.
- Medición: `src/infra/analytics/sendAnalyticsEvent.ts`, `animationAnalytics.ts`; `onEvent` en el
  reproductor; `placement` en `PillarsOverviewAnimation`.
- Textos: `pillarAnimations.invite` (es/en).
- Pruebas: `invitacionPilares.feature` / `.spec.ts`; `storageState` en `playwright.config.ts`.

### Validación

- `pnpm run test:run`: 3142 de 3143 en verde; la que faltaba era la regla de radios del sistema de
  diseño (la invitación y el diálogo pedían `rounded-xl/2xl/3xl`): corregida a `rounded-control`,
  `rounded-card` y `rounded-panel`, y su prueba pasa (28/28). `typecheck` y `lint` limpios.
- Playwright de `src/e2e/pilares` en 6 tramos: 81/83. `invitacionPilares.spec.ts` en verde tras
  hacer deterministas sus tiempos (un marcador que solo existe ya hidratado y el reloj adelantado a
  pasos). Los 2 fallos son de `practicasPropias.spec.ts` y **anteriores a este slice**: fallan igual
  sin estos cambios (comprobado con `git stash`). Causa: «marcada hoy» se decide por la publicación
  del día de la práctica, y la limpieza de esa prueba no la borra; pasan en la primera corrida del
  día y fallan en las siguientes. Pendiente aparte, fuera de este slice.
- Para correr Playwright se detuvo el `next dev` del usuario (autorizado por él).

### Pendiente del usuario

- **En GA4 (Administrar → Definiciones personalizadas)**, registrar como dimensiones de evento
  `placement`, `scene`, `trigger` y `animation`. Sin eso los eventos se cuentan, pero sus datos no
  aparecen en los informes estándar.
- Dejar correr unas semanas antes de decidir las animaciones de cada pilar. Lo que conviene mirar:
  de las invitaciones mostradas, cuántas se aceptan; de las reproducciones, cuántas llegan a la
  escena 6; y cuántas terminan en «Elegir mi práctica».

### Recap

Quien entra por primera vez al sitio, por casi cualquier página, recibe a los 6 s una invitación
discreta a ver los cuatro pilares; aceptarla la reproduce encima de la página. La animación de
`/pilares` y la de la invitación envían siete eventos a GA4 que dicen si se ve y si lleva a elegir
práctica.

### Próximos pasos (opciones)

1. **Slice 7 — exportar a video para redes**: la animación completa y un corte por pilar, con
   subtítulos incrustados y música libre de derechos.
2. Con datos de unas semanas, decidir las animaciones de cada pilar (slices 3–6).
3. La voz (slice 8), al final de todas las animaciones. Veo (slice 9) solo con autorización.

## 2026-09-29 — Slice 7: exportar a video para redes

### Objetivo

Sacar de la animación que ya existe las piezas para redes, sin generar ninguna imagen nueva: la
animación completa y un corte por pilar, en vertical, cuadrado y horizontal, con los subtítulos
incrustados. Con pocos visitantes, las redes son el canal para llegar a gente nueva.

### Decisiones y por qué

- **Se graba cuadro por cuadro, no en tiempo real.** Un script de Playwright abre
  `/animaciones/video?pieza=…&formato=…`, lleva la composición a cada instante con
  `window.__renderFrame(ms)` y le pasa la captura a `ffmpeg`. Todo lo que se mueve es función del
  tiempo —las escenas con GSAP ya lo eran; el subtítulo cinético se recalcula en `captionFrame.ts`
  en vez de animarse con CSS—, así que el cuadro 312 sale igual en cada exportación.
- **Una composición por formato.** En vertical y cuadrado, el escenario 16:9 queda como una ventana
  sobre su propia ilustración desenfocada, con el subtítulo grande debajo; en horizontal ocupa el
  cuadro entero y el subtítulo va en el tercio inferior. Arriba, el logo, la etiqueta del pilar y el
  progreso; abajo, la dirección del sitio; al final, 3 s de cierre con el logo.
- **La página de render solo existe en desarrollo** (404 en producción, sin indexar). Vive bajo
  `[locale]` porque ahí está el `<html>` y las fuentes; la composición cubre la ventana entera por
  encima del resto del sitio.
- **La dirección del video es la de producción** (`PRODUCTION_URL`), no la canónica del entorno,
  que en desarrollo es `localhost`.
- **Tiempos compartidos**: los del subtítulo cinético (`kineticTiming.ts`) y los de cada escena
  (`overviewTimings.ts`) salieron de sus componentes para que la web y el video usen los mismos.
- **Sin sonido por ahora.** La música se mezcla aparte con `ffmpeg` en segundos; generarla con Lyria
  cuesta 0,08 USD por canción (tarifa publicada) y se consulta con el usuario antes.

### Tropiezos que conviene recordar

- **La animación dura 104 s, no ~100.** Un cálculo mental equivocado hizo parecer un fallo lo que
  era el fundido exacto a mitad de camino en el segundo 99.
- **`ffmpeg` recibe las capturas JPEG en rango completo** (`yuvj420p`); hay que convertir al rango
  estándar de video o algunos reproductores lavan los negros.

### Archivos

- Composición: `social/SocialComposition.tsx`, `social/captionFrame.ts` (+ prueba),
  `social/socialCuts.ts` (+ prueba); tiempos compartidos en `kineticTiming.ts` y
  `overviewTimings.ts`.
- Página: `src/app/[locale]/animaciones/video/page.tsx` (solo desarrollo).
- Script: `scripts/animations/render-video.mjs`.
- `PRODUCTION_URL` en `src/infra/constants`; texto del cierre en `pillarAnimations.social`.

### Validación

- `pnpm run test:run`: **3154 pruebas** en verde; `typecheck` y `lint` limpios (1300 archivos).
- Playwright de la animación y de la invitación: **28/28** (3,3 min), con `.next` borrado antes y
  sin servidores escuchando.
- Exportación: 11 videos en `out/videos/` (fuera del repositorio), verificados con `ffprobe` —
  H.264, `yuv420p` en rango estándar, 30 fps, cuadros exactos—:

  | Pieza | Duración | Vertical | Cuadrado |
  |---|---|---|---|
  | Sueño | 24,8 s | 5,6 MB | 4,2 MB |
  | Alimentación | 22,8 s | 6,0 MB | 4,6 MB |
  | Movimiento | 20,0 s | 4,9 MB | 3,6 MB |
  | Mente y espíritu | 19,0 s | 5,9 MB | 4,8 MB |
  | Completa | 107,0 s | 28,7 MB | 22,1 MB |

  Más la completa en horizontal (1920×1080, 41,9 MB). Se graba a ~6 cuadros por segundo: un corte
  de pilar tarda ~2 min y la pieza completa ~9 min.

### Recap

La animación de los cuatro pilares se exporta a video con un comando, en tres formatos y cinco
piezas, con subtítulos incrustados y cierre de marca. Once videos ya exportados, sin sonido,
esperando la música.

### Próximos pasos (opciones)

1. **Pendiente del usuario:** autorizar la música con Lyria (~0,25 USD por tres propuestas), o
   pasar pistas libres de derechos que prefiera; con eso se mezclan los once videos.
2. Publicar las piezas y, con los datos de GA4 de unas semanas, decidir las animaciones de cada
   pilar (slices 3–6).
3. La voz (slice 8) al final: con Gemini TTS cuesta centavos.
