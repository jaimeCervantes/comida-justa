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

## 2026-10-13 — Slice 5: pie compartido y versiones que se turnan (código listo, migración `0062` sin aplicar)

### Objetivo

Que el bloque de contacto se escriba una vez y lo compartan las publicaciones, y que una publicación
pueda tener varias versiones de lo que va antes de la lista, repartidas entre los grupos para que
Facebook no vea el mismo texto en varios el mismo día.

### Decisiones y por qué

- **El pie es un registro propio (`outreach_footers`) y no un ajuste global.** Cada texto elige el
  suyo con `footer_id`. Además de permitir otro pie para otra marca, es lo que deja a la suite crear
  los suyos con el marcador «E2E »: con un ajuste único, cada corrida tendría que pisar y restaurar
  el pie de verdad en la base compartida, y una corrida cortada lo dejaría cambiado.
- **Borrar un pie deja a sus textos sin pie** (`ON DELETE SET NULL`), no los borra.
- **La primera versión sigue en `outreach_texts.opening`**; las demás van en
  `outreach_text_versions`, en orden. Así los textos que ya existen no cambian.
- **El turno no se guarda: sale de la fecha y del orden de los grupos.** El grupo `i` recibe la
  versión `(día + i) mod n`, con el día de México. Grupos vecinos reciben versiones distintas el
  mismo día y cada grupo cambia al día siguiente; con más grupos que versiones se reparten parejo.
  La descripción de compraventa, que es una para todos, usa la versión del día.
- **Una versión en blanco se descarta al guardar**, igual que un emoji vacío: arrancaría el texto
  directo en la lista.
- **Desde este slice, guardar un texto requiere la `0062`**, no solo leerlo: Drizzle nombra todas
  las columnas al insertar, `footer_id` incluida. Este código no puede integrarse antes que la
  migración.
- **El e2e se salta entero mientras falte cualquiera de las tres migraciones** (`0060` a `0062`).

### Archivos tocados

- **Migración (otro repo):** `hazlo-sano-bot/alembic/versions/0062_2026-10-13_add_outreach_footers_and_versions.py`,
  rama `feat/outreach-footers`, **sin commit ni aplicar**.
- **Dominio:** `versions.ts` (el turno), `footerDraft.ts`, el pie y las versiones en
  `outreachText.ts` y `outreachTextDraft.ts`, `calendarDay` exportado; sus pruebas.
- **Casos de uso:** `saveOutreachFooterUseCase`, `listOutreachFootersUseCase`, el puerto de pies, y
  `getOutreachKitUseCase` con versiones, turno por grupo y versión de la descripción.
- **Infra:** espejo de `outreach_footers`, `outreach_text_versions` y `footer_id`;
  `PostgresOutreachFooterRepository`; versiones y pie en `PostgresOutreachTextRepository`.
- **App:** `/admin/difusion/pies` (lista, alta y edición) con su acción y `FooterForm`; en el
  formulario del texto, `OpeningVersions` y el selector de pie; en la publicación,
  `GroupPostTexts` y «Le toca la versión N»; migas de los pies.
- **Rutas y textos:** tres rutas (`/en/admin/outreach/footers…`) y 28 claves.
- **E2E:** dos escenarios, `OutreachFooters`, siembra y barrido de pies con guarda de tabla.

### Resultados (antes de aplicar la `0062`)

- **Vitest del área:** 24 archivos, 209 pruebas. **Suite completa: 323 archivos, 3 420 pruebas.**
- **`typecheck` y `lint`** (1 430 archivos): limpios.
- **SQL de la `0062` en modo offline:** crea la tabla de pies, la columna con su llave foránea e
  índice, y la tabla de versiones; el `downgrade` lo quita en orden inverso. `alembic heads` da
  `0062_2026_10_13` como única cabeza.
- **Playwright:** 22 escenarios listados, **sin ejecutar**: necesitan la `0062`.

### Recap

El slice 5 está escrito de punta a punta y en verde en todo lo que no necesita las tablas nuevas.
Falta aplicar la `0062` en la base compartida, lo que requiere autorización explícita; sin ella, el
texto no se puede guardar ni abrir.

### Próximos pasos (opciones)

1. **Autorizar la `0062`**: después, comprobar el espejo, correr los 22 escenarios (en dos tramos),
   hacer los commits, integrar `feat/outreach-footers` a `main` en `hazlo-sano-bot` y, si se pide,
   esta rama a `dev`.
2. Borrar publicaciones, grupos y pies, que hoy solo se crean y se corrigen.

## 2026-10-14 — Slice 5: la `0062` aplicada, el e2e en verde y el backend integrado

### Objetivo

Cerrar el slice 5: aplicar la `0062`, comprobar el espejo, correr el e2e e integrar la migración a
`main` en `hazlo-sano-bot`.

### Decisiones y por qué

- **El usuario autorizó las dos cosas** («sí, adelante», a la pregunta de aplicar la `0062` e
  integrar y subir su rama). Antes se comprobó que fuera la única pendiente: `0061` → `0062`.
- **El escenario del pie falló la primera vez por la prueba, no por la app.** Un diagnóstico
  temporal (borrado al terminar) mostró que `fill` sobre el texto del pie, que ya venía escrito,
  dejó «NUEVO…VIEJO…»: cayó mientras React hidrataba el formulario, perdió la selección y pegó lo
  nuevo delante. Se guardó tal cual, y lo que falló fue la comparación del final del texto. En los
  formularios vacíos no se nota porque no hay nada detrás.
