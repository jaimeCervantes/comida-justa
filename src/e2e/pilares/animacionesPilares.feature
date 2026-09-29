# language: es
Característica: Una animación explica los pilares antes de pedir que se lean

  Contexto de negocio:
  - Problema: la gente no entiende qué son los cuatro pilares; hoy solo se explican con texto, y eso
    obliga a repetir la explicación por redes sociales.
  - Ahorro: menos explicaciones una a una; un material que explica el proyecto en menos de un minuto
    y que se puede compartir.
  - Por qué: captar gente nueva y reutilizar la misma animación como video para redes.

  Como alguien que llega por primera vez
  Quiero ver en minuto y medio qué son los cuatro pilares y por qué existen
  Para entender el proyecto sin leer cuatro artículos

  # ── Slice 1: la animación de los cuatro pilares en /pilares ──────────────────────────────────

  @slice-1
  Escenario: La primera visita a /pilares reproduce la animación sola
    Dado que nunca he visto la animación de los cuatro pilares
    Cuando abro "/pilares"
    Entonces la animación está debajo del héroe
    Y se está reproduciendo desde la escena 1 de 6

  @slice-1
  Escenario: Al volver no arranca sola, pero se puede ver otra vez
    Dado que ya vi la animación de los cuatro pilares
    Cuando abro "/pilares"
    Entonces la animación está quieta
    Y al pulsar "Ver animación" se reproduce desde la escena 1

  @slice-1
  Esquema del escenario: Las escenas recorren los cuatro pilares en su orden
    Dado que la animación de los cuatro pilares está en pausa
    Cuando avanzo hasta la escena <escena>
    Entonces la escena es del pilar "<pilar>"

    Ejemplos:
      | escena | pilar            |
      | 1      | ninguno          |
      | 2      | sueno            |
      | 3      | alimentacion     |
      | 4      | movimiento       |
      | 5      | mente-espiritu   |
      | 6      | ninguno          |

  @slice-1
  Escenario: Cada pilar se cuenta en tres tiempos
    Dado que la animación de los cuatro pilares está en la escena 2
    Cuando dejo que la escena se reproduzca entera
    Entonces veo tres subtítulos sucesivos: antes, lo que cambió y el regreso

  @slice-1
  Esquema del escenario: El logo abre y cierra la animación, y no aparece en medio
    Dado que la animación de los cuatro pilares está en pausa
    Cuando avanzo hasta la escena <escena>
    Entonces el logo de la marca <logo>

    Ejemplos:
      | escena | logo           |
      | 1      | se ve          |
      | 3      | no se ve       |
      | 6      | se ve          |

  @slice-1
  Escenario: Se puede pausar y retomar donde iba
    Dado que la animación de los cuatro pilares se está reproduciendo en la escena 2
    Cuando la pauso
    Entonces sigue en la escena 2 aunque pase el tiempo
    Y al reanudarla continúa desde la escena 2

  @slice-1
  Escenario: El cierre invita a elegir una práctica en la misma página
    Dado que la animación de los cuatro pilares llega a la escena 6
    Cuando pulso "Elegir mi práctica"
    Entonces llego a las tarjetas de los cuatro pilares de "/pilares"

  @slice-1
  Escenario: Con movimiento reducido no arranca sola y se lee como pasos
    Dado que mi sistema pide reducir el movimiento
    Y que nunca he visto la animación de los cuatro pilares
    Cuando abro "/pilares"
    Entonces la animación no se reproduce sola
    Y puedo leer las 6 escenas avanzando una a una

  # Cubierto por Vitest: es aritmética del guion, sin navegación.
  # Spec ejecutable junto a la función en src/presentation/habits/animations/.
  @slice-1 @component
  Esquema del escenario: El tiempo transcurrido decide la escena
    Dado un guion de escenas de 6000, 6000 y 8000 milisegundos
    Cuando han pasado <ms> milisegundos
    Entonces toca la escena <escena> con <progreso> de avance
    Y la animación <terminada>

    Ejemplos:
      | ms    | escena | progreso | terminada     |
      | 0     | 1      | 0        | no ha acabado |
      | 3000  | 1      | 0.5      | no ha acabado |
      | 6000  | 2      | 0        | no ha acabado |
      | 16000 | 3      | 0.5      | no ha acabado |
      | 20000 | 3      | 1        | ha acabado    |
      | 25000 | 3      | 1        | ha acabado    |

  @slice-1
  Esquema del escenario: Los subtítulos siguen el idioma de quien mira
    Dado que abro "<ruta>"
    Cuando la animación llega al último subtítulo de la escena 2
    Entonces el subtítulo termina en "<frase>"

    Ejemplos:
      | ruta             | frase                                                    |
      | /pilares         | Volver a dormir al ritmo de la luz, no al de las pantallas. |
      | /en/pillars      | Sleeping to the rhythm of light again, not of screens.   |

  # ── Slices futuros (esqueletos) ──────────────────────────────────────────────────────────────

  @slice-2 @future
  Escenario: La primera visita a cualquier página invita a ver los cuatro pilares
    Dado que nunca he visitado el sitio
    Cuando abro cualquier página que no sea "/pilares" ni una compra
    Entonces veo una invitación discreta a ver la animación
    Y al aceptarla se reproduce sin salir de la página

  @slice-2 @future
  Escenario: La invitación no vuelve una vez cerrada o vista
    Dado que cerré o vi la invitación
    Cuando abro otra página
    Entonces no vuelve a aparecer

  @slice-3 @future
  Escenario: La primera visita a un pilar reproduce su propia animación
    Dado que nunca he visto la animación de "Sueño"
    Cuando abro "/pilares/sueno"
    Entonces su animación está debajo del héroe y se reproduce sola

  @slice-7 @future
  Escenario: El guion se exporta a video para redes
    Dado el guion de los cuatro pilares
    Cuando se exporta
    Entonces hay un video vertical y uno cuadrado con las mismas escenas

  @slice-8 @future
  Escenario: La voz acompaña a cada escena sin arrancar sola
    Dado que la animación tiene locución
    Cuando se reproduce en la web
    Entonces empieza en silencio hasta que activo el sonido
