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
  # Slice 2 — El menú principal se ve como los cuatro pilares  (actual)
  #
  # La barra pinta hoy tres enlaces de texto con radio de 8px sobre un fondo translúcido: nada dice
  # en qué sección estás, y «4 Pilares» —el eje narrativo del sitio— se lee igual que «Nosotros».
  # El 5.1 los convierte en píldoras, marca la activa con el par verde ya medido
  # (`#2f5320` sobre `#e8f0df`, 7.55) y le da a «4 Pilares» los cuatro colores de la rampa.
  #
  # Qué ruta pertenece a qué sección se decide en `menuItems.ts` y lo prueba Vitest: es aritmética
  # sobre la plantilla interna que devuelve `usePathname`, sin navegador.
  # ---------------------------------------------------------------------------

  # `usePathname` de `~/i18n/navigation` devuelve la **plantilla interna** —`/categoria/[key]`, no
  # `/category/jugos`—, así que la regla es la misma en los dos idiomas sin escribirla dos veces.
  @slice-2 @component
  Scenario Outline: La sección activa sale de la ruta, no de una lista escrita a mano
    Given que estoy en la ruta interna "<ruta>"
    When el menú decide qué píldora marcar
    Then la sección activa es "<seccion>"

    Examples: Comunidad es la puerta a todo lo que publica la gente, incluido el inicio
      | ruta                             | seccion   | por qué                          |
      | /                                | community | «Publicaciones», su primera entrada |
      | /productos                       | community | entrada del desplegable          |
      | /productos/page/[page]           | community | la misma sección, paginada       |
      | /eventos                         | community | entrada del desplegable          |
      | /categoria/[key]                 | community | «Por categoría»                  |
      | /categoria/[key]/page/[page]     | community | la misma sección, paginada       |
      | /page/[page]                     | community | el inicio, paginado              |
      | /productores-locales/[[...slug]] | community | sección publicada                |
      | /negocios-locales/[[...slug]]    | community | sección publicada                |

    Examples: las otras dos secciones
      | ruta                  | seccion  | por qué                    |
      | /pilares/[[...slug]]  | pillars  | la portada y los cuatro    |
      | /nosotros             | about    | enlace suelto de la barra  |

    Examples: ninguna — la píldora dice «estás en esta sección del menú», no «esto se le parece»
      | ruta            | seccion | por qué                                    |
      | /buscar         | ninguna | la búsqueda no es una sección del menú     |
      | /carrito        | ninguna | ni el carrito                              |
      | /publicar       | ninguna | ni publicar                                |
      | /[slug]         | ninguna | una publicación no está en el menú         |
      | /tienda/[slug]  | ninguna | una tienda tampoco                         |

  # Una sección que el menú esconde por no estar publicada no puede marcarse: sería decir «estás
  # aquí» señalando una puerta que no existe. `VISIBLE_COMMUNITY_ITEMS` ya filtra las seis.
  @slice-2 @component
  Scenario: Una sección sin publicar no marca nada
    Given que "/salud-infantil/[[...slug]]" es un stub que responde 404
    And que por eso el menú no la enlaza
    When alguien llega a esa ruta
    Then ninguna píldora se marca como activa

  @slice-2 @component
  Scenario Outline: Solo una píldora puede estar activa a la vez
    Given la ruta interna "<ruta>"
    When se resuelve la sección activa
    Then exactamente "<cuantas>" secciones quedan marcadas

    Examples:
      | ruta                 | cuantas |
      | /                    | 1       |
      | /pilares/[[...slug]] | 1       |
      | /buscar              | 0       |

  # Los cuatro puntos son la firma del grupo, no la identidad de cada pilar: por eso pueden ir
  # juntos y por eso van `aria-hidden`. La regla del slice 3 del design system —el color nunca es
  # el único portador del significado de un pilar— se cumple porque quien nombra aquí es la
  # etiqueta «4 Pilares», y los puntos no dicen nada que ella no diga.
  @slice-2 @component
  Scenario: «4 Pilares» lleva los cuatro colores de la rampa, y no dependen de que se distingan
    Given la píldora de «4 Pilares»
    When se pinta
    Then enseña cuatro puntos, uno por cada `--pillar-*-solid`
    And los puntos son decorativos para un lector de pantalla
    And la etiqueta sigue diciendo de qué sección se trata sin mirar ningún color

  @slice-2 @component
  Scenario: La píldora activa usa el par verde que ya estaba medido
    Given que el par `#2f5320` sobre `#e8f0df` da 7.55 y lo verifica `brandPalette.contrast.test.ts`
    When una sección se marca como activa
    Then toma ese par por su nombre de token, no por un hex
    And no necesita una variante "dark:" escrita a mano

  @slice-2
  Scenario: Quien navega con lector de pantalla también sabe en qué sección está
    Given que estoy en "/pilares/alimentacion"
    When recorro la barra de navegación
    Then el enlace de «4 Pilares» se anuncia como la página actual
    And ningún otro enlace de la barra lo hace

  @slice-2
  Scenario: El menú del teléfono marca la misma sección que el de escritorio
    Given que estoy en "/productos"
    When abro el menú del teléfono
    Then «Comunidad» aparece marcada como la sección actual

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
  # Slice 4 — El pilar y la distancia, filtros en la barra  (actual)
  #
  # El roadmap original la dibujaba `sticky`; `NearbyBar` ya había evaluado y descartado eso mismo
  # por el costo de pantalla en un teléfono, así que el filtro hereda su criterio: se une a la
  # barra, no se vuelve fija. `NearbyPillarFilter` decide por ruta, con hooks de cliente —el layout
  # no recibe `searchParams`—, así que el filtro no aparece en rutas sin feed que filtrar.
  # ---------------------------------------------------------------------------

  @slice-4
  Scenario Outline: El filtro de pilares deja de vivir dentro del feed
    Given `PublicationPillarFilter` montado dentro de "<componente>"
    When sube a `NearbyBar`, junto a la ubicación
    Then aparece en "<ruta>" con el mismo comportamiento de siempre
    And los specs de publicationPillarFilter siguen describiendo ese comportamiento

    Examples:
      | ruta        | componente        |
      | /           | PostsWithLoadMore  |
      | /productos  | ProductsList       |

  @slice-4
  Scenario: Una ruta sin feed no ofrece un filtro que no lleva a ninguna parte
    Given que `/cuenta` no tiene ninguna lista de publicaciones que filtrar
    When se pinta `NearbyBar` ahí
    Then no aparece ningún filtro de pilares

  # Categoría, directorio, perfil y tienda montan `PublicationPillarFilter` a mano desde antes de
  # este slice y se quedan así: son cuatro rutas más, no una continuación automática de esta.
  @slice-4 @future
  Scenario Outline: Las rutas que faltan
    Given "<ruta>" sigue montando `PublicationPillarFilter` dentro de su propia página
    When se decida subirla a la barra también
    Then `NearbyPillarFilter` solo necesita sumar esa ruta a su lista

    Examples:
      | ruta                 |
      | /categoria/[key]     |
      | /productores-locales |
      | /u/[username]        |
      | /tienda/[slug]       |

  # ---------------------------------------------------------------------------
  # Slice 5 — La barra cabe en un renglón  (actual)
  #
  # Los slices 1 y 4 le fueron dando piezas a la misma barra hasta que dejó de ser una fila: el
  # rótulo, una explicación de por qué hay o no hay distancias, la invitación a abrir tienda y cinco
  # filtros. En escritorio partía en dos o tres renglones; en un teléfono se comía la primera
  # pantalla de **todas** las rutas, porque es chrome.
  #
  # Lo que se retira es la prosa, no las acciones: siguen ahí el botón de ubicación, la invitación a
  # abrir tienda y los cinco filtros. Las explicaciones pasan al **nombre accesible** de cada cara
  # (`aria-label` + `title`), así que quien usa lector de pantalla o pasa el ratón las sigue oyendo
  # y leyendo — no se borran, dejan de gastar renglones.
  # ---------------------------------------------------------------------------

  # La afirmación es una relación, no un alto en píxeles: si un día la barra crece de altura pero
  # sigue en una fila, este escenario tiene que seguir verde.
  #
  # Y es un renglón en **cualquier** ancho, no solo en escritorio. La primera versión partía la
  # barra en el teléfono y le daba al filtro su propio renglón deslizable; el usuario lo corrigió:
  # «si todo está en el renglón, el scroll tiene más propósito y menos espacio vertical».
  @slice-5
  Scenario Outline: La barra entera es una sola fila, en cualquier ancho
    Given una ventana de "<ancho>" px
    When abro "/"
    Then el control de ubicación y el filtro de pilares comparten el centro vertical

    Examples:
      | ancho | por qué esta                                   |
      | 390   | un teléfono, donde el renglón de más costaba   |
      | 1024  | el tramo estrecho donde el header ya apretaba  |
      | 1440  | escritorio holgado                             |

  @slice-5
  Scenario: Y también cuando la ubicación ya se conoce, que es la otra cara
    Given tengo una ubicación guardada a 2 km del ancla
    When abro "/"
    Then el chip y el filtro de pilares comparten el centro vertical

  # Antes eran dos o tres párrafos. Lo que queda es lo que se pulsa.
  @slice-5
  Scenario: La barra deja de explicar y se queda con lo que se pulsa
    Given no tengo ninguna ubicación guardada
    When abro "/"
    Then no leo en la barra "No sabemos dónde estás, así que no podemos decirte qué tan cerca…"
    And sigue estando el botón para compartir mi ubicación
    And sigue estando la invitación a abrir tienda

  # Lo que se retira de la vista no se pierde: es el nombre de la región para un lector de pantalla.
  @slice-5
  Scenario Outline: La explicación se muda al nombre accesible, no a la basura
    Given "<estado>"
    When se pinta "<cara>"
    Then su nombre accesible dice "<dice>"

    Examples:
      | estado                             | cara            | dice                                  |
      | una ubicación de hace 2 horas      | location-chip   | distancias desde tu ubicación, hace 2 horas |
      | una cookie del formato anterior    | location-chip   | distancias desde tu ubicación, sin antigüedad |
      | ninguna ubicación                  | location-notice | por qué no hay distancias             |

  # El teléfono: los cinco filtros dejan de partirse en dos o tres renglones y se deslizan en uno.
  @slice-5
  Scenario: En el teléfono los filtros son un renglón que se desliza
    Given una ventana de 390 px
    When abro "/"
    Then los cinco filtros comparten el mismo centro vertical
    And puedo llegar a "Mente/Espíritu" deslizando la fila

  # La medida que importa: un renglón, no dos. Se afirma contra el alto de un filtro y no contra un
  # número de píxeles, que envejecería con el primer cambio de relleno.
  @slice-5
  Scenario: Y la barra entera mide un renglón, no dos
    Given una ventana de 390 px y ninguna ubicación guardada
    When abro "/"
    Then la barra es más baja que dos filtros apilados

  # Esconder la barra de desplazamiento ahorra alto pero deja la fila sin decir que sigue. La pista
  # tiene que costar cero alto —esa es la razón de ser de la fila única— así que son capas de fondo
  # del propio contenedor, no un elemento.
  @slice-5
  Scenario: La fila avisa de que sigue, sin gastar alto
    Given una ventana de 390 px, donde la fila no cabe entera
    When abro "/"
    Then el borde enseña un desvanecido con una flecha hacia donde queda contenido
    And la barra mide lo mismo que sin la pista
