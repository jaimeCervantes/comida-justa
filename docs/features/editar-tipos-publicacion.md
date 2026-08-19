# Editar cualquier tipo de publicacion

## Contexto

- Problem: la pantalla de edicion no carga ni guarda los campos propios de eventos y servicios. Un evento pierde su fecha/ruta al editarse desde el formulario, y un servicio no puede corregir su duracion; eso fuerza rodeos o republicar.
- Savings: se evita re-publicar desde cero, se reducen errores de datos incompletos y se baja la friccion de mantener publicaciones vivas.
- Why: si el sitio permite publicar productos, anuncios, eventos y servicios, tambien debe permitir administrarlos sin romper el significado de cada tipo.

## Slices

### Slice 1 - Eventos y servicios editables con sus campos propios

Scope:
- La ruta `/editar/[slug]` carga los campos especificos guardados para `evento` y `servicio`.
- El formulario muestra los mismos controles aplicables que `/publicar`, sin permitir cambiar `kind`.
- La accion de edicion persiste `startsAt`, `endsAt` y `durationMinutes` segun el tipo guardado.
- La validacion del use case usa las mismas reglas de dominio que publicar para evento y servicio.
- El precio se mantiene editable para producto, evento y servicio; anuncio puede seguir sin precio.
- El recorrido GPX de evento se conserva cuando no se toca; reemplazarlo o quitarlo queda fuera de
  este slice.

Acceptance criteria:
- Un evento sembrado con fecha abre `/editar/<slug>` con inicio, fin y precio prellenados.
- Guardar ese evento con otra fecha actualiza `posts.starts_at`, `posts.ends_at` y conserva su tipo.
- Un servicio sembrado con precio y duracion abre `/editar/<slug>` con ambos campos prellenados.
- Guardar ese servicio con otra duracion actualiza `posts.duration_minutes` y conserva su tipo.
- Intentar guardar un evento sin inicio o un servicio sin duracion muestra error en el formulario.

### Slice 2 - Edicion completa de ruta de evento

Scope:
- Mostrar si un evento ya tiene recorrido guardado.
- Permitir quitar el recorrido existente sin subir otro.
- Mantener el recorrido existente al guardar cambios no relacionados.

Acceptance criteria:
- Guardar solo texto/fecha de un evento con ruta conserva `post_routes`.
- Quitar el recorrido desde la UI elimina `post_routes`.
- Subir un GPX nuevo reemplaza `post_routes`.

### Slice 3 - Matriz de regresion por tipo

Scope:
- Cubrir que `producto`, `anuncio`, `evento` y `servicio` se pueden abrir y guardar desde `/editar/[slug]`.
- Confirmar que `kind` no cambia en ningun caso.

Acceptance criteria:
- Cada tipo conserva sus campos propios y limpia los campos que no aplican.
- La navegacion vuelve al detalle de la publicacion despues de guardar.

### Slice 4 - La agenda se ve junto a las acciones del servicio

Scope:
- El selector de espacios de agenda se muestra dentro del detalle de un servicio, debajo del bloque
  de acciones de la publicacion: carrito, WhatsApp y compartir.
- Los comentarios, reportes y publicaciones relacionadas quedan despues de la decision principal de
  agenda.
- No cambia el calculo de espacios ni el modelo de carrito; solo la colocacion de la accion de
  agendar.

Acceptance criteria:
- En `/descanso-reparador`, si hay espacios disponibles, el bloque "Elige tu hora" aparece despues
  del boton de compartir y antes de "Comentarios".
- Agregar al carrito no pide horario; la seleccion de horario vive en el detalle del servicio.

### Slice 5 - Validaciones coherentes por tipo al publicar y editar

Scope:
- Publicar y editar comparten la misma matriz visible de campos por tipo.
- `anuncio` no muestra precio, procedencia, fechas ni duracion.
- `producto` exige precio y procedencia.
- `evento` exige inicio, permite fin opcional y precio opcional.
- `servicio` exige precio y duracion, sin procedencia ni fechas.
- Las Server Actions devuelven errores de campo para precio, procedencia, fecha y duracion antes de
  caer a errores genericos del dominio.

Acceptance criteria:
- Al publicar un servicio sin duracion se muestra el error de duracion, no un error de precio.
- Al publicar o editar un servicio, precio y duracion aparecen como requeridos.
- Al publicar o editar un anuncio, el campo precio no aparece.
- Producto, evento y servicio no muestran campos que no aplican a su tipo.

### Slice 6 - Edicion completa de los campos comunes de contacto

Scope:
- La edicion muestra el telefono/WhatsApp de contacto que se capturo al publicar.
- Guardar cambios actualiza `posts.contact_phone` junto con texto, precio, categoria, fechas,
  duracion y media.
- El telefono se exige en la Server Action de edicion igual que al publicar.
- La normalizacion por tipo se mantiene: servicios editan precio y duracion; anuncios limpian precio
  aunque una peticion forjada lo mande.
- La edicion de ruta GPX de evento sigue fuera de alcance por ahora.

Acceptance criteria:
- Un servicio abre `/editar/[slug]` con precio, duracion y telefono prellenados.
- Guardar un servicio con otro precio, otra duracion y otro telefono persiste los tres campos.
- Todos los tipos muestran el telefono como campo requerido.
- Un anuncio no conserva precio si una peticion manipulada intenta enviarlo.
