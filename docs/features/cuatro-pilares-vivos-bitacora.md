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

---

## 2026-08-16 (noche) — Slice 4: la agenda (base y cálculo; falta la pantalla)

### Objetivo

Que el proveedor deje de contestar "¿tienes hueco el jueves?" veinte veces.

### Lo entregado y lo que falta — dicho primero

**Entregado y probado:** el esquema con su restricción de exclusión (migración `0045`, aplicada y
verificada contra la base) y **el cálculo de huecos** como función pura, con 19 pruebas.

**NO entregado:** los repositorios que lean y escriban ese esquema, la pantalla donde el proveedor
declara su horario, y la pantalla donde alguien elige un hueco. Sin ellas la agenda **no se puede
usar todavía**: lo que existe es la mitad difícil, no la mitad visible.

### La restricción de exclusión, y por qué no un UNIQUE

Comprobar-y-luego-insertar pierde la carrera: dos peticiones simultáneas leen "libre" y las dos
escriben. Da igual lo cuidadoso que sea el código de arriba, así que lo impide la base:

```sql
EXCLUDE USING gist (seller_id WITH =, during WITH &&)
WHERE (during IS NOT NULL AND status <> 'CANCELLED')
```

`during` es un `tstzrange`, así que `&&` compara **solapamientos** y no igualdades. Se comprobó
contra la base real, y el resultado es exactamente el argumento:

| Intento sobre una cita de 9:00–10:00 | Resultado |
|---|---|
| Misma hora exacta | rechazada |
| **9:30–10:00** | **rechazada** — la que un `UNIQUE(seller_id, starts_at)` habría dejado pasar |
| 8:30–9:30 | rechazada |
| 10:00–11:00 (pegada) | **entró** — con `[)` el final no cuenta |
| Repetir la primera tras cancelarla | **entró** — cancelar libera el hueco |

Necesita `btree_gist`, porque `seller_id` es un `uuid` y GiST no sabe indexarlo por sí solo.

### El horario es del proveedor, no del servicio

Una masajista con "masaje 30" y "masaje 60" tiene **una** agenda: no puede dar los dos a las 9:00.
Si la disponibilidad colgara de cada publicación —que es lo primero que se piensa— dos servicios
suyos se pisarían y nadie se enteraría hasta que llegaran dos personas.

El horario cuelga de `sellers`; la duración, de `posts`. El proveedor dice **cuándo** atiende y cada
servicio dice **cuánto** ocupa.

### Los huecos no se guardan

No hay tabla de huecos libres: materializarlos sería escribir un calendario infinito y mantenerlo
sincronizado con cada cita, cada cambio de horario y cada cierre. Se derivan al vuelo, y esa es la
parte que vive en el dominio y se prueba entera sin base de datos.

**Restar antes de partir, y no al revés.** Es la decisión que más se puede equivocar. Si se partiera
la jornada en huecos y luego se descartaran los que chocan, una cita de 9:15 a 9:45 inutilizaría los
huecos de 9:00 y de 9:30 — cuando de 9:45 a 10:30 cabe uno perfectamente. Hay una prueba que afirma
justo eso.

**Restar puede devolver DOS trozos.** Una cita de 11:00 a 12:00 en mitad de una jornada de 9:00 a
14:00 no la acorta, la parte en dos. Una resta que devolviera un solo tramo perdería la tarde entera.

**Lo que sobra al final se tira.** Media hora libre no es un hueco para una consulta de 45 minutos:
ofrecerla sería citar a alguien para echarlo a medias.

### Un bug que la prueba atrapó, y que habría sido muy difícil de ver

`expandWeeklyHours` calculaba el día de la semana desplazando por la zona horaria, cuando el
desplazamiento ya se aplica al convertir la hora en instante. Aplicado dos veces, **un miércoles se
leía como martes**: el horario aparecía el día equivocado.

En producción eso no revienta nada — simplemente el proveedor no tiene huecos el día que atiende y
sí el día que descansa. Lo atrapó la prueba del recorrido completo, que es la que usa una fecha real
y una zona real (Córdoba, UTC−6).

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `uv run alembic upgrade head` | `0044 → 0045`; `btree_gist`, dos tablas, `during` y la exclusión |
| Prueba de solapamiento contra la base real | 5 casos, todos como se diseñaron (tabla de arriba) |
| `pnpm run test:run` | **1828/1828**, 173 archivos (antes del slice: 1809 en 172) |
| `typecheck`, `typecheck:tests`, `lint` | limpios |

**Escrito en la base compartida:** la extensión `btree_gist`, dos tablas vacías, una columna
nullable y una restricción sobre `customer_orders`. Se deshace con
`uv run alembic downgrade 0044_2026_08_16` (la extensión no se quita: puede haberla pedido otra cosa).

