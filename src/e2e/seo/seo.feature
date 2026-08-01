Feature: SEO — que el sitio se pueda encontrar

  Context:
  - Problem: el sitio no tiene sitemap ni robots.txt, así que un buscador solo encuentra lo que
    esté enlazado desde algo que ya conozca. Y el detalle de cada publicación —la página más
    importante, 24 hoy— no define metadata: hereda el título genérico del layout y no tiene
    descripción, canónico ni imagen, así que compartir un producto en WhatsApp da un enlace pelado.
  - Savings: es tráfico ya pagado. El contenido existe y las páginas son rápidas; falta decirle al
    buscador que están ahí. Para el vendedor es la diferencia entre que lo encuentren buscando
    "pan de masa madre Tezonapa" o solo por el enlace que reparta a mano.
  - Why: la feature de vendedores construyó tiendas y perfiles para que la gente llegue a ellos.
    Sin descubrimiento, cada tienda depende de que su dueño la difunda — el trabajo que la tienda
    venía a ahorrar.

  As a persona que vende o publica en Hazlo Sano
  I want to que los buscadores sepan qué páginas existen y qué es cada una
  So that me encuentren sin que yo tenga que repartir el enlace uno por uno

  @slice-1
  Scenario: El sitemap lista lo que existe de verdad
    Given las publicaciones, tiendas y perfiles que hay en la base
    When un rastreador pide "/sitemap.xml"
    Then encuentra el home, "/productos", "/nosotros" y los 5 pilares
    And encuentra cada publicación por su slug, con su fecha
    And encuentra "/tienda/hazlo-sano"

  @slice-1
  Scenario Outline: Lo que no debe estar en el sitemap
    Given que "<ruta>" <razón>
    When un rastreador pide "/sitemap.xml"
    Then "<ruta>" no aparece

    Examples:
      | ruta                  | razón                                  |
      | /deportes             | responde 404, es un stub del menú      |
      | /habitos              | responde 404, es un stub del menú      |
      | /negocios-locales     | responde 404, es un stub del menú      |
      | /productores-locales  | responde 404, es un stub del menú      |
      | /cuenta               | es privada, depende de la sesión       |
      | /publicar             | exige sesión y no es contenido         |

  @slice-1
  Scenario: robots.txt permite el contenido y protege lo privado
    When un rastreador pide "/robots.txt"
    Then puede rastrear el sitio
    And tiene prohibido "/cuenta", "/editar", "/admin", "/api" y "/buscar"
    And se le dice dónde está el sitemap

  @slice-1 @component
  Scenario Outline: Una publicación entra al sitemap por su dirección real
    # Cubierto por Vitest: es el armado de la entrada, sin base ni servidor de por medio.
    Given una publicación con slug "<slug>" creada el "<fecha>"
    When se arma su entrada del sitemap
    Then la URL es "<url>" con esa fecha

    Examples:
      | slug            | fecha      | url                                  |
      | jugo-verde      | 2026-07-25 | https://hazlosano.com/jugo-verde     |
      | suero-natural   | 2026-07-25 | https://hazlosano.com/suero-natural  |

  @slice-2 @future
  Scenario: Compartir un producto muestra su nombre y su foto
    Given el producto "Jugo Verde" con su imagen
    When alguien pega su enlace en WhatsApp
    Then la vista previa muestra su título, su descripción y su imagen

  @slice-2 @future
  Scenario: Las páginas de sesión y búsqueda no se indexan
    Given "/publicar", "/auth/signin" y "/buscar"
    When un rastreador las visita
    Then encuentra noindex

  @slice-3 @future
  Scenario: El buscador entiende qué vende quién
    Given un producto con precio y una tienda con sucursal
    When se leen sus datos estructurados
    Then el producto expone precio y disponibilidad, y la tienda su dirección y coordenadas
