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
   animado con **GSAP** (línea de tiempo por escena, gobernada por el reloj del guion), y en el 1c
   a **ilustraciones 3D de arcilla generadas con Gemini**, animadas con la misma línea de tiempo:
   cámara, fundidos y efectos encima de la imagen. Cómo se hacen:
   `028-2026-09-29-animaciones-de-los-pilares-ilustraciones.md`. Video o Lottie obligarían a rehacer
   el archivo por idioma.
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
8. **El logo cierra, y no habla.** Se usa `public/logo.webp` (el corazón con hojas, ya publicado)
   tal cual: aparece junto a «Elegir mi práctica», con confeti. Se descartó convertirlo en un
   narrador animado: el logo es una imagen 3D, no un vector por partes, y un personaje
   fotorrealista entre ilustraciones planas se ve pegado encima.
   *Hasta el 2026-09-30 también abría* (en el centro, y luego a la esquina superior derecha). Se
   quitó a pedido del usuario: la cabecera del sitio y la del video ya lo llevan arriba a la
   izquierda, y dos logos a la vez sobraban. Vale para todas las animaciones.
9. **La voz llega después.** Voz de hombre, mexicana, grave. Se añade cuando el guion visual esté
   validado: grabar sobre un guion que todavía cambia es pagar la locución dos veces.
   *Llegó en el slice 8:* voz sintética (Gemini TTS, voz Algieba) con música original de Lyria
   debajo; **el guion pasó a medirse con la voz** (cada subtítulo dura lo que tarda el narrador en
   decirlo, más su respiro), y el sonido nunca arranca solo. Cómo se hace:
   `028-2026-09-29-animaciones-de-los-pilares-sonido.md`.

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
| 1 | Gancho | — | *(logo)* Tu cuerpo se formó durante cientos de miles de años. El mundo en el que vives cambió en poco más de un siglo. | Una línea de tiempo larguísima que se comprime de golpe en su último tramo |
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

**Orden acordado el 2026-09-29** (tras ver la animación ilustrada): 1 → **2** → **7** → 3–6 según
lo que digan los datos del slice 2 → 8 → 9 solo con autorización expresa del usuario. Razón: con
pocos visitantes, el canal para llegar a gente nueva son las redes; antes de construir cuatro
animaciones más hay que medir si la general se ve y lleva a elegir práctica, y exportar a video lo
que ya existe cuesta casi nada.

**El slice 8 se adelantó el mismo día**, a petición del usuario, antes de los 3–6: los videos para
redes ya estaban listos y sin voz eran la mitad de la pieza.

**Los slices 3–6 se empezaron el 2026-09-30**, también a petición del usuario («haz las animaciones
para cada pilar, empieza con el sueño y descanso»), sin esperar los datos de GA4.

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
- **Medición** (añadida al reordenar): eventos de Google Analytics 4, que el sitio ya carga en
  producción — invitación mostrada, aceptada y descartada; reproducción (y cómo arrancó); escena
  alcanzada; animación completa; clic en «Elegir mi práctica». Con eso se decide si construir las
  animaciones de cada pilar.

### Slice 3 — Animación de Sueño bajo el héroe de `/pilares/sueno` (hecho)

- **La plantilla de los otros tres.** Cada pilar se cuenta en cinco tiempos, siempre en este orden:
  cómo era antes, qué cambió, qué nos cuesta, qué lo compensa y la versión mínima de su práctica.
  Es el arco de la animación general (antes, lo que cambió, el regreso) más el costo y la práctica,
  que allí no caben. Dos minutos como mucho: quien la ve ya eligió ese pilar.
- **Una animación es un dato** (`PillarStory`: guion, ilustraciones, textos y colores). El
  reproductor, la exportación a video y la mezcla de sonido son los mismos para todas. Un pilar
  nuevo es un archivo de datos, sus textos, sus ilustraciones y su narración.
