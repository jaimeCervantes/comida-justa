Feature: Una publicacion lleva varias imagenes y videos

  # Los escenarios de este archivo se reparten en dos specs porque preparan el estado de dos maneras
  # distintas y mezclarlas haria que un fallo de lectura pareciera uno de subida:
  #   - multimediaMultiple.spec.ts  (@slice-1) publica desde la UI y comprueba lo que llega a la base.
  #   - galeriaDeMedia.spec.ts      (@slice-2) siembra por el repositorio y comprueba lo que se ve.

  Context:
  - Problem: quien publica un producto tiene varias fotos —el frente, la etiqueta, el interior— y hoy
    el formulario solo guarda una: cada subida pisa la anterior. Sube la que mejor se ve y descarta
    el resto, asi que quien compra decide sin ver lo que dice la etiqueta ni el tamano real.
  - Savings: se ahorran las publicaciones duplicadas del mismo producto que hoy existen solo para
    colar la segunda foto, y las preguntas por WhatsApp que esa foto habria contestado.
  - Why: el catalogo es el escaparate de la comunidad. Una ficha que ensena el producto desde tres
    angulos vende; una que ensena uno pide confianza. La base ya guardaba varios archivos por
    publicacion desde el primer dia —`post_media` ordena por `sort_order`— y las 23 publicaciones
    que hay tienen exactamente uno.

  As a persona que publica un producto en Hazlo Sano
  I want subir varias imagenes y videos a la misma publicacion
  So that quien la mira vea el producto entero antes de preguntar

  Background:
    Given la aplicacion corriendo con PostgreSQL

  # ---------------------------------------------------------------------------
  # Slice 1 - Publicar varios archivos
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario: Tres archivos elegidos de una vez llegan a la publicacion en el orden en que se subieron
    Given una persona con sesion iniciada en "/publicar"
    When llena el formulario con:
      | title       | Crema de cacahuate artesanal                                                        |
      | description | Cacahuate organico molido, sin azucar anadida. Ideal para el desayuno o pre-entreno. |
      | price       | 120                                                                                 |
      | phone       | 2781092116                                                                          |
    And elige de una vez los archivos "post.jpg, post-2.jpg, post-3.jpg"
    Then la bandeja muestra 3 archivos numerados 1, 2 y 3
    And el contador dice "3 de 10"
    When envia el formulario
    Then la publicacion guarda en post_media:
      | sort_order | type  | archivo    |
      | 0          | image | post.jpg   |
      | 1          | image | post-2.jpg |
      | 2          | image | post-3.jpg |

  @slice-1
  Scenario: Volver a elegir anade a la bandeja en vez de reemplazar
    Given una persona con sesion iniciada en "/publicar"
    When elige el archivo "post.jpg"
    Then la bandeja muestra 1 archivo
    When vuelve a abrir el selector y elige "post-2.jpg"
    Then la bandeja muestra 2 archivos
    And el primero sigue siendo "post.jpg"

  @slice-1
  Scenario: Quitar un archivo de la bandeja renumera los que quedan
    Given una persona con sesion iniciada en "/publicar" con "post.jpg, post-2.jpg, post-3.jpg" en la bandeja
    When quita el archivo de la posicion 2
    Then la bandeja muestra 2 archivos numerados 1 y 2
    And el contador dice "2 de 10"
    When envia el formulario con el resto de campos llenos
    Then la publicacion guarda en post_media:
      | sort_order | archivo    |
      | 0          | post.jpg   |
      | 1          | post-3.jpg |

  @slice-1
  Scenario: Una imagen y un video conviven en la misma publicacion
    Given una persona con sesion iniciada en "/publicar"
    When elige de una vez los archivos "post.jpg, post.mp4"
    And envia el formulario con el resto de campos llenos
    Then la publicacion guarda en post_media:
      | sort_order | type  |
      | 0          | image |
      | 1          | video |

  @slice-1
  Scenario: Publicar con un solo archivo se comporta igual que antes
    Given una persona con sesion iniciada en "/publicar"
    When llena el formulario con un solo archivo "post.jpg"
    And envia el formulario
    Then la publicacion se guarda con 1 fila en post_media con sort_order 0
    And la ficha muestra ese archivo sin flechas ni miniaturas ni contador

  @slice-1 @component
  # Vitest y no Playwright: es la aritmetica del tope, no un recorrido. Llevar el navegador a 12
  # archivos reales solo para comprobar un recorte cuesta minutos y no anade certeza.
  Scenario Outline: El tope de 10 recorta la seleccion en vez de fallar
    Given la bandeja con <ya> archivos
    When se eligen <elegidos> archivos mas
    Then la bandeja termina con <total> archivos
    And el selector queda <estado>

    Examples: aceptados — cabe todo lo que se eligio
      | ya | elegidos | total | estado       | reason                                  |
      | 0  | 1        | 1     | habilitado   | el caso de siempre, un solo archivo     |
      | 0  | 3        | 3     | habilitado   | la seleccion multiple normal            |
      | 7  | 3        | 10    | deshabilitado | justo el tope, ni recorta ni rechaza   |

    Examples: recortados — se eligio mas de lo que cabe
      | ya | elegidos | total | estado        | reason                                 |
      | 0  | 12       | 10    | deshabilitado | de doce solo entran los diez primeros  |
      | 8  | 5        | 10    | deshabilitado | quedaban dos huecos, se toman dos      |
      | 10 | 1        | 10    | deshabilitado | sin huecos no entra nada               |

  @slice-1 @component
  # El dominio, no el navegador: `parsePostMediaPayload` es TS puro y esta es su corrida de escritorio.
  Scenario Outline: El payload del formulario se convierte en filas de post_media
    Given el campo oculto "media" con <payload>
    When la Server Action lo interpreta
    Then produce <filas> archivos
    And el primero tiene type "<type>"

    Examples: formas aceptadas
      | payload                                    | filas | type  | reason                                     |
      | un array de 3 objetos con url              | 3     | image | el caso nuevo                              |
      | un objeto unico con url                    | 1     | image | compatibilidad con lo publicado hasta hoy  |
      | un array de 3 donde uno no trae url        | 2     | image | lo incompleto se descarta, no rompe        |
      | un array con MIME "video/mp4"              | 1     | video | el MIME se reduce a su categoria           |
      | un array de 12 objetos                     | 10    | image | el tope tambien vive en el servidor        |

    Examples: formas rechazadas
      | payload         | filas | type | reason                                        |
      | texto no-JSON   | 0     |      | un payload roto deja la publicacion sin media |
      | un array vacio  | 0     |      | nada que guardar                              |

  # ---------------------------------------------------------------------------
  # Slice 2 - Verlos en la ficha y saber cuantos hay en la tarjeta
  # ---------------------------------------------------------------------------

  @slice-2
  Scenario: La ficha de una publicacion con tres archivos los recorre
    Given una publicacion "Crema de cacahuate artesanal" con 3 archivos
    When un visitante abre su ficha
    Then ve el primer archivo en grande
    And ve 3 miniaturas
    And el contador dice "1 / 3"
    When activa "siguiente"
    Then ve el segundo archivo en grande
    And el contador dice "2 / 3"
    When activa la tercera miniatura
    Then ve el tercer archivo en grande
    And el contador dice "3 / 3"

  @slice-2
  Scenario: Una ficha con un solo archivo se ve como siempre
    Given una publicacion con 1 archivo
    When un visitante abre su ficha
    Then ve el archivo en grande
    And no ve flechas, ni miniaturas, ni contador

  @slice-2 @component
  # Vitest: es el marcado de la insignia sobre una tarjeta ya renderizada, no una navegacion.
  Scenario Outline: La tarjeta del listado dice cuantos archivos hay
    Given una tarjeta de una publicacion con <archivos> archivos
    When se inspecciona su portada
    Then la portada es el archivo de sort_order 0
    And <insignia>

    Examples:
      | archivos | insignia                        | reason                                  |
      | 1        | no lleva insignia               | lo de siempre no se anuncia             |
      | 4        | la insignia dice 4              | avisa de que hay mas sin abrir la ficha |

  @slice-2 @component
  # El `alt` sale de la traduccion, no de la columna: esto se lee en el marcado del componente.
  Scenario: Cada archivo tiene un texto alternativo distinguible
    Given una publicacion "Crema de cacahuate artesanal" con 3 imagenes
    When se inspecciona la galeria
    Then el primer archivo se anuncia con el titulo de la publicacion
    And el segundo y el tercero anaden su posicion al titulo

  @slice-2 @component
  Scenario: Compartir sigue eligiendo la primera imagen aunque el primer archivo sea un video
    Given una publicacion cuyo sort_order 0 es un video y cuyo sort_order 1 es una imagen
    When se calcula su vista previa para compartir
    Then el og:image es la imagen de sort_order 1
    And el og:video es el video de sort_order 0

  # ---------------------------------------------------------------------------
  # Slice 3 - Editar la media de una publicacion
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario: Quien edita su publicacion puede quitar un archivo
    Given la duena de una publicacion con 3 archivos en su formulario de edicion
    When quita uno y guarda
    Then la publicacion queda con 2 archivos

  @slice-3 @future
  Scenario: Quien edita su publicacion puede anadir un archivo
    Given la duena de una publicacion con 2 archivos en su formulario de edicion
    When anade uno y guarda
    Then la publicacion queda con 3 archivos y el nuevo va al final

  @slice-3 @future
  Scenario: Cambiar la portada cambia lo que ven el listado, el carrito y el bot
    Given la duena de una publicacion con 3 archivos
    When mueve el tercero a la primera posicion y guarda
    Then ese archivo pasa a sort_order 0
    And la tarjeta del listado lo ensena como portada
