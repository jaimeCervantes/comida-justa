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

## 2026-09-29 — Slice 8: la voz del narrador y la música

### Objetivo

Que la animación se entienda también escuchándola: la voz de un narrador dice cada subtítulo y una
música original va debajo, en los once videos para redes y en la web, donde el sonido está apagado
hasta que alguien lo pide. Se adelantó a los slices 3–6 a petición del usuario («¿no crees que debe
ser hora de agregar el audio del narrador?»): los videos ya existían y sin voz eran media pieza.

Decisiones del usuario: la voz **Algieba** entre las muestras; **música original con Lyria** frente
a pistas libres de derechos; **videos y web**, con el sonido apagado por omisión. Y un cambio de
texto: «el mundo en el que vive» pasa a «el mundo en el que **vives**» («the world you live in»).

### Decisiones y por qué

- **Gemini 2.5 Pro TTS, no 3.8 Flash.** El 3.8 leía en voz alta la dirección de la locución y no
  acepta instrucción de sistema. El 2.5 Pro entiende la dirección escrita como «Say …:» delante del
  texto. El acento sale latinoamericano neutro; el usuario lo sabe.
- **El guion se mide con la voz.** Cada subtítulo dura lo que tarda el narrador en el idioma más
  lento, más 0,35 s de entrada y 0,65 s de respiro, en cuartos de segundo. Con la voz cruda eran
  ~167 s; acelerada un 7 % (sin cambiar el tono) quedan **152,5 s** (antes 104). Las escenas, la
  cámara y los subtítulos siguen solos porque todo sale del guion.
- **La música cálida, elegida por mí.** El usuario recibió las tres propuestas pero no alcanzó a
  elegir; piano y cuerdas son lo que menos compite con una voz grave. Se generó una versión larga
  (163 s) y su final se alinea con el final de la animación. Cambiarla es `--musica=`.
- **La mezcla, medida y no a oído** (no hay oídos aquí): la música 14 dB por debajo de como llega,
  agachada por la voz. Con una recuperación de 0,45 s subía en cada coma; con 1,2 s solo respira en
  las pausas largas y entre escenas, unos 15 dB debajo de la voz. **−16 LUFS** con una sola ganancia
  y un limitador de picos: `loudnorm` caía a su modo dinámico y comprimía la voz.
- **Cada corte toma su ventana de la música de la pieza entera**, así que el video de Sueño suena
  igual que Sueño dentro de la completa.
- **En la web**, una pista MP3 por idioma que sigue al reloj: se corrige si se desvía más de 0,3 s,
  salta con la escena y calla en pausa. No se descarga hasta que alguien pulsa el botón de sonido
  (`preload="none"`). Al terminar la animación no se corta: trae 3 s de cola para que la música
  cierre mientras aparece «Elegir mi práctica». No se le pide que busque mientras sigue buscando,
  porque con una conexión lenta se quedaría buscando para siempre. El botón la desbloquea en el
  mismo toque, que es lo que Safari exige. Con movimiento reducido no hay sonido.
- **`--resonorizar`** cambia el sonido de un video ya exportado sin volver a grabar sus cuadros:
  grabar la pieza completa tarda ~20 min y remezclar, segundos. Si el usuario pide otra música u otro
  volumen, no hace falta volver a exportar.
- **Las pistas intermedias viven en `out/`, sin versionar**, igual que los originales de las
  ilustraciones. `prepare-narration.mjs` deja por escrito lo que antes eran comandos sueltos
  (recortar silencios, tempo, medir). Se comprobó que reproduce los 17 tiempos del guion exactos, con
  diferencias de 1,5 ms como mucho en la duración de las pistas.
- **El registro de `gtag` de las pruebas** pasó a `src/e2e/testUtils/recordAnalytics.ts`, porque
  ahora lo usan dos specs.

### Tropiezos que conviene recordar

- **El filtro de Lyria bloquea «Mexican folk»** sin decir por qué; los instrumentos ya dan el color.
- **No se toca código de la app mientras se exportan videos.** El `next dev` que sirve la página de
  render la recarga en caliente, y una recarga a mitad de la grabación puede estropear cuadros. Los
  cambios de código se dejaron para después de la exportación.
- **La página de render necesita internet.** Vive dentro del layout del sitio, que consulta la base
  compartida (el mensaje de logros de la comunidad). Se cayó la conexión a mitad de la exportación y
  dos piezas fallaron con un 500 (`getaddrinfo ENOTFOUND …supabase.com`). Con la conexión de vuelta
  se repitieron solo esas dos.
