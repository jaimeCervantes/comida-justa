# language: es
Característica: Una animación explica los pilares antes de pedir que se lean

  Contexto de negocio:
  - Problema: la gente no entiende qué son los cuatro pilares; hoy solo se explican con texto, y eso
    obliga a repetir la explicación por redes sociales.
  - Ahorro: menos explicaciones una a una; un material que explica el proyecto en menos de un minuto
    y que se puede compartir.
  - Por qué: captar gente nueva y reutilizar la misma animación como video para redes.

  Como alguien que llega por primera vez
  Quiero ver en dos minutos y medio qué son los cuatro pilares y por qué existen
  Para entender el proyecto sin leer cuatro artículos

  # ── Slice 1: la animación de los cuatro pilares en /pilares ──────────────────────────────────

  @slice-1
  Escenario: La primera visita a /pilares reproduce la animación sola
    Dado que nunca he visto la animación de los cuatro pilares
    Cuando abro "/pilares"
    Entonces la animación está debajo del héroe
    Y se está reproduciendo desde la escena 1 de 6

  @slice-1
  Escenario: Al volver no arranca sola, pero se puede ver otra vez
    Dado que ya vi la animación de los cuatro pilares
    Cuando abro "/pilares"
    Entonces la animación está quieta
    Y al pulsar "Ver animación" se reproduce desde la escena 1

  @slice-1
  Esquema del escenario: Las escenas recorren los cuatro pilares en su orden
    Dado que la animación de los cuatro pilares está en pausa
    Cuando avanzo hasta la escena <escena>
    Entonces la escena es del pilar "<pilar>"

    Ejemplos:
      | escena | pilar            |
      | 1      | ninguno          |
      | 2      | sueno            |
      | 3      | alimentacion     |
      | 4      | movimiento       |
      | 5      | mente-espiritu   |
      | 6      | ninguno          |

  @slice-1
  Escenario: Cada pilar se cuenta en tres tiempos
    Dado que la animación de los cuatro pilares está en la escena 2
    Cuando dejo que la escena se reproduzca entera
    Entonces veo tres subtítulos sucesivos: antes, lo que cambió y el regreso

  @slice-1
  Esquema del escenario: El logo abre y cierra la animación, y no aparece en medio
    Dado que la animación de los cuatro pilares está en pausa
    Cuando avanzo hasta la escena <escena>
    Entonces el logo de la marca <logo>

    Ejemplos:
      | escena | logo           |
      | 1      | se ve          |
      | 3      | no se ve       |
      | 6      | se ve          |

  @slice-1
  Escenario: Se puede pausar y retomar donde iba
    Dado que la animación de los cuatro pilares se está reproduciendo en la escena 2
    Cuando la pauso
    Entonces sigue en la escena 2 aunque pase el tiempo
    Y al reanudarla continúa desde la escena 2

  @slice-1
  Escenario: El cierre invita a elegir una práctica en la misma página
    Dado que la animación de los cuatro pilares llega a la escena 6
    Cuando pulso "Elegir mi práctica"
    Entonces llego a las tarjetas de los cuatro pilares de "/pilares"

  @slice-1
  Escenario: Con movimiento reducido no arranca sola y se lee como pasos
    Dado que mi sistema pide reducir el movimiento
    Y que nunca he visto la animación de los cuatro pilares
    Cuando abro "/pilares"
    Entonces la animación no se reproduce sola
    Y puedo leer las 6 escenas avanzando una a una

  # Cubierto por Vitest: es aritmética del guion, sin navegación.
  # Spec ejecutable junto a la función en src/presentation/habits/animations/.
  @slice-1 @component
  Esquema del escenario: El tiempo transcurrido decide la escena
    Dado un guion de escenas de 6000, 6000 y 8000 milisegundos
    Cuando han pasado <ms> milisegundos
    Entonces toca la escena <escena> con <progreso> de avance
    Y la animación <terminada>

    Ejemplos:
      | ms    | escena | progreso | terminada     |
      | 0     | 1      | 0        | no ha acabado |
      | 3000  | 1      | 0.5      | no ha acabado |
      | 6000  | 2      | 0        | no ha acabado |
      | 16000 | 3      | 0.5      | no ha acabado |
      | 20000 | 3      | 1        | ha acabado    |
      | 25000 | 3      | 1        | ha acabado    |

  @slice-1
  Esquema del escenario: Los subtítulos siguen el idioma de quien mira
    Dado que abro "<ruta>"
    Cuando la animación llega al último subtítulo de la escena 2
    Entonces el subtítulo termina en "<frase>"

    Ejemplos:
      | ruta             | frase                                                    |
      | /pilares         | Volver a dormir al ritmo de la luz, no al de las pantallas. |
      | /en/pillars      | Sleeping to the rhythm of light again, not of screens.   |

  # ── Slices futuros (esqueletos) ──────────────────────────────────────────────────────────────

  # El slice 2 (invitación en la primera visita y medición) tiene su propio par:
  # invitacionPilares.feature / invitacionPilares.spec.ts.

  @slice-3 @future
  Escenario: La primera visita a un pilar reproduce su propia animación
    Dado que nunca he visto la animación de "Sueño"
    Cuando abro "/pilares/sueno"
    Entonces su animación está debajo del héroe y se reproduce sola

  # Slice 7 — exportar a video. Es una herramienta, no una pantalla: la ejecuta el script
  # `scripts/animations/render-video.mjs` contra `/animaciones/video` (solo en desarrollo) y se
  # comprueba con `ffprobe` sobre el archivo. Las reglas de tiempo están cubiertas por Vitest
  # (`social/socialCuts.test.ts` y `social/captionFrame.test.ts`).
  @slice-7 @manual
  Esquema del escenario: Cada pieza se exporta a video para redes
    Dado el guion de los cuatro pilares
    Cuando exporto la pieza "<pieza>" en formato "<formato>"
    Entonces obtengo un MP4 H.264 de <ancho>×<alto> a 30 cuadros por segundo
    Y dura lo que su parte del guion más 3 s de cierre con el logo y la dirección del sitio

    Ejemplos:
      | pieza        | formato    | ancho | alto |
      | completo     | vertical   | 1080  | 1920 |
      | sueno        | vertical   | 1080  | 1920 |
      | alimentacion | cuadrado   | 1080  | 1080 |
      | completo     | horizontal | 1920  | 1080 |

  @slice-7 @component
  Esquema del escenario: Cada corte de pilar es exactamente la escena de su pilar
    Dado el corte "<pieza>"
    Entonces empieza donde empieza la escena de "<pilar>" y termina donde termina

    Ejemplos:
      | pieza        | pilar      |
      | sueno        | sleep      |
      | alimentacion | nutrition  |
      | movimiento   | movement   |
      | mente        | mindSpirit |

  @slice-7 @component
  Escenario: El subtítulo del video sale igual en cada exportación
    Dado un subtítulo con su frase clave marcada
    Cuando se dibuja en el mismo instante dos veces
    Entonces cada palabra y el subrayado están en el mismo punto

  # ── Slice 8: la narración y la música ────────────────────────────────────────────────────────
  # Una pista por idioma —la voz del narrador con música original debajo— alineada con el guion:
  # la escribe `scripts/animations/render-video.mjs --solo-sonido`. Los videos para redes llevan
  # la misma mezcla, y eso se comprueba con `ffprobe` sobre el archivo, como el resto del slice 7.

  @slice-8
  Escenario: El sonido nunca arranca solo, ni se descarga sin pedirlo
    Dado que nunca he visto la animación de los cuatro pilares
    Cuando abro "/pilares" y la animación se reproduce sola
    Entonces el sonido está apagado
    Y la pista de sonido no se ha descargado

  @slice-8
  Esquema del escenario: Al activar el sonido se oye la narración en el idioma de quien mira
    Dado que la animación de los cuatro pilares se reproduce en "<ruta>"
    Cuando activo el sonido
    Entonces suena la pista "<pista>"

    Ejemplos:
      | ruta        | pista                             |
      | /pilares    | /animations/pilares/sonido-es.mp3 |
      | /en/pillars | /animations/pilares/sonido-en.mp3 |

  @slice-8
  Escenario: El sonido va donde va la animación
    Dado que la animación de los cuatro pilares suena en la escena 1
    Cuando salto a la escena 2
    Entonces la narración salta al segundo 24, donde empieza la escena de Sueño
    Y al pausar la animación, calla

  @slice-8
  Escenario: Silenciar calla el sonido sin detener la animación
    Dado que la animación de los cuatro pilares suena
    Cuando pulso "Silenciar"
    Entonces la animación sigue reproduciéndose, en silencio

  @slice-8
  Escenario: Con movimiento reducido no hay sonido
    Dado que mi sistema pide reducir el movimiento
    Cuando abro "/pilares"
    Entonces no hay botón de sonido: la narración va al ritmo de la animación, y los pasos no lo tienen

  @slice-8
  Esquema del escenario: Encender y apagar el sonido queda medido
    Dado que el sitio mide con Google Analytics
    Cuando <acción> el sonido de la animación de "/pilares"
    Entonces se registra el evento "animation_sound" con el estado "<estado>"

    Ejemplos:
      | acción   | estado |
      | activo   | on     |
      | silencio | off    |