- **Arreglo: `fillWhenHydrated`** en `src/e2e/testUtils/`, hermano de `selectWhenHydrated`: escribe y
  comprueba que quedó exactamente eso, reintentando con `toPass`. Los tres page objects de difusión
  lo usan en sus once campos, también en los que hoy empiezan vacíos.

### Comandos clave

```sh
# hazlo-sano-bot
uv run alembic current && uv run alembic upgrade head        # 0061 -> 0062
uv run pytest -q                                             # 204 passed
git checkout main && git merge --ff-only feat/outreach-footers && git push origin main

# comida-justa (puerto 3000 libre comprobado antes de cada tramo, y `.next` borrado)
pnpm exec playwright test src/e2e/outreach --shard=1/2 --reporter=line
pnpm exec playwright test src/e2e/outreach --shard=2/2 --reporter=line
```

### Resultados

- **Espejo:** coincide con la base en `outreach_footers`, `outreach_text_versions` y
  `outreach_texts.footer_id`, con sus llaves (`SET NULL` y `CASCADE`) y sus dos índices.
- **Playwright, primera corrida:** 21 de 22; falló el del pie (ver Decisiones).
- **Playwright, con `fillWhenHydrated`: 22 de 22**, en dos tramos de 11 (4.5 y 4.4 min).
- **Backend:** `pytest` 204 en verde; `main` empujado (`9b6f9ba..2f665ee`).

### Escrito en recursos compartidos

- **Base compartida:** la `0062` creó `outreach_footers` y `outreach_text_versions` (vacías) y la
  columna `outreach_texts.footer_id` (nula en los textos que ya existían). Se deshace con
  `uv run alembic downgrade 0061_2026_10_13` en `hazlo-sano-bot`.
- **GitHub:** `hazlo-sano-bot/main` lleva `2f665ee` (`0062`).
- **Datos de prueba:** pies, textos, grupos y panes con el marcador «E2E », borrados al terminar
  cada escenario y comprobado por el barrido final.

### Recap

El roadmap de difusión está completo: texto para grupos normales, artículos de compraventa con
fotos, grupos con su historial, migas de pan, el ritmo —turno, pan del día, tope y pausa
configurables— y ahora el pie compartido y las versiones que se turnan. Las tres migraciones
(`0060` a `0062`) están aplicadas y en `main` del backend.

### Próximos pasos (opciones)

1. Integrar esta rama a `dev` y empujar.
2. Borrar publicaciones, grupos y pies, que hoy solo se crean y se corrigen.
3. Dar de alta el pie real de Hazlo Sano y elegirlo en las publicaciones que ya existan, quitando de
   su texto «después de la lista» el bloque de contacto repetido.

## 2026-10-14 — Slice 6: borrar publicaciones, grupos y pies (código listo, `0063` sin aplicar)

### Objetivo

Poder borrar lo que ya no se usa —una publicación de temporada, un grupo que cerró, un pie viejo—
sin que el ritmo pierda la memoria de dónde y cuándo se publicó.

### Decisiones y por qué

- **Borrar una publicación no borra su historial.** Las llaves de la `0061` eran `CASCADE`: borrar
  un texto se llevaba cuándo se publicó en cada grupo, y esos grupos volvían a ofrecerse como
  nunca publicados, que es lo contrario de lo que el ritmo existe para evitar. La `0063` pasa
  `outreach_text_id` a nulable con `SET NULL`. El turno, el tope y la pausa no miran el texto
  (`lastByChannel`, `countOn`), así que siguen contando esas fechas sin tocar su código.
- **Borrar un grupo sí se lleva su historial** (`channel_id` sigue en `CASCADE`): sin el grupo su
  turno no sirve, y las pruebas, que borran sus grupos al terminar, no dejan fechas sueltas
  contando en el tope del día de la base compartida.
- **Un solo caso de uso para los tres** (`DeleteOutreachRecordUseCase`): la regla es la misma, y lo
  que se va con cada uno lo deciden las llaves de la base. Una sola ayuda de servidor
  (`deleteRecord.ts`) con el gate de admin, y una acción corta por pantalla.
- **Confirmar en la página, no con `window.confirm`**: `ConfirmDelete` pregunta en el idioma de
  la persona, se lee en el teléfono y dice qué más se va.
- **«Ya no existe» con su propio nombre.** Grupos y pies decían «Esta publicación ya no existe»
  al guardar algo que otra persona había borrado; ahora `groupNotFound` y `footerNotFound`, también
  al borrar.
- **En un worktree aparte** (`../comida-justa-borrar`, rama `feat/difusion-borrar` desde `dev`): el
  usuario iba a dar de alta grupos mientras tanto. Lo hace en producción, que usa la misma base
  que las pruebas (mismo proyecto de Supabase que el bot); la limpieza solo borra lo que empieza
  con «E2E », y el escenario de borrar una publicación siembra su historial hace dos días, no hoy,
  para no mover el tope ni la pausa de quien use la base a la vez.

### Archivos tocados

- **Casos de uso:** `deleteOutreachRecordUseCase.ts` y su prueba; `delete` en los puertos de
  textos, grupos y pies y en sus dobles en memoria.
