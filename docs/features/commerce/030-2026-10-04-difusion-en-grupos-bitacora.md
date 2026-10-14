# Bitácora — Difusión en grupos de Facebook

> Append-only. Roadmap: `030-2026-10-04-difusion-en-grupos.md`. Escenarios:
> `src/e2e/outreach/difusionEnGrupos.feature`.

## 2026-10-13 — Slice 1: la publicación para grupos normales (código listo, e2e pendiente de la migración)

### Objetivo

Que el administrador escriba una vez el texto de cada línea de productos («Masa madre») y, al
abrirlo, obtenga el texto listo para pegar en un grupo normal, con la lista de precios armada en
ese momento con lo disponible, el aviso de lo que quedó fuera y un botón «Copiar».

### Decisiones y por qué

- **Nada se publica solo.** Facebook cerró su API de grupos en 2024 y la única alternativa es un
  robot de navegador que va contra sus condiciones. La app prepara y la persona da el clic; el
  roadmap lo explica y el `.feature` lo deja escrito en su contexto.
- **La lista no se guarda: se arma en cada lectura** (`GetOutreachKitUseCase`). Un texto armado al
  guardar anunciaría días después el precio y las existencias de ese día. `outreach_text_items`
  guarda solo qué producto va, con qué etiqueta, emoji y orden.
- **Motivos para quedar fuera, en un solo archivo y con precedencia**
  (`src/domain/outreach/exclusionReasons.ts`): no publicado → agotado → no disponible → sin
  precio. Gana la causa que hay que arreglar primero: un pan en revisión no aparece aunque se
  reponga.
- **«Agotado» reutiliza `isOutOfStock`** del núcleo, y la visibilidad, `isPubliclyVisible`: la
  regla de qué se anuncia no se reescribe, se consulta.
- **El renglón lleva el primer emoji que aparezca** entre los productos de ese precio, no el del
  primero a secas. Es menos sorprendente cuando el primero no tiene emoji, y está en la corrida de
  escritorio del `.feature`.
- **`\r\n` → `\n` al guardar y al componer.** Un `<textarea>` envía CRLF por especificación, y los
  textos que vinieron del bot traen `\r` sueltos (visto en `post_translations.content` de los panes).
  Sin esto, lo copiado no sería idéntico a lo que se ve.
- **Validación con códigos, no con frases.** El dominio devuelve `"required"` y la acción lo
  traduce con el catálogo del idioma de quien llena el formulario. Se valida *antes* de limpiar el
  borrador para que los avisos caigan en la posición correcta del formulario.
- **El buscador del formulario filtra en el navegador**, sin acentos (`arandanos` encuentra
  `arándanos`). Ofrece solo lo publicado que se vende (`SELLABLE_KINDS`): lo bajado no se puede
  anunciar. Un Enter en el buscador no envía el formulario.
- **Los productos viajan como JSON en un campo oculto**, porque su orden es el dato. Lo que no
  tenga la forma esperada se descarta: solo llega así una petición armada a mano.
- **El guardián de `publishedPosts.test.ts`** exige que toda lectura de `posts` filtre lo no
  publicado. `PostgresOutreachTextRepository` entra en su lista de excepciones con motivo escrito:
  existe para decir que un pan quedó fuera *porque* se bajó. El buscador sí filtra.
- **Espejo Drizzle escrito a partir del archivo de la `0060`**, que ya existe en `hazlo-sano-bot`
  (lo que pide `AGENTS.md`: «after the migration exists there»), pero **todavía no comprobado
  contra la base**: la migración no está aplicada. Se comprueba contra `information_schema` antes
  de hacer commit.
- **El barrido final sabe de los textos de prueba** (prefijo `E2E ` en el nombre interno, nunca
  publicado) y **pregunta antes si la tabla existe** (`to_regclass`): sin esa guarda, mientras la
  `0060` no esté aplicada, el `globalTeardown` tumbaría cualquier corrida de e2e, de esta feature o
  de cualquier otra.

### Archivos tocados

- **Migración (otro repo):** `hazlo-sano-bot/alembic/versions/0060_2026-10-13_add_outreach_texts.py`,
  rama `feat/outreach-texts`, sin commit y **sin aplicar**.
- **Dominio** `src/domain/outreach/`: `exclusionReasons.ts`, `priceList.ts`, `outreachText.ts`,
  `outreachTextDraft.ts`, sus pruebas y `__fixtures__/listedProduct.ts`.
