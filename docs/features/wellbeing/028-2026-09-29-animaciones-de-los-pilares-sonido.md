# Sonido de las animaciones de los pilares

> Acompaña al roadmap `028-2026-09-29-animaciones-de-los-pilares.md`. Aquí vive **cómo se hace** el
> sonido —la voz del narrador y la música—, para que las animaciones de cada pilar (slices 3–6)
> suenen igual que la de los cuatro pilares.

## Qué suena

- **El narrador:** Gemini TTS, modelo `gemini-2.5-pro-preview-tts`, voz **Algieba** (elegida por el
  usuario entre muestras de voces graves). La misma dirección delante de cada frase, con la forma
  «Say …:», para que el tono no cambie entre una y otra (está en `generate-narration.mjs`).
  - El acento sale **latinoamericano neutro**, no marcadamente mexicano: pedir «acento mexicano» no
    lo vuelve más regional. Si algún día se quiere un acento claramente mexicano, es locutor humano.
  - Gemini 3.8 Flash TTS no sirve para esto: lee la dirección en voz alta y no acepta instrucción
    de sistema («Developer instruction is not enabled for this model»).
  - **Gemini 2.5 Flash TTS no convenció.** Con él se narraron primero Alimentación, Movimiento y
    Mente y espíritu (`--modelo=gemini-2.5-flash-preview-tts`, misma voz y misma dirección), cuando
    la cuota diaria de Pro se agotó. Suena distinto y más lento, y a veces entrega tomas que no
    sirven —minutos de audio por una frase, una pista muda, una pausa de 1,5 s a media frase—. Al
    usuario no le gustó, y al día siguiente se volvieron a narrar con Pro. **La voz final es Pro**:
    si su cuota (50 pedidos al día, se renueva a las 00:00 UTC) se agota, se espera.
  - Cada animación se narra entera con un solo modelo, para que la voz no cambie a media pieza.
- **La música:** original, de **Lyria 3.5** (API de Interactions de Gemini), no de un catálogo. Para
  la general se generaron tres propuestas (`calida`, `folk`, `ambiental`) y va la **cálida**: piano
  de fieltro, cuerdas suaves, 78 BPM, re mayor. La de Sueño tiene la suya, **nocturna**: una canción
  de cuna que se vuelve amanecer, como su práctica «Del atardecer al amanecer». Alimentación,
  Movimiento y Mente y espíritu también tienen la suya: **cocina** (mercado y cocina familiar,
  guitarra de nailon y marimba), **caminata** (paso de caminata por el barrio) y **presencia**
  (calma y gente cerca, con un pulso lento como un latido). Se pide unos segundos más larga que
  la animación (170 s; salió de 163 s) y la mezcla **alinea su final con el final del video**: el
  cierre de la música es el cierre de la pieza.
  - El filtro de Lyria bloquea «Mexican folk» sin decir por qué; los instrumentos ya dan el color.
  - **Lyria mete voces si el prompt las evoca**, aunque se le pida instrumental. Con «documentary
    narrated by a male voice» puso a un hombre hablando en nocturna, cocina y caminata, y con
    «community… neighbours gathering» un coro en presencia: el usuario lo oyó en la web como un
    «ruido de voz de fondo» (2026-10-01). Ningún prompt nombra ya voces, narración ni gente, y
    `generate-music.mjs` escucha cada pieza con Gemini (`gemini-3.1-pro-preview`) antes de
    guardarla: la que trae voces se pide otra vez. Las cuatro se regeneraron; la cálida de la
    general no tenía voces.
  - Lleva la marca de agua SynthID de Google.

## El guion se mide con la voz

Cada subtítulo dura lo que tarda el narrador en decirlo —en el idioma más lento de los dos—, más
0,35 s de entrada (el subtítulo empieza a escribirse antes que la voz) y 0,65 s de respiro,
redondeado hacia arriba a cuartos de segundo. Con la voz, la animación pasó de 104 s a 152,5 s.

Si cambia un texto, se vuelve a narrar **esa frase** en los dos idiomas, se vuelve a medir, se
ajustan los tiempos en `pillarsOverviewScript.ts` y se vuelve a mezclar.

## Proceso

Todo con `GEMINI_API_KEY` (del entorno o de `.env.development`) y `ffmpeg`/`ffprobe` en el `PATH`.
Cada animación tiene un nombre corto que usan las carpetas y los scripts: `pilares` (la general),
`sueno`, `alimentacion`, `movimiento` y `mente`. Las pistas intermedias viven en `out/narration/<animación>/` y `out/music/` (no se
versionan, como los originales de las ilustraciones); **si se pierden, se regeneran, pero la voz sale
distinta y hay que volver a medir**. Lo que se publica en la web sí se versiona.

