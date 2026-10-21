# Bitácora: Promociones

Roadmap: `031-2026-10-20-promociones.md`. Escenarios: `src/e2e/promociones/promociones.feature`.

## 2026-10-20 — Slice 1: poner la promoción, verla en la ficha y pagarla

### Objetivo

Que un vendedor ponga un precio rebajado, con fecha de fin opcional, y que la ficha, el carrito, el
pedido, el mensaje de WhatsApp y la cita de un servicio usen ese precio mientras esté vigente.

### Decisiones

- **`sale_price` y no `discount_price` ni `promo_price`.** El usuario lo eligió el 2026-10-20.
  `discount_price` se presta a leerse como «cuánto se descuenta», y `promo_price` es una
  abreviatura en un esquema que escribe las palabras completas.
- **No se usa el modelo de Shopify (`compare_at_price`).** Ahí `price` pasa a ser el rebajado, y eso
  obliga a reescribirlo al empezar y al terminar la promoción, así que no podría apagarse sola.
- **La vigencia se decide al leer, contra la hora.** No hay ningún proceso que apague promociones:
  `currentPrice` (`domain/entities/post/promotion.ts`) es la única regla, y la usan la ficha, el
  carrito, el pedido, el enlace de WhatsApp y la cita.
- **El precio de cada renglón se decide en `buildCartLines`, no en la consulta.** El repositorio
  entrega `salePrice` y `saleEndsAt` tal cual vienen de la base. Así la regla tiene pruebas sin base,
  y el carrito y el pedido no pueden cobrar distinto. `CartLine` gana `unitPrice` (lo que se cobra) y
  `regularUnitPrice` (lo que se tacha); `placeOrder` copia `line.unitPrice` y ya no
  `product.price`.
- **`PromotionPrice` es de cliente, como `EventDate`.** Si una página quedara en caché del servidor,
  seguiría anunciando una oferta vencida.
- **Solo en lo que se cobra (producto y servicio).** Un evento tiene precio, pero no pasa por el
  carrito.
- **Una fecha de fin sin rebaja se rechaza, no se descarta.** Así quien la puso sabe que no aplicó.
- **La fecha de fin se escribe con `datetime-local` en la zona de quien edita**, igual que la de un
  evento. Por eso `SalePriceFields` manda también `timeZone`.

### Archivos

- Dominio: `entities/post/promotion.ts` (+ pruebas), `cart/cart.ts`, `entities/post/types.ts`,
  `schemas/PostValidator.ts`.
- Casos de uso: `placeOrder`, `viewCart` (reciben `now`) y `managePost/updateOnePostUseCase` (con su
  puerto).
- Infra: `cart/PostgresCartProductRepository.ts`, `managePost/PostgresPostAdminRepository.ts`,
  `getOnePostWithPaginatedComments/PostgresGetOnePost.ts`, `types/Posts.d.ts`, `types/Actions.d.ts`.
- UI: `presentation/post/SalePriceFields`, `presentation/post/PromotionPrice`,
  `presentation/post/promotionFieldErrors.ts`, los formularios y acciones de `/publicar` y
  `/editar`, `[slug]/ui/PostDetail.tsx` y `[slug]/page.tsx`. Mensajes `publish.sale*` y
  `post.sale*` en es y en.
- Backend: `hazlo-sano-bot`, rama `feat/promociones`, migración
  `0064_2026-10-20_add_post_sale_price.py` (sin commit).

### Validación

- La migración se validó sin conectarse a la base: `ruff check` y `ruff format` limpios,
  `alembic heads` da una sola cabeza (`0064_2026_10_20`) y `upgrade --sql` genera el SQL esperado.
- Pruebas unitarias nuevas o ampliadas: promoción (22), carrito (16), `placeOrder` (15), validador
  (43), `managePost` (39), `PromotionPrice` (4).
- Suite completa de vitest: 339 archivos y 3590 pruebas en verde. Hubo que ajustar tres pruebas
  de `/publicar` que buscaban «precio» o «MXN» y ahora encontraban también el campo de promoción.
- `tsc` y `biome check` limpios en los archivos tocados.
- Migración `0064_2026_10_20` aplicada a la base compartida (`alembic upgrade head`, a pedido del
  usuario). Con eso se actualizó el espejo Drizzle (`posts.salePrice`, `posts.saleEndsAt` y el
  índice `posts_on_sale_idx`), y `PostgresPostRepository.save` ya guarda la promoción al publicar.
- e2e `src/e2e/promociones`: 6 de 6 en verde.
- e2e de lo que rodea el cambio (`editPublicationTypes`, `createPost`, `orders/placeOrder`,
  `orders/cart`, `publishProduct`, `unifiedCatalog`, `validacionFormularios`): todo en verde salvo
  1 omitido, que ya estaba omitido antes. Cuatro selectores `/precio/i` se anclaron a `/^precio/i`,
  porque también encontraban el campo de promoción.