- **Casos de uso** `src/use_cases/outreach/`: `saveOutreachTextUseCase.ts`,
  `getOutreachKitUseCase.ts`, `listOutreachTextsUseCase.ts`, puertos, pruebas y
  `__fakes__/InMemoryOutreachTextRepository.ts`.
- **Infra:** `db/schema/outreach.ts` (espejo), `dataAccess/outreach/` (repositorio, buscador y
  fábrica), excepción en `db/publishedPosts.test.ts`.
- **App** `src/app/[locale]/admin/difusion/`: lista, `nueva`, `[id]` (kit), `[id]/editar`,
  `actions.ts`, `adminGate.ts`, `ui/` (formulario, buscador, renglón) y `[id]/ui/` (copiar, fuera de
  la lista), con pruebas de la acción y del formulario.
- **Rutas y textos:** `src/i18n/routing.ts` (`/admin/difusion` ↔ `/en/admin/outreach`), namespace
  `outreach` y `nav.outreach` en `es.json`/`en.json`.
- **Menú:** entrada «Difusión en grupos» en `UserMenu` y `MobileNav` (este último con `flex-wrap`,
  porque tres enlaces ya no caben en un renglón de teléfono).
- **E2E:** `src/e2e/outreach/` (spec, página, datos de masa madre), `testUtils/outreachTexts.ts`,
  `testUtils/seedPrice.ts`, prefijo en `testSlug.ts`, barrido en `testData.ts`, rutas en
  `warmRoutes.ts`.

### Comandos clave

```sh
# hazlo-sano-bot
uv run ruff check alembic/versions/0060_2026-10-13_add_outreach_texts.py
uv run ruff format --check alembic/versions/0060_2026-10-13_add_outreach_texts.py
uv run alembic heads
uv run alembic upgrade 0059_2026_09_26:0060_2026_10_13 --sql     # modo offline, no conecta
uv run alembic downgrade 0060_2026_10_13:0059_2026_09_26 --sql

# comida-justa
pnpm exec vitest run src/domain/outreach src/use_cases/outreach "src/app/[locale]/admin/difusion"
pnpm run test:run
pnpm run typecheck
pnpm run typecheck:tests
pnpm run lint
pnpm run check:i18n
pnpm run check:directives
pnpm exec playwright test src/e2e/outreach --list
```

### Resultados

- **Migración:** ruff limpio, `0060_2026_10_13 (head)` como única cabeza; el SQL offline crea las
  dos tablas, el `UNIQUE` y el índice tal como pide el roadmap, y el `downgrade` los quita en orden
  inverso. La base compartida sigue en `0059_2026_09_26` (leído con un `SELECT` de
  `alembic_version`) y **no tiene** tablas `outreach_*`.
- **Vitest:** 44 pruebas del dominio y los casos de uso, 14 de la acción y el formulario, 2 del
  marcador de prueba, y la suite completa en verde: **307 archivos, 3 271 pruebas**.
- **`typecheck` y `lint`:** limpios.
- **`typecheck:tests` y `check:i18n`:** fallan, **pero por errores que ya estaban** y en archivos
  que este slice no toca: `src/domain/order/delivery.test.ts:217`,
  `src/use_cases/placeOrder/placeOrderUseCase.test.ts:62` y dos `console.error` sin marca en
  `src/app/[locale]/publishPracticeDayPost.ts`. Ninguno nombra código de difusión.
- **`check:directives`:** limpio.
- **Playwright:** los 7 escenarios del slice están escritos y listados, **sin ejecutar**: se saltan
  solos mientras `outreach_texts` no exista. Queda como validación pendiente.

### Desviaciones del roadmap

- Se añadió un aviso de «no se pudo guardar» para cuando la base rechaza la escritura (un producto
  borrado mientras el formulario estaba abierto choca contra su llave foránea).
- El buscador ofrece solo lo publicado; el roadmap no lo decía.
- El espejo se escribió antes de aplicar la migración (ver Decisiones); el commit espera a
  comprobarlo contra la base.

### Seguimientos

- Aplicar la `0060` y correr el e2e del slice (`rm -rf .next` antes; comprobar que no haya
  `next dev` en el 3000).
- Comprobar el espejo contra `information_schema.columns` de `outreach_texts` y
  `outreach_text_items`.
