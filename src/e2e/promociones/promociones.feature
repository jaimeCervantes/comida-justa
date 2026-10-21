Feature: Promociones con precio rebajado

  Context:
  - Problem: para rebajar un producto solo se puede cambiar su precio. Se pierde el normal, el
    comprador no ve que hay oferta y al terminar hay que volver a subirlo a mano.
  - Savings: la rebaja se pone una vez, se apaga sola y el comprador ve cuánto ahorra.
  - Why: las promociones mueven el inventario que no rota, y hoy no hay forma honesta de anunciarlas.

  As a vendedor
  I want to poner un precio de promoción a un producto, con fecha de fin si quiero
  So that el comprador vea la oferta y pague el precio rebajado sin que yo lo vuelva a tocar

  Background:
    Given una tienda de prueba con el producto "Miel de abeja 500 g" a 180

  @slice-1
  Scenario: El vendedor pone una promoción y el comprador la ve en la ficha
    When el vendedor edita "Miel de abeja 500 g" con precio de promoción 150
    Then la ficha de "Miel de abeja 500 g" muestra 180 tachado, 150 y "-17%"

  @slice-1
  Scenario: Con fecha de fin, la ficha dice hasta cuándo dura
    When el vendedor edita "Miel de abeja 500 g" con precio de promoción 150 que termina mañana
    Then la ficha de "Miel de abeja 500 g" muestra 150 y la fecha en que termina

  @slice-1
  Scenario: El pedido cobra el precio de promoción
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When un comprador agrega 2 al carrito y confirma el pedido
    Then el carrito suma 300
    And el pedido registra 150 como precio unitario

  @slice-1
  Scenario: Una promoción vencida ya no se muestra ni se cobra
    Given "Miel de abeja 500 g" tuvo precio de promoción 150 que terminó ayer
    Then la ficha de "Miel de abeja 500 g" muestra solo 180, sin tachar
    And al agregarlo al carrito suma 180

  @slice-1
  Scenario: La promoción no puede costar lo mismo o más que el precio normal
    When el vendedor intenta guardar "Miel de abeja 500 g" con precio de promoción 180
    Then el formulario dice que la promoción debe ser menor al precio normal
    And el producto sigue sin promoción

  @slice-1
  Scenario: Quitar el precio de promoción quita la promoción
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When el vendedor borra el precio de promoción y guarda
    Then la ficha de "Miel de abeja 500 g" muestra solo 180, sin tachar

  @slice-2
  Scenario: La tarjeta del catálogo de la tienda muestra la insignia de descuento
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When un visitante abre la tienda
    Then la tarjeta de "Miel de abeja 500 g" muestra 180 tachado, 150 y "-17%"
    And la foto de la tarjeta lleva el cintillo "Promoción · -17%"

  @slice-2
  Scenario: La tarjeta de un resultado de búsqueda muestra la insignia de descuento
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When un visitante busca "Miel de abeja 500 g"
    Then la tarjeta de "Miel de abeja 500 g" muestra 180 tachado, 150 y "-17%"

  @slice-2
  Scenario: Una tarjeta no anuncia una promoción vencida
    Given "Miel de abeja 500 g" tuvo precio de promoción 150 que terminó ayer
    When un visitante abre la tienda
    Then la tarjeta de "Miel de abeja 500 g" muestra solo 180, sin insignia ni cintillo

  @slice-2
  Scenario: El carrito tacha lo que habría costado sin la promoción
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When un comprador agrega 2 al carrito
    Then el renglón muestra 360 tachado y suma 300

  @slice-3
  Scenario: El filtro "En promoción" muestra solo lo rebajado
    Given "Miel de abeja 500 g" tiene precio de promoción 150 y "Panela 1 kg" no tiene promoción
    When un visitante abre los productos y elige "En promoción"
    Then aparece "Miel de abeja 500 g"
    And no aparece "Panela 1 kg"

  @slice-3
  Scenario: Una promoción vencida no entra al filtro
    Given "Miel de abeja 500 g" tuvo precio de promoción 150 que terminó ayer
    When un visitante filtra los productos por "En promoción"
    Then no aparece "Miel de abeja 500 g"

  @slice-4
  Scenario: Los buscadores reciben el precio de oferta
    Given "Miel de abeja 500 g" tiene precio de promoción 150 que termina el 2030-11-30 a las 23:00
    Then el JSON-LD de la ficha declara price 150 y priceValidUntil 2030-11-30
