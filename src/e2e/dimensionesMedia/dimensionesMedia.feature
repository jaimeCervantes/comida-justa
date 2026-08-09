Feature: Las dimensiones de cada archivo

  Context:
  - Problem: `ImageContent` le pasa a `next/image` un `width={1000} height={1000}` fijo, igual para
    todas, así que toda imagen se declara cuadrada sin serlo; y `CardForList` la recorta a `h-64`
    con `object-cover`. `post_media` no guarda las dimensiones: sus columnas son `id, post_id, url,
    type, alt, sort_order`. Medidas las 15 imágenes de la base el 2026-08-08, **10 son verticales**
    (0.75, y una a 0.67) y 5 apaisadas (1.33). A una foto de 1200x1600 en una columna de 300 px le
    tocan 400 px de alto y se enseñan 256: se tira el 36%, y por el centro, que es donde está el
    producto.
  - Savings: que no se recorte un tercio de cada foto. Y la mampostería empieza a tener de dónde:
    una vertical mide 400 px y una apaisada 225 px, 1.8× de diferencia. Hoy las 15 se recortan a la
    misma altura y lo único que varía es el largo del título.
  - Why: lo que se vende entra por la foto. Un pan cortado por la mitad es una publicación peor, y
    hoy le pasa a 10 de 15.

  As a persona que publica lo que hace
  I want to que mi foto se vea entera y con su forma
  So that quien la mira vea el producto y no un recorte de su centro

  @slice-1
  Scenario: Una foto vertical deja de recortarse
    Given una publicación con una imagen de 1200x1600, como nueve de las quince de la base
    When alguien la ve en un listado de columnas de 300 px
    Then su tarjeta la enseña entera, con 400 px de alto
    And no se recorta nada, porque el hueco tiene ya su misma proporción

  @slice-1
  Scenario: En el mismo listado conviven alturas distintas
    Given una publicación con foto vertical (1200x1600) y otra con foto apaisada (1600x1200)
    When las dos salen en el mismo listado
    Then la vertical ocupa casi el doble de alto que la apaisada
    # Que es lo que hace que el listado parezca mampostería y no una rejilla con huecos.

  @slice-1 @component
  Scenario Outline: Qué se declara según lo que se sepa del archivo
    # Vitest sobre `MediaContent`: son combinaciones de props. El caso "sin dimensiones" no es
    # hipotético — son los 8 vídeos, y cualquier imagen que el relleno no consiga medir.
    Given un archivo de tipo "<tipo>" con dimensiones <dimensiones>
    When se pinta en una tarjeta
    Then el hueco queda "<resultado>"

    Examples:
      | tipo   | dimensiones | resultado                                    | razón                                    |
      | image  | 1200x1600   | con la proporción real, sin recorte          | es lo que esta entrega viene a resolver  |
      | image  | 1600x1200   | con la proporción real, sin recorte          | apaisada, mismo trato                    |
      | image  | ninguna     | como hoy: alto fijo de 256 px y recorte      | `NULL` es "no lo sabemos", no "es cuadrada" |
      | video  | ninguna     | como hoy: 16:9                               | medir un vídeo pide `ffprobe`            |

  @slice-1 @component
  Scenario Outline: Una dimensión a medias no se usa a medias
    # Guardar solo una de las dos no da proporción, y usarla produciría un hueco peor que el de hoy.
    Given una imagen con ancho <ancho> y alto <alto>
    When se decide su hueco
    Then <resultado>

    Examples:
      | ancho | alto | resultado                          |
      | 1200  | 1600 | se usa la proporción real          |
      | 1200  |      | se cae al comportamiento de hoy    |
      |       | 1600 | se cae al comportamiento de hoy    |
      | 0     | 1600 | se cae al comportamiento de hoy    |

  @slice-1
  Scenario: Lo que el backend de Python lee no cambia
    Given que `post_media` la leen tres repositorios con SQL crudo y columnas nombradas
    When se añaden `width` y `height` nulables
    Then ninguna consulta existente se entera

  # Se mide en el navegador y no en el servidor porque **subir es el único momento en que el
  # archivo está en la mano**: a la Server Action le llega solo una URL, y medirla la obligaría a
  # descargar lo que el navegador acaba de subir.
  @slice-2
  Scenario: Lo que se publica desde ahora llega ya medido
    Given que subo una imagen desde "/publicar"
    When se guarda la publicación
    Then su fila de `post_media` queda con las dimensiones reales del archivo
    And su tarjeta la enseña con esa forma, sin recortar

  @slice-2 @component
  Scenario Outline: Qué se manda según lo que el navegador consiga leer
    # Vitest sobre `readImageSize`: el navegador se sustituye por dobles. Publicar NO puede fallar
    # porque una medición no salga, así que ningún caso lanza.
    Given un archivo "<caso>"
    When se mide antes de subirlo
    Then se manda "<resultado>"

    Examples:
      | caso                            | resultado              | razón                                        |
      | una imagen de 1200x1600         | 1200x1600              | es para lo que existe                        |
      | un vídeo                        | nada, y ni se intenta  | hoy se pintan a 16:9; medirlos sería muerto  |
      | una imagen que no se decodifica | nada                   | «no lo sabemos» es válido en la base         |
      | una imagen que mide 0x0         | nada                   | un cero no es una medida                     |
