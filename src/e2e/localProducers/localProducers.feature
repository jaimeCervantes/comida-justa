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
  # Slice 3 — la distancia en el producto (@future)
  # El bot ya guarda `users.last_latitude`; AddBranchForm ya sabe pedir el permiso.
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario Outline: La distancia se dice en la unidad que se entiende
    Given un visitante con ubicación conocida
    And un producto de una tienda a <metros> metros
    Then la distancia se muestra como "<texto>"

    Examples:
      | metros | texto  |
      | 350    | 350 m  |
      | 1500   | 1.5 km |

  @slice-3 @future
  Scenario: Sin ubicación del visitante no se inventa una distancia
    Given un visitante que no compartió su ubicación y que el bot no conoce
    When abre un producto
    Then no se muestra ninguna distancia

  # ---------------------------------------------------------------------------
  # Slice 4 — buscar por cercanía, con red de seguridad (@future)
  # ---------------------------------------------------------------------------

  @slice-4 @future
  Scenario: La búsqueda ordena por cercanía
    Given un visitante con ubicación conocida
    When busca un producto que venden varias tiendas
    Then los resultados vienen del más cercano al más lejano

  @slice-4 @future
  Scenario: Sin nada cerca se ofrece lo lejano, no una página vacía
    Given un visitante sin ninguna tienda cerca
    When busca un producto
    Then se muestran los resultados lejanos
    And se dice que están lejos

  # ---------------------------------------------------------------------------
  # Slice 5 — mapa de tiendas al buscar un producto (@future)
  # ---------------------------------------------------------------------------

  @slice-5 @future
  Scenario: Veo en un mapa qué tiendas venden lo que busco
    Given un visitante buscando un producto
    Then un mapa sitúa las tiendas que lo venden
    And puede elegir por cercanía viéndolo, no leyendo una cifra