- **Infra:** `delete` en los tres repositorios de Postgres; en el espejo,
  `outreach_publications.outreach_text_id` nulable con `set null`.
- **App:** `ui/ConfirmDelete.tsx` y su prueba, `deleteRecord.ts`, una acción de borrar en cada
  `actions.ts` (con sus pruebas), las tres páginas de edición y 11 mensajes en `es.json` y
  `en.json`.
- **E2E:** `confirmDelete.ts`, métodos de borrar en los tres page objects,
  `outreachHistoryOutlivesTexts` y tres escenarios; el `.feature` explica por qué el historial se
  queda.
- **`hazlo-sano-bot`:** `0063_2026-10-14_keep_outreach_history_on_text_delete.py` en
  `feat/outreach-keep-history`, sin commit y sin aplicar.

### Comandos clave

```sh
# hazlo-sano-bot: nada de esto toca la base
uv run alembic upgrade 0062_2026_10_13:0063_2026_10_14 --sql
uv run alembic downgrade 0063_2026_10_14:0062_2026_10_13 --sql
uv run ruff check <0063> && uv run pytest -q

# comida-justa, en el worktree (3000 libre comprobado y `.next` borrado antes de cada tramo)
pnpm exec vitest run && pnpm run lint && pnpm run check:i18n && pnpm run check:directives
pnpm exec playwright test src/e2e/outreach --shard=1/2 --reporter=line
pnpm exec playwright test src/e2e/outreach --shard=2/2 --reporter=line
```

### Resultados

- **Vitest:** 325 archivos y 3,437 pruebas en verde; el área de difusión, 24 archivos y 221.
- **`tsc`:** limpio, salvo los errores que ya estaban en `delivery.test.ts` y
  `placeOrderUseCase.test.ts:62`.
- **Lint:** 1,437 archivos sin cambios. `check:directives` en orden; `check:i18n` solo señala
  `publishPracticeDayPost.ts`, que ya fallaba.
- **Playwright:** 25 escenarios en dos tramos: 24 en verde y 1 omitido a propósito, el de borrar
  una publicación, que espera la `0063`. El de borrar un pie falló la primera vez por un dato de
  la prueba: el pie repetía el renglón de WhatsApp que el texto sembrado ya trae como «después de
  la lista». Con el renglón de ubicación, y comprobando antes que el texto lo lleva, pasa.
- **Backend:** `ruff` limpio, `pytest` 204 en verde y una sola cabeza (`0063_2026_10_14`); la
  vista previa da los tres `ALTER` esperados.

### Escrito en recursos compartidos

- **Base compartida:** solo datos de prueba con el marcador «E2E », borrados al terminar cada
  escenario. Nada de esquema: la `0063` no se aplicó. Se leyeron, sin escribir, las llaves de
  `outreach_publications` y unos conteos: 0 publicaciones, 0 grupos y 0 textos reales.
- **GitHub:** nada empujado.

### Recap

Publicaciones, grupos y pies se borran desde su edición, con una pregunta que dice qué más se va.
Grupos y pies funcionan ya con la base como está. Borrar una publicación también funciona, pero
hasta aplicar la `0063` se lleva su historial; con ella, los grupos siguen recordando cuándo se
publicó. El código está en `feat/difusion-borrar`, en el worktree `../comida-justa-borrar`.

### Próximos pasos (opciones)

1. Con el sí del usuario: aplicar la `0063`, hacer su commit, integrarla a `main` del backend y
   empujar; correr el escenario que hoy se omite.
2. Después, integrar `feat/difusion-borrar` a `dev` y empujar: en ese orden, para que la pregunta
   de borrar una publicación diga la verdad desde el primer día.
3. Quitar el worktree `../comida-justa-borrar` al integrar.

## 2026-10-14 — Slice 6: la `0063` aplicada, el escenario que esperaba en verde y todo integrado

### Objetivo

Aplicar la `0063`, correr el escenario de borrar una publicación, que se omitía sin ella, e
integrar el slice a `dev`.

### Decisiones y por qué

- **El usuario lo autorizó en este orden** («first migration, then run the remaining scenario and
  merge everything into dev»): la pregunta de borrar una publicación promete que el historial se
  queda, y eso solo es cierto con la `0063` aplicada.
- **El escenario falló la primera vez por la prueba, no por la app.** Afirmaba «Última vez aquí:
  hace 2 días» en la otra publicación, pero esa etiqueta es de cada publicación (`stampsFor`), y
  «Pan de temporada» nunca se publicó en ese grupo: «nunca» era lo correcto. La memoria del grupo
  está en su turno, que cuenta lo publicado con cualquier texto (`lastByChannel`). Ahora se afirma
  «Todavía no: en 5 días» —acepta una cada 7 y se publicó hace 2—, que sin la `0063` diría «Ya le
  toca».

### Comandos clave

```sh
# hazlo-sano-bot
uv run alembic current && uv run alembic upgrade head        # 0062 -> 0063
git checkout main && git merge --ff-only feat/outreach-keep-history && git push origin main

# comida-justa, en el worktree (3000 libre comprobado y `.next` borrado antes de cada corrida)
pnpm exec playwright test src/e2e/outreach -g "Borro" --reporter=line
```

### Resultados

