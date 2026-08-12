# language: es

# Context:
# - Problem: el inicio solo recupera el ultimo logro aunque existan celebraciones de varios pilares.
# - Savings: evita que el esfuerzo compartido parezca perdido y reduce busquedas manuales.
# - Why: la comunidad debe reflejar los cuatro pilares y reconocer cada hito voluntario.

Característica: Lista de celebraciones publicas
  Como visitante de la comunidad
  Quiero ver varios logros compartidos recientemente
  Para reconocer la practica de distintos pilares sin que un logro sustituya a otro

  @slice-1
  Escenario: Los cuatro pilares conservan su propia tarjeta
    Dado que Healthy Food compartio su primer hito de Sueño, Alimentacion, Movimiento y Mente/Espiritu
    Cuando una persona abre el inicio
    Entonces ve cuatro celebraciones ordenadas de la mas reciente a la mas antigua
    Y cada tarjeta conserva el color, texto y destino de su pilar

  @slice-1 @integration
  Escenario: La consulta publica limita la portada a ocho hitos
    Dado que existen nueve celebraciones publicas entre Healthy Food y Jaime Cervantes
    Cuando se consulta la portada comunitaria
    Entonces se devuelven las ocho mas recientes en orden estable
    Y la celebracion mas antigua no aparece

  @slice-1
  Escenario: Retirar un logro no oculta los otros pilares
    Dado que Healthy Food compartio celebraciones de Sueño y Alimentacion
    Cuando deja de compartir la celebracion de Sueño
    Entonces la tarjeta de Sueño desaparece
    Y la tarjeta de Alimentacion permanece visible

  @slice-1 @component
  Escenario: Cada celebracion mantiene su reaccion independiente
    Dado una lista con celebraciones de Alimentacion y Movimiento
    Cuando la persona celebra la tarjeta de Alimentacion
    Entonces Alimentacion muestra la opcion de retirar su celebracion
    Y Movimiento conserva su contador y la opcion de celebrar

  @slice-2
  Esquema del escenario: El progreso heredado se puede compartir desde sus repeticiones
    Dado un progreso de Alimentacion con <repeticiones> repeticiones y el marcador "<marcador>" vacio
    Cuando Healthy Food intenta compartir "<hito>"
    Entonces la publicacion queda "<resultado>"

    Ejemplos: hitos permitidos por progreso real
      | repeticiones | marcador                 | hito              | resultado |
      | 1            | first_cycle_completed_at | first_cycle       | publicada |
      | 5            | final_completed_at       | challenge_completed| publicada |

    Ejemplos: hitos rechazados antes de alcanzarlos
      | repeticiones | marcador                 | hito              | resultado   |
      | 0            | first_cycle_completed_at | first_cycle       | no publicada|
      | 1            | final_completed_at       | challenge_completed| no publicada|

  @slice-3 @future
  Escenario: La persona carga celebraciones anteriores sin duplicados
    Dado que existen mas de ocho celebraciones publicas
    Cuando solicita ver actividad anterior
    Entonces aparecen mas tarjetas sin repetir las que ya estaban visibles
