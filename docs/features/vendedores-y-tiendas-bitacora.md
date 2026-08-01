# Bitácora — Vendedores y tiendas

Registro append-only. Narra el **por qué**; el qué está en `git log`.

---

## Slice 1 — Conviértete en vendedor y tu tienda queda en línea (2026-07-31)

### Objetivo

Que cualquier usuario registrado pueda declararse vendedor desde su cuenta y quedar con una página
pública donde se lista lo que publica. Es el cuello de botella para vender: sin vendedor no hay
tienda, y sin tienda no hay a dónde mandar al comprador.

### Decisiones y por qué

**La raíz no se tocó; las tiendas viven en `/tienda/<handle>`.** La idea inicial era
`hazlosano.com/<nombre_de_tienda>`, pero la raíz ya es de las publicaciones
(`src/app/[locale]/[slug]/page.tsx` con `localePrefix: "as-needed"`): `hazlosano.com/jugo-verde` es
hoy un producto. Compartir la raíz obligaba a un namespace único entre tiendas, usuarios y los slugs
de las 24 publicaciones existentes — y a arreglar antes que **los slugs de publicación ni siquiera
se deduplican entre sí** (`createOnePostUseCase.defineSlug` solo llama a `createUniqueSlug` cuando
el slug llega escrito, y `/publicar` lo manda vacío). Con prefijo, cada namespace es independiente y
la unicidad la garantiza un índice único por tabla. Se consultó y se eligió esta opción.

**No se creó ninguna tabla.** `sellers` ya existía con `name`, `phone`, `logo_url`, `description`,
`url`, `has_membership`, `has_paid_ads` y `user_id`; le faltaba **solo** un nombre para la URL. La
migración `0027` agrega `sellers.slug` y `users.username`, ambas nullable y con índice único.

**`users.username` se agregó sin usarse todavía.** Se ocupa hasta el slice 4 (`/u/<username>`), pero
una migración sobre la base compartida es la operación cara y arriesgada de esta feature: dos
migraciones son dos veces el riesgo para una columna nullable. Va documentado en la propia migración.

**El único dato que se escribió fue `slug = 'hazlo-sano'`** en la fila que ya existía. Con eso,
`/tienda/hazlo-sano` lista los 13 productos que ya traían `seller_id` sin migrar nada.

**`sellers.user_id` de Hazlo Sano se dejó en `NULL` a propósito.** Vincular esa tienda a una cuenta
decide quién la administra, y los 13 productos los publicó `jaime.cervantes.ve@gmail.com`, que no
está en `HAZLO_SANO_ADMIN_EMAILS`. La página pública no lo necesita (se resuelve por `slug`), así que
se dejó como decisión tuya en vez de tomarla por ti.

**Lo esperado se devuelve, lo inesperado se propaga.** El caso de uso convierte en `errorMessage` los
seis motivos por los que un alta legítima no procede, y deja subir cualquier otra excepción. Dos de
esos motivos existen para **proteger índices únicos que ya estaban en la base** (`sellers.slug` y
`sellers.phone`): sin la comprobación previa, el vendedor vería un 500 con un mensaje de Postgres.

**El teléfono se normaliza a 10 dígitos antes de consultar.** Sin eso, `+52 278 112 6948` y
`2781126948` serían dos tiendas distintas con el mismo número y el mensaje "ya está registrado" no
aparecería nunca. Los 10 dígitos son el formato con que la fila existente guarda su teléfono.

**`posts.seller_id` se sella al publicar**, no se deduce después por `user_id`: deducirlo costaría
una consulta en cada lectura y se rompería el día que una tienda tenga más de un dueño.

**`sellers.category` lo escribe el repositorio, no el formulario.** Es `NOT NULL` y pertenece a la
taxonomía del chatbot (`'Food'`), ajena a la tabla `categories` del sitio. Es una exigencia del
esquema heredado, no una decisión que valga la pena hacerle tomar al vendedor.

**De paso se arregló el defecto de media** que estaba en `docs/pendientes.md`: `MediaContent` recibía
`undefined` y `DefaultContent` leía `media.url`, tumbando el listado con un 500. Entraba en el slice
porque el catálogo de la tienda pinta las mismas tarjetas. Ahora degrada a un marcador.

