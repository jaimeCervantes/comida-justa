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

  @slice-2 @future
  Scenario: Las acciones de una tarjeta caben en un renglón
    Given una publicación listada
    When un visitante la mira
    Then sus acciones se enseñan como iconos, cada uno con su nombre accesible completo

  @slice-2 @future
  Scenario: Compartir vive sobre la imagen
    Given una publicación listada con foto
    Then compartir se enseña encima de la imagen, con el pilar y el contador de archivos

  @slice-2 @future
  Scenario: Lo que solo puede hacer el dueño no compite con comprar
    Given quien publicó "Barra de Proteína Sabor Chocolate Naranja — Pieza individual"
    When ve su propia publicación en un listado
    Then editar, marcar agotado y guardar existencias están detrás de un menú
    And quien no es el dueño no encuentra ese menú

  @slice-3 @future
  Scenario Outline: Cada pantalla reparte las publicaciones en las columnas que le tocan
    Given un visitante en una ventana de <ancho> por <alto>
    When busca "proteína"
    Then las publicaciones se reparten en <columnas> columnas

    Examples:
      | ancho | alto | columnas | quién                 |
      | 390   | 844  | 2        | teléfono              |
      | 768   | 1024 | 3        | tableta               |
      | 1280  | 900  | 4        | escritorio            |

  @slice-3 @future
  Scenario: Cargar más no mueve lo que ya se estaba viendo
    Given un visitante que recorrió el home hasta el final de la primera página
    When pide más publicaciones
    Then las que ya estaban siguen donde estaban
