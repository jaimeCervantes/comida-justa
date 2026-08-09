# Bitácora — Carrito y pedidos

Append-only. El roadmap y los criterios de aceptación viven en `docs/features/pedidos.md`.

---

## Slice 1 — Carrito por tienda y pedido por WhatsApp (2026-08-09)

### Objetivo

Que quien quiere tres cosas mande **un** mensaje en vez de tres. Hasta hoy el único camino a la venta
era "Pedir por WhatsApp" desde la ficha, de un producto a la vez, y el vendedor sumaba a mano dentro
de la conversación.

### Por qué este slice y no el pago en línea

La pregunta original era qué construir después de que un vendedor se registra, con el pago en línea
sobre la mesa. La base contestó: **21 usuarios, 1 vendedor, 3 personas han publicado algo, 0 filas en
`orders` y 462 mensajes en el bot de WhatsApp**. O sea que la demanda ya pasa por WhatsApp y que no
existe un solo pedido medido sobre el que justificar una pasarela, KYC por vendedor y devoluciones.
El carrito ahorra trabajo hoy y, en el slice 2, produce el número que hace decidible el slice 4.

### Decisiones y por qué

- **El carrito es de varias tiendas; un pedido es de una.** `groupBySeller()` parte el carrito y el
  checkout produce un pedido por vendedor. Con un solo vendedor devuelve un grupo **por el mismo
  camino**, sin rama especial. Se puso así desde el primer commit a petición explícita: es lo que
  evita migrar datos y rediseñar pantallas el día del segundo vendedor.
- **El estado vivirá en el pedido, nunca en el carrito.** Cada tienda acepta y entrega a su ritmo, así
  que "el estado del carrito" no tiene dueño. Un carrito confirmado deja de existir.
- **La cookie guarda ids y cantidades, jamás precios.** `hs_cart`, formato `postId:cantidad|…`, con el
  precio y la disponibilidad releídos de la base en cada render. Un precio guardado en el navegador es
  el de ayer; releerlo es **lo que hace visible un agotado antes de pedir**, no después.
- **Cookie y no `localStorage`**, siguiendo `hs_location`: la lee el servidor, así que `/carrito` y el
  contador de la cabecera son Server Components sin parpadeo de hidratación. No cuesta nada estático
  porque todas las rutas ya son dinámicas (`Header` lee la sesión).
- **El contador de la cabecera cuenta desde la cookie, sin consultar la base.** Se pinta en todas las
  pantallas y no puede costar una consulta por página. El precio asumido: cuenta también lo agotado;
  el carrito, que sí lee la base, lo aclara.
- **`JOIN sellers` y no `LEFT JOIN`** en la lectura del carrito, al revés que el listado: una tarjeta
  sin tienda se pinta igual, pero un renglón sin tienda no tiene a quién pedírsele.
- **El teléfono sale de `sellers.phone`**, no de `posts.contact_whatsapp`: el mensaje es de la tienda.
  Hoy los dos caminos dan el mismo número, así que no se nota; se decide ahora para el día que no.
- **Lo agotado se conserva tachado y sin importe**, y no entra en el mensaje. Borrarlo en silencio era
  más fácil de programar y es cómo se pierde la confianza en un carrito.
- **La cantidad es un `<select>`, no un `<input type="number">`.** Con un campo numérico, guardar sin
  botón "actualizar" obliga a enviar en cada pulsación: escribir "12" manda dos peticiones —una con el
  1— y la primera puede llegar la última. Un desplegable emite un cambio por elección.
- **`AddToCartButton` decide solo si se pinta**, con `canBeOrdered` — la misma regla que apaga el botón
  de WhatsApp. Si discreparan, la ficha ofrecería juntar algo que no se puede pedir.

### Archivos tocados

- **Dominio:** `src/domain/cart/` (`cartSelection.ts`, `cart.ts`, `ports.ts` + tests),
  `src/domain/order/whatsappCartOrder.ts` + test.
- **Infra:** `src/infra/cart/` (`cartCookie.ts` + test, `readCart.ts`),
  `src/infra/dataAccess/cart/` (repositorio Postgres + factory).
- **Caso de uso:** `src/use_cases/viewCart/` + test.
- **Presentación:** `src/presentation/cart/` (`cartActions.ts`, `AddToCartButton/` + test,
  `CartLink/`).
- **Rutas:** `src/app/[locale]/carrito/` (`page.tsx`, `ui/CartGroup.tsx`, `ui/CartLineRow.tsx`).
- **Enganches:** `PostDetail.tsx`, `CardForList.tsx`, `Header.tsx`, `i18n/routing.ts`,
  `i18n/messages/{es,en}.json` (namespace `cart`).
