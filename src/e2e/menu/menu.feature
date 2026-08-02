Feature: El menú móvil llega hasta el final

  Context:
  - Problem: el desplegable de «Comunidad» recortaba su contenido a una altura fija. Al entregar
    los directorios de productores y negocios locales, la lista pasó a 14 enlaces —publicaciones,
    productos, las 10 categorías y las 2 secciones— y las dos últimas quedaron **fuera del
    recorte**: en un teléfono no había forma de llegar a ellas.
  - Savings: son las dos secciones que acabamos de construir. Un enlace que existe pero no se puede
    tocar es trabajo entregado que nadie usa, y el móvil es desde donde entra la mayoría.
  - Why: el menú es la única puerta a las secciones que no están en el inicio.

  As a persona que entra desde su teléfono
  I want to poder abrir cualquier sección del menú
  So that llego a lo que la comunidad publica sin tener que saberme la dirección

  @menu
  Scenario: Se puede llegar a la última entrada de «Comunidad» desde un teléfono
    Given un visitante con la pantalla de un teléfono
    When abre el menú y despliega «Comunidad»
    Then puede tocar «Negocios locales» y llega a esa sección

  @menu
  Scenario: El menú entero se puede recorrer aunque no quepa
    Given un visitante con la pantalla de un teléfono
    When abre el menú
    Then puede desplazarse hasta «Nosotros», la última entrada

  @menu
  Scenario: Las categorías viven en su propio desplegable
    Given un visitante con la pantalla de un teléfono
    When abre el menú
    Then no ve las categorías hasta que despliega «Por categoría»
    And al desplegarla llega a "Panadería"
