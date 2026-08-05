Feature: La ubicación se vuelve a detectar, porque la gente se mueve

  Context:
  - Problem: la ubicación se pide una sola vez y se guarda un año (`locationCookie.ts:10`). En
    cuanto existe la cookie, el aviso y el botón dejan de pintarse, así que no queda ninguna vía
    para corregirla. `users.location_updated_at` se escribe y nunca se lee. Consultada la base el
    2026-08-05, las cinco ubicaciones que guardó el bot tienen 2.2, 2.5, 10.2, 10.6 y 137 días: a
    una persona real se le miden distancias desde donde estaba hace cuatro meses y medio.
  - Savings: viajes en falso y compras descartadas por una distancia equivocada; y el caso "estoy
    en otra ciudad", que hoy no tiene respuesta ninguna.
  - Why: la cercanía es el argumento entero del sitio —nutrición, transporte, costo, desperdicio—.
    Una distancia falsa no es un dato incompleto, es un dato que engaña justo en la decisión que el
    sitio existe para ayudar a tomar.

  As alguien que se mueve entre su casa, su trabajo y otros estados
  I want que el sitio note dónde estoy ahora, no dónde estaba la primera vez
  So that las distancias que leo sean ciertas donde quiera que esté

  Background:
    Given the app is running with PostgreSQL as the database
    And el radio sostenible es de 50 km desde el ancla de la comunidad
    And la tienda "Hazlo Sano" tiene su sucursal exactamente en el ancla

  # ---------------------------------------------------------------------------
  # Slice 1 — la ubicación tiene edad, y la fuente más fresca gana
  # ---------------------------------------------------------------------------

  @slice-1 @component
  # Vitest: es aritmética de dominio pura, no necesita navegador.
  Scenario Outline: Una posición se considera vieja a partir de las 6 horas
    Given una ubicación guardada hace <horas> horas
    When el sitio decide si volver a preguntarla
    Then la respuesta es <caduca>

    Examples:
      | horas | caduca | reason                                        |
      | 0     | false  | recién compartida                             |
      | 5.9   | false  | dentro del margen                             |
      | 6     | true   | el límite es inclusivo, como el radio de 50km |
      | 24    | true   | de ayer                                       |
      | 3288  | true   | los 137 días que hay hoy en la base           |

  @slice-1 @component
  Scenario Outline: Solo un movimiento real merece molestar al servidor
    Given una ubicación guardada en el ancla de la comunidad
    And una lectura nueva a <metros> metros de ahí
    When el sitio decide si guardarla
    Then la guarda: <guarda>

    Examples:
      | metros | guarda | reason                                          |
      | 0      | false  | no se movió                                     |
      | 120    | false  | ruido de GPS, el texto de la tarjeta no cambia  |
      | 500    | true   | el umbral es inclusivo                          |
      | 2000   | true   | dos kilómetros ya cambian a quién tienes cerca  |

  @slice-1 @component
  Scenario Outline: Entre la cookie y lo que guardó el bot, gana la más reciente
    Given una cookie compartida hace <cookie>
    And la columna `users.location_updated_at` con fecha de hace <columna>
    When el sitio decide desde dónde medir
    Then usa <fuente>

    Examples:
      | cookie   | columna  | fuente  | reason                                     |
      | 10 min   | 2 días   | cookie  | la del navegador es más nueva              |
      | 137 días | 1 hora   | columna | compartió su ubicación por WhatsApp de viaje |
      | sin fecha| 2 días   | cookie  | cookie vieja del formato anterior: gana ella |
      | 1 hora   | sin dato | cookie  | el bot nunca supo de esta persona          |

  @slice-1
  Scenario: Una cookie del formato anterior se sigue leyendo
    Given una cookie "hs_location" con el valor "18.6005415256606,-96.6872065729976"
    When abro "/productos"
    Then "Jugo Verde" muestra su distancia
    And no se rompe nada por no traer fecha

  # ---------------------------------------------------------------------------
  # Slice 2 — se vuelve a detectar sola
  # ---------------------------------------------------------------------------

  @slice-2
  Scenario: Con el permiso ya concedido, las distancias aparecen sin que yo toque nada
    Given le concedí el permiso de ubicación a este sitio
    And el navegador me sitúa a 2 km del ancla
    And no tengo ninguna cookie de ubicación
    When abro "/productos"
    Then "Jugo Verde" muestra "a 2 km"
    And nunca apreté ningún botón

  @slice-2
  Scenario: Me fui a otro estado y el sitio se entera solo
    Given le concedí el permiso de ubicación a este sitio
    And tengo una ubicación guardada a 2 km del ancla
    When el navegador me sitúa a 40 km del ancla
    And recargo "/productos"
    Then "Jugo Verde" muestra "a 40 km"

  @slice-2
  Scenario: Sin permiso concedido no se abre ningún diálogo por su cuenta
    Given no le he concedido el permiso de ubicación a este sitio
    And tengo una ubicación guardada a 2 km del ancla
    When abro "/productos"
    Then "Jugo Verde" sigue mostrando "a 2 km"
    And el navegador no me preguntó nada

  @slice-2 @component
  Scenario: Un movimiento pequeño no dispara una escritura
    Given una ubicación guardada hace 10 minutos
    And el navegador devuelve un punto a 120 metros
    When el refrescador decide
    Then no llama a la server action
    And no se revalida el árbol de rutas

  # ---------------------------------------------------------------------------
  # Slice 3 — siempre se puede corregir a mano
  # ---------------------------------------------------------------------------

  @slice-3
  Scenario Outline: Donde antes había silencio ahora hay un control
    Given tengo una ubicación guardada a 2 km del ancla
    When abro "<ruta>"
    Then veo el chip de ubicación
    And el chip ofrece actualizarla

    Examples:
      | ruta                  |
      | /                     |
      | /productos            |
      | /categoria/jugos      |
      | /negocios-locales     |
      | /productores-locales  |

  @slice-3
  Scenario: El chip dice desde cuándo es el dato
    Given tengo una ubicación guardada hace 2 horas
    When abro "/productos"
    Then el chip dice que la ubicación es de hace 2 horas

  @slice-3
  Scenario: Sin ubicación sigue apareciendo el aviso de siempre, no el chip
    Given no tengo ninguna ubicación guardada
    When abro "/productos"
    Then veo el aviso que explica por qué no hay distancias
    And no veo el chip

  # ---------------------------------------------------------------------------
  # Slice 4 — el radio de "local" se mide desde ti
  # ---------------------------------------------------------------------------

  @slice-4
  Scenario: Un productor a 2 km de mí es local aunque yo esté lejos del ancla
    Given la tienda "Panadería La Luz" publicó un producto como productor
    And su sucursal está a 300 km del ancla de la comunidad
    And estoy a 2 km de esa sucursal
    When abro "/productores-locales"
    Then la lista incluye "Panadería La Luz"

  @slice-4
  Scenario: A mil kilómetros no veo una página en blanco
    Given la tienda "Panadería La Luz" publicó un producto como productor
    And su sucursal está en el ancla de la comunidad
    And estoy a 1000 km del ancla
    When abro "/productores-locales"
    Then la lista incluye "Panadería La Luz"
    And veo el aviso de que no hay nada cerca de mí

  @slice-4
  Scenario: Sin ubicación, el ancla sigue siendo la de la comunidad
    Given no tengo ninguna ubicación guardada
    And la tienda "Panadería La Luz" publicó un producto como productor
    And su sucursal está a 300 km del ancla de la comunidad
    When abro "/productores-locales"
    Then la lista no incluye "Panadería La Luz"
