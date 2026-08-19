# Feature: que en los cuatro pilares se pueda hacer algo, no solo comprar comida

Este documento es el **checkpoint de revisión** del roadmap. Escrito el **2026-08-16** con los datos
de la base a esa fecha.

## Problema / Savings / Why

- **Problema:** tres de los cuatro pilares son decorativos. `movimiento_y_ejercicio`,
  `mente_y_espiritu` y `sueno_y_descanso` existen en la taxonomía, están activos y tienen su página
  — y **cero publicaciones categorizadas**. Toda la maquinaria del sitio (precio, procedencia,
  disponibilidad, carrito, pedidos, chatbot, directorio) sirve para **vender mercancía**. Un grupo
  que corre, un taller de sueño o una consulta con la masajista no tienen dónde vivir: lo único que
  pueden hacer es escribir un texto que se hunde en un feed ordenado por reciente.
- **Savings:** deja de hacer falta el rodeo —fingir que un servicio es un producto, escribir la
  fecha del evento dentro del texto, dar el teléfono para que te agenden por WhatsApp a mano—. Y le
  quita al proveedor el trabajo de contestar "¿tienes hueco el jueves?" veinte veces.
- **Why:** el sitio promete cuatro pilares y entrega uno. Esto es lo que convierte "comida justa" en
  el sitio de bienestar que su propia taxonomía ya dice que es.

## Estado al escribir (2026-08-16)

| | |
|---|---|
| Categorías de nivel 1 (los pilares) | **4, las cuatro activas**: `alimentacion`, `movimiento_y_ejercicio`, `mente_y_espiritu`, `sueno_y_descanso` |
| Sub-categorías | **7, todas bajo `alimentacion`** |
| Publicaciones categorizadas | **15, todas bajo `alimentacion`** |
| Publicaciones | 27: 17 `producto` + 10 `anuncio` |
| Tipos de publicación | **2**: `anuncio`, `producto` |
| Tiendas | 2, ambas `category='Food'`, ambas con sucursal y coordenadas |
| Nada que exprese "cuándo ocurre" | `posts` solo tiene `created_at` |
| Nada que exprese "por dónde" | `branches.location` es un `POINT`; no hay líneas |
| Agenda, horarios, huecos | **no existe nada** |

## El hallazgo: la clasificación ya está lista; lo que falta es qué se puede hacer

No hay que crear los pilares — ya están, y las páginas `/pilares` ya leen publicaciones por
subárbol de categoría (`pillarLocalData.ts` usa `subtreeKeys` + `getPostsByCategory`, **sin filtrar
por tipo**). Es decir: **una publicación nueva bajo `movimiento_y_ejercicio` aparece sola en la
página de ese pilar**. No hay que enganchar nada.

Lo que falta es que existan cosas publicables que no sean mercancía.

## El modelo: 2 tipos nuevos, 2 atributos nuevos, y la cita no es un tipo

La lista inicial fue "servicio, cita con un doctor, evento, ruta, evento con ruta". Se colapsa,
porque cruzar dos ejes dentro de un enum lo duplica cada vez que aparece un atributo — el mismo
error que `origin` ya corrigió una vez (ver `productores-locales.md`):

| Lo pedido | Qué es en realidad |
|---|---|
| servicio | **tipo nuevo** |
| evento | **tipo nuevo** |
| ruta | **atributo** opcional, no un tipo |
| evento con ruta | un `evento` con la ruta puesta |
| cita con un doctor | **un pedido** de un `servicio`, con hora |

Y **ampliar `kind` es gratis**: se comprobó en la base que `posts.kind` es `text` **sin `CHECK`**
—los únicos dos checks de `posts` son el de sub-categoría y el de moderación—. La lista la valida
`isValidKind` en el dominio. Añadir un tipo cuesta una línea. Lo que cuesta es **el dato que cada
tipo necesita**.

### Qué regla le toca a cada tipo

| | anuncio | producto | servicio | evento |
|---|---|---|---|---|
| Qué es | contenido | algo que entregas | algo que **haces** | algo que **ocurre** |
| Precio | no | obligatorio > 0 | obligatorio | **opcional** (los hay gratis) |
| Procedencia | no | obligatoria | **no aplica** | **no aplica** |
| `starts_at` | no | no | no | **obligatorio** |
| Duración | no | no | **obligatoria** (define el hueco) | opcional |
| "No disponible" significa | nada | se me acabó | ya no lo ofrezco | **ya pasó** — lo decide el reloj |

