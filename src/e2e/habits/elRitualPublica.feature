Feature: El ritual del pilar publica

  Context:
  - Problem: completar el ritual de un pilar no deja huella social en ninguna parte. El avance queda
    en el jardín y en las celebraciones, que son un objeto aparte con su propia tabla de reacciones,
    mientras el feed sigue enseñando solo cosas que se venden. El 2026-09-07 la base compartida tenía
    0 publicaciones de tipo practica.
  - Savings: un solo objeto social que mantener en vez de dos, y reconocimiento para quien practica
    donde la comunidad ya mira.
  - Why: si una practica es una publicacion, el ritual de cada pilar —la practica mas guiada del
    producto— tiene que serlo tambien.

  As a persona que practica, por el ritual de un pilar o por el catalogo
  I want to que cada practica que marco quede publicada en el feed
  So that la comunidad vea acciones sanas reales y no solo cosas en venta

  @slice-1
  Scenario: Completar el dia del ritual publica en el feed
    Given Jaime lleva el ritual "Presencia, paz y conexion local" del pilar "Mente y espiritu"
    When marca el dia como completo desde "/pilares/mente-espiritu"
    Then el home muestra una publicacion suya de practica
    And la publicacion nombra el ritual "Presencia, paz y conexion local"
    And no ofrece comprar, agendar ni pedir por WhatsApp

  # @component: el panel retira el dia de las fechas disponibles en cuanto queda contado, asi que
  # desde el navegador no hay forma de marcarlo dos veces. La regla que evita la segunda publicacion
  # si el intento llega por otro camino vive en `publishesRitualPractice`, con su prueba de unidad.
  @slice-1 @component
  Scenario: Volver a marcar el mismo dia no duplica la publicacion
    Given Jaime ya marco hoy el ritual "Presencia, paz y conexion local"
    When el mismo dia se vuelve a registrar
    Then el ritual lo reconoce como duplicado y no publica otra vez

  # @component: la publicacion del ritual es un post como cualquier otro, y que cualquier post
  # ofrezca apoyo ya lo prueban los tests de CardForList y PostDetail del slice 4 de `010`. Un
  # escenario de navegador aqui repetiria ese mecanismo con otro disfraz.
  @slice-1 @component
  Scenario: La publicacion del ritual recibe apoyo como cualquier otra
    Given Jaime marco el dia de su ritual y su publicacion esta en el feed
    When alguien con sesion reacciona con apoyo a esa publicacion
    Then la publicacion muestra 1 apoyo

  @slice-1 @component
  Scenario Outline: Cada ritual publica en la categoria de su pilar
    Given alguien completa el dia del ritual "<ritual>"
    Then su publicacion queda en la categoria "<categoria>"
    And su slug identifica a esa persona, ese ritual y ese dia

    Examples:
      | ritual                      | categoria              |
      | sleep-evening-to-morning-v1 | sueno_y_descanso       |
      | nutrition-one-plant-v1      | alimentacion           |
      | movement-two-minutes-v1     | movimiento_y_ejercicio |
      | mind-one-connection-v1      | mente_y_espiritu       |

  @slice-1 @component
  Scenario Outline: Solo una repeticion nueva publica
    Given el ritual reconoce el marcado como "<reconocimiento>"
    Then la publicacion "<publica>"

    Examples: se publica — hubo repeticion nueva
      | reconocimiento | publica |
      | first          | nace    |
      | repeat         | nace    |
      | comeback       | nace    |
      | final          | nace    |

    Examples: no se publica — el dia ya estaba contado
      | reconocimiento | publica |
      | duplicate      | no nace |

  @slice-2
  Scenario: Marcar una practica del catalogo tambien publica
    Given Jaime lleva la practica "La descarga mental" del pilar "Sueño"
    When la marca como hecha desde "/practicas"
    Then el home muestra una publicacion suya de "Practique La descarga mental"

  @slice-2 @component
  Scenario: La misma practica marcada dos veces el mismo dia deja una publicacion
    Given Jaime ya marco hoy "La descarga mental"
    When se vuelve a marcar el mismo dia
    Then el slug coincide con el de la primera y no nace una segunda publicacion

  @slice-2
  Scenario: Dos practicas distintas del mismo pilar el mismo dia dan dos publicaciones
    Given Jaime marco "La descarga mental" hoy, del pilar "Sueño"
    When marca tambien "Penumbra total", del mismo pilar y el mismo dia
    Then el feed recibe dos publicaciones, una por cada practica
    And el jardin sigue contando un solo dia de ese pilar

  @slice-2 @component
  Scenario Outline: Una practica sin evidencia lleva la portada de su pilar
    Given una publicacion de practica sin foto en la categoria "<categoria>"
    Then su portada nombra el pilar "<pilar>"
    And no muestra el recuadro de "Publicacion sin imagen"

    Examples:
      | categoria              | pilar           |
      | sueno_y_descanso       | Sueño           |
      | alimentacion           | Alimentacion    |
      | movimiento_y_ejercicio | Movimiento      |
      | mente_y_espiritu       | Mente/Espiritu  |

  @slice-2 @component
  Scenario: Un producto sin foto no estrena portada de pilar
    Given una publicacion de producto sin foto
    Then conserva el recuadro de "Publicacion sin imagen"

  @slice-4 @future
  Scenario: Quien publica su practica puede retirarla
    Given Jaime marco el dia y su publicacion esta en el feed
    When retira esa publicacion
    Then deja de aparecer en el home
    And su avance del ritual no cambia

  @slice-3 @future
  Scenario: Marcar permite adjuntar evidencia, sin obligarla
    Given Jaime va a marcar el dia de su ritual o una practica
    When agrega una foto antes de marcar
    Then su publicacion usa esa foto en vez de la portada del pilar

  @slice-5 @future
  Scenario: El apoyo de una celebracion vive en un solo contador
    Given una celebracion con apoyos recibidos antes de la unificacion
    When alguien mira el jardin y la publicacion
    Then las dos superficies enseñan el mismo contador de apoyo

  @slice-6 @future
  Scenario: El home elige a quien enseñar cada practica
    Given hay muchas publicaciones de practica de gente distinta
    When alguien abre el home
    Then ve primero las de quienes sigue o las afines a lo que suele buscar
