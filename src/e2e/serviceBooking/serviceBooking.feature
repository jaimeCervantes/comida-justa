Feature: Agendar servicios

  Context:
  - Problem: despues de agendar un servicio, la persona no sabe con claridad si se creo una cita real ni donde consultarla.
  - Savings: menos incertidumbre y menos mensajes manuales para confirmar o reencontrar la cita.
  - Why: los servicios con agenda crean pedidos con horario directamente; no pasan por carrito.

  As a signed-in visitor
  I want a clear confirmation after booking a service
  So that I know where to see the appointment later

  @slice-1
  Scenario: La cita agendada explica donde consultarla
    Given a signed-in user opens the service "E2E Masaje de recuperacion" with available schedule slots
    When the user books the next full available slot
    Then the service confirms the appointment was scheduled
    And the confirmation links to "/pedidos?vista=placed"
    And the cart count stays empty

  @future @slice-2
  Scenario: Comprador y tienda ven el horario de la cita en pedidos
    Given a user booked "E2E Masaje de recuperacion"
    When buyer and seller open their order lists
    Then both see the appointment date and time
