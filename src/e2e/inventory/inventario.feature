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

  # `Hazlo Sano` tiene 418 productos. Ese número es el escenario: poner existencias abriendo 418
  # fichas no es una tarea, es un motivo para no hacerlo nunca. La tabla existe para eso.

  @slice-2
  Scenario: La tienda ve su inventario en una tabla
    Given "Hazlo Sano" con productos suyos, alguno publicado por otra cuenta
    When su dueño abre "/cuenta/inventario"
    Then ve un renglón por producto de la tienda, con sus existencias
    And también los que publicó otra persona, porque el inventario es de la tienda

  @slice-2
  Scenario: Corrijo un número sin salir de la tabla
    Given el panel de inventario de "Hazlo Sano" con "Dona Chocolate Keto" sin inventario
    When escribo 12 en su renglón y guardo
    Then el renglón dice que quedan 12
    And la ficha del producto también

  # Los tres ámbitos son las tres preguntas que se le hacen a un inventario: qué tengo, qué hay que
  # reponer y qué falta por contar.
  @slice-2
  Scenario Outline: Filtro por lo que quiero mirar
    Given el panel con un producto agotado, uno con existencias y uno sin inventario
    When filtro por "<ámbito>"
    Then salen "<cuáles>"

    Examples:
      | ámbito     | cuáles                              | reason                          |
      | todos      | los tres                            | el estado por omisión           |
      | agotados   | solo el que está en cero            | lo que hay que reponer          |
      | sin contar | solo el que no lleva inventario     | lo que falta por poner a contar |

  # Un servicio no se entrega en piezas y un anuncio no se vende: meterlos en la tabla sería
  # ofrecer un campo que el servidor rechazaría, la misma regla que ya aplica la ficha.
  @slice-2
  Scenario: El inventario es de los productos, no de todo lo publicado
    Given "Hazlo Sano" con un producto, un servicio, un evento y un anuncio
    When su dueño abre el panel de inventario
    Then solo aparece el producto

  @slice-2
  Scenario: La tabla no mete el catálogo entero en una página
    Given una tienda con más productos de los que caben en una página
    When su dueño abre el panel
    Then ve una página de renglones y el paso a la siguiente

  @slice-2
  Scenario: El menú lleva al inventario solo si hay tienda
    Given una cuenta con tienda y otra sin ella
    When cada una abre "/cuenta"
    Then solo la que tiene tienda ve la entrada de inventario en el menú

  @slice-2
  Scenario: Sin tienda, la página lo dice en vez de enseñar una tabla vacía
    Given una cuenta sin tienda
    When abre "/cuenta/inventario"
    Then se le explica que primero hace falta abrir una tienda

  # ---------------------------------------------------------------------------------------------
  # Slice 3 — El pedido descuenta al aceptarse
  # ---------------------------------------------------------------------------------------------

  # **Aceptar es el momento**, no hacer el pedido. Un pedido pendiente es alguien preguntando; lo que
  # compromete mercancía es que el vendedor diga que sí. Y como un pedido no vuelve atrás —de
  # CONFIRMED sólo se sale a PREPARING, DELIVERED o CANCELLED—, su estado actual ya dice si descontó:
  # no hace falta una columna ni una tabla que lo recuerde.

  @slice-3
  Scenario: Aceptar un pedido descuenta lo que lleva
    Given un pedido pendiente de 2 "Dona Chocolate Keto" de un producto con 12 existencias
    When el vendedor lo acepta
    Then el pedido queda aceptado
    And quedan 10 existencias

  @slice-3
  Scenario: No se acepta un pedido que no se puede servir
    Given un pedido pendiente de 5 "Dona Chocolate Keto" de un producto con 2 existencias
    When el vendedor intenta aceptarlo
    Then se le dice que no le alcanza el inventario
    And el pedido sigue pendiente
    And siguen quedando 2 existencias

  @slice-3
  Scenario: Aceptar lo último lo deja agotado para todos
    Given un pedido pendiente de 3 "Dona Chocolate Keto" de un producto con 3 existencias
    When el vendedor lo acepta
    Then quedan 0 existencias
    And su ficha lo marca como "Agotado"
    # Por la regla derivada del slice 1: is_available sale del número, no de un interruptor.

  @slice-3
  Scenario: Cancelar un pedido ya aceptado devuelve lo suyo
    Given un pedido de 2 "Dona Chocolate Keto" ya aceptado, que dejó el producto en 10
    When el vendedor lo cancela
    Then vuelven a quedar 12 existencias

  @slice-3
  Scenario: Cancelar un pedido que nunca se aceptó no devuelve nada
    Given un pedido pendiente de 2 "Dona Chocolate Keto" de un producto con 12 existencias
    When el vendedor lo cancela
    Then siguen quedando 12 existencias

  # La garantía de que esto no toca a las 418 publicaciones que no llevan la cuenta.
  @slice-3
  Scenario: Lo que no lleva inventario no estorba
    Given un pedido pendiente con un producto sin inventario y otro con 5 existencias
    When el vendedor lo acepta
    Then el pedido queda aceptado
    And el que no lleva inventario sigue sin llevarla
    And al otro le quedan 4

  @slice-3 @component
  Scenario Outline: Qué le hace cada paso al inventario
    # En Vitest y no en Playwright: son las nueve combinaciones de una regla pura, y montar nueve
    # pedidos en el navegador para leerlas sería pagar diez minutos por lo que una tabla dice mejor.
    Given un pedido que pasa de "<desde>" a "<hasta>"
    Then el inventario "<efecto>"

    Examples:
      | desde     | hasta     | efecto   | reason                                          |
      | PENDING   | CONFIRMED | descuenta | aceptar es comprometer mercancía               |
      | PENDING   | CANCELLED | no cambia | nunca llegó a descontar                        |
      | CONFIRMED | PREPARING | no cambia | ya descontó al aceptarse; no descuenta dos veces |
      | CONFIRMED | CANCELLED | devuelve  | había descontado                                |
      | PREPARING | DELIVERED | no cambia | ya descontó                                     |
      | PREPARING | CANCELLED | devuelve  | había descontado                                |

  # ---------------------------------------------------------------------------------------------
  # Slice 4 — Las existencias se editan desde la tarjeta
  # ---------------------------------------------------------------------------------------------

  # La tarjeta ya ofrece editar y marcar agotado desde el slice de `CardOwnerControls`; le falta la
  # cuenta. El argumento es el mismo que se escribió entonces: obligar a abrir cada publicación para
  # arreglar tres cosas convierte un minuto en cinco.

  @slice-4
  Scenario: Recuento sin salir de mi perfil
    Given "Dona Chocolate Keto" a 40, mía y sin inventario, en "/u/<mi-usuario>"
    When escribo 12 en su tarjeta y guardo
    Then la tarjeta dice que quedan 12
    And su ficha dice lo mismo, porque es la misma acción

  @slice-4
  Scenario: El dueño de la tienda recuenta lo que publicó otra persona
    Given un producto de "Hazlo Sano" publicado por otra cuenta, con 5 existencias
    When el dueño de la tienda abre "/tienda/hazlo-sano" y guarda 8 en su tarjeta
    Then la tarjeta dice que quedan 8
    # Hoy la tarjeta decide por `viewerId === post.user.id` y no le ofrecería nada: es el hueco
    # que el slice 1 cerró en la ficha y que este cierra en el listado.

  @slice-4
  Scenario: En la tarjeta tampoco conviven los dos mandos
    Given un producto mío con 12 existencias, en mi perfil
    When miro su tarjeta
    Then me ofrece el campo de existencias
    But no me ofrece además "marcar agotado"

  @slice-4
  Scenario: Lo que no lleva inventario conserva su interruptor
    Given un producto mío sin inventario, en mi perfil
    When miro su tarjeta
    Then me sigue ofreciendo "marcar agotado", como siempre
    And el campo de existencias está vacío, esperando el primer número

  @slice-4
  Scenario: Agotar desde la tarjeta agota en todas partes
    Given un producto mío con 1 existencia, en mi perfil
    When guardo 0 en su tarjeta
    Then su tarjeta lo marca como "Agotado"
    And su ficha también, y deja de ofrecer "Pedir por WhatsApp"

  @slice-4
  Scenario Outline: El campo sigue siendo sólo de lo que se entrega en piezas
    Given una publicación mía de tipo "<kind>" en mi perfil
    When miro su tarjeta
    Then el campo de existencias "<visibilidad>"

    Examples:
      | kind     | visibilidad | reason                                        |
      | producto | se ve       | es lo único que se cuenta en unidades         |
      | servicio | no se ve    | se vende, pero su disponibilidad es la agenda |
      | evento   | no se ve    | no se agota, caduca                           |
      | anuncio  | no se ve    | no se vende                                   |

  @slice-4
  Scenario: A quien no administra no se le ofrece, ni por la fuerza
    Given un producto de otra persona, en el perfil de esa persona
    When lo miro con mi sesión
    Then no veo campo de existencias en su tarjeta
    And forzar la acción se responde igual que en la ficha: no es suyo
