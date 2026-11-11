Feature: Un solo conjunto de filtros para todos los listados

  Context:
  - Problem: cada listado tiene filtros distintos; una categoría mezcla lo agotado con lo que sí se
    puede pedir y no hay forma de esconderlo, aunque la búsqueda sí la tiene.
  - Savings: quien aprende un filtro en una pantalla lo encuentra igual en la siguiente; no se abren
    fichas que no se pueden comprar; una sola barra en vez de tres copias que ya divergieron.
  - Why: el catálogo tiene seis puertas de entrada y deberían comportarse como una.

  As a comprador
  I want to los mismos filtros —pilar, solo con existencia, en promoción— en cada listado
  So that lo que veo sea lo que busco, llegue por donde llegue

  Background:
    Given la categoría "salsas_y_aderezos" con estos productos
      | título                   | piezas |
      | Salsa macha de cacahuate | 8      |
      | Aderezo de chipotle      | 0      |

  @slice-1
  Scenario: En una categoría, el filtro deja fuera lo agotado
    When abro "/categoria/salsas_y_aderezos" y enciendo "Solo con existencia"
    Then veo "Salsa macha de cacahuate"
    And no veo "Aderezo de chipotle"
    And la dirección lleva "disponibles=1"

  @slice-1
  Scenario: Apagar el filtro vuelve a enseñar todo
    Given abrí "/categoria/salsas_y_aderezos?disponibles=1"
    When apago "Solo con existencia"
    Then veo "Salsa macha de cacahuate" y "Aderezo de chipotle"

  @slice-1
  Scenario: Cambiar de pilar no suelta el filtro
    Given abrí "/categoria/salsas_y_aderezos?disponibles=1"
    When elijo el pilar "Alimentación"
    Then la dirección lleva "disponibles=1" y "pillar=nutrition"
    And "Solo con existencia" sigue encendido

  @slice-1
  Scenario: Con todo agotado, el vacío ofrece quitar el filtro
    Given "Salsa macha de cacahuate" se queda en 0 piezas
    When abro "/categoria/salsas_y_aderezos?disponibles=1"
    Then veo que no hay nada con existencia en "Salsas y Aderezos"
    And puedo volver a ver toda la categoría

  # La tienda y el perfil no son una categoría: siembran su propio catálogo (una tienda de prueba
  # y la cuenta de la suite con una dirección prestada), no el Background.

  @slice-2
  Scenario: La tienda enseña lo agotado a quien visita
    Given la tienda de prueba con "Mermelada de fresa" (5 piezas) y "Miel de abeja melipona" (0)
    When un visitante sin sesión abre la tienda
    Then ve las dos, y "Miel de abeja melipona" con su insignia de agotado

  @slice-2
  Scenario: En la tienda, el filtro y la búsqueda se combinan
    Given la tienda de prueba con "Mermelada de fresa" (5), "Mermelada de zarzamora" (0) y "Miel de abeja melipona" (5)
    When un visitante busca "mermelada" y enciende "Solo con existencia"
    Then ve solo "Mermelada de fresa"
    And la dirección lleva "q=mermelada" y "disponibles=1"

  @slice-2
  Scenario: En el perfil, el filtro deja fuera lo agotado
    Given el perfil de la cuenta de la suite con "Mermelada de fresa" (5) y "Miel de abeja melipona" (0)
    When abro el perfil y enciendo "Solo con existencia"
    Then veo "Mermelada de fresa"
    And no veo "Miel de abeja melipona"

  @future @slice-3
  Scenario: El home filtra por existencia también al cargar más
    When abro "/" con "Solo con existencia" y pido cargar más
    Then ninguna tarjeta nueva está agotada

  @future @slice-3
  Scenario: En productos, elegir un pilar no suelta la promoción
    Given abrí "/productos?promocion=1"
    When elijo un pilar
    Then la dirección sigue llevando "promocion=1"

  @future @slice-4
  Scenario Outline: «En promoción» en cada listado
    When abro "<listado>" y enciendo "En promoción"
    Then solo aparece lo que tiene una promoción vigente

    Examples:
      | listado                         |
      | /categoria/salsas_y_aderezos    |
      | /buscar?q=miel                  |
      | /                               |
