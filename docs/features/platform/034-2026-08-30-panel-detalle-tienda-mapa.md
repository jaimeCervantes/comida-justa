# Panel de detalle de tienda desde el mapa

## Contexto

- **Problem:** al seleccionar una tienda del mapa de `/productos`, la experiencia actual manda a la pagina de la tienda o deja el detalle atrapado en un popup de Leaflet. Eso interrumpe la exploracion rapida del mapa.
- **Savings:** menos ida y vuelta entre paginas, menos frustracion y comparacion mas rapida entre tiendas cercanas.
- **Why:** el mapa debe servir como explorador local: seleccionar una tienda, entender lo esencial y decidir si abrir su pagina completa.

## Modelo acordado

El click en un marcador de tienda abre una ficha como parte del sitio, no como popup interno del mapa y no como navegacion automatica. En desktop se muestra como panel lateral; en movil, como panel inferior. La navegacion a `/tienda/[handle]` queda como una accion explicita.

## Slice 1 - Ficha visible al seleccionar una tienda

### Alcance

- Reemplazar el popup navegable del marcador de tienda por seleccion de estado en `StoresMapCanvas`.
- Pintar un panel externo al mapa dentro de `StoresMap`.
- En desktop, ubicar el panel a un lado del mapa.
- En movil, ubicar el panel abajo del mapa.
- Mostrar nombre de tienda, distancia cuando exista y un enlace explicito para abrir la pagina de la tienda.
- Permitir cerrar el panel.
- Mantener el marcador del visitante sin cambios de comportamiento.

### Fuera de alcance

- Cargar productos recientes dentro del panel.
- Agregar fotos, logo, telefono, horarios o reseñas.
- Cambiar la consulta de tiendas, el orden por cercania o los limites del mapa.
- Cambiar el mapa de rutas GPX o la pagina publica de tienda.

### Criterios de aceptacion

- Al abrir `/productos` con ubicacion compartida, el mapa aparece cuando hay tiendas cercanas.
- Al hacer click en un marcador de tienda, no cambia la URL.
- El panel de detalle aparece fuera del contenedor de Leaflet.
- El panel muestra el nombre de la tienda seleccionada y su distancia cuando existe.
- El panel tiene un enlace explicito a `/tienda/[handle]`.
- El panel se puede cerrar.

## Slice 2 - Enriquecer la ficha con datos comerciales

`@future`

### Alcance tentativo

- Incluir resumen de publicaciones de esa tienda si la consulta del catalogo puede entregarlo sin romper paginacion.
- Mostrar una vista breve de productos o servicios disponibles.
- Mantener el panel como una superficie de exploracion, no como sustituto de la pagina completa de tienda.

### Criterios de aceptacion tentativos

- El panel muestra informacion comercial util sin consultas duplicadas costosas.
- La pagina de tienda sigue siendo el lugar para el catalogo completo.

## Slice 3 - Seleccion persistente y accesibilidad fina

`@future`

### Alcance tentativo

- Revisar foco de teclado al abrir/cerrar.
- Evaluar si la tienda seleccionada debe reflejarse en query string para compartir el estado del mapa.
- Agregar estados de marcador seleccionado si el diseño lo pide.

### Criterios de aceptacion tentativos

- La seleccion se puede operar comodamente con teclado y lector de pantalla.
- Compartir o refrescar la pagina conserva el comportamiento esperado.