- Va entre el héroe y el artículo; arranca sola la primera vez que se abre **esa** página y su final
  lleva a la práctica de la misma página. Narración, música propia y botón de sonido, como la
  general. También sale en video para redes (vertical, cuadrado y horizontal).
- **La invitación a ver los cuatro pilares ya no aparece en una página de pilar con animación
  propia:** competiría con ella, y con el sonido encendido se oirían las dos.

#### Guion de Sueño (1:56 con la voz)

Todo sale de la página del pilar; ningún dato nuevo. Entre corchetes, la frase clave.

| Tiempo | Etiqueta | Texto (es) |
|---|---|---|
| Antes | El reloj de siempre | Durante cientos de miles de años, [la luz decidió cuándo dormíamos]. El sol se iba, el fuego se apagaba y la noche era oscura de verdad. |
| | | En la oscuridad, el cuerpo soltaba [melatonina]: la señal de reparar. Ese reloj [sigue dentro de ti]. |
| Lo que cambió | La noche encendida | En [1879], la bombilla le quitó la oscuridad a la noche. Hoy la pantalla nos sigue hasta la almohada. |
| | | La luz brillante de noche frena la melatonina: [tu cerebro cree que sigue siendo mediodía]. |
| Lo que cuesta | El costo oculto | Eso se paga tres veces. [El sueño se rompe]: duermes las mismas horas y descansas menos. |
| | | [La deuda crece]: el cansancio se tapa con café por la mañana, y ese café estorba la noche siguiente. |
| | | Y la noche del barrio [ya no oscurece del todo], ni para ti ni para las aves. |
| Lo que compensa | El contrapeso | No hace falta comprar nada: [es el pilar más barato]. Casi todo consiste en apagar cosas. |
| | | Un cuarto [oscuro, fresco y sin teléfono] le recuerda a tu cerebro para qué es la cama. |
| | | Y cinco minutos con una libreta: [anotar lo pendiente de mañana] ayuda a que la cabeza lo suelte. |
| La práctica | Tu versión mínima | Tu versión mínima tiene dos anclas. [Cerrar la noche]: una hora antes de dormir, pantallas lejos y luz baja. |
| | | Y [abrir la mañana]: de diez a quince minutos de luz natural afuera, al despertar. Esa luz programa tu sueño de esta noche. |
| | | No tiene que ser perfecto. [Empieza esta noche.] *(logo · «Empezar la práctica»)* |

### Slices 4, 5 y 6 — Alimentación, Movimiento, Mente y espíritu

- Un guion por pilar sobre la plantilla del slice 3: sus cinco tiempos con lo que ya dice su
  página, 13 ilustraciones, música propia y su `PillarStory`. Como el de Sueño, se escribieron y
  produjeron sin que el usuario los revisara antes: están aquí para eso.
- **Primero con texto, la voz al final** (lo propuso el usuario el 2026-09-30, cuando la cuota
  diaria de voz se agotó a media producción). Sin voz, cada subtítulo dura lo que tardaría el
  narrador según la velocidad a la que ya lee Algieba (84 frases medidas, más 0,25 s de margen);
  al narrar se miden de verdad y se ajustan, y entonces llegan el botón de sonido y los videos.
- **La voz llegó primero con Gemini 2.5 Flash TTS** (2026-09-30), porque la cuota de Pro no se
  renovó a tiempo. Al usuario no le gustó, y el 2026-10-01 se narraron con Pro, la voz de Sueño y de
  la general. Con los tiempos medidos duran 111 s (Alimentación), 110,75 s (Movimiento) y 107,5 s
  (Mente y espíritu). Cómo se hizo: `028-2026-09-29-animaciones-de-los-pilares-sonido.md`.
- La invitación a ver los cuatro pilares ya no aparece en ninguna página de pilar: todas tienen
  su propia animación.

#### Guion de Alimentación

