Feature: Los desplegables de la cabecera se cierran al tocar fuera

  Context:
  - Problem: el selector de idioma se abre y ya no hay forma de cerrarlo salvo volver a pulsar su
    propio botón. Tocar en cualquier otra parte —que es lo que hace todo el mundo— no lo cierra, así
    que el panel se queda encima del contenido mientras se navega. Está escrito a mano con un
    `useState` y no escucha nada fuera de sí mismo: ni el clic de fuera ni la tecla Escape.
  - Savings: la frustración de un panel que no se va, y la deuda de tener dos desplegables en la
    misma barra —el del avatar y el del idioma— comportándose distinto. El del avatar ya usa Radix
    y ya se cierra; copiar ese comportamiento a mano sería mantener dos veces lo mismo.
  - Why: la cabecera es lo único que acompaña a la persona en todas las páginas del sitio. Lo que
    ahí se comporta raro se nota en cada visita, no en una pantalla suelta.

  As a persona que usa el sitio
  I want to cerrar un desplegable tocando en cualquier otra parte
  So that no se me queda encima del contenido que estoy leyendo

  @slice-1
  Scenario: El selector de idioma se cierra al tocar fuera
    Given un visitante en el inicio con el selector de idioma abierto
    When toca en cualquier otra parte de la página
    Then el selector se cierra y sigue en la misma dirección

  @slice-1
  Scenario: El menú del avatar se cierra al tocar fuera
    Given una persona con la sesión iniciada y el menú de su avatar abierto
    When toca en cualquier otra parte de la página
    Then el menú se cierra y sigue en la misma dirección

  # El toque de fuera no se puede *gastar* en cerrar. Radix abre en modo modal por omisión: deja el
  # resto de la página con `pointer-events: none` y `aria-hidden`, así que tocar un enlace con el
  # menú abierto lo cerraba sin llevar a ninguna parte y había que tocar dos veces.
  @slice-1
  Scenario: El toque que cierra el menú hace además lo suyo
    Given un visitante en el inicio con el selector de idioma abierto
    When toca el enlace de «Catálogo»
    Then el selector se cierra y la página de «Catálogo» se abre

  @slice-1
  Scenario: Escape también los cierra
    Given un visitante en el inicio con el selector de idioma abierto
    When pulsa Escape
    Then el selector se cierra

  # La red que protege el cambio de motor: el selector pasa de un `useState` a Radix, y lo que no
  # puede perderse por el camino es lo único que hace.
  @slice-1
  Scenario: El selector sigue cambiando el idioma de la página que se está mirando
    Given un visitante en el inicio con el selector de idioma abierto
    When elige "English"
    Then la misma página se sirve en inglés
