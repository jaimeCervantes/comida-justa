Feature: Una publicacion lleva varias imagenes y videos

  # Los escenarios de este archivo se reparten en dos specs porque preparan el estado de dos maneras
  # distintas y mezclarlas haria que un fallo de lectura pareciera uno de subida:
  #   - multimediaMultiple.spec.ts  (@slice-1) publica desde la UI y comprueba lo que llega a la base.
  #   - galeriaDeMedia.spec.ts      (@slice-2) siembra por el repositorio y comprueba lo que se ve.
  #   - editarMedia.spec.ts         (@slice-3) siembra, edita desde la UI y vuelve a mirar la base.

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

  # Los escenarios de este slice viven en editarMedia.spec.ts. Siembran por el repositorio —lo que
  # se prueba es la EDICION, no la subida— y comprueban `post_media` en la base, porque el orden es
  # lo que leen la tarjeta, el carrito y el bot con `ORDER BY sort_order LIMIT 1`.
  #
  # Los archivos sembrados se distinguen por su direccion: `seed-0.jpg`, `seed-1.jpg`, `seed-2.jpg`
  # (ver `testUtils/seedPost.ts`). Sin eso, "quito el de en medio" no se puede afirmar: tres filas
  # indistinguibles pasarian la prueba aunque se hubiera borrado la equivocada.

  @slice-3
  Scenario: Quitar el archivo de en medio deja a los otros dos en su orden
    Given la duena de "Crema de cacahuate artesanal" con 3 archivos abre su edicion
    Then la bandeja muestra 3 archivos y el contador dice "3 de 10"
    When quita el archivo de la posicion 2 y guarda
    Then la publicacion queda con:
      | sort_order | archivo    |
      | 0          | seed-0.jpg |
      | 1          | seed-2.jpg |

  @slice-3
  Scenario: El archivo anadido se va al final, detras de los que ya estaban
    Given la duena de "Tonico de jengibre y curcuma" con 2 archivos abre su edicion
    When anade "post.jpg" y guarda
    Then la publicacion queda con 3 archivos
    And los dos que ya estaban conservan sort_order 0 y 1
    And el anadido queda en sort_order 2

  @slice-3
  Scenario: Mover el tercero hasta la portada cambia lo que ven el listado, el carrito y el bot
    Given la duena de "Ensalada griega con queso feta" con 3 archivos abre su edicion
    When mueve el archivo de la posicion 3 hasta la primera y guarda
    Then la publicacion queda con:
      | sort_order | archivo    |
      | 0          | seed-2.jpg |
      | 1          | seed-0.jpg |
      | 2          | seed-1.jpg |
    And la tarjeta del listado ensena "seed-2.jpg" como portada

  @slice-3 @component
  # Reordenar es de la BANDEJA, no de la pantalla: el mismo componente lo pintan publicar y editar,
  # asi que probarlo dos veces contra un navegador seria pagar dos minutos por la misma certeza. La
  # e2e de arriba comprueba que lo reordenado llega a `post_media`; esta, la aritmetica del orden.
  Scenario Outline: Mover un archivo lo desplaza un puesto y arrastra al que estaba ahi
    Given una bandeja con "A, B, C"
    When se mueve el archivo de la posicion <posicion> <hacia>
    Then la bandeja queda "<resultado>"

    Examples: moviendo hacia la portada
      | posicion | hacia  | resultado | reason                                        |
      | 3        | antes  | A, C, B   | un puesto, no hasta el principio              |
      | 2        | antes  | B, A, C   | el segundo pasa a portada de un solo toque    |

    Examples: moviendo hacia el final
      | posicion | hacia   | resultado | reason                                       |
      | 1        | despues | B, A, C   | quitar la portada es mover el primero        |
      | 2        | despues | A, C, B   | y el de en medio baja un puesto              |

  @slice-3 @component
  Scenario: A los extremos no se les ofrece salir del borde
    Given una bandeja con "A, B, C"
    Then el primero no ofrece moverse antes
    And el ultimo no ofrece moverse despues

  @slice-3
  # No estaba en el roadmap y es la unica regla nueva del slice: hasta ahora ningun camino podia
  # dejar una publicacion sin archivos, asi que nadie tuvo que prohibirlo. Quitar el ultimo si
  # podria, y una publicacion sin media no se pinta —lo dice el limite conocido de `globalSetup`—,
  # o sea que el fallo no se veria al guardar sino al abrir la ficha.
  Scenario: Quitar el ultimo archivo no deja la publicacion sin ninguno
    Given la duena de "Guia como leer etiquetas" con 1 archivo abre su edicion
    When quita el unico archivo e intenta guardar
    Then no se guarda, se explica que hace falta al menos un archivo
    And la publicacion conserva el archivo que tenia

  # ---------------------------------------------------------------------------
  # Slice 4 - Verla en grande y arrastrarla de sitio
  # ---------------------------------------------------------------------------

  # Todo este slice va en `@component`, y conviene decir por que antes de que alguien lo tome por
  # pereza. Las tres piezas —abrir en grande, arrastrar, el tamano de la miniatura— son estado de
  # cliente de `PostMediaTray`, el mismo componente que ya pintan publicar y editar: no hay ida y
  # vuelta al servidor que observar, y lo unico que acaba en `post_media` es el orden, que la e2e del
  # slice 3 ya comprueba a traves de las flechas.
  #
  # El arrastre ademas se prueba mal en un navegador: el arrastrar y soltar de HTML5 no se simula con
  # un `dragTo`, sino con una secuencia de raton que no dispara los mismos eventos, asi que un
  # escenario verde ahi no diria que la funcion sirve.

  @slice-4 @component
  Scenario: Tocar una miniatura la abre en grande
    Given una bandeja con 3 archivos
    When se toca la miniatura del archivo 2
    Then se abre la vista grande de ese archivo
    And el foco queda dentro de ella

  @slice-4 @component
  Scenario Outline: La vista grande se cierra por donde uno espera
    Given la vista grande del archivo 2 abierta
    When <accion>
    Then se cierra y el foco vuelve a la miniatura del archivo 2

    Examples:
      | accion                    | reason                                         |
      | se pulsa Escape           | es lo primero que prueba quien usa teclado     |
      | se toca el boton de cerrar| es lo primero que busca quien usa raton        |
      | se toca fuera de la vista | el fondo oscuro se lee como "toca aqui y sale" |

  @slice-4 @component
  Scenario: Un video se abre como video y no como una imagen rota
    Given una bandeja con un archivo "video/mp4"
    When se abre su vista grande
    Then se pinta un video con sus controles

  @slice-4 @component
  Scenario Outline: Arrastrar un archivo lo lleva al sitio donde se suelta
    Given una bandeja con "A, B, C"
    When se arrastra el archivo de la posicion <desde> hasta la <hasta>
    Then la bandeja queda "<resultado>"

    Examples: el caso que motivo el slice
      | desde | hasta | resultado | reason                                              |
      | 3     | 1     | C, A, B   | llevar el ultimo a portada, que con flechas son 2   |
      | 1     | 3     | B, C, A   | y el de vuelta, que es el mismo camino al reves     |

    Examples: los que no mueven nada
      | desde | hasta | resultado | reason                                              |
      | 2     | 2     | A, B, C   | soltar un archivo sobre si mismo no es un cambio    |

  @slice-4 @component
  Scenario: Las flechas siguen estando para quien no puede arrastrar
    Given una bandeja con "A, B, C"
    Then el archivo 2 sigue ofreciendo moverse antes y despues

  # ---------------------------------------------------------------------------
  # Slice 5 - Arrastrar tambien con el dedo  (actual)
  #
  # El slice 4 dio por buena una funcion que solo servia con raton. `draggable` + `dragstart` es una
  # API de escritorio: ningun navegador movil la emite para un dedo. Se midio en Chromium de verdad
  # —con raton reordena en publicar y en editar; con el dedo, por CDP y en un viewport de telefono,
  # no ocurria nada— mientras la pista de la pantalla se lo prometia a todo el mundo.
  #
  # Y se midio tarde por como estaba probado: el `@component` del slice 4 disparaba `dragStart` a
  # mano en jsdom, donde SIEMPRE funciona, y su propio comentario descartaba llevarlo al navegador.
  # Una prueba que no puede fallar no es una prueba. Los eventos de puntero, ademas de servir para
  # las dos entradas, los conduce Playwright — asi que este slice si deja una e2e.
  # ---------------------------------------------------------------------------

  @slice-5
  # La unica del arrastre que va al navegador, y va con el DEDO: es la entrada que estaba rota y la
  # que ninguna prueba de jsdom puede afirmar. Ademas comprueba `post_media`, porque lo que importa
  # del orden es la fila que leen la tarjeta, el carrito y el bot.
  Scenario: Desde el telefono, sostener una foto y arrastrarla hasta la portada la deja de portada
    Given la duena de "Ensalada griega con queso feta" con 3 archivos abre su edicion en un telefono
    When sostiene el archivo de la posicion 3 y lo arrastra hasta la primera
    Then la bandeja queda "seed-2.jpg, seed-0.jpg, seed-1.jpg"
    When guarda
    Then la publicacion queda con:
      | sort_order | archivo    |
      | 0          | seed-2.jpg |
      | 1          | seed-0.jpg |
      | 2          | seed-1.jpg |

  @slice-5 @component
  Scenario Outline: Cada entrada empieza el arrastre cuando le toca
    Given una bandeja con "A, B, C"
    When se aprieta el archivo 3 con "<entrada>" y <gesto>
    Then la bandeja queda "<resultado>"

    Examples: raton — apretar y mover ya es arrastrar
      | entrada | gesto                          | resultado | reason                                    |
      | raton   | se mueve hasta el primero      | C, A, B   | no hay ambiguedad: no hay nada que desplazar |

    Examples: dedo — primero hay que sostener
      | entrada | gesto                                    | resultado | reason                                        |
      | dedo    | se sostiene y luego se mueve al primero  | C, A, B   | el gesto de reordenar de cualquier telefono   |
      | dedo    | se desliza sin sostener                  | A, B, C   | eso es bajar por el formulario, no ordenar    |

  @slice-5 @component
  Scenario Outline: Soltar donde no hay nada no reordena
    Given una bandeja con "A, B, C"
    When se arrastra el archivo de la posicion <desde> y se suelta <donde>
    Then la bandeja queda "A, B, C"

    Examples:
      | desde | donde                | reason                                          |
      | 2     | sobre si mismo       | soltar donde estaba no es un cambio             |
      | 3     | fuera de la bandeja  | arrepentirse no puede reordenar nada            |

  @slice-5 @component
  Scenario: Un toque corto sigue abriendo la vista grande
    Given una bandeja con 3 archivos en un telefono
    When se toca la miniatura del archivo 2 sin sostenerla
    Then se abre su vista grande
    And no se ha movido ningun archivo de sitio

  @slice-5 @component
  # El navegador emite `click` al final de un arrastre igual que al final de un toque. Sin
  # descartarlo, soltar una miniatura encima de otra reordenaba Y abria la vista grande encima,
  # tapando el resultado que la persona acababa de conseguir.
  Scenario: Soltar una miniatura no abre ademas su vista grande
    Given una bandeja con "A, B, C"
    When se arrastra el archivo 3 hasta el primero y se suelta
    Then la bandeja queda "C, A, B"
    And no se abre ninguna vista grande

  @slice-5 @component
  # Las flechas viven DENTRO de la fila que se arrastra. Sostener el dedo sobre una —lo que hace
  # quien no esta seguro de haberla tocado— tiene que seguir siendo tocar la flecha.
  Scenario: Sostener el dedo sobre una flecha no levanta la miniatura
    Given una bandeja con "A, B, C" en un telefono
    When se sostiene el dedo sobre la flecha "antes" del archivo 3 y se arrastra
    Then no se levanta ninguna miniatura
    And la bandeja queda "A, B, C"

  @slice-5 @component
  Scenario: La pista nombra el gesto que no se adivina
    Given una bandeja con mas de un archivo
    Then dice "Manten pulsada una miniatura y arrastrala para cambiar el orden, o usa las flechas."
    And las flechas siguen siendo el camino con teclado y con lector de pantalla
