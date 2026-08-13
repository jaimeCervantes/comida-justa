# Bitácora — Datos de prueba que no sobreviven a la suite

Append-only. Roadmap en `docs/features/datos-de-prueba-e2e.md`.

---

## Slice 1 — El slug de prueba se marca y se barre *(2026-07-30)*

### Objetivo

Que una corrida de e2e no pueda dejar filas en la base que comparten tres repositorios, aunque el
proceso muera a mitad. El incidente que lo motivó está en
`taxonomia-centralizada-bitacora.md`: tres publicaciones sobrevivieron a una corrida caída, el
golden del backend empezó a fallar por datos ajenos y una prueba de `apps/api` se diagnosticó mal.

### Decisiones y por qué

- **Prefijo `e2e-` en el slug, no sufijo.** Los datos filtrados tenían la forma
  `miel-de-abeja-1785417725068`: barrer por el timestamp final habría borrado también cualquier
  publicación real que terminara en dígitos. Además `LIKE 'e2e-%'` usa `idx_translations_slug` y
  `LIKE '%-123'` no. **Verificado antes de activarlo:** cero publicaciones reales contienen `e2e`
  en el slug.
- **En el slug y no en el título.** El título se ve en pantalla y varios escenarios lo comparan
  literalmente; el slug es identificador, no contenido.
- **`testPost()` deriva el slug con `PostEntity.generateSlug`,** el mismo código que corre al
  publicar. Sin eso, las publicaciones creadas *desde la UI* —donde la app decide el slug— quedarían
  fuera del barrido, que es justo la clase de hueco que dejó datos. Si la regla de slug cambia, la
  prueba la sigue en vez de esperar una URL que ya no existe.
- **El módulo del marcador es puro.** Lo que decide qué se borra de una base compartida merece
  pruebas que corran sin conexión: `testSlug.ts` no importa la base, y su spec de Vitest fija que el
  marcador **distinga** —`mie2e-de-abeja` y `una-receta-e2e-casera` **no** se barren—, no solo que
  coincida.
- **`globalSetup` barre, `globalTeardown` barre y falla.** `afterEach` sigue existiendo: mantiene la
  base limpia *durante* la corrida para que un escenario no vea lo sembrado por otro. Los ganchos
  globales cubren lo que `afterEach` no puede.

### Dos hallazgos del camino

1. **Playwright arranca el `webServer` antes que `globalSetup`.** Lo descubrí simulando una fuga: al
   sembrarla *sin media*, la portada devolvía 500, el servidor nunca quedó listo y **el barrido no
   llegó a correr**. La simulación era irrealista —`seedPost` siempre incluye media— pero el límite
   es real y quedó escrito en el propio `globalSetup`: si un residuo impide que la app levante, hay
   que barrerlo a mano.
2. **Playwright también tomaba los `*.test.ts` de Vitest.** Su `testMatch` por defecto incluye
   `test` y `spec`, y bajo `src/e2e/` ahora conviven pruebas unitarias de los ayudantes. Se acotó a
   `*.spec.ts`, lo que además hace explícita la frontera: `.spec.ts` es navegador, `.test.ts` es
   unitario.

### Un defecto de la app que esto destapó, y que NO se arregla aquí

Una publicación sin media hace que `MediaContent` reviente con
`Cannot read properties of undefined (reading 'url')` y la página responde 500 en vez de degradar.
No se puede llegar ahí por el formulario —exige media— pero sí sembrando directo. Queda anotado; no
es de este slice.

### Archivos tocados

- `src/e2e/testUtils/testSlug.ts` *(nuevo, puro)* + su spec de Vitest *(31 casos)*
- `src/e2e/testUtils/testData.ts` *(nuevo)* — el barrido y el conteo
- `src/e2e/globalSetup.ts`, `src/e2e/globalTeardown.ts` *(nuevos)*
- `playwright.config.ts` — ganchos globales y `testMatch` acotado
- Los 6 specs que siembran + `publishTestPost.ts`, migrados al marcador
- `docs/features/datos-de-prueba-e2e.md` y `src/e2e/testData/testData.feature` *(nuevos)*

### Validación

| | |
|---|---|
| Unitarias del marcador | **31**, incluida la tabla de lo que **no** se barre |
| Suite e2e completa | **27 pasan, 3 saltados, 0 fallan** |

