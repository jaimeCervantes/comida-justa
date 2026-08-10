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

---

## Slice 1 (añadido) — Añadir al carrito desde la búsqueda (2026-08-09)

### Objetivo

Cerrar el seguimiento que dejó abierto el slice 1. La búsqueda es el camino más corto del sitio hasta
un producto y era el **único listado que no dejaba juntarlo**: había que abrir la publicación.

### La causa era mejor que el síntoma

No faltaba UI: la búsqueda usa el mismo `CardForList` que `/productos`. Lo que faltaba era que su
proyección llevara los datos. `PostgresSearchPostRepository.hydrate` hace
`db.select().from(posts)` —o sea **todas** las columnas— y luego construía el DTO dejando fuera
`kind`, `origin`, `category`, `subCategory` e `isAvailable`. Sin `kind`, `canBeOrdered` devolvía
`false` para todo resultado.

**Lo que impidió detectarlo antes es el `as unknown as ISearchPostResultDTO`** que cierra ese objeto:
borra la comprobación de campos, así que olvidar cinco no cuesta ni una advertencia. Ese cast no se
quitó porque tapa **una** discrepancia real y distinta: el `Post` del dominio declara
`media: PostMediaFile` en singular mientras todo el que la lee la trata como lista. Queda anotado
junto al cast y en `pendientes.md`.

### Alcance, y lo que se dejó fuera a propósito

Se añadieron **`kind` e `isAvailable`**, que es lo que el carrito necesita. Con `isAvailable` vuelve
además la insignia de agotado a esas tarjetas, que tampoco aparecía — eso no es alcance de más sino
la consecuencia correcta del mismo dato.

**`origin`, `category`, `subCategory` y `seller` se quedan fuera.** Cuestan una línea cada uno y
cerrarían el hueco de insignias que `vendedores-y-tiendas.md` ya había anotado, pero **cambian cómo
se ven los resultados de búsqueda**, y eso es una decisión de diseño que nadie pidió.

### Archivos tocados

`src/infra/dataAccess/searchPosts/PostgresSearchPostRepository.ts`,
`src/e2e/orders/cartFromSearch.spec.ts` (nuevo), `src/e2e/orders/orders.feature`.

