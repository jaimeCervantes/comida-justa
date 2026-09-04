# Bitácora — Inventario de existencias

Append-only. El roadmap y los criterios de aceptación viven en `docs/features/commerce/004-2026-09-03-inventario-de-existencias.md`.

---

## Slice 1 — Fijar y ver existencias por producto (2026-09-03)

### Objetivo

Que quien vende pueda anotar cuántas unidades le quedan de un producto, y que el sitio deje de
ofrecer lo que se acabó sin que nadie tenga que acordarse de apagarlo. Y que ese número lo pueda
llevar también **el dueño de la tienda**, no sólo quien redactó la ficha.

### Lo que dijo la base antes de decidir nada

432 publicaciones: 418 productos, 10 anuncios, 2 servicios y 2 eventos. Cuatro marcadas agotadas, las
cuatro a mano. Una sola tienda con catálogo, `Hazlo Sano`, cuyo dueño (`44pZIIJ5w1vSYkDQ6gfb`) no es
la cuenta de la suite de pruebas — dato que resultó ser justo lo que hacía falta para probar la
segunda vía de autorización sin inventar nada. Y 14 pedidos que ya vendieron 9 pechugas, 8 donas y 7
sueros **sin descontar de ningún lado**, porque no había ningún lado.

### Decisiones y por qué

- **`NULL` no es `0`, y ahí está toda la migración.** La columna nace nula y se queda nula en las 432
  filas. Nulo significa «esta publicación no lleva inventario» y su disponibilidad la sigue
  decidiendo el interruptor manual de siempre. Un `server_default` de 0 habría agotado el catálogo
  entero en el instante de aplicar la migración; uno de 10 se habría inventado un dato que nadie
  contó. Es la misma forma que ya tienen `starts_at` (0042) y `duration_minutes` (0044).
- **`is_available` no se toca: se deriva.** Es la columna que ya leen el sitio, el carrito, la
  búsqueda, el JSON-LD y **el chatbot**. Cuando un producto lleva inventario, `is_available` se
  calcula del número y se escribe **en la misma sentencia**. El resultado es que cuatro lectores
  siguieron funcionando sin una línea de cambio, y que no existe un instante en el que
  `stock_quantity` valga 0 mientras `is_available` todavía dice que sí — la ventana en la que el bot
  seguiría recomendando lo que acaba de agotarse.
- **La regla vive en el dominio, no en un trigger.** Un trigger la escondería del código que la tiene
  que explicar, y el día que el inventario admita reservas la regla cambia. La base sólo afirma lo
  que es verdad siempre: `CHECK (stock_quantity IS NULL OR stock_quantity >= 0)`.
- **`canTrackStock` es más estrecho que `isSellable`.** Un servicio se vende, pero no se entrega en
  piezas: a una masajista no se le acaban los masajes, su disponibilidad es la agenda. Sólo un
  `producto` cuenta ejemplares.
- **Autorización por dos vías, y los nulos no se comparan.** `canManagePost` acepta a quien publicó
  **o** al dueño de la tienda que lo vende. La segunda vía exige que los dos `sellerId` existan: un
  `null === null` habría dejado que cualquiera que publicó sin tienda administrara lo de cualquier
  otro que también publicó sin tienda.
- **El `sellerId` de quien pide sale de la sesión, nunca del formulario.** Es la mitad que hace segura
  la vía nueva: da igual que el `postId` venga forjado.
- **Códigos de error, no frases.** `SetPostStockUseCase` devuelve `not-allowed` / `not-trackable` /
  `invalid-stock` y el componente los traduce, siguiendo a `AdvanceOrderUseCase`. Los casos de uso
  hermanos de `managePost` todavía devuelven español horneado en el dominio; no se tocaron, pero lo
  nuevo no amplía esa deuda. El navegador y el servidor comparten la clave del catálogo para la
  misma regla, así que no pueden contradecirse.
- **Una publicación ajena se responde igual que una inexistente.** Contestar «no existe» convertiría
  el campo en una forma de averiguar qué ids son buenos.
- **El interruptor manual desaparece en cuanto hay inventario.** Dos mandos para lo mismo pueden
  contradecirse: un producto agotado a mano con 5 unidades guardadas no sabría qué contestar.
  Decisión tomada con el usuario en el gate.