| Tiempo | Etiqueta | Texto (es) |
|---|---|---|
| Antes | Lo que daba la tierra | Durante generaciones comimos [lo que daba la tierra] cerca de casa: maíz, frijol y calabaza, cada cosa en su temporada. |
|  |  | Se cocinaba en casa y [se conocía a quien la sembraba]. |
| Lo que cambió | La cadena global | Después de la guerra se buscó producir [muchas calorías baratas] y moverlas lejos: harinas blancas, aceites refinados y azúcar en todo. |
|  |  | Dejamos de comer comida y empezamos a comer [productos hechos para aguantar el viaje], no para nutrir. |
| Lo que cuesta | El costo oculto | Ese viaje se paga tres veces, y [ninguna viene en la etiqueta]. Primero, miles de kilómetros por cada ingrediente. |
|  |  | Después, [toneladas de plástico] que solo sirven para que la comida sobreviva al trayecto. |
|  |  | Y lo que se pudre en el camino, más semanas en [cámaras frías] para cuidar algo que ya perdió sus nutrientes. |
| Lo que compensa | El contrapeso | El contrapeso es [la temporada y la cercanía]: lo cosechado maduro llega con sus vitaminas y sin empaque. |
|  |  | Y tu dinero [se queda con quien lo cultivó], a unos kilómetros de tu mesa. |
|  |  | Cocinar limpio también cuenta: vapor, caldo casero o unas gotas de aceite de aguacate, [sin aceites refinados]. |
| La práctica | El mínimo que cuenta | El mínimo que cuenta tiene dos anclas. [Cenar al atardecer], para que la digestión termine antes de dormir. |
|  |  | Y [servir la triada]: medio plato de vegetales de temporada, un cuarto de proteína, un cuarto de carbohidrato de tu región y algo de grasa sana. |
|  |  | Sin contar calorías. [Empieza con tu próxima cena.] *(logo · «Empezar la práctica»)* |

#### Guion de Movimiento

| Tiempo | Etiqueta | Texto (es) |
|---|---|---|
| Antes | Moverse era vivir | Durante casi toda la historia, moverse no era ejercicio: era [caminar al campo, cargar, sembrar y jugar]. |
|  |  | Nadie tenía que proponérselo: [moverse era sobrevivir], al aire libre y bajo el sol. |
| Lo que cambió | La silla y la pantalla | Las fábricas y luego las oficinas nos llevaron bajo techo, y [nos sentaron ocho, diez, doce horas] frente a una tarea o una pantalla. |
|  |  | Las máquinas hicieron el esfuerzo por nosotros, y llegó algo nuevo en la historia: [el sedentarismo]. |
| Lo que cuesta | El costo oculto | Y nos siguió hasta la puerta de casa: [hasta dos cuadras las hacemos con motor]. Eso se paga tres veces. |
|  |  | En gasolina, por un viaje que cabía a pie, y en [el aire y el ruido de tu propia calle], donde juegan los niños del barrio. |
|  |  | Y en el cuerpo: [menos pasos sin proponértelo], que son justo los que sostienen tu metabolismo. |
| Lo que compensa | El contrapeso | El contrapeso es tu barrio: [caminar o pedalear los trayectos cortos], y usar los senderos, parques y canchas de la zona. |
|  |  | No hace falta cambiar de vida: [hace falta dejar de motorizar lo que cabía a pie]. |
|  |  | Y darle trabajo al pie: pasto, tierra y senderos [despiertan el equilibrio] a cada paso. |
| La práctica | El mínimo que cuenta | El mínimo que cuenta tiene dos anclas. [Moverte sin motor]: un trayecto corto a pie o en bici, como tu cuerpo pueda. |
|  |  | Y [dos minutos de pie] por cada cincuenta de silla: sentadillas, talones, cadera. |
|  |  | Los puntos cuentan días, no kilómetros. [Empieza con tu próximo mandado.] *(logo · «Empezar la práctica»)* |

#### Guion de Mente y espíritu

