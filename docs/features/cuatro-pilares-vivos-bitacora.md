# Bitácora — que en los cuatro pilares se pueda hacer algo

Append-only. Cada entrada narra el **porqué**; el qué ya lo cuenta `git log`.

---

## 2026-08-16 — Slice 1: `evento` con su fecha

### Objetivo

Que exista algo publicable que no sea mercancía, para que los tres pilares decorativos
—`movimiento_y_ejercicio`, `mente_y_espiritu`, `sueno_y_descanso`, con **cero** publicaciones cada
uno— puedan tener contenido propio.

### El plan cambió dos veces antes de escribir código, y las dos veces a mejor

Empezó como "grupos": una entidad nueva para los grupos que corren. El usuario lo redirigió —"se
parece mucho a la tienda, lo que falta es publicar el **tipo**"— y con eso el trabajo se movió de
`sellers` a `posts.kind`, que es donde estaba el hueco real.

Después su lista de cinco tipos (servicio, cita, evento, ruta, evento con ruta) **se colapsó a dos
tipos y dos atributos**. "Evento con ruta" como tipo propio es cruzar dos ejes dentro de un enum, el
mismo error que `origin` ya corrigió una vez: si existe, mañana hacen falta "servicio con cita" y
"evento sin ruta pero con cita". La ruta es un **atributo**; la cita es un **pedido**, no un tipo.

### Lo que la investigación ahorró

- **Los cuatro pilares ya eran las categorías de nivel 1**, activas. No había que crearlos.
- **`/pilares` ya lee publicaciones por subárbol de categoría, sin filtrar por tipo**
  (`pillarLocalData.ts`). Un evento aparece en su pilar **sin enganchar nada**. Fue el hallazgo que
  hizo barato el slice.
- **`posts.kind` es `text` sin `CHECK`**: sumar el tipo no cuesta migración. Lo caro nunca fue el
  tipo, es el dato que necesita.
- **Las sub-categorías se crean sin migración** desde `/admin/catalogo`: configuración, no esquema.

### Decisiones y por qué

**`starts_at` y `ends_at` nullable.** Solo un evento las usa. Inventarles fecha a los 17 productos y
10 anuncios sería afirmar que ocurrieron a una hora. Que sean nulas es lo que hace que aplicar la
migración no cambie nada.

**Que un evento SÍ necesite fecha es una regla del tipo, no un `CHECK`.** La base no sabe qué es un
evento; ponerlo ahí obligaría a migrar cada vez que un tipo cambie de reglas. Vive en
`PostValidator.validateKindAndOrigin`, al lado de las de `producto`. Lo único que la base sí afirma
es que el fin no vaya antes del inicio: un rango al revés no es negocio discutible, es dato roto.

**Tres estados, no dos.** Una rodada de 6:00 a 8:00 no está "pasada" a las 7:00 — está ocurriendo,
que es justo cuando alguien mira el móvil para ver si todavía llega. `proximo` / `en_curso` /
`pasado`, y sin `ends_at` un evento caduca en su hora de inicio: se prefirió eso a inventarle una
duración por omisión, que sería adivinar cuánto dura algo que no sabemos qué es.

**El estado se deriva del reloj, y por eso `EventDate` es Client Component.** Si lo calculara el
servidor, una página cacheada seguiría diciendo "Próximo" al día siguiente — exactamente el problema
que esta feature vino a resolver. Es la razón entera de que ese componente lleve `"use client"`.

**A un evento no se le pregunta la procedencia.** `origin` responde "¿lo haces o lo revendes?" y eso
solo significa algo en mercancía. Una meditación no se revende.

**El tipo se resuelve contra la allowlist, no contra un literal.** La acción hacía
`=== "producto" ? "producto" : DEFAULT`; ahora usa `isValidKind`. Así sumar un tipo no exige
acordarse de tocar también esa línea, que es justo lo que se olvidaría.

### Archivos tocados

- **Backend**: `alembic/versions/0042_2026-08-16_add_post_event_dates.py`.
- **Dominio**: `entities/post/event.ts` + prueba (estados), `kind.ts` (+`evento`, `EVENT_KIND`),
  `types.ts`, `schemas/PostValidator.ts` + prueba.
- **Infra**: espejo Drizzle, `PostgresPostRepository` (escritura), `PostgresPostQueryRepository` y
  `PostgresGetOnePost` (lectura), `mapPostsToCards`.
- **App/presentación**: `publicar/PublishForm.tsx` y `actions.ts`, `presentation/post/EventDate/`
  + prueba, `CardForList`, `[slug]/ui/PostDetail.tsx`, los dos catálogos.
