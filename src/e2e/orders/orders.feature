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

  # La búsqueda es el camino más corto del sitio hasta un producto y era el único listado que no
  # dejaba juntar. No era la UI: usa el mismo `CardForList` que `/productos`. Su proyección construía
  # el DTO sin `kind` ni `is_available` —aunque la consulta trae la fila entera de `posts`— y un
  # `as unknown as` impedía que el compilador avisara.
  @slice-1
  Scenario: Desde un resultado de búsqueda también se junta
    Given un producto y un anuncio que comparten un término poco común
    When busco ese término
    Then la tarjeta del producto ofrece añadirlo al carrito, igual que en "/productos"
    And la del anuncio no lo ofrece, porque un anuncio no se vende
    And al añadirlo la cabecera lo cuenta, sin haber abierto la publicación

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

  # Confirmar ya no salta a WhatsApp: primero se registra el pedido y el aviso se manda desde su
  # página. Si el aviso fuera lo primero, un pedido existiría solo dentro de una conversación y nadie
  # podría decir cuántos hubo ni en qué acabaron.
  @slice-2
  Scenario: Confirmar deja el pedido registrado y lleva a su página
    Given un carrito con "Suero natural" a 35, de "Hazlo Sano", y sesión iniciada
    When pulso "Hacer el pedido a Hazlo Sano"
    Then llego a la página del pedido, que lo da por registrado y lo muestra Pendiente
    And desde ahí puedo avisar a la tienda por WhatsApp, con el enlace del propio pedido
    And el carrito se queda sin ese renglón, porque ya está pedido

  @slice-2
  Scenario: El precio queda congelado en el pedido
    Given un pedido de un producto que costaba 50
    When el vendedor le sube el precio a 80
    Then el pedido sigue diciendo 50, porque es lo que se acordó
    But el catálogo ya muestra 80

  @slice-2
  Scenario: El vendedor lleva su pedido por el proceso
    Given un pedido Pendiente en mi tienda
    When lo acepto, lo preparo y lo entrego desde "/cuenta"
    Then pasa por Aceptado, En preparación y Entregado
    And una vez Entregado ya no ofrece ninguna acción

  @slice-2
  Scenario: Confirmar sin sesión primero pide identificarse
    Given un carrito con algo dentro y sin sesión iniciada
    When pulso confirmar
    Then se me pide iniciar sesión, porque un pedido tiene dueño
    And el carrito sigue intacto

  # Los pedidos vivían dentro de "/cuenta", mezclados con la ficha de la tienda y las sucursales, y
  # lo que uno pedía no tenía página ninguna. Un solo destino para los dos papeles: la misma persona
  # compra y vende —hoy la única tienda es de alguien que también compra—, así que partirlo en dos
  # direcciones obliga a elegir en qué papel entras antes de saber si hay algo que atender.
  @slice-2
  Scenario: Los pedidos tienen su sitio, y se llega desde el menú de la cuenta
    Given que hice un pedido y además tengo tienda
    When abro "Mis pedidos" desde el menú de mi avatar
    Then veo primero lo que me han pedido y debajo lo que he pedido yo
    And cada uno enlaza a su página, donde está el detalle

  @slice-2
  Scenario: Quien no vende solo ve lo suyo
    Given que no tengo tienda
    When abro "/pedidos"
    Then no aparece la sección de lo que me han pedido, porque no puede haber nada

  @slice-2
  Scenario: El pedido de otra persona no se puede ni mirar
    Given un pedido que hizo alguien más
    When abro su dirección
    Then la respuesta es 404, no 403: un id ajeno no se confirma ni negándolo

  @slice-2 @component
  Scenario Outline: Qué transiciones se permiten
    # Vitest sobre el dominio: son reglas puras y montarlas todas en el navegador costaría un pedido
    # sembrado por fila. La pantalla pinta un botón por cada destino que devuelve `nextStatuses`, así
    # que esta tabla es también la lista de botones.
    Given un pedido en "<desde>"
    When el vendedor intenta llevarlo a "<hasta>"
    Then la transición <resultado>

    Examples: permitidas
      | desde     | hasta     | resultado | razón                                  |
      | PENDING   | CONFIRMED | se acepta | el vendedor lo acepta                  |
      | PENDING   | CANCELLED | se acepta | no puede atenderlo                     |
      | CONFIRMED | PREPARING | se acepta | se pone a ello                         |
      | PREPARING | DELIVERED | se acepta | lo entrega                             |
      | PREPARING | CANCELLED | se acepta | se le acabó a media preparación        |

    Examples: rechazadas
      | desde     | hasta     | resultado  | razón                                          |
      | PENDING   | DELIVERED | se rechaza | no se entrega lo que no se aceptó              |
      | PENDING   | PREPARING | se rechaza | saltarse la aceptación esconde el paso clave   |
      | CONFIRMED | PENDING   | se rechaza | no hay marcha atrás: nadie des-acepta          |
      | DELIVERED | CANCELLED | se rechaza | lo entregado no se deshace cambiando una fila  |
      | CANCELLED | CONFIRMED | se rechaza | un pedido cancelado no revive                  |

  @slice-2 @component
  Scenario: Dos pestañas no aplican la misma decisión dos veces
    # Vitest: el estado de partida viaja al `WHERE` de la escritura, así que la segunda pestaña no
    # encuentra fila que tocar. Montarlo en el navegador pediría dos contextos a la vez.
    Given un pedido Pendiente abierto en dos pestañas
    When en la primera se acepta y en la segunda se cancela
    Then la segunda no cambia nada y avisa de que el pedido ya se movió

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
