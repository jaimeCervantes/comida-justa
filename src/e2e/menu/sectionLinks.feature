Feature: Los títulos del menú principal llevan a sus portadas

  Context:
  - Problem: «Comunidad» y «4 Pilares» parecen destinos principales, pero al tocarlos solo abren un
    submenú. No hay forma directa de llegar a la portada de pilares y el inicio de la comunidad
    queda ambiguo.
  - Savings: se ahorran clics y frustración al hacer que cada título navegue, sin quitar la
    exploración de sus destinos específicos.
  - Why: la navegación principal debe llevar a los puntos de entrada canónicos y permitir explorar
    su jerarquía con controles distintos.

  As a visitante
  I want to elegir entre entrar a una sección o desplegar sus destinos
  So that llego directamente a su portada sin perder el acceso al submenú

  @slice-1
  Scenario Outline: El título abre la portada canónica en el idioma activo
    Given un visitante en "<origen>" usando el menú de "<dispositivo>"
    When activa el título "<seccion>"
    Then llega a "<destino>"

    Examples:
      | dispositivo | origen       | seccion      | destino      |
      | escritorio  | /nosotros    | 4 Pilares    | /pilares     |
      | escritorio  | /nosotros    | Comunidad    | /             |
      | teléfono    | /nosotros    | 4 Pilares    | /pilares     |
      | teléfono    | /nosotros    | Comunidad    | /             |
      | escritorio  | /en/about    | 4 Pillars    | /en/pillars  |
      | escritorio  | /en/about    | Community    | /en           |

  @slice-1
  Scenario Outline: La flecha despliega destinos sin navegar
    Given un visitante en "/nosotros" usando el menú de "<dispositivo>"
    When activa la flecha de "<seccion>"
    Then sigue en "/nosotros"
    And puede elegir "<destino_visible>" en el submenú

    Examples:
      | dispositivo | seccion   | destino_visible |
      | escritorio  | 4 Pilares | Sueño y Descanso |
      | escritorio  | Comunidad | Publicaciones    |
      | teléfono    | 4 Pilares | Sueño y Descanso |
      | teléfono    | Comunidad | Publicaciones    |
