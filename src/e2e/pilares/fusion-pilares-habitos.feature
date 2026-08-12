Feature: Explicacion y practica viven juntas en Pilares

  Context:
  - Problem: cada pilar explica por que importa una conducta, pero la persona debe cambiar a una
    familia de rutas poco visible para empezar a practicarla.
  - Savings: reunir informacion y accion elimina un clic, un cambio de contexto y la frustracion de
    aprender dos navegaciones para el mismo tema.
  - Why: Hazlo Sano debe acercar una practica concreta al momento en que la persona entiende su
    valor, sin convertir el contenido en una pagina separada de seguimiento.

  As a persona que quiere cuidar su salud
  I want entender un pilar y practicarlo en el mismo recorrido
  So that pueda actuar sin abandonar el contexto que me motivo

  @slice-1
  Scenario Outline: Sueno combina explicacion y practica sin cambiar de pagina
    Given que abro el pilar de Sueno en "<ruta>"
    When avanzo desde la explicacion hasta "Ponlo en practica"
    Then sigo en "<ruta>"
    And veo el reto "<reto>" y sus anclas "<noche>" y "<manana>"
    And el seguimiento aparece antes de "<referencias>"
    And la pagina conserva un solo encabezado principal
    And el titulo del pilar, su introduccion y "<identidad>" comparten el hero inicial

    Examples: recorrido localizado dentro del pilar
      | ruta                | reto                         | noche             | manana            | referencias | identidad                                      |
      | /pilares/sueno      | Del atardecer al amanecer    | Cerrar la noche   | Abrir la manana   | Referencias | Soy una persona que protege su descanso.       |
      | /en/pillars/sueno   | From sunset to sunrise       | Close the evening | Open the morning  | References  | I am a person who protects my rest.            |

  @slice-1
  Scenario Outline: Las URL antiguas de Sueno dejan de existir sin redireccion
    Given que solicito la antigua URL "<ruta>"
    When el sitio resuelve la solicitud
    Then responde que la pagina no existe
    And no redirige a otra URL

    Examples: rutas de Habitos no publicadas
      | ruta              |
      | /habitos/sueno    |
      | /en/habits/sleep  |

  @slice-1
  Scenario Outline: Las superficies publicas llevan al nuevo destino de Sueno
    Given que una primera repeticion de Sueno fue compartida
    When sigo el enlace desde "<superficie>"
    Then llego a "<destino>"
    And veo "<reto>" dentro del pilar de Sueno

    Examples: descubrimiento localizado de la practica
      | superficie       | destino              | reto                      |
      | inicio en español| /pilares/sueno        | Del atardecer al amanecer |
      | mensaje en ingles| /en/pillars/sueno     | From sunset to sunrise    |

  @slice-1
  Scenario Outline: La autenticacion regresa a la practica dentro del pilar
    Given que abro "<ruta>" sin sesion
    When intento iniciar "<reto>"
    Then llego a iniciar sesion con "<ruta>" como destino de regreso

    Examples: retorno localizado al mismo documento
      | ruta               | reto                      |
      | /pilares/sueno     | Del atardecer al amanecer |
      | /en/pillars/sueno  | From sunset to sunrise    |

  @slice-2
  Scenario Outline: Cada pilar integra una practica y un ritual propios
    Given que abro el pilar "<pilar>" en "<ruta>"
    When avanzo desde su contexto hasta la practica "<reto>"
    Then sigo en "<ruta>" y la practica aparece antes de "Referencias"
    And el hero inicial reune el titulo del pilar y la identidad "<identidad>"
    And la practica distingue la senal "<senal>" del minimo "<minimo>"
    And el ritual "<ritual>" contiene "<pasos>" pasos y termina con "<ultimo-paso>"
    And la pagina conserva un solo encabezado principal

    Examples: informacion y accion especificas por pilar
      | pilar            | ruta                       | reto                            | identidad                                                                   | senal                         | minimo                           | ritual                                            | pasos | ultimo-paso                                    |
      | Alimentacion     | /pilares/alimentacion      | Cena real, local y al atardecer | Soy una persona que hace fácil elegir comida real, fresca y de origen local | Cenar al atardecer            | Servir la triada local           | Abastecer, anclar, cocinar, servir, estar y notar | 6     | Notar el triple impacto a la mañana siguiente. |
      | Movimiento       | /pilares/movimiento        | Dos minutos cuentan             | Soy una persona que empieza a moverse                                       | Elegir una señal de inicio    | Moverme dos minutos              | Preparar, empezar, moverse y notar                | 5     | Decidir libremente si continuar o cerrar.      |
      | Mente/Espiritu   | /pilares/mente-espiritu    | Un vínculo consciente           | Soy una persona que cultiva vínculos reales                                 | Pausar fuera del ruido digital| Enviar presencia y dejar espacio | Pausar, elegir, contactar, escuchar y agradecer   | 5     | Agradecer el vínculo sin exigir reacción.      |

  @slice-2
  Scenario Outline: La autenticacion vuelve a la practica dentro de su pilar
    Given que abro "<ruta>" sin sesion
    When intento iniciar "<reto>"
    Then llego a iniciar sesion con "<ruta>" como destino de regreso

    Examples: callbacks localizados sin traducir el slug del pilar
      | ruta                            | reto                            |
      | /pilares/alimentacion           | Cena real, local y al atardecer |
      | /en/pillars/alimentacion        | A real, local dinner at sunset  |
      | /pilares/movimiento             | Dos minutos cuentan             |
      | /en/pillars/movimiento          | Two minutes count               |
      | /pilares/mente-espiritu         | Un vínculo consciente           |
      | /en/pillars/mente-espiritu      | One conscious connection        |

  @slice-2
  Scenario Outline: Las URL antiguas de los otros pilares dejan de existir
    Given que solicito la antigua URL "<ruta>"
    When el sitio resuelve la solicitud
    Then responde que la pagina no existe
    And no redirige a otra URL

    Examples: detalles de Habitos no publicados
      | ruta                         |
      | /habitos/alimentacion        |
      | /en/habits/nutrition         |
      | /habitos/movimiento          |
      | /en/habits/movement          |
      | /habitos/mente-espiritu      |
      | /en/habits/mind-spirit       |

  @slice-2
  Scenario Outline: Las celebraciones enlazan al pilar correspondiente
    Given que una primera repeticion de "<reto>" fue compartida
    When sigo el enlace de su celebracion desde el inicio
    Then llego a "<destino>" y encuentro "<reto>" dentro del pilar

    Examples: destinos publicos nuevos
      | reto                            | destino                 |
      | Cena real, local y al atardecer | /pilares/alimentacion   |
      | Dos minutos cuentan             | /pilares/movimiento     |
      | Un vínculo consciente           | /pilares/mente-espiritu |

  @slice-3 @future
  Scenario: El indice de Pilares sustituye al indice de Habitos
    Given que abro el indice de Pilares
    When consulto los cuatro temas y mi actividad
    Then encuentro las practicas y la liga sin que exista una pagina publica de Habitos