Aparte, un **fix del slice 1**: `cartActions.ts` usaba `CartSelection` sin importarlo. Se coló al
ajustar la firma de `writeCart` después del último typecheck; el dev server no typechequea, así que
la e2e pasó igual y solo salió con `pnpm typecheck`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` / `typecheck:tests` / `lint` | limpios, exit 0 |
| `pnpm run test:run` | 1138 verdes |
| `pnpm exec playwright test src/e2e/orders` | **8/8**, incluido el escenario nuevo |
| `pnpm exec playwright test --shard=1/2` | 104 pasados, 3 saltados, 1 fallo preexistente |
| `pnpm exec playwright test --shard=2/2` | **no corrida** — el usuario detuvo la e2e |

**La segunda mitad queda como validación pendiente.** En la corrida anterior del mismo día dio
107/107, y este cambio solo toca la proyección de búsqueda, cuyos specs (`busqueda*`) viven en la
mitad que sí corrió — pero no está comprobado y no se afirma que lo esté.

El escenario nuevo siembra un producto y un anuncio que comparten un término poco común, busca ese
término y comprueba las tres cosas: el producto ofrece añadir, el anuncio no, y la cabecera lo cuenta
sin haber abierto la publicación.

### Recap

Los tres listados del sitio —catálogo, tienda y ahora búsqueda— dejan añadir al carrito, y la ficha
también. El slice 1 queda completo, sin ningún hueco conocido salvo las insignias de las tarjetas de
búsqueda, que es una decisión de diseño abierta y no un defecto. Sigue sin haber migración: el pedido
no se guarda en ningún sitio.

### Próximos pasos (opciones)

1. **Correr `--shard=2/2`** para cerrar la validación que quedó a medias.
2. **Slice 2** — registrar el pedido y la sección "Pedidos" del vendedor. Sigue necesitando la
   migración Alembic sobre la base compartida, y sigue siendo el único paso irreversible.
3. **Decidir las insignias de la búsqueda**: emparejarlas con `/productos` (`origin`, `category`,
   `subCategory`, `seller`) o dejar escrito que el resultado de búsqueda enseña menos a propósito.
4. **El fallo preexistente de `cardControls.spec.ts:39`.**

**Pendiente del usuario:** lo mismo que en la entrada anterior, más la opción 3, que es de diseño.

---

## Slice 2 — El pedido queda registrado y el vendedor lo administra (2026-08-09)

> **Entregado como código; PENDIENTE de aplicar la migración.** Nada de esto funciona hasta que corra
> `alembic upgrade head` en el backend. Se acordó que este repositorio escribe la migración y el
> usuario la aplica.

### El plan cambió a mitad, y por un buen motivo

Se aprobó reusar la tabla `orders` del bot: existe, está vacía y su enum describe el proceso entero.
Al abrir el backend para escribir la migración se vio que **`orders` es el carrito del bot y es
código vivo** — `PostgresOrderRepository` está inyectado en `api/dependencies.py` y en el orquestador
de mensajes. `handle_order_intent` crea la fila con `status=DRAFT` **antes** de saber qué se pide y
va apilando artículos dentro del JSON de `items`.

Eso rompía dos piezas del DDL aprobado: `seller_id NOT NULL` habría reventado el primer «quiero pedir
algo» por WhatsApp, e `items` no es un resto sino carga viva. Y el argumento con el que se había
recomendado reusarla —«así el panel del vendedor une los pedidos del bot y los del sitio»— no
sobrevivía a los hechos: las filas del bot son carritos a medio hacer, no pedidos.

Se paró, se contó y el usuario decidió **resolver solo para el sitio**: tabla propia, el bot intacto.

**Hallazgo aparte, no tocado:** los `items` del bot guardan `product_id` apuntando a `products`, la
tabla que desapareció al unificar el catálogo dentro de `posts`. Esa ruta probablemente ya esté rota,
y explicaría los 0 pedidos.

### Decisiones y por qué

- **`customer_orders` y no `site_orders`.** El canal por el que entra un pedido no debería estar en
  el nombre de la tabla: el día que el bot coloque pedidos de verdad, escribe ahí.
- **No hay columna `total`.** Se suma de los renglones. Una copia denormalizada solo puede
  desincronizarse de lo que la compone.
- **`post_id` nulo con `ON DELETE SET NULL`.** El renglón guarda copia del título y del precio, así
  que sobrevive a que se borre la publicación. Con `RESTRICT`, el histórico habría bloqueado para
  siempre el borrado de cualquier producto pedido una vez.
- **`unit_price` es `numeric`**, no `double precision` como el `total` del bot: el dinero no se
  guarda en flotante.
- **El enum se reutiliza con `create_type=False`.** Crearlo otra vez falla; crear uno paralelo deja
  dos enums que dicen lo mismo.
- **`fromStatus` viaja al `WHERE` de la escritura.** El vendedor decide mirando una pantalla que
  puede llevar minutos abierta; sin esa condición, dos pestañas aplican una transición calculada
  sobre un estado que ya cambió. Con ella, la segunda no encuentra fila y se le dice que recargue.
- **Confirmar ya no salta a WhatsApp.** Primero se registra el pedido y el aviso se manda desde
  `/pedido/<id>`. Motivo técnico: `window.open` tras una acción de servidor llega sin gesto del
  usuario y los navegadores lo bloquean. Motivo real: un pedido que solo existe dentro de una
  conversación no se puede contar ni consultar después.
- **El mensaje del pedido lleva un solo enlace, el del pedido**, y no uno por producto como el del
  carrito: el renglón no guarda el slug —la publicación puede haberse borrado— y el vendedor abre esa
  dirección y ve todo, incluido lo que le queda por hacer.
- **Los botones del panel salen de `nextStatuses`**, la misma función que valida la transición.
  Escribirlos a mano habría sido la segunda copia de las reglas. Para que el catálogo de textos exija
  exactamente las cuatro etiquetas existentes, se estrechó el tipo: `OrderAction` es el subconjunto
  de `OrderStatus` al que se puede **llegar**.
- **404 y no 403** en el pedido ajeno: un id de pedido es un uuid, y responder «existe pero no es
  tuyo» convertiría la página en una forma de averiguar cuáles existen.

### Archivos tocados

- **Backend (otro repo, sin aplicar):** `alembic/versions/0032_2026-08-09_add_customer_orders.py`.
  **Ningún modelo de Python se tocó.**
- **Dominio:** `src/domain/order/` (`order.ts`, `ports.ts`, `whatsappOrderNotice.ts` + tests).
- **Infra:** `src/infra/dataAccess/db/schema/orders.ts` (espejo Drizzle),
  `src/infra/dataAccess/orders/` (repositorio + factory), `src/infra/cart/readCart.ts`
  (`writeCartSelection`, extraído porque ahora lo usan dos acciones).
- **Casos de uso:** `src/use_cases/placeOrder/`, `src/use_cases/advanceOrder/` + tests.
- **Presentación:** `src/presentation/orders/` (`orderActions.ts`, `OrderLines/`,
  `OrderStatusBadge/`).
- **Rutas:** `src/app/[locale]/pedido/[id]/page.tsx`, `carrito/ui/ConfirmOrderButton.tsx`,
  `cuenta/ui/SellerOrders.tsx`, y los enganches en `carrito/` y `cuenta/page.tsx`.
- **i18n:** namespace `orders` en `es.json` y `en.json`; `/pedido/[id]` → `/order/[id]` en `routing`.
- **Specs:** `src/e2e/orders/orders.feature` (slice 2 detallado), `src/e2e/orders/placeOrder.spec.ts`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` / `typecheck:tests` | limpios |
| `pnpm run lint` | exit 0 |
| `pnpm run test:run` | **121 archivos, 1185 tests, todos verdes** (47 nuevos en este slice) |
| Playwright | **no corrido.** El usuario pidió detener la e2e y correrla al final |

