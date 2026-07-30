# Pendientes — traspaso entre sesiones

Punto único de entrada para retomar el trabajo. Reúne lo que quedó abierto en
`features/taxonomia-centralizada.md` y `features/datos-de-prueba-e2e.md`, más los defectos que
aparecieron por el camino y no eran de ningún slice. **No sustituye a las bitácoras**: aquí está el
qué y el por qué se dejó; el detalle de cada decisión sigue en su bitácora.

Última actualización: **2026-07-30**.

---

## Dónde quedó todo

Tres repositorios comparten una sola Postgres. Los tres tienen una rama con el mismo nombre y
**ninguna está publicada** — el trabajo está commiteado en local y nada más:

| Repositorio | Rama | Commits sobre la base | Base |
|---|---|---|---|
| `comida-justa` | `feat/taxonomia-centralizada` | 18 | `dev` |
| `HazloSano/dev` | `feat/taxonomia-centralizada` | 13 | `main` |
| `bot-whatsapp/backend` | `feat/taxonomia-centralizada` | 3 | `main` |

En `bot-whatsapp/backend` hay además una modificación tuya en `README.md` **sin tocar**: no entró en
ningún commit.

**La migración `0026` ya está aplicada** sobre la base compartida y es la cabeza de Alembic. Los tres
repositorios funcionan contra ella. Esto importa para el orden: el código de las tres ramas asume que
las tablas existen, y a la inversa la migración es compatible con el código anterior gracias al
fallback, así que **la base no bloquea ningún despliegue**.

Estado de la base al cerrar: 7 categorías, 24 posts, 14 productos, 0 traducciones sin embedding, 0
publicaciones `e2e-` y 0 categorías `e2e_`.

Estado de la validación en `comida-justa`: `pnpm run validate` en verde — lint, typecheck, 293
pruebas unitarias en 33 archivos, y 27 escenarios e2e (3 saltados).

**Los cinco slices de la taxonomía están entregados.** Lo que sigue es lo que quedó fuera a
propósito, más deuda.

---

## Lo que queda por hacer

### 1. Desplegar

No requiere código. El orden está en `features/taxonomia-centralizada.md`, sección "Orden de
despliegue"; se resume en que cada paso es independiente porque todos toleran el estado anterior.
Antes: publicar las tres ramas y abrir los PRs, que es el único trámite pendiente.

### 2. Slice 2 de datos de prueba — la suite deja de publicar como una persona real

**Esto es lo más valioso que queda.** Hoy la suite e2e escribe atribuyendo las publicaciones a un
usuario de verdad: `seedPost` resuelve el autor con `findAnyUserId()` y `simulateLogin` entra por
defecto como el primer usuario de la tabla `users`. Funciona, pero deja publicaciones de prueba a
nombre de alguien real en una base compartida.

El slice está especificado en `features/datos-de-prueba-e2e.md`. Lo esencial:

- Usuario de prueba propio, creado si no existe, usado por `seedPost` y `simulateLogin`.
- El barrido pasa a ser **por `user_id`**, que atrapa cualquier escritura sin depender de que el slug
  lleve el marcador. Hoy el barrido es por prefijo de slug (`src/e2e/testUtils/testData.ts`), que
  cubre lo que la suite siembra a propósito pero no lo que se cuele por otro camino.
- **La decisión que hay que tomar:** los escenarios de `/admin/catalogo` necesitan un correo de la
  allowlist, así que hay que resolver si el usuario de prueba entra en `HAZLO_SANO_ADMIN_EMAILS` del
  entorno de pruebas o si esos escenarios siguen usando otra sesión.

### 3. Slice 3 de datos de prueba — que el CI lo note

Una comprobación que falle el pipeline si quedan datos de prueba al terminar. Hoy `globalTeardown`
ya falla la suite si detecta residuos, pero eso solo cubre la corrida que los dejó: si alguien mata
el proceso, nadie se entera hasta que rompe las pruebas de otro repositorio — que es exactamente
como se descubrió el incidente original.

### 4. Renombrar y borrar categorías desde `/admin/catalogo`

Quedaron fuera del slice 5 **con motivo, no por olvido**:

- **Renombrar** cascadea a `posts` (el FK es `ON UPDATE CASCADE`, así que la parte de datos es un
  `UPDATE` y ya funciona en SQL), pero también **cambia el texto que alimenta el embedding**. Hacerlo
  desde la UI exige encadenarlo con un reindexado, o los vectores quedan describiendo una categoría
  que ya no se llama así. Es un slice propio, no un botón.
- **Borrar** solo funciona en categorías vacías: `ON DELETE RESTRICT` lo impide en cuanto haya una
  publicación. Desactivar es la operación reversible que cubre la necesidad real, y ya está.

---

## Defectos conocidos, sin arreglar

Ninguno es de un slice; todos aparecieron validando. Se dejan escritos porque cada uno costó tiempo
descubrirlo.

### Una publicación sin media devuelve 500 en vez de degradar

`src/infra/UI/components/CardForList/CardForList.tsx:35` pasa `media[0]` sin comprobar que exista.
`MediaContent` protege el acceso al tipo (`media?.type`, línea 23) pero entrega ese mismo `undefined`
a `DefaultContent`, que lee `media.url` y revienta con
`Cannot read properties of undefined (reading 'url')`. La página responde 500.