- **Base:** `outreach_publications_outreach_text_id_fkey` es `ON DELETE SET NULL` y
  `outreach_text_id` admite nulo, como en el espejo; la llave de `channel_id` sigue en `CASCADE`.
- **Playwright:** los tres escenarios de borrar en verde, el de la publicación después de corregir
  su afirmación. Con los 22 que no tocan el borrado, de la corrida anterior, 25 de 25.
- **Residuo:** 0 publicaciones en la base al terminar. La fecha que se quedó sin texto se fue con
  el grupo de prueba, como prevé la `0063`.
- **Backend:** `main` empujado (`2f665ee..e5b9ca5`).

### Escrito en recursos compartidos

- **Base compartida:** la `0063` cambió la llave y la nulabilidad de
  `outreach_publications.outreach_text_id`, sin filas que tocar. Se deshace con
  `uv run alembic downgrade 0062_2026_10_13` en `hazlo-sano-bot`, que antes borra las fechas que
  hayan quedado sin texto.
- **GitHub:** `hazlo-sano-bot/main` lleva `e5b9ca5` (`0063`), y `comida-justa/dev` recibe este
  slice.

### Recap

La difusión en grupos queda completa, borrado incluido: publicaciones, grupos y pies se borran
desde su edición con una pregunta que dice qué más se va, y borrar una publicación no le quita
memoria al ritmo. Las cuatro migraciones (`0060` a `0063`) están aplicadas y en `main` del
backend.

### Próximos pasos (opciones)

1. Del usuario: dar de alta sus grupos y su pie real en producción, y quitar de cada publicación
   el bloque de contacto que repita el pie.
2. Si Integral, Ajo, Dátiles con Nuez y Queso Parmesano con Aceitunas se siguen vendiendo, darlos
   de alta: la lista solo anuncia lo que está en la base.

## 2026-10-16 — Slice 7: que la publicación se entienda de un vistazo

### Objetivo

Que la publicación se lea en el orden en que se trabaja y que cada grupo normal sea un solo
renglón. Además, anotar como pendiente la publicación automática en la Página de Facebook.

### Decisiones y por qué

- **Un grupo, un renglón.** Antes cada grupo normal salía dos veces: en «Tus grupos normales»,
  con enlace, turno y reglas, y otra vez más abajo con su casilla. Ahora el renglón de marcar
  (`MarkPublishedForm`) recibe los detalles ya pintados en el servidor (`details: ReactNode`). En
  compraventa la lista de grupos sigue arriba, porque ahí se marca por pan.
- **`ChannelDetails` sale de `ChannelLinks`.** Enlace, turno, versión, sugerencia y reglas son lo
  mismo en los dos tipos de grupo. Solo cambia dónde va el nombre: en la casilla o como título.
- **Pasos numerados como regiones con nombre** (`OutreachStep`, `aria-labelledby`). Quien usa
  lector de pantalla salta de paso en paso, y la prueba encuentra «2. Publica en cada grupo y
  márcalo» por lo que dice y no por cómo está hecho.
- **`Heading` en las siete pantallas.** El nivel lo da la estructura y el tamaño lo da el sistema
  de diseño (h1 serif `lg`, h2 `md`, h3 `sm`, versiones en h4). Lo de antes eran negritas de
  16 a 20 px escritas a mano.
- **El turno como insignia** (`TurnBadge`): tono de marca y `strong` si ya le toca, neutro si no.
  La frase sigue ahí, para quien no distingue el color. La prueba lee `data-tone` y no las clases.
- **«Hoy les toca a N de M grupos»** cuenta los dos tipos (`dueChannels` en el dominio): responde
  «¿dónde puedo publicar hoy?». Sin grupos no dice nada, porque cada sección ya enlaza al alta.
- **Lo que queda fuera de la lista sube a aviso**, con los tokens de `warning`. Es lo primero
  que hay que arreglar antes de copiar.
- **Se van `postGroupsHeading` y `markPostHint`**: el paso 2 los reemplaza con su título y su
  explicación.

### Archivos tocados

- Dominio: `src/domain/outreach/rhythm.ts` (`dueChannels`) y su prueba.
- Pantalla de la publicación: `[id]/page.tsx`, `paceMessages.ts`; en `[id]/ui/`, los nuevos
  `ChannelDetails`, `OutreachStep` y `TurnBadge`, y los cambiados `ChannelLinks`,
  `MarkPublishedForm`, `DailyPaceNotice`, `ExcludedProducts`, `ListingArticles` y
  `GroupPostTexts`.
- Otras pantallas: los ocho `page.tsx` de lista, alta y edición, `OutreachTextForm` y
  `OpeningVersions`.
- Catálogos `es`/`en`. E2E: `difusionEnGrupos.feature` (slices 7 a 9), `.spec.ts` y
  `OutreachAdmin.ts`.
- Roadmap: slices 7 a 9 y el pendiente de la Página de Facebook.

### Comandos clave

```sh
pnpm run test:run && pnpm run typecheck && pnpm run lint
# 3000 libre comprobado y `.next` borrado antes de cada tramo
pnpm exec playwright test src/e2e/outreach --shard=1/3 --reporter=line   # luego 2/3 y 3/3
pnpm exec playwright test src/e2e/outreach -g "sale una sola vez|Armo la publicación de masa madre"
```

### Resultados

