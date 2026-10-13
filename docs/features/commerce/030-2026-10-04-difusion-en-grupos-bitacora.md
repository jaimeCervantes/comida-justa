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