- **Administrar no es editar.** El dueño de la tienda ve el campo de existencias pero **no** el botón
  de editar: el texto sigue siendo de quien lo escribió, y `UpdateOnePostUseCase` se lo negaría.
  Enseñarle un botón que el servidor le va a negar sería mentirle. De ahí que `OwnerControls` tenga
  dos permisos (`canEdit` / administrar) y no uno.

### Archivos tocados

**Esquema (repo del backend Python).** `alembic/versions/0048_2026-09-03_add_post_stock_quantity.py`.

**Espejo y lectura.** `db/schema/posts.ts`, `managePost/PostgresPostAdminRepository.ts` (con `setStock`
y `seller_id`/`stock_quantity` en la lectura), `getOnePostWithPaginatedComments/PostgresGetOnePost.ts`.

**Dominio.** `entities/post/stock.ts` y `postPermissions.ts`, nuevos, con sus pruebas.

**Casos de uso.** `managePost/setPostStockUseCase.ts`, el puerto `IPostAdminRepository`
(`PostStockUpdate`, `sellerId`, `stockQuantity`) y `__fixtures__/postAdmin.ts` — extraído para que
las dos pruebas de `managePost` no tuvieran dos copias del mismo doble.

**Presentación.** `post/stockAction.ts`, `post/StockControl/`, `post/StockRemaining/`,
`[slug]/ui/OwnerControls.tsx` y `[slug]/ui/PostDetail.tsx`.

**i18n.** Nueve claves nuevas en `post`, en `es.json` y `en.json`.

**Pruebas.** `e2e/inventory/` (`.feature`, spec y objeto de página), `e2e/testUtils/seedStock.ts`,
`stock_quantity` en `readPostRow.ts`, y `OwnerControls.test.tsx`.

### Comandos

```
alembic upgrade head          # en bot-whatsapp/backend
pnpm run typecheck
pnpm run lint
pnpm run test:run
pnpm exec playwright test src/e2e/inventory
```

### Validación

- `typecheck`: limpio.
- `lint`: limpio (`biome check`, 1077 archivos).
- `test:run`: **2587 pruebas en 238 archivos, todas en verde**. De ellas, 27 nuevas de dominio, 14 del
  caso de uso, 8 de `StockRemaining` y 5 de `OwnerControls`.
- `playwright test src/e2e/inventory`: **11 de 11 en verde**, en 3.0 min.

### Lo que se escribió en la base compartida, y cómo se deshace

- **La migración `0048_2026_09_03`.** Añade `posts.stock_quantity` (nula) y su `CHECK`. Comprobado
  después de aplicarla: 432 filas, **0 con inventario**, los mismos 4 agotados que antes. No
  reescribió ninguna fila. Se deshace con `alembic downgrade 0047_2026_08_29`.
- **Las publicaciones de la suite.** Se siembran con prefijo `e2e-` y se borran en el `afterEach`.
  Comprobado al terminar: `0` filas con ese prefijo.

### Desviaciones del roadmap

- **El `abc` del `Scenario Outline` salió de la e2e.** El campo es numérico y el navegador no acepta
  letras, así que no es algo que una persona pueda enviar. La regla existe igual en el servidor —un
  formulario se puede forjar— y se prueba en `setPostStockUseCase.test.ts`. Anotado en el `.feature`.
- **"Quien no es dueño de nada" se afirma como «no se le ofrece».** Forjar una Server Action desde
  Playwright es frágil; el rechazo del servidor lo prueba el caso de uso, que es donde vive la regla.
- **Apareció un hueco de producto que el roadmap no anticipaba.** La e2e del dueño de la tienda falló
  porque `PostDetail` sólo pintaba los controles a `isOwner`: el servidor autorizaba a alguien que no
  tenía dónde pulsar. Se arregló en `PostDetail` con `canManagePost` y el reparto `canEdit`. Es el
  caso de una prueba haciendo su trabajo, no de una prueba frágil.

### Follow-ups

- `PostOwnershipError` y `PostNotFoundError` siguen llevando español horneado en el dominio, y
  `SetPostAvailabilityUseCase` lo pinta tal cual. Migrarlos a códigos es una limpieza aparte.
- Hoy no hay forma de **dejar** de llevar inventario (volver a `NULL`) desde la interfaz. Nadie lo ha
  pedido; cuando se pida, es un botón y una rama en el caso de uso.
- La tarjeta de un listado todavía no dice cuántas quedan, sólo la ficha. Entra natural con el
  slice 2.

### Recap

