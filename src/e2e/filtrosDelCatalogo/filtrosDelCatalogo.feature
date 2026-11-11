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

  @future @slice-2
  Scenario: La tienda enseña lo agotado y deja filtrarlo
    Given una tienda con un producto con existencia y otro agotado
    When un visitante abre la tienda
    Then ve los dos, el agotado con su insignia
    When enciende "Solo con existencia"
    Then ve solo el que tiene existencia

  @future @slice-2
  Scenario: El perfil deja filtrar por existencia
    When abro un perfil y enciendo "Solo con existencia"
    Then no aparece nada agotado

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
