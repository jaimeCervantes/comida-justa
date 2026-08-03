Feature: Quién produce lo declara, qué tan lejos lo dice la distancia

  Context:
  - Problem: no sabemos cuándo una tienda de usuario es productora local. `/productores-locales`
    lista a quien publica como productor, pero el selector de procedencia está detrás de `isAdmin`
    (`PublishForm.tsx:152`): todo lo que publica la comunidad nace con `origin = null` y el
    directorio lleva 0 tiendas desde que existe, con 1 tienda y 24 publicaciones en la base.
  - Savings: el admin deja de actualizar registros a mano para que el directorio tenga a alguien.
    El dato lo pone quien lo sabe —el vendedor— mientras ya está llenando el formulario, y lo que
    el vendedor no puede saber de sí mismo —a qué distancia está— lo pone la base.
  - Why: para mostrar productores locales **cerca** de donde está el visitante. Sin saber quién
    produce no hay a quién ordenar por cercanía; y "local" solo significa algo si son kilómetros
    sostenibles en nutrición, ambiente, costo y desperdicio.

  As un vendedor de la comunidad
  I want to decir si lo que publico lo hago yo o lo revendo, y de qué tan lejos lo traigo
  So that mi tienda aparezca entre los productores locales sin que nadie toque la base

  Background:
    Given the app is running with PostgreSQL as the database
    And el radio sostenible es de 50 km desde el ancla de la comunidad

  # ---------------------------------------------------------------------------
  # Slice 1 — el vendedor declara el rol; la distancia decide el ámbito
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario: Una tienda con ubicación entra sola al directorio de productores
    Given estoy autenticado como el vendedor de la tienda "Panadería La Luz"
    And mi tienda tiene una sucursal a 2 km del ancla de la comunidad
    When publico en "/publicar" el producto "Pan de masa madre" a 96
    And declaro la procedencia "Yo lo hago o lo cultivo"
    Then la publicación queda guardada con:
      | kind   | producto  |
      | origin | productor |
    And "/productores-locales" lista "Panadería La Luz"
    And "/negocios-locales" sigue listando "Panadería La Luz"

  @slice-1
  Scenario: Sin ubicación no hay distancia que verificar, y sin distancia no hay productor local
    Given estoy autenticado como el vendedor de la tienda "Panadería La Luz"
    And mi tienda todavía no tiene ninguna sucursal
    When publico "Pan de masa madre" declarando "Yo lo hago o lo cultivo"
    Then la publicación queda guardada con origen "productor"
    And "/negocios-locales" lista "Panadería La Luz"
    And "/productores-locales" no la lista

  @slice-1
  Scenario: Producir a más de 50 km no es producir local
    Given una tienda con una sucursal a 120 km del ancla de la comunidad
    When esa tienda publica un producto con origen "productor"
    Then "/productores-locales" no la lista
    And "/negocios-locales" sí la lista

  @slice-1
  Scenario: Lo que la tienda revende no la vuelve productora
    Given estoy autenticado como el vendedor de la tienda "Panadería La Luz"
    And mi tienda tiene una sucursal a 2 km del ancla de la comunidad
    When publico el producto "Refresco de jamaica" a 25
    And declaro la procedencia "Lo traigo de muy lejos"
    Then la publicación queda guardada con origen "reventa_lejana"
    And "/negocios-locales" lista "Panadería La Luz"
    And "/productores-locales" no la lista

  @slice-1 @component
  Scenario Outline: Cada procedencia se le ofrece a quien puede declararla
    Given el formulario de "/publicar" con tipo "producto" para un <rol>
    Then la procedencia "<origen>" está <disponibilidad>

    Examples: ofrecidas — el vendedor declara lo que sí sabe de lo suyo
      | rol      | origen             | disponibilidad | razón                                     |
      | vendedor | productor          | disponible     | es justo lo que llena el directorio       |
      | vendedor | reventa_cercana    | disponible     | le compra a un vecino                     |
      | vendedor | reventa_lejana     | disponible     | el abarrote que trae de muy lejos         |
      | admin    | hazlo_sano_propio  | disponible     | es quien puede hablar por Hazlo Sano      |
      | admin    | hazlo_sano_reventa | disponible     | lo mismo, por la vía de la reventa        |
      | admin    | productor          | disponible     | el admin conserva las cinco               |

    Examples: escondidas — solo Hazlo Sano habla por Hazlo Sano
      | rol      | origen             | disponibilidad | razón                                   |
      | vendedor | hazlo_sano_propio  | escondida      | afirmaría que el vendedor es Hazlo Sano |
      | vendedor | hazlo_sano_reventa | escondida      | lo mismo, por la vía de la reventa      |

  @slice-1 @component
  Scenario Outline: Al vendedor nunca se le pregunta qué tan lejos produce
    Given el selector de procedencia de un vendedor
    Then no existe ninguna opción que diga "<inexistente>"

    Examples: el ámbito del productor lo decide la base, no la declaración
      | inexistente                           |
      | Yo lo produzco, pero de muy lejos     |
      | Productor foráneo                     |

  @slice-1
  Scenario: Un vendedor que fuerza el request no se cuelga la marca de Hazlo Sano
    Given estoy autenticado como un vendedor cualquiera
    When envío un producto con procedencia "hazlo_sano_propio" en un request forjado
    Then el servidor descarta esa procedencia
    And la publicación se rechaza por quedarse sin procedencia
    And no se crea ninguna publicación

  @slice-1 @component
  Scenario Outline: La procedencia se exige donde significa algo
    Given el formulario de "/publicar" con tipo "<kind>"
    When envío "<titulo>" sin elegir procedencia
    Then el resultado es "<resultado>"

    Examples:
      | kind     | titulo                 | resultado                            | razón                                   |
      | producto | Pan de masa madre      | error de validación, no se crea nada | sin el dato el directorio sigue vacío   |
      | anuncio  | Clase de yoga sabatina | se publica                           | un anuncio no tiene origen que declarar |

  @slice-1 @component
  Scenario Outline: La pregunta se lee desde el lado del vendedor, no del catálogo
    Given el selector de procedencia en locale "<locale>"
    Then la opción "<origen>" se lee "<pregunta>"

    Examples:
      | origen          | locale | pregunta                              |
      | productor       | es     | Yo lo hago o lo cultivo               |
      | productor       | en     | I make it or grow it myself           |
      | reventa_cercana | es     | Se lo compro a alguien de aquí cerca  |
      | reventa_lejana  | es     | Lo traigo de muy lejos                |

  @slice-1 @component
  Scenario Outline: La insignia solo afirma lo que el dato respalda
    Given un producto con origen "<origen>"
    When un visitante ve su tarjeta
    Then la insignia dice "<insignia>"

    Examples:
      | origen            | insignia               | razón                                          |
      | hazlo_sano_propio | 🌿 Hazlo Sano          | sin cambio                                     |
      | productor         | Lo hace quien lo vende | la locación no se sabe sin consultar distancia |
      | reventa_cercana   | Local                  | el vendedor lo declaró y lo respalda           |
      | reventa_lejana    | (ninguna)              | no hay nada que presumir                       |

  @slice-1
  Scenario: Lo publicado antes de la regla se queda como está
    Given el producto que ya existía sin procedencia
    When un visitante abre su página
    Then se muestra sin insignia de procedencia
    And no se le pide nada a nadie para seguir visible

  # ---------------------------------------------------------------------------
  # Slice 2 — corregir la procedencia de lo ya publicado
  # ---------------------------------------------------------------------------

  @slice-2
  Scenario: Corrijo la procedencia de un producto que declaré mal
    Given un producto mío "Pan de masa madre" publicado como "reventa_cercana"
    When lo edito y declaro "Yo lo hago o lo cultivo"
    Then su procedencia queda como "productor"
    And el resto de la publicación no se movió:
      | title | Pan de masa madre |
      | slug  | el mismo de antes |

  @slice-2
  Scenario: El producto que quedó sin procedencia se pone al día al editarlo
    Given el producto anterior a la regla, con procedencia nula
    When su dueño lo edita
    Then el formulario le pide la procedencia antes de dejarlo guardar
    And al declararla, el producto deja de estar sin especificar

  @slice-2 @component
  Scenario Outline: Corregir no es una puerta trasera para la marca de Hazlo Sano
    Given un <rol> editando un producto propio
    Then la procedencia "<origen>" está <disponibilidad>

    Examples:
      | rol      | origen            | disponibilidad | razón                                    |
      | vendedor | productor         | disponible     | corregir es el punto del slice           |
      | vendedor | hazlo_sano_propio | escondida      | mismas reglas que al publicar            |
      | admin    | hazlo_sano_propio | disponible     | es quien puede hablar por Hazlo Sano     |

  @slice-2
  Scenario: Un vendedor que fuerza la corrección tampoco se cuelga la marca
    Given un vendedor editando un producto propio
    When envía "hazlo_sano_propio" en un request forjado
    Then el servidor descarta esa procedencia
    And la edición se rechaza en vez de guardar el producto sin procedencia

  @slice-2 @component
  Scenario: A un anuncio se le sigue sin preguntar de dónde viene
    Given un anuncio propio en edición
    Then no se muestra ningún selector de procedencia

  # ---------------------------------------------------------------------------
  # Slice 3 — la distancia en el producto
  # Dos fuentes para la ubicación de quien mira: la cookie que deja el botón, y
  # `users.last_latitude`, que el bot de WhatsApp ya llena desde la migración 69113f019ca5.
  # ---------------------------------------------------------------------------

  @slice-3 @component
  Scenario Outline: La distancia se dice en la unidad que se entiende
    Given un producto de una tienda a <metros> metros de quien mira
    Then la distancia se muestra como "<texto>"

    Examples:
      | metros | texto  | razón                                        |
      | 350    | 350 m  | debajo del kilómetro se cuentan metros       |
      | 999    | 999 m  | el salto es en el kilómetro exacto           |
      | 1500   | 1.5 km | encima, un decimal basta para decidir        |
      | 1483   | 1.5 km | fingir precisión sobre un GPS es fingir dos veces |

  @slice-3
  Scenario: Quien comparte su ubicación ve a qué distancia está la tienda
    Given una tienda con sucursal a 2 km de quien mira
    When abre uno de sus productos habiendo compartido su ubicación
    Then ve que está "a 2 km"

  @slice-3
  Scenario: Sin ubicación no se inventa una distancia, se ofrece compartirla
    Given un visitante que no compartió su ubicación y que el bot no conoce
    When abre un producto
    Then no se muestra ninguna distancia
    And se le ofrece compartir su ubicación

  @slice-3
  Scenario: Negar el permiso no rompe nada
    Given un visitante que niega el permiso de ubicación
    Then se le dice una vez que sin ubicación no hay distancias
    And el listado le sigue saliendo con lo más reciente primero

  # ---------------------------------------------------------------------------
  # Slice 4 — buscar por cercanía, con red de seguridad (@future)
  # ---------------------------------------------------------------------------

  @slice-4
  Scenario: El catálogo sale del más cercano al más lejano
    Given una tienda a 2 km y otra a 120 km, cada una con su producto
    When un visitante con ubicación conocida abre "/productos"
    Then el de la tienda de 2 km aparece antes que el de la de 120 km

  @slice-4
  Scenario: Lo que no tiene ubicación no desaparece del catálogo
    Given un producto publicado por alguien sin tienda
    When un visitante con ubicación conocida abre "/productos"
    Then el producto sigue apareciendo, al final y sin distancia

  @slice-4
  Scenario: Sin nada cerca se ofrece lo lejano, no una página vacía
    Given un visitante a cuyo alrededor no hay ninguna tienda dentro de los 50 km
    When abre "/productos"
    Then se muestran los resultados lejanos
    And se le dice que eso es lo que hay, aunque quede lejos

  @slice-4
  Scenario: Sin ubicación, lo más reciente primero
    Given un visitante que no compartió su ubicación
    When abre "/productos"
    Then el catálogo sale por fecha descendente, como siempre
    And no se le muestra ninguna distancia

  # ---------------------------------------------------------------------------
  # Slice 5 — mapa de tiendas al buscar un producto (@future)
  # ---------------------------------------------------------------------------

  @slice-5
  Scenario: Veo en un mapa qué tiendas venden lo que busco
    Given un visitante con ubicación conocida en "/productos"
    Then un mapa sitúa las tiendas que tienen catálogo y dirección pública
    And se sitúa también a él, porque un mapa donde no te ves no ayuda a decidir
    And cada pin enlaza a la tienda y dice a qué distancia está

  @slice-5
  Scenario: Sin ubicación no hay mapa
    Given un visitante que no compartió su ubicación
    When abre "/productos"
    Then no se pinta ningún mapa

  # ---------------------------------------------------------------------------
  # Slice 6 — la cercanía en todo el sitio, y por qué falta cuando falta
  # ---------------------------------------------------------------------------

  @slice-6
  Scenario: El home también pide la ubicación y pone distancias
    Given un visitante con ubicación conocida
    When abre el home
    Then cada publicación de una tienda con sucursal dice a qué distancia está
    And el orden sigue siendo cronológico, porque el home es un feed

  @slice-6
  Scenario Outline: La distancia solo aparece donde hay a quién medirla
    Given una publicación de tipo "<kind>" publicada por <autor>
    When un visitante con ubicación conocida la ve en el home
    Then la distancia <resultado>

    Examples:
      | kind     | autor                              | resultado                          |
      | producto | una tienda con sucursal            | se muestra                         |
      | anuncio  | una tienda con sucursal            | se muestra: un aviso también ocurre en algún lado |
      | producto | una tienda sin sucursal            | no se muestra: no hay dónde medir  |
      | anuncio  | alguien que todavía no es vendedor | no se muestra: no hay tienda       |

  @slice-6
  Scenario Outline: Cada sección dice por qué no está mostrando cercanía
    Given un visitante que no compartió su ubicación
    When abre "<seccion>"
    Then se le explica que sin su ubicación no hay cercanía que mostrar
    And se le ofrece compartirla

    Examples:
      | seccion               |
      | /                     |
      | /productos            |
      | /negocios-locales     |
      | /productores-locales  |

  @slice-6
  Scenario: Negarse recibe un incentivo, no un reproche
    Given un visitante en el home
    When niega el permiso de ubicación
    Then se le dice qué se gana compartiéndola, no que hizo algo mal
    And puede volver a compartirla cuando quiera

  @slice-6
  Scenario: A quien no vende se le explica que vender exige tienda con ubicación
    Given un visitante sin tienda y sin ubicación compartida
    When abre cualquiera de las secciones
    Then se le dice que para que lo encuentren por cercanía necesita abrir su tienda
    And se le enlaza a "/cuenta"

  @slice-6
  Scenario: A quien ya tiene tienda no se le repite el consejo
    Given un vendedor con tienda, sin ubicación compartida
    When abre el home
    Then ve el aviso de ubicación
    But no ve la invitación a abrir tienda

  # ---------------------------------------------------------------------------
  # Slice 7 — arreglar lo propio sin salir del listado
  # ---------------------------------------------------------------------------

  @slice-7 @component
  Scenario Outline: Los controles de dueño aparecen solo en lo propio
    Given una publicación de "<dueño>" de tipo "<kind>"
    When la ve <quien> en forma de tarjeta
    Then <resultado>

    Examples:
      | dueño   | kind     | quien             | resultado                                    |
      | user-1  | producto | user-1            | se le ofrece editar y marcar agotado         |
      | user-1  | producto | otra persona      | no se le ofrece nada                         |
      | user-1  | producto | nadie, sin sesión | no se le ofrece nada                         |
      | user-1  | anuncio  | user-1            | solo se le ofrece editar: un anuncio no se agota |

  @slice-7
  Scenario: Marco agotado desde el listado y el listado lo refleja
    Given un producto mío disponible, visto como tarjeta
    When lo marco agotado sin abrir su página
    Then la tarjeta pasa a mostrarlo agotado
    And su página también, porque es el mismo dato

  @slice-7
  Scenario: El mapa no tapa el submenú del header
    Given un visitante con ubicación conocida en "/productos"
    When despliega el submenú "Comunidad"
    Then el submenú se ve por encima del mapa

  # ---------------------------------------------------------------------------
  # Slice 9 — publicar sin tienda deja de ser un callejón
  # ---------------------------------------------------------------------------

  @slice-9
  Scenario: Abrir la tienda recoge lo que ya se había publicado
    Given alguien que publicó dos veces antes de tener tienda
    When abre su tienda
    Then sus dos publicaciones cuelgan de ella
    And aparecen en su catálogo y ya pueden decir a qué distancia están

  @slice-9
  Scenario: Abrir una tienda no toca lo que cuelga de otra
    Given una publicación que ya pertenece a otra tienda
    When alguien abre una tienda nueva
    Then esa publicación se queda donde estaba

  @slice-9
  Scenario: Después de publicar sin tienda, se le dice qué le falta
    Given alguien sin tienda que acaba de publicar
    When ve su publicación
    Then se le explica que no aparece en los directorios ni puede decir su distancia
    And se le enlaza a abrir su tienda

  @slice-9
  Scenario: A quien sí tiene tienda no se le dice nada
    Given un vendedor con tienda que acaba de publicar
    When ve su publicación
    Then no se le ofrece abrir ninguna tienda

  @slice-9 @component
  Scenario Outline: El aviso del formulario es solo para quien se declara productor sin tienda
    Given el formulario de "/publicar" con tipo "producto" de alguien <tienda>
    When elige la procedencia "<origen>"
    Then el aviso de que necesita tienda <resultado>

    Examples:
      | tienda      | origen          | resultado                                        |
      | sin tienda  | productor       | se muestra: sin tienda esa declaración no cuenta |
      | sin tienda  | reventa_cercana | no se muestra: revender no exige declararse productor |
      | con tienda  | productor       | no se muestra: ya la tiene                       |

  # ---------------------------------------------------------------------------
  # Slice 10 — dónde está la tienda de lo que estoy viendo
  # ---------------------------------------------------------------------------

  @slice-10
  Scenario: El detalle sitúa la tienda de la publicación
    Given una publicación de una tienda con sucursal
    When alguien abre su página
    Then debajo de las publicaciones recomendadas ve un mapa con esa tienda

  @slice-10
  Scenario: El mapa no depende de que el visitante comparta su ubicación
    Given un visitante que no compartió la suya
    When abre esa publicación
    Then el mapa sigue apareciendo, centrado en la tienda
    But no se pinta su propio pin ni ninguna distancia

  @slice-10
  Scenario: En móvil el mapa va antes de los comentarios
    Given una publicación de una tienda con sucursal
    When alguien la abre en un teléfono
    Then el mapa aparece después del producto y antes de los comentarios

  @slice-10
  Scenario: En escritorio el mapa va debajo de las recomendadas
    Given la misma publicación
    When alguien la abre en una pantalla ancha
    Then el mapa queda debajo de la columna de recomendadas, a todo el ancho

  @slice-10
  Scenario: Sin tienda situada no hay mapa que enseñar
    Given una publicación sin tienda, o de una tienda sin sucursal
    When alguien abre su página
    Then no se pinta ningún mapa

  @slice-5 @component
  Scenario Outline: El encuadre incluye a quien mira
    Given un visitante y <tiendas> tienda(s) que situar
    Then el encuadre <resultado>

    Examples:
      | tiendas | resultado                                        |
      | 2       | va del extremo más al sur al más al norte de los tres |
      | 0       | no existe: un mapa con un solo pin no dice nada  |