### Pendiente declarado

1. **Repositorios** para el horario, las ausencias y las citas.
2. **Pantalla del proveedor** para declarar su horario y sus días libres.
3. **Selector de hueco** en la publicación del servicio, y la cita como pedido con su `during`.
4. **La zona horaria del proveedor.** Hoy `expandWeeklyHours` la recibe como parámetro y no hay de
   dónde sacarla: `sellers` no tiene columna de zona. Para una comunidad en una sola ciudad basta
   una constante del sitio; el día que haya proveedores en otra zona, es una columna.
5. Las e2e de los slices 2, 3 y 4.

### Recap

La agenda tiene ya lo que más se puede diseñar mal: una base que **impide de verdad** que dos
personas se queden con el mismo hueco —solapamientos, no solo horas iguales, y cancelar libera— y un
cálculo de huecos que se prueba entero sin tocar nada. Lo que falta es cablearlo y darle pantallas,
que es trabajo directo y sin incógnitas.

---

## 2026-08-16 (noche) — La e2e completa tras los cuatro slices

**269 pruebas, todas verdes**, en seis lotes. Cierra el pendiente de comprobar que los cuatro slices
no rompieron nada, que era el riesgo real: se tocó el esquema de `posts` (tres migraciones), la lista
de tipos, `isSellable` —que decide carrito, botón de WhatsApp, insignia de agotado y distancia—, el
formulario de publicar, la ficha y el mapper de tarjetas.

| Lote | Carpetas | Resultado |
|---|---|---|
| A | `eventos`, `orders` | 37/37 |
| B | `sellerStore`, `products`, `publishProduct`, `productsReport`, `createPost` | 41/41 |
| C | `seo`, `unifiedCatalog`, `busquedaRelevante`, `busquedaEntreIdiomas` | 54/68 → **22/22 al repetir las de búsqueda** |
| D | `habits`, `pilares`, `menu`, `compartir` | 70/70 |
| E | `localProducers`, `ubicacionFresca`, `multimedia`, `i18n`, `filtroAlPublicar` | 77/77 |
| F | las once carpetas restantes | 22/22 |

### Los 14 fallos del lote C

Todos en las dos carpetas de búsqueda (y un `seo` arrastrado), y el síntoma era fuerte: la búsqueda
devolvía **vacío** para una publicación recién sembrada, no un orden distinto.

Había una hipótesis propia que valía la pena descartar: este trabajo **sembró 10 categorías nuevas**
para los tres pilares vacíos, y la búsqueda mira categorías. Antes de repetir nada se comprobó que
la rama **no toca la búsqueda** —`git diff dev..HEAD` sobre `searchPosts`, `domain/search` y
`/buscar` sale vacío— y después, en aislamiento: **22/22**.

O sea, la misma interferencia entre carpetas en el mismo proceso que ya está documentada en
`filtro-al-publicar-bitacora.md`. Se anota otra vez porque es la segunda vez que ese grupo concreto
—`busqueda*` corriendo junto a `seo` y `unifiedCatalog`— produce un fallo que no sobrevive a
repetirse: quien lo vea una tercera vez que empiece por aquí.

### Recap

Las cuatro migraciones del roadmap (`0042` a `0045`) están aplicadas y la suite entera pasa con
ellas. Lo entregado —eventos con fecha, ruta por GPX, servicios, y la base y el cálculo de la
agenda— convive con todo lo anterior sin romperlo.

---

## 2026-08-16 (noche) — Slice 4, segunda parte: el servidor de la agenda

Cierra dos de los cinco pendientes que dejó la primera parte: **la zona horaria** y **los
repositorios y el caso de uso**. Siguen faltando las pantallas.

### La zona horaria: constante, y con una razón que caduca

`COMMUNITY_UTC_OFFSET_MINUTES = -360`. Es una constante del sitio y no una columna de `sellers`
porque la comunidad cabe en un radio de 50 km —el mismo que ya usa `SUSTAINABLE_RADIUS_KM`— y hoy
todos los proveedores están en la misma zona: una columna pediría un dato que nadie sabría contestar
mejor que este valor.

**Y es un desplazamiento fijo, no un identificador IANA, porque en México se puede**: el horario de
verano se abolió en 2022, así que Veracruz está en UTC−6 todo el año. Sin esa ley un número fijo
sería un error esperando a abril, con las citas corriéndose una hora dos veces al año. Está escrito
junto a la constante, porque el día que la ley cambie hay que volver aquí.

