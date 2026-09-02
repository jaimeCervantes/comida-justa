Feature: ThemeToggle en el header

  Context:
  - Problem: el conmutador de tema solo esta en el footer, aunque hay espacio util en el header y
    en el menu movil.
  - Savings: cambiar tema deja de requerir bajar al final de la pagina.
  - Why: la preferencia de tema es global y debe estar accesible desde el chrome principal.

  As a visitor
  I want the theme toggle in the header and mobile menu
  So that I can change theme without looking for the footer

  @slice-1
  Scenario: The desktop header exposes a theme toggle
    Given a visitor opens the home page on a desktop viewport
    When they inspect the page banner
    Then the banner contains one theme toggle
    And clicking it forces the light theme on the page root

  @slice-1
  Scenario: The mobile menu exposes a theme toggle
    Given a visitor opens the home page on a mobile viewport
    When they open the mobile menu
    Then the mobile menu contains one theme toggle
    And clicking it forces the light theme on the page root

  @slice-1
  Scenario: The footer keeps its theme toggle
    Given a visitor opens the home page
    When they inspect the page footer
    Then the footer still contains one theme toggle
