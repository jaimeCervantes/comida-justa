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

---

## Slice 4 — El carrito se entiende de un vistazo (2026-08-10)

### Objetivo

El carrito enseñaba una lista de texto con un desplegable de veinte números al lado. Se entendía
**leyendo**, no mirando, y poner tres unidades pedía abrir una lista y buscar el número.

### Decisiones y por qué

- **La miniatura no se guarda, se relee.** El carrito sigue recordando solo id y cantidad; la foto
  sale de `post_media` en la misma consulta que ya traía título y precio. Un `LEFT JOIN LATERAL`,
  porque una publicación puede no tener archivo y dejarla fuera del carrito por eso sería mucho peor
  que no verla.
- **Dos enlaces al mismo sitio, uno de ellos callado.** La foto y el nombre llevan al producto; el de
  la foto va `aria-hidden` y fuera del tabulador. Repetir el destino no informa, y una imagen
  decorativa dentro de un enlace se anuncia como "enlace" a secas.
- **La fila se reordena para caber**: foto a la izquierda y el resto en columna. En un teléfono el
  nombre se lleva su renglón entero y los controles caen debajo, en vez de comprimirse hasta ser
  impulsables.
- **Menos / cantidad / más, y los botones mandan un INCREMENTO.** No la cantidad final: el servidor
  lo aplica sobre lo que hay en la cookie, así que dos toques seguidos suman dos aunque la pantalla
  enseñe todavía el número viejo. Mandar "3" calculado sobre una pantalla que se quedó atrás pisaría
  el otro toque. El campo numérico sí manda el valor absoluto —escribir 12 es decir 12— y **envía al
  salir**, no en cada tecla: por tecla se manda una petición por dígito y la del "1" puede llegar
  después de la del "12".
- **`Thumbnail` se comparte** con los renglones del pedido. Era la segunda copia del mismo patrón, y
  la segunda copia es donde empiezan a discrepar.
- **Sin migración.** `post_media` ya estaba; lo que faltaba era pedirla.

### Archivos tocados

`domain/cart/cart.ts` (`imageUrl`), `PostgresCartProductRepository` (el `LATERAL` de la imagen),
`carrito/ui/CartLineRow.tsx` (reescrito), `presentation/cart/cartActions.ts` (incremento),
`presentation/media/Thumbnail/` (nuevo, con test), `presentation/orders/OrderLines.tsx` (lo adopta),
los dos catálogos de mensajes, `orders.feature` y `cart.spec.ts`.

### Validación

| Comando | Resultado |
| --- | --- |
| `typecheck` / `typecheck:tests` / `lint` | limpios, exit 0 |
| `test:run` | **124 archivos, 1209 tests, verdes** |
| `playwright test src/e2e/orders` | **14/14** |
| `playwright test --shard=1/2` | 109 pasados, 3 saltados, **1 fallo preexistente** |
| `playwright test --shard=2/2` | **112 pasados** |

**221 pasados.** El único rojo sigue siendo `localProducers/cardControls.spec.ts:39`, ya
diagnosticado en `docs/pendientes.md`.

### Una lección sobre la flakiness, para no repetir el rato perdido

`cartFromSearch.spec.ts` falló **tres veces seguidas** y pareció una regresión de este slice. No lo
era: pasó en `dev`, y al volver a la rama pasó también, sin tocar una línea. El disparador es el
**cambio de rama**, que invalida la compilación de Next; el calentamiento de rutas cubre la primera
petición de cada segmento, pero no que la primera consulta de búsqueda de la corrida sea la más
lenta.

La forma de distinguirlo cuesta dos minutos y vale la pena antes de tocar nada: correr el spec
aislado en la rama y en `dev`. Si pasa en las dos, es frío. Es el mismo procedimiento que ya sirvió
para `cardControls` —donde sí resultó ser real— y para `createPost`.

### Recap

El carrito ya se lee de un vistazo: foto, nombre enlazado, cantidad con menos y más, importe y
quitar, y la fila se parte sola en pantallas estrechas. Sin nada que aplicar en la base.

### Próximos pasos (opciones)

1. **`cardControls.spec.ts:39`**, con el diagnóstico ya hecho: decidir cómo refresca el feed del
   inicio tras una mutación.
2. **Slice 5 — pago en línea**, cuando los pedidos digan que vale la pena.
3. **Las 75 vulnerabilidades que reporta Dependabot** en el repositorio, avisadas en el último push.

---

## Slice 5 — Una compra, aunque sean varias tiendas (2026-08-15)

### Las tres preguntas que lo abrieron

«¿La funcionalidad del carrito puede tener elementos de más de un vendedor?» Sí, desde el slice 1 y
por diseño. Al mirarlo de cerca para contestar salieron tres cosas, y el usuario decidió las tres:

1. **Que se vea el total de la compra**, aunque no se pueda pagar de una vez: «el usuario debe ver
   cuánto se va a gastar».
2. **Que haya una segunda tienda de verdad** en la base, porque con una sola nunca se había visto
   funcionar nada de esto fuera de Vitest.
3. **Que las tiendas de un mismo carrito compartan checkout**, «para que cuando busque su pedido vea
   todos sus productos y no sean checkouts diferentes».

La tercera no era una mejora: era un **defecto**. `checkout_id` existía desde `0032` con el propósito
escrito en su docstring —«los N pedidos que salen de un mismo carrito lo comparten»— y no lo cumplía,
porque `PlaceOrderUseCase` llamaba a `newCheckoutId()` en **cada** ejecución y confirmar es por
tienda. Dos tiendas del mismo carrito salían con dos checkouts. Nunca se notó por lo mismo que no se
notaba nada más: hay un solo vendedor en la base.

### Decisiones y por qué

- **El total de la compra existe y dice lo que es.** La primera versión se negó a sumarlo con un
  argumento que sigue siendo cierto para cobrar y falso para decidir: «nadie puede cobrar una cifra
  que mezcle dos negocios». Correcto — pero quien llena un carrito no pregunta cuánto le debe a cada
  tienda, pregunta cuánto se va a gastar, y esa pregunta no necesita dueño. Se enseñan las dos cifras
  con su nombre: subtotal por tienda (cobrable) y total de la compra (informativo, con la nota de que
  se confirma en un pedido por tienda).
- **Con una sola tienda no se pinta el total.** Sería la misma cifra dos veces seguidas, y un número
  repetido hace dudar de si son el mismo.