`expandWeeklyHours` sigue recibiendo el desplazamiento como parámetro y no leyendo la constante: el
día que haya un proveedor en otra zona, es una columna y la función no se entera.

### Dos guardas, y ninguna sobra

Al agendar se comprueba **antes** que el hueco sea uno de los ofrecidos, y aun así se deja que la
base tenga la última palabra:

- La primera atrapa a quien pide una hora que **nunca** se ofreció —fuera del horario, a las 3 de la
  madrugada— y le contesta con sentido, sin tocar la base.
- La segunda atrapa a quien pidió una hora que **sí** se ofrecía y dejó de estarlo entre que la vio
  y pulsó. Esa carrera no la gana ninguna comprobación previa.

### El error que casi se traga la carrera

La primera corrida contra la base **reventó**: la violación de la restricción de exclusión se
escapaba de `isSlotTaken`. Drizzle envuelve el error de `pg` en uno suyo cuya `message` es
"Failed query: INSERT…", así que ni el `code` ni el texto del driver están donde uno los busca. El
que sí sobrevive intacto es `constraint`.

Ahora se miran tres señales y se baja por `cause`. Sin eso, a quien le ganaran el hueco por medio
segundo le habría salido un error genérico en vez de "alguien se te adelantó" — y el caso más
importante de la feature habría quedado indistinguible de un fallo del servidor.

### `findBusy` devuelve ausencias y citas mezcladas, a propósito

Para calcular huecos da exactamente igual si una hora está ocupada porque el proveedor se fue de
vacaciones o porque ya citó a alguien: en las dos no se puede citar. Separarlas obligaría a quien
llama a volver a juntarlas.

### Comandos y resultados

| Comando | Resultado |
|---|---|
| Recorrido completo contra la base real | horario 9–12 local → huecos 15:00, 16:00 y 17:00 UTC; **dos peticiones simultáneas al mismo hueco: una agendó y la otra `slot-taken`**; el hueco desaparece de la lista; una hora nunca ofrecida da `not-offered` |
| `pnpm run test:run` | **1833/1833**, 174 archivos |
| `typecheck`, `typecheck:tests`, `lint` | limpios |

**Escrito en la base compartida:** nada permanente — la prueba creó y borró su horario, su servicio
y sus citas.

### Sigue pendiente

1. **Pantalla del proveedor** para declarar horario y días libres. Hoy se insertan a mano.
2. **Selector de hueco** en la publicación del servicio.
3. Las e2e de los slices 2, 3 y 4.

### Recap

La agenda funciona entera del lado del servidor: se leen los huecos, se agenda, y **dos personas no
pueden quedarse con el mismo** — probado con dos peticiones simultáneas de verdad, no simuladas. Lo
que falta son dos pantallas.

---

## 2026-08-16 (noche) — Slice 4, tercera parte: las pantallas

Cierra el slice. Ya se puede usar la agenda de punta a punta sin tocar la base a mano.

### Dónde vive cada una

**`/cuenta/agenda`** — el proveedor declara su semana tipo. Cuelga de la cuenta y no de la tienda
porque la agenda es **de quien atiende**, no de un servicio: una masajista con dos servicios tiene
una sola semana. Es la misma decisión que ya tomó el esquema al colgar `provider_availability` de
`sellers`, y la pantalla no la contradice.

Sin tienda no se enseña un formulario inútil: se dice que hace falta abrirla.

**El selector de hueco** vive en la ficha del servicio, justo encima del botón de denunciar —elegir
hora es la acción principal de un servicio; avisar es el último recurso—. No se pinta en tres casos,
y en los tres el servicio sigue pidiéndose como en el slice 3: no es un servicio, no cuelga de
ninguna tienda, o su tienda no declaró horario.

### El horario se reemplaza entero, no se calcula el diff

El formulario manda la semana completa —es lo que la persona está viendo— y la acción borra y
reescribe en una transacción. Un diff necesitaría una identidad estable por franja que ni el
formulario ni ella tienen. Es el mismo criterio que `replaceMedia` al editar una publicación.

Por eso el formulario es Client Component: quien atiende martes y jueves no debería tener que
guardar dos veces para decirlo.

### Tres capas de validación, y qué atrapa cada una

Suena a exceso hasta que se mira para qué sirve cada una:

| Capa | Atrapa |
|---|---|
| El selector | que no se pueda **elegir** lo que no se ofrece |
| La Server Action | un formulario manipulado: revalida contra los huecos reales |
| La restricción de exclusión | **la carrera** entre dos personas pulsando el mismo hueco a la vez |

Ninguna sustituye a la siguiente. La tercera es la única que gana la carrera, y las dos primeras son
las que permiten contestar algo con sentido en vez de un error de base.

