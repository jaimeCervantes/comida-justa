Feature: El cristal del header sigue el tema manual

  Context:
  - Problem: el `Header` cambia bien con `prefers-color-scheme`, pero no cuando `ThemeToggle`
    fuerza el tema escribiendo `data-theme` en `<html>`.
  - Savings: se evita una diferencia visual en cada pagina entre el tema automatico y el tema
    elegido por la persona.
  - Why: la eleccion de tema debe aplicarse a todo el chrome publico del sitio.

  As a visitor
  I want the header surface to follow the selected theme
  So that the site chrome feels consistent after I toggle the footer theme control

  @slice-1
  Scenario: The header glass follows the forced dark theme
    Given a visitor opens the home page with the browser in light color scheme
    When the visitor clicks the footer theme toggle twice to force dark theme
    Then the page root has `data-theme` set to "dark"
    And the header glass background is a dark surface, not the light surface

  @slice-1
  Scenario: The header glass keeps the forced light theme over a dark system preference
    Given a visitor opens the home page with the browser in dark color scheme
    When the visitor clicks the footer theme toggle once to force light theme
    Then the page root has `data-theme` set to "light"
    And the header glass background is a light surface, not the dark surface