| Tiempo | Etiqueta | Texto (es) |
|---|---|---|
| Antes | Nunca vivimos solos | Durante casi toda la historia, [nunca vivimos solos]. La soledad era un peligro de muerte. |
|  |  | Nos sostenían [la comunidad, el ritual y el silencio de la naturaleza], y las historias alrededor del fuego. |
| Lo que cambió | De la aldea a la pantalla | Pasamos de la aldea, donde todos se conocían, a la ciudad anónima, y luego a [miles de contactos en una pantalla]. |
|  |  | Tu cerebro sigue esperando [mirar a los ojos a alguien], y recibe likes en lugar de abrazos. |
| Lo que cuesta | El costo oculto | Estar siempre disponible se paga tres veces. [La saturación]: una cabeza en alerta todo el día, que ya no se queda en una sola cosa. |
|  |  | [El desarraigo]: sabes lo que pasa a diez mil kilómetros y no reconoces a quien vive al lado. |
|  |  | Y [la soledad acompañada]: cientos de contactos, y nadie a quién llamar un martes cualquiera. |
| Lo que compensa | El contrapeso | El contrapeso no es desconectarse del mundo: es que [el mundo deje de estar encima] todo el día. |
|  |  | Ventanas de silencio: [la primera hora, la mesa y la última hora], sin teléfono. |
|  |  | Y salir a respirar: [diez minutos al aire libre], con los pies en la tierra y la luz en la cara. |
| La práctica | El mínimo que cuenta | El mínimo que cuenta tiene dos anclas. [Abrir el día sin pantalla]: la primera media hora, sin redes ni noticias. |
|  |  | Y [presencia con alguien]: escuchar de verdad a una persona, de preferencia cara a cara. |
|  |  | Empieza por quien vive cerca. [Hoy mismo.] *(logo · «Empezar la práctica»)* |

### Slice 7 — Exportar a video para redes (va después del 2)

- La animación completa y un corte por pilar (cada escena de pilar dura 16–22 s): cinco videos sin
  generar una sola imagen nueva, con los subtítulos incrustados y música libre de derechos.
- Formato vertical (1080×1920) y cuadrado (1080×1080) desde el mismo guion: el reloj se puede llevar
  a cualquier instante, así que se graba cuadro por cuadro. También horizontal (1920×1080) para
  YouTube y la web.
- Un comando por pieza: `node scripts/animations/render-video.mjs --pieza=sueno --formato=vertical`
  (con un `next dev` levantado). Desde el slice 8 el mismo comando mezcla la narración y la música.

### Slice 8 — Voz y música (hecho, adelantado)

- Locución de hombre, voz grave, en español e inglés, sintética: Gemini TTS con la voz **Algieba**,
  elegida por el usuario entre muestras. El acento sale latinoamericano neutro, no marcadamente
  mexicano. Los subtítulos se quedan.
- **Música original** de Lyria (elegida frente a pistas libres de derechos), una pieza de ~2:43
  cuyo final cae en el final de la animación. Se agacha sola mientras habla el narrador.
- **El guion se mide con la voz:** cada subtítulo dura lo que tarda el narrador (el más lento de
  los dos idiomas) más 1 s de margen. La animación pasó de 104 s a 152,5 s.
- **En la web**, botón de sonido apagado por omisión: el sonido nunca arranca solo (los navegadores
  lo bloquean y molesta) y la pista ni se descarga hasta que alguien lo pide. Una pista MP3 por
  idioma que sigue al reloj de la animación: salta con ella, calla en pausa.
- **En los videos**, la misma mezcla, en AAC, en las once piezas del slice 7.
- Con movimiento reducido no hay sonido: la narración va al ritmo de la animación y los pasos no
  tienen ritmo. (Posible mejora: una frase por paso.)

### Slice 9 — Clips con Veo 3.1 (solo con autorización expresa del usuario)

- Convertir las ilustraciones en clips con movimiento real de personajes, para redes. Tiene costo
  apreciable (decenas de dólares) y no se inicia sin que el usuario lo autorice.
