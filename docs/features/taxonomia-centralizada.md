# Feature: Taxonomía centralizada (categorías y subcategorías en la base)

Roadmap de slices para **mover la taxonomía de categorías a la base de datos**, de modo que los tres
repositorios que comparten esa base lean lo mismo, en vez de mantener tres copias a mano.

Este documento es el **checkpoint de revisión** que reemplaza las pausas paso a paso (ver
"Autonomous delivery mode" en `AGENTS.md`). La bitácora por slice se lleva en
`docs/features/taxonomia-centralizada-bitacora.md`.

> **Alcance cruzado.** Esta feature toca tres repositorios:
>
> | Repo | Rol | Ruta |
> |---|---|---|
> | `comida-justa` (Next.js) | **el único que escribe** publicaciones y embeddings | este repo |
> | `bot-whatsapp/backend` (Python) | **dueño del esquema vía Alembic** | `C:\Users\S2G52\Desktop\jaimito\HazloSano\bot-whatsapp\backend` |
> | `HazloSano/dev` (NestJS + miniapp Telegram) | solo lectura | `C:\Users\S2G52\Desktop\jaimito\HazloSano\dev` |
>
> Cada slice indica en qué lado se trabaja.

## Problema / Savings / Why

- **Problema:** la taxonomía vive **triplicada a mano** y nada obliga a que las copias coincidan.
  `comida-justa` tiene las claves tipadas (`src/domain/entities/post/category.ts`) y las etiquetas
  es/en (`src/infra/UI/labels/postCategoryLabels.ts`); `HazloSano/dev` tiene una copia manual solo en
  español (`packages/domain/src/products/entities/categories.ts`); el backend Python trata el valor
  como string opaco. Además `posts.category`/`sub_category` son `text` sin FK ni CHECK, y **la
  jerarquía categoría→subcategoría no está modelada en ningún lado**: nada dice que `jugos` pertenece
  a `alimentacion`.
- **Savings:** renombrar una clave deja de ser tres PRs coordinados y pasa a ser un `UPDATE`. Y sobre
  todo, el fallo deja de ser **mudo**: hoy una clave desincronizada no rompe nada, solo hace que la
  etiqueta desaparezca o se pinte en crudo, y se descubre semanas después mirando datos.
- **Why:** el catálogo va a crecer con lo que publique la comunidad, y con él la taxonomía. Tres
  copias que se sincronizan a mano no escalan más allá de las 7 claves que hay hoy.

## Por qué ahora

La prueba de que el modelo no aguanta ya ocurrió: el commit HEAD del miniapp es
`90386f5 fix(domain): rename the "comidas" sub-category to "platillos"`, y existe **únicamente**
porque este repo renombró la clave (`5a1f24c`) y el espejo quedó desincronizado. Su propio comentario
lo admite: *"El fallback evitó el hueco, no el error."*

Y el movimiento es barato hoy: **7 claves, 14 productos, 24 traducciones**, y `posts` está limpio —
0 claves fuera de la allowlist, 0 sub-categorías huérfanas. Los FKs entran sin migrar un solo dato.

## Decisión de modelado

**Una sola tabla jerárquica auto-referenciada**: categorías y subcategorías conviven en
`categories`, con `parent_key` NULL para las raíces. Las etiquetas van aparte, por locale, en
`category_translations`.

### Por qué `key` de texto como PK y no un uuid sintético

`posts.category` sigue guardando `jugos`, legible en un `SELECT` y compatible con las consultas que ya
existen en los tres repos. Renombrar es un solo comando gracias a `ON UPDATE CASCADE`:

```sql
UPDATE categories SET key = 'zumos' WHERE key = 'jugos';
-- cascada a: parent_key, translations, aliases y posts.sub_category
```

Un uuid haría el renombre igual de barato pero obligaría a un JOIN en cada consulta de los tres repos
para saber qué es una publicación, y a reescribir las consultas por texto que ya funcionan.

### El FK compuesto es lo que hace valer la jerarquía

```sql
FOREIGN KEY (sub_category, category) REFERENCES categories (key, parent_key)
```

No solo verifica que la sub-categoría exista: verifica que **cuelgue precisamente de esa categoría**.
Hoy nada impide guardar una combinación imposible.

### Se pierde el union type `PostSubCategory`, a propósito

Con la taxonomía en runtime, `PostSubCategory` deja de existir y el compilador deja de avisar. A
cambio, la validación al publicar pasa de "¿está en esta constante?" a "¿existe esta clave activa?",
respaldada por el FK — más correcta que hoy, pero el error se descubre en test o runtime.

### El idioma del texto que se vectoriza

