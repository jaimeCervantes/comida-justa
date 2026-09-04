Feature: Inventario de existencias

  Context:
  - Problem: `posts.is_available` solo sabe decir sí o no. De los 418 productos del catálogo hay 4
    marcados agotados, todos a mano, y quien vende no sabe cuántas donas le quedan hasta que ya
    prometió una que no tiene. Los pedidos ya servidos —9 pechugas, 8 donas, 7 sueros— no
    descontaron nada de ningún lado, porque no hay ningún lado donde descontar.
  - Savings: menos pedidos que cancelar a mano y menos "ya no me quedan" por WhatsApp. Se acaba el
    repaso de 418 publicaciones una por una para saber qué reponer, y el chatbot deja de recomendar
    lo que se acabó sin que nadie tenga que acordarse de apagarlo.
  - Why: es lo que separa un catálogo de un comercio. Lo que se ofrece pasa a ser lo que de verdad
    hay.

  As dueño de una tienda o de una publicación
  I want llevar la cuenta de cuántas unidades me quedan de cada producto
  So that deje de ofrecer lo que ya no tengo sin tener que acordarme de apagarlo

  # `stock_quantity` es NULL en las 420 publicaciones que existen hoy, y NULL no es 0: significa
  # "no lleva inventario". Es lo que hace que esta entrega no cambie el comportamiento de nada de lo
  # ya publicado. Llevar inventario se decide producto por producto.

  # Los productos reales NO se tocan: marcar agotado un "Jugo Verde" de verdad lo sacaría del sitio
  # y de las recomendaciones del bot mientras corre la suite, y un fallo a media prueba lo dejaría
  # así. Todo lo que sigue se siembra dentro de "Hazlo Sano" con los precios reales del catálogo.

  # ---------------------------------------------------------------------------------------------
  # Slice 1 — Fijar y ver existencias por producto
  # ---------------------------------------------------------------------------------------------

  @slice-1
  Scenario: Pongo cuántas me quedan y el sitio lo dice
    Given un producto sembrado "Dona Chocolate Keto" a 40 en "Hazlo Sano", sin inventario
    When entro como su dueño y guardo 3 existencias en su ficha
    Then la ficha dice que quedan 3
    And sigue ofreciendo "Pedir por WhatsApp" y añadirlo al carrito

  @slice-1
  Scenario: Al llegar a cero se agota solo
    Given un producto sembrado "Dona Chocolate Keto" a 40 con 3 existencias
    When su dueño guarda 0 existencias
    Then la ficha lo marca como "Agotado"
    And ya no ofrece "Pedir por WhatsApp" ni añadirlo al carrito
    And su fila queda así:
      | campo          | valor |
      | stock_quantity | 0     |
      | is_available   | false |

  # Que `is_available` se derive es lo que hace que el bot, el carrito, la búsqueda y el JSON-LD no
  # se enteren de que existe una columna nueva: siguen leyendo la que ya leían.
  @slice-1
  Scenario: Reponer lo vuelve a ofrecer
    Given un producto sembrado "Dona Chocolate Keto" a 40 agotado por inventario
    When su dueño guarda 12 existencias
    Then la ficha dice que quedan 12
    And vuelve a ofrecer "Pedir por WhatsApp"
    And su fila queda así:
      | campo          | valor |
      | stock_quantity | 12    |
      | is_available   | true  |

  @slice-1
  Scenario: El dueño de la tienda administra lo que publicó otra persona
    Given un producto sembrado "Suero natural" a 35 en "Hazlo Sano", publicado por otra cuenta
    When entro como el dueño de "Hazlo Sano" y guardo 5 existencias
    Then la ficha dice que quedan 5

  @slice-1
  Scenario: Quien no es dueño de nada no puede tocarlo
    Given un producto sembrado "Suero natural" a 35 en "Hazlo Sano"
    When una cuenta que no lo publicó ni es dueña de la tienda intenta guardar 99 existencias
    Then se le responde que no es suyo
    And su fila sigue sin inventario

  # El campo se ofrece donde contar unidades significa algo. Un servicio se vende, pero no se
  # entrega en piezas: a una masajista no se le acaban los masajes, su disponibilidad es la agenda.
  @slice-1
  Scenario Outline: El campo de existencias solo aparece en lo que se entrega en piezas
    Given una publicación sembrada de tipo "<kind>" en "Hazlo Sano"
    When entro como su dueño y abro su ficha
    Then el campo de existencias "<visibilidad>"

    Examples:
      | kind      | visibilidad | reason                                              |
      | producto  | se ve       | es lo único que se entrega contado en unidades      |
      | servicio  | no se ve    | se vende, pero su disponibilidad es la agenda       |
      | evento    | no se ve    | no se agota, caduca — lo decide el reloj            |
      | anuncio   | no se ve    | no se vende                                         |

  @slice-1
  Scenario Outline: Solo un entero no negativo llega a la base
    Given un producto sembrado "Dona Chocolate Keto" a 40 con 3 existencias
    When su dueño intenta guardar "<entrada>"
    Then <resultado>

    Examples: aceptado
      | entrada | resultado                              | reason                          |
      | 0       | quedan 0 existencias y se marca agotado | cero es un inventario válido    |
      | 25      | quedan 25 existencias                   | el caso normal                  |

    Examples: rechazado — la fila no cambia
      | entrada | resultado                              | reason                        |
      | -1      | se avisa del error y siguen quedando 3 | no existen unidades negativas |
      | 2.5     | se avisa del error y siguen quedando 3 | media dona no es un ejemplar  |

    # `abc` no cabe en esta tabla porque no cabe en el campo: es numérico y el navegador no lo
    # acepta, así que no es algo que una persona pueda llegar a enviar. La regla existe igual en el
    # servidor —un formulario se puede forjar— y se prueba en `setPostStockUseCase.test.ts`.

  # La garantía de que esta entrega no mueve nada de lo que ya está publicado.
  @slice-1
  Scenario: Lo que no lleva inventario se comporta como siempre
    Given un producto sembrado "Jugo Verde" a 40 sin inventario
    When cualquiera abre su ficha
    Then no dice cuántas quedan
    And su dueño sigue teniendo el interruptor de marcar agotado a mano

  # ---------------------------------------------------------------------------------------------
  # Slice 2 — El panel de inventario de la tienda
  # ---------------------------------------------------------------------------------------------

  @slice-2 @future
  Scenario: La tienda ve su inventario en una tabla
    Given una tienda con varios productos, unos con inventario y otros sin él
    When su dueño abre "/cuenta/inventario"
    Then ve todos los productos de su tienda con sus existencias

  @slice-2 @future
  Scenario: Corrijo un número sin salir de la tabla
    Given el panel de inventario de "Hazlo Sano"
    When cambio las existencias de un renglón
    Then el renglón refleja el número nuevo y la ficha del producto también

  @slice-2 @future
  Scenario: Filtro lo que hay que reponer
    Given el panel de inventario con productos agotados y con existencias
    When filtro por agotados
    Then solo quedan los que están en cero

  # ---------------------------------------------------------------------------------------------
  # Slice 3 — El pedido descuenta al aceptarse
  # ---------------------------------------------------------------------------------------------

  @slice-3 @future
  Scenario: Aceptar un pedido descuenta lo que lleva
    Given un pedido pendiente de 2 donas de un producto con 12 existencias
    When el vendedor lo acepta
    Then quedan 10 existencias

  @slice-3 @future
  Scenario: No se acepta un pedido que no se puede servir
    Given un pedido pendiente de 5 donas de un producto con 2 existencias
    When el vendedor intenta aceptarlo
    Then se le dice que no le alcanza el inventario y el pedido sigue pendiente

  @slice-3 @future
  Scenario: Cancelar un pedido ya aceptado devuelve lo suyo
    Given un pedido aceptado que descontó 2 donas
    When el vendedor lo cancela
    Then las 2 vuelven al inventario

  @slice-3 @future
  Scenario: Cancelar un pedido que nunca se aceptó no devuelve nada
    Given un pedido pendiente de 2 donas
    When el vendedor lo cancela
    Then el inventario no cambia
