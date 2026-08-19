Feature: Asistencia a eventos

  Context:
  - Problem: un evento ya tiene fecha y ficha, pero la persona interesada no tiene una accion clara
    para avisar que quiere asistir, y quien lo publica no recibe un mensaje con el contexto del
    evento.
  - Savings: reduce coordinacion manual por WhatsApp, evita mensajes incompletos y obliga a que la
    intencion venga de una cuenta iniciada, no de visitantes anonimos.
  - Why: los eventos deben ser participables desde la plataforma. La ficha no solo informa cuando
    ocurre; tambien debe abrir el camino para asistir y, despues, confirmar asistentes.

  As a visitor interested in a wellness event
  I want to tell the creator I want to attend
  So that the creator receives the event context without manual back-and-forth

  Background:
    Given the app is running with PostgreSQL as the database
    And a published event "Meditacion guiada en el parque" exists at "2027-08-23 07:30" with contact phone "2781092116"

  @slice-1
  Scenario: Un visitante anonimo debe iniciar sesion antes de avisar por WhatsApp
    Given I am not signed in
    When I open the event detail page for "Meditacion guiada en el parque"
    Then I see a visible "Avisar que quiero asistir" action
    When I choose to notify the creator
    Then I am sent to sign in
    And the sign-in URL keeps the event detail page as callback

  @slice-1
  Scenario: Un usuario con sesion avisa por WhatsApp con el evento identificado
    Given I am signed in
    When I open the event detail page for "Meditacion guiada en el parque"
    Then I see a visible "Avisar que quiero asistir" action
    And its WhatsApp link points to "2781092116"
    And its message includes:
      | field | value                         |
      | title | Meditacion guiada en el parque|
      | when  | 2027-08-23 07:30              |
      | url   | /meditacion-guiada-en-el-parque|

  @slice-1
  Scenario Outline: Solo los eventos muestran la accion de asistir antes de iniciar sesion
    Given a published post "<title>" exists with kind "<kind>" and contact phone "<phone>"
    When I open the post detail page for "<title>"
    Then the attend sign-in action is "<visibility>"

    Examples: visible for events
      | title                         | kind     | phone      | visibility |
      | Meditacion guiada en el parque| evento   | 2781092116 | visible    |
      | Jugo Verde                    | producto | 2781092116 | hidden     |
      | Masaje relajante 30 minutos   | servicio | 2781092116 | hidden     |
      | Rodada sin telefono           | evento   |            | visible    |

  @slice-2
  Scenario: Un usuario confirma y cancela que va a asistir
    Given I am signed in
    And a published event "Meditacion guiada en el parque" exists at "2027-08-23 07:30" with contact phone "2781092116"
    When I open the event detail page for "Meditacion guiada en el parque"
    Then I see a visible "Voy a asistir" action
    And the attendee count says "Nadie ha confirmado asistencia"
    When I mark that I will attend
    Then the attendee count says "1 persona va a asistir"
    And the attendance action says "Ya no voy"
    When I reload the event detail page
    Then the attendee count says "1 persona va a asistir"
    And the attendance action says "Ya no voy"
    When I cancel my attendance
    Then the attendee count says "Nadie ha confirmado asistencia"
    And the attendance action says "Voy a asistir"

  @future @slice-3
  Scenario: El creador ve la lista de asistentes confirmados
    Given I created a published event
    And two users confirmed attendance
    When I open the event detail page
    Then I can see the attendee list
