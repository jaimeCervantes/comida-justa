Feature: Los listados de publicaciones se filtran por los cuatro pilares

  Context:
  - Problem: el home y las secciones que listan publicaciones se leen como listados de
    comida/productos, aunque el proyecto ya esta organizado alrededor de los 4 pilares.
  - Savings: menos confusion para visitantes; encuentran antes contenido no alimentario y no hay
    que explicar manualmente que Hazlo Sano no es solo catalogo de comida.
  - Why: refuerza el modelo central del sitio: Sueno, Alimentacion, Movimiento y Mente/Espiritu
    como las cuatro entradas principales al bienestar.

  As a visitante que recorre publicaciones
  I want elegir un pilar en los listados y en la busqueda del menu principal
  So that entienda que Hazlo Sano no es solo comida y vea publicaciones del tipo de bienestar que
  esta buscando sin perder el contexto de la seccion

  Background:
    Given the app is running with PostgreSQL as the database

  # ---------------------------------------------------------------------------
  # Slice 1 - listados publicos y busqueda del Header entienden los 4 pilares
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario Outline: El selector de pilares aparece en cada listado principal
    Given un visitante abre "<ruta>"
    When mira los filtros antes de las publicaciones
    Then ve la opcion "<todo>"
    And ve los cuatro pilares:
      | label             |
      | <sueno>           |
      | <alimentacion>    |
      | <movimiento>      |
      | <mente_espiritu>  |

    Examples: etiquetas y rutas por idioma
      | ruta       | todo | sueno | alimentacion | movimiento | mente_espiritu  |
      | /          | Todo | Sueno | Alimentacion | Movimiento | Mente/Espiritu  |
      | /productos | Todo | Sueno | Alimentacion | Movimiento | Mente/Espiritu  |
      | /buscar?q=ritual | Todo | Sueno | Alimentacion | Movimiento | Mente/Espiritu |
      | /en        | All  | Sleep | Nutrition    | Movement   | Mind/Spirit     |
      | /en/products | All | Sleep | Nutrition    | Movement   | Mind/Spirit     |
      | /en/search?q=ritual | All | Sleep | Nutrition | Movement   | Mind/Spirit     |

  @slice-1
  Scenario Outline: Elegir un pilar filtra la seccion activa y deja el estado en la URL
    Given la seccion "<ruta>" tiene una publicacion de "Movimiento" llamada "Caminata consciente"
    And la seccion "<ruta>" tiene una publicacion de "Alimentacion" llamada "Jugo verde"
    When el visitante abre "<ruta>"
    And elige el filtro "Movimiento"
    Then la URL contiene "pillar=movement"
    And el listado muestra "Caminata consciente"
    And el listado no muestra "Jugo verde"

    Examples: secciones publicas principales
      | ruta                    |
      | /                       |
      | /productos              |
      | /categoria/movimiento_y_ejercicio |
      | /buscar?q=caminar       |
      | /tienda/hazlo-sano      |
      | /u/comunidad-hazlo-sano |

  @slice-1
  Scenario: Volver a Todo restaura el feed cronologico
    Given el visitante esta en "/?pillar=movement"
    When elige el filtro "Todo"
    Then la URL ya no contiene un pilar activo
    And el feed vuelve a mostrar publicaciones de todos los pilares

  @slice-1
  Scenario: Cargar mas en el home conserva el pilar activo
    Given hay mas de una pagina de publicaciones de "Movimiento"
    And el visitante esta en "/?pillar=movement"
    When carga mas publicaciones
    Then las publicaciones nuevas tambien son de "Movimiento"
    And ninguna publicacion de "Alimentacion" entra al feed

  @slice-1
  Scenario: La paginacion tradicional conserva el pilar activo
    Given hay mas de una pagina de publicaciones de "Movimiento" en productos
    And el visitante esta en "/productos?pillar=movement"
    When abre la pagina siguiente
    Then sigue en productos con "pillar=movement"
    And las publicaciones nuevas tambien son de "Movimiento"

  @slice-1
  Scenario: La busqueda del Header busca dentro del pilar activo
    Given el visitante eligio el filtro "Sueno"
    And escribio "ritual" en el buscador del home
    When aparecen resultados en el menu principal
    Then el desplegable no muestra resultados de otros pilares
    And al activar "Ver todo" llega a la busqueda con "pillar=sleep"

  @slice-1 @component
  # Vitest: el estado vacio y la seleccion activa son contrato del componente compartido, no
  # requieren navegador completo.
  Scenario: Un pilar sin publicaciones no parece error
    Given el filtro "Mente/Espiritu" no tiene publicaciones
    When un listado renderiza el resultado filtrado
    Then muestra un estado vacio para "Mente/Espiritu"
    And conserva visible el selector de pilares

  # ---------------------------------------------------------------------------
  # Slice 2 - entradas editoriales hacia listados filtrados
  # ---------------------------------------------------------------------------

  @slice-2 @future
  Scenario: Un enlace de pilar aterriza en el home filtrado
    Given un visitante esta leyendo el pilar "Movimiento"
    When abre las publicaciones de ese pilar
    Then llega al home con "Movimiento" activo

  # ---------------------------------------------------------------------------
  # Slice 3 - listas contextuales pequeñas
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario: Una lista contextual solo gana filtro si no compite con su contexto
    Given un visitante esta leyendo el detalle de una publicacion
    When llega a las publicaciones relacionadas
    Then la seccion usa la decision documentada para listas contextuales
