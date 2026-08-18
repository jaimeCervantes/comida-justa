Feature: Editar cualquier tipo de publicacion

  Context:
  - Problem: la pantalla de edicion no carga ni guarda los campos propios de eventos y servicios. Un evento pierde su fecha/ruta al editarse desde el formulario, y un servicio no puede corregir su duracion.
  - Savings: se evita republicar desde cero, se reducen errores de datos incompletos y se baja la friccion de mantener publicaciones vivas.
  - Why: si el sitio permite publicar productos, anuncios, eventos y servicios, tambien debe permitir administrarlos sin romper el significado de cada tipo.

  As someone who published in the community
  I want to edit any publication type with its own fields
  So that correcting a post never strips the data that makes it a product, event or service

  Background:
    Given the app is running with PostgreSQL as the database
    And a signed-in owner has publications of different kinds

  @slice-1
  Scenario: Un evento carga y guarda su fecha
    Given I own the event "E2E Rodada nocturna editable" that starts on "2027-09-04 18:30" and ends on "2027-09-04 20:00"
    When I open "/editar/e2e-rodada-nocturna-editable"
    Then the form keeps the publication kind as "evento"
    And the start field shows "2027-09-04 18:30"
    And the end field shows "2027-09-04 20:00"
    When I change the start to "2027-09-05 07:15"
    And I change the end to "2027-09-05 09:00"
    And I save the publication
    Then the post is still an "evento"
    And its stored dates are:
      | field    | value                |
      | startsAt | 2027-09-05T07:15:00 |
      | endsAt   | 2027-09-05T09:00:00 |

  @slice-1
  Scenario: Un servicio carga y guarda precio y duracion
    Given I own the service "E2E Sesion de respiracion editable" with price "350" and duration "45"
    When I open "/editar/e2e-sesion-de-respiracion-editable"
    Then the form keeps the publication kind as "servicio"
    And the price field shows "350"
    And the duration field shows "45"
    When I change the price to "420"
    And I change the duration to "60"
    And I save the publication
    Then the post is still a "servicio"
    And its stored service fields are:
      | field           | value |
      | price           | 420   |
      | durationMinutes | 60    |

  @slice-1 @component
  Scenario Outline: La edicion valida los campos propios del tipo guardado
    Given an existing publication of kind "<kind>"
    When it is edited with start "<startsAt>", end "<endsAt>", price "<price>" and duration "<durationMinutes>"
    Then the edit is "<result>"

    Examples: accepted edits
      | kind     | startsAt         | endsAt           | price | durationMinutes | result |
      | evento   | 2027-09-05 07:15 | 2027-09-05 09:00 |       |                 | valid  |
      | evento   | 2027-09-05 07:15 |                  | 150   |                 | valid  |
      | servicio |                  |                  | 420   | 60              | valid  |

    Examples: rejected edits
      | kind     | startsAt | endsAt           | price | durationMinutes | result   | reason                     |
      | evento   |          | 2027-09-05 09:00 |       |                 | rejected | event without start        |
      | evento   | 2027-09-05 09:00 | 2027-09-05 07:15 |       |                 | rejected | event ends before starting |
      | servicio |          |                  | 420   |                 | rejected | service without duration   |
      | servicio |          |                  |       | 60              | rejected | service without price      |

  @slice-2 @future
  Scenario: Editar un evento conserva su ruta cuando no se toca
    Given I own an event with a GPX route
    When I edit only its title and date
    Then the stored route is still attached to the event

  @slice-2 @future
  Scenario: Editar un evento reemplaza su ruta cuando subo otro GPX
    Given I own an event with a GPX route
    When I upload a different GPX from "/editar/<slug>"
    Then the stored route is replaced by the new path

  @slice-3 @future
  Scenario Outline: Cada tipo se puede abrir y guardar sin cambiar de tipo
    Given I own a "<kind>" publication
    When I open its edit screen
    And I save a valid change
    Then it is still a "<kind>" publication

    Examples:
      | kind     |
      | producto |
      | anuncio  |
      | evento   |
      | servicio |

  @slice-4
  Scenario: La agenda del servicio aparece junto a las acciones
    Given the service "Descanso reparador" belongs to "Hazlo Sano" and has available schedule slots
    When I open "/descanso-reparador"
    Then the share action appears before the heading "Elige tu hora"
    And the heading "Elige tu hora" appears before the heading "Comentarios"
    And the cart button does not ask for a schedule slot