- Suite completa de vitest al cerrar: 339 archivos y 3592 pruebas en verde.

### Error previo corregido de paso

`CreateOnePostUseCase` arma campo por campo el objeto que guarda, y no incluía `startsAt`, `endsAt`
ni `durationMinutes`. El validador exigía la fecha de un evento y la duración de un servicio, y al
guardar se perdían. Ninguna prueba enviaba de verdad un evento o un servicio desde `/publicar`: los
4 que hay en la base se sembraron directo con el repositorio. Se corrigió al agregar la promoción a
ese mismo objeto, con una prueba nueva.

Al hacer los commits, el pre-commit (`pnpm validate`) falló por `typecheck:tests`, que ya fallaba
en `dev` con 7 errores de tipos en pruebas de otras ramas (`delivery.test.ts`,
`SearchPostsUseCase.test.ts` y `placeOrderUseCase.test.ts`). Se corrigieron en un commit aparte, y
también el fixture de `EditPostForm.test.tsx`, al que le faltaban los campos de la promoción.

### Desviaciones del roadmap

Ninguna en el alcance. Se agregaron dos lugares que el roadmap no nombraba porque, si no, cobrarían
el precio normal: el enlace «Pedir por WhatsApp» de la ficha y el precio de la cita de un servicio.

### Seguimientos detectados

- `scripts/importSupplierCatalog.ts` actualiza `price` desde el catálogo del proveedor. Si un precio
  baja por debajo de una promoción vigente, el `CHECK` hace fallar ese `UPDATE`. Hay que decidir si
  el script quita la promoción o avisa.
- La difusión en grupos (`domain/outreach/priceList.ts`) anuncia el precio normal. Decidir si la
  lista debe mostrar la rebaja.
- El renglón del carrito suma con la rebaja, pero todavía no tacha el precio normal
  (`regularUnitPrice` ya está disponible).

### Recap

Slice 1 terminado. Un vendedor pone o quita una promoción, con fecha de fin opcional, al publicar o
al editar un producto o servicio. La ficha muestra el precio normal tachado, el rebajado, el
porcentaje y hasta cuándo dura. El carrito, el pedido, el enlace de WhatsApp y la cita cobran el
precio vigente, y una promoción vencida deja de aplicar sola. La migración ya está en la base.

### Próximos pasos (opciones)

- **Pendiente del usuario:** hacer commit de la migración en `hazlo-sano-bot` (rama
  `feat/promociones`; ya está aplicada) y de este slice aquí.
- Slice 2: insignia en tarjetas y búsqueda.
- Atender los seguimientos del importador del proveedor y de la difusión.

## 2026-10-21 — Slice 2: insignia en tarjetas y búsqueda, y el carrito tachado

### Objetivo

Que una oferta se note sin abrir la ficha: la tarjeta de un listado o de un resultado de búsqueda
enseña el precio normal tachado, el rebajado y `-N%`. Se sumó el seguimiento del carrito que dejó el
slice 1.

### Decisiones

- **La tarjeta reutiliza `PromotionPrice`, sin la fecha de fin.** Ganó dos opciones: `showEnds` (la
  tarjeta la apaga; en una fila de insignias no cabe y la ficha ya la dice) y `amountClassName`
  (la tarjeta agranda el precio en modo renglón, con o sin promoción).
- **La promoción viaja cruda hasta la tarjeta**, como `startsAt`: `mapOnePostToCard` copia
  `salePrice` y `saleEndsAt`, y la vigencia se decide al pintar. Una página cacheada no anuncia una
  oferta vencida.
- **Dos fuentes, nada más.** Todas las tarjetas salen de `PostgresPostQueryRepository` (una sola
  proyección, `postColumns`) o de `PostgresSearchPostRepository`. La búsqueda ya traía las columnas
  (`select().from(posts)`); solo faltaba nombrarlas en el DTO.
- **El carrito tacha el importe del renglón, no el unitario**: `regularUnitPrice × cantidad`, junto
  a lo que suma. Lo agotado no lo enseña, porque no suma nada.

### Archivos

- `presentation/post/PromotionPrice` (+ prueba), `presentation/post/CardForList/CardForList.tsx`.
- `infra/UI/mappers/posts/mapPostsToCards.ts` (+ pruebas).
- `infra/dataAccess/posts/PostgresPostQueryRepository.ts` e `IPostQueryRepository.ts`,
  `infra/dataAccess/searchPosts/PostgresSearchPostRepository.ts`.
