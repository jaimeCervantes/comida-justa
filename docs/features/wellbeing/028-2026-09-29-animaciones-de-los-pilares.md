# Animaciones de los pilares

> Roadmap de slices. La bitácora vivirá en `028-2026-09-29-animaciones-de-los-pilares-bitacora.md`.
> Escenarios: `src/e2e/pilares/animacionesPilares.feature`.

## Alineación

- **Problema:** la gente no entiende qué son los cuatro pilares. Hoy se explican solo con texto
  (`/pilares` y el artículo de cada pilar), y eso obliga a repetir la explicación por redes sociales.
- **Ahorro:** menos explicaciones una a una por redes; un material fácil de compartir que explica el
  proyecto en menos de un minuto.
- **Por qué:** captar gente nueva, y reutilizar la misma animación como video (primero sin voz,
  después con voz) para redes sociales y como material en la web.

## Decisiones de modelo

1. **El texto fuera del cuadro; el cuadro, dibujado.** Los subtítulos salen de `next-intl` y viven
   fuera del escenario, así que la animación existe en español e inglés sin volver a producir nada.
   Lo que se ve en el escenario empezó como SVG + CSS sin dependencias; en el slice 1b pasó a SVG
   animado con **GSAP** (línea de tiempo por escena, gobernada por el reloj del guion) porque el
   usuario pidió un acabado moderno, y el siguiente paso es sustituir los dibujos por ilustraciones
   3D generadas (ver la bitácora). Video o Lottie obligarían a rehacer el archivo por idioma.
2. **Cada escena es una función del tiempo.** Una animación es un guion: lista de escenas con su
   duración, su pilar y su clave de texto. Qué escena toca y cuánto lleva recorrida se calcula con
   una función pura (`sceneAt(guion, ms)`). Eso es lo que permite, en un slice posterior, exportar
   el mismo guion a video cuadro por cuadro —con Remotion o con una captura de Playwright— y
   sincronizar la voz escena por escena, sin reescribir las escenas.
3. **Nunca una ventana que tape la página.** La animación vive dentro de la página. En la primera
   visita arranca sola; después queda quieta con un botón «Ver animación» para repetirla. Una
   ventana emergente al entrar interrumpe, empeora la carga y el SEO, y se cierra sin leer.
4. **«Ya la vi» se guarda en el navegador** (`localStorage`, envuelto en `try/catch`: sin
   almacenamiento, simplemente no arranca sola). Guardarlo en la cuenta pediría una migración en
   `bot-whatsapp`; no hace falta para el objetivo, que es la gente **nueva**, sin cuenta.
5. **Movimiento reducido se respeta.** Con `prefers-reduced-motion` no arranca sola y las escenas se
   leen como pasos fijos, con los mismos textos.
6. **Los subtítulos son texto real**, no pintado: los lee un lector de pantalla, los indexa un
   buscador y, cuando llegue la voz, son el guion de la locución.
7. **Dónde vive el código:** el reproductor y el guion son vocabulario del vertical (pilares), así
   que van en `src/presentation/habits/animations/`, junto a `PillarHero`, y la lógica de tiempo en
   una función pura sin React. No toca `src/domain/` del núcleo ni el esquema.
8. **El logo abre y cierra, y no habla.** Se usa `public/logo.webp` (el corazón con hojas, ya
   publicado) tal cual: aparece con el gancho y vuelve junto a «Elegir mi práctica». Se descartó
   convertirlo en un narrador animado: el logo es una imagen 3D, no un vector por partes, y un
   personaje fotorrealista entre ilustraciones planas se ve pegado encima.
9. **La voz llega después.** Voz de hombre, mexicana, grave. Se añade cuando el guion visual esté
   validado: grabar sobre un guion que todavía cambia es pagar la locución dos veces.

## Guion de la animación de los cuatro pilares (≈ 90 s) — para revisar

### Por qué más largo, y hasta dónde