1. **Narrar** cada subtítulo, por idioma:
   `node scripts/animations/generate-narration.mjs --voz=Algieba --idioma=es --seccion=sleep --salida=out/narration/sueno/es`
   (y `--idioma=en`). `--seccion` es la animación dentro de `pillarAnimations` en el catálogo
   (`overview` por omisión). Una pista por subtítulo, `<escena>.b<n>.wav`, leída del catálogo sin
   las marcas `<hl>`. `--claves=cost.b2` rehace solo esa frase. Con `--por-escena` narra cada
   escena en un solo pedido y la corta en sus pausas; la escena que no se deja cortar va frase por
   frase. Cada toma se revisa: entre 0,055 y 0,12 s de voz por letra y ninguna pausa de más de
   1,2 s a media frase; la que no cuadra se pide otra vez, hasta tres. Si el servicio tarda más de
   5 min en contestar, también se vuelve a pedir.
2. **Preparar y medir:** `node scripts/animations/prepare-narration.mjs --origen=out/narration/sueno`
   quita los silencios de los bordes, acelera la voz un 7 % (el narrador sintético lee pausado; así
   suena natural sin cambiar el tono), deja las pistas en `<origen>/<idioma>-final/` e imprime la
   duración de cada subtítulo con la regla de arriba. Esos números van en el guion
   (`pillarsOverviewScript.ts` o la `PillarStory` del pilar). **Si la animación pasa de 120 s**,
   antes de recortar texto se vuelven a narrar sus tomas más lentas (`--claves`, a otra `--salida`)
   y se queda la más ágil de cada par que suene bien: así bajaron, con la voz de Flash, Alimentación
   (de 121,25 a 117,5 s) y Movimiento (de ~125 a 118,5 s). Con Pro no hizo falta.
3. **Música:** `node scripts/animations/generate-music.mjs --propuestas=nocturna --duracion=150`
   (unos segundos más de lo que dura la animación con su cierre). Cada pieza la escucha Gemini
   antes de guardarse, y la que trae voces se pide otra vez. El script de exportación sabe qué
   música va con cada animación.
4. **Mezclar para la web:** con un `next dev` levantado,
   `node scripts/animations/render-video.mjs --solo-sonido --animacion=sueno --idioma=es` (y `en`)
   escribe `public/animations/pilares/sonido-sueno-<idioma>.mp3` (`sonido-<idioma>.mp3` para la
   general): la pieza entera, con 3 s de cola para que la música cierre mientras aparece la
   invitación final.
5. **Videos:** el mismo `render-video.mjs` de siempre ya mezcla el sonido de cada pieza
   (`--animacion=sueno` para la de Sueño, que sale como `out/videos/pilar-sueno-<formato>-<idioma>.mp4`).
   Para cambiar solo el sonido de un video ya exportado, sin volver a grabar sus cuadros:
   `--resonorizar --pieza=sueno --formato=vertical`.

## La mezcla

- Cada frase entra en su subtítulo, 0,35 s después de que el subtítulo empieza.
- La música va 14 dB por debajo de como llega de Lyria y **se agacha sola cuando habla el
  narrador** (compresión con la voz como llave). La recuperación es lenta, 1,2 s: con 0,45 s la
  música subía en cada coma y se oía bombear; así solo respira en las pausas largas y entre
  escenas. Medido en la escena de Sueño, queda unos 15 dB debajo de la voz.
- Cada corte de pilar toma su ventana de la música de la pieza entera: el video de Sueño suena
  igual que Sueño dentro de la animación completa. Entrada de 1,5 s y salida de 3 s.
- Sonoridad de entrega: **−16 LUFS** integrados, picos por debajo de −1 dBTP. Se mide la mezcla y
  se le aplica una sola ganancia con un limitador que solo toca los picos; `loudnorm` en modo
  dinámico comprimía la voz sobre la marcha.
- Formatos: MP3 de 128 kbps para la web (lo reproduce cualquier navegador; 2,5 MB por idioma) y
  AAC de 192 kbps dentro de los MP4.

## En la web

- La pista es una por idioma y **sigue al reloj de la animación**: si se desvía más de 0,3 s, se
  corrige; al saltar de escena, salta; en pausa, calla.
- **Nunca suena sola** y ni se descarga hasta que alguien pulsa el botón de sonido
  (`preload="none"`). Safari solo deja sonar un audio pedido dentro del toque, así que el botón lo
  desbloquea en el mismo toque y a partir de ahí manda el reloj.
- Con movimiento reducido no hay botón de sonido: los pasos no tienen ritmo al que narrar.
- Encender y apagar queda medido en GA4 (`animation_sound`, con `state` = `on`/`off`).

## Lo que costó

Centavos: la narración de 17 frases en dos idiomas con Gemini TTS, más las muestras de voces, y
cuatro piezas de Lyria a 0,08 USD cada una (tres propuestas y la versión larga). La de Sueño: 13
frases en dos idiomas y una pieza de Lyria. Las otras tres: unos 85 pedidos a Flash TTS, contando
las tomas repetidas, que no se usaron; unos 33 a Pro el segundo día, más las tomas de Pro que ya se
tenían del primero (casi toda Alimentación y dos escenas de Mente y espíritu), y tres piezas de
Lyria (0,24 USD). Quitar las voces de la música costó cuatro piezas más (0,32 USD) y unas cuantas
escuchas de Gemini.
