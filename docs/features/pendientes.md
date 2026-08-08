# Pendientes

Registro único de lo que queda abierto, para no tener que reconstruirlo leyendo nueve bitácoras.
Cada punto apunta a su roadmap. **Última sesión: 2026-08-08.**

---

## Por dónde retomar

**Solo queda un montón, y es el que no depende de este repositorio.**

Todo lo que se podía hacer sin tocar la base compartida está cerrado (ver *Resuelto* abajo). Lo
único abierto es lo que **requiere una migración Alembic** en `bot-whatsapp/backend`, que es
irreversible sobre una base que comparten dos aplicaciones:

1. `UNIQUE(post_id, locale)` y unicidad de `slug` — hoy los sostiene el código.
2. Los índices de búsqueda: GIN sobre el `tsvector` y HNSW sobre el vector.
3. La tabla de búsquedas, para dejar de medir contra el registro del servidor.
4. El slice 5 de i18n: `seller_translations` y `branch_translations`.

Ninguna corre prisa con el tamaño de hoy (23 publicaciones, 46 traducciones, 1 tienda). El orden por
valor sería **2 → 1 → 3 → 4**, y las cuatro caben en una sola migración si se hacen juntas.

Aparte hay dos cosas **medidas pero sin decidir**, que no son deuda sino opciones: el `taskType`
de los embeddings para consultas cortas, y qué hacer con los `rounded-*` de las páginas de
contenido. Las dos están más abajo con sus números.

---

## Resuelto el 2026-08-07

### El submenú sobre el mapa era un falso positivo

`cardControls.spec.ts:98` pasa: **3,6 s** contra un presupuesto de 15 s. Era arranque en frío, como
los otros dos fallos de aquella corrida. El `z-50` del header contra los z-index de Leaflet no tiene
nada de malo.

### Las rutas se calientan solas antes de la suite

`src/e2e/testUtils/warmRoutes.ts`, llamado desde `globalSetup`. Next dev compila **cada ruta la
primera vez que la piden**, no al arrancar; Playwright espera a que el puerto responda, pero
responder no es tener `/productos` compilada, así que el primer escenario pagaba la compilación
dentro de su propio margen de espera.

Dormir unos segundos no lo arregla —corto sigue fallando, largo se lo cobra también a las corridas
calientes—. Esto espera **el hecho**: pide las 7 rutas que la suite pisa casi siempre, **de una en
una**, y cuando ya están calientes cuesta milisegundos. En frío tardó 37 s; en caliente, 15 s. Nunca
tumba la suite: si una ruta no responde, avisa y sigue.

**En serie a propósito, no por comodidad.** En paralelo Next compila varias rutas a la vez y cada
compilación reescribe `.next/dev/prerender-manifest.json`: dos escrituras solapadas lo dejan con un
JSON válido seguido de basura, y a partir de ahí el servidor responde 500 a todo. Es una de las
formas de corromper `.next/dev` que se describen en *Deuda transversal*. Está contado con detalle en
`vendedores-y-tiendas-bitacora.md`, slice 7.

El arreglo de fondo sería correr la e2e contra `next build && next start`, donde no hay compilación
bajo demanda —y además probaría lo que se despliega—, pero le suma el build a cada corrida.

### Los tests ya se typechequean

`tsconfig.test.json` + `pnpm typecheck:tests`. Destapó 39 errores reales; el detalle, en *Deuda
transversal*.

### El dev server colgado

Había un `next dev` de este proyecto en el 3000 que no respondía a nada (`/` y `/productos` se
comieron 90 y 120 s sin contestar) — el mismo que tras la mudanza daba 404 en todo. Se mató; el que
levanta Playwright arranca limpio.

---

## Estado de las ramas

**`dev` ya las contiene todas.** `git rev-list --count dev..<rama>` da **0** para
`feat/design-system-pilares`, `feat/traducciones-contenido`, `feat/mudanza-y-tipografia` y
`feat/distancia-en-tienda`: se fusionaron y la tabla que había aquí —que decía "ninguna está subida"
y contaba 16 commits pendientes— mandaba a buscar trabajo donde ya no estaba. Se puede borrar la
rama local de las cuatro sin perder nada.

`dev` está subida a `origin/dev`.