El embedding vive en `post_translations`, o sea **por locale**, pero
`PostgresPostEmbeddingRepository.ts:52-57` resuelve la etiqueta con `"es"` fijo. Se corrige a la
etiqueta del locale de esa traducción. **No se concatenan ambos idiomas**: `gemini-embedding-001` ya
es multilingüe (`Juices` y `Jugos` caen cerca solos), la consulta del usuario se vectoriza en un solo
idioma, y concatenar diluye la señal. El esquema ya modela la dimensión locale; usarla es más limpio
que duplicar.

### Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Generar los módulos TS desde la tabla con un script | Conserva el tipado, pero cambiar una etiqueta exige correr el script y desplegar los tres repos |
| Endpoint `/v1/categories` que los demás consumen | Salto de red y arranque en frío de Cloud Run para leer 14 filas; ya descartada en `catalogo-unificado-miniapp.md:77-83` |
| Solo desduplicar en TypeScript, sin tocar la BD | No arregla la integridad ni la jerarquía, y el backend Python se queda fuera |
| Dejar las etiquetas en `next-intl` | No hay `NextIntlClientProvider` montado y las tarjetas se renderizan en árbol cliente (`catalogo-unificado-bitacora.md:24-28`) |

## Esquema objetivo

```
category_normalize(text)        función IMMUTABLE: minúsculas + trim + sin diacríticos
categories                      key PK, parent_key → self, level, is_active, sort_order
category_translations           (category_key, locale) PK, label, label_normalized
category_aliases                alias PK, alias_normalized, category_key  (sinónimos de búsqueda)
category_labels                 VISTA: el contrato de lectura de los tres repos
category_subtree_keys(key)      una clave y sus hijas activas
category_keys_matching(query)   claves cuya etiqueta, alias o clave coincide con el texto

posts                           + FK category, FK compuesta (sub_category, category)
```

El nombre sigue la convención del esquema —sustantivo simple, y prefijo solo para pertenencia—, así
que la simetría con lo que ya existe es exacta: `posts` → `post_translations`, `categories` →
`category_translations`.

Se descartó `taxonomies` + `terms` (el modelo de WordPress): una *taxonomía* es el sistema completo,
y aquí cada fila **es una categoría**. Permitiría meter `sellers.category` al mismo sistema, pero
cuesta un JOIN extra en los tres repos por un beneficio que hoy no existe. Si algún día hacen falta
varias taxonomías, el camino es aditivo: una tabla `taxonomies` y una columna `categories.taxonomy_key`
con default `'product_category'`.

`category_aliases` existe **por la búsqueda**, no por deuda: hoy no hay sinónimos en ninguna
parte, así que `?q=pan`, `?q=bread` y `?q=zumo` devuelven 0.

**No confundir con `sellers.category`** (valor actual `'Food'`): es otra taxonomía y no se toca.

## Slices

### Slice 1 — La taxonomía vive en la base *(entregado)*

Aditivo y reversible. **Ningún consumidor cambia de comportamiento todavía.**

- **Backend (Alembic):** migración `0026` con las tres tablas, la vista, las tres funciones, el seed y
  los FKs sobre `posts`.
- **Web (dominio):** `src/domain/entities/post/taxonomy.ts` puro + `taxonomyFallback.ts`.
- **Web (infra):** puerto, repositorio Postgres y lectura cacheada con `unstable_cache`.
- `category.ts`, las etiquetas y `CategoryTag` **se quedan intactos**; se sustituyen en el slice 2.

**Criterios de aceptación:**
1. `alembic upgrade head` crea las tablas, la vista y las funciones, y siembra 7 categorías, 14
   traducciones y los alias, dejando una sola cabeza.
2. Los 14 productos pasan los nuevos FKs **sin que la migración modifique ni una fila**.
3. `alembic downgrade -1` deja `posts` exactamente igual.
4. Insertar una sub-categoría colgada de otra sub-categoría falla con el mensaje del trigger.
5. Renombrar una clave actualiza posts, traducciones y alias en un solo comando.
6. `getTaxonomy()` devuelve las 7 claves; con la BD caída devuelve el fallback y avisa.
7. Con las tablas ausentes, `pnpm run build` y la home siguen funcionando.

### Slice 2 — La etiqueta se resuelve en el servidor *(entregado)*

- `mapPostsToCards` recibe `locale` + taxonomía y emite la etiqueta ya resuelta; `CategoryTag` pasa a
  recibir `label` y se vuelve tonto. **Arregla el bug de hoy**: las tarjetas salen en español aun en
  `/en`, contradiciendo a `PostDetail`.
- `/publicar` alimenta sus selectores desde la tabla, **encadenados** (la sub-categoría se filtra por
  la categoría elegida). Va en este slice y no después porque el FK compuesto convierte una
  combinación inválida en un 500.