**El barrido e2e pasó a preguntar `hasTestData()`** en vez de comparar campo por campo: al agregar
`sellers` al conteo, `globalTeardown` habría seguido mirando solo dos de las tres columnas.

### Archivos tocados

- **Backend Python (`bot-whatsapp/backend`):** `alembic/versions/0027_2026-07-31_add_seller_slug_and_user_username.py`; espejo en `app/infrastructure/db/models/{seller,user}.py`.
- **Dominio:** `src/domain/shared/slugify.ts` (extraído de `PostEntity`, que ahora delega); `src/domain/entities/seller/{handle,phone,types,errors}.ts` + sus pruebas.
- **Caso de uso:** `src/use_cases/becomeSeller/` (`becomeSellerUseCase.ts`, `ports/ISellerRepository.ts`, prueba).
- **Infra:** `src/infra/dataAccess/db/schema/sellers.ts` (espejo Drizzle); `src/infra/dataAccess/sellers/` (repositorio + factory); `getPostsBySeller` en `PostgresPostQueryRepository`; `sellerId` en el DTO de creación y en el `INSERT`.
- **App:** `src/app/[locale]/cuenta/` (página, acción, `storePath`, `ui/BecomeSellerForm`, `ui/StoreCard`); `src/app/[locale]/tienda/[slug]/` (página, paginada, `data.ts`, `metadata.ts`, `ui/StoreHeader`, `ui/StoreCatalog`); `publicar/actions.ts` sella la tienda; `Header` enlaza a `/cuenta`.
- **UI compartida:** `MediaContent` degrada sin media (+ prueba).
- **e2e:** `src/e2e/sellerStore/` (feature, spec, dos page objects); `testUtils/{testSlug,testData,deleteTestSeller}.ts`; `globalSetup`/`globalTeardown` usan `hasTestData`; `PublishProductPage.origin` pasó a opcional (un vendedor cualquiera no ve ese selector).

### Comandos

```sh
# backend (base compartida)
PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe -m alembic upgrade head

# web
pnpm run typecheck && pnpm run lint && pnpm run test:run
pnpm exec playwright test src/e2e/sellerStore --reporter=list
pnpm run test:e2e:run
```

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio (tras `pnpm run format`, 8 archivos) |
| `pnpm run test:run` | **337 pruebas en 38 archivos**, todas verdes (+44 nuevas) |
| `pnpm run test:e2e:run` | **35 escenarios pasados, 3 saltados, 0 fallidos** (antes: 27 + 3) |
| `alembic current` | `0027_2026_07_31` |

Estado de la base al cerrar: 1 vendedor (`hazlo-sano`), 24 publicaciones (13 con tienda), **0
residuos `e2e-`**. El `globalTeardown` habría fallado la suite si hubiera quedado algo.

### Lo que se escribió en la base compartida y cómo deshacerlo

1. **Migración `0027`** (dos columnas nullable + dos índices únicos). Se deshace con
   `alembic downgrade 0026_2026_07_28`.
2. **`UPDATE sellers SET slug = 'hazlo-sano'`** sobre la única fila existente. El `downgrade` se
   lleva la columna entera.
3. Durante la suite e2e se crearon y borraron tiendas y publicaciones con prefijo `e2e-`. No quedó
   ninguna (verificado por consulta).

### Desviaciones del roadmap

- El `Scenario Outline` de rechazos se partió en dos: las dos filas de **unicidad** (que protegen
  índices de la base) se prueban por Playwright; las dos de **forma** (`required`, `pattern`) por
  Vitest sobre el caso de uso, porque el navegador ni siquiera deja enviar el formulario y por
  Playwright nunca llegarían al servidor. La regla se prueba igual: un request armado a mano sí llega.
- Se agregó la ruta paginada `/tienda/[slug]/page/[page]`, que no estaba escrita en el slice. Era
  obligatoria: con `NEXT_PUBLIC_PAGINATION_PAGE_SIZE=8`, los 13 productos de Hazlo Sano ya paginan y
  la página 2 habría sido un 404.

### Pendientes que deja

- Decidir a qué cuenta se vincula la tienda "Hazlo Sano" (`sellers.user_id`), y si esa cuenta debe
  ser la de un admin.