- **Una prueba tiene que cumplir su «Dado».** Dos escenarios de sonido fallaron la primera vez:
  pulsaban el botón antes de que la animación arrancara. La animación arranca cuando al menos la
  mitad del reproductor está a la vista, y el clic en los controles de abajo desplazaba la página
  por debajo de esa mitad. No era un fallo del producto (el botón de sonido solo activa el sonido):
  la prueba no esperaba a que la animación sonara, como dice el escenario. Ahora la espera.

### Archivos

- Guion y texto: `pillarsOverviewScript.ts` (duraciones medidas con la voz), `intro.b1` en
  `es.json`/`en.json`.
- Reproductor: `PillarAnimationPlayer.tsx` (botón y sincronía del sonido),
  `PillarsOverviewAnimation.tsx` (pista por idioma, medición), `animationAnalytics.ts`
  (`animation_sound`), `pillarAnimations.player.soundOn/soundOff`.
- Video: `social/SocialComposition.tsx` y `social/socialCuts.ts` (`cutBeats`, + prueba): la
  composición publica dónde empieza cada subtítulo del corte y qué ventana de la pieza es.
- Scripts: `generate-narration.mjs`, `prepare-narration.mjs`, `generate-music.mjs` (nuevos);
  `render-video.mjs` (mezcla, `--solo-sonido`, `--resonorizar`).
- Pistas: `public/animations/pilares/sonido-{es,en}.mp3` (2,5 MB cada una).
- Pruebas: `animacionesPilares.feature` y `.spec.ts` (slice 8), `invitacionPilares.spec.ts`,
  `testUtils/recordAnalytics.ts`.
- Docs: roadmap y `028-2026-09-29-animaciones-de-los-pilares-sonido.md` (cómo se hace el sonido).

### Validación

- `pnpm run test:run`: **3157 pruebas** en verde (299 archivos; 3 nuevas para `cutBeats`);
  `typecheck` sin errores y `lint` limpio (1304 archivos).
- Playwright de la animación y de la invitación: **34/34** en tres tramos (12 en 2,3 min, 11 en
  2,3 min, 11 en 2,6 min), con `.next` borrado antes de cada uno y sin servidores escuchando en el
  3000. En la primera pasada del segundo tramo fallaron 2, por la prueba y no por el producto (ver
  tropiezos).
- Exportación: **11 videos** en `out/videos/` (fuera del repositorio), verificados con `ffprobe`:
  H.264 `yuv420p` a 30 fps, AAC estéreo a 48 kHz, entre −15,8 y −16,0 LUFS, picos por debajo de
  −1,3 dBFS, y el audio dura lo mismo que el video, con una diferencia máxima de un cuadro.

  | Pieza | Duración | Vertical | Cuadrado |
  |---|---|---|---|
  | Sueño | 37,0 s | 8,1 MB | 6,5 MB |
  | Alimentación | 30,3 s | 7,6 MB | 6,1 MB |
  | Movimiento | 28,3 s | 6,5 MB | 5,1 MB |
  | Mente y espíritu | 27,0 s | 8,1 MB | 7,0 MB |
  | Completa | 155,5 s | 38,9 MB | 31,6 MB |

  Más la completa en horizontal (1920×1080, 57,9 MB). Se grabó a ~4–5 cuadros por segundo.
- Pistas de la web: `sonido-es.mp3` y `sonido-en.mp3`, 155,5 s, MP3 de 128 kbps, −16,05 y −16,07
  LUFS.
- Cuadros revisados a ojo en la completa (vertical y horizontal): subtítulo en su escena, barra de
  progreso y cierre con el logo.

### Recap

La animación de los cuatro pilares ya habla: un narrador (Algieba) dice cada subtítulo en español
o en inglés, con música original de Lyria debajo que se agacha cuando habla. El guion se mide con
la voz y dura 152,5 s. En la web el sonido está apagado hasta que alguien lo pide, no se descarga
antes y sigue a la animación. Los once videos para redes están exportados con la misma mezcla. El
proceso completo, de narrar a exportar, está en scripts y documentado.

### Próximos pasos (opciones)

1. **Pendiente del usuario: escuchar y opinar.** Los videos están en `out/videos/`, y en `/pilares`
   el botón de sonido. Si la música va alta o baja, o se prefiere la propuesta `folk` o la
   `ambiental`, cambiarla toma segundos (`--resonorizar` para cada video, `--solo-sonido` para la
   web), sin volver a grabar cuadros.
