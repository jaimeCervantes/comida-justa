# language: es
@cuenta
Característica: La cuenta se configura sola

  Contexto:
  - Problema: quien abre /cuenta ve cinco tarjetas del mismo peso visual. No sabe cuál es su tienda
    de un vistazo, qué ya configuró, ni qué le falta para que sus clientes la encuentren.
  - Ahorro: menos altas abandonadas a medias y menos tiendas sin logo ni ubicación, que son las que
    el chatbot no puede recomendar por cercanía.
  - Por qué: una tienda a medio configurar no aparece en las búsquedas con ubicación, así que el
    catálogo pierde oferta real aunque el vendedor ya se haya dado de alta.

  Como vendedor de la comunidad
  Quiero abrir "Mi cuenta" y ver qué es mi tienda y qué me falta
  Para terminar de configurarla sin adivinar dónde está cada cosa

  Antecedentes:
    Dado que entro con mi sesión
    Y que tengo abierta la tienda "Panadería La Luz" en "/tienda/panaderia-la-luz"

  # ------------------------------------------------------------------ slice 1

  @slice-1
  Escenario: La cabecera dice cuál es mi tienda y dónde vive
    Cuando abro "/cuenta"
    Entonces la cabecera de la cuenta muestra "Panadería La Luz" como único título principal
    Y muestra el camino corto "/tienda/panaderia-la-luz" con su botón de compartir
    Y ese camino se abre en una pestaña nueva

  @slice-1
  Escenario: Mi dirección personal vive en la misma cabecera que la de mi tienda
    Dado que reservé la dirección personal "jaime-cervantes"
    Cuando abro "/cuenta"
    Entonces la cabecera de la cuenta muestra el camino corto "/u/jaime-cervantes" con su botón de compartir
    Y "/u/jaime-cervantes" aparece una sola vez en toda la página
    Y "/tienda/panaderia-la-luz" aparece una sola vez en toda la página

  @slice-1 @component
  # Vitest y no Playwright: es una regla de pintado sobre una tienda sin logo, y montar el
  # componente cuesta un render en vez de un alta completa contra la base compartida.
  Escenario: Sin logo, la cabecera enseña la inicial y no una imagen rota
    Dado que mi tienda "Panadería La Luz" no tiene logo
    Cuando se pinta la cabecera de la cuenta
    Entonces se lee la inicial "P" en el lugar del logo
    Y no hay ninguna etiqueta de imagen en la cabecera

  @slice-1
  Escenario: La lista de pendientes me dice qué me falta y a dónde ir
    Dado que mi tienda no tiene logo
    Y que no reservé mi dirección personal
    Cuando abro "/cuenta"
    Entonces la lista de pendientes de la cuenta está visible
    Y el paso "Abre tu tienda" aparece cumplido y sin enlace
    Y el paso "Sube el logo de tu tienda" aparece pendiente y con enlace

  @slice-1 @component
  # La regla de qué falta es una función pura del dominio; la tabla es su corrida de escritorio.
  Esquema del escenario: Un paso está cumplido cuando el dato que promete ya existe
    Dado un retrato de cuenta con "<dato>" en "<valor>"
    Cuando se calcula la lista de pendientes
    Entonces el paso "<paso>" está "<estado>"

    Ejemplos: cumplidos
      | dato               | valor                          | paso            | estado    |
      | tienda             | Panadería La Luz               | store           | cumplido  |
      | dirección personal | jaime-cervantes                | username        | cumplido  |
      | logo               | https://cdn.test/logo.webp     | logo            | cumplido  |
      | descripción        | Pan de masa madre cada mañana  | description     | cumplido  |
      | sucursal ubicada   | 18.6013,-96.7089               | branchLocation  | cumplido  |

    # La fila de `0,0` es una defensa, no un caso que se pueda producir: `branches.location` es
    # NOT NULL y el alta rechaza las coordenadas inválidas, así que en la práctica este paso
    # equivale a «tiene al menos una sucursal». Se conserva porque la regla del dominio la afirma
    # y cuesta un microsegundo, no porque describa algo que pase.
    Ejemplos: pendientes — lo vacío y lo que solo parece un dato
      | dato               | valor                          | paso            | estado    |
      | tienda             |                                | store           | pendiente |
      | dirección personal |                                | username        | pendiente |
      | logo               |                                | logo            | pendiente |
      | descripción        |                                | description     | pendiente |
      | descripción        | (solo espacios)                | description     | pendiente |
      | sucursal ubicada   | 0,0                            | branchLocation  | pendiente |

  @slice-1 @component
  Esquema del escenario: El avance se cuenta sobre los cinco pasos, siempre en el mismo orden
    Dado un retrato de cuenta con "<cumplidos>" pasos cumplidos
    Cuando se calcula el avance
    Entonces se lee "<avance>"
    Y la lista "<visibilidad>"

    Ejemplos:
      | cumplidos | avance | visibilidad |
      | 0         | 0 de 5 | se pinta    |
      | 3         | 3 de 5 | se pinta    |
      | 5         | 5 de 5 | no se pinta |

  @slice-1
  Escenario: Con todo configurado, la lista de pendientes desaparece
    Dado que mi tienda tiene logo y descripción
    Y que reservé mi dirección personal
    Y que tengo una sucursal
    Cuando abro "/cuenta"
    Entonces la lista de pendientes de la cuenta no está en la página
    Y la cabecera de la cuenta sigue mostrando mis dos direcciones públicas

  # ------------------------------------------------------------------ slice 2

  @slice-2
  Escenario: La lista de sucursales y su alta viven en el mismo bloque
    Dado que tengo la sucursal "Sucursal Centro"
    Cuando abro "/cuenta"
    Entonces "Sucursal Centro" y el botón "Agregar otra sucursal" están en la misma tarjeta
    Y "Agrega una sucursal" ya no es un bloque aparte de la página

  @slice-2
  Escenario: Con sucursales, el alta arranca plegada
    Dado que tengo la sucursal "Sucursal Centro"
    Cuando abro "/cuenta"
    Entonces el campo "Nombre de la sucursal" no está visible
    Y al pulsar "Agregar otra sucursal" el campo "Nombre de la sucursal" queda visible

  # Sin ninguna sucursal, plegar el alta escondería la única acción de la tarjeta detrás de un
  # clic de más: quien no tiene ninguna viene justamente a dar de alta la primera.
  @slice-2
  Escenario: Sin ninguna sucursal, el alta arranca desplegada
    Dado que no tengo ninguna sucursal
    Cuando abro "/cuenta"
    Entonces el campo "Nombre de la sucursal" está visible

  # ------------------------------------------------------------------------------------------
  # RETIRADO — «Cada sucursal dice si el mapa la puede encontrar»
  #
  # El roadmap prometía avisar en las sucursales sin ubicación. Ese estado NO EXISTE:
  # `branches.location` es NOT NULL y `AddBranchUseCase` rechaza el alta sin coordenadas
  # («sin coordenadas no hay sucursal»). Lo destapó la semilla del propio escenario, que reventó
  # contra la restricción. Un escenario de algo imposible pasa siempre y no describe nada, así que
  # se retira en vez de adaptarse. Se deja escrito para que nadie vuelva a proponerlo.
  # ------------------------------------------------------------------------------------------

  @slice-2 @component
  # Vitest y no Playwright: es la traducción de un rótulo, y montar la lista cuesta un render en
  # vez de un alta completa contra la base compartida.
  Esquema del escenario: El enlace al mapa se lee en el idioma de quien mira
    Dado una sucursal con enlace de Google Maps
    Cuando se pinta la lista en "<locale>"
    Entonces el enlace al mapa dice "<etiqueta>"

    Ejemplos:
      | locale | etiqueta        |
      | es     | Ver en el mapa  |
      | en     | See it on the map |

  # ------------------------------------------------------------------ slice 3

  @slice-3 @component
  # Vitest: son reglas de pintado de un formulario. Montarlo cuesta un render, y lo que de verdad
  # hace la ficha —guardar contra la base— ya lo cubre `storeProfile.spec.ts`.
  Escenario: La ficha agrupa sus campos por sentido, no en una lista larga
    Cuando se pinta la ficha de la tienda
    Entonces sus campos están repartidos en los grupos "Identidad", "Contacto" y "Imagen"
    Y cada grupo se anuncia con su nombre

  @slice-3 @component
  Esquema del escenario: Cada campo vive en el grupo que le toca
    Cuando se pinta la ficha de la tienda
    Entonces el campo "<campo>" está dentro del grupo "<grupo>"

    Ejemplos:
      | campo                 | grupo     |
      | Nombre de tu tienda   | Identidad |
      | ¿Qué vendes?          | Identidad |
      | Teléfono de contacto  | Contacto  |
      | Sitio web             | Contacto  |

  @slice-3 @component
  Escenario: La ficha enseña el logo que la tienda ya tiene
    Dado que mi tienda "Panadería La Luz" ya tiene logo guardado
    Cuando se pinta la ficha de la tienda
    Entonces se ve ese logo antes de que suba ninguno nuevo

  @slice-3 @component
  Escenario: Sin logo guardado, el hueco lo llena la inicial y no una imagen rota
    Dado que mi tienda "Panadería La Luz" no tiene logo
    Cuando se pinta la ficha de la tienda
    Entonces se lee la inicial "P" en el lugar del logo

  @slice-3 @component
  Esquema del escenario: Guardar bien y guardar mal usan el mismo aviso del sistema
    Dado que la ficha vuelve con "<resultado>"
    Cuando se pinta
    Entonces el aviso tiene rol "<rol>" y lleva su etiqueta de tono escrita

    Ejemplos:
      | resultado | rol    |
      | guardada  | status |
      | rechazada | alert  |

  @slice-3 @component
  # Estaba en duro dentro de `ImageVideoUploader`: quien subiera un logo en inglés leía
  # «⏳ Subiendo...» en medio de su idioma.
  Escenario: El progreso de la subida se lee en el idioma de quien mira
    Cuando se pinta la ficha de la tienda en "en"
    Entonces el selector de logo no ofrece ningún texto en español

  # ------------------------------------------------------------------ slice 4

  @slice-4 @future
  Escenario: Sin tienda, la cuenta pide una sola cosa
    Dado que entro sin tienda abierta
    Cuando abro "/cuenta"
    Entonces abrir la tienda es la acción principal y no hay ningún botón que me saque del sitio
