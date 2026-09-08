# Los escenarios de extremo a extremo los ejecuta `src/e2e/pilares/basePracticas.spec.ts`. Los
# marcados @component los cubren las pruebas de Vitest junto al componente o al caso de uso. Los
# marcados @backend los cubre pytest en `bot-whatsapp/backend/tests/`: son del bot de Telegram, que
# comparte estas mismas tablas.
# Roadmap: `docs/features/wellbeing/027-2026-09-04-base-de-datos-de-practicas.md`.

Feature: Base de datos de practicas - la practica deja de ser prosa y pasa a ser un dato

  Context:
  - Problem: no existe el objeto "practica", y eso rompe las dos aplicaciones que comparten esta base.
    En el sitio, la misma accion esta escrita tres veces por idioma: salir a recibir luz al despertar
    vive en `ritualStep1`, en `morningDescription` y en `catalogLightItem1`. Ya se desincronizaron: el
    catalogo de Sueno dice "alargando la salida del aire sin forzar" y la nota de Mente dice
    explicitamente que eso NO es lo que sostiene la evidencia, porque el ensayo de 2024 no hallo
    diferencia de HRV entre 1:1 y 1:2. Son la misma practica contradiciendose a si misma en dos
    paginas. En el bot de Telegram es peor: sus intenciones SON los cuatro pilares, 69 de sus 92
    sesiones reales pidieron uno, y en las 69 lo unico que supo hacer fue buscar productos que vender.
    Su instruccion de sistema le ordena apoyarse en conocimiento cientifico y no tiene ni un estudio a
    mano: los 116 DOIs curados viven en un array de TypeScript del otro repositorio.
  - Savings: una practica se escribe una vez y aparece donde haga falta - el ritual, el catalogo, el
    indice, el feed y la respuesta del bot. La evidencia deja de ser un vertedero de URLs y pasa a ser
    citable en los dos canales. Y `public.users` ya es una sola tabla para los dos: 15 usuarios de la
    web con email y 6 del bot con su id de Telegram, asi que registrar una practica desde cualquiera
    de los dos no cuesta modelo nuevo.
  - Why: el destino es que una practica se pueda registrar por usuario y compartirse con la comunidad,
    estilo red social, y que de igual si quien la registra entro por la web o por Telegram. Nada de eso
    se construye sobre texto traducido. Primero la practica tiene que existir como fila.

  As a persona que pregunta por un pilar, en la web o por Telegram
  I want que me contesten con una practica y con el estudio que la sostiene
  So that pueda creerle a Hazlo Sano por lo que ensena y no por lo que afirma de si mismo

  # ---------------------------------------------------------------------------------------------
  # Slice 1 - El catalogo existe, y Sueno lee su evidencia de el
  # ---------------------------------------------------------------------------------------------

  @slice-1
  Scenario: La bibliografia de Sueno deja de ser una lista de URLs
    Given que el catalogo tiene sembrados los 43 estudios del pilar Sueno
    When abro "/pilares/sueno"
    And llego a la seccion de referencias
    Then cada estudio se muestra con su titulo, su revista y su ano
    And ninguna entrada se muestra como una URL cruda

  @slice-1
  Scenario Outline: Un estudio dice que practica sostiene
    Given que el estudio "<doi>" esta ligado a la practica "<practica>"
    When abro "/pilares/sueno"
    Then la entrada de "<doi>" se titula "<titulo>"
    And declara que sostiene "<practica>"

    Examples: los tres vinculos que hoy solo viven en comentarios de `references.ts`
      | doi                      | titulo                                                                                                    | practica            |
      | 10.1210/jc.2010-2098     | Exposure to Room Light before Bedtime Suppresses Melatonin Onset and Shortens Melatonin Duration in Humans | sleep-dim-the-house |
      | 10.1186/1880-6805-31-14  | Effects of thermal environment on sleep and circadian rhythm                                               | sleep-cool-room     |
      | 10.1037/xge0000374       | The effects of bedtime writing on difficulty falling asleep                                               | sleep-mental-unload |

  @slice-1
  Scenario: El DOI sigue siendo el enlace, no el texto
    Given que el estudio "10.1037/xge0000374" esta sembrado con su titulo
    When abro "/pilares/sueno"
    Then su entrada enlaza a "https://doi.org/10.1037/xge0000374"
    And el texto visible del enlace es el titulo del estudio, no la URL

  @slice-1 @component
  Scenario: Un estudio que Crossref no conoce conserva su enlace
    # Sembrar 116 DOIs contra una API publica garantiza que alguno no responda. Perder el titulo es
    # quedarse como hoy; perder el enlace seria empeorar.
    Given que el estudio "10.36283//ziun-pjmd14-3/001" quedo sembrado sin titulo ni revista ni ano
    When se pinta la lista de referencias
    Then su entrada muestra el DOI y enlaza a "https://doi.org/10.36283//ziun-pjmd14-3/001"

  @slice-1 @component
  Scenario: Una practica que sirve a dos pilares vive una sola vez
    # Es la friccion 4 del roadmap, y la razon de que `practice_pillars` sea N:N y no una columna.
    Given que la practica "sleep-slow-breathing" esta sembrada
    When consulto sus pilares
    Then aparece en "sleep" y en "mind"
    And existe una sola fila suya en `practices`
    And solo uno de los dos pilares es el primario

  @slice-1
  Scenario Outline: Cada pilar apunta a su raiz de la taxonomia y declara como lo nombra el bot
    # `categories` tiene seis raices en la base real; dos de ellas no son pilares. Por eso `pillars`
    # existe: para que la FK tenga algo verdadero que decir. Y `bot_intent` afirma en la base la
    # equivalencia que hoy es una lista de literales en Python mas una enumeracion dentro de un
    # prompt de 5194 caracteres, sin que ninguno de los dos sepa del otro.
    Given que el catalogo de pilares esta sembrado
    When leo el pilar "<pilar>"
    Then su categoria es "<categoria>"
    And la intencion con la que el bot lo nombra es "<intencion>"

    Examples:
      | pilar     | categoria              | intencion                          |
      | sleep     | sueno_y_descanso       | Sleep and rest                     |
      | nutrition | alimentacion           | Natural and nutritious food        |
      | movement  | movimiento_y_ejercicio | Conscious movement and exercise    |
      | mind      | mente_y_espiritu       | Emotional and psychological health |

    Examples: rechazadas - una raiz que no es pilar no puede serlo
      | pilar             | categoria | intencion |
      | cuidado_personal  | no existe | no existe |
      | hogar_y_limpieza  | no existe | no existe |

  @slice-1
  Scenario: Los cuatro retos atomicos siguen intactos
    # La migracion no toca `habit_challenge_progress` ni sus 9 inscripciones reales. El puente es
    # `practices.challenge_key`, no una mudanza.
    Given que una persona ya lleva progreso en "sleep-evening-to-morning-v1"
    When abre "/pilares/sueno"
    Then su panel de reto sigue mostrando su progreso
    And la practica del catalogo con clave de reto "sleep-evening-to-morning-v1" existe

  # ---------------------------------------------------------------------------------------------
  # Slice 2 - Los otros tres pilares
  # ---------------------------------------------------------------------------------------------

  @slice-2
  Scenario: `references.ts` deja de existir
    Given que los 116 estudios y su pilar viven en `pillar_studies`
    When busco el archivo que los enumeraba
    Then ya no esta en el arbol
    And la lista que lo sustituye es la semilla, no lo que se pinta

  @slice-2
  Scenario Outline: Cada pilar dice que practicas sostienen sus estudios
    # En el slice 1 solo Sueno tenia practicas, asi que los otros tres ensenaban su bibliografia sin
    # una sola linea de "Sostiene:". Ahora los cuatro tienen las suyas.
    Given que las practicas de los cuatro pilares estan sembradas
    When abro "<ruta>"
    Then al menos un estudio declara la practica que sostiene

    Examples:
      | ruta                    |
      | /pilares/sueno          |
      | /pilares/alimentacion   |
      | /pilares/movimiento     |
      | /pilares/mente-espiritu |

  @slice-2 @component
  Scenario: La respiracion deja de contradecirse
    # El catalogo de Sueno pedia "alargar la salida del aire" y la nota de Mente decia lo contrario,
    # citando el ensayo de 2024 que no hallo diferencia. Escrita una vez, no puede volver a pasar.
    Given que "mind-slow-breathing" tiene una sola redaccion
    When la leo desde Mente y desde Sueno
    Then dice lo mismo en las dos
    And lo que dice es bajar el ritmo, no alargar la exhalacion
    And cita el estudio que la sostiene y el que acoto su alcance

  @slice-2 @component
  Scenario: Una practica renombrada no deja su fila vieja detras
    # `sleep-slow-breathing` paso a llamarse `mind-slow-breathing`. Un upsert por clave habria creado
    # la fila nueva y dejado la vieja huerfana, con sus traducciones y sus citas colgando.
    Given que la practica se sembro antes con otra clave
    When se vuelve a sembrar el catalogo
    Then la clave retirada ya no existe en `practices`

  # ---------------------------------------------------------------------------------------------
  # Slice 2d - Las anclas y el indice de practicas
  # Escenarios de extremo a extremo en `src/e2e/pilares/indiceDePracticas.spec.ts`.
  # ---------------------------------------------------------------------------------------------

  @slice-2d
  Scenario: Las 45 practicas tienen casa
    Given que el catalogo esta sembrado
    When abro "/practicas"
    Then los cuatro pilares tienen sus practicas
    And se llega ahi desde la portada de los pilares

  @slice-2d
  Scenario: Cada practica dice cuando se hace
    # La primera ley: hacerlo obvio. Sin ancla, una practica es un consejo.
    Given que las 45 practicas tienen su ancla sembrada
    When recorro la lista
    Then ninguna tarjeta se queda sin decir cuando

  @slice-2d
  Scenario: La identidad la pone el pilar, no la practica
    # Por eso no hay columna `identity`: hay 4 identidades verdaderas, no 45.
    When abro "/practicas"
    Then cada pilar dice quien es alguien que lo practica

  @slice-2d
  Scenario: Una practica compartida aparece una sola vez
    # Es lo que compro que `practice_pillars` sea N:N. Repetirla por pilar contaria como dos lo que
    # es una.
    Given que "mind-slow-breathing" sirve a Mente y a Sueno
    When abro "/practicas"
    Then aparece una sola vez
    And su tarjeta dice a que otro pilar sirve

  @slice-2e
  Scenario: Ninguna practica se publica sin respaldo
    # La promesa se endurecio: antes bastaba con que una practica sin evidencia lo dijera en vez de
    # callarlo. Ahora toda practica cita al menos un estudio, un analisis clinico o un estudio de
    # campo, y la semilla no puede introducir una sin el.
    Given que las 45 practicas estan sembradas
    When abro "/practicas"
    Then cada tarjeta declara en cuantos estudios se apoya
    And ninguna dice que no tiene ninguno

  # ---------------------------------------------------------------------------------------------
  # Slice 3 - El bot responde con la practica, y cita el estudio
  # Cubierto por pytest en `bot-whatsapp/backend/tests/`.
  # ---------------------------------------------------------------------------------------------

  @slice-3 @backend @future
  Scenario Outline: Una intencion de pilar se resuelve por la base, no por una lista en Python
    Given que llega un mensaje cuya intencion es "<intencion>"
    When el orquestador resuelve su pilar
    Then obtiene "<pilar>" desde `pillars.bot_intent`

    Examples: las cuatro intenciones que suman 69 de las 92 sesiones reales
      | intencion                          | pilar     |
      | Sleep and rest                     | sleep     |
      | Natural and nutritious food        | nutrition |
      | Conscious movement and exercise    | movement  |
      | Emotional and psychological health | mind      |

    Examples: no es un pilar y sigue siendo busqueda de catalogo
      | intencion               | pilar   |
      | Find product or service | ninguno |

  @slice-3 @backend @future
  Scenario: Preguntar por el sueno contesta con una practica antes que con un producto
    Given que las practicas de Sueno tienen su embedding sembrado
    And que alguien escribe por Telegram que no puede dormir
    When el bot responde
    Then primero ofrece una practica del pilar del descanso
    And despues ofrece lo que hay cerca para hacerla
    And no responde solo con productos

  @slice-3 @backend @future
  Scenario: La respuesta cita el estudio que la sostiene
    # Su instruccion de sistema lleva 484 mensajes pidiendo apoyarse en conocimiento cientifico, sin
    # un solo estudio a mano.
    Given que la practica ofrecida es "sleep-mental-unload"
    When el bot la envia
    Then cita el titulo, la revista y el ano de "10.1037/xge0000374"
    And enlaza a "https://doi.org/10.1037/xge0000374"

  @slice-3 @backend @future
  Scenario: La advertencia viaja pegada a la practica
    # En el sitio el articulo entero da contexto; en un chat la practica llega sola.
    Given que la practica ofrecida tiene `safety_note`
    When el bot la envia
    Then la advertencia va en el mismo mensaje

  @slice-3 @backend @future
  Scenario: Recomendar una practica no se puede comprar
    # `recommend_posts` aplica boost de membresia y de anuncios. `recommend_practices` no.
    Given que dos practicas responden igual de bien a la consulta
    When se ordenan
    Then el orden no depende de ninguna membresia ni de ningun anuncio

  # ---------------------------------------------------------------------------------------------
  # Slice 4 - Registrar una practica, desde donde sea
  # ---------------------------------------------------------------------------------------------

  # Escenarios de extremo a extremo en `src/e2e/pilares/practicasPropias.spec.ts`.

  @slice-4
  Scenario: Empezar una practica del catalogo
    Given que hay una practica publicada
    When alguien que entro la empieza desde la web
    Then queda registrada como suya con origen "web"
    And es privada mientras no diga lo contrario

  @slice-4
  Scenario: Dejarla no borra que la empezaste
    # Dejar una practica es informacion, no un error que corregir.
    Given que alguien lleva una practica
    When la deja
    Then la fila sigue existiendo, marcada con la fecha en que la dejo

  @slice-4
  Scenario: Volver reabre la misma, no inventa otra
    # Es la regla que atraviesa el producto: volver vale mas que fingir perfeccion, y para premiarlo
    # hay que saber que ya se habia empezado antes.
    Given que alguien empezo una practica y la dejo
    When la vuelve a empezar
    Then se reabre la misma adopcion
    And la fecha en que la empezo la primera vez no cambia

  @slice-4
  Scenario: El catalogo se lee entero sin entrar
    # Entrar sirve para llevar las tuyas, no para leerlo: si no, la pagina tendria dos versiones.
    Given que no hay sesion
    When abro "/practicas"
    Then veo todas las practicas
    And se me invita a entrar para empezar una

  @slice-4 @future
  Scenario: Lo empezado en Telegram se ve en la web
    # La tabla ya lo admite —`source` lo distingue y `public.users` es una sola— pero el bot todavia
    # no escribe adopciones.
    Given que alguien empezo una practica desde Telegram
    And que esa misma persona entra al sitio con su cuenta
    When abre sus practicas
    Then ve la que empezo por el chat

  # ---------------------------------------------------------------------------------------------
  # Slice 5 - Compartirla con la comunidad
  # ---------------------------------------------------------------------------------------------

  @slice-5 @future
  Scenario: Compartir una practica con la comunidad
    Given que alguien lleva una practica registrada
    When decide compartirla
    Then aparece en el muro de la comunidad
    And quien la ve puede reaccionar

  # ---------------------------------------------------------------------------------------------
  # Slice 6 - Unificar los cuatro retos (grave, aprobacion aparte)
  # ---------------------------------------------------------------------------------------------

  @slice-6 @future
  Scenario: El progreso de los cuatro retos se lee desde el modelo nuevo
    Given que existen 9 inscripciones, 18 repeticiones y 8 celebraciones reales
    When se traspasan al modelo de practicas
    Then nadie pierde su progreso
    And el jardin y la liga siguen contando lo mismo
