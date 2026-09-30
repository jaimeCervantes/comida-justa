# language: es
Característica: La primera visita invita a ver los cuatro pilares, y se mide si se ven

  Contexto de negocio:
  - Problema: la animación que explica los pilares vive en /pilares, pero quien llega por primera vez
    entra casi siempre por otra página: la portada, un producto, una búsqueda.
  - Ahorro: sin medir, construir las animaciones de cada pilar sería adivinar; con los datos se decide
    si vale la pena invertir en ellas.
  - Por qué: captar gente nueva llevando la explicación a donde está quien llega.

  Como alguien que llega por primera vez a cualquier página
  Quiero una invitación discreta a ver qué son los cuatro pilares
  Para entender el proyecto sin tener que buscar dónde se explica

  @slice-2
  Esquema del escenario: La primera visita invita a ver los cuatro pilares
    Dado que nunca he visitado el sitio
    Cuando abro "<ruta>" y pasan unos segundos
    Entonces veo una invitación a ver los cuatro pilares
    Y no me tapa la página: el foco sigue donde estaba

    Ejemplos:
      | ruta           |
      | /              |
      | /productos     |
      | /pilares/sueno |

  @slice-2
  Escenario: Al aceptarla, la animación se reproduce sin salir de la página
    Dado que veo la invitación en "/"
    Cuando pulso "Ver ahora"
    Entonces la animación de los cuatro pilares se reproduce encima de la página
    Y sigo en "/"
    Y al cerrarla vuelvo a la página donde estaba

  @slice-2
  Escenario: Cerrada una vez, no vuelve
    Dado que veo la invitación en "/"
    Cuando pulso "Ahora no"
    Y abro "/productos" y pasan unos segundos
    Entonces no vuelve a aparecer

  @slice-2
  Esquema del escenario: No aparece donde no toca
    Dado que nunca he visitado el sitio
    Cuando abro "<ruta>" y pasan unos segundos
    Entonces no aparece la invitación

    Ejemplos:
      | ruta     | razón                             |
      | /pilares | ahí ya está la animación          |
      | /carrito | es una compra: no se interrumpe   |

  @slice-2
  Escenario: Quien ya vio la animación no recibe la invitación
    Dado que ya vi la animación de los cuatro pilares
    Cuando abro "/" y pasan unos segundos
    Entonces no aparece la invitación

  # La medición va a Google Analytics 4, que el sitio ya carga en producción. En la prueba se
  # sustituye `gtag` por un registro: se comprueba qué se envía, no que Google lo reciba.
  @slice-2
  Esquema del escenario: Cada paso queda medido
    Dado que el sitio mide con Google Analytics
    Cuando <acción>
    Entonces se registra el evento "<evento>" desde "<lugar>"

    Ejemplos:
      | acción                                            | evento                   | lugar  |
      | aparece la invitación en "/"                      | animation_invite_shown   | invite |
      | pulso "Ahora no" en la invitación                 | animation_invite_dismiss | invite |
      | pulso "Ver ahora" en la invitación                | animation_invite_accept  | invite |
      | pulso "Ver ahora" y la animación arranca sola     | animation_play           | invite |
      | la animación de "/pilares" llega a la escena 2    | animation_scene          | page   |
      | la animación de "/pilares" termina                | animation_complete       | page   |
      | pulso "Elegir mi práctica" al final en "/pilares" | animation_cta            | page   |
