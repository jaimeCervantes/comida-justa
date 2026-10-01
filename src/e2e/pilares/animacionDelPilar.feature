# language: es
Característica: Cada pilar se explica con su propia animación, bajo el héroe de su página

  Contexto de negocio:
  - Problema: quien llega a la página de un pilar —casi siempre desde un video en redes— encuentra
    un artículo largo, y la animación de los cuatro pilares solo cuenta cada uno en tres frases.
  - Ahorro: la historia completa del pilar (de dónde viene, qué nos cuesta, qué lo compensa y cómo
    empezar) en dos minutos, sin leer el artículo; y una pieza más para redes, sin grabar nada.
  - Por qué: que quien llega por un pilar entienda por qué importa y empiece su práctica esa misma
    noche.

  Como alguien que abre la página de Sueño por primera vez
  Quiero ver en dos minutos la historia de este pilar
  Para entender por qué importa y cómo empezar

  # ── Slice 3: la animación de Sueño en /pilares/sueno ─────────────────────────────────────────

  @slice-3
  Escenario: La primera visita a /pilares/sueno reproduce su animación, bajo el héroe
    Dado que nunca he visto la animación de Sueño
    Cuando abro "/pilares/sueno"
    Entonces la animación está entre el héroe y la práctica
    Y se está reproduciendo desde la escena 1 de 5

  @slice-3
  Escenario: Al volver no arranca sola, pero se puede ver otra vez
    Dado que ya vi la animación de Sueño
    Cuando abro "/pilares/sueno"
    Entonces la animación está quieta
    Y al pulsar "Ver animación" se reproduce desde la escena 1

  @slice-3
  Esquema del escenario: Se cuenta en cinco tiempos, todos del pilar de Sueño
    Dado que la animación de Sueño está en pausa
    Cuando avanzo hasta la escena <escena>
    Entonces la escena es del pilar "sleep" y su etiqueta dice "<etiqueta>"

    Ejemplos:
      | escena | etiqueta            | tiempo          |
      | 1      | El reloj de siempre | antes           |
      | 2      | La noche encendida  | lo que cambió   |
      | 3      | El costo oculto     | lo que cuesta   |
      | 4      | El contrapeso       | lo que compensa |
      | 5      | Tu versión mínima   | la práctica     |

  @slice-3
  Escenario: El cierre lleva a la práctica de la misma página
    Dado que la animación de Sueño llega a la escena 5
    Cuando pulso "Empezar la práctica"
    Entonces llego a la práctica "Del atardecer al amanecer" de "/pilares/sueno"

  @slice-3
  Esquema del escenario: Suena en el idioma de quien mira, y solo si se pide
    Dado que la animación de Sueño se reproduce en "<ruta>"
    Cuando activo el sonido
    Entonces suena la pista "<pista>"

    Ejemplos:
      | ruta              | pista                                   |
      | /pilares/sueno    | /animations/pilares/sonido-sueno-es.mp3 |
      | /en/pillars/sueno | /animations/pilares/sonido-sueno-en.mp3 |

  @slice-3
  Escenario: Se mide aparte de la animación de los cuatro pilares
    Dado que el sitio mide con Google Analytics
    Cuando la animación de Sueño arranca sola en "/pilares/sueno"
    Entonces se registra "animation_play" de la animación "pillar-sleep" desde "page"

  # La invitación a ver los cuatro pilares ya no aparece en /pilares/sueno: está en
  # invitacionPilares.feature, junto con el resto de las rutas donde no se invita.

  # Cubierto por Vitest (`stories/pillarStories.test.ts`): es la forma del guion, sin navegación.
  @slice-3 @component
  Escenario: El guion del pilar cabe en dos minutos y tiene una ilustración por subtítulo
    Dado el guion de la animación de Sueño
    Entonces dura dos minutos como mucho
    Y cada subtítulo tiene su ilustración, publicada en sus tres anchos, y su texto en español e inglés
    Y el logo solo cierra

  # ── Slices 4, 5 y 6: los otros tres pilares, con la plantilla de Sueño ──────────────────────
  # Primero llegaron con texto y la voz se agregó al final: con ella se midieron los tiempos de
  # cada subtítulo, se mezcló su pista y se exportaron sus videos.

  @slice-4 @slice-5 @slice-6
  Esquema del escenario: La primera visita a cada pilar reproduce su propia animación
    Dado que nunca he visto la animación de "<pilar>"
    Cuando abro "<ruta>"
    Entonces la animación está entre el héroe y la práctica y se reproduce sola

    Ejemplos:
      | pilar            | ruta                    |
      | Alimentación     | /pilares/alimentacion   |
      | Movimiento       | /pilares/movimiento     |
      | Mente y espíritu | /pilares/mente-espiritu |

  @slice-4 @slice-5 @slice-6
  Esquema del escenario: El cierre de cada pilar lleva a su práctica
    Dado que la animación de "<pilar>" llega a su última escena
    Cuando pulso "Empezar la práctica"
    Entonces llego a la práctica de "<ruta>"

    Ejemplos:
      | pilar            | ruta                    |
      | Alimentación     | /pilares/alimentacion   |
      | Movimiento       | /pilares/movimiento     |
      | Mente y espíritu | /pilares/mente-espiritu |

  @slice-4 @slice-5 @slice-6
  Esquema del escenario: Cada pilar suena con su propia pista, y solo si se pide
    Dado que la animación de "<pilar>" se reproduce en "<ruta>"
    Cuando activo el sonido
    Entonces suena la pista "<pista>"

    Ejemplos:
      | pilar            | ruta                    | pista                                          |
      | Alimentación     | /pilares/alimentacion   | /animations/pilares/sonido-alimentacion-es.mp3 |
      | Movimiento       | /pilares/movimiento     | /animations/pilares/sonido-movimiento-es.mp3   |
      | Mente y espíritu | /pilares/mente-espiritu | /animations/pilares/sonido-mente-es.mp3        |
