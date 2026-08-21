Feature: El chrome lleva la ubicación y la búsqueda dice qué buscar

  El usuario lo reportó abriendo el sitio: «falta un botón para actualizar mi ubicación». No faltaba
  por diseño. Lo llevaba `HomeHero`, y el commit 8b4d9bf ("refactor(home): simplify main feed
  surface", 2026-08-17) dejó de montarlo; `HomeHero.tsx` sigue en el repo, con sus tests verdes y sin
  que nadie lo renderice. En el resto del sitio el mismo control está escrito seis veces, una por
  página, y la ruta de entrada era justo la que se quedó sin él.

  Context:
  - Problem: `LocationBanner` se monta en /productos, /productos/page/[page], /categoria/[key],
    /categoria/[key]/page/[page], /directorio y /pilares — seis veces para una decisión que es del
    sitio, no de la página— y en "/" no se monta en ninguna. La cookie de ubicación dura un año
    (`locationCookie.ts:10`), así que quien la compartió mal desde el home no tiene salida salvo
    borrarla a mano desde el navegador. Y `search.placeholder` dice "Buscar...", el único renglón que
    podía enseñar de qué va el catálogo.
  - Savings: el control se escribe una vez y se hereda; una página nueva deja de tener que acordarse
    de montarlo para que su cercanía signifique algo. Y desaparece el caso "me mudé y el sitio sigue
    midiendo desde donde yo estaba" en la ruta más visitada.
  - Why: la cercanía es el argumento entero de Hazlo Sano —nutrición, transporte, costo, desperdicio—.
    Una distancia falsa no es un dato incompleto: engaña justo en la decisión que el sitio existe
    para ayudar a tomar. Que el control para corregirla dependa de en qué página caíste deja esa
    promesa al azar.

  As alguien que llega al sitio por cualquier página
  I want tener siempre a la vista desde dónde se miden las distancias y poder corregirlo
  So that lo que leo sea cierto sin importar por dónde entré

  Background:
    Given the app is running with PostgreSQL as the database
    And el ancla de la comunidad está en Tezonapa, Veracruz (18.6005, -96.6872)
    And la tienda "Panadería La Luz" tiene su sucursal a 2 km del ancla

  # ---------------------------------------------------------------------------
  # Slice 1 — La ubicación sube al chrome, y la búsqueda dice qué buscar (actual)
  #
  # La barra se monta una sola vez en src/app/[locale]/layout.tsx, junto a <Header/>, y los seis
  # <LocationBanner/> de página se retiran. No inventa una tercera cara: con ubicación enseña
  # `LocationChip`, sin ella `LocationNotice` — los mismos dos componentes y los mismos
  # data-testid de siempre, montados en otro sitio.
  # ---------------------------------------------------------------------------

  # La fila "/" es la que se había caído el 17 de agosto. Las otras cuatro son las que hoy montan
  # el aviso a mano y a partir de aquí lo heredan.
  @slice-1
  Scenario Outline: El control de ubicación está en todas las rutas, no en las que se acordaron
    Given tengo una ubicación guardada a 2 km del ancla, compartida hace 2 horas
    When abro "<ruta>"
    Then veo el chip de ubicación
    And el chip ofrece actualizarla
    And no veo el aviso de que no sabemos dónde estoy

    Examples: las que lo montaban a mano, y las dos que nunca lo tuvieron
      | ruta                   | quién lo montaba antes       |
      | /                      | nadie — se cayó en 8b4d9bf   |
      | /productos             | la propia página             |
      | /categoria/jugos       | la propia página             |
      | /productores-locales   | DirectoryPage                |
      | /negocios-locales      | DirectoryPage                |
      | /pilares/alimentacion  | PillarLocal                  |
      | /buscar                | nadie — nunca lo tuvo        |

  # El motivo por el que los seis se retiran en vez de convivir con la barra: en /productos el
  # mismo control aparecería dos veces en la misma pantalla.
  @slice-1
  Scenario: El control aparece una sola vez por página
    Given tengo una ubicación guardada a 2 km del ancla
    When abro "/productos"
    Then el chip de ubicación existe exactamente una vez en el documento

  @slice-1
  Scenario: Sin ubicación se hereda el aviso, no el chip
    Given no tengo ninguna ubicación guardada
    When abro "/"
    Then veo el aviso que explica por qué no hay distancias
    And el aviso ofrece compartir mi ubicación
    And no veo el chip

  # `showSellerCta` solo es verdadero cuando NO hay ubicación y quien mira no tiene tienda. Al subir
  # el aviso al chrome, esa invitación sube con él: es el único sitio del repo donde existe
  # (LocationNotice.tsx:75) y retirarla de las páginas sin recogerla la habría borrado del sitio.
  @slice-1
  Scenario: La invitación a abrir tienda viaja con el aviso
    Given no tengo ninguna ubicación guardada
    And no tengo ninguna tienda abierta
    When abro "/"
    Then el aviso me invita a abrir mi tienda

  @slice-1
  Scenario: Quien ya tiene tienda no recibe el consejo
    Given no tengo ninguna ubicación guardada
    And ya tengo una tienda abierta
    When abro "/"
    Then veo el aviso que explica por qué no hay distancias
    And no me invita a abrir una tienda

  # Lo que el usuario reportó, en el sitio donde lo reportó.
  @slice-1
  Scenario: Corrijo mi ubicación desde el home y las tarjetas la obedecen
    Given estoy en "/" viendo el pan de "Panadería La Luz" a unos metros
    When me voy a 40 km y aprieto "Actualizar" en el chip
    Then esa misma tarjeta pasa a decir "a 39.8 km"
    And no tuve que recargar para verlo

  @slice-1 @component
  # Vitest: es la elección entre dos caras según una lectura de cookie, sin recorrido de navegación.
  Scenario Outline: La barra elige cara según lo que sepa, y no inventa una tercera
    Given una ubicación guardada "<estado>"
    When se pinta la barra del chrome
    Then monta "<componente>"

    Examples:
      | estado      | componente     |
      | hace 2 h    | LocationChip   |
      | inexistente | LocationNotice |

  # El campo de búsqueda es el único renglón del header que podía enseñar de qué va el catálogo, y
  # decía "Buscar...". Los ejemplos salen de la base consultada el 2026-08-21 (31 publicaciones):
  # `Suero natural` $35, `Dona Chocolate Keto` $35, `Açaí Glow` $75,
  # `Caminata de Tezonapa a Motzorongo`. Van al catálogo de mensajes y no a una consulta por render:
  # el header pagaría una lectura del catálogo en cada página y el texto bailaría en cada visita.
  @slice-1 @component
  Scenario Outline: La búsqueda dice qué buscar, en los dos idiomas
    Given el campo de búsqueda del header en locale "<locale>"
    When alguien lo mira sin haber escrito nada
    Then su marcador de posición nombra cosas que existen en el catálogo
    And no dice "<generico>"

    Examples:
      | locale | generico |
      | es     | Buscar   |
      | en     | Search   |

  # ---------------------------------------------------------------------------
  # Slice 2 — El menú principal se ve como los cuatro pilares  (@future)
  # ---------------------------------------------------------------------------

  @slice-2 @future
  Scenario: «4 Pilares» lleva sus cuatro colores dentro de la píldora
    Given la barra de navegación con «Comunidad», «4 Pilares» y «Nosotros»
    When adopta la píldora del 5.1
    Then «4 Pilares» enseña los cuatro puntos de color de la rampa
    And el color nunca va solo, como fijó el slice 3 del design system

  @slice-2 @future
  Scenario: La sección en la que estoy se distingue de las demás
    Given estoy en una página de pilar
    When miro la barra de navegación
    Then la píldora de su sección se ve activa

  # ---------------------------------------------------------------------------
  # Slice 3 — Una sola fila de acciones  (@future)
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario: La fila derecha deja de tener cuatro acciones compitiendo
    Given Publicar, el carrito, el avatar y el idioma en una sola fila
    When adopta la fila del 5.1
    Then hay una acción primaria, un avatar y el idioma
    And el teléfono recupera el alto que el header le estaba quitando

  # ---------------------------------------------------------------------------
  # Slice 4 — El pilar y la distancia, filtros en la barra  (@future)
  # ---------------------------------------------------------------------------

  @slice-4 @future
  Scenario: El filtro de pilares deja de vivir dentro del feed
    Given `PublicationPillarFilter` montado dentro de `PostsWithLoadMore`
    When sube a la barra del chrome, junto a la ubicación
    Then el filtro se aplica desde cualquier ruta que lo entienda
    And los specs de publicationPillarFilter siguen describiendo el mismo comportamiento
