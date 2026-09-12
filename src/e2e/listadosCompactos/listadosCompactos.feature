Feature: Listados compactos

  Context:
  - Problem: en el teléfono el panel de facetas de la búsqueda mide unos 360 px de alto y hay que
    recorrerlo entero antes de ver el primer resultado; en escritorio se lleva 264 px de ancho y
    deja las tarjetas en 306 px para un contenido que no llena ni la mitad del renglón.
  - Savings: el primer resultado visible sin desplazarse en móvil, el doble de publicaciones por
    pantalla en escritorio (3 → 4 columnas) y en móvil (1 → 2), y una tarjeta más corta porque tres
    renglones de botones se vuelven uno.
  - Why: el sitio vive de que alguien reconozca lo que hay cerca; cuantas más publicaciones entran
    en una pantalla sin encoger la foto, más corto es el camino entre abrir y reconocer.

  As a visitante que busca comida de verdad cerca
  I want to ver los filtros y varias publicaciones sin recorrer media pantalla
  So that puedo reconocer lo que me sirve sin desplazarme

  # Los términos son reales del catálogo consultado el 2026-09-10: «proteína» devuelve más de 25
  # publicaciones, todas de Alimentación y sub-categoría «abarrotes», entre $27 y $1569. Nada de
  # esto lo siembra la suite: los escenarios afirman relaciones —qué está encima de qué, qué mide
  # lo mismo que qué—, no cuentas que suben cuando alguien publica.

  @slice-1
  Scenario: Los filtros se leen antes que los resultados, no a su lado
    Given un visitante que busca "proteína"
    When se pinta la página de resultados en una ventana de escritorio
    Then las facetas terminan por encima de la primera publicación
    And la primera publicación empieza en el mismo margen izquierdo que las facetas

  @slice-1
  Scenario: Y en el teléfono los filtros caben en un renglón
    Given un visitante en una ventana de 390 por 844
    When busca "proteína"
    Then los cuatro pilares se enseñan en el mismo renglón
    And la primera publicación se ve sin desplazarse

  # Lo que las facetas HACEN no cambia con la mudanza —contar por pilar, decir el cero, filtrar,
  # viajar en la dirección, y callarse cuando no hay término—, y ya está cubierto entero por
  # `busquedaFacetada.spec.ts`. Ese spec localiza por `data-testid`, así que tiene que pasar SIN
  # editarlo: si hay que tocarlo, se rompió una promesa de verdad. No se duplica aquí: un mismo
  # comportamiento con dos pruebas es una que se queda desfasada.

  @slice-2
  Scenario: Las acciones de una tarjeta caben en un renglón
    Given un visitante que busca "proteína"
    When mira la primera publicación de la lista
    Then juntar al carrito y apoyar se enseñan en el mismo renglón
    And cada una se alcanza por su nombre completo, aunque no enseñe texto

  @slice-2
  Scenario: Compartir se alcanza sin bajar hasta la firma
    Given un visitante que busca "proteína"
    When mira la primera publicación de la lista
    Then compartir queda por encima del título, sobre la imagen

  @slice-2
  Scenario: Lo que solo puede hacer el dueño cabe en el mismo renglón
    Given quien publicó "E2E Barra de Proteína del listado"
    When ve su propia publicación en un listado
    Then editar y marcar agotado se enseñan como iconos, en la misma fila que juntar al carrito
    And quien solo mira no los encuentra

  # El campo de existencias es la excepción, y por eso queda un menú: es un campo de texto con su
  # botón de guardar, no un icono, y en una columna de 136px partiría la fila en tres. Lo prueba
  # `inventory/existenciasEnLaTarjeta.spec.ts`.
  #
  # Y que agotar desde la tarjeta agote en todas partes lo cubre
  # `localProducers/cardControls.spec.ts`, donde ese comportamiento vive desde su slice 7. No se
  # duplica aquí: dos pruebas para una promesa son una que se queda desfasada.

  # El «tiene icono» se prueba con Vitest y no con Playwright: es una propiedad del componente, no
  # de un recorrido, y levantar un navegador para mirar si hay un `svg` dentro de un botón cuesta
  # cien veces más que renderizarlo.
  @slice-2 @component
  Scenario Outline: Ningún botón se queda sin icono
    Given <componente> ya renderizado
    Then el botón "<botón>" enseña un icono junto a su texto

    Examples:
      | componente          | botón                | dónde                        |
      | OwnerControls       | Marcar agotado       | la ficha de la publicación   |
      | CardOwnerControls   | Marcar agotado       | el menú de la tarjeta        |
      | StockControl        | Guardar existencias  | las dos                      |

  @slice-3
  Scenario Outline: El listado reparte en las columnas que le quepan, nunca más de cuatro
    Given un visitante en una ventana de <ancho> por <alto>
    When busca "proteína"
    Then las publicaciones se reparten en <columnas> columnas

    Examples:
      | ancho | alto | columnas | quién                        |
      | 390   | 844  | 1        | teléfono de pie              |
      | 844   | 390  | 3        | el mismo teléfono, girado    |
      | 768   | 1024 | 3        | tableta                      |
      | 1280  | 900  | 4        | escritorio                   |
      | 2400  | 900  | 4        | pantalla enorme, sigue en 4  |

  # Que ensanchar nunca **quite** columnas —la propiedad que de verdad protege la frontera— se prueba
  # con Vitest sobre `columnsFor`, recorriendo todos los anchos de 200 a 2400 de cuatro en cuatro.
  # Un navegador no puede afirmar eso: tendría que abrir seiscientas ventanas.
  @slice-3 @component
  Scenario: Ensanchar nunca quita columnas

  # Y que cargar más no mueva lo ya visto lo prueba `MasonryColumns.test.tsx` sobre el reparto puro,
  # que es donde vive la propiedad: colocar la tarjeta diez no puede cambiar dónde quedaron las nueve
  # anteriores. Es de antes de este slice y sigue en pie.
  @slice-3 @component
  Scenario: Cargar más no mueve lo que ya se estaba viendo
