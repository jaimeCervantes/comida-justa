# Búsqueda semántica — el motor que el sitio todavía no usa

> **Estado: no empezado.** Este documento es el roadmap que `docs/features/search/001-2026-08-05-busqueda-relevante.md`
> dejó anunciado («cambiar el motor es otra conversación y otro roadmap»). Nada de lo de aquí está
> implementado.

## Context

### Problem

El sitio **ya tiene** una búsqueda semántica montada, indexada y funcionando. Simplemente no la usa
la caja de búsqueda.

Lo que existe hoy:

| Pieza | Estado | Quién la usa |
| --- | --- | --- |
| `post_translations.embedding` (vector 768) | **46 filas, 0 sin indexar** (23 `es` + 23 `en`) | — |
| `search_posts_semantic(embedding, locale, fallback, …)` | Existe (Alembic `0024`) | **El chatbot** |
| `recommend_posts(...)` | Existe (Alembic `0025`) | El chatbot |
| `getRelatedPosts()` con `pt.embedding <=> r.embedding` | Funciona | **«Publicaciones relacionadas»** del detalle |
| `/buscar` — `PostgresSearchPostRepository` | `title ILIKE '%término%' OR content ILIKE '%término%'` | **La caja de búsqueda del sitio** |

O sea: el vector con el que el bot encuentra un producto y el que ordena las publicaciones
relacionadas es el mismo que la caja de búsqueda **ignora**. `search_posts_semantic` aparece en
`src/` únicamente dentro de `src/e2e/testUtils/` y en comentarios.

### Lo que falla hoy, medido

Consultas reales contra la base compartida (2026-08-07), con las 23 publicaciones ya traducidas:

| Término | Locale | Resultados | Qué demuestra |
| --- | --- | --- | --- |
| `pan` | es | 10 | ✅ el caso feliz |
| `bread` | en | 9 | ✅ funciona **gracias al backfill de traducciones**, no al motor |
| `Pan` | es | 10 | ✅ `ILIKE` ya ignora mayúsculas |
| `pán` | es | **0** | ❌ un acento de más y desaparece todo |
| `panes` | es | **0** | ❌ el plural no encuentra el singular |
| `bread` | es | **0** | ❌ sin respaldo de idioma (ver abajo) |
| `pan` | en | **2** | ❌ falsos positivos: empareja «**pan**ela» y «**Pan**cakes» |

Tres defectos distintos:

1. **Sin normalización.** `pán` y `panes` devuelven cero. No hay `unaccent` ni lematización.
2. **Subcadena, no palabra.** `%pan%` cae dentro de «panela» y «Pancakes». La precisión empeora
   cuanto más corto es el término.
3. **Sin concepto.** «algo para dormir mejor» no encuentra la publicación sobre el sueño, aunque su
   embedding esté a un coseno de distancia. Es justo lo que el chatbot sí sabe hacer.

### El filtro de idioma es estricto y no tiene respaldo

`PostgresSearchPostRepository.ts:118,131`:

```sql
WHERE t.post_id = p.id AND t.locale = ${locale} AND (t.title ILIKE … OR t.content ILIKE …)
```

No hay `fallback_locale`, a diferencia del backend Python
(`post_product.py:62-68`, que hace `DISTINCT ON` con respaldo) y a diferencia de
`resolvePostTranslation`, que el resto del sitio ya usa desde el slice 2 de i18n.

Consecuencia: **una publicación sin fila `en` es invisible en la búsqueda en inglés.** Antes del
backfill de traducciones eso significaba que buscar en inglés devolvía **cero resultados siempre**.
Hoy las 23 están traducidas, así que el problema quedó tapado — pero vuelve en cuanto alguien
publique y Gemini falle: la publicación existe, se puede abrir, y no aparece al buscarla en inglés.

### Savings

Que alguien que escribe «pan integral» con una tilde de más, o en plural, o describiendo lo que
quiere en vez de nombrándolo, encuentre el producto. Hoy se va con cero resultados y no hay forma de
saber cuántas veces pasa — porque tampoco se mide.

### Why