- Commits semánticos en los dos repos cuando el e2e esté verde.

### Recap

El slice 1 está escrito de punta a punta —dominio, casos de uso, base, pantallas, menú, textos en
dos idiomas y e2e— y todo lo que no necesita las tablas nuevas está en verde. Falta una sola cosa
que no se puede hacer desde aquí sin permiso: aplicar la migración `0060` en la base compartida.
Hasta entonces, `/admin/difusion` respondería con error para el admin, y nada de esto está en un
commit.

### Próximos pasos (opciones)

1. **Aplicar la `0060`** (`uv run alembic upgrade head` en `hazlo-sano-bot`, que apunta a la base
   compartida de Supabase), o autorizarme a hacerlo. Después: comprobar el espejo, correr el e2e y
   hacer los commits.
2. **Dar de alta** Integral, Ajo, Dátiles con Nuez y Queso Parmesano con Aceitunas si se siguen
   vendiendo: con la lista generada, lo que no está en la base no se anuncia.
3. **Slice 2** (sin migración): artículos de compraventa por producto —título, precio y descripción
   con su propio «Copiar»— y las fotos de cada pan.
4. Para el slice 3: reunir las URLs de los grupos, su tipo y cada cuánto aceptan publicaciones.

## 2026-10-13 — Slice 1: la migración aplicada y el e2e en verde

### Objetivo

Cerrar lo que quedó pendiente en la entrada anterior: aplicar la `0060`, comprobar el espejo contra
la base real y correr el e2e del slice.

### Decisiones y por qué

- **La `0060` la aplicó el agente, con autorización explícita del usuario** («sí, dale, córrelas
  tú»). Antes se comprobó que fuera la única pendiente: `alembic current` daba `0059_2026_09_26` y
  `alembic heads`, `0060_2026_10_13`.
- **El espejo coincide con la base** columna por columna (tipo, nulos, valores por omisión), en el
  `UNIQUE` con su nombre, en las dos llaves foráneas con `ON DELETE CASCADE` y en el índice de
  `post_id`. Leído de `information_schema.columns`, `pg_constraint` y `pg_indexes`.
- **La prueba de «Copiar» se corrigió, no la app.** En Windows, `navigator.clipboard.readText()`
  devuelve `\r\n` aunque se haya escrito `\n`: el portapapeles del sistema guarda así el texto. La
  prueba comparaba un detalle del sistema operativo; ahora normaliza los saltos al leer, con el
  motivo escrito en `OutreachAdmin.readClipboard`. Al pegar en Facebook da igual.

### Comandos clave

```sh
# hazlo-sano-bot
uv run alembic current          # 0059_2026_09_26
uv run alembic upgrade head     # 0059_2026_09_26 -> 0060_2026_10_13
uv run alembic current          # 0060_2026_10_13 (head)

# comida-justa (puerto 3000 libre comprobado antes de cada corrida)
rm -rf .next && pnpm exec playwright test src/e2e/outreach --reporter=line
```

### Resultados

- **Primera corrida: 6 de 7.** Falló «Copiar deja el texto listo para pegar en Facebook» por los
  `\r\n` del portapapeles de Windows (ver Decisiones).
- **Segunda corrida: 7 de 7 en 3.2 min**, con las 30 rutas calientes en 88 s. El `globalTeardown`
  no encontró residuos: ni textos `E2E `, ni panes sembrados.

### Escrito en recursos compartidos

- **Base compartida de Supabase:** la `0060` creó `outreach_texts` y `outreach_text_items`
  (vacías). Se deshace con `uv run alembic downgrade 0059_2026_09_26` en `hazlo-sano-bot`, que las
  borra con lo que tengan.
- **Datos de prueba:** cada escenario sembró sus panes `E2E …` en «Hazlo Sano» y textos `E2E Masa
  madre …`, y los borró al terminar.

### Desviaciones del roadmap

Ninguna nueva.

### Seguimientos

- La rama `feat/outreach-texts` de `hazlo-sano-bot` tiene el commit de la `0060` **sin empujar ni
  integrar a `main`**. Mientras no llegue a `main`, un `alembic current` o `upgrade` desde `main`
  fallará con «Can't locate revision 0060_2026_10_13», porque la base ya va en ella.

### Recap

