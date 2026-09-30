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
- **La música:** original, de **Lyria 3.5** (API de Interactions de Gemini), no de un catálogo. Para
  la general se generaron tres propuestas (`calida`, `folk`, `ambiental`) y va la **cálida**: piano
  de fieltro, cuerdas suaves, 78 BPM, re mayor. La de Sueño tiene la suya, **nocturna**: una canción
  de cuna que se vuelve amanecer, como su práctica «Del atardecer al amanecer». Se pide unos segundos más larga que la animación (170 s; salió
  de 163 s) y la mezcla **alinea su final con el final del video**: el cierre de la música es el
  cierre de la pieza.
  - El filtro de Lyria bloquea «Mexican folk» sin decir por qué; los instrumentos ya dan el color.
  - Lleva la marca de agua SynthID de Google.

## El guion se mide con la voz

Cada subtítulo dura lo que tarda el narrador en decirlo —en el idioma más lento de los dos—, más
0,35 s de entrada (el subtítulo empieza a escribirse antes que la voz) y 0,65 s de respiro,
redondeado hacia arriba a cuartos de segundo. Con la voz, la animación pasó de 104 s a 152,5 s.

Si cambia un texto, se vuelve a narrar **esa frase** en los dos idiomas, se vuelve a medir, se
ajustan los tiempos en `pillarsOverviewScript.ts` y se vuelve a mezclar.

## Proceso

Todo con `GEMINI_API_KEY` (del entorno o de `.env.development`) y `ffmpeg`/`ffprobe` en el `PATH`.
Cada animación tiene un nombre corto que usan las carpetas y los scripts: `pilares` (la general) y
`sueno`. Las pistas intermedias viven en `out/narration/<animación>/` y `out/music/` (no se
versionan, como los originales de las ilustraciones); **si se pierden, se regeneran, pero la voz sale
distinta y hay que volver a medir**. Lo que se publica en la web sí se versiona.

1. **Narrar** cada subtítulo, por idioma:
   `node scripts/animations/generate-narration.mjs --voz=Algieba --idioma=es --seccion=sleep --salida=out/narration/sueno/es`
   (y `--idioma=en`). `--seccion` es la animación dentro de `pillarAnimations` en el catálogo
   (`overview` por omisión). Una pista por subtítulo, `<escena>.b<n>.wav`, leída del catálogo sin
   las marcas `<hl>`. `--claves=cost.b2` rehace solo esa frase.
2. **Preparar y medir:** `node scripts/animations/prepare-narration.mjs --origen=out/narration/sueno`
   quita los silencios de los bordes, acelera la voz un 7 % (el narrador sintético lee pausado; así
   suena natural sin cambiar el tono), deja las pistas en `<origen>/<idioma>-final/` e imprime la
   duración de cada subtítulo con la regla de arriba. Esos números van en el guion
   (`pillarsOverviewScript.ts` o la `PillarStory` del pilar).
3. **Música:** `node scripts/animations/generate-music.mjs --propuestas=nocturna --duracion=150`
   (unos segundos más de lo que dura la animación con su cierre). El script de exportación sabe qué
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
frases en dos idiomas y una pieza de Lyria.
