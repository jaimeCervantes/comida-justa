Feature: Vendedores y tiendas

  Context:
  - Problem: hoy no existe la figura de vendedor en el sitio. `sellers` tiene una sola fila
    ("Hazlo Sano", sin `user_id`) creada a mano para el chatbot, y las 24 publicaciones cuelgan
    directo de `users`. Quien se registra y produce algo no tiene dónde decir quién es ni una URL
    a la que mandar a sus clientes: sus productos quedan sueltos en un feed cronológico.
  - Savings: una tienda es una URL que el vendedor pega en su WhatsApp o en una etiqueta impresa,
    en vez de explicar su catálogo una conversación a la vez. Del lado del código, la tienda es un
    `WHERE seller_id = ...` sobre el pipeline de publicaciones que ya existe, no un módulo nuevo.
  - Why: la visión es que todo usuario registrado sea vendedor y que el catálogo sea lo que publica
    la comunidad. Sin vendedor no hay tienda, sin tienda no hay a dónde mandar al comprador, y sin
    sucursal el bot no puede recomendar por cercanía.

  As a persona registrada que produce o revende comida sana
  I want to darme de alta como vendedor y tener mi propia página de productos
  So that pueda mandar a mis clientes a un solo lugar donde ver todo lo que vendo

  @slice-1
  Scenario: Me doy de alta como vendedor y mi tienda queda en línea
    Given estoy autenticado y todavía no soy vendedor
    When abro "/cuenta" y envío el alta con nombre "Panadería La Luz" y teléfono "2789990011"
    Then la página me confirma que mi tienda ya existe y me enlaza a "/tienda/e2e-panaderia-la-luz"
    And "/tienda/e2e-panaderia-la-luz" muestra "Panadería La Luz" y el teléfono "2789990011"

  @slice-1
  Scenario: Lo que publico después queda en mi tienda
    Given que ya soy vendedor de la tienda "Panadería La Luz"
    When publico el producto "Pan de masa madre" en "/publicar"
    Then "Pan de masa madre" aparece en el catálogo de "/tienda/e2e-panaderia-la-luz"

  @slice-1
  Scenario: La tienda de Hazlo Sano lista lo que ya tenía vendedor
    Given que los 13 productos de Hazlo Sano ya llevan su `seller_id` en la base
    When un visitante abre "/tienda/hazlo-sano"
    Then ve "Jugo Verde" a 40 y "Suero natural" a 35 sin haber migrado ningún dato

  @slice-1
  Scenario Outline: El alta rechaza lo que la base no puede guardar dos veces
    Given estoy autenticado y todavía no soy vendedor
    When envío el alta con nombre "<nombre>" y teléfono "<telefono>"
    Then el formulario responde "<mensaje>" y no se crea ninguna tienda

    Examples: rechazadas — la unicidad la exige la base, el mensaje lo da el dominio
      | nombre       | telefono   | mensaje                                        | razón                                  |
      | Hazlo Sano   | 2789990022 | Ese nombre de tienda ya está ocupado           | el handle `hazlo-sano` ya existe       |
      | Mi Changarro | 2781126948 | Ese teléfono ya está registrado en otra tienda | `sellers.phone` es UNIQUE (Hazlo Sano) |

  @slice-1 @component
  Scenario Outline: El alta rechaza un borrador que no se puede guardar
    # Cubierto por Vitest sobre el caso de uso: el navegador ni siquiera deja enviar el formulario
    # (`required` y `pattern`), así que por Playwright estas filas nunca llegarían al servidor.
    # La regla se prueba igual, porque un request armado a mano sí llega.
    Given un borrador de tienda con nombre "<nombre>" y teléfono "<telefono>"
    When el caso de uso lo procesa
    Then responde "<mensaje>" y no guarda nada

    Examples: rechazadas — forma del dato
      | nombre       | telefono   | mensaje                               | razón                                    |
      |              | 2789990033 | El nombre de la tienda es obligatorio | `sellers.name` es NOT NULL               |
      | Mi Changarro | 123        | El teléfono debe tener 10 dígitos     | no sirve para contactar ni para WhatsApp |

  @slice-1 @component
  Scenario Outline: El nombre de la tienda se convierte en una dirección web usable
    # Cubierto por Vitest: es una regla pura del dominio, sin navegador de por medio.
    Given un vendedor que escribe "<nombre>" como nombre de su tienda
    When se calcula su dirección
    Then la tienda queda en "<handle>"

    Examples:
      | nombre                | handle               |
      | Panadería La Luz      | panaderia-la-luz     |
      | Hazlo Sano            | hazlo-sano           |
      | Tortillería  "El Sol" | tortilleria-el-sol   |
      | Café  &  Té           | cafe-te              |

  @slice-1
  Scenario: Ya tengo tienda, así que la cuenta no me vuelve a ofrecer el alta
    Given que ya soy vendedor de la tienda "Panadería La Luz"
    When abro "/cuenta"
    Then veo el enlace a mi tienda en vez del formulario de alta

  @slice-1
  Scenario: Una tienda que no existe responde 404
    Given que no hay ninguna tienda con la dirección "no-existe"
    When un visitante abre "/tienda/no-existe"
    Then la respuesta es 404

  @slice-2 @future
  Scenario: El comprador pide por WhatsApp con el mensaje ya escrito
    Given un producto "Jugo Verde" a 40 en la tienda "Hazlo Sano"
    When el comprador toca "Pedir por WhatsApp"
    Then se abre wa.me con el nombre del producto, su precio y el enlace a la publicación

  @slice-2 @future
  Scenario: Sin ningún teléfono utilizable no se ofrece un enlace roto
    Given un producto sin WhatsApp propio y una tienda sin teléfono
    When el comprador abre el detalle
    Then el botón de WhatsApp no se muestra

  @slice-3 @future
  Scenario: Doy de alta mi sucursal pegando el link de Google Maps
    Given que soy vendedor de la tienda "Panadería La Luz"
    When registro una sucursal con la dirección y su link de Google Maps
    Then la sucursal queda guardada con coordenadas y se ve en mi tienda

  @slice-3 @future
  Scenario: Un link sin coordenadas se rechaza explicando qué pegar
    Given que soy vendedor
    When registro una sucursal con un link del que no se pueden extraer coordenadas
    Then el formulario explica qué enlace se espera y no guarda la sucursal

  @slice-4 @future
  Scenario: Mi perfil público muestra todo lo mío, no solo lo que vendo
    Given que soy vendedor y también publico anuncios
    When un visitante abre "/u/<username>"
    Then ve mis anuncios y mis productos, y un enlace a mi tienda

  @slice-5 @future
  Scenario: Marco un producto como agotado y deja de ofrecerse
    Given un producto disponible en mi tienda
    When lo marco como agotado
    Then desaparece de mi tienda y el chatbot deja de recomendarlo