**La procedencia no aplica a servicios ni eventos.** `origin` responde "¿lo haces o lo revendes?", y
eso solo significa algo en mercancía: un masaje siempre lo das tú. Copiar la regla de `producto`
sería pedir un dato vacío.

**Un evento no se agota, caduca.** Que el evento del sábado deje de aparecer como próximo el domingo
no lo decide nadie apagando una bandera: se deriva de `starts_at`. Es una regla del dominio, no una
columna.

## Lo que sale gratis (y por qué la ruta dejó de ser lo caro)

| Pieza | Ya existe |
|---|---|
| Publicar en un pilar | las páginas ya leen por subárbol de categoría, sin filtrar tipo |
| Fotos y vídeo | `post_media` con orden, dimensiones y portada |
| Pintar una línea en el mapa | `<Polyline>` de **react-leaflet, ya instalado** (`StoresMapCanvas`) |
| Los kilómetros de una ruta | `ST_Length` sobre `geography` devuelve metros; ya se usan `ST_Distance` y `ST_DWithin` |
| Ampliar `kind` | `text` sin `CHECK`: cero migración |
| Sub-categorías de los tres pilares | `/admin/catalogo` las crea **sin migración** |
| Cobrar y avisar al vendedor | carrito, checkout, `customer_orders`, aviso por WhatsApp |
| Saber por dónde pasó una cita | `customer_order_status_changes` (migración `0039`) |

**La ruta no es lo caro; el editor de dibujo lo era.** Con GPX se esquiva entero: quien corre ya
tiene su recorrido en Strava, Garmin o Wikiloc, exporta y sube — y el canal de subida a Cloud
Storage con URLs firmadas ya existe. Leer un GPX es leer `<trkpt lat lon>` de un XML: una función
pura del dominio, testeable sin base ni red.

## La agenda

Es la parte genuinamente nueva y la que más se puede diseñar mal.

### La disponibilidad cuelga del proveedor, no del servicio

Una masajista que ofrece "masaje 30 min" y "masaje 60 min" tiene **una sola agenda**: no puede dar
los dos a las 9:00. Si la disponibilidad colgara de cada publicación, dos servicios del mismo
proveedor se pisarían y nadie se enteraría hasta que se presentaran dos personas.

Así que: **el horario es del vendedor; la duración es del servicio.**

### Los huecos no se guardan, se derivan

Materializar cada hueco libre sería escribir un calendario infinito y mantenerlo sincronizado. Se
calculan al vuelo sobre la ventana que se está mirando (las próximas dos semanas):

```
huecos = horario semanal − excepciones − citas ya tomadas
```

Eso es una **función pura del dominio**: entra un horario, unas excepciones, unas citas y una
ventana; salen los huecos. Se prueba entera sin base de datos, que es exactamente donde se quiere
tener la lógica de un calendario.

### Que dos personas no puedan tomar el mismo hueco lo decide la base

Comprobar-y-luego-insertar pierde la carrera: dos peticiones simultáneas leen "libre" y las dos
escriben. Lo correcto es una **restricción de exclusión** de PostgreSQL sobre el rango de tiempo:

```sql
EXCLUDE USING gist (seller_id WITH =, during WITH &&) WHERE (status <> 'CANCELLED')
```

Con `during` como `tstzrange`, eso impide **solapamientos**, no solo inicios iguales — un `UNIQUE`
sobre la hora de inicio dejaría pasar una cita de 9:30 encima de una de 9:00 que dura una hora. El
`WHERE` es lo que permite que cancelar libere el hueco. Necesita la extensión `btree_gist`.

### La cita es un pedido, con su hora

Reusa el carrito o un botón de "Agendar", el checkout, el aviso al vendedor y la máquina de estados
que ya existe, que además le queda pintada:

`PENDING` (pedí la cita) → `CONFIRMED` (me la aceptaron) → `DELIVERED` (me atendieron) / `CANCELLED`

Y el histórico de la `0039` contesta gratis "¿cuándo me la confirmaron?". Una cita es **un pedido de
un solo renglón** con un `during`; esa es toda la diferencia.

## Cobertura por pilar cuando esto esté

| Pilar | Hoy | Con esto |
|---|---|---|
| `alimentacion` | 17 productos | + consulta nutricional (servicio), taller de cocina (evento) |
| `movimiento_y_ejercicio` | 0 | carrera y entrenamiento (evento **con ruta**), entrenador (servicio) |
| `sueno_y_descanso` | 0 | taller de higiene del sueño (evento), terapia (servicio) |
| `mente_y_espiritu` | 0 | meditación grupal, retiro (evento), terapia (servicio) |