`posts.stock_quantity` existe en la base compartida, nula en las 432 publicaciones, y el catálogo se
comporta exactamente igual que ayer. Un producto empieza a llevar inventario cuando alguien escribe
su primer número en la ficha; desde ese momento el número manda, `is_available` se deriva de él en la
misma escritura y en cero aparece la insignia de Agotado, se apaga «Pedir por WhatsApp» y el chatbot
deja de recomendarlo — todo por los caminos que ya existían, sin tocar a ninguno de sus cuatro
lectores. Puede llevarlo quien publicó y también el dueño de la tienda que lo vende, que ve el campo
pero no el botón de editar. Todo verde: 2587 unitarias y 11 e2e.

### Próximos pasos (opciones)

1. **Slice 2 — el panel de inventario de la tienda** (`/cuenta/inventario`). Es el que de verdad hace
   usable esto con 418 productos: hoy poner existencias significa abrir 418 fichas. La opción con más
   valor por trabajo.
2. **Slice 3 — que el pedido descuente al aceptarse.** Cierra el círculo y elimina el mantenimiento a
   mano, pero sin el panel el número inicial hay que ponerlo ficha por ficha.
3. **Enseñar las existencias en la tarjeta de los listados.** Barato, y hace visible el inventario
   donde la gente mira primero.
4. **Nada más por ahora**: dejar el slice 1 en producción, poner existencias a un puñado de productos
   reales y ver si el número se mantiene solo antes de construir más.

**Pendiente de tu parte:** decidir cuál de las cuatro. Y, si quieres verlo funcionando ya, elegir a
qué productos reales ponerles existencias — hasta que alguien escriba un número, la entrega es
invisible por diseño.

---

## Slice 2 — El panel de inventario de la tienda (2026-09-03)

### Objetivo

Que poner existencias deje de significar abrir 418 fichas. `/cuenta/inventario` enseña los productos
de la tienda con su número editable en el mismo renglón, y tres filtros que contestan las preguntas
que de verdad se le hacen a un inventario.

### Decisiones y por qué

- **Tres ámbitos, no un filtro genérico.** `all`, `out` («qué repongo») y `untracked` («qué me falta
  por contar»). El tercero es el que importa el primer día: en una tienda que estrena inventario
  **todo** está sin contar, y sin ese filtro el trabajo pendiente queda escondido entre lo hecho.
  Un parámetro inventado cae a `all` en vez de dar error: es alguien que editó la URL.
- **`= 0` y `IS NULL` son consultas distintas, y esa diferencia es el modelo.** Un `= 0` que también
  atrapara los nulos pondría las 418 publicaciones sin contar en la lista de «hay que reponer».
- **La lista va por `seller_id`, no por `user_id`.** Es la misma decisión que toma `canManagePost` al
  autorizar la escritura: si el dueño puede guardar el número, tiene que poder verlo. `Hazlo Sano`
  tiene productos escritos por más de una cuenta.
- **Sí filtra por estado de moderación**, y eso lo encontró una prueba, no yo (ver abajo). Lo que la
  moderación bajó no está en el escaparate: contarle unidades no cambia nada, y la tarea que le toca
  es arreglarlo, conversación que pasa por su ficha.
- **Ordenado por título, no por fecha.** Una lista de novedades se lee de arriba abajo; un inventario
  se recorre buscando algo entre 418 renglones, y por orden alfabético la página donde está algo es
  adivinable. Desempata por `id`: seis "Barra de Proteína … — Pieza individual" comparten casi todo
  el nombre.
- **20 por página**, no 10 como los pedidos: aquí no se lee cada renglón, se busca uno y se escribe
  un número.
- **El campo del renglón es el mismo `StockControl` de la ficha**, en variante `compact`. Escribir un
  segundo campo de existencias habría sido dos sitios donde arreglar la misma regla y dos formas de
  que el número se guarde distinto según por dónde entres. La variante cambia la forma, no la
  conducta: el rótulo sigue estando como `aria-label` porque un lector de pantalla no ve la columna.
- **`OrdersPagination` se partió en dos** en vez de copiarse. Lo que se pinta vive ahora en
  `presentation/navigation/QueryPagination`, y cada lista aporta cómo arma su dirección y sus frases.
  Era literalmente el mismo componente por segunda vez.
- **`CurrencyAmount` declaraba `value: number` mientras su cuerpo ya trataba la ausencia.** Nadie lo
  notó porque quien lo llamaba lo hacía desde un `Post` sin forma. El primer llamador tipado —esta
  tabla— lo destapó; el tipo ahora dice lo que el componente siempre hizo.
