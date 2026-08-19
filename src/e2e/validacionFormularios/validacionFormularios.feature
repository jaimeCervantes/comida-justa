Feature: El formulario dice por qué, en el idioma de la página

  Publicar y editar se apoyan hoy en el globito nativo del navegador. Sale en el idioma del
  navegador y no en el de la página, muestra un campo a la vez, se va solo a los pocos segundos, y
  para el teléfono sólo sabe decir «coincide con el formato solicitado». Lo que el servidor sí
  contesta bien llega después de un viaje completo, y tres de esos errores ni siquiera se pintan.

  Context:
  - Problem: con `localePrefix: "as-needed"`, alguien con Chrome en español en `/en/publish` lee
    «Completa este campo»: una cadena visible que no está en `src/i18n/messages/`, que `AGENTS.md`
    prohíbe y que además nadie puede traducir. Publicar un evento son doce campos y el globito
    enseña uno por envío. El teléfono lleva `pattern="^\+?(\d{1,3})?[0-9]{10}$"` sin una sola
    palabra que explique qué formato es ése. Y `state.errors.media` no se pinta en ninguna parte de
    `PublishForm`: publicar sin archivos rechaza en silencio.
  - Savings: se deja de perder la publicación en el teléfono, que es donde hoy se cae; cada error
    que atrapa el navegador es una Server Action que no se ejecuta (con su sesión, su consulta de
    taxonomía y su repintado); y el arreglo se hace una vez en la primitiva en lugar de cinco veces
    en cinco pantallas.
  - Why: publicar es la entrada del embudo — quien no consigue publicar no vuelve. Y un sitio que se
    presenta en dos idiomas no puede contestar en un tercero.

  As a alguien que publica su comida sana
  I want que cada campo me diga en rojo, ahí mismo y en mi idioma, por qué no lo puedo enviar
  So that pueda arreglarlo sin adivinar y sin perder lo que ya escribí

  # ---------------------------------------------------------------------------
  # Slice 1 — El mensaje bajo el campo, en el idioma de la página  (actual)
  #
  # El modelo: los atributos (`required`, `pattern`, `min`, `step`) se quedan y son la
  # regla; el `<form>` lleva `noValidate`, que apaga el globito y NO la validación;
  # se lee `input.validity` y la bandera se traduce a una frase del catálogo, en el
  # mismo `FieldHelper` donde ya caen los errores del servidor.
  # ---------------------------------------------------------------------------

  # La columna `bandera` es la de la Constraint Validation API: es el navegador quien
  # juzga, y lo único nuestro es la frase. La columna `clave` demuestra la propiedad
  # que sostiene todo esto — el mensaje de antes de enviar y el que contesta la Server
  # Action salen de la MISMA clave del catálogo, así que no pueden contradecirse.
  @slice-1 @component
  Scenario Outline: Cada campo dice su razón, y es la misma que diría el servidor
    Given el formulario de publicar un "<tipo>"
    When se escribe "<valor>" en el campo "<campo>" y se sale de él
    Then bajo el campo se lee "<mensaje>"
    And el campo queda marcado con aria-invalid

    Examples: obligatorios — la frase es la que ya devuelve la Server Action
      | tipo     | campo           | valor | bandera      | clave                      | mensaje                                                |
      | producto | title           |       | valueMissing | publish.errorTitleRequired | El título es obligatorio.                              |
      | producto | content         |       | valueMissing | publish.errorContentRequired | El contenido es obligatorio.                         |
      | producto | phone           |       | valueMissing | publish.errorPhoneRequired | El teléfono es obligatorio.                            |
      | evento   | startsAt        |       | valueMissing | publish.errorStartsAtRequired | Un evento necesita decir cuándo ocurre.             |
      | servicio | durationMinutes |       | valueMissing | publish.errorDurationRequired | Un servicio necesita decir cuánto dura, en minutos. |

    Examples: formato y rango — donde el navegador sólo sabía decir una vaguedad
      | tipo     | campo           | valor        | bandera         | clave                       | mensaje                                                       |
      | producto | phone           | 278-109-2116 | patternMismatch | publish.errorPhoneFormat    | Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116        |
      | producto | phone           | 278109211    | patternMismatch | publish.errorPhoneFormat    | Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116        |
      | producto | price           | 0            | rangeUnderflow  | publish.errorPriceRequired  | El precio debe ser mayor a cero.                              |
      | servicio | durationMinutes | 3            | rangeUnderflow  | publish.errorDurationMin    | La duración mínima es de 5 minutos.                           |
      | servicio | durationMinutes | 7            | stepMismatch    | publish.errorDurationStep   | Escribe la duración en múltiplos de 5 minutos.                |

  @slice-1 @component
  Scenario: Un formulario recién abierto no acusa a nadie
    Given el formulario de publicar recién abierto, con todos sus campos vacíos
    When nadie ha escrito ni salido de ningún campo
    Then no hay ningún mensaje de error en pantalla
    And ningún campo lleva aria-invalid ni borde rojo

  @slice-1 @component
  Scenario: Escribir por primera vez no pinta de rojo a medio camino
    Given el campo "phone" vacío y sin tocar
    When se escribe "278" y todavía no se sale del campo
    Then no aparece ningún mensaje bajo el campo

  @slice-1 @component
  Scenario: Un campo ya tocado se corrige y el error se va sin esperar al envío
    Given el campo "phone" con "278109211", ya tocado, mostrando su mensaje
    When se completa hasta "2781092116"
    Then el mensaje desaparece en la misma tecla que lo arregla
    And el campo deja de llevar aria-invalid

  @slice-1
  Scenario: Enviar con errores enfoca el primero y no molesta al servidor
    Given el formulario de publicar abierto, sin llenar nada
    When se pulsa "Publicar"
    Then la Server Action no se ejecuta
    And el foco queda en el campo "Título de la publicación"
    And ese campo se ve en pantalla sin tener que hacer scroll
    And cada campo obligatorio muestra su mensaje al mismo tiempo, no de uno en uno

  # Ésta es la razón de ser del slice. El globito nativo lo pinta el navegador con SU
  # idioma de interfaz, que no tiene por qué ser el de la ruta: en `/en/publish` con un
  # Chrome en español decía «Completa este campo».
  #
  # La fila que lo demuestra es la segunda: mismo navegador, misma sesión, dos rutas, y
  # el mensaje cambia con la ruta. La combinación «navegador en inglés en `/publicar`»
  # no se puede probar y no se lista: el proxy de next-intl detecta el idioma y redirige
  # a `/en/publish` antes de que la página se pinte, así que nadie llega ahí.
  @slice-1
  Scenario Outline: El mensaje habla el idioma de la ruta, no el del navegador
    Given un navegador cuyo idioma de interfaz es "<navegador>"
    When se abre "<ruta>" y se sale del título vacío
    Then bajo el campo se lee "<mensaje>"

    Examples:
      | navegador | ruta         | mensaje                   |
      | es-MX     | /publicar    | El título es obligatorio. |
      | es-MX     | /en/publish  | The title is required.    |
      | en-US     | /en/publish  | The title is required.    |

  # Un campo no puede tener dos maneras de verse mal. El error del navegador y el de la
  # Server Action caen en el mismo `FieldHelper`, con el mismo icono y el mismo tono.
  #
  # Cubierto por Vitest y no por Playwright: la propiedad es del reparto de ese hueco
  # —quién gana, y cuándo se retira el del servidor—, y montarla en un navegador exigiría
  # un envío completo con archivos subidos para provocar un rechazo que el navegador no
  # pueda ver. Spec en
  # `src/presentation/design_system/forms/TextField.validity.test.tsx`.
  @slice-1 @component
  Scenario: El navegador y el servidor comparten hueco
    Given un campo con el error que contestó la Server Action
    When el navegador rechaza además lo que hay escrito ahora
    Then se lee un solo mensaje, el del navegador, porque describe lo que hay en pantalla
    And el del servidor se retira en cuanto se edita el campo, no al enviar

  @slice-1
  Scenario: Editar «Caminata de Tezonapa a Motzorongo» valida igual que publicarla
    Given la edición de la publicación "caminata-de-tezonapa-a-motzorongo"
    When se borra el título y se sale del campo
    Then bajo el campo se lee "El título es obligatorio."
    And el formulario de editar se comporta igual que el de publicar, porque es la misma primitiva

  # ---------------------------------------------------------------------------
  # Slice 2 — Los campos que hoy no dicen nada
  # ---------------------------------------------------------------------------

  @slice-2 @future
  Scenario: Publicar sin archivos deja de rechazar en silencio
    Given el formulario de publicar lleno pero sin ninguna imagen ni video
    When se pulsa "Publicar"
    Then junto a la bandeja de archivos se lee "Sube al menos una imagen o un video."

  @slice-2 @future
  Scenario: El error de editar se anuncia, no sólo se pinta de rojo
    Given una edición que la Server Action rechaza
    When un lector de pantalla llega al aviso
    Then lo anuncia con role="alert" y con su etiqueta de texto

  @slice-2 @future
  Scenario: Editar también contesta por título y descripción
    Given una edición enviada con el título vacío
    When la Server Action la rechaza
    Then el mensaje aparece bajo el título y no en el banner de arriba

  # ---------------------------------------------------------------------------
  # Slice 3 — El resto de los formularios y el pulido de las primitivas
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario: El contador cuenta lo que ya hay escrito
    Given la edición de "Dona Chocolate Keto", con 1205 caracteres de descripción
    When se abre el formulario
    Then el contador dice 1205 de 2500, y no 0

  @slice-3 @future
  Scenario: El contador no se va cuando más hace falta
    Given una descripción con error
    When se muestra su mensaje
    Then el contador sigue visible

  @slice-3 @future
  Scenario Outline: Los demás formularios heredan la misma validación
    Given el formulario "<formulario>"
    When se envía con un campo obligatorio vacío
    Then el mensaje sale del catálogo y no del navegador

    Examples:
      | formulario        |
      | AddBranchForm     |
      | BecomeSellerForm  |
      | StoreProfileForm  |
      | UsernameSection   |
      | NewCategoryForm   |
