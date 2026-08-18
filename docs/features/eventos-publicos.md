# Feature: eventos publicos y catalogo comercial claro

Checkpoint de revision escrito el 2026-08-18.

## Problema / Savings / Why

- **Problema:** los servicios ya existen y se agendan, pero no aparecen en una superficie comercial
  clara. Los eventos tambien existen, pero quedan repartidos entre feed, pilares y fichas sin una
  ruta publica por fecha.
- **Savings:** quien visita deja de adivinar donde comprar, agendar o asistir; y quien publica no
  tiene que explicar por WhatsApp donde esta su evento o su servicio.
- **Why:** el sitio ya no es solo catalogo de comida. Si la plataforma cubre cuatro pilares, la
  navegacion tiene que separar tres intenciones distintas: comprar productos, agendar servicios y
  asistir a eventos.

## Modelo acordado

- `/productos` conserva la URL por compatibilidad y SEO, pero la UI debe evolucionar a **Productos y
  servicios**: lista `producto` y `servicio`.
- `/eventos` es la agenda publica: lista `evento`, ordenado por `starts_at`, con lo proximo antes
  que lo pasado.
- `/pilares` sigue siendo transversal: muestra publicaciones por tema, sin convertir el pilar en una
  agenda ni en un carrito.

## Slice 1 - `/eventos` como listado publico de eventos

### Alcance

- Crear la ruta localizada `/eventos` (`/en/events` en ingles).
- Leer solo publicaciones `kind = "evento"`.
- Ordenar por fecha del evento, no por fecha de publicacion.
- Reutilizar `CardForList`, que ya sabe mostrar fecha de evento y no muestra carrito para eventos.
- Agregar metadatos y mensajes i18n del listado.

### Criterios de aceptacion

1. Un visitante abre `/eventos` y ve eventos publicados con su fecha visible.
2. La lista no incluye productos ni servicios.
3. El evento mas proximo aparece antes que uno mas lejano.
4. La ruta inglesa `/en/events` resuelve al mismo listado traducido.
5. Si no hay eventos, la pagina muestra un estado vacio traducido.

## Slice 2 - `/productos` lista productos y servicios *(entregado 2026-08-18)*

### Alcance

- Cambiar la consulta comercial de `kind = producto` a `kind in (producto, servicio)`.
- Cambiar textos visibles y metadata de `/productos` a **Productos y servicios**.
- Mantener la URL `/productos` y `/en/products`.
- Conservar CTAs diferenciados en las cards: producto al carrito, servicio a agendar.

### Criterios de aceptacion

1. Un servicio disponible aparece en `/productos`.
2. La card del servicio muestra `Agendar`, no `Agregar al carrito`.
3. Un producto sigue mostrando `Agregar al carrito`.
4. Los filtros por pilar siguen funcionando sobre productos y servicios.
5. Los textos y metadatos ya no prometen solo productos.

## Fuera de alcance

- Inscripcion o cupo para eventos.
- Pagar eventos por adelantado.
- Cambiar el home para destacar eventos proximos.
- Renombrar fisicamente la ruta `/productos`; la compatibilidad pesa mas que la pureza del nombre.