- **Vitest:** 326 archivos, 3447 pruebas en verde (nuevas: `dueChannels`, `dueChannelsMessage`
  con 5 casos y `TurnBadge` con 3).
- **Typecheck y lint** limpios.
- **Playwright:** 32 de 32. Los tramos dieron 10/11, 11/11 y 9/10; los dos que fallaron pasaron
  al repetirlos después de corregirlos.

### Desviaciones

- **Dos pruebas suponían una base sin datos reales**, y el usuario ya dio de alta grupos y un pie:
  - «Armo la publicación…» esperaba el texto sin pie. Una publicación nueva toma sola el único pie
    que haya (slice 5), así que ahora la prueba elige «sin pie» (`chooseNoFooter`).
  - La prueba nueva contaba 2 grupos y salieron 3. Ahora afirma que cada grupo sembrado sale una
    sola vez.

  El resumen «N de M» ya se había escrito sin números fijos por lo mismo.
- **Un `next dev` huérfano del tramo 2** se quedó escuchando en el 3000 (Playwright en Windows no
  siempre cierra el hijo). Se identificó por su hora de arranque, la misma de `.next`, y se cerró
  con `taskkill /T` antes del tramo 3.

### Escrito en recursos compartidos

- **Base compartida:** solo los registros de prueba con marcador `E2E`, que borraron sus
  `afterEach` y el barrido de `globalTeardown`. No se tocaron los grupos ni el pie reales.

### Recap

La publicación se lee en el orden de trabajo: cómo va el día («Hoy les toca a N de M grupos», el
tope y la pausa), qué quedó fuera de la lista y, por tipo de grupo, sus pasos. En grupos normales
cada grupo es un renglón con enlace, turno en insignia, versión, reglas, última vez y casilla. Las
siete pantallas usan `Heading`. El pendiente de publicar solo en la Página de Facebook está en el
roadmap.

### Próximos pasos (opciones)

1. **Slice 8:** el selector de productos con la búsqueda del sitio (texto completo y rescate
   semántico), solo productos que se venden, con precio, foto y paginación numérica.
2. **Slice 9:** buscador por texto y «Anterior / Siguiente» en publicaciones y grupos.
3. Del usuario: abrir una publicación y decir si la jerarquía y el renglón único se entienden, o
   qué falta. Sigue pendiente quitar de cada publicación el bloque de contacto que repite el pie.

## 2026-10-16 — Slice 8: buscar productos como en la búsqueda principal

### Objetivo

Que el selector de productos de una publicación encuentre lo mismo que la búsqueda del sitio,
solo entre lo que se vende y con paginación numérica.

### Decisiones y por qué

- **Se reutiliza `SearchPostsUseCase` y no se escribe otra búsqueda.** Texto completo con ranking
  y rescate por sentido cuando el texto no encuentra nada. `SearchOutreachProductsUseCase` solo la
  limita y traduce cada resultado a lo que pinta el selector: título en el idioma del panel,
  precio y primera foto.
- **Tipos de publicación en el núcleo de la búsqueda** (`kinds` en `ISearchPostDTO`, el puerto y
  las tres consultas de Postgres). Es genérico —cualquier vertical puede pedir solo ciertos
  tipos— y va **en la consulta**: filtrar después de paginar dejaba páginas cortas y un total
  falso. La difusión pide `SELLABLE_KINDS`, lo mismo que antes ofrecía su catálogo.
- **De paso, el rescate semántico respeta «solo disponibles».** No se lo pasaba, así que con el
  filtro puesto el rescate podía devolver lo agotado. Salió al tener que pasarle `kinds`, que va
  detrás.
- **Una acción de servidor y no `/api/search`.** Necesita el gate de administrador y devuelve lo
  que pinta el selector, no la publicación entera. No se mide: un administrador armando una
  publicación no es un visitante buscando.
- **Números de página como botones** (`PageButtons` en `src/presentation/navigation/`): el
  buscador vive dentro de un formulario a medio llenar, y un enlace navegaría. La cuenta de qué
  números se ven (`pageWindow`) es la que ya hacía `Pagination` por dentro; ahora la comparten.
- **Se pregunta al dejar de teclear (300 ms)** y solo cuenta la respuesta de lo último que se
  pidió: una búsqueda vieja que tarda más no pisa a la nueva.
- **Se borra el catálogo completo** (`IOutreachProductCatalog` y su repositorio Postgres). El alta
  y la edición ya no cargan unos 400 títulos para filtrarlos en el navegador.
- **Los acentos no se prometen.** La búsqueda del sitio usa `spanish`/`english` sin `unaccent`, y
  arreglarlo es una migración de los índices en el backend que vale para todo el sitio. Antes el
  selector sí los ignoraba; ahora «arandanos» depende del rescate por sentido.

### Archivos tocados

- Núcleo de búsqueda: `ISearchPostDTO`, `ISearchPostRepository`, `SearchPostsUseCase` y su prueba,
  `PostgresSearchPostRepository` (`kindWhere`).
- Difusión: `searchOutreachProductsUseCase` y su prueba (nuevos); `actions.ts`
  (`searchOutreachProducts`) y su prueba; `ProductPicker`; `OutreachTextForm` y su prueba; las
  páginas `nueva` y `[id]/editar`. Se borran `IOutreachProductCatalog` y
  `PostgresOutreachProductCatalog`, y se limpia `factory.ts`.