**El spec de slice 2 se salta solo mientras falte la migración.** `placeOrder.spec.ts` comprueba en
`beforeAll` si existe `customer_orders` (`to_regclass`) y hace `test.skip` si no: sin la tabla, esos
escenarios fallarían por un esquema que falta y no por un defecto. En cuanto `0032` corra, dejan de
saltarse solos — no hay que acordarse de nada.

**Nada se escribió en la base compartida en este slice.** No se corrió ninguna migración ni ninguna
e2e.

### Recap

El slice 2 está escrito de punta a punta —dominio, casos de uso, repositorio, acciones y las tres
pantallas— y verificado hasta donde se puede sin base: 1185 tests unitarios verdes, typecheck y lint
limpios. Lo que falta es la migración `0032`, que está escrita en el backend y **sin aplicar**, y la
corrida de Playwright. Hasta entonces, confirmar un pedido fallará en tiempo de ejecución: la tabla
no existe.

### Próximos pasos (opciones)

1. **Revisar y aplicar `0032`.** Está en `alembic/versions/0032_2026-08-09_add_customer_orders.py`,
   sin commitear, para que puedas leer el diff antes. `alembic upgrade head` y listo. Ningún modelo
   de Python se tocó, así que el bot no se entera.
2. **Correr la e2e completa** (`--shard=1/2` y `2/2`), ya con la migración aplicada, para que
   `placeOrder.spec.ts` deje de saltarse.
3. **Slice 3** — que el comprador vea la lista de sus pedidos. El repositorio ya tiene `listByBuyer`
   escrito y sin usar; falta la pantalla.
4. **El fallo preexistente de `cardControls.spec.ts:39`**, que sigue ensuciando toda corrida completa.

**Pendiente del usuario:** aplicar la migración (1) y decidir entre 2–4.

---

## Slice 2 (añadido) — Los pedidos tienen su sitio (2026-08-09)

