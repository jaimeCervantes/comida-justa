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

  # El home y /productos no tienen barra propia: los filtros viven en la barra de cercanía del
  # chrome, la que está en todas las páginas.

  @slice-3
  Scenario: El home filtra por existencia también al cargar más
    Given el producto recién publicado "Miel de abeja melipona" con 0 piezas
    And abrí "/" y lo veo con su insignia de agotado
    When enciendo "Solo con existencia" en la barra de arriba
    Then "Miel de abeja melipona" ya no aparece
    And ninguna tarjeta del feed está agotada
    When pido cargar más
    Then la petición lleva "disponibles=1"

  @slice-3
  Scenario: En productos, el filtro deja fuera lo agotado
    When abro "/productos" y enciendo "Solo con existencia" en la barra de arriba
    Then la dirección lleva "disponibles=1"
    And ninguna tarjeta está agotada

  @slice-3
  Scenario: En productos, elegir un pilar no suelta la promoción
    Given abrí "/productos?promocion=1"
    When elijo el pilar "Alimentación" en la barra de arriba
    Then la dirección lleva "pillar=nutrition" y "promocion=1"

  # Una promoción vigente exige piezas registradas: «En promoción» ya deja fuera lo agotado.

  @slice-4
  Scenario: En una categoría, «En promoción» deja solo lo que tiene oferta vigente
    Given en "salsas_y_aderezos", "Salsa macha de cacahuate" baja de 85 a 70 y "Aderezo de chipotle" no tiene oferta
    When abro la categoría y enciendo "En promoción"
    Then veo "Salsa macha de cacahuate"
    And no veo "Aderezo de chipotle"
    And la dirección lleva "promocion=1"

  @slice-4
  Scenario: En la búsqueda, «En promoción» es una faceta más y se quita desde el resumen
    Given "Salsa macha de cacahuate" con oferta y "Aderezo de chipotle" sin ella
    When busco "salsas_y_aderezos" por el nombre de las dos y enciendo "En promoción"
    Then solo aparece "Salsa macha de cacahuate"
    When quito "En promoción" desde el resumen de la búsqueda
    Then vuelven a aparecer las dos

  @slice-4
  Scenario: En la tienda, «En promoción» se combina con «Solo con existencia»
    Given la tienda de prueba con "Mermelada de fresa" en oferta y "Miel de abeja melipona" sin ella, las dos con piezas
    When abro la tienda con "Solo con existencia" y enciendo "En promoción"
    Then veo solo "Mermelada de fresa"
    And la dirección lleva "disponibles=1" y "promocion=1"

  # «Mis publicaciones» es el mismo perfil visto por su dueño: un solo buscador sirve a los dos.

  @slice-5
  Scenario: El perfil se busca por palabras y la búsqueda se combina con los filtros
    Given el perfil de la cuenta de la suite con estos productos
      | título                 | piezas |
      | Mermelada de fresa     | 5      |
      | Mermelada de zarzamora | 0      |
      | Miel de abeja melipona | 5      |
    When busco "mermelada" en el perfil
    Then veo "Mermelada de fresa" y "Mermelada de zarzamora", y no "Miel de abeja melipona"
    When enciendo "Solo con existencia"
    Then veo solo "Mermelada de fresa"
    And la dirección lleva "q=" y "disponibles=1"

  @slice-5
  Scenario: Buscar y no encontrar no dice que el perfil esté vacío
    Given el perfil de la cuenta de la suite con "Mermelada de fresa"
    When busco "gazpacho" en el perfil
    Then se me dice que nada coincide, no que no haya publicado nada
