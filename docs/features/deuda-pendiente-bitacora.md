# Bitácora — Barrido de pendientes

## 2026-08-08 — los cuatro que no dependían de nadie

### Objetivo

Cerrar todo lo que `pendientes.md` listaba como "se puede hacer ya, sin permiso de nadie", más la
revisión de las traducciones que estaba marcada como "requiere una decisión tuya". Lo único que
queda abierto después de esto es lo que exige una migración Alembic sobre la base compartida.

---

### 1. `translatePostUseCase` culpaba siempre al proveedor

**El problema no era teórico.** La corrida e2e del día anterior lo había escrito en el registro sin
que nadie lo leyera así:

```
[translations] post 80dea1e5-… queda pendiente en en  Error: Failed query: …
```

«Queda pendiente, ya lo recogerá el backfill» — y el error es de Postgres. Un solo `try` envolvía la
llamada a Gemini **y** las dos escrituras, así que cualquier fallo salía etiquetado
`provider-failed`. Manda a mirar el estado del proveedor cuando el problema está en la conexión, y
promete un backfill que va a estrellarse exactamente igual.

Y había un segundo agujero más silencioso: `hasTranslation` y `findTranslation` estaban **fuera de
todo `try`**, así que el caso de uso cuya primera línea de documentación dice "nunca lanza" lanzaba
justo cuando la base era el problema — dentro de un `after()`, donde la excepción no la ve nadie.

**Lo que se hizo.** Un `Attempt<T>` (`{ok, value} | {ok, error}`) y un paso por operación, en vez de
un bloque que lo abarca todo. Nuevo motivo `storage-failed`, separado de `provider-failed` porque
**piden cosas distintas**:

- `provider-failed` → se arregla solo en la siguiente corrida del backfill.
- `storage-failed` → **no**. La traducción ya se pagó; repetir vuelve a pagarla para chocar contra
  la misma base.

Los dos consumidores dicen ahora dos cosas distintas: `actions.ts` usa `console.warn` para el
proveedor y `console.error` para la base, con el texto explicando cuál de los dos es; y el script de
backfill lleva contadores separados y solo sugiere relanzar cuando relanzar sirve de algo.

Una nota de TypeScript que costó un ciclo: `found.value` no se estrecha dentro del callback que
recibe `attempt()`. Hay que sacarlo a una constante propia antes de usarlo.

**Y funcionó a la primera contra la realidad**: en la e2e de esta sesión el mensaje nuevo salió
diciendo `NO se guardó en en: falló la base, no el traductor`, que es exactamente lo que pasaba
antes disfrazado de otra cosa.

---

### 2. `docs/database.md` describía una base que no existe

Decía tres tablas; hay 19. Decía `posts.id uuid`; es `text` — y tiene que serlo, porque conviven
ids de Firestore (`j5FOSBacjlJrX9dRU2Hw`) con uuid de lo creado después. Declaraba un
`UNIQUE(post_id, locale)` que **nunca se creó**, que es la peor clase de error en un documento de
esquema: hace que alguien confíe en una garantía que no tiene. Y tenía una sección entera sobre leer
de Firestore cuando `DB_PROVIDER` ya no lo lee **ningún archivo de `src/`**.

Se reescribió **contra `information_schema`**, no de memoria. Lo que se añadió y no estaba:

- **Quién es dueño de cada tabla.** 5 de las 19 son solo del bot (`messages`, `orders`, `prompts`,
  `ai_training_logs`, `product_recommendations`) y no tienen espejo Drizzle, lo cual está bien pero
  había que decirlo.
- **Una sección «Lo que la base NO impide»**, que es lo más útil del documento: las tres reglas que
  parecen estar en el esquema y las sostiene el código (unicidad de traducción, unicidad de slug,
  el conjunto de idiomas).
- Los CHECK de `categories` con su regla de dos niveles, y que `category_translations` es **el único
  sitio del esquema que enumera los idiomas** — añadir un tercero pide una migración ahí.
- Por qué el sitio **no usa** `search_posts_semantic` ni `recommend_posts` aunque existan.

Head de Alembic: `0027_2026_07_31`.

---

### 3. El `rounded-lg` del mapa

