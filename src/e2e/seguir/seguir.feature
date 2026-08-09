Feature: Seguir a una tienda o a una persona

  Context:
  - Problem: publicar no tiene consecuencia. Quien publica no acumula nada entre una publicación y
    la siguiente, y quien mira no tiene forma de decir «esto me interesa». Las páginas de tienda y
    de perfil se sienten vacías porque no hay ninguna señal de que alguien esté al otro lado: ni un
    número, ni una lista, ni un botón. La tabla `follows` no existe.
  - Savings: una tienda deja de empezar de cero en cada visita — el número de seguidores es lo que
    hace que un desconocido le dé una oportunidad, y es lo único de esa página que un competidor no
    puede copiar. Del lado del código, seguir es la primitiva de la que cuelgan el feed propio y el
    aviso al publicar: una tabla que se paga tres veces.
  - Why: es la pieza que convierte un catálogo en una red. El sitio ya sabe qué se vende y dónde
    está; esto es lo primero que le enseña quién le importa a quién.

  # Inventario del 2026-08-09: 21 usuarios, 1 con dirección personal reclamada, 1 tienda
  # (`hazlo-sano`, con dueño) y 23 publicaciones. O sea que el contador estará en cero en el 100%
  # de las páginas el día que esto salga, y por eso hay un escenario dedicado a qué se ve entonces.

  As a persona que encuentra algo que le gusta
  I want to seguir a quien lo hace
  So that pueda volver a encontrarlo, y quien publica sepa que alguien está esperando

  @slice-1
  Scenario: Sigo una tienda y el contador lo dice al momento
    Given que estoy autenticada y no sigo la tienda "Panadería La Luz"
    When abro su página y pulso seguir
    Then queda seguida y su contador dice 1
    And al recargar sigue diciendo 1, porque quedó guardado y no solo pintado

  @slice-1
  Scenario: Dejo de seguirla con el mismo botón
    Given que ya sigo la tienda "Panadería La Luz"
    When pulso el botón otra vez
    Then deja de estar seguida y el contador vuelve a no pintarse

  @slice-1
  Scenario: Pulsar dos veces no me cuenta dos veces
    Given que estoy autenticada y no sigo la tienda
    When se registra el seguimiento dos veces seguidas
    Then hay una sola fila, porque la unicidad la impone la base y no la pantalla
    # Un doble clic o dos pestañas abiertas es exactamente cómo pasa esto.

  @slice-1
  Scenario: Sigo a una persona por su perfil
    Given un perfil con dirección personal reservada
    When lo abro autenticada y pulso seguir
    Then queda seguida esa persona, no su tienda
    # Son destinos distintos: 5 de las 23 publicaciones son de alguien sin tienda.

  # Hoy esto es el 100% de los casos: hay una tienda y un perfil, y nadie sigue a nadie.
  @slice-1
  Scenario: Sin seguidores no se enseña un cero
    Given una tienda que no sigue nadie
    When un visitante la abre
    Then no se pinta ningún número de seguidores
    And se le ofrece seguirla igual

  @slice-1
  Scenario: A quien es dueño no se le ofrece seguirse
    Given que soy la dueña de "Panadería La Luz"
    When abro su página
    Then no hay botón de seguir, sino la invitación a compartirla

  @slice-1
  Scenario: Sin sesión, seguir lleva a entrar y devuelve a donde estaba
    Given que no he iniciado sesión
    When abro una tienda y pulso seguir
    Then se me lleva a iniciar sesión
    And al volver estoy en la misma tienda
    # Un seguidor que se pierde al cerrar el navegador no es un seguidor.

  @slice-1 @component
  Scenario Outline: Cuándo se pinta el contador y cuándo se calla
    # Vitest sobre el dominio: es una regla pura, y es la que evita que una página nueva parezca
    # abandonada.
    Given una página con <seguidores> seguidores
    When se decide qué enseñar
    Then <resultado>

    Examples:
      | seguidores | resultado                                  |
      | 0          | no se pinta número                         |
      | 1          | se pinta "1 seguidor"                      |
      | 2          | se pinta "2 seguidores"                    |
      | 312        | se pinta "312 seguidores"                  |

  @slice-1 @component
  Scenario Outline: Qué destinos admite un seguimiento
    # La base lo garantiza con `num_nonnulls(seller_id, followed_id) = 1`; el dominio lo dice antes
    # y con un mensaje que se entiende.
    Given un seguimiento con destino <destino>
    When se valida
    Then <resultado>

    Examples:
      | destino               | resultado                                         |
      | una tienda            | se acepta                                         |
      | una persona           | se acepta                                         |
      | las dos a la vez      | se rechaza: un seguimiento apunta a una sola cosa |
      | ninguna               | se rechaza: no hay a quién seguir                 |
      | uno mismo             | se rechaza: nadie se sigue a sí mismo             |

  @slice-2 @future
  Scenario: El feed de lo que sigo
    Given que sigo a dos tiendas
    When abro mi feed
    Then veo lo que publican ellas, y no todo lo del sitio

  @slice-3 @future
  Scenario: Me avisan cuando publica alguien a quien sigo
    Given que sigo una tienda y tengo canal enlazado
    When esa tienda publica
    Then recibo un aviso por su canal