El slice 1 está terminado: la migración aplicada, el espejo comprobado contra la base, 7 de 7
escenarios de Playwright y la suite de Vitest en verde. En `/admin/difusion` el administrador ya
puede escribir sus textos y copiar el de cada línea con la lista de hoy.

### Próximos pasos (opciones)

1. **Slice 2** (sin migración): un artículo de compraventa por pan disponible —título, precio y
   descripción, cada uno con su «Copiar»— y las fotos de cada producto.
2. **Integrar `feat/outreach-texts` a `main`** en `hazlo-sano-bot` (pendiente del usuario: el
   agente no integra ni empuja sin que se le pida).
3. **Slice 3** (migración B): los grupos y el historial de dónde quedó publicada. Necesita las URLs
   de los grupos, aunque se pueden dar de alta desde la pantalla cuando exista.

## 2026-10-13 — Slice 2: artículos de compraventa y fotos

### Objetivo

Que la misma publicación sirva para un grupo de compraventa: un artículo por pan disponible, con
título, precio y descripción listos para copiar campo por campo, y las fotos de cada producto a la
mano para subirlas.

### Decisiones y por qué

- **Un artículo por producto, derivado del mismo texto.** El artículo de Facebook admite un solo
  precio, así que la línea entera en un artículo obligaría a anunciar el más barato. Quien escribe
  sigue escribiendo un solo texto: el título y el precio salen del producto, y la descripción es el
  texto completo de la línea.
- **La descripción se ofrece una vez, no en cada tarjeta.** Es la misma en todas; repetir su botón
  cinco veces alargaba la página sin darle nada a quien publica.
- **Qué genera artículo lo decide `decideListing`**, la misma regla de la lista: lo que no se
  anuncia junto tampoco se vende suelto.
- **`formatPriceField` no es `formatListPrice`.** Una escribe un letrero para leerse («$1,250»); la
  otra llena un campo numérico («1250»), donde la coma de miles no siempre se acepta.
- **Las fotos se leen en la misma consulta** (`json_agg` sobre `post_media`, solo `image`, en
  `sort_order`): diez videos del catálogo quedan fuera porque un artículo pide fotos. Cada
  miniatura abre la original en otra pestaña; no hay «descargar» porque el atributo `download` no
  funciona con archivos de otro dominio.
- **`CopyOutreachText` pasó a `CopyText`**, con una variante discreta para los campos: en la página
  hay un botón por pan y por campo.
- **El «Copiar» del texto completo se busca dentro de su sección y con `exact`.** Con «Copiar
  título», «Copiar precio» y «Copiar descripción» en la misma página, el nombre por subcadena del
  slice 1 se volvió ambiguo. Fue la prueba encontrando un cambio real de la pantalla, no
  fragilidad.

### Archivos tocados

- **Dominio:** `src/domain/outreach/listingArticles.ts` y su prueba.
- **Casos de uso:** `getOutreachKitUseCase.ts` devuelve también `articles`; el puerto toma
  `ListingSource` (título y fotos) como producto guardado.
- **Infra:** fotos en `PostgresOutreachTextRepository.productsOf`.
- **App:** `[id]/page.tsx` en dos secciones (grupos normales y compraventa), `ui/CopyText.tsx`,
  `ui/ListingArticles.tsx`, `ui/ProductPhotos.tsx` (sobre `Thumbnail`).
- **Textos:** 13 claves nuevas en `outreach`; `textHeading` se fue con su sección.
- **E2E:** tres escenarios nuevos y la página con los artículos.

### Comandos clave

```sh
pnpm exec vitest run src/domain/outreach src/use_cases/outreach "src/app/[locale]/admin/difusion" src/i18n
rm -rf .next && pnpm exec playwright test src/e2e/outreach --reporter=line   # puerto 3000 libre
pnpm run lint && pnpm run test:run
```

### Resultados

- **Vitest del área:** 11 archivos, 90 pruebas. **Suite completa:** 308 archivos en verde.
- **Playwright:** **10 de 10** a la primera (los 7 del slice 1 y los 3 nuevos), en 3.5 min.
- **`typecheck` y `lint`:** limpios.

### Desviaciones del roadmap

- El grupo normal enseña la primera foto de cada producto; el roadmap decía «las fotos» sin más.

### Recap

La misma publicación ya sirve para los dos tipos de grupo: el texto completo para uno normal y un
artículo por pan para uno de compraventa, con su precio exacto y sus fotos. Falta lo que evita el
bloqueo de verdad: saber en qué grupos ya se publicó y cuándo.

