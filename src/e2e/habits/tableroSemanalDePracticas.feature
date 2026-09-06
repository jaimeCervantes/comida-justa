Feature: Tablero semanal de practicas

  Context:
  - Problem: la gamificacion actual existe, pero esta repartida entre pilares, practicas, habitos y
    jardin. Quien vuelve a practicar no ve de inmediato que hacer hoy ni cuanto avance semanal lleva.
  - Savings: se reduce la friccion diaria de practicar, se evita convertir salud en competencia y se
    hace visible el progreso propio sin obligar a navegar por varias pantallas.
  - Why: Hazlo Sano quiere que una persona vuelva a practicar y aporte al jardin de los cuatro
    pilares. La app debe premiar volver y sostener, no ganar contra otras personas.

  As a persona que ya eligio practicas de los cuatro pilares
  I want ver mi avance semanal y marcar lo de hoy desde Habitos
  So that pueda volver a practicar sin buscar el boton correcto en otra pagina

  @slice-1
  Scenario: El avance semanal aparece antes de los retos y las practicas
    Given Ana lleva la practica "Penumbra total" del pilar "Sueno"
    And Ana ya practico "Sueno" hoy
    When Ana abre "/habitos"
    Then ve "1 de 4 pilares cuidados hoy" antes de los retos disponibles
    And el pilar "Sueno" aparece como contado hoy
    And los otros tres pilares aparecen como pendientes hoy

  @slice-1
  Scenario: Una practica activa se puede marcar desde Habitos
    Given Ana lleva la practica "Penumbra total" del pilar "Sueno"
    And Ana todavia no practico "Sueno" hoy
    When Ana abre "/habitos"
    And marca "Penumbra total" como hecha
    Then ve "1 de 4 pilares cuidados hoy"
    And "Penumbra total" indica que hoy ya cuenta

  @slice-1
  Scenario: El tablero no promete doble aporte para el mismo pilar
    Given Ana lleva dos practicas activas del pilar "Sueno"
    And Ana ya practico "Sueno" hoy
    When Ana abre "/habitos"
    Then ambas practicas explican que el pilar ya cuenta hoy
    And ninguna ofrece sumar otro aporte para "Sueno"

  @slice-1 @component
  # Vitest y no Playwright: la ausencia de campeones se protege en el catalogo de textos y en el
  # dominio; este escenario afirma que el nuevo tablero no reintroduce lenguaje competitivo.
  Scenario: El tablero habla de avance propio, no de campeones
    Given el tablero semanal renderizado
    When se inspeccionan sus textos
    Then no contiene "campeon"
    And no contiene "ganador"
    And no contiene "primer lugar"

  @slice-2
  Scenario: Una persona decide que practica comparte en su perfil
    Given Ana lleva la practica "Penumbra total"
    And esa practica todavia es privada
    When Ana abre "/habitos"
    And activa compartir "Penumbra total"
    Then "Penumbra total" aparece como compartida
    And la practica queda disponible para su perfil publico
    When Ana deja de compartir "Penumbra total"
    Then "Penumbra total" vuelve a privada

  @slice-3
  Scenario: El perfil publico muestra practicas compartidas
    Given Ana lleva la practica "Penumbra total" y decidio compartirla
    And Ana lleva la practica "La descarga mental" pero sigue privada
    When un visitante abre "/u/e2e-practicas-ana"
    Then ve "Penumbra total" agrupada bajo "Sueno"
    And ve cuando y que basta para practicarla
    And no ve "La descarga mental"
    And el perfil no muestra puntos, ranking ni campeones

  @slice-4 @future
  Scenario: Un alias visible lleva al perfil publico
    Given una celebracion publica muestra el alias de una persona
    When un visitante activa ese alias
    Then llega al perfil publico de esa persona

  @slice-5 @future
  Scenario: El inicio muestra un pulso discreto de practica
    Given la comunidad tuvo actividad esta semana
    When un visitante abre el inicio
    Then ve una linea que enlaza al espacio de practica
