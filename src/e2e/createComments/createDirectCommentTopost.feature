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

  # ---------------------------------------------------------------------------
  # Slice: el texto y la frecuencia  (2026-08-29)
  #
  # Lo que NO hizo falta arreglar, y conviene dejarlo escrito para que nadie lo "arregle" dos veces:
  # el XSS ya estaba cerrado por construccion —el comentario se pinta como `{comment.content}` y
  # React escapa; se comprobo que no llega a JSON-LD, ni a RSS, ni a llms.txt, ni al bot—, la
  # inyeccion SQL la cierra Drizzle parametrizando, y `post_id`/`user_id` tienen clave foranea. Meter
  # un saneador de HTML habria dado falsa sensacion y roto texto legitimo como "<3" o "a > b".
  #
  # Lo que si estaba abierto son estos dos: texto que se lee distinto de como se guarda, y la
  # ausencia total de un limite de frecuencia —no habia ninguno en todo el repositorio—.
  # ---------------------------------------------------------------------------

  @slice-texto @component
  # Vitest y no navegador: es una funcion de dominio sobre una cadena. Un recorrido de navegador
  # solo podria escribir el texto raro y volver a leerlo, que es lo que la unitaria ya afirma sin
  # gastar un minuto de arranque.
  Scenario Outline: El texto se guarda como se lee
    Given un comentario que trae <entrada>
    When se envia
    Then se guarda <resultado>

    Examples: lo que hace leer una cosa distinta de la guardada
      | entrada                             | resultado                          | reason                                        |
      | una anulacion de derecha a izquierda | sin ella                          | U+202E da la vuelta a lo mostrado, no a lo guardado |
      | invisibles entre las letras          | con la palabra entera             | "e-s-t-a-f-a" partido no lo ve ningun filtro  |
      | controles de C0                      | sin ellos                         | un U+0000 en una columna text no dice nada    |

    Examples: lo que rompe la ficha
      | entrada                     | resultado                     | reason                                          |
      | cuarenta saltos de linea    | con un parrafo en blanco      | la seccion usa whitespace-pre-wrap: son 40 renglones |
      | finales de linea de Windows | con saltos normales           | \r\n y \r llegan de lo pegado desde otras apps   |

    Examples: lo que NO se toca
      | entrada                          | resultado           | reason                                              |
      | el emoji de familia              | intacto             | lo une U+200D, de la misma categoria que los de arriba |
      | acentos descompuestos            | en su forma NFC     | "café" escrito de dos maneras es el mismo texto     |
      | un comentario normal con emoji   | igual que llego     | la normalizacion no puede notarse en el caso comun  |

  @slice-texto @component
  Scenario: Un comentario hecho solo de invisibles no es un comentario
    Given un comentario que solo trae caracteres invisibles
    When se envia
    Then no se guarda y se explica que falta el texto

  @slice-texto @component
  Scenario: El tope se mide sobre lo que se va a guardar
    Given un comentario con 501 invisibles delante de un texto corto
    When se envia
    Then se guarda el texto corto, porque lo que se quita no cuenta para el tope

  @slice-frecuencia @component
  # El unico de todo el slice que ataja un abuso a ESCALA: los demas dicen que se acepta, este dice
  # cuanto. No habia ningun limite de frecuencia en el repositorio, asi que con una sesion valida y
  # un bucle la ficha de cualquiera se llena de miles de comentarios en un minuto.
  Scenario Outline: Cinco comentarios por minuto y persona
    Given una persona que lleva <ya> comentarios en el ultimo minuto
    When escribe otro
    Then <resultado>

    Examples:
      | ya | resultado                                  | reason                                         |
      | 4  | se guarda                                  | escribir rapido no es abusar                   |
      | 5  | no se guarda y se le pide que espere       | el tope es el ultimo que entra, no el primero que sobra |

  @slice-frecuencia @component
  Scenario: La cuenta es por persona y sobre el ultimo minuto
    Given una persona con sesion iniciada
    When la accion comprueba su frecuencia
    Then pregunta por SU identificador y por los ultimos 60 segundos
    And a quien no tiene sesion no se le consulta nada