- **El `checkout_id` es del carrito, no del pedido**, así que vive donde vive el carrito: en una
  cookie, `hs_checkout`, al lado de `hs_cart`. Nace al confirmar la primera tienda, lo reutiliza la
  segunda y **muere cuando el carrito se vacía**, por las dos salidas: confirmarlo todo (`placeOrder`)
  y quitarlo a mano (`cartActions`). Sin la segunda, el pedido de la semana que viene se engancharía a
  la compra de esta.
- **Cookie propia y no un campo dentro de `hs_cart`.** El checkout no es un renglón: no se añade, no
  se quita y no tiene cantidad. Meterlo en el mismo valor obligaba a `parseCart` a distinguir dos
  formas de renglón, que es como empiezan los errores de formato.
- **Se valida como un uuid antes de creerle.** Una cookie la escribe cualquiera y este valor va a una
  columna `uuid`: lo que no lo sea reventaría el `INSERT` justo en el momento de comprar. Mismo
  criterio que `parseCart`.
- **`PlaceOrderUseCase` ya no genera el id: lo recibe.** Se le quitó la dependencia inyectada
  `newCheckoutId`. Un caso de uso que inventa la identidad de algo que no le pertenece es exactamente
  el error que se está corrigiendo.
- **La compra completa se enseña solo al comprador.** `listByCheckout` lleva el `user_id` en el
  `WHERE`, no solo el `checkout_id`: compartir el carrito no es compartir la clientela, y sin esa
  condición la ficha de un pedido le enseñaría al vendedor a qué otras tiendas le compró su cliente.
- **El pedido que se mira se marca y no se enlaza a sí mismo.** Un enlace que no lleva a ninguna parte
  es la forma más barata de que alguien crea que la página se colgó.
- **Aviso de lo que queda en el carrito**, en la ficha del pedido recién hecho. Confirmar es por
  tienda; sin decirlo, la segunda mitad de la compra depende de que el comprador se acuerde de volver.
- **La segunda tienda de la base es un script reversible**, no un `INSERT` a mano:
  `pnpm run seed:demo-seller`, con `--dry-run` y `--remove`. Se llama «Panadería de prueba» y sus dos
  productos llevan `[PRUEBA]` en el título: cualquiera que los vea en el catálogo tiene que saber que
  no le van a vender nada. Su `user_id` queda en `NULL`, como en `seedStore`: colgarla de una cuenta
  real le quitaría a su dueño el formulario de alta de tienda.
- **`listByCheckout` no pagina**: un carrito tiene tantas tiendas como tiendas hay, y hoy son dos.
  Lleva un techo de 20 para que la consulta no pueda crecer sin límite, no para paginar.
- **Se acepta una consulta de más** por visita a la ficha del pedido: se piden los hermanos aunque
  casi siempre haya uno solo. Contar primero y leer después serían dos viajes en el caso que importa,
  y esta pantalla no es la de tráfico.

### Archivos tocados

- **Dominio:** `cart/cart.ts` (`cartTotal`), `order/order.ts` (`checkoutTotal` y el docstring de
  `checkoutId`), `order/ports.ts` (`listByCheckout`) + sus tests.
- **Infra:** `cart/checkoutCookie.ts` y `cart/readCheckout.ts` (nuevos, + test),
  `PostgresOrderRepository` (`listByCheckout` y el `ORDER BY` parametrizado de `listWhere`).
- **Casos de uso:** `placeOrder` recibe `checkoutId` en vez de generarlo.
- **Presentación:** `orderActions` (ciclo de vida del checkout), `cartActions` (cerrarlo al vaciar),
  `carrito/ui/CartSummary.tsx` y `pedido/[id]/ui/CheckoutOrders.tsx` (nuevos).
- **i18n:** `cart.grandTotal(+Note)` y `orders.checkout*` / `orders.cartPending*` en los dos catálogos.
- **Scripts:** `src/scripts/seedDemoSeller.ts` y `seed:demo-seller` en `package.json`.
- **Specs:** `orders.feature` (slice 5; el pago en línea se corre un número),
  `src/e2e/orders/multiSeller.spec.ts` (nuevo).
- **Docs:** `pedidos.md`, `datos-de-prueba-e2e.md`, `pendientes.md`.

### Lo que la corrida destapó, y que no era de este slice

1. **El barrido de la e2e no podía borrar una tienda con pedidos.** `sweepTestData` borraba
   publicaciones y sucursales antes de la tienda, pero **no los pedidos**, y
   `customer_orders.seller_id` la referencia desde `0032`. Solo `deleteTestSellerByHandle` lo hacía
   bien. Una corrida que muriera dejando una tienda de prueba con pedidos habría tumbado el
   `globalSetup` de la siguiente por el FK — y este slice, que crea pedidos en dos tiendas sembradas,
   lo habría provocado tarde o temprano.
2. **`dimensionesMedia.spec.ts` fijaba «Jugo Verde» en la primera página de `/productos`.** Sembrar dos
   productos lo empujó a la segunda y el escenario se puso rojo por dónde quedó el producto, no por lo
   que prueba — el mismo error que el otro escenario del archivo ya había corregido. Ahora recorre el
   catálogo hasta encontrarlo. De paso: **`locator.count()` no espera a nada**, así que hay que esperar
   a que la página esté pintada antes de contar; el escenario original no lo necesitaba porque
   `expect(...).toHaveAttribute` sí espera.
3. **Tres escenarios de hábitos afirmaban un texto que `a528a52` dejó de pintar.** Ese commit
   —«reduce spacing…»— condicionó el cuerpo de la tarjeta de celebración a `variant === "full"`, y el
   feed del inicio usa `compact`. Se afirma el **título**, que sigue distinguiendo el primer hito del
   final. Rojo preexistente en `dev`, no de este slice, pero el `pre-commit` corre `pnpm run validate`
   entero: sin arreglarlo no se puede commitear nada.
