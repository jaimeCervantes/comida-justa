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

  # ── Slices futuros (esqueletos) ──────────────────────────────────────────────────────────────

  @slice-4 @future
  Escenario: La primera visita a /pilares/alimentacion reproduce su propia animación
    Dado que nunca he visto la animación de Alimentación
    Cuando abro "/pilares/alimentacion"
    Entonces su animación está bajo el héroe y se reproduce sola

  @slice-5 @future
  Escenario: La primera visita a /pilares/movimiento reproduce su propia animación
    Dado que nunca he visto la animación de Movimiento
    Cuando abro "/pilares/movimiento"
    Entonces su animación está bajo el héroe y se reproduce sola

  @slice-6 @future
  Escenario: La primera visita a /pilares/mente-espiritu reproduce su propia animación
    Dado que nunca he visto la animación de Mente y espíritu
    Cuando abro "/pilares/mente-espiritu"
    Entonces su animación está bajo el héroe y se reproduce sola