### Objetivo

Cerrar el hueco que se vio al mirar lo entregado: **los pedidos del vendedor estaban enterrados
dentro de `/cuenta`, mezclados con la ficha de la tienda y las sucursales, y lo que uno pedía no
tenía página ninguna.** El repositorio ya traía `listByBuyer` escrito y sin usar.

### Decisiones y por qué

- **Un solo destino, `/pedidos`, para los dos papeles.** La misma persona compra y vende —hoy la
  única tienda es de alguien que también compra—, así que dos direcciones obligarían a elegir «¿en
  qué papel entro?» antes de saber si hay algo que atender.
- **Lo que te han pedido va primero.** Un pedido pendiente es alguien esperando respuesta; mirar lo
  que uno pidió puede esperar.
- **Se saca de `/cuenta` en vez de duplicarlo.** Son cosas distintas: `/cuenta` es quién eres y cómo
  te presentas —se toca una vez y se olvida—, y esto es actividad que cambia cada día.
- **La lista del comprador va resumida, no desglosada**: tienda, estado y total, con el detalle en
  `/pedido/<id>`. Repetir los renglones haría la lista ilegible con tres pedidos.
- **La sección del vendedor no se pinta si no hay tienda**, en vez de enseñarla vacía: no puede haber
  nada, y un encabezado vacío parece un fallo.
- **El enlace se ofrece a todo el mundo**, venda o no. En el menú del avatar va **antes** que «Mi
  cuenta», y en el móvil fuera del bloque condicional de tienda/perfil — que hoy no ven 20 de los 21
  usuarios.
- El disparador del menú del avatar estrena `data-testid`: la prueba lo buscaba por su etiqueta
  traducida, que es exactamente el tipo de localizador que se rompe al cambiar un texto.

### Archivos tocados

`src/app/[locale]/pedidos/` (`page.tsx`, `ui/BuyerOrders.tsx`, y `ui/SellerOrders.tsx` **movido**
desde `cuenta/ui/`), `cuenta/page.tsx` (se le quita la sección), `UserMenu.tsx`,
`MobileAccountCard.tsx`, `i18n/routing.ts` (`/pedidos` → `/orders`), los dos catálogos de mensajes,
`orders.feature` y `placeOrder.spec.ts`.

### Validación

`typecheck`, `typecheck:tests` y `lint` limpios; `pnpm run test:run` en **1185 verdes**. Playwright
**no corrido** — sigue pendiente de la migración y de que el usuario lance la suite.

### Recap

Ya hay un lugar visible para los pedidos y se llega desde el menú del avatar en escritorio y móvil:
`/pedidos` enseña lo que te han pedido —si tienes tienda— y lo que has pedido, cada uno enlazando a
su detalle. Con esto el slice 3 del roadmap queda absorbido: lo que faltaba era justo la lista del
comprador. Sigue todo pendiente de aplicar `0032`.

### Próximos pasos (opciones)

1. **Revisar y aplicar `0032`** (`alembic upgrade head`), que sigue siendo la única puerta.
2. **Correr la e2e completa** ya con la tabla, para que `placeOrder.spec.ts` deje de saltarse.
3. **Slice 4 — pago en línea**, cuando los pedidos registrados digan que vale la pena.
4. **El fallo preexistente de `cardControls.spec.ts:39`.**

**Pendiente del usuario:** aplicar la migración y lanzar la e2e.

---

## Slice 2 — validación completa tras aplicar `0032` (2026-08-09)

### Qué se corrió

La migración ya estaba aplicada (`alembic_version = 0032_2026_08_09`), verificada contra
`information_schema`: las dos tablas con su forma exacta, los cuatro índices, los dos CHECK y **la
`orders` del bot intacta, con 0 filas**.

| Comando | Resultado |
| --- | --- |
| `playwright test src/e2e/orders` | **13/13** |
| `playwright test --shard=1/2` | 107 pasados, 3 saltados, **1 fallo preexistente** |
| `playwright test --shard=2/2` | **110 pasados** |
| `pnpm run typecheck` / `typecheck:tests` / `lint` | limpios |

