Feature: Compartir la tienda y el perfil, y llegar a ellos desde el avatar

  Context:
  - Problem: `/cuenta` pinta la dirección pública como texto enlazado y nada más
    (`StoreCard.tsx:25-30`, `UsernameSection.tsx:41-48`). Llevarla a WhatsApp obliga a seleccionarla
    sobre un enlace —que al arrastrar navega—, copiarla, cambiar de aplicación y pegarla. En el
    repositorio no existe ningún botón de compartir. Y desde el avatar del encabezado
    (`UserMenu.tsx:62-84`) no se puede llegar ni a la tienda ni al perfil propios: hay que entrar a
    `/cuenta` y buscar el enlace entre los formularios.
  - Savings: compartir pasa de cinco pasos manuales a un clic. En móvil, la hoja nativa del sistema
    ofrece Instagram, TikTok y Messenger, que es la ÚNICA vía posible para esas dos: ninguna tiene
    URL de compartir web. Y el atajo del avatar quita dos navegaciones cada vez que el vendedor
    quiere verse como lo ven sus clientes.
  - Why: una tienda solo sirve si circula. La dirección estable ya existe desde
    `vendedores-y-tiendas.md`; lo que falta es que salga de la pantalla. Si compartir cuesta, no se
    comparte, y el catálogo de la comunidad no llega a nadie.

  As a vendedora con tienda y dirección personal
  I want to repartir mis direcciones desde donde ya las veo, y volver a ellas desde mi avatar
  So that mis clientes lleguen a mi catálogo sin que yo copie y pegue nada

  # Los datos salen de la base (2026-08-08): un solo usuario tiene las dos cosas —"Jaime Cervantes",
  # con perfil `/u/jaime-cervantes` y tienda `Hazlo Sano` en `/tienda/hazlo-sano`, ambos del usuario
  # `44pZIIJ5w1vSYkDQ6gfb`—. Los escenarios que necesitan una tienda propia siembran la suya con
  # prefijo `e2e-`, porque la suite no puede escribir sobre la tienda real.

  @slice-1
  Scenario: Comparto mi tienda por WhatsApp sin copiar nada
    Given que soy vendedora de la tienda "Panadería La Luz", en "/tienda/e2e-panaderia-la-luz"
    When abro "/cuenta" y despliego el menú de compartir de mi tienda
    Then "WhatsApp" apunta a wa.me con la dirección absoluta de mi tienda ya codificada
    And el mensaje que lleva nombra a "Panadería La Luz"

  @slice-1
  Scenario: Comparto mi dirección personal igual que mi tienda
    Given que reservé mi dirección personal
    When abro "/cuenta" y despliego el menú de compartir de mi perfil
    Then "WhatsApp" apunta a wa.me con la dirección absoluta de mi perfil ya codificada

  @slice-1
  Scenario: Copio el enlace y la página me lo confirma
    Given que soy vendedora de la tienda "Panadería La Luz"
    When abro "/cuenta" y elijo "Copiar enlace" en el menú de mi tienda
    Then el portapapeles contiene la dirección absoluta de "/tienda/e2e-panaderia-la-luz"
    And la página confirma que se copió, sin recargar ni abrir ningún diálogo del navegador

  # La corrida de escritorio de la regla: qué URL arma cada destino y por qué no todos llevan texto.
  @slice-1 @component
  Scenario Outline: Cada red recibe la dirección en el parámetro que ella entiende
    # Vitest sobre el dominio: son reglas puras de composición de URL, sin navegador de por medio.
    Given la dirección "https://hazlosano.com/tienda/hazlo-sano" y el texto "Mira mi tienda: Hazlo Sano"
    When se arma el enlace para "<red>"
    Then queda "<enlace>"

    Examples: destinos con URL de compartir web
      | red      | enlace                                                                                                         | razón                                              |
      | whatsapp | https://wa.me/?text=Mira%20mi%20tienda%3A%20Hazlo%20Sano%20https%3A%2F%2Fhazlosano.com%2Ftienda%2Fhazlo-sano   | wa.me sin número: el texto y el enlace van juntos  |
      | facebook | https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fhazlosano.com%2Ftienda%2Fhazlo-sano                 | solo acepta `u`; el texto lo saca del Open Graph   |
      | telegram | https://t.me/share/url?url=https%3A%2F%2Fhazlosano.com%2Ftienda%2Fhazlo-sano&text=Mira%20mi%20tienda%3A%20Hazlo%20Sano | acepta los dos, separados                   |

  @slice-1 @component
  Scenario Outline: La dirección se codifica aunque traiga lo que rompe una URL
    # Un handle no puede traer estos caracteres, pero el texto sí: el nombre de una tienda es libre.
    Given el texto "<texto>"
    When se arma el enlace de WhatsApp para "https://hazlosano.com/tienda/hazlo-sano"
    Then el parámetro `text` queda "<codificado>"

    Examples:
      | texto            | codificado                    | razón                                     |
      | Café & Té        | Caf%C3%A9%20%26%20T%C3%A9     | el `&` partiría la URL en dos parámetros  |
      | Pan #1           | Pan%20%231                    | el `#` volvería el resto un fragmento     |
      | 100% integral    | 100%25%20integral             | el `%` suelto no es una secuencia válida  |

  @slice-1 @component
  Scenario: En el móvil se ofrece la hoja del sistema, que es la única vía a Instagram y TikTok
    # Vitest: `navigator.share` se sustituye por un doble. Ni Instagram ni TikTok tienen URL de
    # compartir web, así que este camino no es un adorno: es el único que llega a ellas.
    Given un navegador que soporta `navigator.share`
    When se pulsa "Compartir"
    Then se invoca `navigator.share` con el título, el texto y la dirección
    And no se despliega el menú de destinos, porque la hoja del sistema ya los ofrece

  @slice-1 @component
  Scenario: Sin soporte nativo se despliega el menú, no se pierde la acción
    Given un navegador sin `navigator.share`
    When se pulsa "Compartir"
    Then se despliega el menú con WhatsApp, Facebook, X, Telegram, correo y "Copiar enlace"

  # En la base este caso existe una sola vez y es una persona real ("Jaime Cervantes", con
  # `/tienda/hazlo-sano` y `/u/jaime-cervantes`), así que la prueba siembra su propia tienda y su
  # propia dirección con prefijo `e2e-` en vez de escribir sobre las suyas.
  @slice-2
  Scenario: Desde mi avatar llego a mi tienda y a mi perfil
    Given que soy vendedora con tienda abierta y dirección personal reservada
    When despliego el menú de mi avatar
    Then veo mi nombre y mi "@dirección" arriba
    And "Mi tienda" me lleva a la página pública de mi tienda
    And "Mi perfil" me lleva a mi página personal
    And llego a las dos sin pasar por "/cuenta"

  @slice-2
  Scenario: Quien no tiene nada de eso no ve puertas a páginas que no existen
    Given que estoy autenticada, sin tienda y sin dirección personal
    When despliego el menú de mi avatar
    Then solo se me ofrece "Mi cuenta"

  @slice-2 @component
  Scenario Outline: El menú solo ofrece lo que existe
    # Vitest: son combinaciones de props. Y de los 21 usuarios de la base, 20 están en la última
    # fila, así que ese es el caso común, no el raro.
    Given una sesión <caso>
    When se pinta el menú del avatar
    Then ofrece <entradas>

    Examples:
      | caso                     | entradas                                          |
      | con tienda y con perfil  | Mi tienda, Mi perfil y Mi cuenta                  |
      | con tienda y sin perfil  | Mi tienda y Mi cuenta, sin "@" bajo el nombre     |
      | sin tienda y con perfil  | Mi perfil y Mi cuenta                             |
      | sin tienda y sin perfil  | solo Mi cuenta, como hoy                          |

  @slice-2
  Scenario: El menú móvil ofrece los mismos destinos
    Given que soy vendedora con tienda abierta, en una pantalla de teléfono
    When abro el menú
    Then encuentro el atajo a mi tienda junto a mi cuenta, y me lleva a su página pública

  # La página tenía TRES encabezados principales: el suyo, el de la tarjeta de la tienda y el del
  # alta de vendedor. Quien navega por encabezados no tenía forma de saber cuál era el de verdad.
  @slice-3
  Scenario: Mi cuenta se lee de un vistazo
    Given que soy vendedora con tienda, sucursales y dirección personal
    When abro "/cuenta"
    Then la página tiene un solo título principal, "Mi cuenta"
    And cada bloque va en su propia tarjeta y cuelga de él como "h2"

  @slice-3
  Scenario: Lo que se reparte va antes que lo que se edita
    Given que soy vendedora con tienda y dirección personal
    When abro "/cuenta"
    Then "Tu tienda" y "Tu dirección personal" van antes que "La ficha de tu tienda" y "Agrega una sucursal"
    # Antes la dirección personal caía al final de la segunda columna, debajo del alta de
    # sucursales: era lo último que veía quien entraba justo a repartir su enlace.

  @slice-3
  Scenario: Lo que todavía no tengo se dice, no se esconde
    Given que estoy autenticada, sin tienda y sin dirección personal
    When abro "/cuenta"
    Then sigo viendo un solo título principal
    And los dos bloques vacíos explican qué gano al abrir la tienda y al reservar la dirección

  # Aquí comparte **el comprador**, no la vendedora, así que ningún escenario inicia sesión: si
  # compartir exigiera cuenta, la mitad de las veces que alguien quiere repartir un enlace no
  # podría. Por eso también el texto va en su voz ("esta tienda") y no en la del dueño.
  @slice-4
  Scenario: El comprador comparte la tienda que le gustó
    Given la tienda "Hazlo Sano" en "/tienda/hazlo-sano"
    When un visitante la abre
    Then puede compartirla con el mismo menú, sin haber iniciado sesión
    And WhatsApp lleva la dirección de la tienda

  @slice-4
  Scenario: El comprador comparte un producto sin abrirlo
    Given el catálogo de "Hazlo Sano", que se pinta con las mismas tarjetas que el home y la búsqueda
    When un visitante lo recorre
    Then cada tarjeta ofrece compartir, y basta el icono: doce botones con texto competirían con los doce títulos

  @slice-4
  Scenario: El comprador comparte la ficha que abrió
    Given una publicación con título y precio
    When un visitante abre su detalle
    Then puede compartirla junto al botón de pedir, con su dirección absoluta y su título
    # Junto a pedir porque son las dos salidas de la ficha; y para un anuncio, que no se pide,
    # compartir es la única.

  @slice-4
  Scenario: El comprador comparte el perfil de quien publica
    Given un perfil con dirección personal reservada
    When un visitante lo abre
    Then puede compartirlo igual que una tienda

  @slice-4 @component
  Scenario Outline: La dirección que se reparte siempre es absoluta
    # Vitest sobre la tarjeta: `to` llega absoluta desde `mapPostsToCards`, pero una tarjeta armada
    # a mano la trae relativa, y un camino relativo no resuelve en la aplicación donde acabe pegado.
    Given una tarjeta cuya dirección es "<to>"
    When se abre su menú de compartir
    Then el enlace reparte "<compartida>"

    Examples:
      | to                                    | compartida                            |
      | /miel-de-abeja                        | <base>/miel-de-abeja                  |
      | https://hazlosano.com/miel-de-abeja   | https://hazlosano.com/miel-de-abeja   |