## Slices

### Slice 1 — `evento` con su fecha

El único hueco sin ningún sustituto, y el que desbloquea los tres pilares huérfanos de un golpe. No
toca pedidos, ni mapas, ni Python. Escenarios en `src/e2e/eventos/eventos.feature`.

**Alcance:**

- **Migración**: `posts` gana `starts_at` y `ends_at`, las dos `timestamptz` **nullable** — solo un
  evento las usa, y las 27 filas existentes tienen que seguir intactas. Es la única migración del
  slice; el tipo en sí no cuesta nada porque `kind` es `text` sin `CHECK`.
- **Dominio**: `POST_KINDS` gana `evento`; `validateKindAndOrigin` gana su regla (fecha obligatoria,
  precio opcional, procedencia no aplica); y una función que derive el estado.
- **Los tres estados los decide el reloj**, no una bandera: `proximo`, `en_curso`, `pasado`. Con
  `ends_at` puesto, un evento sigue "en curso" mientras dura; sin él, caduca en su hora de inicio.
- **Formulario**: al elegir `evento`, aparece la fecha (obligatoria), el precio pasa a opcional y
  **desaparece el selector de procedencia**.
- **Tarjeta**: enseña cuándo, y distingue lo próximo de lo que ya pasó.
- **Sub-categorías** para los tres pilares vacíos desde `/admin/catalogo` — configuración, no código.

**Criterios de aceptación:**

1. Un grupo publica "Rodada del sábado en el kiosco" bajo `movimiento_y_ejercicio` y **aparece sola
   en la página de ese pilar**, sin enganchar nada: esas páginas ya leen por subárbol de categoría.
2. Lo mismo funciona para `sueno_y_descanso` y `mente_y_espiritu`, que hoy tienen cero.
3. Un evento **gratis** se publica; un evento **sin fecha** se rechaza.
4. A un evento **no se le pregunta la procedencia**.
5. El domingo, la rodada del sábado deja de anunciarse como próxima **sin que nadie toque nada** —
   pero sigue estando, con sus fotos.
6. Las 27 publicaciones existentes conservan su tipo y no tienen fecha; el inicio enseña lo mismo.

**Fuera de alcance a propósito:** **reordenar el feed** para que lo próximo suba. Hoy el inicio es
cronológico por `created_at`, y un evento publicado hace tres semanas para el sábado que viene queda
enterrado. Arreglarlo cambia el significado del feed para **todo** el catálogo, no solo para los
eventos, así que es una decisión aparte y no un detalle de este slice.

### Slice 2 — la ruta, por GPX *(entregado 2026-08-16)*

- `post_routes` (o columna) con `geography(LINESTRING,4326)`; los kilómetros los da `ST_Length`.
- Subir un `.gpx` y verlo pintado con `<Polyline>`; opcional en cualquier publicación, pero su casa
  natural es el `evento`.
- Dibujar a mano en el mapa queda **fuera**: es lo caro y el GPX lo aplaza.

### Slice 3 — `servicio` *(entregado 2026-08-16)*

- `kind` gana `servicio`: precio obligatorio, procedencia no aplica, duración obligatoria.
- Se puede pedir como se pide un producto. **Todavía sin agenda**: es una solicitud y el vendedor
  contesta, que es lo que ya hace hoy por WhatsApp.

### Slice 4 — la agenda *(base y cálculo entregados 2026-08-16; faltan pantallas)*

- Horario semanal del proveedor y sus excepciones.
- Cálculo de huecos como función pura del dominio.
- La cita como pedido con `during`, y la restricción de exclusión que impide solapamientos.
- Pantalla para elegir hueco, y para que el proveedor vea su día.

## Lo que este roadmap NO hace

- **Recurrencia.** Un grupo que corre cada sábado publica el próximo evento; "cada sábado hasta
  diciembre salvo el 25" es un calendario entero y no hace falta con dos tiendas.
- **Dibujar rutas a mano.** Slice 2 sube GPX; dibujar es otra feature.
- **Enseñarle los servicios al chatbot.** Su consulta es `WHERE kind = 'producto' AND is_available`,
  literal: un `servicio` no se lo va a ofrecer a nadie hasta que se toque Python. Conviene saberlo
  antes de publicar el primero y preguntarse por qué el bot lo ignora.
- **Cupo en los eventos.** "Quedan 3 lugares" es contar inscripciones, y primero hay que ver si
  alguien se inscribe.
- **Pagar la cita por adelantado.** El pago en línea sigue siendo una decisión aparte.
