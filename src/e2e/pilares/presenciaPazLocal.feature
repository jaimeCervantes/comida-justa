# Los escenarios de extremo a extremo los ejecuta `src/e2e/habits/atomicSleepChallenge.spec.ts`. Los
# marcados @component los cubren `src/app/[locale]/pilares/components/MenteEspirituPage.test.tsx` y
# `src/presentation/habits/pillarPracticeCopy.test.ts`.

Feature: Presencia, paz y conexion local

  Context:
  - Problem: la practica pedia una pausa lejos del ruido digital y un mensaje genuino. El mensaje era
    el minimo correcto para empezar, pero deja fuera lo que sostiene la salud mental: el silencio de
    la primera y la ultima hora, el arraigo al aire libre, la conversacion cara a cara sin
    dispositivos y el servicio a la gente de al lado. La pagina tampoco nombraba el costo de la
    hiperconectividad: saturacion, desarraigo del territorio y soledad acompañada.
  - Savings: las ventanas de silencio no piden tiempo extra, piden que el telefono no este; el rato
    al aire libre es el mismo que ya pide Movimiento; y la conversacion cae en una comida que ya
    existe. Se recupera sueño profundo, atencion y una red de vecinos que sirve cuando algo va mal.
  - Why: es el pilar que sostiene a los otros tres —sin calma y sin gente cerca ninguna practica
    aguanta— y el que mas directamente ataca la soledad.

  As a persona saturada de pantallas y con pocos vinculos cerca
  I want empezar el dia en silencio y tener una conversacion de verdad
  So that la calma y los vinculos dejen de depender de que sobre tiempo

  @slice-1
  Scenario Outline: El reto de Mente se practica en silencio y con alguien
    Given que abro el pilar de Mente y Espiritu en "<ruta>"
    When llego a la practica
    Then el reto se llama "<reto>"
    And la identidad del pilar es "<identidad>"
    And la practica distingue la senal "<senal>" del minimo "<minimo>"
    And el ritual tiene cinco pasos y termina en "<ultimo-paso>"

    Examples: la misma pausa en los dos idiomas
      | ruta                         | reto                              | identidad                                                                                                | senal                      | minimo                | ultimo-paso             |
      | /pilares/mente-espiritu      | Presencia, paz y conexión local   | Soy una persona que cultiva la paz interior, la presencia y lazos sólidos con su comunidad todos los días | Abrir el día sin pantalla  | Presencia con alguien | Notar el triple impacto |
      | /en/pillars/mente-espiritu   | Presence, peace and local connection | I am a person who cultivates inner peace, presence and solid bonds with their community every day     | Open the day screen-free   | Presence with someone | Notice the triple impact |

  @slice-1
  Scenario: El minimo empuja a lo presencial sin dejar fuera a quien vive solo
    Given que abro "/pilares/mente-espiritu"
    When leo el minimo "Presencia con alguien"
    Then pide una conversacion cara a cara y sin dispositivos como preferencia
    And dice que una llamada o un mensaje sincero cuentan igual cuando hoy no hay nadie cerca
    And aclara que lo que cuenta es escuchar de verdad, no el canal

  @slice-1
  Scenario: La nota de seguridad nombra el apoyo profesional
    Given que abro "/pilares/mente-espiritu"
    When leo la nota de seguridad de la practica
    Then dice que esta practica no reemplaza apoyo profesional
    And dice que pedir ayuda tambien es cuidar la mente

  @slice-2 @component
  Scenario Outline: La pagina nombra el costo de la hiperconectividad
    Given que abro el pilar de Mente y Espiritu
    When leo la seccion "El costo oculto de la hiperconectividad"
    Then el costo "<costo>" aparece con su consecuencia "<consecuencia>"

    Examples: lo que cobra un entorno de estimulacion constante
      | costo                       | consecuencia                          |
      | La saturación:              | sistema nervioso sin descanso         |
      | El desarraigo:              | dejas de reconocer a quien vive cerca |
      | La soledad acompañada:      | no alimentan el afecto                |

  @slice-3 @component
  Scenario Outline: Las ventanas de silencio son terreno, no una regla mas
    Given que abro "Las ventanas de silencio"
    When miro la ventana "<ventana>"
    Then dice que toca "<que>"

    Examples: tres ventanas y ningun conteo de minutos sin telefono
      | ventana      | que                              |
      | Primera hora | Abrir el día sin pantalla        |
      | En la mesa   | Comidas y cenas sin dispositivos |
      | Última hora  | Cerrar el día sin scroll         |

  @slice-3 @component
  Scenario: El arraigo no pide una salida extra
    Given que abro "Arraigo y respiración"
    When leo donde hacerlo
    Then dice que es el mismo rato al aire libre que pide el pilar de Movimiento
    And la respiracion 4-7-8 aparece con sus tres tiempos

  @slice-4 @component
  Scenario Outline: El catalogo dice que practicar, que le hace a la mente y que le hace al barrio
    Given que abro "Catálogo de prácticas de presencia"
    When leo la categoria "<categoria>"
    Then lleva sus ejemplos locales, su beneficio emocional y su impacto comunitario

    Examples: las cuatro practicas del pilar
      | categoria                        |
      | Higiene digital y ayuno de pantallas |
      | Arraigo y contemplación en la naturaleza |
      | Diálogo presencial y gratitud    |
      | Servicio y cooperación comunitaria |

  @slice-4 @component
  Scenario: Los cuatro pilares comparten un solo catalogo
    Given que Alimentacion, Movimiento y Mente piden la misma tarjeta de categoria
    When se implementa el catalogo de Mente
    Then reutiliza `PillarCatalog` y no queda ninguna copia del mismo diseño
