Feature: Sueño y Mente/Espíritu recuperan sus colores vivos

  Context:
  - Problem: Sueño y Mente/Espíritu se ven apagados después de sustituir su violeta y azul cielo.
  - Savings: se evita seguir ajustando una paleta que ya era reconocible y se reduce la frustración
    al distinguir los pilares.
  - Why: los pilares deben transmitir energía y diferenciarse, mientras Alimentación y Movimiento
    conservan su vínculo actual con la marca.

  As a visitante
  I want reconocer el violeta de Sueño y el azul de Mente/Espíritu
  So that los cuatro pilares se sientan vivos y claramente diferenciados

  # Cubierto por Vitest: es una regla de tokens de presentación sin navegación ni datos remotos que
  # justifiquen Playwright. Spec ejecutable en
  # src/presentation/design_system/tokens/pillarPalette.contrast.test.ts.
  @slice-1 @component
  Scenario Outline: Solo los dos pilares apagados recuperan su matiz anterior
    Given el pilar "<pilar>" con la rampa clara "<solid>", "<soft>" e "<ink>"
    When se publica la paleta de los cuatro pilares
    Then su origen visual sigue siendo "<origen>"
    And sus tres papeles mantienen contraste AA en los usos que contienen texto

    Examples:
      | pilar          | solid   | soft    | ink     | origen                         |
      | sueno          | #7c3aed | #f5f3ff | #7c3aed | violeta anterior #8b5cf6      |
      | alimentacion   | #dd340d | #fde3dd | #c52e0b | naranja de la marca #f0380e   |
      | movimiento     | #408410 | #e8f6df | #3c7b0f | verde de la marca #5dbf17     |
      | mente-espiritu | #0369a1 | #f0f9ff | #0369a1 | azul anterior #38bdf8         |

  @slice-1 @component
  Scenario Outline: Los colores vivos también son legibles en oscuro
    Given el pilar "<pilar>" en modo oscuro
    When su superficie usa "<soft>" y su tinta usa "<ink>"
    Then la tinta contrasta al menos 4.5 a 1 sobre la superficie y sobre el fondo de página

    Examples:
      | pilar          | soft    | ink     |
      | sueno          | #2e1065 | #c4b5fd |
      | mente-espiritu | #0c2a3b | #38bdf8 |