2. **Pendiente del usuario:** registrar en GA4 la dimensión personalizada `state` (junto a
   `placement`, `scene`, `trigger` y `animation`), para leer quién enciende el sonido.
3. Publicar las piezas en redes y, con unas semanas de datos, decidir las animaciones de cada pilar
   (slices 3–6). El proceso de voz y música ya les sirve tal cual.
4. Posibles mejoras: la narración frase por frase en el modo de movimiento reducido; los videos en
   inglés (`--idioma=en`) si hay público para ellos.
5. El slice 9 (Veo) sigue esperando la autorización expresa del usuario.

## 2026-09-30 — Slice 3: la animación de Sueño bajo el héroe de su página

### Objetivo

Que quien llega a `/pilares/sueno` —casi siempre desde un video en redes— entienda en dos minutos
por qué importa el descanso y cómo empezar, sin leer el artículo. Y dejar hecha la plantilla de las
otras tres. El usuario lo pidió estando fuera («haz las animaciones para cada pilar, empieza con el
sueño y descanso»), sin esperar los datos de GA4 que el orden acordado ponía antes.

### Decisiones y por qué

- **El arco de cada pilar: cinco tiempos.** Antes, lo que cambió, lo que cuesta, lo que compensa y
  la versión mínima de la práctica. Es el arco de la animación general más el costo y la práctica,
  que allí no caben. Todo el texto sale de la página de Sueño; ningún dato nuevo. El guion está en el
  roadmap para que el usuario lo revise: **no lo aprobó antes de producirlo**, porque no estaba.
- **Una animación es un dato (`PillarStory`).** El reproductor, la exportación a video y la mezcla
  de sonido pasaron a ser genéricos (`IllustratedAnimation`, `FILMS`, `--animacion`). La general
  quedó como una definición más, sin cambiar lo que se ve. El pilar siguiente es un archivo de
  datos, sus textos, sus ilustraciones y su narración.
- **Se monta sola en la página de cualquier pilar que tenga la suya** (`PillarArticle`), entre el
  héroe y el artículo; su final lleva a la práctica de la misma página.
- **Dos minutos como mucho**, y una prueba lo sostiene. Con la voz, Sueño dura 1:56.
- **La invitación a ver los cuatro pilares ya no aparece en `/pilares/sueno`.** Competiría con la
  animación de la página, y con el sonido encendido se oirían las dos. La lista de páginas con
  animación propia vive aparte de las animaciones (la invitación va en todas las páginas y no debe
  cargarlas); una prueba comprueba que coinciden.
- **Voz y música propias.** La voz es Algieba, como la general. La música se generó con Lyria: una
  canción de cuna que se vuelve amanecer, como la práctica «Del atardecer al amanecer». Su final cae
  en «Empieza esta noche».
- **La invitación decía «minuto y medio»**; con voz, la general dura dos y medio. Corregido en los
  dos idiomas.
- **El logo ya no abre ninguna animación, solo cierra.** Lo pidió el usuario al ver la general:
  aparecía en el centro de la primera escena y se iba a la esquina superior derecha, y la cabecera
  —del sitio y del video— ya lo lleva arriba a la izquierda. Se quitó también de la de Sueño por la
  misma razón; el del cierre se queda como estaba.

### Tropiezos que conviene recordar

- **Después de un bloque en línea siempre se puede partir la línea.** Cada palabra del subtítulo es
  un bloque en línea, así que el punto que sigue a la frase clave podía quedarse solo al principio
  del renglón: «dormíamos» / «. El sol…». Pasarlo a texto normal no sirve (CSS abre un corte después
  de cualquier bloque en línea). La puntuación pegada a la frase clave se queda ahora dentro de ella,
  subrayada como con un marcatexto. Pasaba también en el video vertical de la animación general
  («Volver a la comida real» / «, de temporada…»), que se volvió a exportar.
- **El video horizontal usaba la ilustración de 960 px.** El `sizes` de la web
  (`(min-width: 1024px) 960px`) valía también en la composición a 1920 px, así que la imagen salía
  al doble de su tamaño. Ahora la composición pide el ancho de su escenario.
