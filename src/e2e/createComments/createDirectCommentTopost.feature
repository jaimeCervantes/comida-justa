Feature: Write comments on healthy post posts
  As an authenticated user
  I want to write, edit, and delete comments on a healthy post post
  To share my opinion with other users

  Scenario: Write a comment on a post
    Given the user is authenticated and viewing a post
    When they write a comment in the comment field
    Then the comment should appear below the post with the user's name and the date.

  Scenario: Validation of empty fields
    Given the user is authenticated and viewing a post
    When they attempt to submit a comment with no text
    Then it should show an error message indicating that the comment cannot be empty.

  Scenario: Maximum comment length
    Given the user is authenticated
    When they try to write a comment that exceeds 500 characters
    Then it should show an error message indicating that the comment cannot exceed 500 characters.

  Scenario: View comments from other users
    Given the user is authenticated and viewing a post
    When other users have commented on the post
    Then they should be able to see the comments sorted by date, from newest to oldest.

  Scenario: Success notification upon commenting
    Given the user has written a comment
    When the comment is submitted successfully
    Then the user should receive a notification confirming that their comment has been posted.

  # ---------------------------------------------------------------------------
  # Slice: el servidor deja de creerle al cliente  (2026-08-29)
  #
  # `addCommentToPost` es una Server Action, o sea un endpoint HTTP publico, y recibia al AUTOR como
  # parametro desde el navegador: se escribia tal cual en `comments.user_id`. Cualquiera con el id de
  # otra persona real podia firmar un comentario a su nombre, y despues del hecho no hay forma de
  # distinguir el falso del verdadero.
  #
  # Los dos escenarios de arriba —«Validation of empty fields» y «Maximum comment length»— estaban
  # escritos desde el primer dia y nunca se cumplieron en el servidor. No son alcance nuevo: son la
  # misma promesa, ahora con quien la sostenga.
  # ---------------------------------------------------------------------------

  @slice-seguridad @component
  # Vitest y no Playwright: lo que se afirma es que la ACCION no le cree al navegador, y eso se ve
  # en su firma y en lo que le pasa al repositorio. Un recorrido de navegador solo podria conducir
  # el camino honrado —el formulario ya manda al usuario correcto—, que es justo el que no falla.
  Scenario: El autor sale de la sesion, no de lo que mande el navegador
    Given una persona con sesion iniciada como "ana"
    When escribe un comentario
    Then el comentario se guarda a nombre de "ana"
    And la accion no acepta ningun autor como parametro

  @slice-seguridad @component
  Scenario: Sin sesion no se guarda nada
    Given una peticion sin sesion iniciada
    When llega un comentario a la accion
    Then no se escribe en la base
    And se contesta que hay que iniciar sesion

  @slice-seguridad @component
  Scenario Outline: El contenido se valida donde no se puede esquivar
    Given una persona con sesion iniciada
    When envia un comentario <contenido>
    Then <resultado>

    Examples: rechazados — el navegador ya lo impedia, pero el navegador no es la defensa
      | contenido                  | resultado                                    | reason                                  |
      | vacio                      | no se guarda y se explica que falta el texto | el `.feature` lo prometia desde el dia 1 |
      | de solo espacios           | no se guarda y se explica que falta el texto | un textarea con espacios no es un texto  |
      | de 501 caracteres          | no se guarda y se explica el tope de 500     | `content` es `text`: sin tope no hay tope |

    Examples: aceptados
      | contenido                  | resultado                                    | reason                                  |
      | de 500 caracteres exactos  | se guarda                                    | el tope es el ultimo que entra, no el primero que sobra |
      | con espacios alrededor     | se guarda sin los espacios de los bordes     | lo que se cuenta y se guarda es el texto |
