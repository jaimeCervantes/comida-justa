# language: es

Característica: Practicar varios rituales al mismo tiempo
  Como persona que cuida los cuatro pilares
  Quiero conservar y consultar el avance de cada ritual que inicio
  Para aplicar varias practicas sin perder contexto ni progreso

  @slice-1
  Escenario: Dos rituales conservan y permiten avanzar su progreso
    Dado que inicie "Del atardecer al amanecer" y complete un ciclo
    Cuando inicio "Una planta mas"
    Entonces Sueño conserva un ciclo y Alimentacion conserva su propia ventana
    Cuando vuelvo al pilar Sueño
    Entonces veo inmediatamente mi calendario, 1 ciclo y 10 puntos sin pulsar "Continuar"
    Y puedo registrar otro ciclo de Sueño sin desactivar Alimentacion

  @slice-1 @component
  Esquema del escenario: El progreso guardado siempre se muestra en su pilar
    Dado que existe progreso guardado para "<ritual>"
    Y otro ritual fue iniciado despues
    Cuando abro el pilar "<pilar>"
    Entonces veo el seguimiento de "<ritual>"
    Y no veo un paso intermedio para reactivarlo

    Ejemplos:
      | pilar               | ritual                       |
      | Sueño               | Del atardecer al amanecer    |
      | Alimentacion        | Una planta mas               |
      | Movimiento          | Movimiento vivo, local y funcional |
      | Mente y comunidad   | Un vinculo consciente        |

  @slice-1 @integration
  Escenario: Iniciar un ritual no modifica los otros progresos
    Dado que mi cuenta tiene progreso en Sueño y Movimiento
    Cuando inicio el ritual de Alimentacion
    Entonces la base conserva los tres periodos y sus repeticiones
    Y los tres rituales aceptan nuevos registros independientes

  @slice-1 @component
  Escenario: El progreso historico desplazado vuelve a ser visible
    Dado un progreso que el modelo anterior marco como onboarding inactivo
    Cuando abro el pilar correspondiente
    Entonces veo sus ciclos, puntos, hitos y opciones de privacidad
    Y abrir la pagina no cambia ninguna bandera en la base

  @slice-1 @domain
  Escenario: Varios rituales suman puntos personales sin inflar la liga
    Dado que completo Sueño y Alimentacion en la misma fecha local
    Cuando consulto mis recompensas y la liga semanal
    Entonces recibo 10 puntos personales en cada ritual
    Y la liga suma un solo punto para esa fecha

  @slice-1
  Escenario: Un ritual completado permanece consultable
    Dado que complete cinco repeticiones de un ritual en su ventana
    Cuando vuelvo a su pilar despues de iniciar otro ritual
    Entonces veo el calendario completado, 50 puntos y su celebracion
    Y puedo administrar sus consentimientos sin reactivarlo