El único fallo sigue siendo `localProducers/cardControls.spec.ts:39`, comprobado sobre `dev` limpio
en una sesión anterior.

### El dev server no se mató: se reutilizó

Había un `next dev` del propio proyecto en el 3000. `E2E_PORT=3100` **no sirve** —Next se niega a
arrancar un segundo `dev` del mismo directorio aunque cambie el puerto—, y matarlo a lo bruto
corrompe `.next/dev`. Se usó la otra salida que ya documentaba `pendientes.md`: un
`playwright.reuse.config.ts` temporal que hereda el config y pone `reuseExistingServer: true`.
**Borrado al terminar.**

### Tres defectos que la corrida destapó

1. **`deleteTestSellerByHandle` ya no podía limpiar.** `customer_orders.seller_id` apunta a
   `sellers` desde `0032`, así que borrar una tienda de prueba con pedidos fallaba por el FK. Lo
   introdujo mi migración y ninguna prueba lo habría visto hasta que una tienda sembrada tuviera
   pedidos. Ahora los pedidos se borran primero; sus renglones caen por `CASCADE`.

2. **El panel del vendedor se probaba con una tienda ajena.** Los escenarios usaban `hazlo-sano`,
   cuya `user_id` apunta a una cuenta real: la sesión de la suite no es su dueña, así que `/pedidos`
   no pintaba la sección de vendedor y el escenario fallaba **por el fixture, no por el código**.
   Ahora el spec siembra su propia tienda (`e2e-tienda-de-pedidos`) y se la engancha a la cuenta de
   la suite, con el handle fijo y borrado **antes y después** de cada prueba: una corrida que muera a
   medias se limpia sola en la siguiente en vez de dejar la cuenta con tienda —que es el fallo que
   `seedStore` advierte y que ya costó una corrida entera.

3. **Dos escenarios del slice 1 describían algo que el slice 2 eliminó.** `cart-confirm` era un
   enlace a `wa.me` y ahora es un botón que registra el pedido. El escenario del mensaje se movió a
   `placeOrder.spec.ts` —donde sí hay sesión, que es lo que confirmar exige— y el del agotado se
   quedó con lo que sigue siendo del carrito: que se ve, que no se cobra y que no desaparece solo.
   El `.feature` se corrigió para decir lo que las pruebas hacen.

### Lo que quedó en la base compartida

**Nada de la suite:** 0 tiendas y 0 publicaciones con prefijo `e2e-`. La única fila en
`customer_orders` es un pedido **real** hecho a mano desde el sitio (4 × Pechuga de pollo asada a
105, de Hazlo Sano). Durante la sesión pasó de `PENDING` a `DELIVERED`; no fue la suite —el `WHERE`
de la escritura lleva el `seller_id` de la sesión y la cuenta de pruebas solo es dueña de su tienda
sembrada—, así que lo recorrió su dueño desde el panel.

### De paso: `docs/database.md`

Estaba dos migraciones por detrás (decía head `0029` y 19 tablas; van `0032` y 26). Se actualizaron
la cabecera, el reparto de tablas, la lista de migraciones, y se añadió la sección de pedidos — con
la advertencia de que **`orders` no es esta tabla**, que es exactamente el malentendido que hizo
proponer reusarla.

### Recap

El slice 2 está entregado y verificado de punta a punta contra el esquema real: 13/13 en su carpeta
y 217 pasados en la suite completa, con el único fallo conocido de antes. Los pedidos se registran,
el vendedor los administra desde `/pedidos` y el comprador ve los suyos, todo enlazado desde el menú
del avatar. Ya no queda ninguna puerta abierta en esta feature.

### Próximos pasos (opciones)

1. **Fusionar `feat/pedidos` en `dev`** (9 commits) y subirla.
2. **Slice 4 — pago en línea.** Ya hay un pedido real sobre el que empezar a contar; la decisión pide
   unas semanas de dato, no una tarde.