### Próximos pasos (opciones)

1. **Slice 3** (migración B, `0061`): los grupos con su tipo y su ritmo, abrirlos desde la
   publicación y marcar dónde quedó. La migración ya está escrita en `hazlo-sano-bot`; aplicarla
   necesita autorización.
2. Integrar `feat/outreach-texts` a `main` en `hazlo-sano-bot`.

## 2026-10-13 — Slice 3: los grupos y dónde quedó publicada (código listo, migración `0061` sin aplicar)

### Objetivo

Que los grupos sean datos —nombre, dirección, tipo, cada cuántos días aceptan una publicación y sus
reglas— y que después de publicar se marque en la app dónde quedó cada cosa: la línea entera en
los grupos normales, cada pan en los de compraventa. Es el historial que evita repetirse.

### Decisiones y por qué

- **El tipo es del grupo y decide dónde aparece.** Un grupo normal sale junto al texto completo y
  uno de compraventa junto a los artículos. Marcar la línea entera en un grupo de compraventa, o un
  pan suelto en uno normal, se rechaza: sería un historial que miente.
- **La última vez de un pan en compraventa cuenta desde cualquier texto.** A un grupo le da igual
  desde qué publicación se vendió el chocolate; lo que cuenta es que ya lo vio. La de la línea
  entera sí es del texto.
- **«Hoy», «ayer» y «hace N días» en días de calendario de México**, contados en el servidor con
  `COMMUNITY_TIME_ZONE`: lo publicado a las 23:50 fue «ayer» a las 00:10. La función vive en
  `src/domain/outreach/lastPublished.ts` y **no** importa `localDateAt` de `src/domain/habits/`:
  difusión es núcleo y hábitos, un módulo del vertical; la dependencia al revés sería la fuga que
  `AGENTS.md` prohíbe.
- **La dirección sin `https://` se completa y cualquier otro esquema se rechaza.** Se pinta como
  enlace: un `javascript:` ahí correría código en la sesión del administrador. Por eso el campo es
  `type="text"` con `inputMode="url"`, y no `type="url"`, que rechazaría `facebook.com/groups/…`.
- **Marcar vuelve a la misma página** en vez de actualizar el estado del formulario: lo que se ve
  después es lo que dice la base.
- **El kit lee las tablas nuevas**, así que desde este slice **la página de una publicación no
  funciona sin la `0061`**. El e2e entero se salta mientras falte cualquiera de las dos tablas, y
  este código no puede integrarse antes que la migración.

### Archivos tocados

- **Migración (otro repo):** `hazlo-sano-bot/alembic/versions/0061_2026-10-13_add_outreach_channels.py`,
  en `feat/outreach-texts`, **sin commit ni aplicar**.
- **Dominio:** `channelFormats.ts`, `outreachChannelDraft.ts`, `lastPublished.ts` y sus pruebas.
- **Casos de uso:** `saveOutreachChannelUseCase`, `listOutreachChannelsUseCase`,
  `recordOutreachPublicationsUseCase`; `getOutreachKitUseCase` con grupos e historial; dos puertos
  y sus repositorios en memoria, y `__fakes__/masaMadreWorld.ts`, el mundo mínimo compartido.
- **Infra:** espejo de las dos tablas y `PostgresOutreachChannelRepository`,
  `PostgresOutreachPublicationRepository`.
- **App:** `/admin/difusion/grupos` (lista, `nuevo`, `[id]/editar`) con su acción; en el kit,
  `ChannelLinks`, `MarkPublishedForm`, `lastPublishedLabel` y la acción `markOutreachPublished`.
- **Rutas y textos:** tres rutas nuevas (`/en/admin/outreach/groups…`) y 42 claves en `outreach`.
- **E2E:** cuatro escenarios, `OutreachGroups`, `testUtils/outreachChannels.ts`, barrido de grupos
  de prueba con guarda de tabla, `labelled.ts` compartido.

### Resultados (antes de aplicar la `0061`)

- **Vitest del área:** dominio, casos de uso y app en verde (174 + 11 de las acciones nuevas).
  **Suite completa: 314 archivos, 3 334 pruebas, todas en verde.**
- **`typecheck`, `lint`, `check:directives`:** limpios. **`check:i18n`:** solo el aviso que ya
  estaba en `publishPracticeDayPost.ts`.
