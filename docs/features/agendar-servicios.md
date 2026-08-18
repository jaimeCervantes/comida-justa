# Agendar servicios

## Alignment

- Problem: despues de agendar un servicio, la persona no recibe una explicacion clara de que se creo
  un pedido/cita real ni donde volver a verlo.
- Savings: menos incertidumbre, menos mensajes manuales para confirmar si "si quedo" y menor riesgo
  de perder citas ya registradas.
- Why: los servicios con agenda no deben pasar por carrito; elegir un horario crea directamente una
  cita/pedido que comprador y vendedor gestionan en pedidos.

## Slice roadmap

### Slice 1 - Confirmacion con salida a pedidos

Scope:
- Cuando un servicio se agenda correctamente, la ficha muestra que la cita ya quedo agendada.
- La confirmacion explica que la cita se consulta en pedidos e incluye un enlace a
  `/pedidos?vista=placed`.
- La accion de agendar conserva el flujo actual: crea directamente un pedido con horario, sin pasar
  por carrito.

Acceptance criteria:
- Despues de pulsar "Agendar" en un servicio con espacios libres, aparece una confirmacion clara.
- La confirmacion incluye un enlace a "Mis pedidos" que apunta a `/pedidos?vista=placed`.
- El contador del carrito no cambia por agendar un servicio.

### Slice 2 - Las cards de servicio llevan a agendar

Scope:
- Las tarjetas/listados que usan `CardForList` muestran "Agendar" para servicios disponibles.
- Las tarjetas de servicios no muestran "Añadir al carrito".
- El CTA de la tarjeta lleva al detalle del servicio; ahi se elige el horario real.
- Los productos conservan "Añadir al carrito".

Acceptance criteria:
- Una card de servicio disponible muestra "Agendar" y enlaza a su detalle.
- Esa misma card no muestra "Añadir al carrito".
- Una card de producto disponible sigue mostrando "Añadir al carrito".

### Slice 3 - Horario visible en listas y detalle de pedidos

Scope:
- Leer `customer_orders.during` en el repositorio de pedidos.
- Mostrar fecha y hora de cita en `/pedidos?vista=placed`, `/pedidos?vista=received` y
  `/pedido/[id]` cuando el pedido tenga horario.

Acceptance criteria:
- Comprador y vendedor distinguen una cita sin abrir conversaciones externas.
- Los pedidos de producto siguen viendose sin bloque de cita.