- **`seedStore` acepta dueño.** El panel se llega por `findSellerOfUser`, así que sin dueño no hay
  nada que probar. Sigue siendo `NULL` por omisión, porque colgarle una tienda a la cuenta de la
  suite rompe los seis escenarios que empiezan dándose de alta — un fallo que ya costó una corrida.

### Archivos tocados

**Dominio.** `entities/post/inventoryScope.ts` + prueba.

**Infra.** `dataAccess/storeInventory/` (interfaz, repositorio Postgres, factoría).

**Rutas y UI.** `app/[locale]/cuenta/inventario/` (página, `InventoryTable`, `InventoryScopes`,
`inventoryHref` + prueba), `cuenta/ui/AccountNav.tsx`, `i18n/routing.ts`.

**Compartido.** `presentation/navigation/QueryPagination/`, `pedidos/ui/OrdersPagination.tsx`
(ahora lo usa), `presentation/post/StockControl/` (variante `compact`),
`presentation/money/CurrencyAmount/`.

**Pruebas.** `e2e/inventory/panelDeInventario.spec.ts` e `InventoryPanel.ts`, `testUtils/seedStore.ts`
(dueño opcional) y `testUtils/suiteAccount.ts` (`findUserIdByEmail`, movido desde `simulateLogin`).

**i18n.** Catorce claves nuevas en `account` y una en `nav`, en `es.json` y `en.json`.

### Validación

- `typecheck`: limpio.
- `lint`: limpio (`biome check`, 1091 archivos).
- `test:run`: **2603 pruebas en 241 archivos, todas en verde**.
- `playwright test src/e2e/inventory/panelDeInventario.spec.ts`: **9 de 9**, en 2.6 min.
- **Pendiente y NO ejecutado:** `playwright test src/e2e/orders`. `OrdersPagination` se refactorizó
  para usar `QueryPagination` y su suite no se volvió a correr. Los `data-testid` cambiaron de
  `orders-prev`/`orders-next` a `orders-pagination-prev`/`-next`; se comprobó por `grep` que **ningún
  spec ni componente los referencia**, así que el riesgo es bajo, pero es una comprobación pendiente,
  no una que pasara.
- Tampoco se volvió a correr el directorio `src/e2e/inventory` **entero** (20 escenarios) después del
  último arreglo; sus dos specs pasaron por separado.

### Lo que se escribió en la base compartida, y cómo se deshace

Sólo datos de prueba, todos con prefijo `e2e-`: una tienda con dueño (`danielsrodroguez@gmail.com`)
y sus productos, borrados en el `afterEach` por `deleteTestSellerByHandle`. El escenario de
paginación corre contra `Hazlo Sano` **sin escribir nada**.

### Desviaciones del roadmap

- **Apareció un guardián que el roadmap no anticipaba.** `publishedPosts.test.ts` comprueba por
  lectura de ficheros que ninguna consulta lea `posts` sin declarar qué deja ver, y tumbó el
  repositorio nuevo. No es un tecnicismo: obligó a decidir si el panel enseña lo que la moderación
  bajó. Se decidió que no. Es exactamente la conversación que esa prueba existe para forzar.
- **Una corrida entera falló y no se reprodujo.** Los 8 escenarios del panel devolvieron el 404
  global del sitio, incluido el que sólo lee. Se comprobó a mano contra un servidor de desarrollo que
  `/cuenta/inventario`, `/cuenta/agenda` y `/en/account/inventory` responden 307 a la puerta de
  entrar, o sea que la ruta se resuelve; el puerto 3000 estaba libre. La repetición dio 9 de 9 sin
  tocar nada. Queda anotado como ambiental, **no como arreglado**: no hubo cambio que lo explique.
- **La paginación se afirma sobre el primer renglón, no sobre la lista.** Leer los títulos justo
  después del clic los lee antes de que la navegación del cliente traiga la página siguiente;
  `expect(locator)` reintenta y esa carrera desaparece.

### Recap

`/cuenta/inventario` existe y es la pantalla desde la que una tienda lleva su catálogo: veinte
renglones por página, ordenados por título, con el campo de existencias dentro de cada uno y tres
filtros —todos, agotados, sin contar—. Enseña los productos publicados de la tienda venga de quien
venga la ficha, y deja fuera lo que no se cuenta por piezas y lo que la moderación bajó. El campo es
el mismo de la ficha, así que guardar desde aquí o desde allá es el mismo código y el mismo
resultado. Por el camino se partió la paginación de pedidos en una pieza compartida y se corrigió el
tipo de `CurrencyAmount`, que mentía desde antes. Unitarias 2603/2603; la e2e del panel 9/9; la de
pedidos quedó pendiente.