- **SQL de la `0061` en modo offline:** crea las dos tablas, las tres llaves foráneas con
  `ON DELETE CASCADE` y los tres índices; `alembic heads` da `0061_2026_10_13` como única cabeza.
- **Playwright:** 14 escenarios listados, **sin ejecutar**: necesitan la `0061`.

### Recap

El slice 3 está escrito de punta a punta y en verde en todo lo que no necesita las tablas nuevas.
Para usarlo, y para correr su e2e, hay que aplicar la `0061` en la base compartida, lo que requiere
autorización explícita.

### Próximos pasos (opciones)

1. **Autorizar la `0061`** (`uv run alembic upgrade head` en `hazlo-sano-bot`): después, comprobar el
   espejo, correr los 14 escenarios y hacer los commits del slice 3 en los dos repos.
2. **Slice 4** (sin migración): «ya toca / todavía no» con los días mínimos de cada grupo, el pan
   que toca hoy en compraventa y el aviso del tope diario.

## 2026-10-13 — Slice 3: la `0061` aplicada, el e2e en verde y el backend integrado

### Objetivo

Cerrar el slice 3: aplicar la `0061`, comprobar el espejo, correr el e2e e integrar las dos
migraciones a `main` en `hazlo-sano-bot`.

### Decisiones y por qué

- **El usuario autorizó las dos cosas explícitamente** («aplica la migración 0061 e integra y sube
  la rama de hazlo-sano-bot a main»). Antes se comprobó que la `0061` fuera la única pendiente.
- **Integración en avance rápido** (`merge --ff-only`): `main` no se había movido, y la historia del
  backend es lineal. Antes de empujar se corrieron sus validaciones.
- **Ruff marca 5 errores y 18 archivos sin formato en el backend, todos de antes**: los errores son
  de `2026_04_19_1424-b2e05c09c374_add_logo_url_to_seller.py` y el formato, de archivos como
  `app/infrastructure/db/repositories/product.py`. Las dos migraciones nuevas pasan limpias. No se
  tocó lo ajeno.

### Comandos clave

```sh
# hazlo-sano-bot
uv run alembic current && uv run alembic upgrade head        # 0060 -> 0061
uv run pytest -q                                             # 204 passed
uv run ruff check alembic/versions/006*.py && uv run ruff format --check alembic/versions/006*.py
git checkout main && git merge --ff-only feat/outreach-texts && git push origin main

# comida-justa (puerto 3000 libre comprobado)
rm -rf .next && pnpm exec playwright test src/e2e/outreach --reporter=line
```

### Resultados

- **Espejo:** coincide con la base en las dos tablas, las tres llaves foráneas con
  `ON DELETE CASCADE` y los tres índices, el `published_at DESC` incluido.
- **Playwright: 14 de 14 a la primera**, en 4.4 min (33 rutas calientes en 99 s). El
  `globalTeardown` no encontró residuos.
- **Backend:** `pytest` 204 en verde; `main` empujado (`36929d7..9b6f9ba`).

### Escrito en recursos compartidos

- **Base compartida:** la `0061` creó `outreach_channels` y `outreach_publications`, vacías. Se
  deshace con `uv run alembic downgrade 0060_2026_10_13`, que las borra con lo que tengan.
- **GitHub:** `hazlo-sano-bot/main` lleva los commits `f59e090` (`0060`) y `9b6f9ba` (`0061`).

### Recap

Los tres primeros slices están terminados y en uso: el texto para grupos normales, los artículos de
compraventa y los grupos con el historial de dónde quedó cada cosa. Las dos migraciones están
aplicadas y en `main` del backend.

### Próximos pasos (opciones)

1. **Slice 4** (sin migración): «ya toca / todavía no» con los días mínimos de cada grupo, el pan
   que toca hoy en compraventa y el aviso del tope diario.
2. **Dar de alta los grupos reales** en `/admin/difusion/grupos`.
3. **Slice 5** (migración C): pie compartido y versiones del texto que se turnan.

## 2026-10-13 — Slice 3.1: migas de pan

### Objetivo

Que cada pantalla de difusión diga dónde se está y deje subir un nivel. Lo pidió el usuario al
probarlo: «creo que nos faltan breadcrumbs para estas funcionalidades».

### Decisiones y por qué

