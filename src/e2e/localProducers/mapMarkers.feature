Feature: Los marcadores del mapa se distinguen del mapa

  Context:
  - Problem: el mapa de tiendas usa emojis para marcar a la persona y a las tiendas; contra el mapa
    verde no se leen como controles profesionales ni diferencian con claridad los dos roles.
  - Savings: se ahorra tiempo al decidir qué punto representa mi ubicación y qué punto representa
    una tienda que puedo abrir.
  - Why: el mapa es una herramienta de decisión por cercanía; sus marcadores deben ser la capa más
    evidente, no confundirse con el fondo.

  As a visitante con ubicación conocida
  I want to distinguir mi ubicación de las tiendas en el mapa
  So that puedo decidir rápido a cuál acercarme

  @slice-1
  Scenario: La tienda y la ubicación usan marcadores profesionales y contrastantes
    Given un visitante con ubicación conocida abre el catálogo con una tienda situada
    When el mapa de tiendas se renderiza
    Then ve un marcador de tienda sin emoji
    And ve un marcador de su ubicación sin emoji
    And los dos marcadores usan colores distintos entre sí y distintos al verde del mapa
