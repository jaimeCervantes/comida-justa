# Asistencia a eventos

## Alineacion

- Problem: un evento ya tiene fecha y ficha, pero la persona interesada no tiene una accion clara
  para avisar que quiere asistir, y quien lo publica no recibe un mensaje con el contexto del
  evento.
- Savings: reduce coordinacion manual por WhatsApp, evita mensajes incompletos y obliga a que la
  intencion venga de una cuenta iniciada, no de visitantes anonimos.
- Why: los eventos deben ser participables desde la plataforma. La ficha no solo informa cuando
  ocurre; tambien debe abrir el camino para asistir y, despues, confirmar asistentes.

## Roadmap de slices

### Slice 1 - Avisar al creador por WhatsApp con sesion

Alcance:

- La ficha de una publicacion `evento` muestra un CTA visible para avisar que la persona quiere
  asistir.
- Si quien mira no tiene sesion, el CTA lleva a `/auth/signin` con `callbackUrl` de regreso a la
  ficha.
- Si quien mira tiene sesion, el CTA abre WhatsApp al telefono de contacto de la publicacion con un
  mensaje prellenado que incluye titulo, horario y enlace.
- El CTA no aparece para productos ni servicios, y no aparece si el evento no tiene telefono de
  contacto util.

Criterios de aceptacion:

- Un visitante anonimo ve la intencion de asistir, pero al pulsarla entra primero a iniciar sesion.
- Un usuario autenticado puede abrir WhatsApp con un mensaje que identifica exactamente el evento.
- La hora del evento viaja en el mensaje, no solo el titulo.
- Productos y servicios conservan sus acciones actuales sin este CTA.

### Slice 2 - Confirmar "Voy a asistir"

Alcance:

- Un usuario con sesion marca o cancela su asistencia desde la ficha del evento.
- La asistencia queda persistida y se refleja en un contador.
- El visitante anonimo ve la accion, pero entra a iniciar sesion antes de poder confirmar.

Criterios de aceptacion:

- El mismo usuario no puede duplicar su asistencia.
- Cancelar asistencia baja el contador.
- El contador se mantiene al recargar la pagina.

### Slice 3 - Lista de asistentes para el creador

Alcance:

- El creador del evento ve la lista de personas que confirmaron asistencia.
- Visitantes y otros usuarios ven solo el contador, salvo que se decida abrir la lista publicamente.

Criterios de aceptacion:

- El creador identifica quien confirmo asistencia sin revisar chats.
- La lista no expone asistentes a usuarios no autorizados si se mantiene privada.

## Notas de modelo

- Slice 1 no crea asistencia persistida. Es una intencion comunicada por WhatsApp y gated por
  sesion.
- Slice 2 introduce el modelo persistente de RSVP/asistencia.
- Slice 3 decide la visibilidad de la lista; por defecto se asume privada para el creador.