`StoresMapCanvas` va dentro de un `Surface radius="lg" className="overflow-hidden"` y el
`MapContainer` se queda con lo suyo: tamaño y `isolate`. Hace falta el envoltorio porque
`MapContainer` no acepta `as`.

Da igual que el valor coincidiera: una esquina que no se puede cambiar desde `layout.css` se queda
atrás la próxima vez que cambie el radio del sitio.

**Al contarlos salió que `pendientes.md` decía menos de lo que había.** No quedaba «el mapa»: quedan
45 `rounded-*` no-pastilla fuera del design system, y entre ellos 9 `rounded-2xl` y 2 `rounded-3xl`
que **no usan ningún token** — `--radius-lg` es 0.5rem y es el más grande que existe. Están casi
todos en páginas de contenido (`nosotros`, las legales, `pilares`).

**No se barrieron, a propósito.** Bajarlos a `rounded-lg` cambia visiblemente cómo se ven esas
páginas, y las tarjetas de `nosotros` son deliberadamente más suaves que una de producto. Eso es una
decisión de diseño, no una limpieza, y hacerla de madrugada sin que nadie la pidiera sería peor que
dejarla escrita. Anotada en `pendientes.md` con las dos salidas honestas.

---

### 4. Las 23 traducciones al inglés, leídas una por una

**No había ninguna mistraducción de fondo.** El sentido, los datos —dosis, horarios, universidades
citadas, listas de ingredientes— y la estructura estaban bien en las 23. `hierba buena` → `spearmint`
correcto; `panela` sin traducir, que es lo apropiado.

Sí había cuatro defectos de acabado, **todos en producto que se vende**, y ninguno de ellos lo
habría detectado la auditoría automática que ya se había hecho (buscaba duplicados, títulos sin
traducir y estructura aplastada):

1. **Frases pegadas sin espacio** — `"don't stop.It's the natural"`. Electrolitos (×3) y Pan de Masa
   Madre Natural (×2). Es lo único que un cliente leería como descuido.
2. **`"Dorado"` traducido a `"Golden"`** en las tres pechugas. Es el **nombre** de un aderezo de la
   casa. Quien pida "the Golden dressing" no se hace entender en el mostrador — y encima era
   inconsistente, porque el Omelet sí lo había dejado como "Dorado".
3. **`"arándanos"` → `"blueberries"` en una ficha** y `"cranberries"` en las otras tres, con la misma
   lista de ingredientes copiada. Dos frutas distintas para la misma palabra.
4. **`"Grasas Buenas"` → `"Healthy Fats"` en una** y `"Good Fats"` en dos. Misma frase, misma
   plantilla.

Los cuatro corregidos: 11 cambios vía `src/scripts/fixEnglishTranslations.ts`. También se unificó el
título `"Orange Chicken Breast Steaks"` a singular, como sus dos hermanas y como el español.

**Los embeddings se anularon y se regeneraron** (5/5). Un vector calculado sobre el texto anterior
describe un texto que ya no existe, y eso no falla ruidosamente: envenena la búsqueda semántica en
silencio, que es peor.

El script es **idempotente y reversible**: guarda las filas originales antes de escribir
(`src/scripts/backups/en-translations-5-rows.json`) y, al repetirlo, avisa de que ya no encuentra lo
que buscaba en vez de tocar nada.

**Lo que no se tocó, a propósito:** el título en español dice `"Eléctrolitos de frutos rojos"` y la
palabra es *electrolitos*, sin acento. Es contenido de origen y arrastra su slug y su URL indexada:
eso lo decide quien escribe, no un script.

---

### 5. La tabla de ramas mandaba a buscar trabajo donde no estaba

`pendientes.md` decía "ninguna está subida ni tiene PR" y contaba 16 commits pendientes en
`feat/mudanza-y-tipografia`. `git rev-list --count dev..<rama>` da **0** para las cuatro: ya estaban
fusionadas y `dev` estaba en `origin`. Corregido.

---

### Archivos tocados

**Caso de uso y sus consumidores**
- `src/use_cases/translatePost/translatePostUseCase.ts` — `Attempt<T>`, `storage-failed`, `persist()`.
- `src/use_cases/translatePost/translatePostUseCase.test.ts` — 6 casos nuevos (13 en total).
- `src/app/[locale]/publicar/actions.ts` — dos avisos distintos.
- `src/scripts/backfillTranslations.ts` — contadores separados, consejo condicionado.

