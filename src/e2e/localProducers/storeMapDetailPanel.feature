Feature: Panel de detalle de tienda desde el mapa

  Context:
  - Problem: al seleccionar una tienda del mapa de productos, navegar directo o depender del popup del mapa rompe la exploracion.
  - Savings: la persona compara tiendas con menos ida y vuelta entre paginas.
  - Why: el mapa debe funcionar como explorador local antes de decidir abrir la tienda completa.

  As a visitor near the community
  I want to select a store on the map and see a site-level detail panel
  So that I can inspect it before leaving the catalog

  @slice-1
  Scenario: Seleccionar una tienda abre una ficha fuera del mapa
    Given existe la tienda "E2E Tienda con ficha de mapa" a 2 km del ancla
    And esa tienda publico "E2E Pan para ficha de mapa"
    And quien visita esta a 1.65 km del ancla
    When abre "/productos" y selecciona el marcador de la tienda
    Then la URL sigue en "/productos"
    And aparece una ficha del sitio fuera del contenedor de Leaflet
    And la ficha muestra "E2E Tienda con ficha de mapa"
    And la ficha muestra la distancia a la tienda
    And la ficha ofrece abrir la pagina publica de esa tienda
    And la ficha se puede cerrar

  @slice-2
  Scenario: La ficha se superpone sin desplazar el catalogo
    Given existe la tienda "E2E Tienda con ficha superpuesta" a 2 km del ancla
    And esa tienda publico "E2E Pan para ficha superpuesta"
    And quien visita esta a 1.65 km del ancla
    When abre "/productos" en movil y selecciona el marcador de la tienda
    Then la ficha queda fija en la parte inferior del viewport
    And la rejilla de productos conserva su posicion vertical
    And la ficha queda fuera del contenedor de Leaflet
    And la ficha se puede cerrar

  @slice-3 @future
  Scenario: La ficha resume publicaciones comerciales
    Given existe una tienda con productos y servicios disponibles
    When quien visita selecciona esa tienda en el mapa
    Then la ficha muestra una vista breve de lo que vende o atiende
    And la pagina completa de tienda sigue disponible como accion explicita

  @slice-4 @future
  Scenario: La seleccion del mapa se puede operar de forma accesible
    Given el mapa tiene al menos una tienda situada
    When quien visita opera la seleccion con teclado o vuelve a la pagina
    Then el foco, el cierre y el estado seleccionado siguen siendo claros
