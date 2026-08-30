Feature: El submenú de Comunidad permite recorrer todos sus enlaces

  Context:
  - Problem: el submenú de Comunidad en escritorio es más alto que el viewport y el enlace final a
    «Nosotros» queda fuera del área visible.
  - Savings: se evita que una persona abandone la navegación o tenga que cambiar el zoom del
    navegador para alcanzar un destino que sí existe en el menú.
  - Why: el menú de Comunidad seguirá creciendo con nuevas categorías; debe escalar sin volver
    inaccesibles las secciones publicadas.

  As a visitante que usa el menú de escritorio
  I want to desplazar el submenú de Comunidad por dentro
  So that todos sus enlaces siguen disponibles aunque el panel crezca

  @slice-1
  Scenario: El contenido final se alcanza dentro del submenú desplazable
    Given un visitante viendo el sitio en escritorio con un viewport bajo
    When abre el submenú de Comunidad
    Then el submenú cabe dentro del viewport visible
    And el contenido del submenú se puede desplazar verticalmente
    And el enlace «Negocios locales» se alcanza al desplazar el submenú

  @slice-2
  Scenario: Nosotros vive junto a los enlaces principales
    Given un visitante viendo el sitio en escritorio
    When abre el submenú de Comunidad
    Then «Nosotros» aparece antes de «Por categoría»
    And «Nosotros» comparte grupo con «Publicaciones», «Productos y servicios» y «Eventos»
