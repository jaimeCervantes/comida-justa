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

  @slice-4
  Scenario: El buscador entiende qué se vende y a cuánto
    Given el producto "Jugo Verde", que cuesta 40 y está disponible
    When se leen sus datos estructurados
    Then encuentra un "Product" con su oferta en MXN y disponibilidad "InStock"

  @slice-4
  Scenario: Un anuncio en video declara su video
    Given "la-clave-para-dormir-profundo", cuyo contenido entero está en un .mp4
    When se leen sus datos estructurados
    Then encuentra un "Article" y un "VideoObject" con el archivo y su fecha

  @slice-4
  Scenario: La tienda dice dónde está
    Given la tienda "hazlo-sano", con su sucursal en Tezonapa
    When se leen sus datos estructurados
    Then encuentra un "LocalBusiness" con su teléfono, su dirección y sus coordenadas

  @slice-4
  Scenario: El sitio dice quién lo publica
    Given el inicio
    When se leen sus datos estructurados
    Then encuentra una "Organization" con sus perfiles públicos y un "WebSite" que la nombra editora

  @slice-4 @component
  Scenario Outline: Qué tipo se declara según lo que es la publicación
    # Cubierto por Vitest: es el mapeo al vocabulario, sin navegador ni base.
    Given una publicación <clase> con <precio>
    When se arman sus datos estructurados
    Then el tipo es "<tipo>" y <oferta>

    Examples:
      | clase       | precio     | tipo    | oferta                        |
      | producto    | precio 40  | Product | declara la oferta             |
      | producto    | sin precio | Product | no declara oferta             |
      | anuncio     | sin precio | Article | no declara oferta             |

  @slice-4 @component
  Scenario: Nadie puede cerrar el script desde el texto de una publicación
    # Cubierto por Vitest: el contenido lo escribe la comunidad.
    Given una publicación cuyo texto contiene "</script>"
    When se serializa su JSON-LD
    Then el "<" sale escapado y el documento sigue siendo JSON válido

  @slice-5
  Scenario Outline: Solo entra al sitemap la categoría que tiene algo que enseñar
    Given la categoría "<key>", que <estado>
    When un rastreador pide "/sitemap.xml"
    Then "/categoria/<key>" <resultado>

    Examples: con publicaciones
      | key          | estado                  | resultado |
      | alimentacion | tiene las 14 de comida  | aparece   |
      | panaderia    | tiene 3 panes           | aparece   |

    Examples: vacías — existen en el menú, pero no son contenido
      | key                    | estado          | resultado    |
      | abarrotes              | no tiene ninguna | no aparece  |
      | movimiento_y_ejercicio | no tiene ninguna | no aparece  |

  @slice-5
  Scenario: Una categoría vacía pide no ser indexada
    Given "/categoria/abarrotes", que responde 200 con la lista vacía
    When un rastreador la visita
    Then encuentra "noindex"
    And "/categoria/panaderia", que sí tiene publicaciones, no lo pide

  @slice-5
  Scenario: La miga de pan enseña el camino y lo declara
    Given "/categoria/panaderia", que cuelga de "Alimentación"
    When alguien la abre
    Then ve "Inicio", "Alimentación" y "Panadería"
    And sus datos estructurados llevan un "BreadcrumbList" con esos tres pasos en orden

  @slice-5
  Scenario: Desde una publicación se puede subir al catálogo
    Given "pan-de-masa-madre-natural", que es de "Panadería"
    When alguien llega desde un buscador
    Then la miga le ofrece "Inicio" y "Panadería" para subir
    And el último paso es el título de la publicación, sin enlace

  @slice-6
  Scenario: Una publicación lleva a las que se le parecen
    Given "jugo-verde", que la base relaciona con "Suero natural" y las aguas
    When alguien termina de leerla
    Then el bloque de relacionadas ya no está vacío
    And cada tarjeta enlaza a su publicación

  @slice-6
  Scenario: Una publicación deja subir a su categoría, su tienda y su autor
    Given "jugo-verde", que es de "Jugos", la vende "Hazlo Sano" y la publicó alguien con perfil
    When alguien llega desde un buscador
    Then encuentra un enlace a "/categoria/jugos"
    And un enlace a "/tienda/hazlo-sano"
    And un enlace al perfil de quien la publicó

  @slice-6 @component
  Scenario Outline: Qué se recomienda y qué no
    # Cubierto por Vitest: la regla, sin base ni navegador.
    Given los vecinos que devuelve el vector, entre ellos <caso>
    When se eligen las relacionadas
    Then <resultado>

    Examples:
      | caso                       | resultado                                   |
      | la propia publicación      | no se recomienda a sí misma                 |
      | un producto agotado        | no se ofrece                                |
      | un anuncio no disponible   | se ofrece igual, porque un anuncio no se agota |

  # Los directorios de la comunidad viven en docs/features/secciones-comunidad.md; sus escenarios
  # están aquí porque lo que se afirma es de descubrimiento: qué entra al sitemap y qué se indexa.
  @directorios
  Scenario: El directorio de negocios lista las tiendas de la comunidad
    Given la tienda "hazlo-sano", que tiene dirección pública
    When alguien abre "/negocios-locales"
    Then la encuentra con su nombre y un enlace a su tienda
    And la sección entra al sitemap

  @directorios
  Scenario: Productores locales solo lista a quien elabora lo que vende
    Given que ninguna publicación tiene origen "productor_local"
    When alguien abre "/productores-locales"
    Then la sección explica de qué va e invita a publicar, sin lista hueca
    And pide "noindex"
    And no entra al sitemap

  @directorios
  Scenario: Una tienda entra a productores en cuanto publica algo suyo
    Given una tienda de prueba con una publicación de origen "productor_local"
    When alguien abre "/productores-locales"
    Then la encuentra
    And "/negocios-locales" también la lista, porque un productor también es un negocio

  @slice-7
  Scenario Outline: Cada rastreador de IA tiene permiso escrito con su nombre
    Given el asistente "<agente>"
    When pide "/robots.txt"
    Then encuentra su nombre con permiso sobre el contenido
    And la misma lista de rutas privadas que el resto

    Examples:
      | agente          |
      | GPTBot          |
      | ClaudeBot       |
      | PerplexityBot   |
      | Google-Extended |

  @slice-7
  Scenario: El sitio ofrece su índice en texto
    Given un asistente que quiere citar el catálogo
    When pide "/llms.txt"
    Then encuentra el nombre del sitio, qué es, y sus publicaciones con enlace y resumen

  @slice-7
  Scenario: Lo nuevo se puede seguir sin recorrer el sitio
    Given "jugo-verde", que está publicado
    When alguien pide "/rss.xml"
    Then encuentra un feed válido con esa publicación y su fecha
    And el inicio anuncia dónde está el feed
