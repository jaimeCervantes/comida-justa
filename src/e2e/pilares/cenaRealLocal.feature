# Los escenarios de extremo a extremo de este archivo los ejecuta
# `src/e2e/habits/atomicSleepChallenge.spec.ts`, que es donde ya vive la sesion de la suite y el
# retroceso de fechas del reto; abrir un segundo spec solo habria duplicado esa preparacion contra
# la misma base compartida. Los marcados @component los cubre
# `src/app/[locale]/pilares/components/AlimentacionPage.test.tsx` y
# `src/presentation/habits/pillarPracticeCopy.test.ts`.

Feature: Cena real, local y al atardecer

  Context:
  - Problem: la practica de Alimentacion pedia una planta mas en cualquier comida del dia. Dejaba
    fuera cuando se cena (la sincronia circadiana, que es el puente con el Pilar 1), con que se
    cocina (los aceites de semillas refinados), como se arma el plato (proporciones en vez de
    conteo) y de donde viene (proximidad, temporada, granel). La pagina tampoco nombraba el costo
    oculto de la cadena global: millas alimentarias, empaques de un solo uso y merma en transito.
  - Savings: una sola cena resuelve las cuatro decisiones a la vez. El plato se arma mirandolo, sin
    contar calorias ni pesar nada; el abastecimiento semanal en mercado local reemplaza la compra
    reactiva envasada; y cenar temprano devuelve horas de sueño profundo sin pedir un habito nuevo
    en otro pilar.
  - Why: Alimentacion es el pilar que mas se conecta con los otros tres y con el ecosistema de Hazlo
    Sano —productores locales, tianguis, comercio justo—. Que la practica solo dijera «una planta
    mas» dejaba ese puente sin construir justo en la pantalla donde se pide la accion.

  As a persona que quiere cenar mejor sin volverlo un proyecto
  I want una cena temprana, cocinada limpio, armada por proporciones y abastecida cerca
  So that la decision de cada noche deje de ser dificil y sostenga mi descanso, mi bolsillo y mi zona

  @slice-1
  Scenario Outline: El reto de Alimentacion se practica como una cena completa
    Given que abro el pilar de Alimentacion en "<ruta>"
    When llego a la practica
    Then el reto se llama "<reto>"
    And la identidad del pilar es "<identidad>"
    And la practica distingue la senal "<senal>" del minimo "<minimo>"
    And el ritual tiene seis pasos, empieza en "<primer-paso>" y termina en "<ultimo-paso>"

    Examples: la misma cena en los dos idiomas
      | ruta                     | reto                            | identidad                                                                   | senal                 | minimo                 | primer-paso            | ultimo-paso              |
      | /pilares/alimentacion    | Cena real, local y al atardecer | Soy una persona que hace fácil elegir comida real, fresca y de origen local | Cenar al atardecer    | Servir la triada local | Abastecerte cerca      | Notar el triple impacto  |
      | /en/pillars/alimentacion | A real, local dinner at sunset  | I am a person who makes choosing real, fresh, local food easy               | Have dinner at sunset | Serve the local triad  | Stock up close to home | Notice the triple impact |

  @slice-1
  Scenario Outline: El ancla temporal se enuncia con la caida del sol y su hora
    Given que abro "/pilares/alimentacion"
    When leo el ancla "<ancla>"
    Then encuentro "<referencia>"

    Examples: la regla relativa sobrevive a un turno nocturno
      | ancla              | referencia                    |
      | Cenar al atardecer | 6:00 y las 7:30 PM            |
      | Cenar al atardecer | 2.5 a 3 horas antes de dormir |

  @slice-1
  Scenario: El abastecimiento local ayuda pero no es requisito
    Given que abro "/pilares/alimentacion"
    When leo la nota de preparacion "Abastecerte cerca, no aprobar un examen"
    Then dice que es una recomendacion y nunca un requisito para que la cena cuente
    And el panel solo pide confirmar las dos anclas

  @slice-1
  Scenario: Una semana de cenas se registra contra el reto que ya existia
    Given que inicio "Empezar Cena real, local y al atardecer" con sesion
    When registro cinco cenas dentro de mi ventana local de siete dias
    Then el contador llega a "5 de 7 cenas" y a "50 puntos"
    And veo "Cultivaste cinco cenas reales"
    And el progreso sigue guardado bajo la clave "nutrition-one-plant-v1"

  @slice-1
  Scenario Outline: Los otros tres pilares conservan su ritual de cinco pasos
    Given que abro el pilar "<pilar>" en "<ruta>"
    When cuento los pasos de su ritual
    Then son cinco y el reto sigue llamandose "<reto>"

    Examples: la sexta linea es solo de Alimentacion
      | pilar          | ruta                    | reto                      |
      | Sueno          | /pilares/sueno          | Del atardecer al amanecer |
      | Movimiento     | /pilares/movimiento     | Movimiento vivo, local y funcional |
      | Mente/Espiritu | /pilares/mente-espiritu | Presencia, paz y conexión local |

  @slice-2 @component
  # Vitest y no Playwright: es contenido de una pagina estatica, sin sesion ni ida y vuelta al
  # servidor, y el componente ya se renderiza con el catalogo real.
  Scenario Outline: La pagina nombra el costo oculto de la cadena global
    Given que abro el pilar de Alimentacion
    When leo la seccion "El costo oculto de la cadena global"
    Then el costo "<costo>" aparece con su consecuencia "<consecuencia>"

    Examples: lo que se paga por un viaje que no aparece en la etiqueta
      | costo           | consecuencia                              |
      | El traslado:    | combustible y las emisiones de CO₂        |
      | Los empaques:   | plástico de un solo uso                   |
      | El desperdicio: | semanas en cámaras frías gastando energía |

  @slice-2 @component
  Scenario: La proximidad es el contrapeso del costo, no una seccion aparte
    Given que abro el pilar de Alimentacion
    When leo "El contrapeso: proximidad y temporada"
    Then vive dentro de la misma seccion que los tres costos
    And dice que el alimento se cosecha maduro y que el dinero se queda con quien lo cultivo
    And la seccion entera aparece antes de la practica

  @slice-3 @component
  Scenario Outline: La triada dibuja la proporcion, no solo la escribe
    Given que abro el pilar de Alimentacion
    When miro "La triada del plato equilibrado"
    Then "<parte>" ocupa "<porcion>" del plato y su bloque mide "<ancho>"

    Examples: la regla se ve antes de leerse
      | parte                          | porcion | ancho        |
      | Vegetales locales de temporada | 50 %    | sm:basis-1/2 |
      | Proteína regional              | 25 %    | sm:basis-1/4 |
      | Carbohidratos del territorio   | 25 %    | sm:basis-1/4 |

  @slice-3 @component
  Scenario: La grasa se suma al plato y no lo divide
    Given que abro "La triada del plato equilibrado"
    When cuento los bloques de la barra de proporciones
    Then son tres
    And "1 porción" de "Grasas sanas de la región" aparece fuera de la barra

  @slice-3 @component
  Scenario Outline: La coccion limpia dice para que sirve cada aceite
    Given que abro "Cocción limpia, sin aceites refinados"
    When leo "<aceite>"
    Then encuentro su uso "<uso>"

    Examples: lo que decide si un aceite ayuda o daña es a que fuego se le pone
      | aceite                              | uso                                                              |
      | Aceite de aguacate prensado en frío | Sin refinar, su punto de humo ronda los 250 °C                   |
      | Aceite de aguacate prensado en frío | el refinado llega a 271 °C, pero pierde lo que veniamos a cuidar |
      | Aceite de oliva extra virgen        | Crudo o fuego bajo                                               |

  @slice-3 @component
  Scenario: Los aceites de semillas salen con su razon
    Given que abro "Cocción limpia, sin aceites refinados"
    When leo por que se retiran soya, maiz, cartamo, canola y girasol
    Then encuentro los aldehidos y los compuestos proinflamatorios
    And encuentro vapor, freidora de aire y caldos caseros como alternativa sin grasa añadida

  @slice-4 @component
  Scenario Outline: El catalogo dice que comprar, que le hace al cuerpo y que le hace al entorno
    Given que abro "Catálogo de ingredientes de proximidad"
    When leo la categoria "<categoria>"
    Then lleva al menos cuatro ingredientes de proximidad
    And lleva "En el cuerpo" y "En el entorno y la economía local" en la misma tarjeta

    Examples: las cuatro categorias con las que se arma la triada
      | categoria                      |
      | Proteínas de calidad           |
      | Carbohidratos complejos        |
      | Grasas saludables              |
      | Aceites sanos y cocción limpia |

  @slice-4 @component
  Scenario: La guia se consulta en el telefono sin desplazarse a lo ancho
    Given que abro el pilar de Alimentacion
    When reviso como se presenta el catalogo
    Then son tarjetas y no una tabla de cuatro columnas