- Presentación: `pageWindow` y `PageButtons` con sus pruebas (nuevos); `Pagination` usa
  `pageWindow`.
- Catálogos `es`/`en`. E2E: el `.feature` del slice 8, `.spec.ts` y `OutreachAdmin.ts`. Roadmap:
  criterios del slice 8.

### Comandos clave

```sh
pnpm run test:run && pnpm run typecheck && pnpm run lint && pnpm run check:directives
# 3000 libre comprobado, `.next` borrado antes de cada tramo y el servidor del tramo cerrado al terminar
pnpm exec playwright test src/e2e/outreach --shard=1/3 --reporter=line   # luego 2/3 y 3/3
```

### Resultados

- **Vitest:** 329 archivos, 3468 pruebas en verde. Nuevas: 5 del caso de uso, 6 de
  `pageWindow`, 4 de `PageButtons`, 2 de `SearchPostsUseCase` con tipos y 3 de la acción. En el
  formulario, el escenario de cambiar de página sin enviar.
- **Typecheck, lint y directivas** limpios.
- **Playwright:** 33 de 33 en tres tramos de 11 (5.0, 4.8 y 5.2 min). Incluye las pruebas viejas
  que agregan panes desde el buscador: ahora buscan el título completo por palabras, en el
  servidor.

### Desviaciones

- **Siete pruebas de `SearchPostsUseCase` afirmaban la lista exacta de argumentos** y hubo que
  agregarles el de `kinds`. El cambio de firma era real, no fragilidad. Las nuevas leen solo la
  posición que les importa.
- **El precio se lee «$136.00»**, como lo escribe `AmountCurrency`, y no «$136» como decía el
  primer borrador del escenario.
- **El primer intento de e2e no corrió:** el usuario tenía su `next dev` en el 3000. Se esperó a
  que lo detuviera en vez de cerrarlo.

### Escrito en recursos compartidos

- **Base compartida:** solo los registros de prueba con marcador `E2E`, que borraron sus
  `afterEach` y `globalTeardown`.

### Recap

El selector de productos busca como el sitio: palabras sueltas con ranking y rescate por sentido,
solo entre lo que se vende, diez por página con números que no envían el formulario, y cada
resultado con foto y precio. El núcleo de búsqueda acepta filtrar por tipo de publicación, y el
rescate semántico ya respeta «solo disponibles».

### Próximos pasos (opciones)

1. **Slice 9:** buscador por texto y «Anterior / Siguiente» en las listas de publicaciones y
   grupos.
2. **Búsqueda sin acentos en todo el sitio:** `unaccent` en los diccionarios y los índices de
   texto. Es una migración en `hazlo-sano-bot`.
3. Del usuario: probar el buscador con los nombres con los que realmente busca y decir si algo no
   aparece.

## 2026-10-16 — Slice 9: buscar y paginar publicaciones y grupos

### Objetivo

Que las listas de publicaciones y de grupos se puedan buscar por texto y recorrer de 20 en 20,
sin perder la búsqueda al cambiar de página ni al volver de editar.

### Decisiones y por qué

- **Se filtra en memoria, en el caso de uso.** Son decenas de registros, y la publicación ya carga
  todos los grupos para calcular los turnos. Así la regla vive en una sola función de dominio
  (`matchesListTerm`) y la corrida de escritorio la prueba de verdad. En SQL habría dos versiones,
  la consulta y el doble falso de las pruebas, y para ignorar acentos sin `unaccent` habría hecho
  falta un `translate` escrito a mano.
- **«Contiene», sin acentos ni mayúsculas, y sin comodines.** Un grupo se busca por la palabra que
  uno recuerda, que suele ir al final («… de Orizaba»). En grupos también cuenta la dirección.
- **Se reutiliza lo de pedidos e inventario:** `ListSearchField` (filtra mientras se escribe,
  `replace` y no `push`, Enter sin JavaScript), `QueryPagination` y `normalizeListTerm`. Los
  parámetros son los mismos: `q` y `pagina`.
- **Una página de más se vuelve la última** (`pageOf`): una dirección vieja o tecleada a mano no
  deja una lista vacía con «Anteriores» como única salida.
- **«Ninguno coincide» no es «no hay ninguno».** El primero ofrece «Borrar la búsqueda»; el
  segundo sigue invitando a dar de alta el primero. El buscador no aparece en una lista vacía de
  verdad.

### Archivos tocados

- Dominio: `src/domain/search/listPage.ts` (`matchesListTerm`, `pageOf`) y su prueba.
- Casos de uso: `listOutreachChannelsUseCase` y `listOutreachTextsUseCase` reciben la búsqueda y
  la página; sus pruebas son nuevas.
- Pantallas: `admin/difusion/page.tsx` y `grupos/page.tsx`. En `ui/`, nuevos: `OutreachListSearch`,
  `OutreachListPages` y `outreachListHref` con su prueba.
- Catálogos `es`/`en`. E2E: el `.feature` del slice 9, `.spec.ts`, `OutreachAdmin.ts` y
  `OutreachGroups.ts`. Roadmap: criterios del slice 9 y la corrección de los acentos del slice 8.

### Comandos clave

```sh
pnpm run test:run && pnpm run typecheck && pnpm run lint
pnpm exec playwright test src/e2e/outreach --shard=1/3 --reporter=line   # luego 2/3 y 3/3
pnpm exec playwright test src/e2e/outreach -g "siguiente página|Busco un grupo|Sin coincidencias" --repeat-each=2
```

