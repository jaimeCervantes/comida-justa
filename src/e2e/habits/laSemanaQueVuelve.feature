Feature: La semana que vuelve - la practica deja de morir a los siete dias

  Context:
  - Problem: la ventana de siete dias se escribe una vez y no se mueve nunca, asi que al octavo dia
    no hay nada que registrar ni nada que empezar. El 23 de agosto de 2026, ocho de las nueve
    inscripciones tienen la ventana vencida y la ultima repeticion de toda la base es del 16.
  - Savings: deja de perderse la gente que ya empezo; el pilar retiene en vez de expirar y se puede
    invitar a alguien sin que la practica caduque sola en una semana.
  - Why: los cuatro pilares son la promesa de practica sostenida de Hazlo Sano. Una practica que solo
    se puede hacer una semana no es una practica.

  As a persona que empezo a practicar un pilar
  I want to que la semana vuelva a abrirse cuando la anterior cerro
  So that pueda sostener la practica en vez de perderla al octavo dia

  # La ventana va del dia en que uno se suma al lunes en que cierra la semana de la comunidad,
  # anclada en America/Mexico_City. Todas cierran juntas aunque hayan abierto en dias distintos: ese
  # lunes compartido es el ritmo. Empieza hoy y no el lunes pasado porque los dias que ya pasaron no
  # se pueden practicar, y una ventana que los incluyera pediria cinco repeticiones con tres dias de
  # vida. Sumarse sigue siendo una decision: el panel invita, no inscribe solo. El contrato de rango
  # sigue siendo [inicio, fin).

  @slice-1
  Scenario: La practica vencida ofrece la semana en curso, no los dias de la pasada
    Given que empece "Del atardecer al amanecer" el martes 11 de agosto de 2026
    And la semana de la comunidad en curso es del lunes 17 al domingo 23 de agosto
    When abro mi pilar
    Then el seguimiento ya no pinta los dias de la semana en que empece
    And me invita a sumarme a la semana en curso
    When me sumo
    Then los siete dias que veo son los de la semana en curso
    And mi contador vuelve a empezar sin que se borren mis repeticiones anteriores

  # Lo cubre el caso de uso y no Playwright: al renovarse la ventana, el selector deja de ofrecer las
  # fechas viejas, asi que por la interfaz no hay forma de intentarlo. La regla solo se puede afirmar
  # por debajo, donde si se puede pedir una fecha que la pantalla ya no muestra.
  @slice-1 @component
  Scenario: Una fecha de la semana pasada deja de poder registrarse
    Given que me sume a la semana en curso despues de que la anterior cerro
    When intento registrar una fecha de la semana en que empece
    Then el registro se rechaza por quedar fuera de la ventana

  @slice-1
  Scenario: Sumarme a la semana nueva no me quita lo que ya gane
    Given una repeticion registrada en la semana que ya cerro
    When me sumo a la semana en curso
    Then mis puntos siguen siendo los mismos
    But mi meta de esta semana empieza en cero

  @slice-1 @component
  Scenario Outline: La ventana abre el dia que me sumo y cierra el lunes de todos
    Given que me sumo el "<me sumo>" en "America/Mexico_City"
    When se abre mi ventana
    Then va de "<me sumo>" a "<cierra>"

    Examples: todas cierran el mismo lunes
      | me sumo    | cierra     | razon                                    |
      | 2026-08-17 | 2026-08-24 | el lunes tiene los siete dias por delante|
      | 2026-08-20 | 2026-08-24 | el jueves alcanza a los que quedan       |
      | 2026-08-23 | 2026-08-24 | el domingo es el ultimo dia, no el cierre|
      | 2026-08-24 | 2026-08-31 | el lunes siguiente vuelve a abrir siete  |

  @slice-1 @component
  Scenario Outline: Sumarse reescribe la ventana que cerro y respeta la que sigue abierta
    Given una ventana guardada <guardada>
    And hoy es "<hoy>" en "America/Mexico_City"
    When me sumo a la practica
    Then la ventana queda en <resultante>

    Examples: solo se reescribe lo que ya cerro
      | guardada                   | hoy        | resultante                 | razon                                              |
      | ninguna                    | 2026-08-23 | [2026-08-23, 2026-08-24)   | primera vez: entro a lo que queda de la semana     |
      | [2026-08-11, 2026-08-18)   | 2026-08-23 | [2026-08-23, 2026-08-24)   | la semana guardada ya cerro                        |
      | [2026-08-17, 2026-08-24)   | 2026-08-20 | [2026-08-17, 2026-08-24)   | a media semana no se reinicia: no es boton de borrar|
      | [2026-08-17, 2026-08-24)   | 2026-08-24 | [2026-08-24, 2026-08-31)   | el lunes siguiente si abre una nueva               |

  # La meta mira la semana; los puntos, el nivel y la insignia miran la historia entera. Reiniciar
  # los puntos cada lunes borraria la unica senal duradera de quien lleva meses practicando.

  @slice-1 @component
  Scenario Outline: La meta cuenta la semana vigente y los puntos cuentan la vida entera
    Given repeticiones en "2026-08-11", "2026-08-12", "2026-08-18" y "2026-08-20"
    And la ventana ["<inicio>", "<fin>")
    When se arma mi progreso
    Then la meta lleva <completadas> y los puntos dicen "<puntos>"

    Examples: la misma historia leida desde dos semanas
      | inicio     | fin        | completadas | puntos    | razon                                  |
      | 2026-08-10 | 2026-08-17 | 2           | 40 puntos | solo el 11 y el 12 caen en esa semana  |
      | 2026-08-17 | 2026-08-24 | 2           | 40 puntos | solo el 18 y el 20 caen en la vigente  |

  @slice-1 @component
  Scenario: Una semana cumplida no deja la siguiente cumplida de nacimiento
    Given cinco repeticiones de la semana pasada
    When abro la ventana nueva
    Then la meta empieza en cero y los cincuenta puntos siguen ahi

  # Slice 2 -- quien llega tarde no estrena la practica perdiendo. El 23 de agosto es domingo:
  # sumarse ese dia con una meta fija de cinco es una derrota garantizada el primer dia.

  # La ventana la calcula el servidor con el reloj real, asi que la prueba afirma la relacion y no un
  # numero: una que dijera "meta 5" pasaria los lunes y fallaria los jueves.
  @slice-2
  Scenario: La meta nunca pide mas dias de los que tiene la ventana
    Given que me sumo cualquier dia de la semana
    When veo mi meta junto a mi calendario
    Then pide al menos una repeticion y nunca mas dias de los que el calendario muestra

  @slice-2 @component
  Scenario Outline: La meta conserva el margen de una semana entera, no pide perfeccion
    Given una ventana de <dias> dias
    When se calcula su meta
    Then pide <meta> repeticiones

    Examples: la proporcion de cinco entre siete, redondeada, nunca menos de una
      | dias | meta | razon                                                  |
      | 7    | 5    | la semana entera perdona dos dias                      |
      | 5    | 4    | cinco dias conservan un margen                         |
      | 4    | 3    | topar en cuatro de cuatro pediria una semana perfecta  |
      | 2    | 1    | dos dias piden uno                                     |
      | 1    | 1    | un dia pide uno, nunca cero                            |

  @slice-2 @component
  Scenario: El hito final sigue diciendo cinco porque cuenta la historia, no la semana
    Given que cumpli una meta de tres en una semana parcial
    When veo mis celebraciones
    Then no se me felicita por cinco repeticiones que no hice

  # Slice 3 -- habia dos ideas de semana que no se hablaban: la de la practica, que cierra el lunes en
  # America/Mexico_City, y la de la liga, que anclaba el lunes en UTC y por eso cerraba a las 18:00
  # del domingo en Mexico. Ahora la semana de la comunidad se define una vez y las dos la usan.

  @slice-3 @component
  Scenario Outline: La semana de la comunidad va de lunes a lunes en la zona del proyecto
    Given el instante "<instante>"
    When se pregunta por la semana de la comunidad
    Then va de "<inicio>" a "<fin>"

    Examples: el domingo por la tarde en Mexico todavia es la semana que termina
      | instante                 | inicio     | fin        | razon                                       |
      | 2026-08-20T18:00:00Z     | 2026-08-17 | 2026-08-24 | un jueves cualquiera                        |
      | 2026-08-24T00:30:00Z     | 2026-08-17 | 2026-08-24 | en UTC ya es lunes, en Mexico sigue el domingo|
      | 2026-08-24T06:30:00Z     | 2026-08-24 | 2026-08-31 | pasada la medianoche mexicana si abre la nueva|

  @slice-3 @component
  Scenario: La practica y la liga preguntan por la misma semana
    Given la ventana que abre una practica nueva un lunes
    When se compara con la semana de la liga
    Then las dos cierran el mismo dia

  # La liga filtraba por `completed_at` --cuando se escribio la fila-- y puntuaba por `cycle_date`
  # --que dia se practico--. Quien registra el domingo su martes contaba con la fecha de un dia y en
  # la semana de otro.

  @slice-3 @component
  Scenario Outline: La liga cuenta el dia que se practico, no el dia que se registro
    Given una repeticion del dia "<practicado>" registrada el "<registrado>"
    And la semana ["2026-08-17", "2026-08-24")
    When se arma la participacion semanal
    Then la repeticion "<cuenta>"

    Examples:
      | practicado | registrado | cuenta     | razon                                        |
      | 2026-08-18 | 2026-08-23 | cuenta     | se practico dentro de la semana              |
      | 2026-08-16 | 2026-08-17 | no cuenta  | se practico la semana pasada aunque se registrara esta |

  @slice-3
  Scenario: El jardin dice cuanta gente esta practicando esta semana
    Given repeticiones aportadas al jardin en semanas distintas
    When abro el jardin comunitario
    Then los canteros siguen contando todo lo cultivado
    And ademas dice cuantas personas practicaron esta semana

  @slice-3
  Scenario: Una semana sin nadie lo dice, en vez de fingir un numero
    Given que nadie ha practicado todavia esta semana
    When abro el jardin comunitario
    Then invita a ser quien la empiece
    And no inventa participantes

  # Slice 4 -- semanas sostenidas, NO una racha.
  #
  # Se planteo como "tres semanas seguidas", y eso pedia tabla nueva: la meta de una semana pasada
  # depende del dia en que uno se sumo a ella, y esa ventana se sobrescribe. Pero ademas una racha
  # se rompe, y romperla castiga justo a quien falto una semana y regreso -- lo contrario de todo lo
  # demas del producto, que tiene un reconocimiento entero dedicado a regresar.
  #
  # Contar en cuantas semanas distintas hubo practica no se rompe nunca, no castiga a nadie, y sale
  # entero de las fechas que ya estan guardadas. Sin migracion.

  @slice-4
  Scenario: Las semanas en que practique se acumulan y no se pierden
    Given que practique la semana pasada y esta
    When veo mi practica
    Then reconoce las dos semanas, no solo la de ahora

  @slice-4 @component
  Scenario Outline: Cuenta semanas distintas, no repeticiones ni semanas seguidas
    Given repeticiones en <fechas>
    When se cuentan mis semanas sostenidas
    Then son <semanas>

    Examples: la misma semana no cuenta dos veces y un hueco no borra lo anterior
      | fechas                                           | semanas | razon                                    |
      | ninguna                                          | 0       | sin practica no hay semana               |
      | "2026-08-18" y "2026-08-20"                      | 1       | dos dias de la misma semana son una      |
      | "2026-08-11" y "2026-08-18"                      | 2       | semanas consecutivas                     |
      | "2026-08-11" y "2026-08-25"                      | 2       | **un hueco no borra la anterior**        |
      | "2026-08-16" y "2026-08-17"                      | 2       | domingo y lunes son semanas distintas    |

  @slice-4 @component
  Scenario: Una sola semana todavia no dice nada, y no se anuncia
    Given que solo practique esta semana
    When veo mi practica
    Then no se me anuncia el numero de semanas
    But mis puntos y mi nivel siguen a la vista
