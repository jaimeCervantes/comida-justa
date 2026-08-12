# Los escenarios de extremo a extremo los ejecuta `src/e2e/habits/atomicSleepChallenge.spec.ts`, que
# es donde ya vive la sesion de la suite y el retroceso de fechas del reto. Los marcados @component
# los cubren `src/app/[locale]/pilares/components/MovimientoPage.test.tsx` y
# `src/presentation/habits/pillarPracticeCopy.test.ts`.

Feature: Movimiento vivo, local y funcional

  Context:
  - Problem: la practica pedia una señal de inicio y dos minutos de movimiento. Es el mejor primer
    paso posible y por eso se conserva, pero deja fuera lo que devuelve movimiento a un dia: el
    trayecto corto que hoy se hace en coche o moto, el terreno natural y la luz del sol —el puente
    con el Pilar 1—, la fuerza util de cargar y sostener, y el deporte de barrio, que es el puente
    con el Pilar 4. La pagina tampoco nombraba el costo de la movilidad motorizada hiperlocal.
  - Savings: el mandado se convierte en el bloque de movimiento del dia, asi que no hay que
    encontrarle hueco a nada nuevo. Se ahorra gasolina y mantenimiento en trayectos que no los
    necesitaban, el barrio recupera calle y vecinos, y la luz de la mañana paga en descanso esa
    misma noche.
  - Why: Movimiento es el pilar que mas se apoya en el entorno: sin senderos, parques, canchas y
    calles caminables no hay practica que sostener.

  As a persona que pasa el dia sentada y usa el coche para todo
  I want recuperar el movimiento que ya cabia en mi dia, sin apuntarme a nada nuevo
  So that mi cuerpo, mi bolsillo y mi calle mejoren con la misma decision

  @slice-1
  Scenario Outline: El reto de Movimiento se practica sin motor y en dos minutos
    Given que abro el pilar de Movimiento en "<ruta>"
    When llego a la practica
    Then el reto se llama "<reto>"
    And la identidad del pilar es "<identidad>"
    And la practica distingue la senal "<senal>" del minimo "<minimo>"
    And el ritual tiene cinco pasos, empieza en "<primer-paso>" y termina en "<ultimo-paso>"

    Examples: el mismo movimiento en los dos idiomas
      | ruta                  | reto                                | identidad                                                                                     | senal              | minimo                    | primer-paso          | ultimo-paso              |
      | /pilares/movimiento   | Movimiento vivo, local y funcional  | Soy una persona que se mueve de forma natural y reconecta con su entorno y comunidad cada dia  | Moverme sin motor  | Dos minutos que cuentan   | Salir sin motor      | Notar el triple impacto  |
      | /en/pillars/movimiento| Living, local, functional movement  | I am a person who moves naturally and reconnects with their surroundings and community daily   | Move without an engine | Two minutes that count | Head out without an engine | Notice the triple impact |

  @slice-1
  Scenario: El ancla sin motor no excluye a quien no puede caminar ni pedalear
    Given que abro "/pilares/movimiento"
    When leo el ancla "Moverme sin motor"
    Then ofrece su version para quien usa silla, muletas o no puede salir ese dia
    And esa version cuenta igual que caminar o pedalear

  @slice-1
  Scenario: Hacer mas conviene, aunque no de mas puntos
    Given que abro "/pilares/movimiento"
    When leo el minimo "Dos minutos que cuentan"
    Then dice que moverse mas tiempo es mejor para el cuerpo
    And dice que los puntos cuentan dias y no volumen
    And ningun texto desaconseja alargar la sesion

  @slice-1
  Scenario: Una semana de movimiento se registra contra el reto que ya existia
    Given que inicio "Empezar Movimiento vivo, local y funcional" con sesion
    When registro cinco dias dentro de mi ventana local de siete
    Then el contador llega a "5 de 7 dias" y a "50 puntos"
    And el progreso sigue guardado bajo la clave "movement-two-minutes-v1"

  @slice-2 @component
  Scenario Outline: La pagina nombra el costo de la movilidad motorizada hiperlocal
    Given que abro el pilar de Movimiento
    When leo la seccion "El costo oculto de mover dos cuadras en motor"
    Then el costo "<costo>" aparece con su consecuencia "<consecuencia>"

    Examples: lo que cuesta un trayecto que cabia a pie
      | costo             | consecuencia                              |
      | La gasolina:      | mantenimiento de un viaje que cabía a pie |
      | El aire y el ruido: | emisiones y ruido en tu propia calle    |
      | El cuerpo:        | gasto espontáneo de energía               |

  @slice-2 @component
  Scenario: La movilidad activa es el contrapeso del costo, no una seccion aparte
    Given que abro el pilar de Movimiento
    When leo "El contrapeso: tu territorio es el espacio de movimiento"
    Then vive dentro de la misma seccion que los tres costos
    And la seccion entera aparece antes de la practica

  @slice-3 @component
  Scenario Outline: La cadencia dice cada cuanto, no cuanto volumen
    Given que abro "La cadencia del dia"
    When miro el bloque "<frecuencia>"
    Then dice que toca "<que>"

    Examples: tres frecuencias, ningun conteo de series ni kilometros
      | frecuencia    | que                              |
      | Cada 50 min   | Dos minutos de pie               |
      | Cada día      | 20 a 30 minutos al aire libre    |
      | Cada semana   | Fuerza útil y deporte con gente  |

  @slice-3 @component
  Scenario: El gimnasio de la zona cuenta como movimiento local
    Given que abro la seccion de la cadencia semanal
    When leo las opciones de fuerza y deporte
    Then el gimnasio, el estudio o la clase de la zona aparecen como opcion valida
    And se nombran como negocio local, igual que el mercado en Alimentacion

  @slice-3 @component
  Scenario Outline: El calzado dice que buscar, no solo "comodo"
    Given que abro "El pie y el terreno"
    When leo lo que hace funcional a un calzado
    Then encuentro "<criterio>"

    Examples: tres criterios verificables al comprarlo
      | criterio       |
      | horma ancha    |
      | suela flexible |
      | drop cero      |

  @slice-4 @component
  Scenario Outline: El catalogo dice que hacer, que le hace al cuerpo y que le hace al barrio
    Given que abro "Catálogo de formas de movimiento"
    When leo la categoria "<categoria>"
    Then lleva al menos tres ejemplos locales
    And lleva su beneficio fisiologico y su impacto comunitario en la misma tarjeta

    Examples: las cuatro formas de mover el cuerpo en el territorio
      | categoria                          |
      | Proximidad y pausas activas        |
      | Biomecánica y terreno natural      |
      | Fuerza funcional y trabajo de campo|
      | Resistencia y deporte de comunidad |

  @slice-4 @component
  Scenario: Alimentacion y Movimiento comparten un solo catalogo
    Given que las dos paginas piden la misma tarjeta de categoria
    When se implementa el catalogo de Movimiento
    Then reutilizan un componente compartido
    And no queda una segunda copia del mismo diseño