**Probado contra el incidente real**, no solo en teoría:

```
1) Se sembró una fuga con el sembrador real (con media, como las de verdad).
   La siguiente corrida imprimió:
   [e2e] se barrieron 1 publicación(es) ... de una corrida anterior.
   Si esto se repite, alguna corrida está muriendo antes de limpiar.
   -> publicaciones e2e- restantes: 0

2) Mutación: se dejó el barrido sin efecto y se sembró un residuo.
   globalTeardown falló, como debe:
   Error: [e2e] quedaron 1 publicación(es) ... y el barrido no pudo borrarlas.
   Revísalas a mano: SELECT slug FROM post_translations WHERE slug LIKE 'e2e-%'
```

**El círculo cerrado** — que es el criterio que de verdad importaba: se corrió la suite completa y,
**justo después**, `pytest` del backend (**92/92**) y las de integración de `apps/api` (**152/152**).
Ambas verdes: ya no hay datos de prueba con los que tropezar.

### Escrito en recursos compartidos

Las publicaciones de prueba que la propia suite crea y borra, más dos fugas simuladas a propósito
para comprobar el barrido — ambas eliminadas. Estado final: 0 publicaciones `e2e-`, 0 categorías
`e2e_`, 24 posts y 14 productos, como antes de empezar.

### Recap

Marcar el dato de prueba en el slug y barrer en los ganchos globales convierte una limpieza que
dependía de que el test terminara bien en una que no depende de nada. Está probado contra el
incidente que lo motivó —fuga sembrada, fuga barrida— y contra su propio fallo —barrido roto,
teardown en rojo—, y se cierra comprobando que los otros dos repos quedan verdes justo después de
correr la suite. El límite conocido (el `webServer` arranca antes que el barrido) quedó escrito
donde se va a leer.

### Próximos pasos (opciones)

1. **Slice 2** — que la suite deje de publicar como una persona real: usuario de prueba propio y
   barrido por `user_id`, que atrapa cualquier escritura sin depender del nombre.
2. **Arreglar el 500 de la publicación sin media**, que este slice destapó.
3. **Slice 3** — que el pipeline falle si quedan datos de prueba al terminar.

Los tres, con su contexto y el estado de las ramas, están consolidados en
[`docs/pendientes.md`](../pendientes.md).

## Corrección — La tienda de la cuenta de la suite también es dato de prueba *(2026-08-02)*

### Objetivo

Devolver la suite a verde. Seis escenarios de `sellerStore/` agotaban los 90 s de timeout en su
`beforeEach`, esperando el botón «Abrir mi tienda» de `/cuenta`.

### El diagnóstico

Ninguno era un fallo de la aplicación: la base compartida tenía una tienda **`healthy-food` /
«Healthy Food»** abierta a nombre de la cuenta de la suite (`pw.healthy.food@gmail.com`), creada el
2026-08-02 04:34 UTC — la corrida que quedó en `interrupted`. Y `/cuenta` **no pinta el formulario
de alta cuando ya hay tienda**, así que los escenarios esperaban un botón que la página ya no tenía
motivo para dibujar.

Lo caro del caso es que **es el mismo agujero que este repo ya documentó para las direcciones
personales**, en el comentario del `UPDATE users` de `testData.ts`: el formulario de `/cuenta`
precarga el nombre a partir del de la cuenta, así que una corrida que muera entre el `fill` y el
`click` deja un dato **sin el marcador `e2e-`**, invisible para un barrido por prefijo. Se arregló
para `username` y se dejó igual para `sellers`, que tiene exactamente la misma forma: se precarga
igual, se filtra igual y bloquea igual — con el agravante de que aquí el bloqueo es permanente,
porque nada vuelve a mostrar el formulario.

### Decisiones

- **Barrer por dueño, no solo por prefijo.** `TEST_SELLER_MATCH` añade
  `user_id IN (SELECT id FROM users WHERE email = <cuenta de la suite>)` al `slug LIKE 'e2e-%'`. Lo
  que esa cuenta tenga abierto es de la suite por construcción —el prefijo `pw.` existe para eso—, y
  al terminar una corrida no debería tener ninguna tienda. Es la misma decisión que ya se había
  tomado para `username`, aplicada donde faltaba.
