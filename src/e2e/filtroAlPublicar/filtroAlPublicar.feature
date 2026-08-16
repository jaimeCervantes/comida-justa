Feature: Se publica, se revisa, y lo que no cumple se baja

  Context:
  - Problem: cualquiera con sesión publica en vivo y al instante, y nada mira de qué habla el
    texto. Lo que entra contamina el feed, la búsqueda semántica y lo que el chatbot le contesta a
    alguien que pregunta por su salud. Y hoy no hay forma de bajar nada sin entrar a la base a mano.
  - Savings: quita el riesgo de que nadie vigile el catálogo, y sobre todo evita que una promesa de
    salud peligrosa acabe citada por el bot como si el sitio la respaldara.
  - Why: sin curaduría esto es un tablón de anuncios. Con ella es un catálogo confiable, que es lo
    único que justifica que alguien le pregunte a este sitio qué comer.

  As quien cuida el catálogo de Hazlo Sano
  I want que lo publicado se revise y que lo que no cumple se baje solo
  So that lo que la comunidad lee y lo que el chatbot repite pertenece al bienestar

  Background:
    Given the app is running with PostgreSQL as the database

  # ---------------------------------------------------------------------------
  # Slice 1 — el interruptor: estado, panel y todas las lecturas
  #
  # Sin IA. Es la mitad aburrida y va primero: sin estado no hay dónde poner un
  # veredicto, y sin panel "oculta" es un callejón sin salida.
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario Outline: Lo que no está publicado desaparece de TODAS las lecturas del sitio
    Given the published post "Dona Chocolate Keto" at 35
    When an admin rejects it from "/admin/moderacion"
    Then it is not listed in "<lectura>"

    # Son las nueve familias de consulta que hoy leen `posts`. La tabla existe
    # porque olvidar una es el fallo más probable de este slice.
    Examples: cada superficie que lee publicaciones
      | lectura                              |
      | el feed del inicio                   |
      | la búsqueda por texto                |
      | la búsqueda semántica                |
      | el sitemap                           |
      | el feed RSS                          |
      | la página de detalle                 |
      | la tienda de su vendedor             |
      | el directorio de productores locales |
      | el carrito                           |

  @slice-1
  Scenario: Su autor la sigue viendo, con el aviso
    Given the post "Dona Chocolate Keto" rejected by an admin
    When its owner opens its detail page
    Then the post is shown with a notice saying it is not published
    And a visitor who is not its owner gets a 404

  @slice-1
  Scenario: El chatbot deja de ofrecer un producto rechazado
    Given the published product "Açaí Glow" at 75
    When an admin rejects it
    Then "is_available" is false in the database
    And the chatbot query "kind = 'producto' AND is_available" no longer returns it

  @slice-1
  Scenario: El admin la restituye y vuelve a estar en todo
    Given the post "Dona Chocolate Keto" rejected by an admin
    When this admin approves it from "/admin/moderacion"
    Then it is listed again in the feed, the search and the sitemap
    And its owner no longer sees the notice

  @slice-1
  Scenario: Las 27 publicaciones que ya existen no se caen con la migración
    Given the moderation status migration is applied
    Then every pre-existing post is "published"
    And the home feed shows the same posts as before

  @slice-1
  Scenario: El panel es solo del admin
    Given a signed-in non-admin user
    When this user opens "/admin/moderacion"
    Then the response status is 404
    And no moderation entry is shown in the navigation

  # ---------------------------------------------------------------------------
  # Slice 2 — el clasificador que decide solo
  #
  # El tema válido son los CUATRO PILARES (descanso, alimentación, movimiento,
  # mente-espíritu), no la comida. De las 27 publicaciones reales, 10 son anuncios
  # que no van de comida: un filtro entrenado en "¿esto es comida?" tiraría más de
  # un tercio del catálogo legítimo. Por eso las filas aceptadas de abajo son
  # publicaciones que HOY existen en la base — si el prompt cambia y las rompe,
  # esta tabla lo dice.
  # ---------------------------------------------------------------------------

  @slice-2 @future
  Scenario Outline: Lo que pertenece a los cuatro pilares queda publicado
    Given a signed-in user on "/publicar"
    When this user publishes:
      | title       | <title>       |
      | description | <description> |
      | price       | <price>       |
    And the review runs
    Then the post stays "published"
    And its embedding is generated

    Examples: aceptadas — alimentación (productos reales del catálogo)
      | title                            | description                                                                     | price | pilar     |
      | Dona Chocolate Keto              | Dona horneada sin azúcar añadida, endulzada con monk fruit. Harina de almendra. | 35    | nutrition |
      | Açaí Glow                        | Bowl de açaí con fruta fresca, granola casera y semillas de chía.               | 75    | nutrition |
      | Pechuga de pollo asada en bistec | Pechuga de pollo asada, cortada en bistec, lista para calentar y servir.        | 105   | nutrition |

    Examples: aceptadas — los otros pilares (anuncios reales; el filtro NO es de comida)
      | title                                                       | description                                                                           | price | pilar    |
      | Funciones del Buen Sueño Parte 1                            | Qué repara tu cuerpo mientras duermes y por qué las primeras horas no se recuperan.   | 0     | sleep    |
      | 10 Minutos de Ejercicio al Día Pueden Cambiar tu Vida       | Empieza con diez minutos. Lo que importa no es la intensidad, es que no falte el día. | 0     | movement |
      | ¿A qué hora deberían irse a dormir los niños y adolescentes? | Guía por edades para fijar la hora de dormir sin pelear cada noche.                    | 0     | sleep    |

    Examples: aceptadas — rozan lo médico y aun así pasan (guarda contra falso positivo)
      | title                                                        | description                                                                      | price | razon                                 |
      | Perfil Tiroideo Completo - La Orquesta Hormonal de tu Cuerpo | Qué mide cada valor del perfil tiroideo y cómo leerlo con tu médico.             | 0     | informa, no promete curar             |
      | Suero natural                                                | Suero de agua de coco con limón y sal de mar. Para reponer después de entrenar.  | 35    | "suero" no es promesa de curación     |

  @slice-2 @future
  Scenario Outline: Lo que no cumple se baja, y su autor sabe por qué
    Given a signed-in user on "/publicar"
    When this user publishes:
      | title       | <title>       |
      | description | <description> |
      | price       | <price>       |
    And the review runs
    Then the post becomes "rejected" with reason "<motivo>"
    And it disappears from every listing
    And its owner sees the notice for "<motivo>" in their language
    And no embedding is ever generated for it

    # Ninguna de estas existe en la base: por definición, la basura que se va a
    # frenar todavía no entró. Son inventadas a propósito y cada una nombra el
    # motivo que le toca.
    Examples: rechazadas
      | title                                   | description                                                                         | price | motivo             |
      | Vendo Nissan Tsuru 2015                 | Motor en buen estado, cuatro llantas nuevas, papeles en regla. Facilidades de pago. | 45000 | off_topic          |
      | Rento cuarto amueblado cerca del centro | Cuarto con baño propio, agua y luz incluidas. Se pide depósito de un mes.           | 2500  | off_topic          |
      | Té que cura el cáncer en 21 días        | Fórmula ancestral. Elimina tumores sin quimioterapia. Miles de casos comprobados.   | 890   | health_claim       |
      | Suspende tu metformina con este jugo    | Tres tomas al día y podrás dejar tu medicamento para la diabetes en dos semanas.    | 350   | health_claim       |
      | GANA $5000 AL DÍA DESDE CASA 🔥         | Sistema automatizado, sin experiencia. Escríbeme por WhatsApp y te paso el link.    | 0     | spam               |
      | Cigarros electrónicos sabor mango       | Vapeador desechable, 5000 puffs, varios sabores. Envío a todo el estado.            | 320   | restricted_product |

  # El camino de salida: nadie depende del admin para arreglar su propio error.
  @slice-2 @future
  Scenario: Corregir una publicación rechazada la restituye sola
    Given the post "Vendo Nissan Tsuru 2015" rejected with reason "off_topic"
    When its owner rewrites it as "Dona Chocolate Keto" and saves
    And the review runs
    Then the post becomes "published"
    And it appears in the feed again

  # Sin esto el filtro dura dos clics: publicas algo sano y luego lo editas.
  @slice-2 @future
  Scenario: Editar una publicación viva pasa por el mismo filtro
    Given the published post "Dona Chocolate Keto"
    When its owner edits its title to "Vendo Nissan Tsuru 2015" and saves
    And the review runs
    Then the post becomes "rejected" with reason "off_topic"

  @slice-2 @future
  Scenario: Si Gemini no contesta, queda en revisión y no en vivo a ciegas
    Given a moderation service that throws
    When a user publishes "Dona Chocolate Keto"
    Then the post becomes "in_review"
    And it is listed in "/admin/moderacion"
    And a warning is logged

  # Vitest: es una regla del puerto, no un recorrido de pantalla.
  @slice-2 @future @component
  Scenario Outline: Un motivo fuera de la lista cerrada se trata como no revisado
    Given the model answers with reason "<respuesta>"
    When the verdict is interpreted
    Then the post ends as "<estado>"

    Examples:
      | respuesta          | estado    |
      | off_topic          | rejected  |
      | health_claim       | rejected  |
      | spam               | rejected  |
      | offensive          | rejected  |
      | restricted_product | rejected  |
      | politico           | in_review |
      |                    | in_review |

  # Vitest: el orden importa y no se ve desde la pantalla.
  @slice-2 @future @component
  Scenario: La revisión corre antes que el indexado y la traducción
    Given a post that will be rejected
    When the after-response jobs run
    Then the moderation job runs first
    And neither the embedding nor the translation is ever requested

  # ---------------------------------------------------------------------------
  # Slice 3 (opción) — que la comunidad denuncie
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario: Una denuncia devuelve la publicación a revisión
    Given a published post
    When a visitor reports it
    Then it goes back to "in_review" until an admin decides

  # ---------------------------------------------------------------------------
  # Slice 4 (opción) — el mismo filtro en los comentarios
  # ---------------------------------------------------------------------------

  @slice-4 @future
  Scenario: Un comentario fuera de tema no se guarda
    Given a signed-in user on a post detail page
    When this user comments something off topic
    Then the comment is rejected with the same reasons as a publication