El catálogo es pequeño (23 publicaciones). Con un catálogo pequeño, cada búsqueda fallida es un
porcentaje enorme del tráfico útil, y el coste de no encontrar algo que **sí está** es máximo.

---

## Roadmap de slices

### Slice 1 — Búsqueda de texto completo, sin llamar a ningún proveedor

El 80 % del valor por 0 llamadas a API. `to_tsvector` / `websearch_to_tsquery` con la configuración
de idioma que corresponda resuelve los tres primeros defectos de una vez:

- lematización (`panes` → `pan`), que es lo que arregla los plurales;
- `unaccent` en la configuración, que arregla `pán`;
- coincidencia por **palabra**, que elimina «panela» y «Pancakes»;
- `ts_rank`, que da una relevancia real en lugar de «coincide el título → 0, si no → 1».

Ojo con dos cosas: la configuración de idioma debe elegirse por locale (`spanish` / `english`), y el
orden actual —relevancia, luego distancia, luego fecha, luego `id`— **se conserva**; solo cambia
cómo se calcula la relevancia. Ese orden se ganó en `busqueda-relevante` y no se toca.

**Criterios de aceptación.** `pán`, `panes` y `PAN` devuelven lo mismo que `pan`; `pan` en inglés
deja de traer «panela» y «Pancakes»; el orden sigue siendo explicable y estable.

### Slice 2 — Respaldo de idioma en la búsqueda

Que la caja de búsqueda use la misma regla que el resto del sitio: pedido → respaldo. Es coherencia,
y es lo que impide que una publicación recién creada sea invisible en inglés mientras su traducción
está pendiente.

**Criterios de aceptación.** Una publicación sin fila `en` aparece al buscar en inglés, mostrando su
texto español, y la tarjeta lo declara con `isTranslationFallback` (que ya existe desde el slice 2
de i18n).

### Slice 3 — Híbrido: texto completo + vector

Aquí entra el embedding. **No sustituye al texto completo, lo complementa**: una búsqueda solo
semántica pierde la coincidencia exacta —quien escribe «Suero natural» tal cual espera esa
publicación primero, no la más parecida en concepto—.

Las decisiones que este slice tiene que resolver, y que son la razón de que sea su propio slice:

- **Cuándo se vectoriza la consulta.** Un embedding por pulsación es inviable: la caja tiene 500 ms
  de rebote y un mínimo de 3 caracteres, así que serían llamadas por cada palabra a medio escribir.
  Candidatos: solo al enviar, solo cuando el texto completo devuelve pocos resultados, o con caché
  por término.
- **Cómo se fusionan los dos rankings.** `ts_rank` y distancia coseno no viven en la misma escala.
  Lo habitual es *reciprocal rank fusion* en vez de sumar puntuaciones.
- **Reusar `search_posts_semantic`** en lugar de escribir otra consulta: es la función que el bot ya
  usa, y duplicarla es garantizar que un día el sitio y el bot ordenen distinto.

**Criterios de aceptación.** «algo para dormir mejor» encuentra la publicación del sueño; «Suero
natural» sigue devolviendo esa publicación en primer lugar; y el coste por búsqueda está acotado y
declarado.

### Slice 4 — Medir qué se busca

Hoy **no hay ningún dato** sobre qué términos se escriben ni cuántos terminan en cero resultados.
Sin eso, cualquier mejora del motor es a ciegas y no se puede demostrar que sirvió.

Debería ir antes del slice 3 si se quiere justificar su coste con números en lugar de con intuición.

---

## Verificación

```bash
pnpm run test:run
pnpm run test:e2e:run          # src/e2e/busquedaRelevante/
pnpm run verify:embedding-space # que el sitio y el bot sigan compartiendo espacio vectorial
```

El riesgo específico de este roadmap: **si el sitio vectoriza la consulta con un modelo distinto al
del bot, la búsqueda seguirá "funcionando" y devolverá resultados sin sentido**, que es la peor
forma de romperse. `GeminiEmbeddingService.ts:5-15` explica por qué el modelo y la dimensión están
clavados; `verify:embedding-space` es lo que lo comprueba.
