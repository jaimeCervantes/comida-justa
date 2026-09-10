Feature: Citas de servicios

  Context:
  - Problem: una cita se guarda como pedido con horario, pero cliente y proveedor la vuelven a ver
    mezclada con pedidos genericos.
  - Savings: menos citas olvidadas y menos mensajes para confirmar que servicio, con quien y a que
    hora.
  - Why: reservar un horario crea una obligacion concreta para dos personas; la plataforma debe
    recordarla como cita aunque tecnicamente siga siendo un pedido.

  As a customer and service provider
  I want scheduled service orders to appear as appointments
  So that both sides can remember what is booked and who is involved

  @slice-1
  Scenario Outline: Cliente y proveedor ven sus citas de servicio
    Given la tienda "E2E Agenda Sana" ofrece el servicio "E2E Masaje de recuperacion" con agenda
    And una clienta agenda un hueco disponible
    When "<actor>" abre "<path>" en un viewport "<viewport>"
    Then ve la cita con "E2E Masaje de recuperacion"
    And ve "<counterparty>" como la otra parte de la cita
    And ve la fecha y hora reservada
    And puede abrir el pedido que respalda la cita
    And la pantalla no necesita scroll horizontal

    Examples:
      | actor     | path                     | viewport | counterparty      |
      | clienta   | /citas                   | mobile   | E2E Agenda Sana   |
      | proveedora | /cuenta/agenda?tab=citas | desktop  | clienta de prueba |

  @slice-1
  Scenario: Los pedidos sin horario no entran en Mis citas
    Given una clienta tiene un pedido normal de "E2E Pan de caja"
    When abre "/citas"
    Then no ve "E2E Pan de caja" como cita
    And puede seguir consultandolo desde "/pedidos"

  @slice-2
  Scenario: La cita usa lenguaje de cita desde que se agenda hasta WhatsApp
    Given la tienda "E2E Agenda Sana" ofrece el servicio "E2E Masaje de recuperacion" con agenda
    And una clienta elige un hueco disponible
    When confirma la reserva
    Then la confirmacion dice que la cita quedo agendada
    And el enlace principal lleva a "/citas"
    When abre el respaldo de la cita
    Then el detalle se presenta como "Cita agendada"
    And muestra la fecha y hora reservada
    And el mensaje de WhatsApp dice que es una cita de servicio con fecha y hora

  @slice-3 @future
  Scenario: La ficha del servicio muestra dias y horas disponibles
    Given la tienda "E2E Agenda Sana" atiende de lunes a viernes
    When una clienta abre el servicio "E2E Masaje de recuperacion"
    Then elige primero un dia disponible y despues una hora

  @slice-4 @future
  Scenario: La proveedora revisa sus citas en una semana
    Given la proveedora tiene citas y ausencias en la misma semana
    When abre el calendario de agenda
    Then distingue citas con clientes de ausencias propias
