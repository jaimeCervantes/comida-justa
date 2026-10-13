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

  @slice-3 @future
  Scenario: Doy de alta un grupo con su tipo y su ritmo
    When como administrador doy de alta un grupo con su URL, su tipo y cada cuántos días acepta publicaciones
    Then aparece en la lista de grupos

  @slice-3 @future
  Scenario: El tipo del grupo decide el formato que me ofrece
    Given un grupo normal y uno de compraventa
    When abro la publicación "Masa madre" para cada uno
    Then al normal le ofrece el texto completo y al de compraventa los artículos

  @slice-3 @future
  Scenario: Marco en qué grupos quedó publicada, varios a la vez
    Given publiqué un artículo y en el selector de Facebook elegí dos grupos más
    When marco los tres grupos en la app
    Then el historial de cada grupo dice qué se publicó y cuándo

  # ---------------------------------------------------------------------------------------------
  # Slice 4 — El ritmo
  # ---------------------------------------------------------------------------------------------

  @slice-4 @future
  Scenario: Me dice a qué grupos ya les toca
    Given un grupo que acepta una publicación cada 7 días y en el que publiqué hace 3
    When abro la publicación
    Then ese grupo aparece como "todavía no"

  @slice-4 @future
  Scenario: En compraventa me sugiere qué pan toca hoy en cada grupo
    Given en un grupo de compraventa ya publiqué el Natural y las Semillas
    When abro la publicación para ese grupo
    Then me sugiere el pan que lleva más tiempo sin publicarse ahí

  @slice-4 @future
  Scenario: Me avisa al llegar al tope del día
    Given hoy ya llegué al tope de publicaciones
    When abro una publicación
    Then se me avisa, sin impedirme publicar

  # ---------------------------------------------------------------------------------------------
  # Slice 5 — Pie compartido y versiones que se turnan
  # ---------------------------------------------------------------------------------------------

  @slice-5 @future
  Scenario: El pie es uno para todas las publicaciones
    Given cambio el WhatsApp del pie compartido
    When abro cualquier publicación
    Then su texto lleva el WhatsApp nuevo

  @slice-5 @future
  Scenario: Las versiones del texto se turnan
    Given "Masa madre" tiene dos versiones de su texto
    When la publico en dos grupos el mismo día
    Then cada grupo recibe una versión distinta