**Presentación**
- `src/presentation/location/StoresMapCanvas.tsx` — el mapa dentro de `Surface`.

**Datos**
- `src/scripts/fixEnglishTranslations.ts` (nuevo) — los 11 arreglos, con respaldo y `--dry-run`.
- `src/scripts/backups/en-translations-5-rows.json` (nuevo) — las filas antes de tocarlas.

**Documentos**
- `docs/database.md` — reescrito contra el esquema real.
- `docs/features/pendientes.md` — cinco entradas cerradas, la de `rounded-*` con su cuenta real.

### Comandos y validación

```bash
pnpm run test:run          # 961/961  (eran 955)
pnpm run typecheck         # 0
pnpm run typecheck:tests   # 0
pnpm run lint              # limpio (1 info preexistente en IndexingStatusPanel)
pnpm exec tsx src/scripts/fixEnglishTranslations.ts --dry-run   # 11 cambios previstos
pnpm exec tsx src/scripts/fixEnglishTranslations.ts             # 11 aplicados
pnpm run backfill-embeddings                                    # 5/5 reindexadas
pnpm exec playwright test <primera mitad>   # 40 passed, 3 skipped
pnpm exec playwright test <segunda mitad>   # 134 passed
```

**Se escribió en la base compartida**: 5 filas de `post_translations` con `locale='en'` (título y/o
contenido, más su embedding regenerado). Para deshacer, las filas originales están en
`src/scripts/backups/en-translations-5-rows.json`; para deshacer todo el inglés,
`DELETE FROM post_translations WHERE locale = 'en';`.

### Lo que apareció por el camino y no se cerró

- **La e2e es flaky en frío.** Una corrida de 6 carpetas dio 13 fallos y la misma, repetida sin
  tocar nada, dio 91/91. `warmRoutes` calienta 7 rutas; estas corridas pisan más.
- **Hay `Failed query` reales al insertar traducciones durante la e2e.** Ahora se ven como lo que
  son, gracias al punto 1. La sospecha razonable es el pooler de transacciones con `max: 3` contra
  varios workers publicando a la vez, pero no se midió.

### Recap

De los tres montones que `pendientes.md` describía, quedan cero en los dos primeros y solo sobrevive
lo que exige Alembic sobre la base compartida: el `UNIQUE(post_id, locale)`, los índices GIN y HNSW,
la tabla de búsquedas y el slice 5 de i18n. Las traducciones al inglés están leídas y sus cuatro
defectos corregidos; `docs/database.md` describe la base que existe; el mapa pasa por el design
system; y `translatePostUseCase` ya no manda a buscar en Gemini un problema de Postgres. 961
unitarias, 174 e2e, typecheck y lint limpios.

### Próximos pasos (opciones)

1. **Una sola migración Alembic** con las cuatro cosas juntas, por valor: índices → unicidad →
   tabla de búsquedas → traducciones de tienda. Es la única puerta que queda y es tuya.
2. **Mirar la flakiness de la e2e**, empezando por los `Failed query`: si es el `max: 3` del pooler,
   se nota subiéndolo solo para la corrida de pruebas.
3. **Decidir los `rounded-*` de contenido**: añadir `--radius-xl` al sistema, o dejar escrito que lo
   editorial redondea distinto que el catálogo.
4. **`taskType: RETRIEVAL_QUERY`** en los embeddings, con su medición y su backfill.

Pendiente de ti: el punto 1, el 3, y si quieres que `"Eléctrolitos"` pase a `"Electrolitos"` con el
cambio de slug que eso arrastra.

---

## 2026-08-08 (tarde) — la migración Alembic y el acento

### Objetivo

Cerrar lo único que quedaba: la migración sobre la base compartida y el título con la falta de
ortografía. Las dos las pidió el usuario explícitamente.

### 1. `"Eléctrolitos"` → `"Electrolitos"`

Resultó **más barato de lo que la entrada de la mañana decía**. Ahí se dejó fuera porque "arrastra
su slug y su URL indexada", y eso era falso: el slug ya era `electrolitos-de-frutos-rojos`, porque
`slugify` normaliza los diacríticos. Solo el título llevaba el acento de más y la URL no se movió.

