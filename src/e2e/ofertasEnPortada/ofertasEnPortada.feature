Feature: Ofertas en la portada

  Context:
  - Problem: una oferta solo se ve si quien visita baja hasta su tarjeta o abre el filtro "En
    promoción"; el hero del inicio, lo primero que se ve, nunca dice que hay ofertas.
  - Savings: nadie diseña ni sube un anuncio; el banner se arma solo con las promociones vigentes y
    desaparece solo cuando se acaban.
  - Why: las promociones solo mueven inventario si se ven, y el hero es el lugar más valioso del sitio.

  As a visitante del inicio
  I want ver en el hero, de entrada, qué está en promoción
  So that encuentre las ofertas sin tener que buscarlas

  Background:
    Given una tienda de prueba con el producto "Miel de abeja 500 g" a 180

  # Historia del modelo (ver la bitácora): el banner estuvo primero en un carrusel del hero y luego
  # como primera tarjeta del feed. El 2026-10-21 el usuario fijó el modelo final: con ofertas
  # vigentes, un solo carrusel al estilo de un marketplace que ocupa el lugar del hero, en escritorio
  # y en el teléfono; sin ofertas, el hero de siempre.

  @slice-1
  Scenario Outline: Con ofertas, el carrusel ocupa el lugar del hero
    Given "Miel de abeja 500 g" tiene precio de promoción 90
    When un visitante abre el inicio en <pantalla>
    Then arriba de todo hay un carrusel de ofertas a todo el ancho, y no está el hero
    And su imagen es la de formato "<formato>" y describe "Miel de abeja 500 g" con "-50%"
    And el banner lleva a "/productos?promocion=1"

    Examples:
      | pantalla             | formato  |
      | escritorio (1366 px) | ancho    |
      | teléfono (390 px)    | compacto |

  @slice-1
  Scenario: Las imágenes del banner son imágenes de verdad
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When se piden las imágenes del banner en formato "ancho" y "compacto"
    Then las dos respuestas son imágenes WebP

  @slice-1
  Scenario: El banner cambia de dirección cuando cambia la promoción
    Given "Miel de abeja 500 g" tiene precio de promoción 90
    And un visitante abrió el inicio
    When la promoción de "Miel de abeja 500 g" pasa a 80
    And el visitante vuelve a abrir el inicio
    Then la imagen del banner tiene otra dirección

  @slice-1
  Scenario: Una promoción vencida no entra al banner
    Given "Miel de abeja 500 g" tuvo precio de promoción 150 que terminó ayer
    When un visitante abre el inicio
    Then el banner de ofertas no menciona "Miel de abeja 500 g"

  # Pedido del usuario el 2026-10-22: lo que no se puede comprar no se anuncia como oferta.
  @slice-1
  Scenario Outline: Lo que no se puede comprar no entra a las ofertas
    Given "Miel de abeja 500 g" tiene precio de promoción 90
    And "Miel de abeja 500 g" <estado>
    When un visitante abre el inicio y la lista de ofertas
    Then ni el carrusel ni la lista de ofertas mencionan "Miel de abeja 500 g"

    Examples:
      | estado                         |
      | está marcada como agotada      |
      | tiene 0 piezas en inventario   |

  # Decisión del usuario el 2026-10-22: el carrusel y la lista de ofertas solo enseñan lo que tiene
  # piezas registradas.
  @slice-1
  Scenario: Una oferta sin inventario registrado no sale ni en el carrusel ni en la lista
    Given "Miel de abeja 500 g" tiene precio de promoción 90 y nadie lleva su inventario
    When un visitante abre el inicio y la lista de ofertas
    Then ni el carrusel ni la lista de ofertas mencionan "Miel de abeja 500 g"

  # @component (Vitest): en la base compartida hay promociones reales, así que "no hay ninguna" no se
  # puede sembrar sin tocar datos ajenos. `buildHomeOffersBanner` devuelve `null` sin ofertas
  # (homeOffers.test.ts), y sin banner la página monta el hero en vez de `OffersCarousel`.
  @slice-1 @component
  Scenario: Sin promociones vigentes, el hero de siempre
    Given no hay ninguna promoción vigente
    When un visitante abre el inicio
    Then se ve el hero, sin carrusel de ofertas

  # Slice 2: un slide por marca. Reemplaza «un slide por producto» (ver el roadmap).

  @slice-2 @component
  Scenario Outline: Las ofertas se agrupan por marca, y sin marca por tienda
    Given estas ofertas vigentes
      | producto                 | marca     | tienda     | descuento |
      | Falcon Protein Vegana    | Birdman   | Hazlo Sano | 21        |
      | Falcon Golden Vanilla    | birdman   | Hazlo Sano | 20        |
      | Smoothie Verde Detox     | Amarosana | Hazlo Sano | 15        |
      | Smoothie Frutos Rojos    | Amarosana | Hazlo Sano | 10        |
      | Miel de abeja 500 g      | Apis      | Hazlo Sano | 17        |
      | Pan de masa madre        |           | La Luz     | 12        |
      | Pan de centeno           |           | La Luz     | 8         |
    When se arma el carrusel del inicio
    Then el slide <posición> es "<slide>" con <productos>

    Examples: un grupo por marca o por tienda, solo si junta 2 o más; la marca sin distinguir mayúsculas
      | posición | slide                    | productos                                 |
      | 1        | Ofertas (todas)          | las 4 de mayor descuento                  |
      | 2        | Birdman · hasta 21% OFF  | Falcon Protein Vegana, Falcon Golden Vanilla |
      | 3        | Amarosana · hasta 15% OFF | Smoothie Verde Detox, Smoothie Frutos Rojos |
      | 4        | La Luz · hasta 12% OFF   | Pan de masa madre, Pan de centeno         |

  @slice-2
  Scenario: Una marca con varias ofertas tiene su slide, que lleva a sus ofertas
    Given "Miel de abeja 500 g" y "Miel de abeja 1 kg" de la marca "E2E Apis" tienen precio de promoción
    When un visitante abre el inicio
    Then el carrusel tiene un slide "Ofertas E2E Apis" con su imagen
    And ese slide lleva a "/productos?promocion=1&marca=E2E Apis"

  @slice-2
  Scenario: Una marca con una sola oferta no tiene slide propio
    Given solo "Miel de abeja 500 g" de la marca "E2E Apis" tiene precio de promoción
    When un visitante abre el inicio
    Then ningún slide del carrusel es de "E2E Apis"

  @slice-2
  Scenario: El catálogo se filtra por marca
    Given "Miel de abeja 500 g" de la marca "E2E Apis" y "Panela 1 kg" sin marca, los dos en promoción
    When un visitante abre "/productos?promocion=1&marca=E2E Apis"
    Then aparece "Miel de abeja 500 g"
    And no aparece "Panela 1 kg"

  @slice-2
  Scenario: El vendedor pone la marca al editar un producto
    When el vendedor edita "Miel de abeja 500 g" con la marca "  E2E   Apis "
    Then la publicación queda con la marca "E2E Apis"

  @slice-2 @component
  Scenario: El importador guarda la marca que trae el catálogo del proveedor
    Given un producto del catálogo con supplierName "Birdman"
    When se importa o se sincroniza
    Then la publicación queda con la marca "Birdman"

  @slice-2
  Scenario: El carrusel de ofertas se mueve con sus controles
    Given "Miel de abeja 500 g" y "Miel de abeja 1 kg" de la marca "E2E Apis" tienen precio de promoción
    When un visitante abre el inicio y pulsa "siguiente" en el carrusel
    Then se ve el slide siguiente
