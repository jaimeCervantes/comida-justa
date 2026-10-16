Feature: Difusión en grupos de Facebook

  Context:
  - Problem: publicar en grupos de Facebook es copiar y pegar, a mano y de memoria. El texto de
    masa madre que circula anuncia diez sabores y el catálogo tiene seis: Integral, Ajo, Dátiles
    con Nuez y Queso Parmesano con Aceitunas no existen en la base, y nadie se entera de qué se
    agotó ni de qué precio cambió hasta que pregunta un comprador. Tampoco queda registro de en qué
    grupo se publicó qué ni cuándo, y repetir antes de tiempo es lo que hace que un grupo o
    Facebook restrinjan la cuenta.
  - Savings: minutos por publicación, porque el texto sale armado y se copia de un toque. Ningún
    anuncio de lo agotado ni con precio viejo. Menos riesgo de perder la cuenta o los grupos.
  - Why: los grupos son donde está el comprador local. Esto convierte el inventario en
    publicaciones constantes sin automatizar nada que Facebook prohíba.

  As administrador de la tienda
  I want escribir una sola vez el texto de cada línea de productos y copiarlo listo para cada grupo
  So that publique en grupos en minutos, sin anunciar lo agotado ni precios viejos y sin saturarlos

  # Facebook cerró su API de grupos en 2024: ninguna app puede publicar en ellos. Aquí nada se
  # publica solo; la app prepara y la persona da el clic. Ver
  # `docs/features/commerce/030-2026-10-04-difusion-en-grupos.md`.

  # Los panes reales NO se tocan: sus existencias cambian cada día y la suite no puede depender de
  # cuántas canelas quedan hoy. Se siembran dentro de "Hazlo Sano" con los precios reales del
  # catálogo y se borran al terminar, junto con las publicaciones para grupos que se creen.

  Background:
    Given en "Hazlo Sano" están sembrados estos panes, con la etiqueta y el emoji que llevan en la publicación "Masa madre":
      | producto                       | precio | existencias | etiqueta           | emoji |
      | Pan de Masa Madre Natural      | 96     | 2           | Natural            | 🌾    |
      | Pan de Masa Madre con Semillas | 125    | 5           | Semillas           | 🌻    |
      | Pan de masa madre de arándanos | 125    | 5           | Arándanos          |       |
      | Pan de masa madre de canela    | 125    | 2           | Canela             |       |
      | Pan de Masa Madre de Chocolate | 136    | 5           | Chocolate Orgánico | 🍫    |
    And el texto de "Masa madre" antes de la lista es:
      """
      ¿Te inflama el pan comercial? Pásate a la Masa Madre en Hazlo Sano. 📲2781126948
      🛒 DISPONIBLES EN TIENDA (1 kg). Pasa por el tuyo a Hazlo Sano:
      """
    And el texto de "Masa madre" después de la lista es:
      """
      📲 Pedidos WhatsApp: https://wa.me/522781126948
      """

  # ---------------------------------------------------------------------------------------------
  # Slice 1 — La publicación para grupos normales
  # ---------------------------------------------------------------------------------------------

  @slice-1
  Scenario: Armo la publicación de masa madre y la lista sale de lo que hay
    When como administrador creo la publicación "Masa madre" con esos textos y esos panes, en ese orden
    Then el texto para grupos queda exactamente así:
      """
      ¿Te inflama el pan comercial? Pásate a la Masa Madre en Hazlo Sano. 📲2781126948
      🛒 DISPONIBLES EN TIENDA (1 kg). Pasa por el tuyo a Hazlo Sano:
      🌾 Natural — $96
      🌻 Semillas / Arándanos / Canela — $125
      🍫 Chocolate Orgánico — $136

      📲 Pedidos WhatsApp: https://wa.me/522781126948
      """

  @slice-1
  Scenario: Copiar deja el texto listo para pegar en Facebook
    Given la publicación "Masa madre" ya está guardada
    When como administrador la abro y pulso "Copiar"
    Then el portapapeles tiene exactamente el texto para grupos que se ve en la pantalla
    And la pantalla confirma que se copió

  @slice-1
  Scenario: Lo agotado no se anuncia y me dice por qué
    Given la publicación "Masa madre" ya está guardada
    And "Pan de masa madre de canela" se queda sin existencias
    When como administrador la abro
    Then el texto para grupos dice "🌻 Semillas / Arándanos — $125"
    And junto al texto se avisa que "Canela" quedó fuera por "agotado"

  # Es la promesa que justifica generar la lista en vez de guardarla escrita: el precio viejo no
  # puede sobrevivir en ningún texto.
  @slice-1
  Scenario: Un precio nuevo llega solo, sin tocar la publicación
    Given la publicación "Masa madre" ya está guardada
    And "Pan de Masa Madre Natural" sube a 100
    When como administrador la abro
    Then el texto para grupos dice "🌾 Natural — $100"

  @slice-1
  Scenario: Si no queda nada que anunciar, no hay qué copiar
    Given la publicación "Masa madre" ya está guardada
    And todos sus panes se quedan sin existencias
    When como administrador la abro
    Then se me dice que hoy no tiene nada que anunciar
    And no se ofrece "Copiar"

  @slice-1
  Scenario: Corrijo una etiqueta y el texto la toma
    Given la publicación "Masa madre" ya está guardada
    When como administrador cambio la etiqueta de "Pan de Masa Madre de Chocolate" a "Chocolate" y guardo
    Then el texto para grupos dice "🍫 Chocolate — $136"

  @slice-1
  Scenario: Quien no es administrador no la encuentra
    Given la publicación "Masa madre" ya está guardada
    When una cuenta que no es administradora abre la lista de publicaciones para grupos
    Then ve la página de "no encontrado"

  # Las reglas de la lista y del texto se comprueban en Vitest sobre las funciones del dominio que
  # los arman: son tablas de casos, no recorridos de pantallas, y no usan la siembra de arriba.
  # «⏎» marca un salto de renglón dentro de una celda.

  @slice-1 @component
  Scenario Outline: Cada pan sale en la lista o queda fuera con su motivo
    Given el pan "<etiqueta>" a <precio>, <estado>
    When se arma la lista
    Then "<etiqueta>" <resultado>

    Examples:
      | etiqueta      | precio | estado                                       | resultado                  |
      | Natural       | 96     | publicado, con 2 existencias                 | sale en "Natural — $96"    |
      | Semillas      | 125    | publicado, sin inventario y disponible       | sale en "Semillas — $125"  |
      | Canela        | 125    | publicado, con 0 existencias                 | queda fuera: agotado       |
      | Hierbas finas | 125    | publicado, sin inventario y apagado a mano   | queda fuera: no disponible |
      | Integral      | —      | publicado, con 3 existencias                 | queda fuera: sin precio    |
      | Chocolate     | 136    | en revisión, con 5 existencias               | queda fuera: no publicado  |

  @slice-1 @component
  Scenario Outline: Los del mismo precio comparten renglón y los renglones van del más barato al más caro
    Given estos panes disponibles, agregados en este orden: <agregados>
    When se arma la lista
    Then la lista es "<lista>"

    Examples:
      | agregados                                    | lista                                       | por qué                                      |
      | 🌾 Natural 96, 🌻 Semillas 125, Canela 125   | 🌾 Natural — $96⏎🌻 Semillas / Canela — $125 | el mismo precio comparte renglón             |
      | 🍫 Chocolate 136, 🌾 Natural 96              | 🌾 Natural — $96⏎🍫 Chocolate — $136          | del más barato al más caro, no por orden     |
      | Canela 125, 🌻 Semillas 125                  | 🌻 Canela / Semillas — $125                  | el renglón lleva el primer emoji que aparezca |
      | 🌻 Semillas 125, 🫐 Arándanos 125            | 🌻 Semillas / Arándanos — $125               | los emojis de los demás no se repiten        |

  @slice-1 @component
  Scenario Outline: El precio se escribe como en un letrero
    Given un pan disponible a <precio>
    When se arma la lista
    Then su renglón termina en "<se lee>"

    Examples:
      | precio | se lee |
      | 96     | $96    |
      | 140.00 | $140   |
      | 96.50  | $96.50 |
      | 1250   | $1,250 |

  @slice-1 @component
  Scenario Outline: El texto se arma con lo que haya antes y después de la lista
    Given una publicación con texto antes "<antes>", texto después "<después>" y la lista "🌾 Natural — $96"
    When se arma el texto para grupos
    Then el texto es "<texto>"

    Examples:
      | antes    | después              | texto                                          |
      | Hay pan: | Pedidos por WhatsApp | Hay pan:⏎🌾 Natural — $96⏎⏎Pedidos por WhatsApp |
      |          | Pedidos por WhatsApp | 🌾 Natural — $96⏎⏎Pedidos por WhatsApp          |
      | Hay pan: |                      | Hay pan:⏎🌾 Natural — $96                       |

  @slice-1 @component
  Scenario Outline: Lo que falta se rechaza sin guardar nada
    When guardo una publicación con nombre "<nombre>" y un pan con etiqueta "<etiqueta>"
    Then <resultado>

    Examples:
      | nombre     | etiqueta | resultado                                |
      | Masa madre | Natural  | se guarda                                |
      |            | Natural  | se pide el nombre y no se guarda nada    |
      | Masa madre |          | se pide la etiqueta y no se guarda nada  |

  # ---------------------------------------------------------------------------------------------
  # Slice 2 — Artículos de compraventa y fotos
  # ---------------------------------------------------------------------------------------------

  # En un grupo de compraventa Facebook pide un artículo con título, precio y descripción, y al
  # terminar deja elegir más grupos de compraventa. El precio es uno solo, así que se publica un
  # artículo por pan: «$96» en un artículo donde casi todo cuesta $125 se siente engañoso.

  # Lo agotado no genera artículo: es la misma regla de la lista, no otra.
  @slice-2
  Scenario: Cada pan disponible es un artículo de compraventa con su precio exacto
    Given la publicación "Masa madre" ya está guardada
    And "Pan de masa madre de canela" se queda sin existencias
    When como administrador la abro
    Then para grupos de compraventa veo estos artículos, en el orden de la publicación:
      | título                         | precio |
      | Pan de Masa Madre Natural      | 96     |
      | Pan de Masa Madre con Semillas | 125    |
      | Pan de masa madre de arándanos | 125    |
      | Pan de Masa Madre de Chocolate | 136    |
    And la descripción que se ofrece para todos es el texto para grupos

  @slice-2
  Scenario: Copio el título y el precio de un artículo, cada uno por separado
    Given la publicación "Masa madre" ya está guardada
    When como administrador la abro y copio el título de "Pan de Masa Madre de Chocolate"
    Then el portapapeles tiene "Pan de Masa Madre de Chocolate"
    When copio su precio
    Then el portapapeles tiene "136"

  @slice-2
  Scenario: Las fotos de cada pan están a la mano para subirlas
    Given la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then cada artículo enseña las fotos de su pan
    And cada foto se abre en grande, en otra pestaña, para guardarla

  # El campo de precio de Facebook es un número: sin «$» ni comas, que no siempre acepta.
  @slice-2 @component
  Scenario Outline: El precio va como lo pide el campo de Facebook
    Given un pan disponible a <precio>
    When se arman sus artículos de compraventa
    Then su precio se copia como "<se copia>"

    Examples:
      | precio | se copia |
      | 96     | 96       |
      | 140.00 | 140      |
      | 96.50  | 96.50    |
      | 1250   | 1250     |

  @slice-2 @component
  Scenario: Sin nada disponible no hay artículos
    Given una publicación cuyos panes se agotaron todos
    When se arman sus artículos de compraventa
    Then no hay ninguno

  # ---------------------------------------------------------------------------------------------
  # Slice 3 — Los grupos y dónde quedó publicada
  # ---------------------------------------------------------------------------------------------

  # Los grupos son datos: se dan de alta desde la pantalla con su dirección, su tipo y cada cuántos
  # días aceptan una publicación de la misma persona. Nada se publica solo: después de publicar en
  # Facebook se marca en la app dónde quedó, incluidos los grupos que se eligieron en «más grupos».

  @slice-3
  Scenario: Doy de alta un grupo con su tipo y su ritmo
    When como administrador doy de alta este grupo:
      | campo             | valor                                              |
      | nombre            | Compra Venta Orizaba                               |
      | dirección         | https://www.facebook.com/groups/compraventaorizaba |
      | tipo              | compraventa                                        |
      | cada cuántos días | 7                                                  |
      | reglas            | Solo los sábados, con foto y precio                |
    Then la lista de grupos lo enseña como "Compraventa · cada 7 días"
    And su nombre abre "https://www.facebook.com/groups/compraventaorizaba" en otra pestaña

  @slice-3
  Scenario: El tipo del grupo decide en qué formato se ofrece
    Given están dados de alta el grupo normal "Mamás de Orizaba" y el de compraventa "Compra Venta Orizaba"
    And la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then "Mamás de Orizaba" aparece junto al texto para grupos normales, con su enlace para abrirlo
    And "Compra Venta Orizaba" aparece junto a los artículos de compraventa, con su enlace para abrirlo

  @slice-3
  Scenario: Marco en qué grupos normales quedó publicada, varios a la vez
    Given están dados de alta los grupos normales "Mamás de Orizaba" y "Emprendedores de Orizaba"
    And la publicación "Masa madre" ya está guardada
    When como administrador la marco publicada en los dos
    Then cada uno dice que la última vez fue "hoy"
    And quedan registradas estas publicaciones:
      | grupo                    | producto           |
      | Mamás de Orizaba         | (la línea entera)  |
      | Emprendedores de Orizaba | (la línea entera)  |

  @slice-3
  Scenario: Marco un artículo publicado en los grupos de compraventa que elegí en Facebook
    Given están dados de alta los grupos de compraventa "Compra Venta Orizaba" y "Vendo y Compro Córdoba"
    And la publicación "Masa madre" ya está guardada
    When como administrador marco el artículo de "Pan de Masa Madre de Chocolate" publicado en los dos
    Then en su artículo cada grupo dice que la última vez fue "hoy"
    And en el artículo de "Pan de Masa Madre Natural" los dos siguen en "nunca"

  @slice-3 @component
  Scenario Outline: Un grupo se guarda solo con lo que Facebook entiende
    When guardo un grupo con nombre "<nombre>", dirección "<dirección>" y cada "<días>" días
    Then <resultado>

    Examples:
      | nombre               | dirección                                          | días | resultado                                                        |
      | Compra Venta Orizaba | https://www.facebook.com/groups/compraventaorizaba | 7    | se guarda                                                        |
      | Compra Venta Orizaba | facebook.com/groups/compraventaorizaba             | 7    | se guarda como "https://facebook.com/groups/compraventaorizaba"  |
      |                      | https://www.facebook.com/groups/compraventaorizaba | 7    | se pide el nombre                                                |
      | Compra Venta Orizaba | compra venta                                       | 7    | se pide una dirección válida                                     |
      | Compra Venta Orizaba | javascript:alert(1)                                | 7    | se pide una dirección válida                                     |
      | Compra Venta Orizaba | https://www.facebook.com/groups/compraventaorizaba | -1   | se piden los días: de 0 a 365                                    |
      | Compra Venta Orizaba | https://www.facebook.com/groups/compraventaorizaba | 0    | se guarda: 0 es sin límite                                       |

  # «Hoy», «ayer» y «hace N días» se cuentan en días de calendario de México, no en horas: lo
  # publicado a las 23:50 fue «ayer» a las 00:10.
  @slice-3 @component
  Scenario Outline: La última vez se dice en días de calendario
    Given la última publicación en un grupo fue el "<cuándo>"
    When se mira el "<ahora>"
    Then se lee "<se lee>"

    Examples:
      | cuándo                    | ahora                     | se lee      |
      | 2026-10-13 09:00 (México) | 2026-10-13 18:00 (México) | hoy         |
      | 2026-10-12 23:50 (México) | 2026-10-13 00:10 (México) | ayer        |
      | 2026-10-06 12:00 (México) | 2026-10-13 12:00 (México) | hace 7 días |
      | (nunca)                   | 2026-10-13 12:00 (México) | nunca       |

  # ---------------------------------------------------------------------------------------------
  # Slice 3.1 — Migas de pan
  # ---------------------------------------------------------------------------------------------

  # Salió de probarlo: dentro de una publicación o de un grupo no había forma de saber dónde se
  # estaba ni de subir un nivel, más que el enlace de «volver» de cada pantalla. Las migas usan el
  # mismo componente que el catálogo y el detalle de una publicación.

  @slice-3-1
  Scenario: Las migas de pan dicen dónde estoy y me suben un nivel
    Given la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then las migas de pan dicen "Inicio / Difusión en grupos / Masa madre"
    When pulso "Difusión en grupos" en ellas
    Then estoy en la lista de publicaciones para grupos

  @slice-3-1
  Scenario: Desde el alta de un grupo vuelvo a la lista de grupos
    When como administrador abro el alta de un grupo
    Then las migas de pan dicen "Inicio / Difusión en grupos / Grupos / Nuevo grupo"
    When pulso "Grupos" en ellas
    Then estoy en la lista de grupos

  @slice-3-1 @component
  Scenario Outline: Cada pantalla de difusión tiene su camino
    When abro <pantalla>
    Then las migas de pan dicen "<camino>"

    Examples:
      | pantalla                             | camino                                                      |
      | la lista de publicaciones            | Inicio / Difusión en grupos                                 |
      | una publicación nueva                | Inicio / Difusión en grupos / Nueva publicación             |
      | la publicación "Masa madre"          | Inicio / Difusión en grupos / Masa madre                    |
      | la edición de "Masa madre"           | Inicio / Difusión en grupos / Masa madre / Editar           |
      | la lista de grupos                   | Inicio / Difusión en grupos / Grupos                        |
      | el alta de un grupo                  | Inicio / Difusión en grupos / Grupos / Nuevo grupo          |
      | la edición de "Compra Venta Orizaba" | Inicio / Difusión en grupos / Grupos / Compra Venta Orizaba |

  # ---------------------------------------------------------------------------------------------
  # Slice 4 — El ritmo
  # ---------------------------------------------------------------------------------------------

  # El ritmo es lo que de verdad evita el bloqueo: un grupo saca a quien publica más seguido de lo
  # que sus reglas permiten, y Facebook toma por spam muchas publicaciones el mismo día. Nada de esto
  # impide publicar: avisa, y la persona decide.

  # El turno de un grupo cuenta desde lo último que se publicó ahí, sea del texto que sea: la regla
  # del grupo es «una publicación tuya cada N días», no una por texto.
  @slice-4
  Scenario: Me dice a qué grupos ya les toca
    Given están dados de alta los grupos normales "Mamás de Orizaba" y "Emprendedores de Orizaba", cada uno acepta una publicación cada 7 días
    And en "Mamás de Orizaba" publiqué hace 3 días y en "Emprendedores de Orizaba" hace 8
    And la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then "Mamás de Orizaba" dice "Todavía no: en 4 días"
    And "Emprendedores de Orizaba" dice "Ya le toca"

  @slice-4
  Scenario: En compraventa me sugiere qué pan toca hoy en cada grupo
    Given está dado de alta el grupo de compraventa "Compra Venta Orizaba"
    And ahí publiqué el Natural hace 2 días y las Semillas ayer
    And la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then "Compra Venta Orizaba" sugiere "Hoy toca: Pan de masa madre de arándanos"

  # El conteo es de todas las publicaciones de hoy, en hora de México, en cualquier grupo.
  @slice-4
  Scenario: Me avisa al llegar al tope del día, sin impedirme publicar
    Given hoy ya marqué 10 publicaciones en grupos
    And la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then se me avisa que hoy ya llevo 10 de 10 y que mejor siga mañana
    And sigo pudiendo marcarla publicada

  @slice-4 @component
  Scenario Outline: A un grupo le toca según cada cuántos días acepta una publicación
    Given un grupo que acepta una publicación cada <cada> días
    And la última publicación ahí fue <cuándo>
    Then se lee "<se lee>"

    Examples:
      | cada | cuándo      | se lee                 | por qué                                  |
      | 7    | hace 3 días | Todavía no: en 4 días  | faltan 4 para cumplir los 7              |
      | 7    | hace 7 días | Ya le toca             | se cumplieron justo                      |
      | 7    | nunca       | Ya le toca             | nada que esperar                         |
      | 1    | hoy         | Todavía no: mañana     | una al día y ya hubo hoy                 |
      | 1    | ayer        | Ya le toca             | una al día y la de ayer ya cuenta        |
      | 0    | hoy         | Ya le toca             | 0 es sin límite                          |

  @slice-4 @component
  Scenario Outline: El pan que toca es el que lleva más tiempo sin publicarse en ese grupo
    Given en un grupo de compraventa la última vez de cada pan disponible fue: <historial>
    Then hoy toca "<toca>"

    Examples:
      | historial                                                  | toca      | por qué                                         |
      | Natural hace 2 días, Semillas ayer, Arándanos nunca        | Arándanos | lo que nunca se publicó va primero              |
      | Natural hace 5 días, Semillas hace 2 días                  | Natural   | si todo se publicó, el de hace más tiempo       |
      | Natural nunca, Semillas nunca                              | Natural   | empate: manda el orden de la publicación        |

  @slice-4 @component
  Scenario Outline: El conteo del día avisa al llegar al tope
    Given hoy ya marqué <llevas> publicaciones en grupos
    Then se lee "<se lee>"

    Examples:
      | llevas | se lee                                                                                       |
      | 3      | Hoy llevas 3 de 10 publicaciones en grupos.                                                  |
      | 10     | Hoy ya llevas 10 de 10. Más publicaciones el mismo día se parecen a spam: mejor sigue mañana. |
      | 12     | Hoy ya llevas 12 de 10. Más publicaciones el mismo día se parecen a spam: mejor sigue mañana. |

  # ---------------------------------------------------------------------------------------------
  # Slice 4.1 — La pausa entre publicaciones, y el ritmo configurable
  # ---------------------------------------------------------------------------------------------

  # Salió de probarlo: el tope del día no dice nada si las primeras ocho van en cinco minutos, y
  # publicar en ráfaga es otra de las cosas que Facebook toma por spam. La pausa cuenta desde lo
  # último que se marcó en cualquier grupo y, como el tope, avisa sin impedir nada. Los dos valores
  # se cambian por variable de entorno, sin tocar código.

  @slice-4-1
  Scenario: Me sugiere una pausa después de publicar
    Given acabo de marcar una publicación en un grupo
    And la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then se me dice "Acabas de publicar: espera unos 10 minutos antes de la siguiente."
    And sigo pudiendo marcarla publicada

  @slice-4-1 @component
  Scenario Outline: La pausa cuenta desde lo último que se marcó, en cualquier grupo
    Given la pausa entre publicaciones es de <pausa> minutos
    And lo último que marqué fue <cuándo>
    Then se lee "<se lee>"

    Examples:
      | pausa | cuándo           | se lee                                                                                |
      | 10    | hace un momento  | Acabas de publicar: espera unos 10 minutos antes de la siguiente.                      |
      | 10    | hace 4 minutos   | Tu última publicación fue hace 4 minutos: espera unos 6 minutos más antes de la siguiente. |
      | 10    | hace 9 minutos   | Tu última publicación fue hace 9 minutos: espera un minuto más antes de la siguiente.  |
      | 10    | hace 10 minutos  | (nada: ya pasó la pausa)                                                              |
      | 10    | nunca            | (nada: no hay de qué descansar)                                                       |
      | 0     | hace un momento  | (nada: la pausa está apagada)                                                         |

  @slice-4-1 @component
  Scenario Outline: El tope y la pausa se cambian por variable de entorno, y lo inválido se ignora
    Given OUTREACH_DAILY_LIMIT vale "<tope>" y OUTREACH_PAUSE_MINUTES vale "<pausa>"
    Then el tope del día queda en <tope queda> y la pausa en <pausa queda> minutos

    Examples:
      | tope   | pausa | tope queda | pausa queda | por qué                                   |
      |        |       | 10         | 10          | sin variables, los valores por omisión    |
      | 15     | 5     | 15         | 5           | lo que diga el entorno                    |
      | 0      | 0     | 10         | 0           | un tope de 0 no sirve; una pausa de 0 la apaga |
      | diez   | 10m   | 10         | 10          | lo que no es un número entero se ignora   |
      | 500    | 300   | 10         | 10          | fuera de rango se ignora                  |

  # ---------------------------------------------------------------------------------------------
  # Slice 5 — Pie compartido y versiones que se turnan
  # ---------------------------------------------------------------------------------------------

  # El pie es el bloque de contacto que hoy se repite al final de cada texto. Es un registro propio
  # y no un ajuste global: cada publicación elige el suyo, y así la suite crea los suyos sin tocar
  # nunca el de verdad en la base compartida.

  @slice-5
  Scenario: El pie es uno para todas las publicaciones que lo llevan
    Given está dado de alta el pie "Hazlo Sano" con:
      """
      📍 Ubicación: https://maps.app.goo.gl/rp6RjiBQniCgKmbr8
      📲 Pedidos WhatsApp: https://wa.me/522781126948
      """
    And las publicaciones "Masa madre" y "Masa madre de temporada" ya están guardadas con ese pie
    When como administrador cambio el WhatsApp del pie a "https://wa.me/522781000000"
    Then el texto para grupos de las dos termina con:
      """
      📍 Ubicación: https://maps.app.goo.gl/rp6RjiBQniCgKmbr8
      📲 Pedidos WhatsApp: https://wa.me/522781000000
      """

  # Con dos versiones y dos grupos, cada grupo recibe una distinta el mismo día, y al día siguiente
  # se intercambian: Facebook no ve el mismo texto en dos grupos, ni el mismo grupo dos días.
  @slice-5
  Scenario: Las versiones del texto se turnan entre grupos
    Given están dados de alta los grupos normales "Mamás de Orizaba" y "Emprendedores de Orizaba"
    And la publicación "Masa madre" ya está guardada con una segunda versión del texto antes de la lista
    When como administrador la abro
    Then veo el texto armado de cada versión, cada uno con su «Copiar»
    And a cada grupo le toca una versión distinta

  @slice-5 @component
  Scenario Outline: El texto se arma con su versión, la lista, lo de después y el pie
    Given una publicación con texto antes "<antes>", texto después "<después>", el pie "<pie>" y la lista "🌾 Natural — $96"
    When se arma el texto para grupos
    Then el texto es "<texto>"

    Examples:
      | antes    | después   | pie                  | texto                                                        |
      | Hay pan: | MM Naturalmente | 📲 Pedidos WhatsApp | Hay pan:⏎🌾 Natural — $96⏎⏎MM Naturalmente⏎⏎📲 Pedidos WhatsApp |
      | Hay pan: |           | 📲 Pedidos WhatsApp  | Hay pan:⏎🌾 Natural — $96⏎⏎📲 Pedidos WhatsApp               |
      | Hay pan: | MM Naturalmente |                | Hay pan:⏎🌾 Natural — $96⏎⏎MM Naturalmente                   |

  @slice-5 @component
  Scenario Outline: A cada grupo le toca una versión, y se turnan día con día
    Given una publicación con <versiones> versiones y los grupos normales en orden "<grupos>"
    When se miran el día <día>
    Then a cada grupo le toca "<le toca>"

    Examples:
      | versiones | grupos     | día | le toca                 | por qué                                  |
      | 2         | Mamás, Emprendedores | 0 | versión 1, versión 2 | el mismo día, dos grupos, dos versiones |
      | 2         | Mamás, Emprendedores | 1 | versión 2, versión 1 | al día siguiente se intercambian        |
      | 3         | A, B, C    | 0   | versión 1, versión 2, versión 3 | tantas versiones como grupos: todas distintas |
      | 2         | A, B, C    | 0   | versión 1, versión 2, versión 1 | más grupos que versiones: se reparten parejo |
      | 1         | A, B       | 5   | versión 1, versión 1    | con una sola versión no hay qué turnar   |

  @slice-5 @component
  Scenario Outline: Un pie se guarda solo con su nombre y algo que decir
    When guardo un pie con nombre "<nombre>" y texto "<texto>"
    Then <resultado>

    Examples:
      | nombre     | texto                       | resultado              |
      | Hazlo Sano | 📲 Pedidos WhatsApp: wa.me/… | se guarda              |
      |            | 📲 Pedidos WhatsApp: wa.me/… | se pide el nombre      |
      | Hazlo Sano |                             | se pide el texto       |

  # ---------------------------------------------------------------------------------------------
  # Slice 6 — Borrar lo que ya no se usa
  # ---------------------------------------------------------------------------------------------

  # Salió de usarlo: un grupo que cerró, una publicación de temporada o un pie viejo se quedaban en
  # las listas para siempre. Borrar no se puede deshacer, así que cada botón pide confirmación y dice
  # qué más se va con lo que se borra.
  #
  # Borrar una publicación NO borra cuándo se publicó en cada grupo: esas fechas son la memoria del
  # ritmo —el turno de cada grupo, el tope del día, la pausa—, y perderlas haría que los grupos
  # donde se publicó volvieran a ofrecerse como nunca publicados, que es justo lo que hace que
  # Facebook bloquee. Para eso es la migración 0063 de hazlo-sano-bot. Borrar un grupo sí se lleva
  # su historial: sin el grupo, su turno ya no le sirve a nadie.

  # La memoria está en el turno, que cuenta lo publicado con cualquier texto: el grupo acepta una
  # cada 7 días y se publicó hace 2, así que le faltan 5. Sin ella diría «Ya le toca». «Última vez
  # aquí» no sirve para esto: es de cada publicación, y "Pan de temporada" nunca se publicó ahí.
  @slice-6
  Scenario: Borro una publicación que ya no uso, y los grupos recuerdan cuándo se publicó
    Given la publicación "Masa madre" ya está guardada
    And la marqué publicada hace 2 días en el grupo normal "Mamás de Orizaba"
    And la publicación "Pan de temporada" también está guardada
    When como administrador borro "Masa madre" desde su edición y lo confirmo
    Then ya no aparece en la lista de publicaciones para grupos
    And en "Pan de temporada" el grupo "Mamás de Orizaba" dice "Todavía no: en 5 días"

  @slice-6
  Scenario: Borro un grupo que cerró, y deja de ofrecerse
    Given está dado de alta el grupo normal "Mamás de Orizaba"
    And la publicación "Masa madre" ya está guardada
    When como administrador lo borro desde su edición y lo confirmo
    Then ya no aparece en la lista de grupos
    And la publicación "Masa madre" ya no lo ofrece para publicar

  @slice-6
  Scenario: Borro un pie, y las publicaciones que lo llevaban se quedan sin él
    Given está dado de alta el pie "Hazlo Sano" con "📍 Ubicación: https://maps.app.goo.gl/rp6RjiBQniCgKmbr8"
    And la publicación "Masa madre" ya está guardada con ese pie
    When como administrador lo borro desde su edición y lo confirmo
    Then ya no aparece en la lista de pies
    And la publicación "Masa madre" sigue ahí, y su texto ya no termina con el pie

  @slice-6 @component
  Scenario: Sin confirmar no se borra nada
    When pulso «Borrar» y después «Cancelar»
    Then no se manda nada a borrar
    And vuelve a ofrecerse «Borrar»

  # ---------------------------------------------------------------------------------------------
  # Slice 7 — Que la publicación se entienda de un vistazo
  # ---------------------------------------------------------------------------------------------

  # Salió de usarlo: los títulos de sección no se distinguían entre sí, y cada grupo aparecía dos
  # veces —una para abrirlo, otra para marcarlo—. Ahora la publicación se lee en pasos, y cada grupo
  # normal es un solo renglón con todo lo que hace falta para publicar ahí.

  @slice-7
  Scenario: Cada grupo normal sale una sola vez, con todo lo que necesito para publicar ahí
    Given están dados de alta los grupos normales "Mamás de Orizaba" y "Emprendedores de Orizaba", cada uno acepta una publicación cada 7 días
    And en "Mamás de Orizaba" publiqué hace 3 días y en "Emprendedores de Orizaba" hace 8
    And la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then el paso "2. Publica en cada grupo y márcalo" enseña cada grupo una sola vez:
      | grupo                    | turno                 | última vez                   |
      | Mamás de Orizaba         | Todavía no: en 4 días | Última vez aquí: hace 3 días |
      | Emprendedores de Orizaba | Ya le toca            | Última vez aquí: hace 8 días |
    And cada uno tiene su enlace para abrirlo y su casilla para marcarlo
    When marco "Emprendedores de Orizaba" y confirmo
    Then "Emprendedores de Orizaba" dice "Todavía no: en 7 días" y "Última vez aquí: hoy"

  @slice-7
  Scenario: Arriba me dice a cuántos grupos les toca hoy
    Given están dados de alta los grupos normales "Mamás de Orizaba" y "Emprendedores de Orizaba", cada uno acepta una publicación cada 7 días
    And está dado de alta el grupo de compraventa "Compra Venta Orizaba"
    And en "Mamás de Orizaba" publiqué hace 3 días y en "Emprendedores de Orizaba" hace 8
    And la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then arriba se lee "Hoy les toca a 2 de 3 grupos"

  @slice-7
  Scenario Outline: Los títulos de la publicación dicen qué contiene a qué
    Given están dados de alta el grupo normal "Mamás de Orizaba" y el de compraventa "Compra Venta Orizaba"
    And la publicación "Masa madre" ya está guardada
    When como administrador la abro
    Then "<título>" es un encabezado de nivel <nivel>

    Examples:
      | título                              | nivel | por qué                                  |
      | Masa madre                          | 1     | la página: hay uno solo                  |
      | Para grupos normales                | 2     | una sección por tipo de grupo            |
      | 1. Copia el texto y las fotos       | 3     | los pasos están dentro de su sección     |
      | 2. Publica en cada grupo y márcalo  | 3     |                                          |
      | Para grupos de compraventa          | 2     |                                          |

  @slice-7 @component
  Scenario Outline: El turno se ve como insignia, verde solo cuando ya le toca
    Given un grupo cuyo turno es "<turno>"
    Then su insignia dice "<turno>" en tono "<tono>"

    Examples:
      | turno                 | tono    |
      | Ya le toca            | verde   |
      | Todavía no: mañana    | neutro  |
      | Todavía no: en 4 días | neutro  |

  # ---------------------------------------------------------------------------------------------
  # Slice 8 — Buscar productos como en la búsqueda principal
  # ---------------------------------------------------------------------------------------------

  @slice-8 @future
  Scenario: Encuentro un pan con palabras sueltas, como en el buscador del sitio
    Given como administrador abro una publicación nueva
    When busco "pan chocolate"
    Then entre los resultados está "Pan de Masa Madre de Chocolate" con su precio y su foto

  @slice-8 @future
  Scenario: Con muchos resultados, los recorro por número de página sin perder lo escrito
    Given como administrador escribí el nombre de una publicación nueva
    When busco "masa madre" y voy a la página 2
    Then veo los resultados de la página 2 y el nombre sigue escrito

  # ---------------------------------------------------------------------------------------------
  # Slice 9 — Buscar y paginar publicaciones y grupos
  # ---------------------------------------------------------------------------------------------

  @slice-9 @future
  Scenario: Busco un grupo por su nombre
    Given están dados de alta los grupos "Mamás de Orizaba", "Emprendedores de Orizaba" y "Ventas Córdoba"
    When como administrador busco "orizaba" en la lista de grupos
    Then solo veo "Mamás de Orizaba" y "Emprendedores de Orizaba"

  @slice-9 @future
  Scenario: Paso a la siguiente página y la búsqueda se conserva
    Given hay 25 grupos con "Orizaba" en el nombre
    When como administrador busco "orizaba" y voy a "Siguiente"
    Then veo los grupos 21 a 25 y el buscador sigue diciendo "orizaba"