- **Specs:** `src/e2e/orders/orders.feature`, `src/e2e/orders/cart.spec.ts`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` | limpio |
| `pnpm run typecheck:tests` | limpio |
| `pnpm run lint` | exit 0 |
| `pnpm run test:run` | **117 archivos, 1138 tests, todos verdes** (61 nuevos) |
| `pnpm exec playwright test src/e2e/orders` | **7/7** |
| `pnpm exec playwright test --shard=1/2` | 104 pasados, 3 saltados, **1 fallo preexistente** |
| `pnpm exec playwright test --shard=2/2` | **107 pasados** |

**El fallo de `--shard=1/2` no es de este slice.** Es
`localProducers/cardControls.spec.ts:39` ("marca agotado desde la tarjeta"), y se comprobó
guardando el trabajo con `git stash` y corriendo ese spec sobre `dev` limpio: **falla igual**. La
tarjeta no vuelve a pintar "Marcar disponible" tras la acción. Queda como pendiente aparte.

**Lo que se escribió en la base compartida:** nada permanente. La suite siembra sus publicaciones
(`E2E …`, slug con prefijo `e2e-`) y las borra en `afterEach`; el escenario del agotado hace un
`UPDATE posts SET is_available = false` **sobre una publicación sembrada por él mismo**, que se borra
al terminar. Ninguno de los 13 productos reales se tocó. Para comprobarlo:
`SELECT count(*) FROM posts WHERE id IN (SELECT post_id FROM post_translations WHERE slug LIKE 'e2e-%');`

### Desviaciones del roadmap

- **El escenario del listado usa un producto sembrado, no "Jugo Verde".** `/productos` pagina y ordena
  por fecha: un producto real puede caer en la página 3 y el escenario fallaría por dónde quedó, no
  por lo que prueba. Se siembra a 40 dentro de Hazlo Sano, así que el total sigue siendo 75 y el grupo
  sigue siendo uno. El `.feature` se corrigió para decir lo que la prueba hace.
- **El escenario del agotado también siembra.** Marcar agotado uno de los 13 reales lo saca del sitio
  y de las recomendaciones del bot mientras corre la suite, y un fallo a media prueba lo dejaría así.
- **Dos tiendas se prueban en Vitest, no en Playwright.** Es el escenario que sostiene el modelo, pero
  hoy la base tiene un solo vendedor y montarlo en el navegador exigiría sembrar una tienda entera
  —que además choca con los seis escenarios que empiezan abriendo tienda desde `/cuenta`—.

### Dos cosas que la corrida enseñó

1. **Esperar a que el contador exista no sincroniza nada.** El helper del spec afirmaba
   `expect(cart-count).toBeVisible()`, y a partir del segundo añadido el contador ya existía: la
   aserción pasaba sin esperar, la navegación se adelantaba a la acción de servidor y el carrito salía
   corto. Ahora se espera **el número**, que sí es el hecho.
2. **La ficha termina con publicaciones relacionadas, y cada tarjeta trae su botón.**
   `getByTestId("add-to-cart")` encontraba cinco elementos. El localizador va acotado a `post-detail`.

### Seguimiento

- **Las tarjetas de búsqueda no ofrecen añadir al carrito.** No se verificó en esta corrida si su
  proyección lleva `kind` e `is_available` hasta la tarjeta; `/productos` y la ficha sí lo hacen, que
  es lo que pedían los criterios. Vale mirarlo antes del slice 2.
- El fallo preexistente de `cardControls.spec.ts:39`.
- El ruido `upstream image response failed … 412` de `seedPost`: la URL de media sembrada no existe.
  Es anterior a este slice y no tumba nada.

### Recap

El carrito está entregado y funcionando de punta a punta: se añade desde la ficha y desde la tarjeta
del catálogo, la cabecera lo cuenta en todas las páginas, `/carrito` agrupa por tienda con su total,
lo agotado se ve tachado y fuera del total, y "Confirmar pedido con Hazlo Sano" abre WhatsApp con el
desglose, el enlace de cada producto y el total. Todo sin base de datos y **sin ninguna migración**:
el pedido todavía no se guarda en ningún sitio. El dominio ya sabe partir un carrito en un pedido por
vendedor, así que al slice 2 solo le falta el adaptador de persistencia.

### Próximos pasos (opciones)

1. **Slice 2 — registrar el pedido y darle al vendedor su sección "Pedidos".** Es el siguiente paso
   natural y el que produce el dato que hace decidible el pago en línea. **Requiere una migración
   Alembic sobre la base compartida** (`orders` tiene 0 filas: añadirle `seller_id`, renglones
   normalizados con precio congelado y el hueco de la referencia de pago, todo en una sola migración).
   Es el único paso irreversible del roadmap y hay que consultarlo antes.
2. **Pulir el slice 1 antes de seguir:** el botón de añadir en las tarjetas de búsqueda, y un aviso
   visible al añadir (hoy la única señal es el contador de la cabecera).
3. **Cambiar de frente y atacar la oferta:** con 1 vendedor de 21 usuarios, el cuello de botella del
   proyecto sigue siendo que nadie más ha abierto tienda. Competía con esto en la conversación inicial
   y sigue sin resolverse.
4. **Cerrar el fallo preexistente de `cardControls.spec.ts:39`**, que ensucia toda corrida completa.

**Pendiente del usuario:** decidir entre 1–4, y si es la 1, autorizar la migración Alembic.
