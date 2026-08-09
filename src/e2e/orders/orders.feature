Feature: Carrito y pedidos

  Context:
  - Problem: el catálogo tiene 13 productos de una tienda y el único camino a la venta es "Pedir por
    WhatsApp", que es de un producto a la vez. Quien quiere Jugo Verde (40), Suero natural (35) y una
    hogaza de Masa Madre (96) manda tres mensajes sueltos, y el vendedor arma el total a mano dentro
    de la conversación. No queda registro de nada: ni de qué se pidió, ni de cuánto sumaba, ni de
    cuántos pedidos se cayeron a medio camino.
  - Savings: una conversación por pedido en vez de una por producto, con el desglose y el total ya
    escritos. El vendedor deja de sumar en el chat. Y aparece el primer número sobre el que decidir
    si el pago en línea vale la pena: hoy `orders` tiene 0 filas y esa pregunta no se puede contestar.
  - Why: es el eslabón que falta entre "te encontraron" y "te compraron". La búsqueda, el directorio,
    la distancia, la tienda y el perfil ya están entregados: todos terminan en un producto, y ahí el
    camino se corta en un mensaje suelto por artículo.

  As a persona que quiere comprarle a un productor local
  I want to juntar varios productos y mandar un solo pedido
  So that no tenga que abrir una conversación por cada cosa que quiero

  # El carrito puede llevar productos de varias tiendas; un pedido es siempre de UNA. Hoy hay un solo
  # vendedor, así que confirmar produce un pedido — por el mismo camino de código, no por una rama
  # especial. Lo que sigue está escrito para que el día del segundo vendedor no cambie de forma.

  # "Suero natural" a 35 es real y se usa tal cual. El producto que entra DESDE UNA TARJETA se
  # siembra a 40 dentro de la misma tienda: `/productos` pagina y ordena por fecha, así que uno de
  # los 13 reales puede caer en la página 3 y el escenario fallaría por dónde quedó, no por lo que
  # prueba. Sembrado hoy, sale primero.
  @slice-1
  Scenario: Junto dos productos y quedan en un solo pedido
    Given "Suero natural" a 35 y otro producto a 40, los dos de "Hazlo Sano"
    When añado el primero desde su ficha y el segundo desde su tarjeta en "/productos"
    Then "/carrito" muestra los dos renglones bajo un único grupo, "Hazlo Sano"
    And el total es 75

  @slice-1
  Scenario: La cabecera dice lo que llevo, esté donde esté
    Given que ya añadí "Suero natural" al carrito
    When navego a "/productos" y luego a "/tienda/hazlo-sano"
    Then la cabecera dice que llevo 1 artículo en las dos páginas

  @slice-1
  Scenario: Cambio cantidades y el total sigue
    Given un carrito con "Suero natural" a 35 y otro producto a 40
    When pongo 2 de "Suero natural"
    Then el total es 110
    When quito "Suero natural"
    Then el total es 40
    And su renglón ya no está

  @slice-1
  Scenario: Confirmo el pedido y el mensaje va escrito
    Given un carrito con un "Suero natural" y otro producto a 40, de la tienda "Hazlo Sano"
    When pulso "Confirmar pedido con Hazlo Sano"
    Then se abre wa.me/522781126948
    And el mensaje trae "1 × Suero natural — $35" y "Total: $75"
    And trae el enlace de cada producto, porque hay tres hogazas que se llaman casi igual

  # El que se agota se siembra: marcar agotado uno de los 13 reales lo saca del sitio y de las
  # recomendaciones del bot mientras corre la suite, y un fallo a media prueba lo dejaría así.
  @slice-1
  Scenario: Lo que se agotó no se cobra ni se pide
    Given un carrito con "Suero natural" a 35 y un producto sembrado a 50
    When el vendedor marca el sembrado como agotado
    And vuelvo a abrir "/carrito"
    Then el sembrado se ve marcado como agotado y no entra en el total
    And el total baja a 35
    And el sembrado no aparece en el mensaje de WhatsApp
    But su renglón sigue a la vista, para que yo decida quitarlo

  @slice-1
  Scenario: Un carrito vacío dice qué hacer
    Given que no he añadido nada
    When abro "/carrito"
    Then me dice que está vacío y me enlaza al catálogo

  @slice-1
  Scenario: El carrito sobrevive a la recarga
    Given un carrito con "Jugo Verde"
    When recargo la página
    Then "Jugo Verde" sigue en el carrito

  @slice-1 @component
  Scenario Outline: Qué se puede añadir al carrito
    # Vitest: son combinaciones de props. Y el caso "producto agotado" no se puede sembrar contra la
    # base sin marcar agotado uno de los 13, que hoy están los 13 disponibles.
    Given una publicación de tipo "<kind>" con precio <precio> y disponible = <disponible>
    When se pinta
    Then el botón de añadir al carrito <resultado>

    Examples:
      | kind     | precio | disponible | resultado    | razón                                        |
      | producto | 40     | true       | se pinta     | es lo que esta feature viene a resolver      |
      | producto | 40     | false      | no se pinta  | no se junta lo que no se puede entregar      |
      | anuncio  | (nulo) | true       | no se pinta  | los 10 anuncios no tienen precio: no suman   |

  @slice-1 @component
  Scenario Outline: Una cookie manipulada no tumba el carrito
    # Vitest sobre `parseCart`: una cookie la escribe cualquiera, así que lo que venga se valida antes
    # de creerle. Mismo criterio que `parseFix` en `locationCookie.ts`.
    Given la cookie "hs_cart" con el valor "<cookie>"
    When se lee el carrito
    Then quedan <renglones> renglones

    # `<id>` es el de "Jugo Verde" (f5258215-…): la cookie guarda ids, no slugs, porque el slug
    # cambia con el idioma y el id no.
    Examples:
      | cookie          | renglones | razón                                          |
      | <id>:2          | 1         | el caso normal                                 |
      | <id>:2\|<otro>:1 | 2        | dos renglones                                  |
      | <id>:0          | 0         | cantidad 0 no es un renglón                    |
      | <id>:abc        | 0         | cantidad ilegible: se descarta ese renglón     |
      | <id>:1.5        | 0         | media unidad no se puede pedir                 |
      | <id>:2\|:5      | 1         | sin id no hay producto; el bueno sobrevive     |
      | <id>:2\|<id>:3  | 1         | el repetido no se pinta dos veces              |
      | (vacía)         | 0         | carrito vacío, que es lo normal la primera vez |

  @slice-1 @component
  Scenario: Dos tiendas se cobran y se piden por separado
    # Vitest sobre `groupBySeller`: hoy la base tiene UN vendedor, así que este caso no se puede
    # montar en Playwright sin inventar una segunda tienda — pero es el que sostiene todo el modelo.
    Given un carrito con "Jugo Verde" de "Hazlo Sano" y "Pan de campo" de "Panadería La Luz"
    When se agrupa por vendedor
    Then salen dos grupos, cada uno con su subtotal y su propio botón de confirmar
    And no existe ningún total que mezcle a las dos tiendas, porque cada una entrega por su cuenta

  @slice-2 @future
  Scenario: El pedido queda registrado antes de salir a WhatsApp
    Given un carrito confirmado
    When se manda el pedido
    Then queda guardado en estado PENDING con el precio del día

  @slice-2 @future
  Scenario: El vendedor lleva su pedido por el proceso
    Given un pedido en PENDING
    When el vendedor lo acepta, lo prepara y lo entrega
    Then el pedido pasa por CONFIRMED, PREPARING y DELIVERED

  @slice-2 @future
  Scenario: Un pedido se puede cancelar
    Given un pedido que no está entregado
    When el vendedor lo cancela
    Then queda en CANCELLED

  @slice-3 @future
  Scenario: El comprador ve en qué va lo suyo
    Given que hice un pedido
    When abro mis pedidos
    Then veo su estado sin preguntarle a nadie

  @slice-4 @future
  Scenario: Se paga en línea
    Given un pedido aceptado
    When pago
    Then el pedido queda en PAID
