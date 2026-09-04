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