4. **Hay un `<main>` dentro de otro `<main>` en 21 rutas.** El layout ya pinta el landmark y las
   páginas abren el suyo dentro. Se vio porque `page.locator("main")` falla por modo estricto. **No se
   arregló**: son 21 archivos de rutas ajenas a esta feature. Queda con receta en `docs/pendientes.md`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` / `typecheck:tests` | limpios |
| `pnpm run lint` | exit 0 — **tras arreglar 4 ficheros de hábitos que ya estaban sin formatear en `dev`**: el `pre-commit` corre `biome check .` y no dejaba commitear nada |
| `pnpm run check:i18n` | limpio |
| `pnpm run test:run` | **156 archivos, 1596 tests, todos verdes** |
| `pnpm exec playwright test src/e2e/orders` | **19/19**, con los 5 escenarios nuevos de dos tiendas |
| `pnpm run validate` (suite completa) | **282 pasados, 3 saltados, 3 caídos por `ERR_CONNECTION_REFUSED`** |

Los tres caídos son los de `notFound.spec.ts` y **no son un defecto**: el dev server se cayó unos
segundos a mitad de la corrida y esas tres navegaciones no encontraron a nadie escuchando. Repetidos
en aislamiento, **3/3 en verde**. Es el mismo tipo de ruido que ya documenta `pendientes.md` sobre el
dev server en Windows, no una regresión.

### Lo que se escribió en la base compartida

**Una tienda permanente y a propósito:** `Panadería de prueba` (`/tienda/panaderia-de-prueba`),
teléfono `2789990088`, una sucursal a 3 km del ancla y dos productos `[PRUEBA]` (60 y 12). Es lo que
se pidió, para poder ver el carrito de dos tiendas en el sitio de verdad. **Se deshace entera con
`pnpm run seed:demo-seller -- --remove`**, pedidos incluidos.

Del resto, nada: la suite siembra sus dos tiendas y su cuenta `@example.com` y las borra en cada
prueba, y `globalTeardown` falla si queda algo. Ninguno de los productos reales se tocó.

### Recap

Un carrito con dos tiendas ya se entiende y se compra entero: cada tienda con su subtotal y su botón,
el total de la compra debajo diciendo en cuántos pedidos se parte, y los pedidos que salen de ahí
quedan hermanados por un solo `checkout_id`, así que desde cualquiera de ellos se ve la compra
completa con lo que costó — y solo la ve quien la hizo. Hay una segunda tienda en la base para
comprobarlo a mano, y cinco escenarios de Playwright que lo comprueban solos. **Sin migración.**

### Próximos pasos (opciones)

1. **Borrar la tienda de prueba** cuando ya no haga falta: `pnpm run seed:demo-seller -- --remove`.
2. **El `<main>` anidado en 21 rutas**, con la receta ya escrita en `docs/pendientes.md`.
3. **`cardControls.spec.ts:39`**, el rojo con diagnóstico hecho desde el slice 3.
4. **El pago en línea**, cuando los pedidos digan que vale la pena. Ahora el `checkout_id` ya
   significa lo que decía significar, que es a lo que tendría que apuntar un pago de varias tiendas.
5. **Las 75 vulnerabilidades de Dependabot**, avisadas en el último push.

**Pendiente del usuario:** decidir 1 y 2, y si esta rama (`feat/compra-multitienda`) se fusiona en
`dev`.

---

## Slice 6 — El pedido se reconoce sin abrirlo (2026-08-15)

### Objetivo

`/pedidos` tenía tres carencias que sólo se ven con pedidos de verdad, y hoy ya los hay: **la lista
del comprador no decía qué se había pedido**, **la del vendedor no decía quién lo pedía**, y **la
búsqueda esperaba al Enter** mientras la búsqueda principal del sitio filtra al teclear.

### Lo que decidió el diseño: la base, no la intuición

La tarjeta del comprador se escribió en el slice 2 «resumida, no desglosada», y estaba razonado: el
detalle vivía en `/pedido/<id>` y repetir los renglones haría la lista ilegible en cuanto hubiera
tres pedidos. La apuesta era que tienda + estado + fecha bastarían para distinguirlos.

Los cinco pedidos reales la tumbaron: **cuatro son a la misma tienda, los cuatro `PENDING`, y tres
de la misma semana.** Las tres señales en las que se apoyaba la tarjeta valen exactamente lo mismo
en cuatro de cinco filas, y lo único que las separa —qué se pidió— era lo que no se enseñaba. El de
525 lleva 3 renglones y 9 artículos; el de 70, dos renglones de uno. Desde la lista se veían igual.

No fue un error de quien lo escribió: era una premisa razonable que los datos desmintieron. Por eso
consultar la base antes de decidir sigue siendo el paso que más veces cambia el plan.

### Decisiones y por qué

- **Una sola tarjeta para los dos papeles** (`presentation/orders/OrderCard/`). Las dos eran
  distintas por accidente, no por decisión. Lo que de verdad cambia entre comprar y vender cabe en
  dos props: **con quién es** el pedido y **qué se puede hacer** con él. Lo demás —estado, fecha,
  cuántos artículos, renglones y total— es el mismo pedido visto desde los dos lados.
- **La tarjeta del comprador deja de ser un enlace entero.** Es la consecuencia directa de
  desglosar: los renglones enlazan a su producto y un enlace no puede llevar enlaces dentro. El
  destino no se pierde, se nombra («Ver el pedido»). Y se le quitó el `interactive` del `Surface`:
  un realce al pasar el cursor sobre algo que ya no es pulsable promete un clic que no existe.
- **`orderItemCount` cuenta cantidades, no renglones.** `lines.length` habría dicho «3» de un pedido
  que son nueve cosas que preparar y entregar: eso describe la tabla, no el pedido.
- **Quién pidió sale de la consulta que ya estaba**, con un `JOIN users` al lado del `JOIN sellers`.
  No era que no se pintara: `listBySeller` nunca trajo el comprador. La clave `orders.buyer` («Lo
  pidió {name}») llevaba **desde el slice 2 en los dos catálogos sin que nadie la usara**.
- **`OrderBuyer` no es un componente nuevo, es una composición.** `IdentityLink` + `profileHref` +
  `Avatar` ya resolvían «cara y nombre enlazados a un perfil» en cuatro sitios. Escribir aquí otro
  par `Avatar` + `Link` habría sido la quinta copia. Buscar antes de crear ahorró el componente.
- **Sin `username` no hay enlace, pero sí nombre.** Hoy 1 de 21 cuentas tiene dirección personal, así
  que enlazar a ciegas mandaría a la mayoría a un 404.
- **Quién pidió sólo se le dice al vendedor**, también en `/pedido/<id>`. A quien compró, decirle que
  lo pidió él no le informa de nada.
- **Cada lista se queda con la mitad que le sirve** (`OrderWithBuyer` / `OrderWithSeller`, y
  `OrderWithParties` para la ficha, que la miran los dos). No es ahorro de bytes —las dos filas ya
  vinieron en la misma consulta— sino de tipos: así la pantalla del vendedor no puede pintar por
  descuido el teléfono de su propia tienda donde va quien le pidió.
- **La búsqueda filtra al escribir, y el `<form method="get">` se queda.** Lo que se añade es el
  disparo automático; quitar el formulario habría cambiado una carencia por otra, porque es lo que
  hace que Enter funcione y que la pantalla sirva sin JavaScript.
- **`replace` y no `push`:** escribir «suero» son cinco cambios de dirección, y con `push` el botón
  de atrás obliga a deshacerlos letra por letra antes de salir de la página.
- **300 ms y no los 500 de `SearchBar`.** No son la misma operación: aquél va a la búsqueda semántica
  y pinta un desplegable **encima** de lo que estás leyendo; éste refiltra una lista que ya estás
  mirando, con un `ILIKE` sobre los pedidos de una sola persona.
- **`ordersHref` sale a su propio módulo.** Lo usan las dos orillas —pestañas y paginación, que son
  de servidor; el campo de búsqueda, que es de cliente— y un `"use client"` no puede importar de un
  componente servidor asíncrono sin arrastrarlo al paquete del navegador.
- **Sin migración.** Todo sale de columnas que ya existían.

### El detalle que casi se cuela: el efecto que se repite solo

El campo compara **ya normalizado** contra lo que dice la URL. Sin eso, un espacio final dejaba
`term` («suero ») y `current.term` («suero», que el servidor recorta al leer) distintos para siempre:
el efecto disparaba, el servidor contestaba lo mismo, y volvía a disparar cada 300 ms. Tiene su
prueba, porque es la clase de fallo que no se ve mirando la pantalla.

Y un `useRef` con lo último que **este campo** pidió, para distinguir «el servidor contestó a lo que
escribí» de «el término cambió por fuera» (el botón de atrás). Sin esa distinción, la respuesta a la
tercera letra llega cuando ya vas por la quinta y devuelve el campo atrás mientras escribes.

### Archivos tocados

- **Dominio:** `order/order.ts` (`orderItemCount` + su test), `order/ports.ts` (`OrderWithBuyer`,
  `OrderWithParties`, y las firmas de `listBySeller` y `findById`).
- **Infra:** `PostgresOrderRepository` (el `JOIN users`, las tres columnas y las dos proyecciones).
- **Presentación:** `orders/OrderCard/` y `orders/OrderBuyer/` (nuevos, con test).
- **Rutas:** `pedidos/ui/ordersHref.ts` (extraído), `pedidos/ui/OrdersSearchField.tsx` (nuevo, con
  test), `OrdersControls`, `OrdersPagination`, `BuyerOrders`, `SellerOrders`, `pedidos/page.tsx`,
  `pedido/[id]/page.tsx`.
- **Catálogos:** `orders.items` (plural ICU) y `orders.buyerUnknown`, en `es.json` y `en.json`.
- **Pruebas:** `e2e/orders/ordersList.spec.ts` (nuevo), `orders.feature` (7 escenarios `@slice-6`),
  `placeOrder.spec.ts` (adaptado), `infra/test-utils/renderWithIntl.tsx`.

### Una corrección de paso: la zona horaria de las pruebas

`renderWithIntl` no fijaba `timeZone` y producción sí (`America/Mexico_City`, en `i18n/request.ts`).
Con `OrderCard` formateando fechas, next-intl empezó a avisar por consola y a formatear **en la zona
de la máquina**: una fecha afirmada en una prueba habría pasado en local y fallado en CI, que corre
en otra. Se alinea el ayudante con producción. No estaba en el roadmap; sale gratis y cierra una
fuente de intermitencia antes de que muerda.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` | limpio, exit 0 |
| `pnpm run typecheck:tests` | limpio, exit 0 |
| `pnpm run lint` | limpio (816 archivos), exit 0 |
| `pnpm run test:run` | **158 archivos, 1596 tests, verdes** |
| `pnpm run build` | compila; `/[locale]/pedidos` y `/[locale]/pedido/[id]` siguen dinámicas |