- **El mismo componente que el catálogo**, `Breadcrumbs`, con las mismas etiquetas comunes
  (`common.home`, `common.breadcrumb`). Un segundo componente de migas sería la duplicación que
  `AGENTS.md` prohíbe.
- **El camino se arma en una sola función** (`outreachTrail` y `groupsTrail`) y un componente de
  servidor (`OutreachBreadcrumbs`) pone el tramo común: cada página solo dice su final, así las siete
  no pueden contradecirse.
- **Las migas sustituyen a los enlaces de «Todas las publicaciones»** del kit y de la lista de
  grupos; sus claves (`backToList`, y `backToGroups`, que nunca se usó) salieron del catálogo.
- **Sin JSON-LD**: `/admin` no se indexa (`robots: noindex`), así que no hay `BreadcrumbList` que
  declarar.
- **Antes de correr el e2e se comprobó el 3000**, y que los «cuatro procesos `next dev`» que
  aparecían eran la propia consulta de PowerShell, cuyo comando contenía esas palabras.

### Archivos tocados

- `src/app/[locale]/admin/difusion/outreachTrail.ts` y su prueba; `ui/OutreachBreadcrumbs.tsx`.
- Las siete páginas de `/admin/difusion`; claves fuera en `es.json`/`en.json`.
- E2E: `src/e2e/outreach/breadcrumbs.ts`, dos escenarios, y `seedMasaMadreText` acepta un nombre.

### Resultados

- **Vitest del área:** 8 archivos, 54 pruebas (8 de la corrida de escritorio de los caminos).
  **Suite completa: 315 archivos, 3 342 pruebas, todas en verde.**
- **Playwright:** **16 de 16** en 4.7 min (33 rutas calientes en 98 s).
- **`typecheck` y `lint`:** limpios.

### Recap

Las pantallas de difusión ya se recorren como el resto del sitio: cada una dice su camino y deja
subir un nivel. Lo demás no cambió.

### Próximos pasos (opciones)

1. **Slice 4** (sin migración): el ritmo entre grupos.
2. Integrar a `dev` y empujar, como el resto de la feature.

## 2026-10-13 — Slice 4: el ritmo

### Objetivo

Lo que de verdad evita el bloqueo: que cada grupo diga si ya le toca recibir otra publicación, que
en compraventa se sugiera qué pan toca hoy en cada grupo, y que el día avise al llegar a un tope.

### Decisiones y por qué

- **El turno cuenta desde lo último publicado en el grupo, de cualquier texto.** La regla de un
  grupo es «una publicación tuya cada N días», no una por texto. Por eso el repositorio ganó
  `lastByChannel`, aparte del historial por texto que ya existía.
- **La sugerencia reparte los panes entre días:** el que lleva más tiempo sin publicarse ahí, con
  lo nunca publicado primero y el orden del texto como desempate. Solo entre los disponibles: lo
  agotado no se sugiere, igual que no se anuncia.
- **El tope es 10 y no es una cifra de Facebook.** Meta no publica ninguna; es un valor prudente
  para una cuenta personal que publica a mano, en una sola constante para moverlo. Avisa y no
  impide: el botón de marcar sigue encendido.
- **«Hoy» se cuenta en hora de México en los dos lados:** el caso de uso recibe la hora y la zona
  (`KitClock`) en vez de leer el reloj por su cuenta, y la consulta del conteo compara
  `published_at AT TIME ZONE` contra la fecha de México. Vercel corre en UTC: a las 19:00 de
  México, contar en UTC partiría la tarde en dos días.
- **`calendarDate` salió de `lastPublished.ts`** para que el conteo y los días transcurridos usen la
  misma fecha de calendario.
- **El e2e del tope afirma «10 o más de 10»**, no «exactamente 10»: cuenta todo lo de hoy en la base
  compartida, incluidas las publicaciones reales que alguien haya marcado.

### Archivos tocados

- **Dominio:** `rhythm.ts` (turno, sugerencia, conteo) y su prueba; `calendarDate` en
  `lastPublished.ts`.
- **Casos de uso:** `getOutreachKitUseCase` con `KitClock`, turnos, sugerencias y conteo; el
  puerto del historial con `lastByChannel` y `countOn`, y su repositorio en memoria.
- **Infra:** las dos consultas nuevas en `PostgresOutreachPublicationRepository`.
- **App:** `ChannelLinks` con el turno y la sugerencia; `DailyPaceNotice`; `loadOutreachText` con
  la hora de la página y `COMMUNITY_TIME_ZONE`.