- **Decodificada no es pintada.** Al saltar de golpe a una escena, la captura salía antes de que
  Chrome terminara de dibujar la ilustración nueva: solo se veían los resplandores sobre negro. La
  composición espera un poco más la primera vez que aparece cada ilustración. En los videos, que se
  graban cuadro a cuadro, no llegó a notarse; en la revisión con saltos, sí.
- **Nombres de más de una palabra.** `prepare-illustrations.mjs` solo aceptaba ids como `intro-1`;
  ahora acepta `sleep-cost-2`.

### Archivos

- Historia de Sueño: `stories/pillarStory.ts`, `stories/sleepStory.ts`, `stories/pillarStories.ts`
  (+ prueba), `stories/PillarStoryAnimation.tsx`; textos en `pillarAnimations.sleep`.
- Genérico: `IllustratedAnimation.tsx`, `sceneTimings.ts`, `animationMessages.ts`;
  `PillarsOverviewAnimation.tsx` y `overviewTimings.ts` sobre ellos.
- Página: `PillarArticle.tsx` (la animación bajo el héroe); `inviteRoutes.ts` (+ prueba).
- Video: `social/films.ts`, `social/socialCuts.ts` (+ prueba), `social/SocialComposition.tsx`,
  `app/[locale]/animaciones/video/page.tsx` (`?animacion=`); `scenes/IllustratedScene.tsx`
  (`sizes`).
- Subtítulos: `captionMarkup.ts` (+ prueba).
- Scripts: `render-video.mjs` (`--animacion`), `generate-narration.mjs` (`--seccion`),
  `generate-music.mjs` (propuesta `nocturna`), `prepare-illustrations.mjs`;
  `pillar-sleep.manifest.json`.
- Recursos: 39 WebP de Sueño (2,6 MB) y `sonido-sueno-{es,en}.mp3` (1,9 MB cada una).
- Pruebas: `animacionDelPilar.feature` y `.spec.ts` (nuevas), `invitacionPilares.*`,
  `animacionesPilares.*`, `testUtils/animationPlayer.ts` (ayudantes compartidos).
- Docs: roadmap (guion de Sueño), guías de ilustraciones y de sonido.

### Validación

- `pnpm run test:run`: **3172 pruebas** en verde (300 archivos); `typecheck` sin errores y `lint`
  limpio (1319 archivos).
- Playwright de las animaciones y de todas las páginas que ahora montan la de Sueño —11 archivos,
  **121 pruebas**, en 8 tramos con `.next` borrado antes de cada uno—: 119 en verde a la primera.
  Los 2 fallos, ambos de `atomicSleepChallenge`, fueron uno real de la prueba (el título de
  Movimiento, buscado sin `exact`, chocaba con una publicación de la comunidad: corregido) y uno
  intermitente (compartir), que pasó solo y en el archivo completo (**19/19**). Se dejó fuera
  `practicasPropias`, que ya fallaba antes por no borrar lo que publica.
- La corrida se cortó una vez en el tramo 6 porque la máquina se quedó sin memoria; se cerraron el
  `next dev` huérfano y los navegadores de Playwright, y se retomó donde iba con permiso del
  usuario.
- Revisión en movimiento: un cuadro por subtítulo desde la página de render, y la página real en
  escritorio y en teléfono (arranca sola, bajo el héroe, con el punto pegado a su frase).

### Recap

La animación de Sueño vive bajo el héroe de `/pilares/sueno`: 1:56 narrados por Algieba, con
música propia de la noche al amanecer, trece ilustraciones y su final en la práctica. El
reproductor, la exportación y la mezcla ya sirven para cualquier pilar, y el logo solo cierra.
Alimentación, Movimiento y Mente y espíritu tienen guion, ilustraciones revisadas, música y
definición, a falta de su voz, que espera la cuota diaria de Gemini TTS.

### Próximos pasos (opciones)

1. **Volver a exportar los videos** que llevaban el logo de apertura: los tres de Sueño y los tres
   completos de la general, más el corte vertical de Alimentación (tenía una coma suelta).
2. **Slices 4–6** en cuanto se renueve la cuota de voz (hacia las 18:00): narrar por escena, medir,
   llevar los textos al catálogo, mezclar, probar y exportar.
3. **Pendiente del usuario:** revisar los guiones (en el roadmap) y escuchar la mezcla; registrar
   en GA4 la dimensión `state`.
4. **Deuda que apareció otra vez:** `practicasPropias` deja publicaciones en la base compartida, y
   rompen pruebas de otros archivos (aquí, el título de Movimiento).

