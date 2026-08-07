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
      | sueno          | #4c4a8f | #4c4a8f | #e6e6ef | #4c4a8f | nuevo, índigo nocturno  |
      | alimentacion   | #f0380e | #dd340d | #fde3dd | #c52e0b | --brand-orange (logo)   |
      | movimiento     | #5dbf17 | #408410 | #e8f6df | #3c7b0f | --brand-lightgreen      |
      | mente-espiritu | #f2b705 | #936f03 | #fdf5dc | #8e6b03 | --brand-lightorange     |

  @slice-3 @component
  Scenario Outline: Ninguna combinación de la paleta baja de AA
    Given el par "<primer_plano>" sobre "<fondo>"
    When se mide su contraste según WCAG 2.1
    Then el resultado es de al menos 4.5

    Examples: la tinta sobre su propio chip
      | primer_plano | fondo   | medido |
      | #4c4a8f      | #e6e6ef | 6.30   |
      | #c52e0b      | #fde3dd | 4.57   |
      | #3c7b0f      | #e8f6df | 4.64   |
      | #8e6b03      | #fdf5dc | 4.53   |

    Examples: texto blanco sobre el relleno sólido
      | primer_plano | fondo   | medido |
      | #ffffff      | #4c4a8f | 7.83   |
      | #ffffff      | #dd340d | 4.59   |
      | #ffffff      | #408410 | 4.64   |
      | #ffffff      | #936f03 | 4.65   |

  @slice-3 @component
  Scenario: El color nunca es el único portador del significado de un pilar
    Given que Movimiento (#3c7b0f) y Mente (#8e6b03) contrastan 1.06 entre sí como tinta
    When un pilar se muestra al visitante
    Then su número o su etiqueta acompaña siempre al color
    And quien no distingue el tono sigue pudiendo identificar el pilar

  # ---------------------------------------------------------------------------
  # Slices siguientes — esqueletos. No corren en CI ni bloquean.
  # ---------------------------------------------------------------------------

  @slice-4 @future
  Scenario: Los pilares estrenan su paleta
    Given las páginas de /pilares pintadas con utilidades crudas de Tailwind
    When adoptan los tokens --pillar-*
    Then ninguna clase violet-* ni sky-* sobrevive en src/app/[locale]/pilares/

  @slice-5 @future
  Scenario: Las tarjetas dejan de decidir su propio radio
    Given 71 usos de rounded-* repartidos en 31 archivos
    When Card, CardForList y StoreSummaryCard cuelgan del primitivo Surface
    Then el radio, la elevación y el borde vienen del token

  @slice-6 @future
  Scenario: La tipografía deja de ser text-sm a mano
    Given los tokens --fs-* que hoy no consume nadie
    When los primitivos Heading y Text los consumen
    Then una escala tipográfica cambia en un solo archivo

  @slice-7 @future
  Scenario: El foco se ve siempre
    Given un anillo de foco distinto en cada componente
    When se unifica en un token
    Then quien navega con teclado ve dónde está en cualquier pantalla
