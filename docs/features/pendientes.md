# Pendientes

Registro único de lo que queda abierto, para no tener que reconstruirlo leyendo nueve bitácoras.
Cada punto apunta a su roadmap. **Última sesión: 2026-08-07.**

---

## Por dónde retomar

Todo lo que estaba abierto y no dependía de una decisión tuya quedó cerrado (ver *Resuelto* abajo).
Lo que sigue se reparte en tres montones:

1. **Necesita que decidas** — la migración de `UNIQUE(post_id, locale)` y la revisión de las
   traducciones automáticas. Están más abajo, cada una con su coste y su vuelta atrás.
2. **Bloqueado en Alembic**, que vive en `bot-whatsapp/backend` y toca la base compartida: los
   índices de búsqueda, la tabla de búsquedas y el slice 5 de i18n.
3. **Se puede hacer ya, sin permiso de nadie**: los `rounded-*` del mapa, poner al día
   `docs/database.md` —que hoy describe una base que no existe— y distinguir un fallo de
   persistencia de uno del proveedor en `translatePostUseCase` (ver *Deuda transversal*).

De los tres, el de más valor es el de `translatePostUseCase`: hoy cualquier excepción se registra
como "falló Gemini, ya lo recogerá el backfill", y eso manda a buscar el problema al sitio
equivocado.

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

Ninguna está subida ni tiene PR. Cada una **contiene** a la anterior.

| Rama | Commits desde `dev` | Qué añade |
| --- | --- | --- |
| `feat/design-system-pilares` | 6 | Slices 3–7 del design system |
| `feat/traducciones-contenido` | 14 | + i18n slices 2–3, el arreglo del cambio de idioma en la ficha, y los 4 slices de búsqueda |
| `feat/mudanza-y-tipografia` | 16 | + la mudanza a `src/presentation/` y el barrido de tipografía |

Validación de la última: **930/930 unitarias**, `typecheck` 0, `lint` limpio, `check:i18n` limpio,
`build` compila. La e2e quedó con el punto 1 pendiente.

---

## Requiere una decisión tuya

### `UNIQUE(post_id, locale)` no existe en la base

`docs/database.md:27` y `docs/features/i18n.md:89` lo dan por hecho, pero **ninguna migración lo
crea**. Tampoco hay unicidad sobre `slug`.

Está mitigado en el código: el `INSERT` de traducciones lleva su `WHERE NOT EXISTS` en la misma
sentencia, y el slug se desambigua contando. La base no lo impediría por su cuenta.

Es una **migración Alembic sobre la base compartida** —irreversible— y vive en
`bot-whatsapp/backend`. No se ejecutó.

### Traducciones automáticas ya escritas en producción

Las 23 publicaciones tienen fila `en` generada por Gemini, con slug y embedding. Están auditadas
—sin duplicados, sin títulos sin traducir, sin estructura aplastada— pero **nadie las ha leído una
por una**. Vale la pena revisar al menos los productos que se venden.

Deshacer todo: `DELETE FROM post_translations WHERE locale = 'en';`

---

## Búsqueda

Los cuatro slices están entregados (`docs/features/busqueda-semantica.md` + bitácora): texto
completo, respaldo de idioma, rescate semántico y medición.

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
- **`docs/database.md` está desactualizado**: describe 3 tablas, dice que `posts.id` es `uuid`
  cuando es `text`, y no menciona `tags`, `embedding`, `category` ni `seller_id`.

---

## Design system

Slices 1–9 hechos. Ver `docs/features/design-system.md` y su bitácora.

- **221 `text-*` sueltos, deliberadamente.** Los que quedan están en `Button`, `Alert` y las stories
  —donde el tamaño **es** la variante que el primitivo define— y repartidos de uno en uno por rutas
  sin patrón compartido. Convertirlos sin una repetición detrás no gana nada. El barrido atacó lo
  que sí estaba copiado: 21 encabezados legales, la cabecera de esas páginas y el encabezado de
  columna del pie.
- **`rounded-*` en el mapa.** `Surface` cubre tarjetas y paneles y la paginación ya usa tokens;
  queda el mapa.

---

## Deuda transversal

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