Sí hubo que anular y regenerar su embedding: el vector describía el título anterior.

### 2. La migración: `0029_2026_08_08`

**Se aplicó también `0028`.** Estaba escrita en el repo del backend y sin aplicar —el ledger de
publicación en redes sociales, del bot— y `alembic upgrade head` no la puede saltar. Es puramente
aditiva (crea `social_posts` y `social_post_deliveries`, no toca nada existente) y tiene downgrade
limpio, pero conviene saber que se aplicó sin que nadie lo pidiera hoy.

Antes de escribir nada se verificó contra la base: **0 duplicados** de `(post_id, locale)` y **0**
de `slug` sobre 46 filas. Los constraints se crearon sobre datos ya limpios.

#### El índice GIN que no servía para nada

Esta es la parte que merece leerse. La primera versión creaba **un** índice sobre la expresión con
el `CASE` del diccionario. Se aplicó, se comprobó que existía… y con `EXPLAIN` resultó que **el
planner no lo usaba nunca**, ni siquiera con `enable_seqscan = off`.

El motivo no era la expresión indexada sino el otro lado del `@@`. La consulta analiza cada fila con
el diccionario de SU idioma, así que el `tsquery` también sale de un `CASE` sobre `locale`: la clave
de búsqueda **cambia de una fila a otra**. Un GIN necesita una clave fija para descender por el
índice; con una que depende de la fila que todavía no ha leído, no hay nada que consultar.

Un índice que existe y nunca se usa es peor que ninguno: cuesta escrituras y hace creer que el
problema está resuelto. Así que se revirtió la migración —`downgrade` limpio, había durado minutos—
y se rehízo partiendo la pregunta por idioma:

```sql
WHERE (locale = 'es' AND doc_spanish @@ websearch_to_tsquery('spanish', $1))
   OR (locale = 'en' AND doc_english @@ websearch_to_tsquery('english', $1))
   OR (locale NOT IN ('es','en') AND doc_simple @@ websearch_to_tsquery('simple', $1))
```

con un índice parcial por rama. Y ahí apareció **el segundo tropiezo**: con dos índices seguía
saliendo seq scan. Un `OR` solo se resuelve por índices si las tienen **todas** sus ramas, y la
tercera —la de cortesía, para un idioma sin diccionario propio— no tenía. Ese índice cubre **0 filas
hoy** y es imprescindible: sin él, la rama que existe para que una fila en un tercer idioma no sea
invisible anulaba a las otras dos.

Con los tres:

```
BitmapOr
  → Bitmap Index Scan on ix_translations_fts_es
  → Bitmap Index Scan on ix_translations_fts_en
  → Bitmap Index Scan on ix_translations_fts_other
```

El HNSW sí funcionó a la primera (`Index Scan using ix_translations_embedding`).

**La consulta y la migración quedan atadas**, y eso es una fragilidad real: si se desalinean no falla
nada —la búsqueda sigue devolviendo lo correcto— y solo se vuelve lenta, en silencio. Lo vigila
`rowConfigMatchesIndex.test.ts`, que transcribe a mano la expresión de la migración en vez de leer
el archivo: vive en otro repositorio, y leerlo haría que el test pasara solo porque los dos lados
cambiaron a la vez.

El `CASE` no desapareció: se quedó para **puntuar** (`ts_rank`), que corre sobre las filas que el
filtro ya dejó pasar y por tanto no necesita índice. Filtrar y puntuar se separaron por eso.

#### Lo demás de la migración

- **`searches`**, sin `user_id` ni IP: la pregunta es agregada y no necesita saber quién buscó.
  `empty_handed` es columna generada para que dos adaptadores no puedan calcularla distinto. Índice
  **parcial** sobre `term WHERE empty_handed`, porque el informe que justifica la tabla solo mira
  esas filas.
- **`seller_translations` y `branch_translations`** con las filas `es` sembradas copiando lo que ya
  hay, así que nacen consistentes en vez de vacías. Las columnas originales **no se tocan**: el bot
  las lee y no sabe de locales. El camino de lectura es del slice 5 de i18n, que sigue pendiente —
  esto solo lo desbloquea.

### 3. `PostgresSearchReporter`, y el ruido que casi dejo en producción

