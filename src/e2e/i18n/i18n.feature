Feature: Traducciones (i18n) — que el sitio hable de verdad dos idiomas

  Context:
  - Problem: el sitio *aparenta* ser bilingüe —hay selector de idioma, dos carpetas de mensajes y
    rutas `/en/…`— pero solo 3 de 158 archivos de `src/app` y `src/infra/UI` usan traducciones.
    Todo lo demás es español escrito a mano dentro del TSX. Además la navegación usa `next/link`
    en 25 archivos, así que un clic en inglés devuelve al visitante al español sin avisar, y los
    modelos de lectura archivan toda publicación bajo `es`: aunque existiera una traducción en la
    base, la pantalla no sabría mostrarla.
  - Savings: dejar de mentirle al visitante, y abrir el contenido a quien no lee español sin
    duplicar el sitio. Del lado del código, el texto sale del TSX: cambiar una etiqueta deja de ser
    editar un componente, y una clave inexistente pasa a ser un error de `pnpm typecheck` en vez de
    un hueco descubierto en producción.
  - Why: el sitio existe para que se encuentre y se venda lo local. El idioma es la primera barrera
    de entrada, y hoy está a medio construir — que es la peor de las tres opciones (bilingüe,
    monolingüe, o a medias).

  As a visitante que no lee español
  I want to leer el sitio entero —marco, contenido y direcciones— en mi idioma
  So that pueda encontrar y comprar lo local sin adivinar

  # ---------------------------------------------------------------------------
  # Slice 0 — La fundación: tipado, catálogo único y navegación que no pierde el idioma
  # ---------------------------------------------------------------------------

  @slice-0
  Scenario: Navegar en inglés no devuelve al visitante al español
    Given un visitante en "/en" con el sitio en inglés
    When abre "Productos" desde el menú
    Then sigue en inglés, en "/en/productos", y no en "/productos"

  @slice-0
  Scenario: Un idioma que no existe da 404 limpio, no un 500
    # Servir español bajo "/fr/…" sería la misma página en dos direcciones: contenido duplicado,
    # justo lo que `docs/features/content/003-2026-08-01-seo.md` evita. El 404 es la respuesta correcta. Lo que no puede
    # pasar es que la resolución del idioma reviente antes de llegar a él.
    Given un visitante que pide "/fr/productos"
    When se resuelve el idioma de la ruta
    Then la página responde 404, sin error de servidor

  @slice-0 @component
  Scenario Outline: El segmento de la ruta se convierte a un idioma conocido, nunca se castea
    # Cubierto por Vitest: es `resolveLocale()`, una función pura del enrutado.
    Given el segmento "<segmento>" que Next entrega como texto plano
    When se resuelve con `resolveLocale`
    Then el idioma es "<idioma>"

    Examples:
      | segmento | idioma |
      | es       | es     |
      | en       | en     |
      | fr       | es     |
      | ""       | es     |

  @slice-0 @component
  Scenario: El catálogo en inglés no puede quedarse atrás del español
    # Cubierto por `pnpm typecheck`: `next-intl.d.ts` liga `Messages` a `es.json`.
    Given una clave nueva agregada solo a "es.json"
    When se corre `pnpm run typecheck`
    Then falla, nombrando la clave que falta en "en.json"

  # ---------------------------------------------------------------------------
  # Slice 1 — La interfaz habla los dos idiomas
  # ---------------------------------------------------------------------------

  @slice-1 @future
  Scenario: El marco del sitio cambia de idioma completo
    Given un visitante en la página de "Jugo Verde"
    When cambia el idioma a English
    Then la navegación, los botones y los estados vacíos están en inglés

  @slice-1 @future
  Scenario Outline: Las etiquetas de vocabulario se traducen sin tocar la allowlist
    Given una publicación con origin "<origin>"
    When se pinta su insignia en "<locale>"
    Then dice "<etiqueta>"

    Examples:
      | origin            | locale | etiqueta   |
      | hazlo_sano_propio | es     | Hazlo Sano |
      | hazlo_sano_propio | en     | Hazlo Sano |
      | reventa_cercana   | es     | Local      |
      | reventa_cercana   | en     | Local      |

  @slice-1 @future
  Scenario: No queda español escrito a mano dentro de los componentes
    Given `pnpm run check:i18n`
    When revisa "src/app/**" y "src/infra/UI/**"
    Then no encuentra literales con acentos ni signos españoles

  # ---------------------------------------------------------------------------
  # Slice 2 — El contenido deja de asumir español  (implementado)
  # Specs en src/domain/entities/post/translations.test.ts
  #          src/infra/UI/mappers/posts/mapPostsToCards.test.ts
  # ---------------------------------------------------------------------------

  @slice-2 @component
  Scenario Outline: La publicación se lee en el idioma que existe, y se declara cuál es
    Given la publicación "<publicacion>" con traducciones en "<idiomas>"
    When un visitante la abre en "<pedido>"
    Then la lee en "<mostrado>"
    And el respaldo se declara como "<respaldo>"

    Examples: con traducción al inglés — el estado tras el backfill
      | publicacion   | idiomas | pedido | mostrado | respaldo |
      | Jugo Verde    | es,en   | en     | en       | false    |
      | Jugo Verde    | es,en   | es     | es       | false    |

    Examples: sin traducción — nunca se queda en blanco
      | publicacion   | idiomas | pedido | mostrado | respaldo |
      | Suero natural | es      | en     | es       | true     |
      | Suero natural | es      | es     | es       | false    |

  @slice-2 @component
  Scenario: El enlace lleva al slug del idioma que se está enseñando
    Given "Jugo Verde" con slug "jugo-verde" en español y "green-juice" en inglés
    When se pinta su tarjeta en inglés
    Then el enlace apunta a "green-juice", no a "jugo-verde"

  @slice-2 @component
  Scenario: El SEO no anuncia una versión que no existe
    Given "Suero natural", que solo existe en español
    When se genera su metadata en inglés
    Then no se declara `alternates.languages`
    And el dato estructurado describe el texto que la página enseña, no el español por defecto

  # ---------------------------------------------------------------------------
  # Slice 3 — El contenido existe en inglés  (implementado)
  # Specs en src/use_cases/translatePost/translatePostUseCase.test.ts
  #          src/infra/services/GeminiTranslationService.test.ts
  # ---------------------------------------------------------------------------

  @slice-3 @component
  Scenario: El backfill traduce lo que ya está publicado
    Given las 23 publicaciones que solo existían en español
    When corre `pnpm run backfill-translations`
    Then cada una tiene su fila en inglés con su propio slug
    And `pnpm run backfill-embeddings` le da su vector, porque el embedding vive por traducción

  @slice-3 @component
  Scenario: Correr el backfill dos veces no duplica nada
    Given que las 23 ya están traducidas
    When se vuelve a correr el backfill
    Then no se escribe ninguna fila
    And una traducción corregida a mano sigue intacta

  @slice-3 @component
  Scenario: Publicar deja la traducción hecha sin hacer esperar
    Given que publico un producto en español
    When se guarda
    Then la respuesta no espera al traductor, porque la traducción va en su propio `after()`
    And después existe su traducción al inglés

  @slice-3 @component
  Scenario: Con el traductor caído, la publicación se crea igual
    Given que el proveedor de traducción no responde
    When publico un producto
    Then el producto queda publicado y su traducción, pendiente para el backfill
    And el caso de uso no lanza: la respuesta ya salió y nadie vería la excepción

  @slice-3 @component
  Scenario Outline: Una traducción que sale mal no se guarda
    Given que el proveedor devuelve "<respuesta>"
    When se intenta traducir
    Then la fila no se escribe y queda pendiente

    Examples: los tres fallos que aparecieron en la corrida real
      | respuesta                                  | por qué importa                                  |
      | el texto en español sin tocar              | el slug saldría en español con un -1 pegado      |
      | el cuerpo con los saltos de línea aplastados | la publicación se vuelve un muro de texto      |
      | prosa en vez de JSON                       | el preámbulo acabaría publicado como el título   |

  # ---------------------------------------------------------------------------
  # Slice 4 — URLs localizadas
  # ---------------------------------------------------------------------------

  @slice-4 @future
  Scenario Outline: La misma página se sirve en la dirección de cada idioma
    Given la ruta interna "<interna>"
    When un visitante la pide en "<locale>"
    Then la dirección es "<url>"

    Examples:
      | interna   | locale | url            |
      | /products | es     | /productos     |
      | /products | en     | /en/products   |
      | /store    | es     | /tienda        |
      | /store    | en     | /en/store      |

  @slice-4 @future
  Scenario: Cambiar de idioma conserva la página, no manda al inicio
    Given un visitante en "/tienda/hazlo-sano"
    When cambia a English
    Then llega a "/en/store/hazlo-sano" y no a "/en"

  @slice-4 @future
  Scenario: El sitemap solo anuncia el inglés cuando existe de verdad
    Given "Jugo Verde" traducida y "Suero natural" sin traducir
    When un rastreador pide "/sitemap.xml"
    Then "Jugo Verde" aparece en ambos idiomas con sus `alternates`
    And "Suero natural" aparece solo en español