La primera versión (≈ 35 s) decía **qué** es cada pilar, pero no **por qué** existe. Sin el
antecedente, «dormir al ritmo de la luz» suena a consejo más; con él, se entiende como algo que se
perdió y se puede recuperar. Eso es lo que la gente no entiende hoy.

Límite: **≈ 90 s**. Es el techo cómodo de Reels y TikTok y lo que alguien que acaba de llegar está
dispuesto a mirar. La historia completa de cada pilar (costos ocultos, puentes, práctica) es para su
propia animación (slices 3–6), que puede durar 1½–2 min porque quien la ve ya eligió ese pilar.

### El arco emocional

Cada pilar se cuenta en **tres tiempos**, siempre los mismos, para que a partir del segundo pilar el
espectador ya sepa leer la estructura y solo reciba contenido nuevo:

1. **Antes** — nostalgia y pertenencia: una imagen sensorial concreta de cómo vivía el cuerpo.
2. **Lo que cambió** — reconocimiento: el quiebre histórico, contado para que la persona piense «eso
   me pasa a mí». Sin datos alarmistas ni culpa.
3. **El regreso** — esperanza y agencia: la frase del pilar, como algo que se recupera, no que se
   impone.

Tres decisiones de psicología que atraviesan todo el guion:

- **Gancho en los primeros 3 segundos.** En redes se decide ahí si se sigue mirando: un contraste
  inesperado (un cuerpo antiguo en un mundo nuevo) abre una pregunta que el resto contesta.
- **Alivio antes que miedo.** «No es un fallo tuyo: es un desajuste» quita la culpa. La culpa hace
  que la gente cierre el video; el alivio hace que se quede y que lo comparta.
- **Cerrar con un paso mínimo.** Pedir «cambia tu vida» paraliza; pedir «una práctica que quepa hoy»
  es alcanzable (autoeficacia). Coincide con el tono del producto, que no promete formar hábitos.

Cada tiempo es un **subtítulo** dentro de su escena: los controles avanzan por escena (6), y dentro
de cada una los subtítulos se suceden solos.

### Guion

| # | Escena | Tiempo | Texto en pantalla (es) | Imagen |
|---|--------|--------|------------------------|--------|
| 1 | Gancho | — | *(logo)* Tu cuerpo se formó durante cientos de miles de años. El mundo en el que vive cambió en poco más de un siglo. | Una línea de tiempo larguísima que se comprime de golpe en su último tramo |
|   |        | — | Por eso a veces te sientes sin energía, con la cabeza llena o lejos de los demás. No es un fallo tuyo: es un desajuste. | Una silueta que se encoge un poco, y luego se relaja |
|   |        | — | Hay cuatro pilares para volver a acomodarlo. | Cuatro columnas que se levantan, una de cada color |
| 2 | Sueño (1) | Antes | Durante miles de años, el sol fue nuestro reloj. Al oscurecer, el cuerpo sabía que era hora de descansar. | Sol que baja, fogata, cielo estrellado |
|   |        | Cambio | En 1879, la bombilla de Edison hizo que la noche dejara de ser oscura. Hoy la pantalla nos sigue hasta la almohada, y el cuerpo ya no sabe cuándo es de noche. | Se enciende un foco; luego un teléfono ilumina una almohada |
|   |        | Regreso | Sol en la cara al despertar, luz baja al anochecer. Volver a dormir al ritmo de la luz, no al de las pantallas. | La pantalla se apaga; amanece |
| 3 | Alimentación (2) | Antes | Tus abuelos comían lo que daba la tierra cerca de casa, en su temporada, y conocían a quien lo sembraba. | Milpa, mercado, manos que entregan |
|   |        | Cambio | Después de la guerra se buscó producir mucho y barato. La comida empezó a viajar miles de kilómetros envuelta en plástico, pensada para durar, no para nutrir. | Un camión y un barco sobre un mapa; paquetes que se apilan |
|   |        | Regreso | Volver a la comida real, de temporada, de quien la cultiva cerca. | Un brote que crece hasta un plato |
| 4 | Movimiento (3) | Antes | Moverse no era ejercicio: era caminar al campo, cargar, sembrar, jugar. Era vivir. | Figura que camina y carga bajo el sol |
|   |        | Cambio | Las fábricas y luego las oficinas nos sentaron ocho, diez, doce horas bajo techo. Hoy hasta dos cuadras las hacemos con motor. | Techo que baja, silla, un coche para una distancia mínima |
|   |        | Regreso | Recuperar el cuerpo en la calle, el sendero y la cancha del barrio. | Un camino que se dibuja bajo los pies |
| 5 | Mente y espíritu (4) | Antes | Nunca vivimos solos. La comunidad, el ritual y el silencio de la naturaleza nos sostenían. | Círculo de personas alrededor del fuego |
|   |        | Cambio | Hoy estamos conectados con miles de personas… y muchas veces no sabemos el nombre de quien vive al lado. | Muchos puntos en una pantalla; una puerta vecina cerrada |
|   |        | Regreso | Recuperar el silencio, la presencia y a la gente que vive cerca. | Un círculo que respira y otros que se le acercan |
| 6 | Cierre | — | Los cuatro se sostienen entre sí: moverte de día llama al sueño de noche; una mesa sin pantallas alimenta el cuerpo y la mente. | Las cuatro columnas se unen bajo un techo |
|   |        | — | No tienes que cambiar tu vida entera. Empieza hoy con una práctica mínima. | Logo · botón «Elegir mi práctica» |