## 2026-09-30 — Slices 4, 5 y 6: Alimentación, Movimiento y Mente y espíritu, con texto (la voz, al final)

### Objetivo

Que cada pilar tenga su propia animación bajo el héroe de su página, con la plantilla de Sueño:
los otros tres, el mismo día. A media producción se agotó la cuota diaria de voz, y el usuario
propuso separar: **primero las animaciones con texto, la voz al final**.

### Decisiones y por qué

- **El mismo arco de cinco tiempos**, con lo que ya dice cada página: Alimentación (la cadena
  global de la posguerra, el costo del traslado, la temporada y la cercanía, la cocción limpia, la
  cena al atardecer y la triada), Movimiento (la Revolución Industrial, dos cuadras en motor, el
  barrio como espacio de movimiento, el pie y el terreno, moverse sin motor y dos minutos de pie) y
  Mente y espíritu (la aldea que se volvió pantalla, la saturación, el desarraigo y la soledad
  acompañada, las ventanas de silencio, el arraigo, abrir el día sin pantalla y la presencia). Los
  guiones están en el roadmap para que el usuario los revise: se produjeron sin su aprobación.
- **Trece ilustraciones por pilar**, revisadas una por una. Seis se regeneraron: texto legible
  («Flour», «Sugar», «Oil» en la fábrica; «NEWS» en una burbuja), un hombre con barba que no está
  en la hoja de personajes, Leo y Ana que no se parecían a sí mismos, y una sala que salió repetida
  dos veces, una encima de la otra. Cuatro traen una franja lisa arriba (lo que el modelo entiende
  por «deja calmo el 12 % superior»); la cámara la deja fuera acercándose desde abajo.
- **Música propia por pilar**, de Lyria: `cocina` (Alimentación), `caminata` (Movimiento) y
  `presencia` (Mente y espíritu).
- **Sin voz, los tiempos se estiman.** Cada subtítulo dura lo que tardaría el narrador según la
  velocidad a la que ya lee Algieba, ajustada sobre las 84 frases narradas (español:
  −0,18 s + 0,078 s por letra; inglés: −0,55 s + 0,081 s por letra; la peor subestimación fue de
  1,8 s), con la regla de siempre y 0,25 s de margen. Alimentación usa sus tiempos medidos, salvo
  las dos frases del cierre que en inglés quedaron sin narrar. Al llegar la voz se miden de verdad.
- **Sin voz, sin botón de sonido.** `soundtrackBase` pasó a ser opcional: la animación va solo con
  texto, y la prueba de la pista se salta en las que aún no la tienen, diciendo por qué.
- **Narrar por escena** (`generate-narration.mjs --por-escena`): un pedido por escena en vez de uno
  por frase, cortado en las pausas y comprobado con el ritmo de lectura. Con la cuota de 50 pedidos
  al día de Gemini 2.5 Pro TTS, las tres animaciones pasan de ~52 pedidos a ~21.
- **La invitación a ver los cuatro pilares ya no aparece en ninguna página de pilar.** Sus
  ejemplos de «sí invita» pasan a `/practicas`.
- **Cada historia se exporta por su nombre** (`STORY_FILMS`: `alimentacion`, `movimiento`,
  `mente`), con su música ya asignada en `render-video.mjs`: los videos saldrán con el mismo
  comando cuando haya voz.

### Tropiezos que conviene recordar

- **La cuota de voz es por pedido, no por dinero:** 50 pedidos al día para `gemini-2.5-pro-tts`, y
  se renueva sola. Una animación de pilar son 26 frases entre los dos idiomas.
- **La máquina se quedó sin memoria** con dos procesos en segundo plano (una búsqueda vieja y una
  corrida de pruebas); Claude Code los detuvo. Se cerraron los huérfanos y se retomó con permiso.
- **El servidor del usuario ocupaba el 3000** cuando tocaba probar: se le preguntó antes de
  detenerlo, y lo detuvo él.

### Archivos

- Historias: `stories/nutritionStory.ts`, `stories/movementStory.ts`, `stories/mindSpiritStory.ts`;
  `pillarStory.ts` (`soundtrackBase` opcional), `pillarStories.ts` (+ prueba),
  `PillarStoryAnimation.tsx`; textos en `pillarAnimations.{nutrition,movement,mindSpirit}`.
- Video: `social/films.ts` (`STORY_FILMS`), `app/[locale]/animaciones/video/page.tsx`;
  `render-video.mjs` (música de cada pilar).
