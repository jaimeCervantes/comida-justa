Feature: La búsqueda tiene un orden, y dice a qué distancia está

  Context:
  - Problem: cuando hay término de búsqueda, la consulta que saca los IDs no lleva `ORDER BY`
    (`PostgresSearchPostRepository.ts:28-39`). Se pagina cortando ese array en memoria y el
    `results.sort()` final solo restaura ese orden arbitrario. Dos búsquedas idénticas pueden
    repartir los mismos resultados distinto entre las páginas. El único caso ordenado es el que no
    es una búsqueda. Ningún spec lo cubría. Además es la única sección del sitio que no dice
    distancias, aunque su tarjeta ya tenga el hueco.
  - Savings: que dos búsquedas iguales den lo mismo, y que quien busca "pan" vea cuál le queda cerca
    sin abrir cada resultado.
  - Why: la cercanía es el argumento del sitio, y la búsqueda es donde alguien llega con una
    intención concreta. Es la peor sección para no poder confiar en el orden.

  As alguien que busca algo concreto
  I want que los resultados salgan en un orden que se entienda y que digan qué tan cerca están
  So that pueda decidir sin abrir uno por uno ni dudar de si la lista cambió sola

  Background:
    Given the app is running with PostgreSQL as the database
    And la tienda "Hazlo Sano" tiene su sucursal en el ancla de la comunidad

  # ---------------------------------------------------------------------------
  # Slice 1 — la búsqueda tiene un orden, y es la relevancia
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario: La misma búsqueda dos veces da el mismo orden
    Given publicaciones que coinciden con "pan"
    When busco "pan" dos veces seguidas
    Then las dos veces salen en el mismo orden

  @slice-1
  Scenario Outline: Lo que coincide en el título va antes que lo que solo coincide en el texto
    Given una publicación "<titulo>" cuyo texto dice "<contenido>"
    When busco "<termino>"
    Then sale en la posición <posicion>

    Examples:
      | titulo                 | contenido                        | termino | posicion | reason                      |
      | Pan de masa madre      | Hecho con harina integral        | pan     | 1        | coincide el título          |
      | Mermelada de zarzamora | Va muy bien con pan tostado      | pan     | 2        | solo coincide el contenido  |

  @slice-1
  Scenario: La paginación no repite ni se salta resultados
    Given 8 publicaciones que coinciden con el término
    When recorro la página 1 y la página 2
    Then veo las 8, cada una una sola vez

  @slice-1 @component
  # Vitest: es el contrato del repositorio, no hace falta navegador.
  Scenario: Sin resultados no se inventa nada
    Given ninguna publicación coincide con "xyzzy"
    When busco "xyzzy"
    Then el total es 0 y no hay resultados

  # ---------------------------------------------------------------------------
  # Slice 2 — la búsqueda dice a qué distancia está
  # ---------------------------------------------------------------------------

  @slice-2
  Scenario: Con ubicación, cada resultado dice a qué distancia está su tienda
    Given tengo una ubicación guardada a 2 km de la sucursal de "Panadería La Luz"
    And "Panadería La Luz" publicó "Pan de masa madre"
    When busco "pan"
    Then el resultado dice su distancia

  @slice-2
  Scenario: Sin ubicación no se inventa ninguna distancia
    Given no tengo ninguna ubicación guardada
    When busco "pan"
    Then ningún resultado dice distancia
    And siguen saliendo todos

  @slice-2
  Scenario: La distancia desempata dentro de un mismo nivel de relevancia
    Given dos publicaciones cuyo título coincide con "pan"
    And una es de una tienda a 2 km y la otra de una tienda a 120 km
    When busco "pan" con mi ubicación puesta
    Then la de 2 km sale antes que la de 120 km

  @slice-2
  Scenario: Pero la relevancia sigue mandando sobre la distancia
    Given una publicación lejana cuyo título coincide con "pan"
    And una publicación cercana donde "pan" solo aparece en el texto
    When busco "pan" con mi ubicación puesta
    Then la lejana sale antes, porque su título es el que coincide

  @slice-2
  Scenario: Nada desaparece nunca por quedar lejos
    Given una publicación de una tienda a 900 km de mí
    When busco su título exacto
    Then sale igual, con su distancia