### Próximos pasos (opciones)

1. **Correr las dos e2e pendientes** (`src/e2e/orders` y `src/e2e/inventory` completo) antes de
   cualquier otra cosa. Es lo único que separa este slice de estar cerrado del todo.
2. **Slice 3 — que el pedido descuente al aceptarse.** Ya hay panel para poner los números iniciales,
   así que ahora sí tiene sentido: cierra el círculo y elimina el mantenimiento a mano.
3. **Una búsqueda en el panel.** Con 418 productos y sólo orden alfabético, encontrar uno concreto
   son varias páginas. Barato y se nota desde el primer uso.
4. **Enseñar las existencias en la tarjeta de los listados**, no sólo en la ficha y el panel.

**Pendiente de tu parte:** decidir si corres tú las dos e2e o quieres que las corra yo, y elegir
entre 2, 3 y 4. Y sigue en pie lo del slice 1: hasta que alguien escriba números en productos
reales, el inventario es invisible por diseño.

---

## Slice 3 — El pedido descuenta al aceptarse (2026-09-03)

### Objetivo

Que el número deje de mantenerse a mano. Cuando el vendedor acepta un pedido, las unidades salen
del inventario solas; si lo cancela después, vuelven. Y un pedido que no se puede servir no se
acepta, con un aviso que dice por qué.

### El hallazgo que abarató el slice

**El estado actual del pedido ya cuenta toda su historia.** `TRANSITIONS` no tiene marcha atrás —de
`CONFIRMED` sólo se sale a `PREPARING`, `DELIVERED` o `CANCELLED`—, así que saber si un pedido
descontó no necesita ni una columna nueva ni consultar `customer_order_status_changes`: si está en
uno de esos tres, se aceptó; si está en `PENDING`, no. El roadmap contemplaba derivarlo del
histórico; no hizo falta.

Lo que decide es una función pura de dos estados, `stockEffectOf(from, to)`, y sus seis
combinaciones caben en una tabla que se lee de un vistazo.

### Decisiones y por qué

- **Aceptar es el momento, no hacer el pedido.** Un pedido pendiente es alguien preguntando; lo que
  compromete mercancía es que el vendedor diga que sí. Antes de eso, dos personas pueden estar
  preguntando por la última dona y las dos tienen razón en preguntar.
- **Cancelar devuelve sólo si había descontado.** Un pedido cancelado desde `PENDING` nunca tocó el
  inventario, y devolverle unidades inventaría existencias que nadie apartó.
- **El descuento va en la MISMA transacción que el cambio de estado.** Un pedido aceptado sin
  descontar, o descontado sin quedar aceptado, son las dos formas de que el número deje de
  significar nada. Por eso `stockEffect` viaja como parámetro de `updateStatus` en vez de calcularse
  abajo: la decisión es del dominio, la atomicidad es de la infraestructura.
- **La garantía de verdad la pone el `WHERE`, no el `if`.** El `UPDATE` lleva
  `stock_quantity >= d.q`: dos vendedores aceptando a la vez el último lote leen los dos «quedan 3»,
  y sólo uno encuentra fila. El que llega tarde mueve menos filas de las que debía y se lleva la
  transacción entera por delante. La comprobación previa existe **para explicarlo**, no para
  garantizarlo — sin ella, quedarse corto se vería como «no se pudo, no sabemos por qué».
- **Un error propio y no `tx.rollback()`.** Drizzle vuelve a lanzar lo que salga de la transacción,
  y quedarse sin existencias tiene que verse como `null` —«se movió mientras tanto»— y no como una
  caída. `StockUnavailableError` es lo que permite distinguirlo de un fallo de verdad.
- **La demanda se agrupa por publicación, en la lectura y en la escritura.** Nada impide dos
  renglones del mismo producto —no hay `UNIQUE(order_id, post_id)`— y un `UPDATE ... FROM` con dos
  filas que casan aplica una sola, arbitrariamente. Las dos consultas agrupan igual a propósito: si
  contaran distinto, avisaría de una cosa y descontaría otra.
- **Sólo aceptar consulta el inventario.** Preguntar por él para cancelar o entregar sería una
  consulta a la basura en el camino más recorrido de la pantalla.