### Resultados

- **Vitest:** 333 archivos, 3488 pruebas en verde. Nuevas: 11 de `listPage`, 5 de los casos de uso
  y 4 de `outreachListHref`.
- **Typecheck y lint** limpios.
- **Playwright:** 38 de 39 en tres tramos (13, 13 y 10 de 11). El que falló se corrigió y pasó dos
  veces seguidas junto con los otros dos de búsqueda en la lista: 6 de 6.

### Desviaciones

- **«Paso a la siguiente página…» falló por la prueba.** Esperaba 20 renglones para dar la búsqueda
  por hecha, pero la lista sin filtrar también tenía 20, porque en la base hay más grupos. Pasaba de
  página antes de tiempo, y la búsqueda pendiente (300 ms) reemplazaba la dirección. Ahora espera a
  que `q` esté en la dirección.
- **La prueba busca por una marca de la corrida y no por «orizaba» a secas.** En la base compartida
  hay grupos de verdad con ese nombre, y moverían el corte de página.
- **Corrección del slice 8.** Dije que la búsqueda del sitio no ignoraba los acentos. Medido en la
  base, `spanish` ya los quita de las vocales: «arandanos», «cafe», «jamon» y «platano» encuentran
  lo acentuado. No iguala la ñ, la ü, algunos acentos en la última sílaba («mamas» frente a
  «Mamás») ni «te» frente a «té». El roadmap ya lo dice así.

### Escrito en recursos compartidos

- **Base compartida:** registros de prueba con marcador `E2E` (hasta 25 grupos por corrida), que
  borran `afterEach` y `globalTeardown`. Además, dos lecturas con
  `SET default_transaction_read_only = on` sobre `pg_extension`, `pg_ts_config`, `pg_indexes` y
  `searches`, para medir lo de los acentos.

### Recap

La difusión completa sus tres slices de UI. La publicación se lee en pasos; el selector de
productos busca como el sitio, con paginación numérica; y las listas de publicaciones y grupos se
buscan sin acentos ni mayúsculas y se recorren de 20 en 20 sin perder la búsqueda.

### Próximos pasos (opciones)

1. **«La búsqueda que se queda sin resultados»**, propuesta al usuario en lugar de la migración de
   acentos. En 90 días, 213 de 1498 búsquedas quedaron vacías:
   - «pan» (24 veces), «suero» (10) y «proteina» (9): averiguar qué las filtró de más.
   - Palabras a medias («prote», «pla», «galle»): la búsqueda solo reconoce palabras completas.
   - La ñ y la ü: esto sí es una migración pequeña en `hazlo-sano-bot`.
2. Del usuario: probar los buscadores de las dos listas.
3. Pendiente desde el slice 7: publicar solo en la Página de Facebook.

## 2026-10-16 — Slice 10: encontrar el producto por las palabras que uno recuerda

### Objetivo

Que el selector de productos encuentre lo que uno sabe que existe a partir de pedazos de su nombre:
palabras a medias, en cualquier orden, sin acentos, ñ ni mayúsculas. Se mantiene la paginación
numérica.

### Decisiones y por qué

- **Dos tiempos.** Primero las palabras sueltas contenidas en el título y, si no encuentran nada,
  la búsqueda del sitio del slice 8 (palabras completas y luego sentido). La primera da lo que se
  busca al armar una publicación: un producto concreto, por el nombre que uno recuerda. La segunda
  sigue cubriendo «algo para dormir».
- **Ni la búsqueda del sitio ni la de la tienda bastaban solas.** La del sitio solo reconoce
  palabras completas («prote» no da «Proteína») y no iguala la ñ. La de la tienda busca la frase
  entera tal cual («pan chocolate» no da «Pan de Masa Madre de Chocolate») y no ignora acentos.
- **Todas las palabras en el mismo título, en cualquiera de sus idiomas.** Se enseña el título del
  idioma del panel. Se ordena con el título que casó: primero los que empiezan con la primera
  palabra, luego los más cortos (los más parecidos a lo escrito), luego alfabético y por `id`, para
  que dos páginas no repitan ni pierdan un renglón.
- **`translate` y no `unaccent`** (`sqlFold`). La extensión no está instalada, y son unos 400
  títulos que se recorren enteros. La tabla de letras vive en un solo archivo, y `sqlFold.test.ts`
  comprueba letra por letra que dobla igual que `foldForSearch` del dominio.
- **`strpos` y no `LIKE`:** un `%` escrito es un `%` y no hay nada que escapar.
- **`searchWords`** es la regla de cómo se parte lo escrito: doblado, sin repetir, en orden y hasta
  8 palabras. Vive en el dominio, con su corrida de escritorio.

### Archivos tocados

- Dominio: `src/domain/search/searchWords.ts` y su prueba (nuevos). `listPage.ts` exporta
  `foldForSearch`.
- Casos de uso: el puerto `IOutreachProductFinder` (nuevo). `searchOutreachProductsUseCase` busca
  en dos tiempos, y su prueba lo cubre.
- Infra: `PostgresOutreachProductFinder` (nuevo) y `db/sqlFold.ts` con su prueba (nuevos);
  `outreach/factory.ts`.