`PostDetail.tsx:35` **sí** se protege (`postDetails.media[0] ?? { url: "", type: "", alt: "" }`), así
que el detalle degrada y el listado no.

No se llega por el formulario —`/publicar` exige media— pero sí sembrando directo, que es como se
encontró. Arreglarlo es una línea; se dejó fuera porque no era del slice y porque merece decidir qué
se pinta cuando no hay media, no solo evitar la excepción.

### Playwright arranca el `webServer` antes que `globalSetup`

Consecuencia: **si un residuo impide que la aplicación levante, el barrido no llega a correr** y hay
que limpiarlo a mano. Está escrito en el propio `src/e2e/globalSetup.ts`, donde se va a leer.

No ocurre con lo que la suite siembra hoy (`seedPost` siempre incluye media), pero el límite es real
y conviene tenerlo presente al ampliar el barrido en el slice 2. Si quedara algo atascado:

```sql
SELECT slug FROM post_translations WHERE slug LIKE 'e2e-%';
```

### `src/scripts/migrateProductsToPosts.ts` está desactualizado a propósito

La tabla `products` quedó fuera de alcance por decisión tuya —sus datos ya viven en `posts`—, así que
el script no se migró. Pero `tsconfig.json:27` lo mete en el typecheck, así que `legacyCategory` y
`legacySubCategory` **conservan su firma y lanzan** con un mensaje accionable.

**Si vuelves a correr `pnpm run migrate:products`, hay que actualizar el script primero** para que
lea la taxonomía de la base (`getCategoryTaxonomy()` + `resolveKeyLenient`). Se prefirió lanzar antes
que devolver `null`, porque `null` migraría los 9 productos sin categoría y en silencio — el modo de
fallo mudo que esta feature existe para eliminar.

La tabla `products` sigue viva con 9 filas y etiquetas viejas (`'Alimentación'`, `'Comidas'`).
Migrar lo que queda es trabajo aparte.

### `pageSize` trata el `0` y el `-3` distinto

`packages/use-cases/src/products/SearchProducts.usecase.ts:9` (`HazloSano/dev`):

```ts
const pageSize = Math.min(Math.max(1, params.pageSize || 20), 50);
```

`0` cae al default de 20 (por `||`), mientras que `-3` se acota a 1. Dos entradas igual de inválidas
con dos respuestas distintas. No rompe nada —el controlador ya recorta el techo en
`products.controller.ts:109` y la tabla de casos de `products.controller.spec.ts:72-79` cubre el
resto—, pero la asimetría no es intencional. Se documenta, no se cambió: tocarlo sin necesidad movía
comportamiento observable fuera del alcance del slice.

### El lint de `apps/api` corre con `--fix`

`apps/api/package.json:16` es `eslint "{src,apps,libs,test}/**/*.ts" --fix`. El script **arregla** en
vez de solo reportar, así que un problema de formato nunca aparece al validar: se corrige solo y deja
el árbol sucio sin decirlo. Para ver el estado real hay que correr `eslint` sin la bandera. Los otros
paquetes no lo hacen (`apps/telegram` usa `eslint .`).

### `loadMorePosts.spec.ts:24` es intermitente

Falló una vez y pasó al reintentar, sin relación con los cambios de la taxonomía. Queda anotado por
si reaparece; no se investigó.

---

## Trampas del entorno que ya costaron tiempo

Ninguna es un pendiente, pero todas se pagaron una vez y no hace falta pagarlas dos veces.

- **asyncpg acepta una sola sentencia por `op.execute()`.** Un `execute` con dos sentencias falla con
  `cannot insert multiple commands into a prepared statement`. Y un ensayo con node-postgres **no lo
  detecta**: usa el protocolo simple y las tolera. Si se ensaya una migración, que sea por el driver
  de producción.
- **`PYTHONIOENCODING=utf-8` al redirigir la salida de Alembic en Windows**, o `Panadería` sale como
  `Panader?a` y solo fallan los casos con acento.
- **`next dev` después de un `pnpm run build`** deja `.next` contaminado y tumba el dev server con
  `components.ComponentMod.handler is not a function`. Se resuelve borrando `.next/dev/types`;
  borrar `.next` entero provoca fallos de compilación en frío.
- **Chromium pide `Accept-Language: en-US`**, así que sin `locale: "es-MX"` en
  `playwright.config.ts` la suite entera corre en inglés y los escenarios fallan comparando textos en
  español. Ya está puesto.
- **`reuseExistingServer: false` es deliberado.** Con `true`, Playwright adoptaba el servidor de otro
  proyecto en el puerto 3000 y corría la suite contra la aplicación equivocada. Si el puerto está
  ocupado ahora **falla ruidosamente**, que es lo que se quería; para moverlo:
  `E2E_PORT=3100 pnpm run test:e2e:run`.
- **No bajar versiones de paquetes para esquivar un conflicto de tipos.** El choque de Vite 7 contra
  8 en `HazloSano/dev` venía del hoisting de pnpm y se resolvió subiendo Vitest en los cuatro
  workspaces, no fijando hacia atrás.