≈ 270 palabras: unos 90 s leyendo en pantalla, y el mismo largo con locución a ritmo pausado
(slice 8). Todas las afirmaciones salen de las páginas de cada pilar y de su bibliografía; no se
introduce ningún dato nuevo.

## Slices

### Slice 1 — La animación de los cuatro pilares en `/pilares`

- Reproductor bajo el héroe de `/pilares` con el guion de 6 escenas y sus 17 subtítulos.
- Controles: reproducir/pausar, anterior/siguiente, volver a ver. Indicador de escena (6 puntos).
- Primera visita: arranca sola. Visitas siguientes: quieta, con «Ver animación».
- Movimiento reducido: no arranca sola; escenas como pasos fijos.
- El cierre lleva a `#practicas`.
- Español e inglés.
- **Aceptación:** los escenarios `@slice-1` en verde (Playwright + Vitest), `test:run`,
  `typecheck` y `lint` limpios.

### Slice 2 — Invitación en la primera visita a cualquier página

- La primera vez que alguien entra al sitio, por cualquier página, ve una invitación discreta (no
  tapa el contenido): «¿Qué son los cuatro pilares? Míralo en minuto y medio».
- Al aceptarla se reproduce la animación de los cuatro pilares sin salir de la página; al cerrarla o
  al verla, no vuelve a aparecer.
- No aparece en `/pilares` (ahí ya está la animación) ni en flujos de compra/pago.

### Slice 3 — Animación de Sueño bajo el héroe de `/pilares/sueno`

- Plantilla para los otros tres: mismo reproductor, guion propio (~5 escenas, más detalle que la
  general).
- Arranca sola la primera vez que se abre **ese** pilar.

### Slices 4, 5 y 6 — Alimentación, Movimiento, Mente y espíritu

- Un guion por pilar sobre la plantilla del slice 3.

### Slice 7 — Exportar a video para redes

- Formato vertical (1080×1920) y cuadrado (1080×1080) desde el mismo guion.
- Se decide ahí entre Remotion (licencia gratuita para equipos pequeños) y captura con Playwright.

### Slice 8 — Voz

- Locución de hombre mexicano, voz grave, sincronizada por escena. Se decide ahí entre locutor
  humano y voz sintética `es-MX`. Los subtítulos se quedan.
- Botón de silencio; el sonido nunca arranca solo en la web (los navegadores lo bloquean y molesta).
