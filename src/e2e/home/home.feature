Feature: La portada dice de qué va el sitio

  Context:
  - Problem: desde el commit 8b4d9bf el home abre directamente en el feed: quien llega por primera
    vez ve tarjetas sueltas y ninguna frase que explique qué es esto ni qué puede hacer. El titular
    de portada tampoco existía como tamaño —`--fs-display` se añadió en el slice 10 y no lo consumía
    nadie—, así que Newsreader se descargaba en cada visita sin pintarse en un solo píxel.
  - Savings: la primera visita deja de depender de adivinar. Y las dos acciones del sitio —mirar lo
    que hay y publicar lo tuyo— dejan de estar solo en el header, donde compiten con el buscador.
  - Why: Hazlo Sano vende comida de manos que conoces. Una portada que empieza en la cuadrícula de
    productos se parece a cualquier catálogo; con voz propia se parece a su comunidad.

  As alguien que llega al sitio por primera vez
  I want entender qué es esto y por dónde entrar antes de ver el catálogo
  So that no tenga que deducirlo de las tarjetas

  # ---------------------------------------------------------------------------
  # Slice 1 — La portada del 5.2  (actual)
  #
  # El canvas ilustra el rótulo con «Xalapa · 34 productores activos». En la base hay 2 tiendas y
  # el ancla está en Tezonapa, Veracruz, así que el contador de productores no entra: lo que sí se
  # sabe —y ya viene contado por la consulta del feed— es cuántas publicaciones hay delante.
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario: El home se presenta antes de enseñar el catálogo
    Given que abro "/"
    Then leo un titular de portada, en la serif de la marca
    And leo el rótulo "Tezonapa, Veracruz" con las publicaciones que hay
    And el feed de abajo se presenta como "Recién publicado"

  @slice-1
  Scenario Outline: Las dos acciones del sitio son enlaces, no botones
    Given que abro "/"
    When miro la portada
    Then "<cta>" es un enlace a "<destino>"

    Examples: un CTA de portada se abre en pestaña nueva, se copia y lo sigue un rastreador
      | cta                | destino     |
      | Ver lo que hay hoy | /productos  |
      | Publicar lo mío    | /publicar   |

  @slice-1
  Scenario: El titular de portada se pinta al tamaño de portada
    Given que abro "/"
    When mido el titular
    Then su tamaño es el del token de portada, no el del cuerpo
    And se pinta con la serif de la marca

  @slice-1 @component
  # Vitest: es el plural del rótulo con el catálogo real, sin navegador.
  Scenario Outline: El rótulo cuenta lo que hay, y no lo que el canvas inventó
    Given un feed con <cuantas> publicaciones
    When se pinta la portada
    Then el rótulo dice "<texto>"

    Examples:
      | cuantas | texto                      |
      | 31      | 31 publicaciones           |
      | 1       | 1 publicación              |
      | 0       | sin publicaciones todavía  |