- El logo y la web de la tienda no se piden en el alta (las columnas existen y se leen). Falta
  editar la ficha de la tienda; entra natural con el slice 5.
- `users.username` está creado y sin uso hasta el slice 4.

### Recap

El slice 1 está entregado y verde: cualquier usuario registrado abre su tienda desde `/cuenta` con
nombre y teléfono, obtiene `hazlosano.com/tienda/<su-nombre>` y todo lo que publique desde entonces
queda en ese catálogo; `/tienda/hazlo-sano` ya funciona con los 13 productos que había, sin migrar
datos. La base compartida quedó en `0027`, con dos columnas nuevas nullable y sin residuos de
prueba. Vender todavía significa "aquí está el teléfono": el botón de WhatsApp es el slice 2.

### Próximos pasos (opciones)

1. **Slice 2 — Pedir por WhatsApp.** Lo más barato que convierte una visita en venta: un botón con
   el mensaje ya escrito (producto, precio, enlace) en el detalle y en la tienda. `legacyWhatsapp`
   ya normaliza el número; es casi todo UI.
2. **Slice 3 — Sucursales con ubicación.** Lo que hace que **te encuentren**: sin
   `branches.location` el bot no puede recomendar por cercanía aunque el cliente esté a dos calles.
   Es el slice más grande de los tres (extraer coordenadas del link de Maps + resolver el redirect
   de `maps.app.goo.gl`).
3. **Slice 5 adelantado — marcar agotado.** `posts.is_available` existe y no tiene UI: hoy nadie
   puede dejar de ofrecer lo que se le acabó y el bot lo sigue recomendando. Es pequeño y quita una
   molestia real en cuanto haya vendedores de verdad.

**Acciones pendientes de tu parte:**

- Decidir la cuenta dueña de la tienda "Hazlo Sano" (ver arriba).
- Commitear: el trabajo está **sin commitear** en dos repositorios (`comida-justa` y
  `bot-whatsapp/backend`, este último con la migración que ya se aplicó a la base).
- Revisar el plan de Vercel antes de promocionar tiendas de terceros: el Hobby es para uso no
  comercial y el sitio va a vender.

---

## Slice 2 — Pedir por WhatsApp (2026-07-31)

### Objetivo

Que la página deje de ser un escaparate y sea un camino de venta: un botón que abre WhatsApp con el
mensaje ya escrito. Hasta ahora el detalle solo ofrecía un `tel:`, que en un teléfono con WhatsApp
es el camino más largo hacia la misma conversación.

### Decisiones y por qué

**El respaldo al teléfono de la tienda se cayó, y por dato, no por pereza.** El roadmap decía
`contact_whatsapp` → teléfono de la tienda. Consultando la base antes de escribir el código: **las
24 publicaciones tienen `contact_phone`** y 13 tienen `contact_whatsapp`. Ese tercer nivel nunca se
ejecutaría con los datos que existen, y habría costado un JOIN a `sellers` en el detalle para una
rama muerta. Quedó `contact_whatsapp` → `contact_phone`, que cubre el 100% del catálogo actual.

**"Sin número no hay botón" vive en un solo lugar.** `whatsappLink` devuelve `null` y
`WhatsappButton` no pinta nada cuando lo recibe. Así la regla no se repite en cada pantalla, que es
justo donde se olvidaría.

**La normalización se compartió en vez de duplicarse.** `legacyWhatsapp` ya sabía poner la lada
mexicana; ahora delega en `toWhatsappNumber` (`src/domain/shared/whatsappLink.ts`), el mismo camino
que usa el botón. La base guarda las dos formas —`contact_phone` a 10 dígitos y `contact_whatsapp`
ya con el `52` desde la migración del catálogo—, y unificarlas en un solo lugar evita que se
separen. Mismo criterio que `slugify` en el slice 1.

**El mensaje lleva el enlace, no solo el título.** Del otro lado hay una persona atendiendo varias
conversaciones a la vez: "Pan de masa madre" no le dice cuál de sus tres panes le están pidiendo.

**Pedido y contacto son dos intenciones distintas.** En el detalle se pide un producto concreto
(`buildWhatsappOrderLink`); en la tienda todavía se está preguntando
(`buildWhatsappStoreLink`), y nombrar un producto que el comprador no eligió sería ruido. Por eso
son dos funciones y dos textos, no un parámetro opcional.

