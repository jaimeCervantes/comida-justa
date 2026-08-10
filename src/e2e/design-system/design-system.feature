Feature: Un design system que habla como la marca

  El sitio ya tiene tokens y un puñado de primitivos, pero el catálogo se quedó a medias: el mismo
  chip está escrito tres veces con tres estilos, y los cuatro pilares —el eje narrativo de Hazlo
  Sano— toman la mitad de su paleta de las utilidades por defecto de Tailwind.

  Context:
  - Problem: `SoldOutBadge`, `ProvenanceBadge` y `CategoryTag` pintan la misma insignia
    (`inline-flex items-center rounded-full px-3 py-1 text-sm`) con tres colores y dos pesos de
    fuente, sin compartir una línea de código. Hay 71 `rounded-*` sueltos en 31 archivos aunque
    `layout.css` ya define `--radius-*`. Y `pilaresData.ts` le da a Sueño y a Mente colores
    genéricos (`violet #8b5cf6`, `sky #38bdf8`) mientras `--brand-lightorange: #f2b705` existe en
    los tokens sin un solo uso.
  - Savings: el chip se escribe una vez y se configura, en lugar de reescribirse en cada pantalla.
    El contraste y el modo oscuro se garantizan en el token, no componente por componente y sin red.
  - Why: los cuatro pilares son lo que Hazlo Sano tiene que decir. Si la mitad de su paleta viene
    por defecto de una librería, el sitio no comunica una marca: muestra el CSS que tenía a la mano.

  As a visitante
  I want ver una interfaz que se lea como una sola pieza y sea legible en claro y en oscuro
  So that entienda de quién es el sitio y pueda leerlo sin esfuerzo

  # ---------------------------------------------------------------------------
  # Slice 3 — El chip deja de escribirse tres veces  (actual)
  # Cubierto por Vitest: son componentes de presentación pura, sin recorrido de
  # navegación que justifique un navegador. Specs en:
  #   src/presentation/design_system/badges/Badge.test.tsx
  #   src/presentation/design_system/tokens/pillarPalette.contrast.test.ts
  # ---------------------------------------------------------------------------

  @slice-3 @component
  Scenario Outline: Cada insignia del sitio es el mismo primitivo con otro tono
    Given una publicación con "<condicion>"
    When se pinta su insignia
    Then el visitante lee "<texto>"
    And la insignia usa la variante "<variante>" del primitivo Badge

    Examples:
      | condicion                       | texto                        | variante   |
      | isAvailable = false             | Agotado                      | neutral    |
      | origin = "hazlo_sano_propio"    | 🌿 Hazlo Sano                | brand      |
      | origin = "productor"            | 🧑‍🌾 Lo hace quien lo vende  | brand      |
      | origin = "reventa_cercana"      | 📍 Local                     | brand      |
      | subCategory = "jugos"           | Jugos                        | accent     |

  @slice-3 @component
  Scenario: Una insignia sin nada que decir no deja un hueco
    Given una publicación con existencias
    When se pinta su insignia de disponibilidad
    Then no se renderiza ningún elemento

  @slice-3 @component
  Scenario Outline: Cada pilar tiene una rampa de tres papeles, no un color suelto
    Given el pilar "<pilar>" con su semilla de marca "<semilla>"
    When se resuelve su rampa para el modo claro
    Then el papel "solid" es "<solid>"
    And el papel "soft" es "<soft>"
    And el papel "ink" es "<ink>"

    Examples: la marca gobierna — tres de cuatro salen de tokens que ya existían
      | pilar          | semilla | solid   | soft    | ink     | origen                  |
      | sueno          | #8b5cf6 | #7c3aed | #f5f3ff | #7c3aed | violeta anterior        |
      | alimentacion   | #f0380e | #dd340d | #fde3dd | #c52e0b | --brand-orange (logo)   |
      | movimiento     | #5dbf17 | #408410 | #e8f6df | #3c7b0f | --brand-lightgreen      |
      | mente-espiritu | #38bdf8 | #0369a1 | #f0f9ff | #0369a1 | azul cielo anterior     |

  @slice-3 @component
  Scenario Outline: Ninguna combinación de la paleta baja de AA
    Given el par "<primer_plano>" sobre "<fondo>"
    When se mide su contraste según WCAG 2.1
    Then el resultado es de al menos 4.5

    Examples: la tinta sobre su propio chip
      | primer_plano | fondo   | medido |
      | #7c3aed      | #f5f3ff | 5.20   |
      | #c52e0b      | #fde3dd | 4.57   |
      | #3c7b0f      | #e8f6df | 4.64   |
      | #0369a1      | #f0f9ff | 5.57   |

    Examples: texto blanco sobre el relleno sólido
      | primer_plano | fondo   | medido |
      | #ffffff      | #7c3aed | 5.70   |
      | #ffffff      | #dd340d | 4.59   |
      | #ffffff      | #408410 | 4.64   |
      | #ffffff      | #0369a1 | 5.93   |

  @slice-3 @component
  Scenario: El color nunca es el único portador del significado de un pilar
    Given que Movimiento (#3c7b0f) y Mente (#0369a1) contrastan 1.14 entre sí como tinta
    When un pilar se muestra al visitante
    Then su número o su etiqueta acompaña siempre al color
    And quien no distingue el tono sigue pudiendo identificar el pilar

  # ---------------------------------------------------------------------------
  # Slice 4 — Los pilares estrenan su paleta  (implementado)
  # Specs en src/app/[locale]/pilares/components/pilaresData.test.ts
  # ---------------------------------------------------------------------------

  @slice-4 @component
  Scenario: Los pilares estrenan su paleta
    Given las páginas de /pilares pintadas con utilidades crudas de Tailwind
    When adoptan los tokens --pillar-*
    Then ninguna clase violet-* ni sky-* sobrevive en src/app/[locale]/pilares/
    And ninguna clase del pilar necesita una variante "dark:"

  @slice-4 @component
  Scenario: El color del pilar no viaja como cadena de clases
    Given un componente que necesita pintar un pilar
    When recibe la clave del pilar en vez de un className
    Then un pilar solo puede pintarse de su propio color

  # ---------------------------------------------------------------------------
  # Slice 5 — Superficie y tarjeta  (implementado)
  # Specs en src/presentation/design_system/surfaces/Surface.test.tsx
  # ---------------------------------------------------------------------------

  @slice-5 @component
  Scenario Outline: Las tarjetas dejan de decidir su propio radio
    Given 71 usos de rounded-* repartidos en 31 archivos
    When "<componente>" cuelga del primitivo Surface
    Then el radio, la elevación y el borde vienen del token
    And la superficie conserva su etiqueta HTML "<etiqueta>"

    Examples:
      | componente        | etiqueta |
      | Card              | article  |
      | StoreSummaryCard  | article  |
      | PillarPanel       | div      |

  # ---------------------------------------------------------------------------
  # Slice 6 — Tipografía  (implementado)
  # Specs en src/presentation/design_system/typography/{Heading,Text}.test.tsx
  # ---------------------------------------------------------------------------

  @slice-6 @component
  Scenario Outline: Cada nivel de encabezado trae su tamaño, y se puede separar
    Given un encabezado de nivel "<nivel>"
    When no se pide un tamaño distinto
    Then se renderiza como "<etiqueta>" con el tamaño "<tamaño>"

    Examples:
      | nivel | etiqueta | tamaño           |
      | 1     | h1       | text-heading-lg  |
      | 2     | h2       | text-heading-md  |
      | 3     | h3       | text-heading-sm  |
      | 4     | h4       | text-body-lg     |

  # El componente existía desde el slice 6 y la ficha de una publicación no lo usaba: sus tres
  # encabezados iban con clases escritas a mano. "Publicaciones Relacionadas" era
  # `text-3xl font-bold` y el título de la publicación `text-3xl` a secas —sin peso—, así que el
  # vecindario se veía más fuerte que la publicación que se venía a leer.
  @slice-7
  Scenario: El título de una página pesa más que sus secciones
    Given la ficha de una publicación, con "Publicaciones Relacionadas" y "Comentarios"
    When alguien la abre
    Then el título de la publicación se ve más grande que las dos secciones
    And ninguna de las dos lo supera en peso

  @slice-7
  Scenario: Las secciones hermanas se ven iguales entre sí
    Given "Publicaciones Relacionadas" y "Comentarios", que son el mismo nivel del documento
    When alguien las compara
    Then tienen el mismo tamaño y el mismo peso, porque las dos salen de la escala y no de una clase copiada

  # Lo reportó el usuario al usar el home: cargaba más y las tarjetas ya vistas se recolocaban,
  # subiendo por encima de donde él estaba mirando. Es la multi-columna de CSS: `column-fill:
  # balance` reparte de nuevo TODAS las tarjetas cada vez que se añade una, y no sabe hacerlo de
  # otro modo. Partirlo en tandas lo evitaba, pero dejaba una costura con huecos cada nueve.
  @slice-8 @component
  Scenario: Cargar más no mueve lo que ya se estaba viendo
    Given un listado repartido en columnas por el cliente, cada tarjeta a la más corta
    When llega una tanda nueva
    Then las que ya estaban conservan su columna, porque el reparto se hace en orden
    And el listado sigue siendo continuo, sin costura entre una tanda y la siguiente

  @slice-8 @component
  Scenario Outline: El reparto es estable por construcción, no por suerte
    Given <cuantas> tarjetas ya repartidas en 3 columnas
    When se añaden 9 más
    Then las <cuantas> primeras siguen exactamente donde estaban

    Examples:
      | cuantas |
      | 9       |
      | 18      |
      | 27      |
      | 36      |

  # ---------------------------------------------------------------------------
  # Slice 9 — El primer pintado ya trae el ancho correcto  (actual)
  # Lo reportó el usuario abriendo el home en el teléfono: el feed aparece en varias
  # columnas apretadas y de golpe se convierte en una. El `useLayoutEffect` que corrige
  # el reparto solo protege los renders POSTERIORES a la hidratación; el primer pintado
  # es el HTML del servidor, y ese sale con tres columnas escritas porque el servidor no
  # tiene ancho que medir:  curl -s localhost:3000/ | grep -c masonry-column  → 3
  # ---------------------------------------------------------------------------

  @slice-9
  Scenario Outline: El feed abre con las columnas que caben, sin esperar al JavaScript
    Given un visitante con una ventana de <ancho> px
    When abre el home y el navegador pinta el HTML del servidor, antes de correr ningún script
    Then las publicaciones se agrupan en <columnas> posiciones horizontales
    And ninguna se mueve de sitio cuando el script termina de cargar

    Examples: la misma fórmula que aplica el cliente al medir, resuelta por CSS
      | ancho | columnas | contenedor | cuenta                    |
      | 390   | 1        | 358px      | cabe una de 300 y ya está |
      | 1280  | 3        | 1216px     | (1216+16) / (300+16) = 3  |

  @slice-9 @component
  Scenario: Mientras no haya nada medido, el reparto lo hace CSS
    Given un listado en mampostería recién montado, sin ancho ni alturas que medir
    When se pinta
    Then no existe ninguna columna repartida por el cliente
    And el contenedor lleva la multi-columna de CSS, que el navegador resuelve sin scripts

  @slice-9 @component
  Scenario: En cuanto hay medidas, el reparto vuelve a ser el del cliente
    Given un listado montado en 1216px con tarjetas que ya tienen altura
    When el observador de tamaño avisa
    Then las tarjetas quedan repartidas en 3 columnas, cada una a la más corta
    And el reparto es el mismo del slice 8, que no se toca

  # El primer pintado y el reparto medido tienen que medir la columna igual, o el número de
  # columnas cambiaría al hidratar y volvería el brinco. Son dos sitios distintos —una clase
  # de Tailwind y dos constantes de TypeScript— porque Tailwind no lee valores de JavaScript.
  @slice-9 @component
  Scenario: Las dos maquetaciones miden la columna igual
    Given MIN_COLUMN_WIDTH = 300 y GAP = 16, que usa el reparto del cliente
    When se compara con la clase que pinta el primer render
    Then esa clase es "columns-[300px] gap-4": el mismo ancho mínimo y la misma separación

  @slice-6 @component
  Scenario: La jerarquía del documento no se sacrifica por la apariencia
    Given una sección que debe ser un h2 pero verse pequeña
    When se pide nivel 2 con tamaño xs
    Then el elemento sigue siendo un h2
    And su tamaño es el del cuerpo grande, no el de un encabezado de nivel 2

  # ---------------------------------------------------------------------------
  # Slice 7 — Estado, retroalimentación y foco  (implementado)
  # Specs en src/presentation/design_system/feedback/{Alert,Skeleton}.test.tsx
  # ---------------------------------------------------------------------------

  @slice-7 @component
  Scenario: El foco se ve siempre, incluso dentro de una tarjeta recortada
    Given un anillo de foco distinto en cada uno de nueve componentes
    And tarjetas con overflow hidden que recortaban cualquier box-shadow
    When el anillo se unifica en la utilidad focus-ring, dibujada con outline
    Then quien navega con teclado ve dónde está en cualquier pantalla
    And el anillo sigue el radio del elemento en vez de encajonarlo

  @slice-7 @component
  Scenario Outline: Un aviso se anuncia con la urgencia que le corresponde
    Given un aviso de tono "<tono>"
    When un lector de pantalla lo encuentra
    Then su role es "<role>"
    And su etiqueta de texto lo hace legible sin percibir el color

    Examples: solo el error interrumpe la lectura
      | tono    | role   |
      | error   | alert  |
      | warning | status |
      | success | status |
      | info    | status |

  @slice-7 @component
  Scenario: Lo que aún no cargó no se anuncia ni marea
    Given una ficha de publicación cargando
    When se pintan sus huecos
    Then cada hueco es aria-hidden y el contenedor lleva aria-busy
    And la animación de brillo solo ocurre bajo motion-safe
