Feature: Agenda de cuenta usable

  Context:
  - Problem: /cuenta/agenda muestra horario y ausencias como dos formularios seguidos, con poca
    jerarquia y controles dificiles de usar en movil.
  - Savings: quien vende servicios ahorra frustracion y tiempo al entender que horario regular y
    ausencias son dos decisiones distintas.
  - Why: la agenda debe ser una herramienta diaria de trabajo para servicios, no una pantalla que se
    entiende solo despues de probarla.

  As a seller
  I want my account schedule to explain what is active and what I can edit
  So that I can keep availability updated from mobile or desktop

  @slice-1
  Scenario Outline: La agenda separa horario semanal y ausencias sin desbordar
    Given una vendedora con la tienda "Panadería Agenda Clara" abierta
    When abre "/cuenta/agenda" en un viewport "<viewport>"
    Then ve un resumen de su agenda
    And distingue el bloque de horario semanal del bloque de ausencias
    And puede agregar una franja semanal y una ausencia desde controles visibles
    And la pantalla no necesita scroll horizontal

    Examples:
      | viewport |
      | mobile   |
      | desktop  |

  @slice-2 @future
  Scenario: La agenda con varias franjas se revisa por dia
    Given una vendedora con varias franjas repartidas durante la semana
    When abre "/cuenta/agenda"
    Then entiende que dias tienen atencion sin leer filas sueltas sin contexto

  @slice-2 @future
  Scenario: Las ausencias existentes se leen como excepciones proximas
    Given una vendedora con ausencias proximas guardadas
    When abre "/cuenta/agenda"
    Then entiende que excepciones bloquean huecos aunque su semana tipo diga que atiende
