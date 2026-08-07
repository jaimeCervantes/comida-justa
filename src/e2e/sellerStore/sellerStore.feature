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

  @slice-2
  Scenario: El comprador pide por WhatsApp con el mensaje ya escrito
    Given el producto "Jugo Verde" a 40, con WhatsApp "522781126948"
    When el comprador abre su detalle
    Then "Pedir por WhatsApp" apunta a wa.me/522781126948
    And el mensaje ya trae "Jugo Verde", "$40" y el enlace a la publicación

  @slice-2
  Scenario: Desde la tienda se le puede escribir al vendedor sin elegir producto
    Given la tienda "Hazlo Sano" con teléfono "2781126948"
    When el comprador abre "/tienda/hazlo-sano"
    Then "Escribir por WhatsApp" apunta a wa.me/522781126948 con el nombre de la tienda

  @slice-2
  Scenario: Un anuncio no ofrece el botón de pedir
    Given una publicación de tipo anuncio, que no se vende
    When el comprador abre su detalle
    Then no hay botón de "Pedir por WhatsApp"

  @slice-2 @component
  Scenario Outline: El teléfono del pedido sale del primero que sirva
    # Cubierto por Vitest: hoy las 24 publicaciones tienen `contact_phone`, así que el caso
    # "ninguno" no se puede montar contra la base sin inventar un dato que no existe.
    Given una publicación con WhatsApp "<whatsapp>" y teléfono "<telefono>"
    When se arma el enlace de pedido
    Then queda "<enlace>"

    Examples:
      | whatsapp     | telefono   | enlace                | razón                                   |
      | 522781126948 | 2781126948 | wa.me/522781126948    | el WhatsApp propio manda                |
      |              | 2781092116 | wa.me/522781092116    | sin WhatsApp, el teléfono de la publicación |
      |              |            | (ningún botón)        | no se ofrece un enlace roto             |

  @slice-3
  Scenario: Doy de alta mi sucursal pegando el enlace de Google Maps
    Given que soy vendedor de la tienda "Panadería La Luz"
    When registro "Sucursal Centro" en "Calle Melchor Ocampo #2, Tezonapa, Veracruz"
      con el enlace de Google Maps que apunta a 18.6005415, -96.6872066
    Then mi tienda muestra "Dónde encontrarnos" con esa sucursal y su enlace al mapa
    And la sucursal queda guardada con esas coordenadas

  @slice-3
  Scenario: Un enlace sin coordenadas se rechaza explicando qué pegar
    Given que soy vendedor
    When registro una sucursal con un enlace del que no se pueden sacar coordenadas
    Then el formulario dice cómo copiar la dirección de Google Maps
    And no se guarda ninguna sucursal

  @slice-3
  Scenario: Un vendedor con dos sucursales las muestra las dos
    Given que soy vendedor y ya registré "Sucursal Centro"
    When registro además "Sucursal Mercado"
    Then mi tienda lista las dos

  @slice-3
  Scenario: Un producto con sucursal cerca entra en las recomendaciones del bot
    Given los productos de "Hazlo Sano", cuya sucursal está en 18.6005, -96.6872 (Tezonapa)
    When el chatbot busca con la ubicación de un cliente a 1 km y radio de 5 km
    Then "search_posts_semantic" devuelve sus productos
    But con un cliente en Xalapa, a 150 km, no devuelve ninguno

  @slice-4
  Scenario: Reservo mi dirección personal y ahí queda todo lo mío
    Given que estoy autenticado y no he reservado ninguna dirección
    When en "/cuenta" reservo el nombre de usuario
    Then "/u/<username>" existe y lista mi anuncio, no solo lo que vendo

  @slice-4
  Scenario: El perfil y la tienda se enlazan entre sí
    Given que soy vendedor con dirección personal reservada
    When un visitante abre mi perfil
    Then encuentra el enlace a mi tienda, y desde la tienda el enlace de vuelta a mi perfil

  @slice-4
  Scenario: Una dirección ya tomada se rechaza con un mensaje entendible
    Given que otra persona ya reservó "e2e-jaime"
    When intento reservar la misma
    Then el formulario dice que ya está ocupada y no me la asigna

  @slice-4
  Scenario: Un perfil que no existe responde 404
    Given que nadie reservó "no-existe"
    When un visitante abre "/u/no-existe"
    Then la respuesta es 404

  @slice-5
  Scenario: Marco un producto como agotado y deja de ofrecerse
    Given un producto disponible en mi tienda
    When lo marco como agotado desde su detalle
    Then el detalle lo muestra como "Agotado" y ya no ofrece "Pedir por WhatsApp"
    And desaparece de mi tienda para los visitantes
    But yo lo sigo viendo, para poder volver a ofrecerlo

  @slice-5
  Scenario: Edito el título y el chatbot se entera
    Given un producto mío ya indexado
    When cambio su título y su descripción en "/editar/<slug>"
    Then el detalle muestra el texto nuevo en la misma dirección de siempre
    And su embedding se regenera, porque el vector viejo describía otro texto

  @slice-5
  Scenario: Nadie puede editar lo que no publicó
    Given una publicación de otra persona
    When abro "/editar/<su-slug>"
    Then la respuesta es 404, sin revelar que la pantalla existe

  @slice-5 @component
  Scenario Outline: Lo agotado solo aplica a lo que se vende
    # Cubierto por Vitest: es una regla pura del dominio.
    Given una publicación de tipo "<kind>" con disponible = <disponible>
    When se decide qué mostrar
    Then la insignia de agotado es <insignia> y se puede pedir: <pedir>

    Examples:
      | kind     | disponible | insignia | pedir |
      | producto | true       | no       | sí    |
      | producto | false      | sí       | no    |
      | anuncio  | false      | no       | no    |

  @slice-6
  Scenario: Corrijo la ficha de mi tienda y se ve al instante
    Given que soy vendedor de "Panadería La Luz", sin descripción ni sitio web
    When en "/cuenta" escribo la descripción y "https://panaderialaluz.mx"
    Then mi tienda muestra los dos

  @slice-6
  Scenario Outline: El teléfono se revisa igual que al darse de alta
    Given que soy vendedor y "Hazlo Sano" ya tiene el teléfono "2781126948"
    When guardo mi ficha con el teléfono "<telefono>"
    Then responde "<resultado>"

    Examples:
      | telefono   | resultado                                      | razón                                  |
      | 2789995544 | guardado                                       | libre                                  |
      | 2781126948 | Ese teléfono ya está registrado en otra tienda | `sellers.phone` es UNIQUE              |
      | 123        | El teléfono debe tener 10 dígitos              | no sirve ni para llamar ni para pedir  |
      | el mío     | guardado                                       | el suyo propio no es un duplicado      |

  @slice-6
  Scenario: Nadie edita la ficha de otra tienda
    Given que no soy vendedor
    When mando el formulario de ficha de todos modos
    Then el servidor lo rechaza, porque el vendedor sale de la sesión y no del formulario

  @slice-6
  Scenario: El nombre cambia pero la dirección no se mueve
    Given que mi tienda está en "/tienda/e2e-panaderia-la-luz" y ya repartí ese enlace
    When cambio su nombre a "Panadería de Tezonapa"
    Then la tienda muestra el nombre nuevo en la misma dirección de siempre
    # Renombrar la dirección se evaluó y se descartó: ver docs/features/vendedores-y-tiendas.md

  # Era el último hueco de cercanía del sitio: el directorio, las tarjetas del catálogo y la ficha de
  # una publicación ya decían a qué distancia queda cada vendedor. La página de la tienda —a la que
  # se llega DESDE el directorio, justo después de leer ese dato— no lo decía.
  @slice-7
  Scenario Outline: A qué distancia queda la tienda, y cuándo no se puede saber
    Given que la tienda "<tienda>" tiene <sucursal>
    And que yo <ubicación> mi ubicación
    When abro "/tienda/<handle>"
    Then la página <resultado>

    Examples:
      | tienda             | handle                 | sucursal            | ubicación | resultado                 | razón                                              |
      | Panadería La Luz   | e2e-panaderia-la-luz   | una sucursal a 2 km | comparto  | dice a qué distancia      | es lo que esta feature viene a resolver            |
      | Panadería La Luz   | e2e-panaderia-la-luz   | una sucursal a 2 km | no doy    | no dice ninguna distancia | sin punto de partida no hay distancia que calcular |
      | Abarrotes Sin Mapa | e2e-abarrotes-sin-mapa | ninguna sucursal    | comparto  | no dice ninguna distancia | `MIN` de cero filas es NULL, que no es cero        |