### Una ventana de dos semanas

Es lo que alguien mira de un vistazo para decidir. Estirarla convertiría un selector en un
calendario, que es otra feature.

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `pnpm run test:run` | **1833/1833**, 174 archivos |
| `pnpm run build` | compila en 24,4 s; `/[locale]/cuenta/agenda` en el manifiesto |
| `typecheck`, `typecheck:tests`, `lint`, `check:i18n`, `check:directives` | limpios |

### Sigue pendiente

- **Las ausencias** (vacaciones, un día que se cierra) no tienen pantalla: la tabla existe y el
  cálculo las resta, pero hoy se insertan a mano. Es la pieza más pequeña que queda.
- Las **e2e** de los slices 2, 3 y 4.

### Recap

El slice 4 está cerrado en lo esencial: un proveedor declara su horario desde su cuenta, quien quiere
una cita ve los huecos reales —horario menos ausencias menos citas— y se queda con uno, y si dos
pulsan a la vez solo uno se lo lleva y al otro se le dice exactamente eso.

---

## 2026-08-16 (noche) — Slice 4, última parte: las ausencias

Cierra el último pendiente de la agenda. Ya no queda nada del slice 4 que se haga a mano.

### Fecha **y hora**, no solo el día

Es lo que permite anotar "el jueves solo por la mañana" sin inventar otra forma de decirlo, y es la
razón de que la tabla guarde instantes en vez de fechas. El formulario pide dos `datetime-local`.

### Las ausencias pasadas no se listan

Una vacación de hace dos años no es algo que nadie vaya a editar, y enseñarlas convertiría la
pantalla en un archivo histórico. Siguen en la tabla: borrarlas sería tocar datos que no molestan a
nadie.

### Anotar una ausencia NO comprueba que no pise una cita

Irse de vacaciones con gente ya citada es un problema real, pero se resuelve hablando con esa gente
—no impidiéndole al proveedor anotar la verdad de su calendario—. Lo que sí pasa es que a partir de
ese momento esas horas dejan de ofrecerse a nadie más.

Es la misma clase de decisión que el fallo abierto de la moderación: elegir qué se le impide a la
persona y qué se le deja resolver fuera del sistema.

### El dueño se comprueba en el `WHERE`, no antes

Al quitar una ausencia, la condición de propiedad va dentro del `DELETE` en vez de en una lectura
previa. Así no existe el instante entre comprobar y borrar en el que otra petición podría cambiar
las cosas — el mismo criterio que ya usa `ON CONFLICT` en las denuncias y la restricción de
exclusión en las citas.

### Comandos y resultados

| Comando | Resultado |
|---|---|
| Recorrido contra la base real | horario 9–12 → huecos 15, 16 y 17 UTC; ausencia de 16 a 17 → **quedan 15 y 17**; al quitarla vuelven los tres |
| `pnpm run test:run` | **1833/1833**, 174 archivos |
| `typecheck`, `typecheck:tests`, `lint`, `check:i18n`, `check:directives` | limpios |

### Recap del slice 4, completo

La agenda está entera: el proveedor declara desde su cuenta cuándo atiende y cuándo no, quien quiere
cita ve los huecos reales —horario menos ausencias menos citas—, y si dos personas pulsan el mismo a
la vez solo una se lo lleva y a la otra se le dice exactamente eso. Lo único que queda del roadmap
son las **e2e de los slices 2, 3 y 4**.

---

## 2026-08-16 (noche) — La agenda estaba huérfana

`/cuenta/agenda` existía y **no se llegaba a ella**: ni un enlace, ni una entrada de menú. Solo
escribiendo la dirección a mano. Lo detectó el usuario, no una prueba — y no lo habría detectado
ninguna, porque todas las que escribí navegan directo a la URL.

Es el fallo que se repite en este roadmap: el mismo del slice 1, donde la fecha estaba en la tarjeta
del listado pero no en la ficha, y el del slice 1 de moderación, donde el panel no tenía forma de
bajar nada. **Construir la pantalla no es entregarla; hay que poder llegar.**

### Dos entradas, y el mismo gate en las dos

- **En `/cuenta`**, dentro de `StoreCard` — la tarjeta que solo se pinta cuando hay tienda, así que
  el gate sale gratis.
- **En el menú del avatar**, con el mismo `storeHandle` que ya decide si se enseña "Mi tienda".

Está en los dos sitios a propósito: `/cuenta` es donde se configura algo una vez, y el menú es donde
se abre lo que se usa a diario. Quien atiende revisa su semana mucho más de lo que edita su ficha.

`pnpm run test:run`: **1833/1833**. Lint, typechecks e i18n limpios.