- `app/[locale]/carrito/ui/CartLineRow.tsx`.
- e2e: cuatro escenarios `@slice-2` en `promociones.feature` y su spec. El título del producto de
  prueba lleva una palabra única (`mielpromo…`) para buscarlo sin competir con el catálogo real.

### Validación

- e2e `src/e2e/promociones`: 10 de 10 en verde (6 del slice 1 y 4 nuevos).
- e2e de lo que rodea el cambio (`home/feedCard`, `orders/cartFromSearch`, `orders/cart`,
  `busquedaEnTienda`, `unifiedCatalog`, `busquedaRelevante`): 42 de 42 en verde. Los avisos
  `[translations] ... NO se guardó` vienen de la limpieza de las pruebas, como en el slice 1.
- Suite completa de vitest: 339 archivos y 3595 pruebas en verde. `tsc` y `typecheck:tests` limpios.

### Recap

Slice 2 terminado. La tienda, los listados y la búsqueda enseñan la oferta en la tarjeta, y el
carrito deja ver cuánto se ahorra en cada renglón. Una promoción vencida no aparece en ninguno.

### Próximos pasos (opciones)

- Slice 3: filtro «En promoción».
- Slice 4: JSON-LD con el precio vigente y `priceValidUntil`.
- Seguimientos abiertos: el importador del proveedor (el `CHECK` puede hacer fallar la
  actualización de precio) y la difusión en grupos.

## 2026-10-21 — Slice 3: filtro «En promoción»

### Objetivo

Que quien busca ofertas las encuentre juntas: en `/productos`, un interruptor «En promoción» deja
solo lo que tiene una promoción vigente.

### Decisiones

- **En `/productos` y no en una sección aparte.** Es el catálogo de lo que se vende; una página
  nueva habría repetido su mapa, su orden por cercanía y su paginación.
- **El filtro vive en la dirección (`?promocion=1`)**, como «solo disponibles» en la búsqueda: un
  enlace con `aria-pressed`, no una casilla. Se comparte, se guarda y vuelve con el botón de atrás.
  El nombre del parámetro y cómo se lee están en `domain/entities/post/promotion.ts`
  (`ON_SALE_QUERY_PARAM`, `parseOnSaleFilter`); solo `"1"` lo enciende.
- **Se suma al pilar.** «En promoción» dentro de Movimiento es lo rebajado de Movimiento. La
  paginación conserva los dos, y encender o quitar el filtro vuelve a la página 1.
- **La vigencia se filtra en la base** (`onSaleWhere` en `PostgresPostQueryRepository`), porque hay
  que paginar. Repite la regla de `isPromotionActive` en SQL, con `now()`; el comentario pide
  cambiar las dos juntas. Empieza por `sale_price IS NOT NULL`, la condición del índice parcial
  `posts_on_sale_idx`.
- **Vacío por el filtro no es un catálogo vacío.** No invita a publicar: dice «Ahora no hay nada en
  promoción» y ofrece «Ver todo el catálogo», con el interruptor a la vista.

### Archivos

- Dominio: `entities/post/promotion.ts` (+ pruebas).
- Infra: `posts/IPostQueryRepository.ts` (`PostListingFilters.onSale`) y
  `posts/PostgresPostQueryRepository.ts`.
- UI: `productos/data.ts`, `productos/page.tsx`, `productos/page/[page]/page.tsx` y
  `productos/ui/ProductsList.tsx` (+ pruebas). Mensajes `products.onSaleFilter`, `emptyOnSale`,
  `emptyOnSaleBody` y `seeAll` en es y en.
- e2e: dos escenarios `@slice-3` en `promociones.feature` y su spec.

### Validación

- e2e `src/e2e/promociones`: 12 de 12 en verde.
- e2e de lo que rodea el cambio (`products`, `publicationPillarFilter`,
  `localProducers/nearbyFirst`, `localProducers/cardControls`, `unifiedCatalog/unifiedCatalog`,
  `seo/seo`): 21 de 21 en verde.
- Suite completa de vitest: 339 archivos y 3604 pruebas en verde. `tsc` y `typecheck:tests` limpios.

### Recap

Slice 3 terminado. En `/productos`, «En promoción» deja solo lo rebajado y vigente, combinado con el
pilar y conservado al paginar. Una promoción vencida no entra.

### Próximos pasos (opciones)

- Slice 4: JSON-LD con el precio vigente y `priceValidUntil`.
- Seguimientos abiertos: el importador del proveedor (el `CHECK` puede hacer fallar la
  actualización de precio) y la difusión en grupos.
- Si hace falta: llevar el mismo interruptor a la tienda (`/tienda/<handle>`) o a la búsqueda.
