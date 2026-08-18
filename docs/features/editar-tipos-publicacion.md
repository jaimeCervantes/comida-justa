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
- El recorrido GPX de evento puede reemplazarse cuando se sube uno nuevo y se conserva cuando no se toca.

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