3. **`cardControls.spec.ts:39`**, el único rojo de la suite. Pista: `CardOwnerControls` resuelve la
   etiqueta con `state.isAvailable ?? isAvailable`, así que o la acción no devuelve estado nuevo o el
   componente se remonta y lo pierde.
4. **Commitear `0030`, `0031` y `0032`** en el repo del backend, que están sin versionar.

**Pendiente del usuario:** decidir la fusión y el push.

---

## Slice 3 — Pedidos que aguantan (2026-08-09)

### La pregunta que lo abrió

«¿No crees que los pedidos usan mucho espacio? ¿Qué pasa si algún vendedor o usuario tiene muchos?»

La respuesta honesta era **no al espacio y sí a la consulta**. Diez mil pedidos de tres renglones son
unos 5 MB — la base ya guarda vectores de 768 dimensiones que pesan más. Lo que sí estaba mal, y lo
había escrito yo dos slices antes, es que `listBySeller` y `listByBuyer` **no tenían `LIMIT`**: la
página traía todos los pedidos con todos sus renglones y los volcaba al HTML en cada visita. Con
cinco no se nota, y por eso pasó las pruebas.

### Decisiones y por qué

- **Paginación de 10**, con el total en la misma consulta (`count(*) OVER ()`). Dos `SELECT` para
  pintar una barra de paginación son dos viajes a la base.
- **El vendedor entra por lo abierto.** `OPEN_STATUSES` se enumera y **no** se deriva de `isFinal`,
  aunque hoy dé lo mismo: `DRAFT` y `PAID` tampoco tienen salidas y no son pedidos abiertos. Hay un
  test dedicado a que nadie lo "simplifique" el día que `PAID` entre en el flujo.
- **`ILIKE` y no full-text**, con el motivo escrito junto a la función: la pregunta real cabe en dos
  páginas de resultados, y montar `tsvector` sería traer la maquinaria del catálogo a un sitio que no
  la necesita.
- **Se descartó el índice que yo mismo había propuesto.** `ix_customer_orders_seller` ya lleva
  `seller_id` de primero, así que acota y ordena; filtrar el estado sobre unos cientos de entradas es
  gratis. Una migración sobre la base compartida para una tabla de una fila es ceremonia. Queda el
  umbral escrito: ~10.000 pedidos por tienda y un `EXPLAIN` que lo justifique. **Este slice no lleva
  migración.**
- **La miniatura y el enlace NO se guardan.** Se resuelven al leer con dos `LEFT JOIN LATERAL`. El
  renglón congela lo que se acordó —título y precio—; un slug congelado apuntaría a una dirección que
  puede haber cambiado de idioma. Y como `post_id` es nulo cuando la publicación se borró, los
  laterales devuelven nulo y el renglón se sigue leyendo entero, sin foto ni enlace.
- **Lo que se escribe y lo que se lee dejaron de ser el mismo tipo.** `NewOrderLine` es un
  subconjunto de `OrderLine` sin slug ni imagen: tenerlos en el tipo de escritura invitaba a
  congelarlos.
- **`updateStatus` devuelve el estado, no el pedido.** Nadie pinta lo que devuelve —la pantalla se
  recarga por `revalidatePath`—, así que traer los renglones era una consulta a la basura. Y
  `findHeader` se separó de `findById` por lo mismo: mover un pedido no necesita ni renglones ni
  idioma.
- **Pestañas en vez de las dos listas apiladas.** Apiladas funcionaban sin controles; con búsqueda,
  filtro y paginación cada una, significaban dos buscadores compitiendo por los mismos parámetros. El
  número en la pestaña dice si hay algo esperando en la otra, que era lo único que se perdía.
- **La búsqueda es un `<form method="get">`** con los demás filtros como campos ocultos: funciona sin
  JavaScript y el navegador arma la URL solo.
- **No se reutilizó `presentation/navigation/Pagination`**: pagina por segmento de ruta contra las
  rutas declaradas en `routing.ts`, y aquí la página convive con la pestaña, el estado y la búsqueda
  como parámetros de consulta. Meterle soporte de query lo habría vuelto dos componentes en uno.