**El botón solo sale en `kind = producto`.** Un anuncio no tiene nada que encargar.

### Archivos tocados

- **Dominio:** `src/domain/shared/whatsappLink.ts` (+ prueba); `src/domain/entities/post/whatsappOrder.ts` (+ prueba); `src/domain/entities/seller/whatsappContact.ts`; `legacyCatalog.ts` delega la normalización.
- **UI:** `src/infra/UI/components/WhatsappButton/` (+ prueba).
- **App:** `PostDetail` arma el pedido y recibe el `slug` de la ruta; `StoreHeader` arma el contacto de la tienda.
- **e2e:** `src/e2e/sellerStore/whatsappOrder.spec.ts`; escenarios del slice 2 detallados en `sellerStore.feature`.

### Comandos

```sh
pnpm run typecheck && pnpm run lint && pnpm run test:run
pnpm exec playwright test src/e2e/sellerStore --reporter=list
pnpm run test:e2e:run
```

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run test:run` | **356 pruebas en 41 archivos**, todas verdes (+19) |
| `playwright test src/e2e/sellerStore` | **11 escenarios verdes** (8 del slice 1 + 3 del slice 2) |
| `pnpm run test:e2e:run` | **38 escenarios pasados, 3 saltados, 0 fallidos** |

Dos de los tres escenarios nuevos corren **contra datos reales** (`Jugo Verde` a $40 con su WhatsApp,
y la tienda `hazlo-sano`): no siembran nada, así que tampoco tienen nada que limpiar. El tercero
siembra un anuncio con prefijo `e2e-` y lo borra en su `afterEach`.

### Desviaciones del roadmap

- El respaldo al teléfono de la tienda no se implementó (ver arriba). El criterio 2 se reescribió en
  el roadmap para decir lo que el código hace y por qué.

### Pendientes que deja

- La tarjeta del listado no lleva botón de WhatsApp; hoy hay que entrar al detalle. Se dejó fuera
  para no meter ruido en cada rejilla del sitio (feed, `/productos`, tienda), pero para la tienda
  podría valer la pena y es barato.
- El mensaje va siempre en español, como el resto del contenido.

### Recap

Vender ya es un botón: en el detalle de un producto, "Pedir por WhatsApp" abre la conversación con
el título, el precio y el enlace ya escritos; en la tienda, "Escribir por WhatsApp" hace lo mismo sin
elegir producto. El número sale del WhatsApp de la publicación o, si falta, de su teléfono, y cuando
no hay ninguno simplemente no se pinta el botón. Con el slice 1, el camino completo existe: el
vendedor se da de alta, publica, y su cliente le escribe desde la página. Falta que lo **encuentren**
por cercanía, que es el slice 3.

### Próximos pasos (opciones)

1. **Slice 3 — Sucursales con ubicación.** El siguiente cuello de botella real: sin
   `branches.location` el bot solo recomienda en el fallback sin geo. Requiere extraer coordenadas
   del link de Google Maps (resolviendo el redirect de `maps.app.goo.gl`) y "usar mi ubicación
   actual" como alternativa.
2. **Botón de WhatsApp en las tarjetas de la tienda.** Pequeño; acorta el camino a la venta en el
   listado que sí es comercial, sin tocar el feed general.
3. **Slice 5 adelantado — marcar agotado.** `posts.is_available` sigue sin UI: se puede pedir por
   WhatsApp algo que ya se acabó, y el bot lo sigue recomendando. Ahora que hay botón de pedido,
   esto pesa más que antes.

**Acciones pendientes de tu parte:**

- **Vincular la tienda "Hazlo Sano" a la cuenta de `jaime.cervantes.ve@gmail.com`**: el `UPDATE` lo
  bloqueó el clasificador de permisos por ser escritura sobre la base compartida. Es una sola
  sentencia: `UPDATE sellers SET user_id = (SELECT id FROM users WHERE email =
  'jaime.cervantes.ve@gmail.com') WHERE slug = 'hazlo-sano';`
- Revisar el plan de Vercel antes de promocionar tiendas de terceros.