**Nada escrito en la base compartida:** ni migración, ni seeds, ni pedidos de prueba. Los cinco
pedidos reales se leyeron para decidir el diseño y para escribir los escenarios con datos que
existen; no se tocó ninguno.

### Pendiente declarado: la e2e

**No se corrió**, según lo acordado: la lanza el usuario. Los comandos, en orden de coste:

```
pnpm exec playwright test src/e2e/orders          # lo de este slice
pnpm exec playwright test --shard=1/2             # y la completa, en dos mitades
pnpm exec playwright test --shard=2/2
```

Lo que hay que mirar si algo sale rojo:

1. **`ordersList.spec.ts`** es nuevo (5 escenarios). Reclama `username` sobre la cuenta de la suite
   con prefijo `e2e-` y lo libera en el `afterEach`; el barrido de `testData.ts` lo cubre igual.
2. **`placeOrder.spec.ts`** cambió una línea: el último escenario pulsaba la tarjeta entera del
   comprador y ahora pulsa `buyer-order-link`. Es el único ajuste forzado por el rediseño.
3. Recordar que **la suite es floja en frío**: repetir antes de diagnosticar.

### Recap

`/pedidos` enseña ahora el mismo pedido desde los dos lados con una sola tarjeta: quien compró ve
qué pidió, cuánto de cada cosa, con su foto y su total, y llega al producto o al detalle desde ahí;
quien vende ve además a quién le está preparando el pedido, con enlace a su perfil. Y la búsqueda
filtra mientras se escribe sin dejar de funcionar con Enter ni sin JavaScript. Sin migración, sin
nada escrito en la base, y con la e2e pendiente de que la corra el usuario.

### Próximos pasos (opciones)

1. **Correr la e2e** con los comandos de arriba: es lo único que queda de este slice.
2. **`cardControls.spec.ts:39`**, con el diagnóstico ya hecho desde el slice 3: decidir cómo refresca
   el feed del inicio tras una mutación.