---

## Requiere una decisión tuya

### `UNIQUE(post_id, locale)` no existe en la base

`docs/features/i18n.md:89` lo da por hecho, pero **ninguna migración lo crea**. Tampoco hay unicidad
sobre `slug`. (`docs/database.md` ya no miente sobre esto: lo dice en su sección *Lo que la base NO
impide*.)

Está mitigado en el código: el `INSERT` de traducciones lleva su `WHERE NOT EXISTS` en la misma
sentencia, y el slug se desambigua contando. La base no lo impediría por su cuenta.

Es una **migración Alembic sobre la base compartida** —irreversible— y vive en
`bot-whatsapp/backend`. No se ejecutó.

### ~~Traducciones automáticas sin revisar~~ — **leídas el 2026-08-08**

Las 23 se leyeron una por una comparándolas con su original. **No había ninguna mistraducción de
fondo**: el sentido, los datos y la estructura estaban bien en las 23. Sí había cuatro defectos de
acabado, todos en producto que se vende, y **los cuatro están corregidos**
(`src/scripts/fixEnglishTranslations.ts`, 11 cambios):

| Qué | Dónde | Por qué importaba |
| --- | --- | --- |
| Frases pegadas sin espacio (`"don't stop.It's"`) | Electrolitos (×3), Pan de Masa Madre Natural (×2) | Se ve en la ficha; es lo único que un cliente leería como descuido |
| `"Dorado"` traducido a `"Golden"` | las 3 pechugas | Es el **nombre** del aderezo. Quien pida "the Golden dressing" no se hace entender en el mostrador — y el Omelet sí lo había dejado como "Dorado" |
| `"arándanos"` → `"blueberries"` en una y `"cranberries"` en tres | Pechuga asada | Misma lista de ingredientes, dos frutas distintas |
| `"Grasas Buenas"` → `"Healthy Fats"` en una y `"Good Fats"` en dos | Pechuga a la macha | Misma frase de la misma plantilla |

También se unificó el título `"Orange Chicken Breast Steak**s**"` a singular, como sus dos hermanas
y como el español. Los embeddings de las 5 filas tocadas se anularon y se regeneraron
(`pnpm run backfill-embeddings`, 5/5): un vector calculado sobre el texto anterior describe un texto
que ya no existe.

Respaldo de las filas originales: `src/scripts/backups/en-translations-5-rows.json`.
Deshacer todo el inglés sigue siendo: `DELETE FROM post_translations WHERE locale = 'en';`

**Lo que NO se tocó, a propósito:** el título en español dice `"Eléctrolitos de frutos rojos"` y la
palabra es **electrolitos**, sin acento. Es contenido de origen, y corregirlo arrastra su slug y su
URL ya indexada. Es tuyo decidirlo.

---

## Búsqueda

Los cuatro slices están entregados (`docs/features/busqueda-semantica.md` + bitácora): texto
completo, respaldo de idioma, rescate semántico y medición. Encima va
`docs/features/busqueda-entre-idiomas.md`, que quitó el filtro de idioma de la consulta.

- **El umbral semántico se midió con frases y no vale para una palabra suelta.** `0.40` sale de
  `"algo para dormir mejor"` → 0.285; con un solo término las distancias suben y la señal se pega al
  ruido:

  ```
  "bread"  (contra filas en inglés)  Sourdough Bread with Seeds  0.430
                                     Natural Peanut Butter       0.439   ← 9 milésimas
  ```

  No hay umbral que los separe, así que no se tocó. El arreglo de fondo sería pedir el embedding con
  `taskType: RETRIEVAL_QUERY`, que Gemini ofrece justo para consultas cortas frente a documentos —
  pide su propia medición y un backfill de los 46 vectores existentes.

- **Índices** GIN sobre el `tsvector` y HNSW sobre el vector. Con 46 traducciones no hacen falta; es
  lo primero que se notará al crecer. **Requiere Alembic.**
- **La tabla de búsquedas.** Hoy la medición va al registro del servidor; el puerto
  `ISearchReporter` ya está para cambiar el destino sin tocar el caso de uso. **Requiere Alembic.**

  Mientras tanto: `grep '\[search\]' | grep 'emptyHanded=true'` responde qué se busca que no
  encontramos, y `grep 'strategy=semantic' | wc -l` dice cuántos embeddings se están pagando.