- **Datos**: `scripts/seedPillarSubcategories.ts` (idempotente) y su `pnpm run`.
- **Especificación**: `docs/features/cuatro-pilares-vivos.md`, `src/e2e/eventos/`.

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `uv run alembic upgrade head` | `0041 → 0042`; dos columnas y un `CHECK`; **27/27 publicaciones intactas, 0 con fecha**; el `CHECK` rechazó un rango invertido |
| Ida y vuelta contra la base real | evento guardado, **leído en su pilar** por `getPostsByCategory`, estados `proximo`/`en_curso`/`pasado` correctos, y borrado |
| `pnpm run seed:pillar-subcategories` | 10 sub-categorías creadas (movimiento 4, sueño 3, mente 3). Segunda corrida: **0** — es idempotente |
| `pnpm run test:run` | **1773/1773**, 171 archivos (antes del slice: 1766 en 170) |
| `pnpm run test:e2e:run -- src/e2e/eventos` | **5/5** |
| `typecheck`, `typecheck:tests`, `lint`, `check:i18n`, `check:directives` | limpios |

**Escrito en la base compartida:** dos columnas nullable y un `CHECK` sobre `posts`, más 10 filas de
configuración en `categories`/`category_translations`. La migración se deshace con
`uv run alembic downgrade 0041_2026_08_16`. Ninguna publicación cambió de valor.

### Desviaciones

1. **Un fallo de e2e que era real y no de la prueba.** Había puesto `EventDate` en la tarjeta del
   listado pero **no en la ficha**, que es donde aterriza quien recibe el enlace por WhatsApp — el
   sitio exacto donde más importa saber si todavía se puede ir. Lo destapó el escenario que abre
   `/{slug}`.
2. **Las sub-categorías se sembraron por script** en vez de a mano por el panel. Diez altas a mano
   son diez oportunidades de escribir mal una clave, y el script queda como registro de cuáles son.

### Recap

Un evento ya se puede publicar con su fecha y aparece **solo** en la página de su pilar, porque esas
páginas ya leían por categoría. Los tres pilares que estaban vacíos tienen sub-categorías donde
colgar cosas. El formulario pregunta la fecha solo cuando toca, deja el precio opcional y esconde la
procedencia. Y la fecha se pinta con su estado —próximo, ocurriendo, ya pasó— derivado del reloj en
el cliente, así que la rodada del sábado deja de anunciarse el domingo **sin que nadie apague nada**.

### Próximos pasos (opciones)

1. **Slice 2 — la ruta por GPX.** `<Polyline>` ya está instalado y `ST_Length` da los kilómetros; lo
   caro (dibujar a mano en el mapa) queda fuera a propósito.
2. **Slice 3 — `servicio`**, y luego el 4, la agenda con su restricción de exclusión.
3. **Reordenar el feed** para que lo próximo suba. Se dejó fuera del slice 1 porque cambia el
   significado del inicio para **todo** el catálogo, no solo para los eventos.

**Pendiente del usuario:** nada de este slice. Sigue abierto lo de los comentarios, en
`pendientes.md`.

---

## 2026-08-16 (noche) — Slice 2: la ruta, por GPX

### Objetivo

Que un evento pueda decir **por dónde**, no solo cuándo. `branches.location` es un `POINT` —sirve
para el punto de reunión— y una ruta es una línea.

### El GPX es lo que hace barata esta feature

El roadmap la llamaba "la cara" porque asumía un editor de mapa. Quien corre ya tiene su recorrido
en Strava, Garmin o Wikiloc: exporta y sube. Eso aplaza el editor entero, que sigue fuera de alcance.

Y **el archivo no se guarda**: se le saca el trazo y se tira. Por eso viaja en el propio formulario
en vez de pasar por Cloud Storage como las fotos — de un GPX solo interesan los puntos.

### Decisiones y por qué