3. **El vendedor todavía no puede escribirle a quien le pidió.** Ahora que sabe quién es, el eslabón
   siguiente es el camino de vuelta —hoy la conversación sólo la abre el comprador—, y `users` no
   guarda teléfono: habría que decidir por dónde.
4. **El pago en línea**, cuando los pedidos digan que vale la pena.

---

## La fusión de los slices 5 y 6 (2026-08-15)

### Objetivo

Los dos slices de hoy se hicieron **en paralelo, en dos ramas que salieron del mismo commit**
(`5bd3660`), y los dos tocan los pedidos: uno por debajo —la compra de varias tiendas— y otro por
delante —la tarjeta y la búsqueda—. Al juntarlos, `git` dejó siete ficheros en conflicto y, lo que
importa más, dos decisiones que ninguno de los dos lados podía tomar solo.

### Los dos conflictos que no eran de texto

- **`listWhere` cambió por los dos lados a la vez, y por motivos distintos.** El slice 5 le añadió un
  parámetro de orden —`listByCheckout` lee una compra del más viejo al más nuevo, al revés que las
  listas—; el slice 6 le cambió el tipo de vuelta, porque la consulta empezó a traer también al
  comprador (`OrderWithParties`). No son alternativas: la firma buena lleva **las dos cosas**, y
  quedarse con cualquiera de los dos lados habría borrado en silencio una mitad de un slice.
- **Las dos ramas numeraron el pago en línea de forma distinta.** Cada una lo empujó un puesto por
  detrás de lo suyo, así que una lo dejó en `@slice-5 @future` y la otra en `@slice-6 @future` — y el
  roadmap acabó con **dos secciones llamadas «Slice 6»**, que es un conflicto que `git` no ve porque
  los títulos no se solapan línea a línea. Con los dos slices hechos, el pago es el **7**: en el
  `.feature`, en `pedidos.md` y en «Fuera de alcance». Sigue igual de condicionado que ayer; lo único
  que cambió es el número.

### Lo demás, por qué se resolvió así

- **Los dos catálogos**, `orders.buyerUnknown` junto a `orders.checkout*` y `orders.cartPending*`, en
  orden alfabético, que es como está el resto del fichero.
- **`order.ts`**: `checkoutTotal` y `orderItemCount` son funciones distintas que cayeron en la misma
  línea del final del archivo. Las dos se quedan, cada una con su docstring.
- **La bitácora es de sólo añadir**, así que las dos entradas se conservan enteras y en orden — no se
  refunden en una. Lo único que se les tocó son los punteros a «el siguiente slice», que apuntaban a
  un número que la fusión acaba de mover.