- Acción: `searchOutreachProducts` usa el buscador por palabras; su prueba se actualizó.
- E2E: el `.feature` del slice 10 y `.spec.ts`. Roadmap: el slice 10.

### Comandos clave

```sh
pnpm run test:run && pnpm run typecheck && pnpm run lint && pnpm run check:directives
# La consulta contra la base real, solo lectura (un SELECT), antes del e2e:
node --env-file=.env.development node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json <scratchpad>/finder-check.mts
pnpm exec playwright test src/e2e/outreach --shard=1/3 --reporter=line   # luego 2/3 y 3/3
```

### Resultados

- **Vitest:** 335 archivos, 3523 pruebas en verde. Nuevas: 9 de `searchWords`, 25 de `sqlFold` y 2
  del caso de uso en dos tiempos.
- **Typecheck, lint y directivas** limpios.
- **La consulta en la base real:**
  - «prote»: 50 resultados, el primero «Proteína de Soya Aislada».
  - «pan chocolate» y «chocolate pan»: «Pan de Masa Madre de Chocolate».
  - «madr canel»: «Pan de masa madre de canela».
  - «pina»: 5 productos de piña.
  - «MASA MADRE DE ARANDANOS»: «Pan de masa madre de arándanos».
  - «masa madre»: 6.
  - «algo para dormir»: 0 por palabras, así que responde la búsqueda del sitio.
- **Playwright:** 40 de 40 en tres tramos (14, 14 y 12; 5.9, 5.4 y 4.9 min). Incluye los tres
  ejemplos nuevos: «chocolate pan», «madr canel» y «MASA MADRE DE ARANDANOS».

### Desviaciones

- **Corrección a la entrada del slice 9:** la corrida tenía 37 escenarios (13, 13 y 11), no 39, y
  pasaron 36. El que falló se corrigió ahí mismo. Ahora son 40 con los 3 nuevos.
- **La consulta se probó contra la base antes del e2e,** con un script de solo lectura, para no
  gastar 18 minutos de navegador en un error de SQL.

### Escrito en recursos compartidos

- **Base compartida:** solo los registros de prueba con marcador `E2E`, que borran `afterEach` y
  `globalTeardown`. El script de comprobación solo hizo `SELECT`.

### Recap

El selector de productos encuentra por las palabras que uno recuerda: a medias, en cualquier orden y
sin acentos, ñ ni mayúsculas. Si eso no da nada, responde la búsqueda del sitio con su rescate por
sentido. Diez por página, con números. Con esto la difusión cierra sus slices de UI (7 a 10).

### Próximos pasos (opciones)

1. **La búsqueda del sitio que se queda sin resultados:** «pan» (24 veces), «suero» y «proteina» sin
   resultados en 90 días, y las palabras a medias en la barra de arriba. El buscador por palabras de
   este slice podría servir también ahí.
2. Del usuario: probar el selector con sus búsquedas de siempre.
3. Pendiente desde el slice 7: publicar solo en la Página de Facebook.

## 2026-10-20 — Ajuste: un renglón vacío entre lo de antes y la lista

### Objetivo

Que la lista de precios no quede pegada a lo de antes. El usuario lo pidió al ver el texto armado:
en el grupo se leía como un solo bloque.

### Decisiones y por qué

- **El texto se arma como párrafos parejos:** lo de antes, la lista, lo de después y el pie, cada
  parte separada de la siguiente por un renglón vacío. Antes la lista iba pegada a lo de antes
  porque lo de antes la presenta («Pasa por el tuyo a Hazlo Sano:»), pero visualmente no se separaba.
- **Se cambia en `composeOutreachText`, no en cada texto guardado:** así vale para todas las
  versiones y los textos ya escritos, sin tocar la base.

### Archivos tocados

- Dominio: `src/domain/outreach/outreachText.ts` y su prueba.
- Casos de uso: `getOutreachKitUseCase.test.ts`.
- E2E: `difusionEnGrupos.feature` (el escenario principal y las dos tablas que arman el texto) y
  `masaMadre.ts` (`EXPECTED_TEXT`).

### Comandos clave

```sh
pnpm run test:run && pnpm run typecheck && pnpm run lint
pnpm exec playwright test src/e2e/outreach --shard=1/3 --reporter=line   # …2/3 y 3/3, con rm -rf .next antes de cada uno
```

### Resultados

- **Vitest:** 335 archivos, 3523 pruebas en verde. **Typecheck y lint** limpios.
- **Playwright:** los 40 escenarios de la difusión en tres tramos (14, 14 y 12), 40 de 40.

### Desviaciones

- Ninguna. El e2e esperó a que el usuario detuviera su servidor del 3000.

### Escrito en recursos compartidos

- **Base compartida:** solo los registros de prueba con marcador `E2E`, que borran `afterEach` y
  `globalTeardown`.

### Recap

El texto para grupos separa la lista de lo de antes con un renglón vacío, igual que ya separaba lo de
después y el pie. Aplica a todos los textos y versiones sin tocar lo guardado.

### Próximos pasos (opciones)

1. Del usuario: copiar un texto desde `/admin/difusion` y ver cómo queda en el grupo.
2. Llevar `fix/difusion-renglon-antes-de-la-lista` a `dev`, junto con `feat/busqueda-palabras-a-medias`.
3. Pendiente desde el slice 7: publicar solo en la Página de Facebook.
