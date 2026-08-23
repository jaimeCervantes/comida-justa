Feature: Volver a donde estaba tras iniciar sesión

  Context:
  - Problem: entrar deja a cualquiera en la portada. Da igual desde dónde se pidiera —«Asistiré» en
    un evento, «Seguir» en una tienda, el botón del encabezado, o una página privada como
    `/pedidos` que expulsa por no tener sesión—: al volver del proveedor se aterriza en `/`, sin la
    acción hecha y sin rastro de dónde se estaba. En inglés además se pierde el idioma.
  - Savings: se recupera la acción que motivó el registro, que hoy se abandona a medias; y nadie
    tiene que volver a buscar a mano la publicación que estaba viendo.
  - Why: el registro solo vale si termina en la acción que lo provocó.

  # Inventario del 2026-08-23: 31 publicaciones (17 productos, 10 anuncios, 2 servicios y 2
  # eventos) y 2 tiendas (`hazlo-sano`, `panaderia-de-prueba`). Los dos eventos tienen slug propio
  # por idioma —`caminata-a-la-luisa` y `walk-to-la-luisa` son la misma publicación—, y por eso el
  # destino tiene que viajar prefijado: `/walk-to-la-luisa` sin `/en` no resuelve.

  As a persona a la que le piden entrar a mitad de algo
  I want to volver a donde estaba, en el idioma en que estaba
  So that pueda terminar lo que venía a hacer

  @slice-1
  Scenario Outline: Una página privada manda a entrar diciendo a dónde volver
    Given que no he iniciado sesión
    When abro "<ruta>"
    Then acabo en la pantalla de acceso "<pantalla>"
    And lleva escrito el regreso a "<regreso>"

    Examples: el idioma va dentro del destino, no aparte
      | ruta        | pantalla            | regreso     |
      | /pedidos    | /auth/signin        | /pedidos    |
      | /en/orders  | /en/auth/signin     | /en/orders  |
      | /publicar   | /auth/signin        | /publicar   |
      | /en/publish | /en/auth/signin     | /en/publish |

  @slice-1
  Scenario Outline: La ficha de un evento ofrece entrar sin perder la ficha
    # Los dos idiomas tienen slug distinto para la misma publicación, así que un regreso sin
    # prefijo no llevaría a la versión en español: no llevaría a ninguna parte.
    Given el evento publicado "<titulo>"
    When lo abro sin sesión en "<ruta>"
    Then el enlace de asistir lleva a entrar con el regreso a "<regreso>"

    Examples:
      | titulo                  | ruta                  | regreso               |
      | Caminata a la Luisa     | /caminata-a-la-luisa  | /caminata-a-la-luisa  |
      | Walk to La Luisa        | /en/walk-to-la-luisa  | /en/walk-to-la-luisa  |

  @slice-1
  Scenario: Seguir una tienda sin sesión ofrece entrar y volver a la tienda
    Given la tienda "Hazlo Sano" en /tienda/hazlo-sano
    When la abro sin sesión
    Then el botón de seguir es el enlace a entrar
    And lleva escrito el regreso a /tienda/hazlo-sano

  @slice-1
  Scenario: El botón del encabezado también recuerda la página
    Given que estoy leyendo una publicación sin sesión
    When pulso «Iniciar sesión» en el encabezado
    Then llego a la pantalla de acceso con el regreso a esa publicación
    # El origen sale del `Referer` de la propia acción: es la dirección real del navegador, con su
    # prefijo de idioma, y no hay que reconstruirla.

  @slice-1 @component
  Scenario Outline: De qué destino se puede fiar uno
    # Vitest sobre `safeReturnPath`: es una regla pura y es la que evita dos cosas distintas —una
    # redirección abierta hacia otro sitio, y el bucle de volver a la propia pantalla de acceso.
    Given un destino "<destino>"
    When se decide si vale como regreso
    Then <resultado>

    Examples: aceptados
      | destino                        | resultado                        |
      | /pedidos                       | se acepta tal cual               |
      | /en/orders                     | se acepta con su prefijo         |
      | /tienda/hazlo-sano?ref=cartel  | se acepta con su cadena de busca |

    Examples: rechazados — se cae a la raíz
      | destino                    | resultado                                          |
      | https://otro-sitio.com/x   | se rechaza: no es de este sitio                    |
      | //otro-sitio.com           | se rechaza: para el navegador ya es otro sitio     |
      | /auth/signin               | se rechaza: sería el bucle de volver a la puerta   |
      | /en/auth/signin?callbackUrl=%2F | se rechaza: la puerta, también prefijada      |
      | pedidos                    | se rechaza: no es una ruta interna                 |

  @slice-1 @component
  Scenario: La pantalla de acceso reenvía el destino que recibió
    # El último salto no es una navegación sino una llamada del cliente a next-auth, y es justo
    # donde se perdía: sin pasarlo, next-auth usa la URL de la propia pantalla.
    Given la pantalla de acceso abierta con el regreso a "/caminata-a-la-luisa"
    When elijo un proveedor
    Then se le pide a next-auth que termine en "/caminata-a-la-luisa"

  @slice-2 @future
  Scenario: La sesión caduca con el formulario abierto
    Given que estoy publicando y mi sesión caduca
    When envío el formulario
    Then se me lleva a entrar y vuelvo al formulario, no a la portada