- **Caché del embedding por término**, si los datos muestran que el rescate es frecuente.
- ~~**Distancia en `/tienda/[handle]`**~~ — **entregada el 2026-08-07** como slice 7 de
  `vendedores-y-tiendas.md`. Ya no queda ningún hueco de cercanía en el sitio.

---

## i18n / traducciones

Slices 0–4 hechos. Ver `docs/features/i18n.md` y su bitácora.

- **Slice 5 — tiendas y sucursales.** `sellers.name`, `sellers.description`, `branches.name` y
  `branches.address` siguen en un solo idioma. Requiere Alembic (`seller_translations`,
  `branch_translations`). Hoy hay **una sola tienda**, así que no corre prisa.
- **RSS y `llms.txt` siguen en español**, ahora por decisión y no por falta de contenido. Un canal
  RSS declara un solo `language`, así que servir los dos idiomas pide un segundo canal
  (`/en/rss.xml`), no mezclarlos. El sitemap sí lista ya los dos idiomas.
- ~~**`docs/database.md` está desactualizado**~~ — **reescrito el 2026-08-08** contra el esquema
  real (`information_schema`, no de memoria): las 19 tablas con dueño, qué es del bot y qué del
  sitio, y una sección *Lo que la base NO impide* que es lo que de verdad hacía falta.

---

## Design system

Slices 1–9 hechos. Ver `docs/features/design-system.md` y su bitácora.

- **221 `text-*` sueltos, deliberadamente.** Los que quedan están en `Button`, `Alert` y las stories
  —donde el tamaño **es** la variante que el primitivo define— y repartidos de uno en uno por rutas
  sin patrón compartido. Convertirlos sin una repetición detrás no gana nada. El barrido atacó lo
  que sí estaba copiado: 21 encabezados legales, la cabecera de esas páginas y el encabezado de
  columna del pie.
- ~~**`rounded-*` en el mapa.**~~ **Cerrado el 2026-08-08**: `StoresMapCanvas` va dentro de un
  `Surface radius="lg"` con `overflow-hidden`, y el `MapContainer` se queda solo con lo suyo
  —tamaño y `isolate`—. El envoltorio existe porque `MapContainer` no acepta `as`.

- **Quedan 45 `rounded-*` no-pastilla fuera del design system, y son más de los que este documento
  decía.** Contados: 9 `rounded-2xl`, 7 `rounded-sm`, 7 `rounded-lg`, 5 `rounded-r`, 3 `rounded-xl`,
  2 `rounded-3xl`, 1 `rounded-md`, 1 `rounded-tl` (más 23 `rounded-full`, que sí son deliberados:
  avatares y pastillas, donde la forma **es** el componente).

  Casi todos viven en páginas de contenido: `nosotros` (7), las dos legales (7), `pilares` (3),
  el header y sus menús (7). **`--radius-lg` es 0.5rem y el token más grande que existe**, así que
  `rounded-2xl` y `rounded-3xl` no están usando ningún token: son valores de Tailwind por su cuenta.

  No se barrieron a propósito. Bajarlos a `rounded-lg` **cambia visiblemente** cómo se ven esas
  páginas —las tarjetas de `nosotros` son deliberadamente más suaves que una tarjeta de producto—,
  y eso es una decisión de diseño, no una limpieza. Las dos salidas honestas: añadir un
  `--radius-xl` al sistema y adoptarlo, o decidir que el contenido editorial redondea distinto que
  el catálogo y dejarlo escrito.

---

## Deuda transversal

- ~~**`translatePostUseCase` culpa siempre al proveedor.**~~ **Cerrado el 2026-08-08.** Un solo
  `try` envolvía la traducción **y** las dos escrituras, así que un error de Postgres salía como
  `provider-failed` y el aviso prometía un backfill que iba a fallar igual. Se vio de verdad en la
  corrida e2e del 2026-08-07:

  ```
  [translations] post 80dea1e5-… queda pendiente en en  Error: Failed query: …
  ```

  Ahora hay un `storage-failed` aparte, y los dos avisos dicen cosas distintas porque piden cosas
  distintas: lo del proveedor se arregla solo al repetir el backfill, y lo de la base **no** —la
  traducción ya se pagó, repetir vuelve a pagarla para estrellarse igual—. De paso, las dos lecturas
  iniciales estaban fuera de todo `try`, así que "nunca lanza" dejaba de ser cierto justo cuando la
  base era el problema.

