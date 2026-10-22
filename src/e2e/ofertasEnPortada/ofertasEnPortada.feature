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
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When un visitante abre el inicio en <pantalla>
    Then arriba de todo hay un carrusel de ofertas a todo el ancho, y no está el hero
    And su imagen es la de formato "<formato>" y describe "Miel de abeja 500 g" con "-17%"
    And el banner lleva a "/productos?promocion=1"

    Examples:
      | pantalla             | formato  |
      | escritorio (1366 px) | ancho    |
      | teléfono (390 px)    | compacto |

  @slice-1
  Scenario: Las imágenes del banner son imágenes de verdad
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When se piden las imágenes del banner en formato "ancho" y "compacto"
    Then las dos respuestas son imágenes PNG

  @slice-1
  Scenario: El banner cambia de dirección cuando cambia la promoción
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    And un visitante abrió el inicio
    When la promoción de "Miel de abeja 500 g" pasa a 140
    And el visitante vuelve a abrir el inicio
    Then la imagen del banner tiene otra dirección

  @slice-1
  Scenario: Una promoción vencida no entra al banner
    Given "Miel de abeja 500 g" tuvo precio de promoción 150 que terminó ayer
    When un visitante abre el inicio
    Then el banner de ofertas no menciona "Miel de abeja 500 g"

  # @component (Vitest): en la base compartida hay promociones reales, así que "no hay ninguna" no se
  # puede sembrar sin tocar datos ajenos. `buildHomeOffersBanner` devuelve `null` sin ofertas
  # (homeOffers.test.ts), y sin banner la página monta el hero en vez de `OffersCarousel`.
  @slice-1 @component
  Scenario: Sin promociones vigentes, el hero de siempre
    Given no hay ninguna promoción vigente
    When un visitante abre el inicio
    Then se ve el hero, sin carrusel de ofertas

  @slice-2 @future
  Scenario: Cada producto en promoción tiene su slide
    Given "Miel de abeja 500 g" tiene precio de promoción 150
    When un visitante abre el inicio
    Then un slide del carrusel de ofertas muestra "Miel de abeja 500 g" con 180 tachado, 150 y "-17%"
    And ese slide lleva a la ficha de "Miel de abeja 500 g"

  @slice-2 @future
  Scenario: El carrusel de ofertas se mueve con sus controles
    Given hay más de un slide en el carrusel de ofertas
    When un visitante pulsa "siguiente"
    Then se ve el slide siguiente
