Feature: El inicio invita a practicar despues de contar lo que la comunidad lleva hecho

  Context:
  - Problem: el jardin cuenta las repeticiones compartidas de los cuatro pilares, pero el inicio no
    ofrece ninguna puerta para aportar la propia. Quien ve los canteros entiende que hay actividad
    colectiva y se queda sin saber por donde se entra a ella.
  - Savings: se ahorra el rodeo por el menu —hoy la unica via desde el inicio hacia Pilares— en el
    momento exacto en que la persona esta mirando el dato que la motiva.
  - Why: el jardin solo crece con repeticiones reales y voluntarias. Si la portada mide la practica
    de la comunidad pero no invita a practicar, mide algo que no ayuda a que ocurra.

  As a persona que llega al inicio y ve el jardin de la comunidad
  I want una puerta clara para hacer hoy una practica
  So that mi repeticion sume al jardin en vez de quedarme mirando el numero de los demas

  @slice-1
  Scenario Outline: La invitacion lleva al hub de los cuatro pilares en el idioma activo
    Given un visitante en el inicio "<inicio>"
    When activa la invitacion "<enlace>"
    Then llega a "<destino>"
    And encuentra "<encabezado>" en la pagina de los pilares

    Examples: la ruta se traduce, la invitacion tambien
      | inicio | enlace              | destino      | encabezado                    |
      | /      | Elegir mi practica  | /pilares     | Los 4 Pilares de Hazlo Sano   |
      | /en    | Choose my practice  | /en/pillars  | The 4 Pillars of Hazlo Sano   |

  @slice-1
  Scenario: La invitacion se lee entre la actividad de la comunidad y el feed
    Given un visitante en el inicio "/"
    When recorre la portada de arriba hacia abajo
    Then ve la invitacion despues del jardin de los cuatro pilares
    And la ve despues de las celebraciones de la comunidad
    And la ve antes del feed de publicaciones

  @slice-1 @component
  # Vitest y no Playwright: es una afirmacion sobre el marcado que produce el componente, no sobre
  # un recorrido. El inicio ya tiene su h1 en el hero y el jardin y las celebraciones son h2.
  Scenario: El encabezado de la invitacion es hermano de las otras secciones
    Given la invitacion renderizada
    When se inspecciona su encabezado
    Then es un encabezado de nivel 2
    And su texto y el del enlace salen del catalogo, no del componente

  @slice-1 @component
  Scenario: La invitacion no depende de que el jardin tenga repeticiones
    Given la invitacion renderizada sin datos de comunidad
    When se comprueba lo que recibe
    Then no recibe ninguna prop con conteos del jardin
    And se muestra igual el dia que la comunidad empieza en cero

  @slice-2 @future
  Scenario Outline: Un atajo lleva directo al pilar que ya se eligio
    Given un visitante en el inicio
    When activa el atajo "<pilar>"
    Then llega a "<destino>" sin pasar por el hub

    Examples: los cuatro pilares
      | pilar          | destino                  |
      | Sueño          | /pilares/sueno           |
      | Alimentacion   | /pilares/alimentacion    |
      | Movimiento     | /pilares/movimiento      |
      | Mente/Espiritu | /pilares/mente-espiritu  |