Crear `searches` sin conectarla habría sido dejar la mitad del trabajo, así que se escribió el
adaptador y la fábrica pasó a devolverlo.

Al correr la e2e, la tabla tenía **24 filas de la suite**: `zarzaperico1786…`, `xyzzy…`, y también
`pan`, `panela` y `buñuelos`, que son indistinguibles de una búsqueda real. Un defecto introducido
en esta misma sesión: la suite había empezado a contaminar la tabla que responde qué busca la gente.

No se puede limpiar después —no hay prefijo que marque un término— así que la salida es no
escribirlo: `playwright.config.ts` pone `SEARCH_REPORTER=console` y la suite mide contra el
registro. Las 24 filas se borraron; la tabla arranca vacía y su primer dato será el primero de
verdad.

`ConsoleSearchReporter` se queda por eso y porque durante un incidente un `grep` sigue siendo más
rápido que abrir un cliente de SQL.

### Archivos tocados

**Backend (`bot-whatsapp/backend`)**
- `alembic/versions/0029_2026-08-08_search_indexes_uniqueness_and_store_translations.py` (nuevo).

**Consulta y medición**
- `src/infra/dataAccess/searchPosts/PostgresSearchPostRepository.ts` — `matchesQuery` por idioma,
  `ROW_CONFIG` solo para puntuar, `FTS_INDEXED_DOCUMENTS` expuesto como contrato.
- `src/infra/dataAccess/searchPosts/rowConfigMatchesIndex.test.ts` (nuevo).
- `src/infra/dataAccess/searchPosts/PostgresSearchReporter.ts` (nuevo).
- `src/infra/dataAccess/searchPosts/factory.ts` — `createSearchReporter()`.
- `src/infra/dataAccess/db/schema/searches.ts` (nuevo) — espejo Drizzle.
- `src/infra/services/ConsoleSearchReporter.ts` — ya no es el destino por defecto.
- `src/app/api/search/route.ts`, `src/app/[locale]/buscar/data.ts` — usan la fábrica.
- `src/app/api/search/route.test.ts` — el mock de la fábrica.
- `playwright.config.ts` — `SEARCH_REPORTER=console`.

### Validación

```bash
alembic upgrade head        # 0027 → 0028 → 0029
alembic downgrade 0028…     # probado dos veces, limpio
pnpm run test:run           # 966/966  (eran 961)
pnpm run typecheck          # 0
pnpm run typecheck:tests    # 0
pnpm run lint               # limpio (1 info preexistente)
pnpm exec playwright test <búsqueda>                           # 22/22
pnpm exec playwright test <i18n, tienda, publicar, búsqueda>   # 63/63
```

Comprobado contra la base después: `searches` en 0 filas tras la e2e, título corregido, 0
traducciones sin embedding, `BitmapOr` sobre los tres índices.

**Escrito en la base compartida:** el esquema de `0028` y `0029`, la siembra `es` de
`seller_translations` y `branch_translations` (1 fila cada una), y el título de una traducción `es`
con su embedding regenerado. Para deshacer el esquema:
`alembic downgrade 0027_2026_07_31` (revierte 0029 y 0028).

### Recap

La base ya no tiene nada pendiente: unicidad real sobre `(post_id, locale)` y `slug`, índices de
texto que el planner **usa de verdad** —comprobado, no supuesto—, HNSW sobre el vector, la tabla de
búsquedas escribiendo, y las tablas de traducción de tienda listas con su español sembrado. La
búsqueda de texto pasó de un `CASE` no indexable a tres ramas con índice parcial cada una, atadas a
la migración por un test. 966 unitarias, 63 e2e en las áreas tocadas, typecheck y lint limpios.

### Próximos pasos (opciones)

1. **Slice 5 de i18n**: leer `seller_translations` / `branch_translations` en la ficha de tienda y
   traducir la única tienda que hay. El esquema ya no bloquea.
2. **Mirar el dato de `searches`** en unos días: si `strategy='semantic'` casi no aparece, el
   rescate se puede quitar y con él la dependencia de Gemini en la búsqueda.
3. **Los `rounded-*` de contenido**, que siguen siendo una decisión de diseño.
4. **La flakiness de la e2e** y los `Failed query` al insertar traducciones.

Pendiente de ti: nada bloqueante.