- **La ficha del pedido se fusionó sola y quedó bien**: `OrderBuyer` (quién lo pidió, sólo para el
  vendedor) y `CheckoutOrders` (la compra entera, sólo para el comprador) son bloques distintos con
  condiciones distintas. Se revisó a mano precisamente porque `git` no avisó de nada.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` / `typecheck:tests` | limpios, exit 0 |
| `pnpm run lint` | limpio (823 archivos), exit 0 |
| `pnpm run check:i18n` | limpio |
| `pnpm run test:run` | **159 archivos, 1613 tests, todos verdes** |
| `pnpm run build` | compila |

**Nada escrito en la base compartida:** la fusión no lleva migración ni seeds. Sigue en pie lo que
dejó el slice 5: la tienda `Panadería de prueba`, que se deshace con
`pnpm run seed:demo-seller -- --remove`.

### Pendiente declarado: la e2e

**No se corrió**, según lo acordado. Es lo que de verdad falta por comprobar de esta fusión, porque
los dos slices trajeron escenarios nuevos que nunca han corrido juntos:

```
pnpm exec playwright test src/e2e/orders          # los 19 del slice 5 + los 5 del 6
pnpm exec playwright test --shard=1/2             # y la completa, en dos mitades
pnpm exec playwright test --shard=2/2
```

Lo que hay que mirar si algo sale rojo:

1. **`multiSeller.spec.ts`** (slice 5) no toca `/pedidos`: trabaja sobre el carrito y la ficha, y sus
   `data-testid` no los movió el rediseño. Se comprobó uno a uno; si falla, será por otra cosa.
2. **`ordersList.spec.ts`** (slice 6) es el único que pulsa la tarjeta nueva.
3. La suite **es floja en frío**: repetir antes de diagnosticar.

### Recap

Las dos features conviven: la compra de varias tiendas —con su total, su checkout compartido y la
compra entera en la ficha— y la lista que se lee sin abrir nada —con el desglose, quién pidió y la
búsqueda al escribir—. La consulta que las dos se disputaban trae ahora el orden parametrizado *y*
las dos partes del pedido. El pago en línea pasa a ser el slice 7, sin cambiar de condición. Sin
migración y sin nada escrito en la base; falta la e2e, que la corre el usuario.

### Próximos pasos (opciones)

1. **Correr la e2e** con los comandos de arriba: es lo único pendiente de esta fusión.
2. **Cerrar el merge** y decidir si las dos ramas se borran.
3. **Borrar la tienda de prueba** cuando ya no haga falta: `pnpm run seed:demo-seller -- --remove`.
4. **`cardControls.spec.ts:39`** y **el `<main>` anidado en 21 rutas**, los dos con receta escrita en
   `docs/pendientes.md`.

**Pendiente del usuario:** correr la e2e y confirmar el commit de fusión.

---

## Slice 7 — Avisar a la tienda desde la lista (2026-08-15)

### Objetivo

Que el pedido se avise donde se ve, y no una pantalla más adentro.

### Lo que decidió el diseño: otra vez la base, no la intuición

La pregunta llegó como una mejora («ya que está el detalle, pon ahí el botón»). La consulta la
convirtió en un defecto medible: **de los 7 pedidos reales, 6 seguían `PENDING`, y el único que llegó
a `DELIVERED` es el más viejo de todos.** El botón de avisar existe desde el slice 2, pero sólo en
`/pedido/<id>` — una pantalla por la que se pasa **una vez**, justo después de confirmar. Quien no lo
pulsa en ese momento lo tiene después a dos clics, y el vendedor no se entera de que le compraron.

No se puede demostrar desde la base que esos 6 nunca se avisaran —el aviso no deja rastro, y ésa es
otra conclusión de este slice—, pero la forma de la distribución es la que es.

### Decisiones y por qué

- **Se avisa mientras el pedido siga ABIERTO, no sólo cuando esté `PENDING`.** `PENDING` era el
  candidato obvio: es el estado en que el vendedor ni lo ha visto. Pero `CONFIRMED` y `PREPARING`
  también son pedidos en los que alguien espera al otro lado —que es literalmente lo que significa
  `OPEN_STATUSES`, que ya existía y es lo que cuentan las pestañas—. Lo que cierra la puerta es que
  el pedido **deje de moverse**.
- **La regla es una función de dominio, `canNotifySeller`, y no un condicional repetido.** La
  preguntan tres pantallas. Que el mismo pedido ofrezca el botón en una y no en otra es la clase de
  incoherencia que hace dudar de si algo falló.
- **La ficha cambió de comportamiento**, y es la parte de este slice que no se pidió: ofrecía el
  botón a quien compró en *cualquier* estado, incluido un pedido entregado hace una semana. Ahora
  aplica la misma regla que la lista.
- **Un solo botón para las N tiendas de una compra no existe, y no es una limitación nuestra.**
  `wa.me` abre UNA conversación; disparar N serían N `window.open`, que el navegador bloquea a partir
  del primero. Y el obstáculo de fondo no es técnico: el mensaje de cada tienda lleva **sus**
  renglones y **su** total, así que uno común le contaría a cada una lo que se le compró a la otra —
  justo lo que evita el `user_id` en el `WHERE` de `listByCheckout`. La variante `wa.me/?text=` sin
  número (el selector de chats, que sí admite varios destinatarios) manda el mismo texto a todos, o
  sea exactamente ese problema. **Queda escrito en el `.feature` y en el docstring de
  `CheckoutOrders`**, para que la próxima vez que se pregunte la respuesta esté al lado del código.
- **Lo que sí se puede: que no haya que navegar.** El bloque «Esta compra tiene N pedidos» ya lista a
  las tiendas hermanas, así que cada renglón lleva su botón. Siguen siendo N toques, pero en una sola
  pantalla.
- **El pedido que se está mirando no repite el suyo en el bloque.** Ya lo tiene arriba, con su
  «falta un paso». El bloque ya trataba distinto a ese pedido —lo marca «(este)» y no se enlaza a sí
  mismo—; repetirle el botón habría puesto la misma acción dos veces en una pantalla.
- **`NotifySellerButton` recibe los textos como props en vez de leer el catálogo.** Es lo que le
  permite servir a los tres sitios: la lista es un componente de cliente y el bloque de la compra es
  uno de servidor asíncrono, y un componente con `useTranslations` no vale para los dos. Es el mismo
  criterio que ya obliga a `design_system` a no traducir.
- **En la tarjeta el botón no dice el nombre de la tienda** (`notifyShort`): está escrito arriba, en
  la misma tarjeta, y «Avisar a Panadería de prueba por WhatsApp» se desbordaba junto a «Ver el
  pedido» en pantallas estrechas. En la ficha se queda el largo, que es donde hay sitio.
- **`absoluteOrderUrl` se mudó a `infra/UI/mappers/`** — un movimiento, no una copia. Y se apoya en
  `PUBLIC_BASE_URL` y nunca en `window.location`, al revés que su vecina `createAbsoluteUrl`: ahora
  la calcula también el navegador, y con el origen del navegador el HTML del servidor y el de la
  hidratación no coincidirían.
- **Sin migración.**

### El defecto que apareció de paso: el mensaje que se mandaba al vendedor

El aviso se armaba con `intro: t("placedHint")`, y `placedHint` es el texto de **pantalla**: «Falta
un paso: avísale a la tienda por WhatsApp para que lo prepare». Es decir, el vendedor recibía por
WhatsApp una instrucción dirigida al comprador, encabezando su propio pedido. Nadie lo vio porque el
único escenario que miraba el enlace comprobaba el teléfono y el total, no el saludo.

Se separa en `noticeIntro` («Hola, te acabo de hacer un pedido:»), que es lo que el docstring de
`OrderNoticeLabels` decía que tenía que ser desde el principio. `placedHint` se queda donde le toca:
en la pantalla.

### Archivos tocados

- **Dominio:** `order/order.ts` (`canNotifySeller`) + su corrida de escritorio en `order.test.ts`.
- **Infra:** `UI/mappers/absoluteOrderUrl.ts` (mudado desde `pedido/[id]/page.tsx`).
- **Presentación:** `orders/NotifySellerButton/` (nuevo, con test).
- **Rutas:** `pedidos/ui/BuyerOrders.tsx`, `pedido/[id]/page.tsx` (la regla y la mudanza),
  `pedido/[id]/ui/CheckoutOrders.tsx` (botón por hermano + `locale`).
- **Catálogos:** `orders.noticeIntro` y `orders.notifyShort`, en `es.json` y `en.json`.
- **Specs:** `orders.feature` (8 escenarios `@slice-7`; el pago en línea pasa a `@slice-8`),
  `ordersList.spec.ts` (+2) y `multiSeller.spec.ts` (+1).
- **Docs:** `pedidos.md` (roadmap del slice 7 y «Fuera de alcance»).

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` / `typecheck:tests` | limpios, exit 0 |
| `pnpm run lint` | limpio (826 archivos), exit 0 |
| `pnpm run check:i18n` | limpio |
| `pnpm run test:run` | **160 archivos, 1628 tests, todos verdes** (+15 de este slice) |
| `pnpm run build` | compila |

**Nada escrito en la base compartida.** Se leyeron los 7 pedidos, sus renglones y las 4 tiendas para
decidir el diseño y escribir los escenarios con datos que existen; no se tocó ninguna fila.

### Pendiente declarado: la e2e

**No se corrió**, según lo acordado: la lanza el usuario.

```
pnpm exec playwright test src/e2e/orders          # lo de este slice
pnpm exec playwright test --shard=1/2             # y la completa, en dos mitades
pnpm exec playwright test --shard=2/2
```

Lo que hay que mirar si algo sale rojo:

1. **`ordersList.spec.ts`** trae dos escenarios nuevos. El de «ya no ofrece avisar» avanza el pedido
   hasta `DELIVERED` desde el panel del vendedor y **entra con `?estado=all` a propósito**: en la
   vista por omisión —los abiertos— el pedido desaparece de la lista justo antes de poder
   comprobarlo. Si falla ahí, es esto y no la funcionalidad.
