Feature: Practicas como publicaciones

  Context:
  - Problem: practicar queda escondido frente al feed y no recibe reconocimiento social suficiente.
  - Savings: menos pasos para compartir evidencia sana, mas reconocimiento sin rankings agresivos y
    menos ruido al separar check-ins simples de practicas publicadas.
  - Why: Hazlo Sano debe sentirse como una red social de cosas sanas, donde las acciones de cada
    pilar son visibles, faciles de repetir y apoyadas por la comunidad.

  As a persona que esta construyendo habitos sanos
  I want to publish practice evidence from the place where I already practice
  So that my healthy actions receive recognition and help others start

  @slice-1
  Scenario: Una practica con evidencia se publica en el feed
    Given Ana lleva la practica "Penumbra total" en el pilar "Sueño"
    When Ana agrega una foto como evidencia desde "/habitos" y publica
    Then ve que su practica fue publicada
    And el feed muestra una publicacion de practica con "Penumbra total", "Sueño", su descripcion y su evidencia
    And la publicacion ofrece empezar una practica relacionada

  @slice-1
  Scenario: El formulario de evidencia nace configurado por la practica
    Given Ana lleva la practica "Penumbra total" en el pilar "Sueño"
    When Ana abre el flujo de evidencia desde esa practica
    Then el formulario ya muestra "Penumbra total" y "Sueño"
    And no le pide tipo de publicacion, precio, fecha, duracion ni telefono

  @slice-1
  Scenario: La evidencia permite repetir el mismo pilar el mismo dia
    Given Ana ya practico "Sueño" hoy
    When Ana agrega otra evidencia para una practica de "Sueño" desde "/habitos"
    Then la nueva evidencia se guarda como otra publicacion de practica
    And el avance diario basico del pilar no promete contar dos veces sin evidencia

  @slice-1
  Scenario: Un check-in simple no crea publicacion social
    Given Ana lleva la practica "Penumbra total" en el pilar "Sueño"
    When Ana marca la practica como hecha sin evidencia desde "/habitos"
    Then su avance semanal se actualiza como hoy
    And el feed no recibe una publicacion nueva de practica

  @slice-2
  Scenario: El feed distingue una practica de una venta o evento
    Given Ana publico una practica con evidencia y tiene perfil publico
    When un visitante abre el feed
    Then la tarjeta se lee como actividad sana
    And la firma enlaza al perfil publico de Ana
    And enlaza a practicas para empezar algo parecido
    And no ofrece comprar, agendar ni pedir por WhatsApp
    When abre la publicacion
    Then el detalle la presenta como practica saludable
    And el CTA principal vuelve a practicas
    And no muestra telefono, precio, carrito ni agenda

  @slice-3
  Scenario: Una practica publicada recibe una reaccion de apoyo
    Given Ana publico una practica con evidencia
    When Luis reacciona a esa publicacion
    Then la publicacion muestra 1 apoyo
    And Luis puede retirar su reaccion
    And la reaccion no cambia el avance semanal ni crea puntos

  @slice-4 @future
  Scenario: Una practica publicada recibe comentarios moderados
    Given Ana publico una practica con evidencia
    When Luis comenta con una pregunta de apoyo
    Then el comentario aparece en el hilo de la publicacion
    And queda sujeto a moderacion y denuncia

  @slice-5 @future
  Scenario: La semana muestra practicantes destacados sin posiciones
    Given diez personas compartieron practicas con evidencia esta semana
    When un visitante abre el reconocimiento semanal
    Then ve practicantes destacados sin numeros de posicion
    And no ve ultimos lugares ni ganador unico