- **El vendedor gana un mensaje propio.** Hasta aquí había uno solo para cualquier fallo, porque
  sólo había una forma de fallar. «No se pudo» se arregla recargando y «no te alcanza el inventario»
  reponiendo: son dos conversaciones. Los otros dos códigos siguen compartiendo frase a propósito —
  distinguir «no existe» de «no es tuyo» le contaría a un extraño si el id que probó era bueno.
- **`is_available` se sigue derivando**, también aquí. Que un producto se agote por un pedido y que
  se agote a mano se ven igual en la ficha, en el carrito y para el bot.

### Archivos tocados

**Dominio.** `order/orderStock.ts` (nuevo: `stockEffectOf`, `shortfalls`) + prueba;
`order/ports.ts` (`stockDemandOf`, `stockEffect` en `updateStatus`).

**Casos de uso.** `advanceOrder/advanceOrderUseCase.ts` (efecto + comprobación previa + el código
`insufficient-stock`) y su prueba.

**Infra.** `orders/PostgresOrderRepository.ts`: `stockDemandOf`, `moveStock` y el movimiento dentro
de la transacción. `db/publishedPosts.test.ts`: entrada nueva en la lista de excepciones, con su
motivo.

**Presentación.** `orders/orderActions.ts` (el estado deja de enumerar códigos a mano) y
`pedidos/ui/SellerOrders.tsx` (un mensaje por motivo).

**i18n.** `orders.errorInsufficientStock` en `es.json` y `en.json`.

**Pruebas.** `e2e/inventory/pedidoDescuenta.spec.ts`.

### Validación

- `typecheck`: limpio.
- `lint`: limpio (`biome check`, 1094 archivos).
- `test:run`: **2625 pruebas en 242 archivos, todas en verde** (14 nuevas de dominio, 8 nuevas del
  caso de uso).
- `playwright test src/e2e/orders src/e2e/inventory`: **60 de 60**, en 11.3 min. La suite de pedidos
  entera se volvió a correr a propósito: `updateStatus` cambió de firma y de cuerpo.

### Lo que se escribió en la base compartida

Sólo datos de prueba con prefijo `e2e-`, borrados en el `afterEach`. Comprobado al terminar: **0
publicaciones y 0 tiendas** con ese prefijo.

**Un dato que no es residuo:** «Pan de masa madre de arándanos (hogaza 1kg)» tiene
`stock_quantity = 13` e `is_available = true`. No lo escribió ninguna prueba —todas usan slugs
`e2e-` y limpian—: **lo puso el dueño desde el navegador**, confirmado por él. Es el primer producto
real que lleva la cuenta, y es la respuesta a lo que quedó pendiente del slice 1: hasta que alguien
escribiera un número, la entrega era invisible por diseño.

Conviene saberlo antes del siguiente pedido de ese pan: ahora sí se descuenta solo, y en 13 pedidos
se agota para la ficha, el carrito y el bot sin que nadie apague nada.

### Desviaciones del roadmap

- **No hizo falta leer el histórico.** El roadmap proponía derivar «¿ya descontó?» de
  `customer_order_status_changes`; el estado actual basta, porque un pedido no retrocede. Menos
  consulta y menos acoplamiento.
- **Un `Scenario Outline` se marcó `@component`.** Las seis combinaciones de `stockEffectOf` son una
  regla pura: montar seis pedidos en el navegador para leerlas habría costado diez minutos de suite
  por lo que una tabla de Vitest dice mejor.
- **El guardián de `publishedPosts` volvió a saltar, y aquí la respuesta era la contraria.** En el
  slice 2 el panel debía filtrar; aquí, no: lo que se pidió se descuenta aunque la publicación se
  bajara después, y saltárselo dejaría el número mintiendo. Entró en la lista de excepciones con ese
  motivo escrito, que es para lo que la lista existe.

### Follow-ups

- **El carrito no reserva.** Dos personas pueden llenar el carrito con la última dona; la segunda se
  entera cuando el vendedor no puede aceptar. Es deliberado —reservar al añadir bloquea inventario
  por carritos que nadie confirma— pero el día que duela, se mira.
- **`DELIVERED` no se puede cancelar**, así que el `release` desde ahí es inalcanzable. La regla lo
  contempla igualmente porque es verdad; si algún día se permite devolver, ya está escrito.
