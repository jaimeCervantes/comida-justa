# Agenda de cuenta usable

## Contexto

- **Problem:** `/cuenta/agenda` muestra dos formularios seguidos, con controles chicos y poca
  jerarquia; en movil cuesta distinguir el horario regular de las ausencias, y en desktop no hay un
  resumen que diga que hacer primero.
- **Savings:** menos frustracion y menos tiempo para declarar disponibilidad, revisar que quedo
  activo y anotar excepciones sin romper el horario semanal.
- **Why:** la agenda es una operacion diaria para quien vende servicios; si se entiende rapido, la
  cuenta se vuelve una herramienta de trabajo y no solo un panel de configuracion.

## Modelo acordado

La agenda sigue siendo del proveedor, no de cada servicio. El cambio no toca disponibilidad,
reservas, calculo de huecos ni persistencia: solo reorganiza la experiencia de
`/cuenta/agenda` para que el mismo modelo sea mas facil de usar en telefono y escritorio.

## Slice 1 - La agenda se entiende antes de editarla

### Scope

- Separar visualmente el horario semanal y las ausencias en bloques nombrados.
- Mostrar un resumen de estado con conteos simples: franjas semanales activas y ausencias proximas.
- Convertir las acciones principales en controles tactiles claros: agregar franja, guardar horario y
  agregar ausencia.
- Hacer que la misma ruta sea usable en viewport movil y desktop sin scroll horizontal.
- Mantener todos los textos localizados en `es` y `en`.

### Acceptance

- Una vendedora con tienda abre `/cuenta/agenda` y entiende que primero declara su semana tipo y
  despues anota excepciones.
- En movil y desktop, los bloques de horario semanal y ausencias se ven como secciones distintas,
  con acciones visibles y sin desbordar horizontalmente.
- Si no hay horario ni ausencias, los estados vacios explican que falta sin parecer error.
- Los formularios siguen enviando los mismos nombres de campo que las acciones actuales esperan.

## Slice 2 - Editar muchas franjas sin perder orientacion

### Scope futuro

- Agrupar o destacar franjas por dia cuando haya varias.
- Ayudar a detectar duplicados o tramos que se pisan antes de guardar, sin cambiar la validacion del
  servidor.
- Mejorar la lectura de ausencias existentes cuando la lista crezca.

### Acceptance futura

- Una agenda con varias franjas por semana se puede revisar por dia sin leer una lista larga de
  controles repetidos.
- Las ausencias proximas se leen como excepciones concretas, no como filas tecnicas.
