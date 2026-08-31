# Panel de detalle de tienda desde el mapa

## Contexto

- **Problem:** al seleccionar una tienda del mapa de `/productos`, la experiencia actual manda a la pagina de la tienda o deja el detalle atrapado en un popup de Leaflet. Eso interrumpe la exploracion rapida del mapa.
- **Savings:** menos ida y vuelta entre paginas, menos frustracion y comparacion mas rapida entre tiendas cercanas.
- **Why:** el mapa debe servir como explorador local: seleccionar una tienda, entender lo esencial y decidir si abrir su pagina completa.

## Modelo acordado

El click en un marcador de tienda abre una ficha como parte del sitio, no como popup interno del mapa y no como navegacion automatica. En desktop se muestra como panel lateral flotante; en movil, como hoja inferior superpuesta. La navegacion a `/tienda/[handle]` queda como una accion explicita.

## Slice 2 - Panel superpuesto, sin desplazar contenido

### Alcance

- Cambiar la ficha para que se superponga al contenido del sitio en vez de ocupar espacio en el flujo.
- En movil, mostrarla como hoja inferior fija, con el catalogo visible detras.
- En desktop, mostrarla como panel flotante lateral sobre el contenido, sin reducir ni empujar el mapa.
- Mantener cierre, nombre, distancia y enlace explicito a la tienda.
- Mantener el panel fuera del contenedor de Leaflet.

### Fuera de alcance

- Agregar datos comerciales nuevos.
- Cambiar la consulta del mapa o el orden de tiendas.
- Persistir la tienda seleccionada en la URL.
- Convertir el panel en modal bloqueante de pantalla completa.

### Criterios de aceptacion

- Al seleccionar una tienda en movil, la ficha aparece fija en la parte inferior del viewport.
- La ficha se superpone sobre el contenido y no cambia la posicion vertical de la rejilla de productos.
- El contenido del catalogo sigue estando detras de la ficha.
- En desktop, la ficha aparece como panel flotante lateral y el ancho del mapa no se reduce.
- El panel sigue mostrando nombre, distancia, CTA a la tienda y cierre.

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

## Slice 3 - Enriquecer la ficha con datos comerciales

`@future`

### Alcance tentativo

- Incluir resumen de publicaciones de esa tienda si la consulta del catalogo puede entregarlo sin romper paginacion.
- Mostrar una vista breve de productos o servicios disponibles.
- Mantener el panel como una superficie de exploracion, no como sustituto de la pagina completa de tienda.

### Criterios de aceptacion tentativos

- El panel muestra informacion comercial util sin consultas duplicadas costosas.
- La pagina de tienda sigue siendo el lugar para el catalogo completo.

## Slice 4 - Seleccion persistente y accesibilidad fina

`@future`

### Alcance tentativo

- Revisar foco de teclado al abrir/cerrar.
- Evaluar si la tienda seleccionada debe reflejarse en query string para compartir el estado del mapa.
- Agregar estados de marcador seleccionado si el diseño lo pide.

### Criterios de aceptacion tentativos

- La seleccion se puede operar comodamente con teclado y lector de pantalla.
- Compartir o refrescar la pagina conserva el comportamiento esperado.