- El aviso de «no te alcanza» no dice **cuál** producto falta. `shortfalls` ya devuelve los renglones
  enteros justo para eso; pintarlos es una línea el día que haya pedidos con muchos renglones.

### Recap

El inventario ya se mantiene solo. Aceptar un pedido resta sus unidades en la misma transacción en
que el pedido cambia de estado; cancelarlo después las devuelve; cancelarlo sin haberlo aceptado no
toca nada. Un pedido que pide más de lo que hay no se puede aceptar y el vendedor lee por qué, y si
aceptarlo agota el producto, queda agotado para la ficha, el carrito y el bot por la misma regla
derivada del slice 1. Lo que no lleva la cuenta —las 418 publicaciones de siempre— sigue sin
enterarse de nada. Todo verde: 2625 unitarias y 60 e2e, con la suite de pedidos entera repetida
porque `updateStatus` cambió por dentro.

Con esto el roadmap de `004` queda **completo**: las tres rebanadas entregadas.

### Próximos pasos (opciones)

1. **Seguir poniendo existencias a productos reales.** El pan de arándanos ya tiene 13. El circuito
   completo —panel, pedido, descuento, agotado— sólo se puede juzgar con números de verdad encima, y
   con uno solo no se ve el conjunto.
2. **Una búsqueda en el panel de inventario.** Con 418 productos y sólo orden alfabético, llegar a
   uno concreto son varias páginas. Es lo que más se va a notar en cuanto se use de verdad.
3. **Enseñar las existencias en la tarjeta de los listados**, no sólo en la ficha y el panel.
4. **Decir cuál producto falta** en el aviso de inventario insuficiente. `shortfalls` ya lo sabe.

**Pendiente de tu parte:** elegir. Y si la opción es la 1, decidir a qué productos ponerles número —
eso no lo puedo decidir yo, porque depende de lo que de verdad haya en la tienda.

---

## Slice 4 — Las existencias se editan desde la tarjeta (2026-09-03)

### Objetivo

Recontar donde ya estás mirando. La tarjeta ya ofrecía editar y marcar agotado; le faltaba la
cuenta. Y de paso cerrar un hueco que llevaba abierto desde el slice 1.

### El hueco que estaba en producción

`CardForList` decidía quién manda con `viewerId === post.user.id`: **quién publicó**, no quién lleva
la tienda. En `/tienda/<handle>`, a su dueño no se le ofrecía nada sobre lo que escribió otra cuenta
— exactamente lo que el slice 1 habilitó en la ficha y que aquí seguía sin hacerse. Ahora la tarjeta
pregunta `canManagePost`, la misma regla que autoriza la escritura.

Para que esa regla pudiera responder hizo falta un dato que no llegaba: la proyección de la tarjeta
traía `seller` —nombre y logo, lo que se **pinta**— pero no `sellerId`, que es lo que se **compara**.
Sin él la vía de la tienda no podía dispararse nunca. Los dos van juntos en el DTO y con esa
distinción escrita, porque se parecen lo bastante como para volver a confundirlos.

### Decisiones y por qué

- **La regla del slice 1 se mantiene, y se pregunta al mismo sitio.** El interruptor manual
  desaparece cuando el producto lleva la cuenta, también en la tarjeta. Se consideró que
  convivieran; hacerlo bien pedía una columna nueva (`is_offered`) porque hoy `is_available` tiene
  dos oficios —interruptor en lo que no cuenta, valor derivado en lo que sí— y los dos mandos se
  pisarían: marcar agotado a mano y volver a guardar el número borraría la intención sin avisar. Se
  decidió no abrirlo.
- **El campo es el mismo `StockControl` compacto** del panel. Tres pantallas —ficha, panel y
  tarjeta— y una sola acción: no hay forma de que el número quede distinto según por dónde entres.
- **`viewerSellerId` sólo lo baja la tienda.** En un perfil todo lo listado es de la misma cuenta,
  así que la vía de la tienda no añadiría nada; declararlo allí sería un prop que no significa nada.
- **No cuesta una consulta.** La página de la tienda ya sabe si quien mira es su dueño; si lo es, su
  `sellerId` es justamente el de esta tienda, y todo el catálogo cuelga de ella. Se deriva de lo que
  ya estaba en la mano.
- **`article` como localizador en la e2e.** Es lo que `Card` es —su `Container` por omisión— y el
  título es lo único que distingue una tarjeta de otra para quien mira. Ni una clase ni una
  posición: las dos cambian con el diseño.

### Archivos tocados

