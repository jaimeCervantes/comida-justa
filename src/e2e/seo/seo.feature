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

  @slice-3
  Scenario Outline: Compartir una publicación anuncia una imagen, nunca un video
    # 8 de las 24 publicaciones son video, y su og:image era el .mp4: WhatsApp mostraba un hueco.
    Given la publicación "<slug>", que trae <medio>
    When alguien pega su enlace en WhatsApp
    Then la vista previa muestra <imagen>
    And la tarjeta de Twitter es "<tarjeta>"

    Examples:
      | slug                          | medio    | imagen                | tarjeta             |
      | jugo-verde                    | una foto | su propia foto        | summary_large_image |
      | la-clave-para-dormir-profundo | un video | el logo de Hazlo Sano | summary             |

  @slice-3
  Scenario: Un video se anuncia como video
    Given la publicación "la-clave-para-dormir-profundo"
    When un lector lee su Open Graph
    Then el ".mp4" está en "og:video" y no en "og:image"

  @slice-3 @component
  Scenario Outline: Qué se anuncia según lo que trae la publicación
    # Cubierto por Vitest: es la elección del medio, sin navegador ni base de por medio.
    Given una publicación con <medios>
    When se arma su vista previa para compartir
    Then la imagen es <imagen> y el video es <video>

    Examples:
      | medios         | imagen     | video    |
      | una foto       | la foto    | ninguno  |
      | un video       | el logo    | el video |
      | video y foto   | la foto    | el video |
      | nada           | el logo    | ninguno  |

  @slice-3
  Scenario Outline: Cada página traducida es canónica de sí misma y declara su pareja
    Given "<ruta>", que existe de verdad en los dos idiomas
    When un rastreador la visita
    Then su canónico es "<canonico>"
    And declara "<es>" como español, "<en>" como inglés y "<es>" como x-default

    Examples:
      | ruta       | canonico     | es         | en           |
      | /nosotros  | /nosotros    | /nosotros  | /en/about    |
      | /en/about  | /en/about    | /nosotros  | /en/about    |
      | /productos | /productos   | /productos | /en/products |

    Examples: rutas cuyo canónico apuntaba a una dirección inexistente
      | ruta                     | canonico                 | es                       | en                |
      | /condiciones-de-servicio | /condiciones-de-servicio | /condiciones-de-servicio | /en/terms-of-service |

  @slice-3
  Scenario: La publicación, que solo existe en español, no finge tener versión inglesa
    Given "/en/jugo-verde", que renderiza el mismo texto en español
    When un rastreador la visita
    Then su canónico es "/jugo-verde"
    And no declara ninguna pareja de idiomas

  @slice-3
  Scenario: El sitio pide que la vista previa de imagen sea grande
    Given cualquier página pública
    When un rastreador lee sus directivas
    Then encuentra "max-image-preview:large"
    And "/buscar" sigue pidiendo "noindex"

  @slice-4 @future
  Scenario: El buscador entiende qué vende quién
    Given un producto con precio y una tienda con sucursal
    When se leen sus datos estructurados
    Then el producto expone precio y disponibilidad, y la tienda su dirección y coordenadas

  @slice-5 @future
  Scenario: Las categorías con contenido se pueden descubrir
    Given las categorías que sí tienen publicaciones
    When un rastreador pide el sitemap
    Then las encuentra, y las categorías vacías piden no ser indexadas

  @slice-6 @future
  Scenario: Una publicación lleva a las demás
    Given el detalle de una publicación
    When alguien termina de leerla
    Then encuentra publicaciones relacionadas, su categoría y quién la vende

  @slice-7 @future
  Scenario: Los rastreadores de IA saben qué pueden leer
    Given un asistente que quiere citar el catálogo
    When pide "/robots.txt" y "/llms.txt"
    Then encuentra permiso explícito y un índice del sitio en texto
