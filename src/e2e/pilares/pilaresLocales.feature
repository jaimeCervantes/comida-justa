# Los escenarios de extremo a extremo los ejecuta `src/e2e/pilares/pilaresLocales.spec.ts`. Los
# marcados @component los cubre
# `src/app/[locale]/pilares/components/PillarLocalSection.test.tsx`.

Feature: Cerca de ti: el ritual de cada pilar enlaza con lo local

  Context:
  - Problem: los cuatro pilares ya dicen que lo local importa —el mercado y el Km 0 en Alimentacion,
    el gimnasio de barrio y la cancha en Movimiento, el encuentro cercano en Mente— pero ese texto no
    enlaza con nadie. El sitio tiene tiendas, sucursales ubicadas, publicaciones categorizadas y
    distancias ya calculadas, y la pantalla donde se pide la accion no los menciona. Quien termina de
    leer su ritual y quiere actuar tiene que salir a buscar por su cuenta, adivinando que de todo el
    catalogo pertenece al pilar que acaba de leer.
  - Savings: el puente ya esta pagado por los dos lados y solo falta el tramo de en medio. La
    taxonomia de la base ya son los cuatro pilares, asi que no hay migracion ni modelo nuevo: es
    mapear pilar a categoria y reusar consultas que ya ordenan por cercania. Para quien lee, ahorra
    la busqueda entera; para quien vende, convierte cuatro paginas de mucho trafico en la puerta de
    entrada a su tienda.
  - Why: los pilares dicen que hacer y las secciones de comunidad dicen quien esta cerca, y nunca se
    habian mirado. Es tambien lo que le da sentido a publicar: hoy los tres pilares que no son
    Alimentacion no tienen una sola publicacion, y nadie tiene motivo para ser el primero porque no
    hay donde aparecer.

  As a persona que acaba de leer el ritual de un pilar
  I want ver a quien de mi zona le compro o con quien voy para practicarlo
  So that el habito se practique con la gente del pueblo y no solo en la teoria

  @slice-1
  Scenario Outline: Cada pilar ofrece lo suyo, no el catalogo entero
    Given que abro el pilar en "<ruta>"
    When llego a la seccion "Cerca de ti"
    Then la seccion declara la categoria "<categoria>"

    Examples: la taxonomia de la base ya son los cuatro pilares
      | ruta                    | categoria              |
      | /pilares/alimentacion   | alimentacion           |
      | /pilares/movimiento     | movimiento_y_ejercicio |
      | /pilares/mente-espiritu | mente_y_espiritu       |
      | /pilares/sueno          | sueno_y_descanso       |

  @slice-1
  Scenario: Alimentacion muestra lo que hay cerca y a quien se lo compro
    Given que la tienda "Hazlo Sano" tiene su sucursal en el ancla de la comunidad
    And que publica "Jugo Verde" a 40 en la categoria "alimentacion"
    When abro "/pilares/alimentacion"
    Then la seccion "Cerca de ti" muestra "Jugo Verde"
    And muestra la tienda "Hazlo Sano" con su distancia
    And ofrece ver el resto en "/categoria/alimentacion"

  @slice-1
  Scenario: Un pilar sin nadie registrado invita a publicar en vez de fingir una lista
    Given que "movimiento_y_ejercicio" no tiene ninguna publicacion
    When abro "/pilares/movimiento"
    Then la seccion "Cerca de ti" dice que aun no hay nadie registrado cerca
    And no pinta ninguna tarjeta
    And ofrece publicar, y ese enlace lleva a "/publicar"

  @slice-1
  Scenario: Publicar bajo un pilar lo llena sin tocar a los otros tres
    Given que "movimiento_y_ejercicio" no tiene ninguna publicacion
    When se publica "Clases de baile en la plaza" en "movimiento_y_ejercicio" sin sub-categoria
    Then "/pilares/movimiento" muestra "Clases de baile en la plaza"
    And "/pilares/sueno" sigue diciendo que aun no hay nadie registrado cerca

  @slice-1
  Scenario: Lo mas cercano va primero
    Given una tienda "Gimnasio del Barrio" a 2 km del ancla que publica "Rutina de fuerza" en "movimiento_y_ejercicio"
    And una tienda "Gimnasio Lejano" a 120 km del ancla que publica "Rutina de resistencia" en "movimiento_y_ejercicio"
    When abro "/pilares/movimiento" sin ubicacion conocida
    Then "Gimnasio del Barrio" aparece antes que "Gimnasio Lejano"

  @slice-1 @component
  # Vitest y no Playwright: el color sale de la clave del pilar y no depende del navegador ni de la
  # base. La paridad es.json/en.json ya la impone `typecheck` contra `next-intl.d.ts`.
  Scenario Outline: Cada pilar pinta su seccion con su propio color
    Given que la seccion se pinta para el pilar "<pilar>"
    Then lleva el token "<token>" y se anuncia como la seccion de "<pilar>"

    Examples: el color dice de que pilar es antes de leer nada
      | pilar      | token               |
      | sleep      | pillar-sleep        |
      | nutrition  | pillar-nutrition    |
      | movement   | pillar-movement     |
      | mindSpirit | pillar-mind-spirit  |

  @slice-1 @component
  Scenario: Una tienda sin catalogo o un producto sin tienda no vacian la seccion
    Given que el pilar tiene tiendas pero ninguna publicacion
    Then la seccion sigue mostrando las tiendas y no invita a publicar
    And al reves tambien: con publicaciones y sin tiendas, sigue mostrandolas

  @slice-1
  Scenario: La seccion no toca el ritual
    Given que abro "/pilares/alimentacion" con sesion
    When registro un ciclo desde el panel de la practica
    Then el progreso se guarda bajo la clave "nutrition-one-plant-v1"
    And la seccion "Cerca de ti" sigue debajo de la practica

  @slice-2 @future
  Scenario: Cada pilar ofrece acompañamiento aunque no haya negocios registrados
    Given que abro un pilar sin publicaciones
    When leo la seccion de grupos
    Then encuentro al menos un grupo o profesional de la zona
    And los grupos de anonimato se enlazan a su directorio oficial, nunca por sede

  @slice-3 @future
  Scenario: Una tienda aparece en su pilar antes de publicar nada
    Given una tienda que declara su pilar
    When abro ese pilar
    Then la tienda aparece aunque todavia no tenga publicaciones
