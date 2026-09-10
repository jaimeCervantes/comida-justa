# Citas de servicios

## Contexto

- **Problem:** cuando una persona agenda un servicio, la base lo guarda como pedido con horario, pero
  la experiencia lo sigue tratando como un pedido generico. El cliente no tiene una forma clara de
  recordar que servicio agendo, cuando es, ni quien lo atiende; quien da el servicio tampoco tiene
  una vista diaria clara de sus citas con clientes.
- **Savings:** menos mensajes de aclaracion, menos citas olvidadas y menos tiempo buscando entre
  pedidos para saber que toca atender o recibir.
- **Why:** los servicios no se consumen como productos. Si la plataforma ya permite reservar un
  horario, tambien debe dar una memoria operativa de esas reservas para cliente y proveedor.

## Modelo acordado

Una cita sigue siendo un pedido con `during`: no se crea una tabla nueva ni una migracion desde este
repo. La UI debe nombrarla como cita cuando tiene horario, pero conservar el enlace al pedido y sus
estados para no partir el flujo actual de confirmacion, preparacion, entrega o cancelacion.

## Slice 1 - Mis citas aparecen separadas de pedidos genericos

### Scope

- Crear una superficie de "Mis citas" dentro de la seccion de cuenta, reutilizando los pedidos con
  `during`.
- Para cliente: listar sus servicios agendados con fecha/hora, servicio, proveedor/tienda, estado y
  acceso al pedido.
- Para proveedor: listar las citas que debe atender con fecha/hora, servicio, cliente y acciones de
  estado existentes.
- Separar proximas y pasadas/cerradas con una jerarquia simple de lista, no calendario todavia.
- Leer `during` desde `customer_orders` en el repositorio de pedidos y propagarlo como dato de
  dominio/presentacion.
- Mantener `/pedidos` como historial general; "Mis citas" es el lente para lo que tiene horario.

### Acceptance

- Una clienta que agenda "Masaje de recuperacion" ve una entrada de cita con el nombre del servicio,
  la tienda "E2E Agenda Sana", la fecha/hora reservada y un enlace al pedido.
- Una proveedora que abre su cuenta ve las citas recibidas con el cliente y la hora que debe atender.
- Un pedido sin `during` no aparece en "Mis citas"; sigue viviendo en `/pedidos`.
- La vista funciona en movil como tarjetas apiladas y en desktop como una lista escaneable sin
  scroll horizontal.

## Slice 2 - Elegir horario con calendario ligero en la ficha del servicio

### Scope futuro

- Reemplazar el selector plano de huecos por dias disponibles y horas como botones.
- Mostrar un estado vacio por dia cuando no haya huecos libres.
- Mantener el calendario mensual fuera si no aporta claridad en movil.

### Acceptance futura

- Una persona que quiere reservar entiende primero que dias tienen disponibilidad y despues elige
  una hora.
- En movil puede cambiar de dia sin abrir un desplegable largo de horarios.

## Slice 3 - Calendario operativo del proveedor

### Scope futuro

- Agregar una vista semanal para quien da servicios.
- Mostrar citas tomadas y ausencias en el mismo calendario, con distinto tratamiento visual.
- Mantener la edicion de disponibilidad separada de las citas reales.

### Acceptance futura

- La proveedora puede responder "a quien atiendo hoy y a que hora" desde una vista semanal.
- Las ausencias no se confunden con citas, pero ocupan el mismo espacio temporal.

## Slice 4 - Recordatorios y exportacion

### Scope futuro

- Evaluar recordatorios por WhatsApp/correo o archivo `.ics`.
- No sincronizar calendarios externos hasta que el flujo base de citas sea estable.

### Acceptance futura

- Cliente y proveedor pueden llevar la cita fuera del sitio sin perder el enlace al pedido.