**Parser propio, sin dependencia de XML.** Mismo criterio que `GeminiTranslationService` ("~40
líneas contra una dependencia más"): de un GPX solo hacen falta los pares `lat`/`lon` en orden. Un
parser completo traería namespaces, entidades y validación de esquema para leer dos atributos.
Acepta `trkpt` y `rtept`, y **no asume el orden de los atributos** — hay exportadores que ponen `lon`
primero, y un parser que lo asumiera fallaría solo con algunos relojes, que es el peor fallo posible.

**Un punto ilegible se salta; el archivo no.** Un GPX de 7.000 puntos con uno corrupto sigue siendo
una ruta perfectamente utilizable.

**Se reduce a 2.000 puntos, pero se mide sobre todos.** Una carrera grabada cada segundo trae
~7.000 puntos y las hay de 50.000 (~800 KB). Dibujar eso en una pantalla de 1.000 píxeles no se ve
mejor. Pero **la distancia se calcula antes de reducir**: quien corre sabe si su ruta son 8 km o
7,6, y encoger el número con cada punto descartado sería mentirle. El dibujo solo tiene que
parecerse; el número tiene que ser fiel. Y se conservan siempre el primero y el último, porque
perder el último movería el final de la ruta.

**Tabla aparte, pero por una razón distinta a la del slice 1 de moderación.** Allí fue cardinalidad
(1:N); aquí es **tamaño**: una ruta son ~32 KB, el valor más grande del esquema, y `posts` es la
tabla que leen el feed, la búsqueda, el sitemap, la tienda y el bot. La clave primaria es el
`post_id`, así que el 1:1 lo impone la forma de la tabla: dos rutas para una publicación no son un
caso a resolver más tarde, son un imposible.

**`spatial_index=False` explícito.** GeoAlchemy2 crea un índice espacial por omisión —así apareció
el de `branches.location`, sin que ninguna migración lo pidiera—. La única lectura de hoy es por
clave primaria, así que no hace falta; pero un índice implícito que contradijera el docstring sería
peor que cualquiera de las dos decisiones.

**Haversine sobre esfera, y la diferencia está medida.** PostGIS sobre `geography` usa el elipsoide
WGS84: en la comprobación cruzada dio **2.203 m** donde el dominio dio **2.213** — un 0,45%. Se
acepta a sabiendas y está escrito junto a la constante: pesa mucho más medir sobre todos los puntos
que la forma exacta del planeta, y quien necesite el número del elipsoide lo tiene en `ST_Length`.

**`LINESTRING(lon lat)` se construye en un solo sitio.** WKT pide longitud primero, al revés de como
la gente lo dice en voz alta. Invertirlo pone la ruta en otro continente **sin que nada falle**, así
que hay una única función que lo hace, con la nota al lado. La ida y vuelta contra la base lo
confirmó: la ruta quedó en Córdoba.

**Guardar la ruta no puede tumbar la publicación.** Si la inserción del trazo falla, la publicación
ya existe y es válida sin él: se avisa en el registro y quien publicó puede volver a subir el
archivo. Perderla entera por eso sería peor.

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `uv run alembic upgrade head` | `0042 → 0043`; tabla creada **solo con su clave primaria** — el `spatial_index=False` funcionó |
| Ida y vuelta contra la base real | GPX de 200 puntos → guardado como geografía → leído con las coordenadas en su sitio; PostGIS 2.203 m vs dominio 2.213 m; reemplazar no duplica; borrar la publicación se lleva la ruta |
| `pnpm run test:run` | **1791/1791**, 172 archivos (antes del slice: 1773 en 171) |
| `typecheck`, `typecheck:tests`, `lint`, `check:i18n`, `check:directives` | limpios |

**Escrito en la base compartida:** una tabla nueva, vacía. Se deshace con
`uv run alembic downgrade 0042_2026_08_16`.

### Pendiente declarado

**La e2e de la ruta no se escribió.** Subir un archivo por Playwright y comprobar que Leaflet pinta
la línea es el escenario del `.feature` (`@slice-2`), y quedó sin implementar. El parser tiene 18
pruebas y el ida y vuelta se comprobó contra la base a mano, así que lo que falta cubrir es el
recorrido de pantalla completo.

### Recap

Un evento ya puede llevar su recorrido: se sube un `.gpx`, el sitio lo lee sin dependencias nuevas,
lo guarda como geografía de PostGIS —lista para el día que alguien pregunte qué rutas pasan cerca— y
lo dibuja con `<Polyline>` encuadrado al propio trazo, con salida, llegada y sus kilómetros arriba.
El editor de dibujo sigue fuera, que era el objetivo.

### Próximos pasos (opciones)

1. **La e2e del slice 2**, que es lo único declarado como pendiente.
2. **Slice 3 — `servicio`**, y luego el 4, la agenda con su restricción de exclusión.
3. **El índice GIST** sobre `path`, el día que exista la consulta de cercanía que lo justifique.

---

## 2026-08-16 (noche) — Slice 3: `servicio`

### Objetivo

Que se pueda publicar lo que se **hace**: la consulta nutricional, el masaje, la sesión con el
quiropráctico, el entrenador. Hoy eso solo se puede fingir con `producto`, y fingir tiene precio: a
un producto se le exige procedencia, y un masaje siempre lo das tú, así que el vendedor rellena un
campo vacío de significado para poder publicar.

### La decisión que evita una migración de datos el año que viene

**La duración se pide ahora, no cuando llegue la agenda.** Un servicio se agenda, y agendar es
repartir el tiempo del proveedor: la duración es lo que convierte "las 9:00" en "de 9:00 a 9:45", o
sea lo que permite que dos citas no se pisen.

Si se dejara para el slice 4, ese día habría servicios publicados sin duración y habría que
perseguir a sus dueños para completarla. Que nazcan con ella cuesta un campo más hoy. Y además sirve
por sí sola: "Consulta de 45 minutos" le dice a quien la pide cuánto tiene que apartar, sin que
exista ninguna agenda.

### "Vendible" dejó de significar "producto"

Es el cambio con más alcance del slice, y estaba repartido. `isSellable` decidía media docena de
comportamientos —el carrito, el botón de WhatsApp, la insignia de agotado, la distancia a la
tienda— y cada sitio comparaba contra el literal `"producto"`.

Ahora hay `SELLABLE_KINDS` y la pregunta se hace una vez. Sumar un tercer tipo que se cobre será una
línea en vez de una búsqueda por todo el repositorio.

**Un evento NO entró en esa lista**, y es deliberado: apuntarse a una rodada no es comprarla, y
meterlo ahí lo habría metido en el carrito de paso. Es otra decisión y otro slice.

### "Agotado" era mentira en un servicio

A una masajista no se le acaban los masajes: deja de ofrecerlos. Mismo interruptor —`is_available`—
y dos frases distintas, igual que `origin` ya tiene un nombre para el reporte y una pregunta para el
formulario. Un producto sigue diciendo "Agotado"; un servicio dice "Ya no se ofrece".

Es el tipo de detalle que no rompe ninguna prueba y hace que el sitio suene a que nadie lo pensó.

### Decisiones menores, y por qué

**`integer` de minutos y no un `interval`.** Nadie ofrece un servicio de 20 minutos y medio, y los
minutos son directamente lo que pinta la pantalla y lo que sumará el calendario. Un `interval`
traería precisión de microsegundos para un dato que va de quince en quince.

**Nullable, con `CHECK` de positividad.** Solo un servicio la usa; que un servicio SÍ la necesite es
regla del tipo y vive en `PostValidator`, porque la base no sabe qué es un servicio. Lo único que la
base afirma es que cero minutos no es un servicio corto, es un dato roto.

**El servicio no aparece en `/productos`.** Esa página es de productos y un servicio no lo es. Sale
en el feed, en su categoría, en su pilar y en su tienda, que es donde tiene sentido.

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `uv run alembic upgrade head` | `0043 → 0044`; columna nullable y su `CHECK` |
| Ida y vuelta contra la base real | guardado como `servicio` con **procedencia nula**, duración 45; **aparece en el carrito**; el `CHECK` rechazó cero minutos |
| `pnpm run test:run` | **1809/1809**, 172 archivos (antes del slice: 1791) |
| `typecheck`, `typecheck:tests`, `lint`, `check:i18n`, `check:directives` | limpios |

**Escrito en la base compartida:** una columna nullable y un `CHECK` sobre `posts`. Se deshace con
`uv run alembic downgrade 0043_2026_08_16`. Ninguna publicación cambió de valor.

### Pendiente declarado

**La e2e del slice 3 no se escribió**, como tampoco la del 2. Lo cubierto es el dominio (validador y
`isSellable`), el componente de la insignia y el ida y vuelta contra la base a mano. Lo que falta es
el recorrido de pantalla: publicar un servicio desde el formulario y meterlo al carrito.

### Recap

Ya se puede publicar un servicio: precio y duración obligatorios, procedencia ninguna, y se pide
como se pide un producto —mismo carrito, mismo checkout, mismo aviso al vendedor, misma máquina de
estados—. Todavía **sin agenda**: es una solicitud y el proveedor contesta, que es exactamente lo
que ya hace hoy por WhatsApp. Con esto los cuatro pilares tienen las tres formas: lo que se lee, lo
que ocurre y lo que se hace.

### Próximos pasos (opciones)

1. **Slice 4 — la agenda.** La única pieza con ideas nuevas de verdad: horario del proveedor,
   huecos derivados como función pura, y la restricción de exclusión que impide solapamientos.
2. **Las e2e pendientes** de los slices 2 y 3.
3. **Enseñarle los servicios al chatbot**, que sigue filtrando `kind = 'producto'` literal.