- **En el barrido global, no en un `beforeEach` por spec.** El fallo es *entre corridas*, y
  `globalSetup` es donde el repo ya decidió que se resuelve eso. Seis `beforeEach` con una guarda
  habrían tapado el síntoma seis veces y dejado el barrido mintiendo.
- **Nunca por `posts.user_id`.** La cuenta de la suite también tiene publicaciones reales del
  catálogo (p. ej. «¿Tu crema de almendras protege tu corazón…?»). Las publicaciones se siguen
  barriendo por `seller_id`, así que una tienda de prueba se lleva su catálogo y nada más.
- **`countTestData` cuenta con el mismo criterio**, si no el `globalTeardown` seguiría dando por
  limpia una corrida que dejó tienda abierta.

### Archivos tocados

- `src/e2e/testUtils/testData.ts` — `TEST_SELLER_MATCH` / `TEST_SELLER_IDS`, usados por el barrido
  (posts, branches, sellers) y por el conteo.

### Validación

| | |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | exit 0 *(1 `info` preexistente en `IndexingStatusPanel.tsx`)* |
| `pnpm run test:run` | **501 pasan / 55 archivos** |
| `pnpm run test:e2e:run` | **65 pasan, 3 saltados, 0 fallan** *(3.8 min)* |

Los seis que fallaban —`branches` (3), `managePost` (1), `profile` (1), `sellerStore` (1)— pasan sin
tocar ni un spec ni una página: solo dejó de haber una tienda fantasma delante.

### Escrito en recursos compartidos