- Invitación: `inviteRoutes.ts` (+ prueba), `invitacionPilares.feature` y `.spec.ts`.
- Pruebas: `animacionDelPilar.feature` y `.spec.ts` (slices 4–6).
- Recursos: 117 WebP (39 por pilar) y `pillar-{nutrition,movement,mind-spirit}.manifest.json`.
- Docs: roadmap (los tres guiones).

### Validación

- `pnpm run test:run`: **3204 pruebas** en verde y 3 omitidas a propósito (la pista de sonido de
  los tres pilares sin voz), en 300 archivos; `typecheck` sin errores y `lint` limpio (1322
  archivos).
- Playwright de las animaciones y de todas las páginas de pilar —11 archivos, **127 pruebas**, en
  9 tramos con `.next` borrado antes de cada uno y el 3000 libre—: **127/127** a la primera.
- Revisión en movimiento: un cuadro por subtítulo de cada una de las tres (39 cuadros, desde la
  página de render servida por el `next dev` del usuario): encuadres, franjas fuera, subtítulos y
  logo solo al cierre.

### Recap

Los cuatro pilares tienen su animación bajo el héroe de su página. Sueño va completa, con voz y
música; Alimentación, Movimiento y Mente y espíritu van con texto, con sus ilustraciones, su música
ya generada y tiempos estimados con la velocidad del narrador. La invitación a ver los cuatro
pilares ya no aparece en ninguna página de pilar.

### Próximos pasos (opciones)

1. **La voz de los tres** (programado para las 18:12, cuando se renueva la cuota): narrar por
   escena (~21 pedidos), medir y ajustar los tiempos, darles su pista de sonido y su prueba.
2. **Sus videos**, en vertical, cuadrado y horizontal, en cuanto tengan voz.
3. **Pendiente del usuario:** revisar los cuatro guiones en el roadmap; registrar en GA4 la
   dimensión `state`.
4. **Deuda:** `practicasPropias` sigue dejando publicaciones en la base compartida.

## 2026-09-30 — Slices 4, 5 y 6: la voz de Alimentación, Movimiento y Mente y espíritu

### Objetivo

El último paso de los tres pilares que llegaron con texto: narrarlos, medir cada subtítulo con su
voz, darles su pista de sonido en la web y su prueba, y exportar sus videos.

### Decisiones y por qué

- **Gemini 2.5 Flash TTS en vez de esperar a Pro.** La cuota de Pro no se renovó a la hora
  prevista: a las 18:12 dejó pasar cinco pedidos y luego pidió esperar 23 h 46 min. Alcanzaron para
  dos escenas de Mente y espíritu. El usuario eligió narrar ya con Flash, que tiene su propia
  cuota, con la misma voz (Algieba) y la misma dirección, sabiendo que puede sonar un poco
  distinto de Sueño y de la general.
- **Una animación, un modelo.** Las dos escenas de Mente y espíritu narradas con Pro se rehicieron
  con Flash, para que la voz no cambie a media pieza. Las tomas de Pro quedaron aparte
  (`out/narration/{alimentacion,mente}-pro/`) por si algún día se renarra con Pro.
- **Cada toma se revisa por su voz, no por su largo.** Flash entregó tomas de uno a cinco minutos y
  medio para una sola frase, una pista muda de 11 s y pausas de 1,5 s a media frase. `generate-narration.mjs` ahora mide
  la voz real de cada toma (entre 0,055 y 0,12 s por letra) y su pausa más larga a media frase (no
  más de 1,2 s); la que no cuadra se pide otra vez, hasta tres. También espera cuando topa con el
  límite por minuto (10 pedidos en Flash), en vez de cortar la corrida.
- **Tope de 120 s sin recortar texto.** Flash lee más lento que Pro: con sus primeras tomas,
  Alimentación medía 121,25 s y Movimiento unos 125 s. Se volvieron a narrar siete tomas —las
  cuatro más lentas y las tres defectuosas de Movimiento— y de cada par se quedó la más ágil que
  sonara bien.
  Quedan en **117,5 s** (Alimentación), **118,5 s** (Movimiento) y **117,25 s** (Mente y espíritu).
- **Su pista y su prueba.** Cada historia declara `soundtrackBase`, y la mezcla de la web (−16 LUFS,
  3 s de cola, su música propia debajo) queda en `public/animations/pilares/sonido-<pilar>-<idioma>.mp3`.
  El escenario `@future` de la voz pasa a un esquema real, con la pista de cada pilar en sus
  ejemplos; las tres pruebas unitarias que se saltaban sin voz ahora corren.