2. **`multiSeller.spec.ts`** trae uno: los dos botones de una compra de dos tiendas.
3. La suite **es floja en frío**: repetir antes de diagnosticar.

### Recap

El pedido ya se avisa donde se ve: cada tarjeta de «Tus pedidos» lleva su botón de WhatsApp con el
desglose, el total y su dirección, y el bloque de la compra lleva el de cada tienda hermana, así que
una compra de varias tiendas se avisa entera desde una pantalla. Cuándo aparece lo decide una sola
regla del dominio —mientras el pedido siga abierto—, que aplican igual la lista, la ficha y el bloque.
De paso, el mensaje que le llega al vendedor dejó de ser la instrucción que se le da al comprador.
Sin migración y sin escribir nada en la base; falta la e2e.

### Próximos pasos (opciones)

1. **Correr la e2e** con los comandos de arriba: es lo único pendiente de este slice.
2. **Limpiar dos tiendas huérfanas** que dejó una corrida e2e que murió a medias:
   `E2E Panadería de Otro Estado 178681167862330` y `E2E Panadería del Pueblo 178681167862431`. No
   estorban a este slice, pero pueden hacer ruido en el `globalSetup` de la próxima corrida.
3. **Que el aviso deje rastro.** Hoy la tarjeta no puede decir «a ésta ya le avisaste» porque no hay
   dónde guardarlo: pide una columna, y el esquema lo manda Alembic desde el backend de Python. Es la
   continuación natural de este slice y la única que necesita una decisión fuera de este repo.
4. **`cardControls.spec.ts:39`** y **el `<main>` anidado en 21 rutas**, con receta en
   `docs/pendientes.md`.

**Pendiente del usuario:** correr la e2e, y decidir 2 y 3.

---

## Slice 8 — El pedido recuerda su recorrido (2026-08-16)

### Objetivo

Registrar la fecha y hora de cada paso del pedido, y decir cuándo se entregó.

### Lo que decidió el alcance: una pregunta, no dos

Se planteó como dos cosas —«fecha y hora de entrega» y «registrar cada paso»— y resultó ser una.
«Fecha de entrega» podía significar tres funciones muy distintas: cuándo la **quiere** el comprador
(un campo en el checkout), cuándo la **promete** el vendedor (un formulario al aceptar), o cuándo se
**entregó de verdad**. Preguntado, era la tercera — y ésa no necesita campo ni pantalla: es la marca
de tiempo del salto a `DELIVERED`.

Las otras dos se descartaron explícitamente. Media hora de conversación se ahorró semanas de
formularios que nadie había pedido.

### El defecto, con su prueba

El único pedido que se había movido de verdad, el del 10 de agosto: creado a la 01:58, `updated_at`
a las 03:25. De ahí sólo se deduce que tardó **1 h 27 min en total**. Cuándo se aceptó y cuándo
empezó a prepararse los pisó el `updated_at` del paso siguiente. El proceso que el slice 2 modeló
con cuidado no dejaba rastro de haber ocurrido.

### Decisiones y por qué

- **Dos fuentes, y cada una contesta lo suyo.** `updated_at` ya dice cuándo el pedido entró al
  estado en que está, así que para un `DELIVERED` **es** la fecha de entrega, exacta — y funciona
  **hacia atrás**, sin migración y sin backfill. La tabla nueva contesta lo que ninguna columna
  puede: dónde se fue el tiempo entre un paso y otro. Haber montado todo sobre la tabla habría
  dejado sin fecha justo al único pedido que ya estaba entregado.
- **Sólo transiciones: no hay fila de nacimiento.** `created_at` ya es «cuándo pasó a `PENDING`», y
  repetirlo sería una copia denormalizada — lo mismo que este roadmap rechazó al no crear una
  columna `total`. Consecuencia: `from_status` es `NOT NULL` y leer la tabla nunca obliga a
  interpretar un nulo.
- **La fila y el `UPDATE`, en la misma transacción.** `updateStatus` ya llevaba el estado de partida
  en el `WHERE`, así que sólo toca fila cuando el cambio es real: el intento de la segunda pestaña
  no escribe historia de algo que no pasó. Y si la fila no se pudiera escribir, el estado tampoco
  cambia — volvería a existir justo el agujero que este slice cierra.
- **`changed_at` lo pone la base con su `now()`**, no el proceso de Node. `created_at` y
  `updated_at` ya salen de ahí, y mezclar dos relojes en una línea de tiempo es cómo se acaba viendo
  un paso «antes» del anterior.
- **`changed_by` es la persona, no la tienda.** Hoy coinciden porque una tienda tiene un dueño; el
  día que haya dos manos encima, «¿quién canceló esto?» no se reconstruye hacia atrás. Nullable
  porque el pago y el bot moverán pedidos sin sesión detrás.
- **Sin backfill, y dicho en voz alta.** Del entregado sabemos cuándo terminó pero no por dónde
  pasó. Escribir un `PREPARING → DELIVERED` inventado sería fabricar datos en una base compartida
  para que una pantalla se vea completa. La ficha de un pedido sin recorrido lo explica en vez de
  disimularlo.
- **`closedAt` mira `CLOSED_STATUSES`, no `isFinal`.** Son listas parecidas que contestan preguntas
  distintas: `isFinal` dice que sí de `DRAFT` y `PAID` —hoy no tienen salidas— y ninguno de los dos
  es un pedido terminado. Usar `isFinal` habría puesto «entregado el…» sobre un pedido pagado el día
  que el pago exista.
- **El recorrido se lee sólo en la ficha** (`historyOf`), no en la consulta común. Las listas traen
  diez pedidos por página: meterlo dentro habría sido leer diez recorridos para tirar nueve.

### El efecto secundario que vale más que la pantalla

El slice del pago está condicionado, por escrito, a responder «cuántos se caen entre `PENDING` y
`DELIVERED`». Hoy esa pregunta no tenía respuesta posible — y no por falta de volumen, sino por
falta de historial. Ahora es una consulta. Es la primera vez que un slice de este roadmap desbloquea
a otro en vez de sólo precederlo.

### La migración, aplicada

`0039_2026-08-16_add_customer_order_status_changes.py`, encadenada desde `0038_2026_08_11`, en el
repo del bot. **Aplicada con `uv run alembic upgrade head`** con autorización explícita del usuario.