`globalSetup` borró la tienda `healthy-food` y su sucursal («Healthy Food», Melchor Ocampo #2), ambas
residuo de la corrida interrumpida. No colgaba ninguna publicación de ellas. Estado final: 1 tienda
(`hazlo-sano`, la real) con su sucursal, 24 posts (14 productos + 10 anuncios), 0 residuos `e2e-`.
**Para deshacerlo** basta volver a abrir la tienda desde `/cuenta` con esa cuenta; no hay nada más
que restaurar.

### Recap

La suite estaba roja por un dato, no por un defecto: una tienda sin marcador, de la propia cuenta de
prueba, que ningún barrido sabía reconocer y que apagaba para siempre el formulario del que dependían
seis escenarios. El barrido ahora reconoce como suya cualquier tienda de la cuenta de la suite, que
es la misma regla que ya se aplicaba a las direcciones personales por la misma razón. Suite completa
en verde y base compartida en el estado en que estaba.

### Próximos pasos (opciones)

1. **Cerrar el patrón entero**: `sessions` es lo único que sigue filtrándose (68 filas vivas de
   corridas caídas). Caducan solas en una hora y no rompen nada, pero son el último resto del mismo
   fallo — barrerlas por la cuenta de la suite en `globalSetup` cierra el tema.
2. **Simetría en `countTestData` para `usernames`**: el barrido libera la dirección por correo, pero
   el conteo solo mira el prefijo. Hoy no se nota —el barrido corre antes del conteo—, pero es la
   misma asimetría que causó esto.
3. **Retomar la búsqueda semántica** (`@slice-5` de `unifiedCatalog.feature`), que quedó encuadrada
   pero sin empezar: los 24 vectores están escritos y `/buscar` sigue haciendo `ILIKE`.

Pendiente en el usuario: `src/e2e/i18n/i18n.spec.ts` tiene cambios sin confirmar (el menú
«Comunidad» sacó *Products* del menú principal y el escenario pasó a *About us*). Pasa en verde en
esta corrida; falta decidir si se confirma y corregir un comentario que quedó diciendo «ya no es
`/en/nosotros` sino `/en/nosotros`».

---

## Corrección — Identificarse también hay que calentarlo *(2026-08-12)*

### Objetivo

Correr la suite completa en dos mitades (`--shard=1/2` y `--shard=2/2`) sobre `dev` y dejar en verde
lo que saliera rojo.

### El diagnóstico

Un solo fallo en las dos mitades: `createPost.spec.ts:31` («Then a Google Sigin provider should be
presented»), esperando 5 s un botón que no llegó.

No era una regresión, era **compilación en frío**, el mismo patrón que ya documenta `warmRoutes.ts`.
La diferencia es que aquí no bastaba con calentar la página, porque identificarse son **dos unidades
de compilación**:

- `/auth/signin` la pinta el servidor, y de eso el escenario tenía tiempo de sobra: `waitForURL` va
  contra el presupuesto del escenario (90 s).
- Los botones de proveedor **no vienen en ese HTML**. Los pide el navegador con `getProviders()`
  contra `/api/auth/providers`, y ese controlador **no lo compila nadie más en toda la corrida**: la
  aplicación no monta `SessionProvider` —la sesión se lee en el servidor con `auth()`—, así que la
  única llamada de cliente a `/api/auth/*` que existe en el proyecto es justo esa. Se comprobó con
  `grep`: `next-auth/react` aparece en un solo archivo.
- Y eso lo pagaba `toBeVisible`, cuyo plazo es de **5 s**, no de 90.

De ahí que fallara en la corrida completa y pasara en aislamiento: en aislamiento la ruta ya estaba
compilada en `.next` de la vez anterior.

### Decisiones

- **Se calientan las dos, y la que importa es la API.** Calentar solo `/auth/signin` habría dejado el
  fallo intacto: lo que llega tarde es `/api/auth/providers`. Van juntas porque la página sin sus
  botones tampoco sirve de nada.
- **No se tocó el spec.** Subir el plazo del `toBeVisible` habría escondido el problema en vez de
  quitarlo, y además se lo habría cobrado a todas las corridas calientes. La lista de calentamiento
  espera **el hecho** —la ruta respondió— y cuando ya está caliente cuesta milisegundos: el
  calentamiento pasó de 16 a 18 rutas sin coste apreciable (54 s antes, 29 s después, sobre caché).
- **Verificado en la condición que lo rompía, no en una cómoda.** Se borró `.next` entero y se corrió
  ese spec solo: **18/18 rutas calientes en 56 s y 3/3 en verde**. En frío es donde fallaba.

### Archivos tocados

- `src/e2e/testUtils/warmRoutes.ts` — dos entradas nuevas en `RUTAS` (`/auth/signin` y
  `/api/auth/providers`) con el porqué escrito al lado.

### Validación

| | |
|---|---|
| `pnpm exec playwright test --shard=1/2` *(antes del arreglo)* | 136 pasan, 3 saltados, **1 falla** *(14.4 min)* |
| `pnpm exec playwright test --shard=2/2` | **139 pasan, 0 fallan** *(8.7 min)* |
| `createPost.spec.ts` con `.next` borrado *(verificación en frío)* | **3 pasan** *(1.7 min)* |
| `pnpm exec playwright test --shard=1/2` *(después del arreglo)* | **137 pasan, 3 saltados, 0 fallan** *(10.0 min)* |
| `pnpm exec biome check src/e2e/testUtils/warmRoutes.ts` | limpio |
| `pnpm run typecheck:tests` | exit 0 |

**Total de la suite: 276 pasan, 3 saltados, 0 fallan.**

Las mitades se corrieron **en serie, nunca en paralelo**, y no por memoria: `globalSetup` barre por
prefijo *toda* la base y `globalTeardown` falla si algo quedó, así que dos mitades a la vez se
borrarían los datos la una a la otra a media corrida. El puerto también es uno solo
(`reuseExistingServer: false`).

### Escrito en recursos compartidos

Nada que deshacer. El `globalSetup` de la primera mitad barrió **1 publicación** residual de una
corrida anterior a esta sesión —el aviso está para eso— y los tres `globalTeardown` terminaron sin
protestar, que es la forma que tiene la suite de afirmar que no dejó nada. También se borró `.next`,
que es caché de compilación local y se rehace solo.

### Recap

La suite está completa en verde sobre `dev`. El único rojo era un escenario que medía la velocidad
del compilador y no el comportamiento de la aplicación, y el arreglo es una línea en la lista de
calentamiento más la explicación de por qué la API va aparte de su página. El cambio vive en
`src/e2e/testUtils/warmRoutes.ts` y está **sin confirmar**.

### Próximos pasos (opciones)

1. **Confirmar el cambio** — es el único pendiente inmediato; queda en el árbol de trabajo de `dev`.
2. **Revisar el resto de rutas de cliente que piden API propia**, si algún día se añade una: el
   patrón «la página está caliente pero su API no» se repetirá igual, y hoy la lista solo lo cubre
   para identificarse.
3. **Los tres pendientes de la corrección anterior siguen abiertos** (barrer `sessions`, la simetría
   de `usernames` en `countTestData`, y la búsqueda semántica).