### Tropiezos que conviene recordar

- **La cuota de Pro no se renueva a una hora fija que se pueda programar.** El trabajo agendado para
  las 18:12 encontró solo cinco pedidos libres.
- **Flash casi nunca deja pausas claras entre párrafos**, así que narrar por escena le sirve poco:
  la mayoría de las escenas se narraron frase por frase.
- **La primera auditoría medía el largo de cada toma, no su voz**, y daba por buena una pista muda
  de 11 s. La revisión se rehizo midiendo la voz y las pausas, y así quedó en el script.

### Archivos

- Voz: `scripts/animations/generate-narration.mjs` (revisión de tomas, espera por minuto, nota de
  Flash).
- Historias: `stories/nutritionStory.ts`, `stories/movementStory.ts`, `stories/mindSpiritStory.ts`
  (tiempos medidos y `soundtrackBase`).
- Pistas: `public/animations/pilares/sonido-{alimentacion,movimiento,mente}-{es,en}.mp3`.
- Pruebas: `animacionDelPilar.feature` y `.spec.ts`.
- Docs: roadmap (la voz llegó) y la guía de sonido (Flash, su música, cómo bajar de 120 s).
- Sin versionar: `out/narration/{alimentacion,movimiento,mente}/` y los videos
  `out/videos/pilar-{alimentacion,movimiento,mente}-{vertical,cuadrado,horizontal}-es.mp4`.

### Validación

- `pnpm run test:run`: **3207/3207** en 300 archivos, ya sin omitidas; `typecheck` sin errores y
  `lint` limpio (1322 archivos).
- Auditoría de las 78 tomas finales (3 pilares × 13 frases × 2 idiomas): todas entre 0,058 y
  0,095 s de voz por letra, y ninguna pausa a media frase pasa de 1,01 s.
- Mezcla: las seis pistas a −16 LUFS, con picos entre −1,85 y −2,5 dBTP.
- Revisión en movimiento: un cuadro por subtítulo de cada una (39 cuadros, desde un `next dev`
  propio en el 3200 con el 3000 libre): subtítulos completos, ilustración de cada uno, etiqueta de
  la escena correcta y logo solo al cierre.
- Playwright de las animaciones y de todas las páginas de pilar —11 archivos, **130 pruebas**, en
  9 tramos con `.next` borrado antes de cada uno y el 3000 libre—: **130/130** a la primera. En el
  último tramo el servidor registró una vez «Failed to load external module pg-…» (Turbopack, con
  `.next` recién borrado), sin que fallara ninguna prueba.
- Videos: los tres de Alimentación (vertical, cuadrado y horizontal, en español) se exportaron
  antes de integrar. Los de Movimiento y Mente y espíritu se pausaron para correr las pruebas del
  navegador, porque comparten `.next`, y se retoman después de empujar a `dev`.

### Recap

Los cuatro pilares tienen su animación bajo el héroe de su página, con voz, música propia y botón de
sonido. Sueño y la general van con la voz de Pro; Alimentación, Movimiento y Mente y espíritu, con
la de Flash. Los videos de Sueño y de Alimentación están listos; los de Movimiento y Mente y
espíritu se están exportando.

### Próximos pasos (opciones)

1. **Escuchar las tres pistas o sus videos.** Si la voz de Flash desentona junto a Sueño, se pueden
   renarrar con Pro cuando su cuota lo permita (unos 10 pedidos por pilar narrando por escena) y
   volver a medir.
2. **Terminar los videos** de Movimiento y Mente y espíritu (seis, ya en marcha).
3. **Videos en inglés**, si se van a publicar: el mismo comando con `--idioma=en`.
4. **Pendiente del usuario:** revisar los cuatro guiones en el roadmap; registrar en GA4 la
   dimensión `state`. La animación con Veo (slice 9) sigue esperando su autorización.
5. **Deuda:** `practicasPropias` sigue dejando publicaciones en la base compartida.

## 2026-10-01 — Slices 4, 5 y 6: la voz de Pro para Alimentación, Movimiento y Mente y espíritu

### Objetivo

Volver a narrar los tres pilares con Gemini 2.5 Pro TTS, la voz de Sueño y de la animación general:
al usuario no le gustó cómo sonaban con Flash.

