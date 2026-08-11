Feature: Cada sección del menú apunta visualmente a su submenú

  Context:
  - Problem: después de separar la navegación del despliegue, el título y la flecha verde quedaron
    demasiado apartados, el triángulo blanco no nació del centro del control completo y el panel
    quedó separado por un hueco mayor que el propio triángulo. La sección parece formada por piezas
    sueltas y la punta no comparte exactamente el color de la superficie.
  - Savings: se elimina la duda de qué flecha pertenece a qué título, de qué elemento nace el
    submenú abierto y de si el triángulo forma parte del panel.
  - Why: un control dividido debe conservar dos acciones accesibles sin dejar de percibirse como un
    solo elemento del menú principal.

  As a visitante que usa el menú de escritorio
  I want to ver juntos el título, su flecha y el submenú que abren
  So that identifico de inmediato qué sección está desplegada

  @slice-2
  Scenario Outline: El indicador nace del centro del control completo
    Given un visitante viendo el menú principal en escritorio
    When abre el submenú de "<seccion>"
    Then la flecha verde queda a no más de 8 píxeles del título
    And el triángulo blanco queda centrado bajo el control con una tolerancia de 2 píxeles
    And el triángulo blanco toca el submenú con una separación máxima de 1 píxel

    Examples:
      | seccion   |
      | Comunidad |
      | 4 Pilares |

  @slice-3
  Scenario Outline: Solo el triángulo separa el control de su panel
    Given un visitante viendo el menú principal en escritorio
    When abre el submenú de "<seccion>"
    Then hay exactamente 8 píxeles entre el control y el submenú
    And el triángulo ocupa toda esa separación y toca el panel
    And el triángulo y el submenú tienen el mismo color de fondo calculado

    Examples:
      | seccion   |
      | Comunidad |
      | 4 Pilares |
