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
    Y que tengo una sucursal con ubicación en el mapa
    Cuando abro "/cuenta"
    Entonces la lista de pendientes de la cuenta no está en la página
    Y la cabecera de la cuenta sigue mostrando mis dos direcciones públicas

  # ------------------------------------------------------------------ slice 2

  @slice-2 @future
  Escenario: La lista de sucursales y su alta viven en el mismo bloque
    Dado que tengo una sucursal
    Cuando abro "/cuenta"
    Entonces la sucursal y el botón para agregar otra están en la misma tarjeta

  @slice-2 @future
  Escenario: Con sucursales, el formulario de alta arranca plegado
    Dado que tengo una sucursal
    Cuando abro "/cuenta"
    Entonces los campos del alta no están visibles hasta que pido agregar otra

  @slice-2 @future
  Escenario: Cada sucursal dice si el mapa la puede encontrar
    Dado que tengo una sucursal sin ubicación
    Cuando abro "/cuenta"
    Entonces esa sucursal avisa que sin ubicación no aparece en las búsquedas por cercanía

  @slice-2 @future
  Escenario: El enlace al mapa se lee en el idioma de quien mira
    Cuando un visitante inglés abre la tienda
    Entonces el enlace al mapa de la sucursal no está en español

  # ------------------------------------------------------------------ slice 3

  @slice-3 @future
  Escenario: La ficha enseña el logo que la tienda ya tiene
    Cuando abro "/cuenta"
    Entonces la ficha muestra el logo guardado antes de que suba uno nuevo

  @slice-3 @future
  Escenario: La agenda se ofrece una sola vez
    Cuando abro "/cuenta"
    Entonces "Mi agenda" aparece solo en el menú de la sección

  # ------------------------------------------------------------------ slice 4

  @slice-4 @future
  Escenario: Sin tienda, la cuenta pide una sola cosa
    Dado que entro sin tienda abierta
    Cuando abro "/cuenta"
    Entonces abrir la tienda es la acción principal y no hay ningún botón que me saque del sitio