- ~~**Los tests no se typechequean.**~~ **Cerrado el 2026-08-07** con `tsconfig.test.json` y
  `pnpm typecheck:tests`. Va aparte del `typecheck` de siempre para no frenar el ciclo rápido, así
  que **hay que acordarse de correrlo**: no es una puerta automática.

  El `tsconfig.json` normal no solo excluye `*.test.ts(x)`; también `*.spec.ts` y `src/e2e/*`, o sea
  que `globalSetup.ts` y `globalTeardown.ts` tampoco se miraban nunca.

  Salieron **39 errores**, no 32, y lo que destaparon merece leerse porque casi ninguno era ruido:

  - `props.createdAt` era un `Date` donde `Card` espera una cadena ISO, y acababa en el atributo
    `dateTime` de un `<time>` como "Wed Aug 07 2026 …".
  - `saveSeo.test.ts` envolvía el fixture en una capa `es:` que `saveSeo` ya añade sola: guardaba
    `translations.es.seo.es.title`. Verde porque la aserción comparaba contra el mismo objeto mal.
  - Los mocks de `createOnePost` estaban anotados con la interfaz pelada, lo que **borra** el tipo de
    `vi.fn()`: 18 errores de un tirón. Ahora usan `Mocked<T>`, que además exige que
    `mockResolvedValue` reciba lo que el puerto promete.
  - `mapPostsToCards.test.ts` era exactamente el caso del `fallbackLocale` que ya se sospechaba.
  - `SearchPostsUseCase.test.ts` tenía dos dobles sin `searchByVector`, que el puerto exige desde el
    rescate semántico.

  **Cuidado con `incremental`.** Heredado del config base, la primera pasada decía **0 errores** y
  la siguiente, sin tocar nada, sacaba 39. Está puesto a `false` en `tsconfig.test.json` a
  propósito: un comprobador que calla cuando hay errores es peor que no tenerlo.

- **`.next/dev` se corrompe** cuando se mata el dev server a lo bruto. Se arregla borrando la
  carpeta, pero conviene reconocerlo antes de perder una hora:

  - `pnpm typecheck` falla con ~20 errores que no son del repo.
  - La aplicación **arranca y sirve**, pero cada página escupe `SyntaxError: Unexpected
    non-whitespace character after JSON` sin línea que la sitúe, más `Failed to generate static
    paths for /[locale]`. El archivo roto es `.next/dev/prerender-manifest.json`, que queda a medio
    escribir. Despista mucho porque el mensaje se parece al de los dos `JSON.parse` de
    `FIREBASE_SERVICE_ACCOUNT` —`init.ts` y `VertexEmbeddingService.ts`—, pero esos dos están en
    `try/catch` y **avisan con su propio texto**: si el `SyntaxError` viene pelado, no son ellos.

  Para saberlo en un segundo, sin adivinar cuál de los JSON es:

  ```bash
  for f in $(find .next -maxdepth 3 -name "*.json"); do
    node -e "try{JSON.parse(require('fs').readFileSync('$f','utf8'))}catch(e){console.log('$f',e.message)}"
  done
  ```

- **La e2e y el dev server compiten por el puerto 3000.** `playwright.config.ts` fija
  `reuseExistingServer: false` a propósito —para no adoptar el servidor de otro proyecto— así que la
  suite no arranca si ya tienes `pnpm dev` levantado. Dos salidas: `E2E_PORT=3100` (que el propio
  config documenta), o un config temporal con `reuseExistingServer: true` cuando el servidor que
  corre es de **este** proyecto. En esta sesión se usó lo segundo y se borró después.

- **La suite e2e completa tarda ~7 min** y roza los límites de ejecución. Partirla en dos mitades
  por carpetas funciona bien. Lo de que *el primer test tras borrar `.next` suele fallar* ya lo
  cubre `warmRoutes`; si aparece de nuevo, mira primero si la ruta del test está en su lista.
