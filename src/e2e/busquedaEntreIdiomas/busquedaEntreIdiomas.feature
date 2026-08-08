Feature: Buscar en un idioma y encontrar en el otro

  Context:
  - Problem: quien navega en español y escribe "bread" no encuentra ninguno de los tres panes del
    catálogo, aunque los tres tienen su fila `en` con "Sourdough Bread" en el título. La consulta
    filtra `t.locale IN (locale, fallbackLocale)` (`PostgresSearchPostRepository.ts:194`) y en
    español los dos son `es`, así que las filas inglesas ni entran. El rescate semántico tampoco
    llega: medido contra la base, "bread" se queda a 0.450 del pan más cercano y el umbral es 0.40.
    Aparte, `SearchBar.tsx:78` no manda el idioma en su petición y `route.ts:22` cae a "es", así que
    el desplegable busca en español incluso navegando en inglés.
  - Savings: producto real a la venta que hoy devuelve una caja vacía, y un embedding de Gemini
    pagado por cada búsqueda que iba a fallar de todos modos.
  - Why: el sitio se lee en dos idiomas y sus visitantes no son monolingües. Un catálogo mexicano
    leído en inglés está lleno de nombres que nadie traduce, y de cosas que se buscan en inglés
    aunque el producto se llame en español.

  As alguien que busca comida en el idioma que le sale
  I want encontrar el producto aunque lo haya nombrado en el otro idioma del sitio
  So that no me vaya con las manos vacías de algo que sí está a la venta

  Background:
    Given the app is running with PostgreSQL as the database
    And la publicación de prueba tiene su traducción en los dos idiomas

  # ---------------------------------------------------------------------------
  # Slice 1 — la búsqueda mira todas las traducciones
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario Outline: El término encuentra la publicación aunque esté en el otro idioma
    Given una publicación titulada "<titulo_es>" en español y "<titulo_en>" en inglés
    When busco "<termino>" navegando en "<interfaz>"
    Then la publicación sale entre los resultados
    And se ve con su título en "<interfaz>"

    Examples: el idioma de la interfaz no limita lo que se puede encontrar
      | titulo_es           | titulo_en             | termino    | interfaz | reason                        |
      | Pan de masa madre   | Sourdough bread       | bread      | es       | término inglés, interfaz es   |
      | Pan de masa madre   | Sourdough bread       | pan        | en       | término español, interfaz en  |
      | Pan de masa madre   | Sourdough bread       | pan        | es       | el caso de siempre, intacto   |
      | Pan de masa madre   | Sourdough bread       | bread      | en       | el caso de siempre, intacto   |

  @slice-1
  Scenario: Lo que coincide en tu idioma va antes que lo que solo coincide en el otro
    Given una publicación cuyo título en español lleva el término
    And otra cuyo término solo aparece en su traducción inglesa
    When busco ese término navegando en español
    Then la que coincide en español sale primero

  @slice-1
  Scenario: Una publicación que coincide en sus dos idiomas sale una sola vez
    Given una publicación cuyo término aparece en la fila española y en la inglesa
    When busco ese término
    Then sale una vez, y el total la cuenta una vez

  # `baking` → `bake` con el diccionario inglés, y se queda en `baking` con el español. Si el
  # escenario pasa, la fila inglesa se analizó en inglés pese a que quien busca está en español.
  @slice-1
  Scenario: Cada fila se analiza con el diccionario de su propio idioma
    Given una publicación cuya traducción inglesa dice "baking"
    When busco "bake" navegando en español
    Then sale igual, porque la fila inglesa se lematizó en inglés

  @slice-1
  Scenario: Un disparate sigue sin devolver nada
    Given ninguna publicación menciona "zzyzxqq"
    When busco "zzyzxqq" en cualquier idioma
    Then no sale ningún resultado

  # ---------------------------------------------------------------------------
  # Slice 2 — el desplegable busca en el idioma en el que estás
  # ---------------------------------------------------------------------------

  @slice-2 @component
  # Vitest: es el contrato de la petición que hace el componente, no hace falta navegador.
  Scenario Outline: El desplegable dice en qué idioma se está buscando
    Given la barra de búsqueda renderizada en "<interfaz>"
    When escribo un término
    Then la petición a /api/search lleva "locale=<interfaz>"

    Examples:
      | interfaz |
      | es       |
      | en       |

  @slice-2 @component
  # Vitest: `resolveLocale` es una función pura del routing; probarla en navegador no añade nada.
  Scenario Outline: Un idioma desconocido en el parámetro cae al español, no llega a la consulta
    When la ruta recibe locale "<parametro>"
    Then busca en "<usado>"

    Examples:
      | parametro | usado | reason                        |
      | en        | en    | idioma soportado              |
      | es        | es    | idioma soportado              |
      | fr        | es    | no está en routing.locales    |
      |           | es    | no vino el parámetro          |