- `PostgresPostEmbeddingRepository` resuelve la etiqueta por `t.locale` en el propio SQL.
- Se retiran `category.ts` y `postCategoryLabels.ts`.
- **`migrateProductsToPosts.ts` no se toca**: `legacyCategory`/`legacySubCategory` conservan su firma
  y lanzan con un mensaje accionable (ver "Deuda conocida").

### Slice 3 — Búsqueda y jerarquía en la base *(entregado — repos B y C)*

- `category_keys_matching` en los dos fallbacks ILIKE, `category_subtree_keys` en los dos filtros por
  categoría.
- Caché en `CatalogService` (NestJS, singleton + TTL + promesa `inFlight` + warm-up).
- La traducción clave→etiqueta sale de zod (`product.schema.ts`) y pasa a un `product.presenter.ts`.
- `prompts/hazlo_sano.py` deja de meter `CATEGORY: ALIMENTACION` en el prompt del LLM.
- **En Python no hay caché**: la etiqueta se resuelve con `LEFT JOIN` en la proyección del
  repositorio. Son 14 filas indexadas por clave primaria, así que el JOIN sale más barato que
  mantener un TTL coherente entre procesos — y de paso arregla a la vez el prompt y el texto del
  embedding, que leen `Product.category`.

### Slice 4 — El miniapp habla el idioma del usuario *(entregado — repo C)*

- `locale` de punta a punta (hoy `useTelegram.ts` captura `language_code` y no lo usa).
- `GET /v1/catalog/categories?locale=` — hoy no hay forma de descubrir la taxonomía.
- Chips de filtro por categoría y sub-categoría en el miniapp.

### Slice 5 — Administrar la taxonomía sin migración *(siguiente)*

- `/admin/catalogo`: alta, baja y renombre + `revalidateTag("catalog-taxonomy")`.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El FK rechaza una publicación en producción | La allowlist actual es subconjunto estricto del seed, y este repo es el **único** escritor |
| La migración falla a mitad | Todo en una transacción; el gate de verificación aborta **antes** de tocar constraints |
| Los tres repos caen si las tablas no existen | `FALLBACK_TAXONOMY` en los tres, ante error o 0 filas, con `warn` |
| Estampida de consultas al arrancar | `React.cache` + `unstable_cache` (A), promesa `inFlight` (C), `asyncio.Lock` (B) |
| Se pierde el union type `PostSubCategory` | Aceptado. Lo cubren el FK, `resolveKeyStrict` y un test de contrato del seed |

## Orden de despliegue

**La migración `0026` es compatible hacia atrás con los tres repos sin desplegar ninguno**: nadie lee
las tablas nuevas todavía y el FK acepta todo lo que el código actual puede escribir.

```
1. Alembic 0026         solo. Ventana para correr los 3 sets de tests contra la BD migrada.
2. comida-justa         el escritor y el que más gana (/en arreglado). Slices 1 y 2 juntos.
3. HazloSano/dev api    lector; empieza a servir etiquetas por locale.
4. HazloSano/dev telegram  manda ?locale=. Conmutable con el paso 3.
5. bot-whatsapp         el menos urgente: sus rutas de categoría están dormidas.
```

Desplegar apps **antes** de la migración también funciona, gracias al fallback. Lo único que no puede
adelantarse es el slice 3: las funciones SQL deben existir antes de que el SQL las llame.

## Deuda conocida

- **`src/scripts/migrateProductsToPosts.ts` queda desactualizado.** La tabla `products` está fuera de
  alcance (sus datos ya viven en `posts`), así que el script no se migra. Como `tsconfig.json:27`
  incluye `**/*.ts` sin excluir `src/scripts/`, `legacyCategory`/`legacySubCategory` conservan su
  firma pero **lanzan** con un mensaje accionable. **Si vuelves a correr `pnpm run migrate:products`,
  hay que actualizar el script primero** para que lea la taxonomía de la base.
- Se prefiere lanzar antes que devolver `null`: `null` migraría los productos sin categoría y en
  silencio, que es justo el modo de fallo mudo que esta feature elimina.

## Enfoque de pruebas

- **Unit (Vitest):** el dominio `taxonomy.ts` (resolución estricta y permisiva, etiquetas por locale,
  orden, subárbol) y el fallback del repositorio.
- **Migración (SQL):** upgrade + downgrade + los invariantes que solo la base puede romper (trigger de
  profundidad, FK compuesto, cascada del renombre).
- **Behavior (Playwright):** escenarios en `src/e2e/catalogTaxonomy/catalogTaxonomy.feature`. Solo los
  del slice actual están detallados y conectados; el resto va con tag `@future`.