### Decisiones y por qué

- **Pro, aunque haya que esperar.** El usuario escuchó las tres pistas de Flash y no le gustaron;
  prefirió esperar a que se renovara la cuota de Pro (a las 00:00 UTC, las 18:00 aquí) antes que
  probar otro camino, y pidió dejar la voz de Flash en `dev` mientras tanto.
- **Solo se narró lo que faltaba.** Alimentación ya tenía con Pro 24 de sus 26 tomas y Mente y
  espíritu sus dos primeras escenas, guardadas aparte el día anterior. Faltaban dos frases de
  Alimentación, tres escenas de Mente y espíritu y Movimiento completo: unos 33 pedidos de los
  50 del día.
- **Los tiempos se vuelven a medir con Pro**, con la misma regla: 111 s (Alimentación), 110,75 s
  (Movimiento) y 107,5 s (Mente y espíritu), entre 6,5 y casi 10 s menos que con Flash, porque Pro
  lee más ágil.
- Las tomas de Flash quedan aparte, sin versionar, en `out/narration/<pilar>-flash/`.

### Tropiezos que conviene recordar

- **Una escena se quedó más de 5 minutos sin respuesta** y `fetch` se rindió
  (`UND_ERR_HEADERS_TIMEOUT`, la espera de Node). El script ahora vuelve a pedir en ese caso, hasta
  tres veces; al reintentar, salió a la primera.
- **Pro tampoco deja siempre pausas claras:** 5 de las 17 escenas no se dejaron cortar y se
  narraron frase por frase. Aun así cupo de sobra en la cuota del día.

### Archivos

- Historias: `stories/nutritionStory.ts`, `stories/movementStory.ts`, `stories/mindSpiritStory.ts`
  (tiempos medidos con Pro; su comentario ya no dice Flash).
- Pistas: `public/animations/pilares/sonido-{alimentacion,movimiento,mente}-{es,en}.mp3`, mezcladas
  de nuevo.
- Voz: `scripts/animations/generate-narration.mjs` (vuelve a pedir si el servicio no contesta en
  5 min; su nota sobre Flash).
- Docs: roadmap y guía de sonido (Flash no convenció; la voz final es Pro).
- Sin versionar: `out/narration/{alimentacion,movimiento,mente}/` y los nueve videos
  `out/videos/pilar-{alimentacion,movimiento,mente}-{vertical,cuadrado,horizontal}-es.mp4`.

### Validación

- `pnpm run test:run`: **3207/3207** en 300 archivos; `typecheck` sin errores y `lint` limpio (1322
  archivos).
- Auditoría de las 78 tomas: entre 0,056 y 0,087 s de voz por letra, y ninguna pausa a media frase
  pasa de 0,99 s.
- Mezcla: las seis pistas entre −16,05 y −16,11 LUFS, con picos entre −1,61 y −2,41 dBTP.
- Revisión en movimiento: un cuadro por subtítulo de cada una (39 cuadros, desde un `next dev`
  propio en el 3200 con el 3000 libre): subtítulos completos, ilustración de cada uno, etiqueta de
  la escena correcta y logo solo al cierre.
- Playwright de las animaciones y de todas las páginas de pilar —11 archivos, **130 pruebas**, en
  9 tramos con `.next` borrado antes de cada uno y el 3000 libre—: **130/130** a la primera. Terminó
  después de integrar a `dev`, porque el usuario pidió no esperarlo, y su resultado llegó en un
  commit aparte.
- Los nueve videos se vuelven a exportar con la voz de Pro después de este commit.

### Recap

Los cuatro pilares tienen su animación bajo el héroe de su página, todas con la voz de Pro
(Algieba), música propia y botón de sonido. En `dev` sigue la voz de Flash de los tres pilares
hasta que se empuje este cambio, y sus videos se están rehaciendo con la voz de Pro.

### Próximos pasos (opciones)

1. **Empujar a `dev`** cuando el usuario lo pida: reemplaza en el sitio la voz de Flash.
2. **Terminar los nueve videos** con la voz de Pro (en marcha).
3. **Videos en inglés**, si se van a publicar: el mismo comando con `--idioma=en`.
4. **Pendiente del usuario:** revisar los cuatro guiones en el roadmap; registrar en GA4 la
   dimensión `state`. La animación con Veo (slice 9) sigue esperando su autorización.
5. **Deuda:** `practicasPropias` sigue dejando publicaciones en la base compartida.