### Archivos tocados

- **Dominio:** `order.ts` (`OPEN_STATUSES`, `CLOSED_STATUSES`, `OrderScope`, `statusesInScope`,
  `resolveScope`, y `slug`/`imageUrl` en `OrderLine`), `ports.ts` (`OrderQuery`, `OrderPage`,
  `NewOrderLine`, `countOpen`, `findHeader`).
- **Infra:** `PostgresOrderRepository` reescrito alrededor de una consulta compartida con `LIMIT`,
  filtro de estado, `ILIKE` y los dos `LATERAL` de la miniatura.
- **Casos de uso:** `advanceOrder` usa `findHeader`; `placeOrder` escribe `NewOrderLine`.
- **Rutas:** `/pedidos` con pestañas, filtro, búsqueda y paginación (`ui/OrdersControls.tsx`,
  `ui/OrdersPagination.tsx`); `OrderLines` con miniatura y enlace.
- **Specs:** `orders.feature` (slice 3), `placeOrder.spec.ts` alineado con las pestañas,
  `scope.test.ts` y `ordersHref.test.ts` nuevos.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` / `typecheck:tests` | limpios |
| `pnpm run lint` | exit 0 |
| `pnpm run test:run` | **123 archivos, 1203 tests, todos verdes** (18 nuevos) |
| Playwright | **no corrido.** El usuario pidió no lanzarla todavía |

### Lo que hay que saber antes de correr la e2e

**`placeOrder.spec.ts` se ajustó a la pantalla nueva y ese cambio no está verificado.** Dos
escenarios afirmaban cosas que el slice 3 cambió: que se veían las dos secciones a la vez —ahora solo
la de la pestaña activa— y que tras entregar el pedido seguía en la lista —ahora sale del filtro por
omisión, que es el comportamiento buscado—. Están reescritos contra el comportamiento nuevo, pero
hasta que la suite corra son una hipótesis.

### Recap

Las dos listas ya no se leen enteras: vienen de diez en diez, el vendedor entra por lo que espera
respuesta, se puede buscar por producto y cada renglón enseña su miniatura y lleva a la publicación
cuando todavía existe. Sin migración y sin nada que aplicar. Falta pasar la e2e.

### Próximos pasos (opciones)

1. **Correr la e2e** (`src/e2e/orders` primero, luego la suite en dos mitades).
2. **Fusionar y subir**, cuando la e2e esté verde.
3. **Slice 4 — pago en línea**, cuando los pedidos digan que vale la pena.
4. **`cardControls.spec.ts:39`**, el único rojo conocido de la suite.

**Pendiente del usuario:** decidir cuándo se lanza la e2e.

---

## Slice 3 — validación en navegador y los tres bugs que destapó (2026-08-10)

Correr la e2e contra las pantallas nuevas encontró lo que ni el typecheck ni 1203 tests unitarios
podían ver. Los tres son míos, de este mismo slice.

### 1. Las fechas llegaban como texto y la pantalla reventaba por dentro

`FORMATTING_ERROR: Invalid time value` en `/pedidos` y en la ficha del pedido — **el error que el
usuario vio al probarlo a mano.**

La causa: **`db.execute` con SQL crudo entrega los `timestamptz` como cadena**
(`2026-08-10 01:58:42.873743+00`), mientras que el constructor de consultas de drizzle sí los
convierte a `Date`. El slice 2 leía con el constructor y funcionaba; el slice 3 pasó a SQL crudo para
poder paginar y filtrar, y con eso `createdAt` dejó de ser una fecha. `Intl` la convierte a `NaN` y
`format.dateTime` lanza.

Se convierte al mapear, una sola vez, y `OrderRow.created_at` pasa a declararse `string`, que es la
verdad. Declararlo `Date` era la mentira que dejó pasar el error por delante de TypeScript.

> El mismo tropiezo acecha en `PostgresPostQueryRepository`, que también lee con `db.execute` y
> declara `created_at: Date`. Ahí no se nota porque `mapPostsToCards.normalizeCreatedAt` acepta
> cadenas — esa función existe justamente por esto.

### 2. La e2e no podía verlo, porque next-intl se lo tragaba

next-intl **captura** el `FORMATTING_ERROR`, lo registra y pinta un hueco. La página seguía cargando,
así que todas las aserciones pasaban: el escenario iba verde con la fecha rota. Ahora la fecha se
afirma de verdad (`order-placed-on` contiene el año), así que un fallo de formato ya no puede
esconderse detrás de una página que carga.

### 3. Siete fallos que no eran fallos: rutas frías

La primera corrida completa dio **7 rojos repartidos por tres archivos**, varios en pruebas que este
slice no tocaba. No eran regresiones: `/carrito`, `/pedidos`, `/pedido/[id]` y
`/buscar/[term]/page/[page]` **no estaban en `warmRoutes`**, así que el primer escenario que las
pisaba pagaba su compilación dentro de su propio plazo. Es el modo de fallo que ese módulo ya
documenta; lo que faltaba era añadir las rutas que estrené. Con ellas dentro: **16/16**.

`/pedido/[id]` se calienta con un uuid de ceros: sin sesión redirige a identificarse, y eso ya compila
el segmento, que es lo único que se busca.

### 4. El escenario de las alturas dependía de la paginación

Fijaba dos productos concretos, y el apaisado era del lote del 24 de julio: cae a la página 2 de
`/productos`. Peor, el tamaño de página cambia con el entorno —9 en local, 4 en CI, que corre sin
ningún `.env`—, así que habría sido rojo en GitHub por un motivo distinto. Ahora recorre las dos
primeras páginas y afirma lo que el escenario dice de verdad: **que no todas las tarjetas miden lo
mismo de alto**, sin nombrar cuáles.

### Validación

| Comando | Resultado |
| --- | --- |
| `typecheck` / `typecheck:tests` / `lint` | limpios, exit 0 |
| `test:run` | **1203 verdes** |
| `playwright test src/e2e/orders src/e2e/dimensionesMedia` | **16/16** |
| `playwright test --shard=1/2` | 108 pasados, 3 saltados, **1 fallo preexistente** |
| `playwright test --shard=2/2` | **112 pasados** |

**220 pasados.** `createPost.spec.ts:31` falló en la primera pasada de la mitad 1 y pasó sola y en la
repetición: es la flakiness en frío ya documentada, no una regresión.

### El único rojo, ya diagnosticado

`localProducers/cardControls.spec.ts:39` sigue fallando, y ya no es un misterio. Se instrumentó:
**la acción del servidor no falla** —no aparece error y la base sí cambia—. Lo que no se entera es la
pantalla, por dos cosas que se suman: el feed del inicio guarda `posts` en `useState` (su propio
docstring avisa de que no vuelve a mirar sus props) y `MasonryColumns` puede mover una tarjeta de
columna al repintar, lo que la desmonta y se lleva el `useActionState`. El detalle y por qué **no** se
arregló aquí —las dos salidas tienen regresión visible y son un cambio de diseño del feed— está en
`docs/pendientes.md`.

### Recap

El slice 3 está entregado y verificado en navegador. Los pedidos vienen por páginas, el vendedor
entra por lo abierto, se busca por producto y cada renglón enseña su miniatura y lleva al producto.
De paso quedó arreglado que las tarjetas y la ficha usen las dimensiones reales de la media. Sin
ninguna migración.

### Próximos pasos (opciones)

1. **`cardControls.spec.ts:39`**, ya con el diagnóstico hecho: pide decidir cómo refresca el feed del
   inicio tras una mutación.
2. **Slice 4 — pago en línea**, cuando los pedidos digan que vale la pena.
3. **Las insignias que faltan en la búsqueda** (`origin`, `category`, `subCategory`, `seller`) — ya
   hechas para el carrito, pendientes de decidir para el resto.