- **Textos:** 5 claves en `outreach`.
- **E2E:** tres escenarios y `seedOutreachPublication`, que siembra historia con fecha.

### Resultados

- **Vitest del área:** 16 archivos, 147 pruebas. **Suite completa: 316 archivos, 3 360 pruebas.**
- **Playwright:** **19 de 19** a la primera, en 4.9 min (33 rutas calientes en 95 s).
- **`typecheck` y `lint`** (1 405 archivos): limpios.

### Recap

La difusión ya lleva el ritmo: cada grupo dice si le toca, cada grupo de compraventa sugiere el pan
del día y el día avisa al llegar a 10. Solo queda en el roadmap el slice 5, con migración.

### Próximos pasos (opciones)

1. Integrar a `dev` y empujar, como el resto.
2. **Slice 5** (migración C): pie compartido y versiones del texto que se turnan.
3. Borrar publicaciones y grupos, que hoy solo se crean y se corrigen.

## 2026-10-13 — Slice 4.1: la pausa entre publicaciones, y el ritmo configurable

### Objetivo

Lo pidió el usuario al revisar el slice 4: una pausa sugerida entre publicaciones, porque el tope
del día no dice nada si las primeras ocho van en cinco minutos; que el tope siga en 10, y que los
dos valores se cambien «por configuración y/o variable de entorno».

### Decisiones y por qué

- **La pausa cuenta desde lo último marcado en cualquier grupo**: publicar en ráfaga es un patrón de
  la cuenta, no de un grupo. Sale de `lastByChannel`, sin consulta nueva.
- **Minutos enteros ya transcurridos**, sin redondear hacia arriba lo que falta, y nunca negativos:
  la hora de lo marcado la pone la base, y un reloj de servidor atrasado no puede dar «hace −1».
- **Avisa y no impide**, igual que el tope: el botón de marcar sigue encendido.
- **Configuración en dos capas.** Los valores por omisión y la validación viven en el dominio
  (`rhythmConfig.ts`); leer `process.env` vive en infra (`src/infra/config/outreachRhythm.ts`),
  y el caso de uso recibe el ritmo como parámetro. El dominio no lee el entorno.
- **No se usó `Number(x) || omisión`**, el patrón de `src/infra/constants`: ahí un 0 cae al valor
  por omisión, y una pausa de 0 es justo la forma de apagarla. Lo inválido («10m», «diez», 500) se
  ignora y se avisa **una vez** en el registro, para que una errata no pase en silencio ni lo llene.
- **Las frases del aviso salieron a `paceMessages.ts`** y se prueban con el traductor de next-intl
  y el catálogo de verdad, contra las frases exactas de la corrida de escritorio.
- **El e2e de la pausa siembra lo marcado justo antes de abrir**, para que sea lo último de la base
  compartida aunque alguien haya marcado algo real ese día.

### Archivos tocados

- **Dominio:** `rhythmConfig.ts` y su prueba; `pauseStatus` en `rhythm.ts`, y `dailyPace` pide
  el tope (ya no hay constante fija).
- **Infra:** `src/infra/config/outreachRhythm.ts` y su prueba.
- **Casos de uso:** `getOutreachKitUseCase` recibe el ritmo y devuelve `pause`.
- **App:** `paceMessages.ts` y su prueba; `DailyPaceNotice` con la pausa; `loadOutreachText` lee
  la configuración.
- **Textos:** `pauseJustPosted` y `pauseWait`, con plurales.
- **E2E:** un escenario y `pauseNotice` en la página.

### Resultados

- **Vitest del área:** 20 archivos, 177 pruebas. **Suite completa: 319 archivos, 3 388 pruebas.**
- **Playwright:** **20 de 20** en 5.9 min.
- **`typecheck` y `lint`** (1 411 archivos): limpios.

### Recap

El ritmo queda completo: turno por grupo, pan del día, tope diario y pausa entre publicaciones, los
dos últimos configurables por entorno. Todo avisa; nada impide publicar.

### Próximos pasos (opciones)

1. Integrar a `dev` y empujar.
2. Si se quieren otros valores en producción: `OUTREACH_DAILY_LIMIT` y `OUTREACH_PAUSE_MINUTES` en
   el panel del despliegue.
3. **Slice 5** (migración C): pie compartido y versiones del texto que se turnan.