Verificado después: la tabla existe con sus 6 columnas, su `CHECK` (`from_status <> to_status`), sus
dos FK y su índice; `alembic_version` en `0039_2026_08_16`; y los pedidos existentes **intactos**.
Es aditiva: crea una tabla vacía y no toca ninguna fila. Para deshacerla,
`uv run alembic downgrade 0038_2026_08_11`, que la borra sin tocar nada más.

### Archivos tocados

- **Backend (bot):** `alembic/versions/0039_2026-08-16_add_customer_order_status_changes.py`.
- **Dominio:** `order/order.ts` (`updatedAt` en `Order`, `OrderStatusChange`, `closedAt`,
  `elapsedBetween`), `order/ports.ts` (`historyOf`, `changedBy` en `updateStatus`).
- **Infra:** `db/schema/orders.ts` (espejo), `PostgresOrderRepository` (transacción, `historyOf`,
  `updated_at` en la consulta común).
- **Caso de uso:** `advanceOrderUseCase` pasa quién movió el pedido; `orderActions` lo saca de la
  sesión.
- **Presentación:** `orders/OrderClosedOn/` y `orders/OrderHistory/` (nuevos, con test), `OrderCard`
  y `pedido/[id]/page.tsx` los pintan.
- **Catálogos:** 9 claves nuevas en `es.json` y `en.json`.
- **Pruebas:** `e2e/orders/orderHistory.spec.ts` (nuevo), `orders.feature` (7 escenarios
  `@slice-8`), y los fixtures de cinco tests que ganaron `updatedAt` / `historyOf`.

### El fallo que salió en la e2e y no era de este slice

Los 7 escenarios de `ordersList.spec.ts` fallaban **en el `beforeEach`**, antes de abrir el
navegador: `duplicate key value violates unique constraint "ix_sellers_phone"`.

No era un residuo de una corrida caída. `sellers.phone` es **único en toda la tabla**, y el número
que usaba ese spec (`2789990088`) se lo había quedado `src/scripts/seedDemoSeller.ts` al sembrar
«Panadería de prueba», la segunda tienda permanente del slice 7. Dos cosas escritas con semanas de
diferencia eligieron el mismo teléfono de mentira, y la unicidad las puso a competir.

Se cambió el del spec a `2789990111`, con el porqué escrito al lado. **Vale la pena recordarlo**: un
teléfono de prueba no es un dato local de su archivo, es una clave única compartida por todo el
repositorio.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` / `typecheck:tests` | limpios, exit 0 |
| `pnpm run lint` | limpio (831 archivos), exit 0 |
| `pnpm run test:run` | **162 archivos, 1651 tests, verdes** |
| `pnpm run build` | compila en 25.7 s |
| `playwright test src/e2e/orders` | **31/31**, incluidos los 4 del histórico |
| `playwright test --shard=1/2` | **147 pasados, 3 saltados, 0 fallos** |
| La otra mitad, por directorios | `sellerStore` 33, `seo` 39, `ubicacionFresca`+`pilares` 27, el resto 28 — **todo verde** |

**La suite entera, en verde.** La base quedó sin residuos: 0 tiendas, 0 publicaciones y 0 direcciones
personales con prefijo `e2e-`, y los 12 pedidos reales intactos. `customer_order_status_changes`
volvió a 0 filas porque las que escribió la suite colgaban de pedidos de prueba y se fueron con
ellos por cascada — que es exactamente lo que la FK promete.

### Por qué la segunda mitad se corrió por directorios

`--shard=2/2` no llegó al final dos veces seguidas, por dos motivos distintos y vale la pena
separarlos:

1. **La primera vez, sin RAM.** 95 escenarios en rojo con `worker process exited unexpectedly
   (code=3221225794)`, precedidos de un `browserContext.newPage: Target crashed`. Ninguno era un
   fallo de código. El disparador estaba a la vista: el shard anterior había dejado **un servidor de
   dev huérfano con 5,1 GB** aferrado al puerto 3000. Matar los huérfanos entre corridas quitó los
   crashes por completo.
2. **La segunda, por duración.** Sin un solo crash, pero cortada en el test 38 de 75: media suite
   pasa del límite de una tarea en segundo plano.

Partirla por directorios arregla las dos cosas a la vez —cada lote arranca con la memoria limpia y
dura entre 1,5 y 3 min— y de paso el resultado se lee por área en vez de como un número único.
**El paso que de verdad importa es matar el servidor de dev entre lote y lote**; sin eso, el
siguiente arranca con varios GB ya comprometidos.

### Recap

Un pedido ya no olvida por dónde pasó. Cada transición deja su fila —en la misma transacción que el
cambio, así que no puede haber una sin la otra—, la ficha enseña el recorrido con lo que tardó cada
paso, y la lista y la ficha dicen cuándo se entregó o se canceló. Los pedidos anteriores a la
migración siguen diciendo su fecha de cierre, porque sale de `updated_at`, y explican que no tienen
recorrido en vez de fingir uno. La migración está aplicada sobre la base compartida.

### Pendiente en el repo del bot

La migración **está aplicada** pero su archivo **quedó sin commitear**, y a propósito. El backend
está en la rama `feat/retos-atomicos` y su `0038_2026-08-11_allow_concurrent_habit_rituals.py`
—que es el `down_revision` de la mía— **también está sin trackear** ahí. Commitear la `0039` sola
dejaría en el historial una migración que encadena desde una revisión que no existe en el
repositorio. Y commitear la `0038` ajena, en una rama de otro trabajo, no es de este slice.

Lo que hay que hacer, en este orden: commitear primero la `0038` en su rama, y después la `0039`.

### Próximos pasos (opciones)

1. **La primera consulta que ya se puede hacer:** cuántos pedidos se caen entre `PENDING` y
   `DELIVERED`, y cuánto tarda la tienda en aceptar. Es la pregunta que condiciona el pago en línea,
   y ahora tiene respuesta.
2. **Enseñarle al vendedor cuánto lleva esperando un pedido** («Pendiente desde hace 3 días») en su
   lista. El dato ya está y hoy no se usa: 6 de los pedidos reales llevan semanas sin que nadie los
   toque.
3. **`cardControls.spec.ts:39`**, con el diagnóstico hecho desde el slice 3.
4. **Slice 9 — pago en línea**, cuando los números del punto 1 lo justifiquen.
