Feature: Retos atomicos - del pilar a una practica con identidad propia

  Context:
  - Problem: los cuatro pilares explican por que importa el descanso, pero al terminar no existe una
    accion concreta, una razon para volver manana ni una senal de que la comunidad acompana. Esperar
    siete dias para celebrar deja sin recompensa la repeticion mas fragil: la primera.
  - Savings: un ritual prearmado elimina decisiones al final del dia; un minimo alcanzable reduce
    frustracion; celebrar y reconocer la primera repeticion permite validar retorno antes de construir
    siete dias, grupos, recordatorios o clasificaciones.
  - Why: Hazlo Sano debe convertir sus cuatro pilares en practica. El descanso es la primera puerta y
    la comunidad refuerza la identidad «soy una persona que protege su descanso».

  As a persona que quiere cuidar su descanso
  I want to completar un ritual pequeno y recibir reconocimiento inmediato
  So that la primera repeticion me ayude a volver al dia siguiente

  # Slice 1 valida una repeticion, no una promesa de siete dias. El progreso es privado hasta que la
  # persona comparte el hito despues de cumplirlo. La celebracion no es un post: se compone delante
  # del feed para no contaminar busqueda, RSS, catalogo, carrito ni paginacion.

  @slice-1
  Scenario: El pilar Sueno incluye una accion concreta
    Given que leo el pilar "Sueno y Descanso"
    When avanzo hasta "Ponlo en practica"
    Then encuentro el reto "Del atardecer al amanecer" sin salir del pilar
    And el minimo distingue "Cerrar la noche" de "Abrir la manana"
    And sol matutino, atenuar la casa, descargar la mente y un cuarto fresco aparecen como recomendados, no obligatorios

  @slice-1
  Scenario: Completo mi primer ciclo y la recompensa llega ahora
    Given que inicie sesion con la cuenta E2E y empece "Del atardecer al amanecer"
    When confirmo que estacione mis dispositivos, baje las luces y sali a luz natural al despertar
    Then la celebracion dice "Tu semilla desperto"
    And mi progreso queda en "Brote" con 10 puntos y la insignia "Primer paso"
    When envio la misma intencion otra vez
    Then sigo con 10 puntos y una sola primera repeticion

  @slice-1
  Scenario: Mi primer ciclo es privado hasta que decido compartirlo
    Given que complete mi primer ciclo con la cuenta E2E
    When todavia no acepto compartir
    Then el inicio no muestra mi logro antes de las publicaciones
    And ninguna pagina muestra un aviso comunitario sobre mi
    When acepto "Compartir con la comunidad"
    Then el inicio muestra mi celebracion antes de la primera publicacion
    And el sitio muestra un mensaje de que una persona completo su primer ritual

  @slice-1
  Scenario: El mensaje global se puede cerrar sin borrar el logro
    Given una primera repeticion compartida por la cuenta E2E
    When cierro el mensaje comunitario y navego a "Productos"
    Then el mensaje sigue cerrado en ese navegador
    But la tarjeta del logro sigue delante del feed del inicio

  @slice-1
  Scenario: Retirar lo compartido conserva mi progreso privado
    Given que publique mi primera repeticion
    When dejo de compartirla desde el reto
    Then el inicio y el mensaje global dejan de mostrarla
    But mi reto sigue en "Brote" con 10 puntos

  @slice-1
  Scenario: Iniciar el reto requiere una identidad a la cual regresar
    Given que abro "/pilares/sueno" sin sesion
    When intento iniciar "Del atardecer al amanecer"
    Then llego a iniciar sesion con "/pilares/sueno" como destino de regreso

  @slice-1 @component
  Scenario Outline: Solo el minimo completo produce la primera repeticion
    Given un registro con noche preparada = <noche> y luz matutina = <manana>
    When se evalua el primer ciclo
    Then el resultado es "<resultado>"

    Examples: minimo completo y combinaciones incompletas
      | noche | manana | resultado  | razon                                      |
      | si    | si     | completado | cerro la noche y abrio la manana           |
      | si    | no     | incompleto | preparar la noche no completa todo el ciclo|
      | no    | si     | incompleto | la manana no sustituye preparar la noche   |
      | no    | no     | incompleto | todavia no existe una repeticion           |

  @slice-1 @component
  Scenario Outline: El consentimiento decide la proyeccion publica
    Given un progreso en "Brote" y una celebracion <publicacion>
    When se arma lo que puede ver la comunidad
    Then la tarjeta y el mensaje global "<visibilidad>"

    Examples:
      | publicacion | visibilidad | razon                                         |
      | ausente     | no aparecen | privado es el estado inicial                  |
      | activa      | aparecen    | la persona acepto despues de cumplir          |
      | retirada    | no aparecen | retirar visibilidad no borra progreso privado |

  # El ciclo de sueno pertenece a la fecha local de la manana que lo cierra. La ventana siempre es
  # [inicio, fin), las fechas posteriores se pueden recuperar mientras sigan dentro de ella y una
  # omision no reinicia lo ya ganado.

  @slice-2
  Scenario: Completo cinco de siete ciclos y recibo la celebracion final
    Given que empece el reto en la zona "America/Mexico_City" cuatro dias antes de hoy
    When registro cinco fechas locales distintas, incluida una fecha posterior a una omision
    Then veo "5 de 7 ciclos" y 50 puntos sin que un reintento sume otra vez
    And recibo la celebracion final "Protegiste tu descanso cinco veces"
    And la pagina aclara que esto todavia no basta para afirmar que forme un habito
    When acepto compartir el hito final y despues lo retiro
    Then la insignia "Cosecha de descanso" y mis 50 puntos permanecen privados

  @slice-2 @component
  Scenario Outline: Una fecha cuenta solo dentro de la ventana local disponible
    Given una ventana local ["2026-08-06", "2026-08-13") en "America/Mexico_City"
    And el reloj marca "2026-08-10T14:00:00Z"
    When intento registrar la fecha de manana "<fecha>"
    Then el resultado es "<resultado>"

    Examples: limites, futuro y fecha recuperable
      | fecha      | resultado       | razon                                  |
      | 2026-08-05 | fuera-de-ventana| anterior al inicio inclusivo           |
      | 2026-08-06 | disponible      | inicio incluido                        |
      | 2026-08-09 | disponible      | una fecha anterior se puede recuperar  |
      | 2026-08-10 | disponible      | hoy local se puede registrar           |
      | 2026-08-11 | futura          | el reloj local aun no llega            |
      | 2026-08-13 | fuera-de-ventana| el fin es exclusivo                    |

  @slice-2 @component
  Scenario: Regresar despues de faltar vale mas que abandonar
    Given repeticiones en "2026-08-06" y "2026-08-07" y ninguna en "2026-08-08"
    When registro el ciclo de "2026-08-09"
    Then el reconocimiento es "regreso" y las dos repeticiones anteriores conservan sus 20 puntos

  @slice-3
  Scenario: Las repeticiones compartidas hacen crecer el jardin comunitario
    Given que complete una repeticion privada de descanso
    When acepto "Aportar mis repeticiones al jardin"
    Then el jardin agregado suma una repeticion violeta sin mostrar mis dias ni ordenarme
    When retiro mi aporte
    Then el jardin deja de contar mis repeticiones y mis puntos no cambian

  @slice-3
  Scenario: La comunidad celebra sin convertir popularidad en puntos
    Given un hito publicado por la cuenta E2E y otra cuenta autenticada
    When la otra cuenta envia dos veces la intencion "Celebrar"
    Then el hito conserva una sola reaccion y los puntos del autor no cambian
    When la otra cuenta envia dos veces la intencion "Retirar celebración"
    Then el hito queda sin su reaccion y los puntos del autor no cambian

  @slice-3 @component
  Scenario Outline: El jardin agrega colores, no posiciones personales
    Given repeticiones compartidas del reto "<reto>"
    When se arma el jardin comunitario
    Then las repeticiones crecen en el color "<color>"

    Examples:
      | reto                              | color    |
      | sleep-evening-to-morning-v1       | violeta  |
      | nutrition-one-plant-v1            | naranja  |
      | movement-two-minutes-v1           | verde    |
      | mind-one-connection-v1            | ámbar    |

  @slice-4
  Scenario: Elijo un reto atomico de otro pilar
    Given que tengo progreso en "Del atardecer al amanecer"
    When abro el pilar Alimentacion y elijo "Cena real, local y al atardecer"
    Then la ruta y el contenido se muestran en mi idioma
    And "Cena real, local y al atardecer" y mi progreso de descanso permanecen disponibles al mismo tiempo

  @slice-4 @component
  Scenario Outline: Cada pilar ofrece una practica curada y minima
    Given el pilar "<pilar>"
    When sigo su invitacion al reto atomico
    Then conozco la practica "<reto>" y su minimo "<minimo>"

    Examples:
      | pilar            | reto                              | minimo                                     |
      | Alimentacion     | Cena real, local y al atardecer   | cenar al atardecer y servir la triada local |
      | Movimiento       | Movimiento vivo, local y funcional | un trayecto sin motor y dos minutos de pie |
      | Mente y comunidad| Presencia, paz y conexión local    | abrir el dia sin pantalla y dar presencia  |

  @slice-4
  Scenario: El recordatorio permanece bloqueado si el canal no esta probado
    Given que external_id puede pertenecer a WhatsApp, Telegram, Instagram o Messenger
    And existe un puerto de envio pero no una vinculacion de canal para mi cuenta web
    When consulto recordatorios para mis practicas iniciadas
    Then Telegram aparece como no disponible y no se afirma que se enviara un mensaje

  @slice-5
  Scenario: La liga no finge una clasificacion vacia
    Given menos de diez participantes con opt-in y actividad esta semana
    When abro los retos atomicos
    Then veo el avance colectivo hacia diez y no veo una tabla de posiciones

  @slice-5 @component
  Scenario Outline: La liga se habilita solo con comunidad semanal suficiente
    Given <participantes> cuentas con opt-in y actividad en [lunes, lunes siguiente)
    When se evalua la liga
    Then su estado es "<estado>"

    Examples:
      | participantes | estado       |
      | 0             | condicionada |
      | 9             | condicionada |
      | 10            | elegible     |
      | 11            | elegible     |

  @slice-5 @component
  Scenario: Constancia diaria topada y empates compartidos
    Given Ana practico dos pilares el lunes y uno el martes
    And Luz practico un pilar el lunes y uno el miercoles
    And Sol practico un pilar el lunes
    When se arma la posicion semanal
    Then Ana y Luz comparten la posicion 1 con 2 puntos y Sol ocupa la posicion 2 con 1 punto

  # Slice 6 abre la paridad de profundidad. No copia el ritual de Sueno: comparte calendario,
  # progreso, privacidad y celebraciones, pero Alimentacion tiene senal, cadena, lenguaje y paleta
  # propios. Movimiento y Mente quedan como esqueletos hasta que Alimentacion ensene que extraer.

  @slice-6
  Scenario: La cena deja de ser una accion suelta y se vuelve ritual
    Given que leo el pilar "Alimentacion natural, nutritiva y local"
    When sigo la invitacion al reto "Cena real, local y al atardecer"
    Then entro a una experiencia naranja propia de Alimentacion
    And declaro "Soy una persona que hace fácil elegir comida real, fresca y de origen local"
    And el ritual distingue la senal "Cenar al atardecer" de la accion "Servir la triada local"
    And abastecerse en el mercado local aparece como ayuda, no como requisito

  @slice-6
  Scenario: Cinco cenas reales reciben una celebracion propia
    Given que empece "Cena real, local y al atardecer" en mi zona local cuatro dias antes de hoy
    When registro cinco fechas distintas en las que cene al atardecer y servi la triada
    Then veo "5 de 7 cenas" y 50 puntos
    And la celebracion dice "Cultivaste cinco cenas reales"
    And la pagina no habla de luna, amanecer ni ritual de descanso

  @slice-6
  Scenario: Compartir Alimentacion no manda a Sueno
    Given que complete y comparti el hito de "Cena real, local y al atardecer"
    When otra persona abre el inicio
    Then la tarjeta usa la identidad naranja de Alimentacion
    And dice que cultive mi primera cena real
    And enlaza a "/pilares/alimentacion", no a "/pilares/sueno"

  @slice-6 @component
  Scenario Outline: Alimentacion conserva la mecanica sin heredar la identidad de Sueno
    Given el elemento de experiencia "<elemento>"
    When se configura para "Cena real, local y al atardecer"
    Then usa "<alimentacion>" y no "<sueno>"

    Examples: identidad visual y conductual
      | elemento          | alimentacion                         | sueno                    |
      | color solido      | pillar-nutrition-solid               | pillar-sleep-solid       |
      | senal             | Cenar al atardecer                   | Cerrar la noche          |
      | minimo            | Servir la triada local               | Abrir la mañana          |
      | celebracion final | Cultivaste cinco cenas reales        | Protegiste tu descanso   |
      | destino publico   | /pilares/alimentacion                | /pilares/sueno           |

  @slice-7
  Scenario: El movimiento deja de ser una sesion y se vuelve un dia entero
    Given que leo el pilar "Movimiento y actividad física"
    When sigo la invitacion al reto "Movimiento vivo, local y funcional"
    Then entro a una experiencia verde propia de Movimiento
    And declaro "Soy una persona que se mueve de forma natural y reconecta con su entorno y comunidad todos los dias"
    And puedo anclar el inicio a ropa preparada, una pausa o una ruta cotidiana
    And el minimo son dos minutos segun mi capacidad
    But continuar es opcional y no suma puntos adicionales

  @slice-7
  Scenario: Cinco dias de movimiento reciben una celebracion propia
    Given que empece "Movimiento vivo, local y funcional" en mi zona local cuatro dias antes de hoy
    When registro cinco fechas distintas con mi senal elegida y dos minutos de movimiento
    Then veo "5 de 7 días" y 50 puntos
    And la celebracion dice "Empezaste a moverte cinco veces"
    And el ritual me invita a preparar, empezar, moverme dos minutos y notar mi cuerpo

  @slice-7
  Scenario: Compartir Movimiento conserva su identidad y destino
    Given que complete y comparti el primer hito de "Movimiento vivo, local y funcional"
    When otra persona abre el inicio
    Then la tarjeta usa la identidad verde de Movimiento
    And dice que empece a moverme
    And enlaza a "/pilares/movimiento", no a otro pilar

  @slice-7 @component
  Scenario Outline: El volumen opcional nunca compra mas puntos
    Given un check-in con dos minutos completos y <continuacion>
    When se registra en la fecha local "2026-08-11"
    Then el total ganado en esa fecha es "<puntos>"

    Examples:
      | continuacion            | puntos   |
      | sin minutos adicionales | 10 puntos |
      | con minutos adicionales | 10 puntos |

  @slice-8
  Scenario: Un vinculo consciente se convierte en un ritual de presencia
    Given que leo el pilar "Mente y espíritu"
    When sigo la invitacion al reto "Presencia, paz y conexión local"
    Then entro a una experiencia con los colores del pilar Mente y Espíritu
    And declaro "Soy una persona que cultiva la paz interior, la presencia y lazos solidos con su comunidad"
    And la senal es una pausa cotidiana lejos del ruido digital
    And el minimo es enviar un mensaje de presencia real y dejar espacio para escuchar

  @slice-8
  Scenario: La respuesta ajena nunca decide mi practica ni mis puntos
    Given que envie un mensaje genuino de presencia y deje espacio para escuchar
    When la otra persona no responde
    Then puedo registrar la fecha local con 10 puntos
    And no se puntua cantidad de respuestas, contactos ni popularidad
    When completo cinco fechas distintas
    Then veo "5 de 7 días" y la celebracion "Sostuviste cinco días de presencia"

  @slice-8
  Scenario: Compartir Mente y Comunidad conserva su identidad y destino
    Given que complete y comparti el primer hito de "Presencia, paz y conexión local"
    When otra persona abre el inicio
    Then la tarjeta usa los colores del pilar Mente y Espíritu
    And dice que cultive un vinculo real
    And enlaza a "/pilares/mente-espiritu", no a otro pilar

  @slice-8 @component
  Scenario Outline: Una respuesta nunca es requisito del check-in
    Given una pausa completa y un mensaje genuino enviado
    And la respuesta de la otra persona esta "<respuesta>"
    When se evalua el minimo de presencia
    Then el check-in esta "<resultado>"

    Examples:
      | respuesta | resultado |
      | ausente   | completo  |
      | presente  | completo  |

  # Slice 9 no cambia las reglas de los retos. Hace visible la invitacion antes de las fuentes y
  # reserva los detalles tecnicos para la documentacion, no para quien quiere empezar.

  @slice-9
  Scenario Outline: Cada pilar integra su practica antes de las referencias
    Given que leo el pilar "<pilar>"
    When llego al final de su explicacion
    Then la practica "<practica>" aparece antes de "Referencias"

    Examples: los cuatro pilares unen informacion y accion
      | pilar                         | practica                           |
      | Sueño y Descanso              | Del atardecer al amanecer          |
      | Alimentación natural          | Cena real, local y al atardecer    |
      | Movimiento y actividad física | Movimiento vivo, local y funcional |
      | Mente y espíritu              | Presencia, paz y conexión local     |

  @slice-9
  Scenario Outline: Los retos hablan de la accion y no del sistema
    Given que abro "<ruta>" en español
    When leo la propuesta antes de empezar
    Then entiendo que hacer y no veo "atómico", "external_id", "puerto de envío" ni "onboarding"

    Examples: indice y experiencias de los cuatro pilares
      | ruta                       |
      | /habitos                   |
      | /pilares/sueno             |
      | /pilares/alimentacion      |
      | /pilares/movimiento        |
      | /pilares/mente-espiritu    |

  @slice-9
  Scenario: Un recordatorio no disponible se explica sin detalles internos
    Given que abro una practica cuyo recordatorio de Telegram todavia no esta disponible
    When leo el aviso del recordatorio
    Then el aviso dice que estara disponible mas adelante
    And no explica identificadores, puertos ni vinculaciones del sistema

  # Slice 10 hace que la practica sea una continuacion literal de su pilar en URL y paleta.

  @slice-10
  Scenario Outline: Mente y Espiritu conserva su nombre dentro de la practica
    Given que abro el pilar "<pilar>"
    When avanzo hasta la practica "<invitacion>"
    Then sigo en "<practica>"
    And veo "<titulo>" con la identidad visual de Mente y Espiritu

    Examples: ruta canonica por idioma
      | pilar                    | invitacion                       | practica                   | titulo                   |
      | /pilares/mente-espiritu       | Presencia, paz y conexión local | /pilares/mente-espiritu   | Presencia, paz y conexión local |
      | /en/pillars/mente-espiritu    | Presence, peace and local connection | /en/pillars/mente-espiritu | Presence, peace and local connection |

  @slice-10 @component
  Scenario Outline: Cada superficie usa la paleta oficial de Mente y Espiritu
    Given la superficie "<superficie>" de Un vinculo consciente
    When se resuelve su identidad visual
    Then usa "<tokens>"
    And no contiene clases ambar genericas

    Examples: experiencia, seguimiento y comunidad
      | superficie          | tokens                                                                    |
      | experiencia profunda| pillar-mind-spirit-ink, pillar-mind-spirit-soft, pillar-mind-spirit-solid |
      | panel de seguimiento| pillar-mind-spirit-ink, pillar-mind-spirit-soft, pillar-mind-spirit-solid |
      | celebracion publica | pillar-mind-spirit-ink, pillar-mind-spirit-soft, pillar-mind-spirit-solid |

  # Slice 11 cambia la palabra visible, no el calculo ni el contrato interno.

  @slice-11 @component
  Scenario Outline: El progreso se expresa con palabras cotidianas
    Given una practica con <ciclos> fechas completadas
    When veo mi progreso en "<idioma>"
    Then aparece "<puntos>"
    And no aparece "XP" ni "EXP"

    Examples: progreso en los dos idiomas
      | ciclos | idioma | puntos    |
      | 0      | es     | 0 puntos  |
      | 1      | es     | 10 puntos |
      | 5      | es     | 50 puntos |
      | 0      | en     | 0 points  |
      | 1      | en     | 10 points |
      | 5      | en     | 50 points |
