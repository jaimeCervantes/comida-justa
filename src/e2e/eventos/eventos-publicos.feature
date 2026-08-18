Feature: Eventos publicos y catalogo comercial claro

  Context:
  - Problem: los servicios ya existen y se agendan, pero no aparecen en una superficie comercial
    clara. Los eventos tambien existen, pero quedan repartidos entre feed, pilares y fichas sin una
    ruta publica por fecha.
  - Savings: quien visita deja de adivinar donde comprar, agendar o asistir; y quien publica no
    tiene que explicar por WhatsApp donde esta su evento o su servicio.
  - Why: el sitio ya no es solo catalogo de comida. Si la plataforma cubre cuatro pilares, la
    navegacion tiene que separar comprar productos, agendar servicios y asistir a eventos.

  As a visitor
  I want events to have their own public page
  So that I can see what is coming without mixing it with products or services

  Background:
    Given the app is running with PostgreSQL as the database
    And published products, services and events exist

  @slice-1
  Scenario: La agenda publica lista solo eventos por fecha
    Given these published posts exist:
      | title                         | kind     | starts_at           |
      | Jugo Verde                    | producto |                     |
      | Masaje relajante 30 minutos   | servicio |                     |
      | Meditacion guiada en el parque| evento   | 2026-08-23 07:30    |
      | Taller de higiene del sueno   | evento   | 2026-08-25 19:00    |
    When a visitor opens "/eventos"
    Then "Meditacion guiada en el parque" is listed before "Taller de higiene del sueno"
    And "Jugo Verde" is not listed
    And "Masaje relajante 30 minutos" is not listed
    And each listed event shows when it happens

  @slice-1
  Scenario: La ruta inglesa publica los mismos eventos
    Given the event "Meditacion guiada en el parque" is published
    When a visitor opens "/en/events"
    Then the event is listed
    And the page uses the English events heading

  # La base compartida puede tener eventos reales. Este caso se cubre como componente para probar
  # la decision visual sin borrar contenido que no es de la suite.
  @slice-1 @component
  Scenario: La agenda publica explica cuando no hay eventos
    Given no published events exist
    When a visitor opens "/eventos"
    Then the empty events message is shown

  @slice-2
  Scenario: El catalogo comercial lista productos y servicios
    Given these published posts exist:
      | title                       | kind     |
      | Jugo Verde                  | producto |
      | Masaje relajante 30 minutos | servicio |
      | Meditacion guiada           | evento   |
    When a visitor opens "/productos"
    Then "Jugo Verde" is listed
    And "Masaje relajante 30 minutos" is listed
    And "Meditacion guiada" is not listed
    And "Jugo Verde" can be added to the cart
    And "Masaje relajante 30 minutos" links to booking