**Lectura.** `posts/IPostQueryRepository.ts` (`stockQuantity` y `sellerId`),
`posts/PostgresPostQueryRepository.ts` (las dos columnas en la proyección),
`UI/mappers/posts/mapPostsToCards.ts`.

**Presentación.** `post/CardOwnerControls.tsx` (el campo y la regla de convivencia),
`post/CardForList/CardForList.tsx` (`canManagePost`, `viewerSellerId`, `stockQuantity`).

**Rutas.** `tienda/[slug]/ui/StoreCatalog.tsx` y las dos páginas que lo montan.

**Pruebas.** `CardForList.test.tsx` (9 casos nuevos), `e2e/inventory/existenciasEnLaTarjeta.spec.ts`,
y el corte de `stockAction` en los cuatro tests que montan tarjetas.

### Validación

- `typecheck`: limpio. `lint`: limpio (1095 archivos).
- `test:run`: **2634 pruebas en 242 archivos, todas en verde**.
- `playwright test src/e2e/inventory src/e2e/orders src/e2e/sellerStore`: **99 de 99**, 16.1 min.
  (La corrida se hizo antes de añadir los `vi.mock` a cuatro tests; esos archivos son de Vitest y no
  entran en la e2e, así que no la invalidan.)

### Lo que se escribió en la base compartida

Sólo datos `e2e-`, borrados en el `afterEach`: publicaciones, una tienda con dueño y **una dirección
personal prestada** a la cuenta de la suite, que se devuelve —es una cuenta real y tiene que quedar
como estaba. Comprobado al terminar: 0 publicaciones, 0 tiendas y 0 usuarios con ese prefijo.

### Desviaciones y tropiezos

- **Dos corridas enteras devolvieron el 404 global del sitio**, incluidas pruebas que sólo leen. Ya
  había pasado en el slice 2 y allí quedó anotado como ambiental sin explicación. Esta vez apareció
  la causa: `.next/dev/types/routes.d.ts` estaba corrupto —lo destapó un `typecheck` que falló
  dentro de un archivo generado— y con la caché de build en ese estado el servidor de desarrollo no
  resuelve ninguna ruta. **`rm -rf .next` antes de la corrida** lo arregló, y el diagnóstico se
  confirmó a mano: con un servidor limpio, `/tienda/<handle>` responde 200.
- **Lo que quedó rojo después de limpiar era un fallo real**, y sólo se pudo ver una vez apagado el
  ruido: las tres pruebas de la tienda seguían fallando mientras la del perfil ya pasaba. Esa
  asimetría —el camino del dueño funciona, el de la tienda no— fue lo que señaló el `sellerId` que
  no llegaba.
- **Cuatro tests ajenos dejaron de cargar** al importar la tarjeta el Server Action nuevo. Ya
  cortaban la cadena de `availabilityAction` por el mismo motivo; se les añadió el corte gemelo.

### Recap

Las existencias se recuentan desde la tarjeta, en el perfil de quien publicó y en la tienda de quien
la lleva, con el mismo campo y la misma acción que la ficha y el panel. La tarjeta dejó de decidir
por «quién publicó» y pasó a preguntar `canManagePost`, que es lo que ya autorizaba la escritura: el
dueño de una tienda administra su catálogo aunque cada ficha la escribiera otra mano. Para eso hubo
que llevar `sellerId` a la proyección de la tarjeta, que traía con qué pintar la tienda pero no con
qué compararla. La regla del slice 1 sigue en pie y ahora en tres pantallas: donde hay cuenta, no hay
interruptor. Todo verde: 2634 unitarias y 99 e2e.

### Próximos pasos (opciones)

1. **La búsqueda del panel de inventario.** Es lo que quedó fuera a propósito y lo que más se va a
   notar: con 418 productos y sólo orden alfabético, llegar a uno concreto son varias páginas.
   `OrdersSearchField` ya es el patrón — filtra mientras escribes, sin Enter.
2. **Existencias visibles para el visitante en la tarjeta**, no sólo para quien administra. Hoy
   «Quedan 3» sale en la ficha; en el listado no.
3. **Decir cuál producto falta** en el aviso de inventario insuficiente. `shortfalls` ya lo sabe.
4. **Poner números a más productos reales** y dejar que el uso diga qué falta.

**Pendiente de tu parte:** elegir. Y un aviso operativo que ya cuesta dos corridas: si una corrida
e2e falla entera con 404 en todo, no la diagnostiques — borra `.next` y repite.
