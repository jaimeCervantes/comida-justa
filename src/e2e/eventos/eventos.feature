Feature: Que en los cuatro pilares se pueda hacer algo, no solo comprar comida

  Context:
  - Problem: tres de los cuatro pilares son decorativos. `movimiento_y_ejercicio`,
    `mente_y_espiritu` y `sueno_y_descanso` existen, están activos, tienen su página — y CERO
    publicaciones. Toda la maquinaria del sitio sirve para vender mercancía, así que un grupo que
    corre, un taller de sueño o una meditación no tienen dónde vivir: solo pueden escribir un texto
    que se hunde en un feed ordenado por reciente.
  - Savings: se acaban los rodeos —fingir que un servicio es un producto, escribir la fecha dentro
    del texto— y el sitio deja de prometer cuatro pilares mientras entrega uno.
  - Why: es lo que convierte "comida justa" en el sitio de bienestar que su propia taxonomía dice
    que es.

  As un grupo, un taller o un consultorio de la comunidad
  I want publicar algo que OCURRE, con su fecha
  So that la gente sepa cuándo y dónde, en vez de leer un texto que ya caducó

  Background:
    Given the app is running with PostgreSQL as the database
    And the four pillars already exist as active level-1 categories

  # ---------------------------------------------------------------------------
  # Slice 1 — `evento` con su fecha
  #
  # El único hueco sin ningún sustituto. No toca pedidos, ni mapas, ni Python.
  #
  # `kind` es `text` SIN CHECK en la base y lo valida `isValidKind`, así que
  # sumar el tipo no cuesta migración. Lo que sí la cuesta es `starts_at`.
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario Outline: Un evento desbloquea el pilar que hoy está vacío
    Given a signed-in user on "/publicar"
    When this user publishes an "evento" with:
      | title    | <title>    |
      | category | <pilar>    |
      | starts   | <cuando>   |
    Then the post is saved with kind "evento" and that date
    And it is listed on the page of "<pilar>" showing when it happens

    # Los tres pilares de abajo tienen HOY cero publicaciones. Esta tabla es la
    # feature entera: si alguna fila falla, el pilar sigue decorativo.
    Examples: los tres pilares huérfanos
      | title                              | pilar                   | cuando               |
      | Rodada del sábado en el kiosco     | movimiento_y_ejercicio  | 2026-08-22 06:00     |
      | Taller de higiene del sueño        | sueno_y_descanso        | 2026-08-25 19:00     |
      | Meditación guiada en el parque     | mente_y_espiritu        | 2026-08-23 07:30     |

    Examples: y el que ya funcionaba sigue funcionando
      | title                              | pilar                   | cuando               |
      | Taller de cocina sin azúcar        | alimentacion            | 2026-08-29 17:00     |

  # La regla que más se puede diseñar mal: que un evento caduque NO lo decide
  # nadie apagando una bandera, lo decide el reloj. Corrida de escritorio.
  @slice-1 @component
  Scenario Outline: Próximo, en curso o ya pasó — derivado, no declarado
    Given an event that starts "<inicio>" and ends "<fin>"
    When it is read at "<ahora>"
    Then its state is "<estado>"

    Examples:
      | inicio           | fin              | ahora            | estado    |
      | 2026-08-22 06:00 |                  | 2026-08-21 20:00 | proximo   |
      | 2026-08-22 06:00 |                  | 2026-08-22 05:59 | proximo   |
      | 2026-08-22 06:00 |                  | 2026-08-22 06:01 | pasado    |
      | 2026-08-22 06:00 | 2026-08-22 08:00 | 2026-08-22 07:00 | en_curso  |
      | 2026-08-22 06:00 | 2026-08-22 08:00 | 2026-08-22 08:01 | pasado    |
      | 2026-08-22 06:00 | 2026-08-22 08:00 | 2026-08-22 06:00 | en_curso  |

  # Un evento que pasó NO desaparece: es historia, y suele ser la que tiene las
  # fotos. Lo que deja de hacer es anunciarse como próximo.
  @slice-1
  Scenario: Lo que ya pasó se queda, pero deja de anunciarse
    Given the event "Rodada del sábado en el kiosco" whose date already passed
    When a visitor opens the page of "movimiento_y_ejercicio"
    Then the event is still reachable with its photos
    And it is not presented as upcoming

  # Cada tipo tiene SUS reglas, y viven donde ya viven las de producto
  # (`validateKindAndOrigin`). La tabla existe para que se lean juntas.
  @slice-1 @component
  Scenario Outline: Qué se le exige a cada tipo
    Given a publication of kind "<kind>"
    When it is validated with price "<precio>" and origin "<origen>" and date "<fecha>"
    Then it is "<resultado>"

    Examples: lo que ya era cierto y no cambia
      | kind     | precio | origen              | fecha            | resultado |
      | producto | 35     | hazlo_sano_propio   |                  | valida    |
      | producto |        | hazlo_sano_propio   |                  | rechazada |
      | producto | 35     |                     |                  | rechazada |
      | anuncio  |        |                     |                  | valida    |

    Examples: lo que trae el evento
      | kind    | precio | origen | fecha            | resultado | razon                              |
      | evento  |        |        | 2026-08-22 06:00 | valida    | un evento gratis es normal          |
      | evento  | 150    |        | 2026-08-22 06:00 | valida    | y uno de paga también               |
      | evento  | 150    |        |                  | rechazada | sin fecha no es un evento           |

  # La procedencia responde "¿lo haces o lo revendes?", y eso solo significa
  # algo en mercancía. Preguntárselo a un evento es pedir un dato vacío.
  @slice-1
  Scenario: Al publicar un evento no se pregunta la procedencia
    Given a signed-in user on "/publicar"
    When this user chooses kind "evento"
    Then the origin selector is not shown
    And the date field is shown and required
    And the price field is shown but optional

  @slice-1
  Scenario: Las 27 publicaciones que ya existen no cambian
    Given the migration that adds the event date is applied
    Then every pre-existing post keeps kind "anuncio" or "producto"
    And none of them has a date
    And the home feed shows the same posts as before

  # Sin sub-categorías, los tres pilares vacíos no tienen dónde colgar nada.
  # `/admin/catalogo` ya las crea sin migración: es configuración, no código.
  @slice-1
  Scenario: El admin abre sub-categorías para los pilares vacíos
    Given a signed-in admin on "/admin/catalogo"
    When this admin adds a sub-category under "movimiento_y_ejercicio"
    Then it is offered by "/publicar" without any migration
    And an event can be published under it

  # ---------------------------------------------------------------------------
  # Slice 2 — la ruta, por GPX
  #
  # Entregado el 2026-08-16 y corregido el 2026-08-17: el archivo viajaba dentro
  # del cuerpo de la Server Action y en produccion reventaba con
  # `Body exceeded 1 MB limit` (413), perdiendo todo lo escrito. Ahora se
  # interpreta en el navegador y lo que viaja son los puntos que se guardan.
  # ---------------------------------------------------------------------------

  @slice-2 @future
  Scenario: Subir un GPX le pone recorrido a un evento
    Given an event published by a running group
    When its author uploads a ".gpx" file
    Then the route is drawn on the map
    And its length in kilometres is shown, calculated by the database

  # El fallo de produccion, escrito como regla. Lo cubre Vitest
  # (`RouteFileField.test.tsx`) porque lo observable es que el campo del
  # formulario lleva los puntos y no el archivo, y eso se ve sin navegador.
  @slice-2 @component
  Scenario Outline: Lo que viaja no depende del tamano del archivo
    Given a ".gpx" with <puntos_del_archivo> points
    When its author picks it on "/publicar"
    Then the form carries <puntos_que_viajan> points
    And the file itself never leaves the browser

    # 2.000 es `MAX_ROUTE_POINTS`, y el punto de mas es el ultimo del original,
    # que `reducePoints` conserva para no mover donde la ruta termina.
    Examples:
      | puntos_del_archivo | puntos_que_viajan | razon                            |
      | 2                  | 2                 | una ruta corta viaja entera      |
      | 10000              | 2001              | una larga viaja ya reducida      |

  # Leerlo en el navegador adelanta el aviso: antes habia que enviar el
  # formulario entero para enterarse de que el archivo no servia.
  @slice-2 @component
  Scenario Outline: Un archivo que no sirve se rechaza al elegirlo
    Given someone on "/publicar" publishing an event
    When they pick a file that is <problema>
    Then the error explains what is wrong before submitting anything
    And the form carries no route

    Examples:
      | problema                        |
      | not a GPX at all                |
      | a GPX with a single point       |
      | heavier than the reading limit  |

  # Interpretarlo en el cliente hace que los puntos sean datos del cliente, y de
  # ahi van derechos a ST_GeogFromText. Corrida de escritorio en
  # `routeFile.test.ts`; cada fila es algo que NO puede llegar a la base.
  @slice-2 @component
  Scenario Outline: Lo que llega al servidor se comprueba antes de guardarlo
    Given a form that submits <recorrido> as its route
    When the Server Action reads it
    Then it is "<resultado>"

    Examples: se guarda
      | recorrido                                      | resultado |
      | 2 points, positive metres, coherent counters   | guardado  |
      | 2001 points, the most the reducer can produce  | guardado  |

    Examples: se rechaza
      | recorrido                                      | resultado |
      | a latitude of 91                               | rechazado |
      | a longitude of -181                            | rechazado |
      | coordinates written as text                    | rechazado |
      | 2002 points, one over what the reducer emits   | rechazado |
      | zero or negative metres                        | rechazado |
      | fewer original points than points received     | rechazado |
      | something that is not JSON                     | rechazado |

  # ---------------------------------------------------------------------------
  # Slice 3 — `servicio`
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario: Un servicio se publica con su precio y su duración
    Given a signed-in user on "/publicar"
    When this user publishes a "servicio" with a price and a duration
    Then no origin is asked
    And it can be requested like a product, without a schedule yet

  # ---------------------------------------------------------------------------
  # Slice 4 — la agenda
  # ---------------------------------------------------------------------------

  @slice-4 @future
  Scenario: El proveedor declara su horario y el sitio deriva los huecos
    Given a provider with a weekly schedule and some time off
    When someone opens their booking screen
    Then the free slots are the schedule minus the time off minus the taken appointments

  @slice-4 @future
  Scenario: Dos personas no pueden quedarse con el mismo hueco
    Given two people booking the same slot at the same time
    When both requests reach the database
    Then exactly one appointment survives
    And the other is told the slot is gone

  @slice-4 @future
  Scenario: Cancelar libera el hueco
    Given a booked appointment
    When it is cancelled
    Then that slot is offered again
