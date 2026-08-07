# Pendientes

Registro único de lo que queda abierto, para no tener que reconstruirlo leyendo siete bitácoras.
Cada punto apunta a su roadmap. Actualizado: **2026-08-07**.

## Estado de las ramas

| Rama | Contenido | Validación |
| --- | --- | --- |
| `dev` | base | — |
| `feat/design-system-pilares` | 6 commits: slices 3–7 del design system | 854 pruebas, typecheck 0, lint limpio, build ✅ |
| `feat/traducciones-contenido` | +1 comm.: slices 2–3 de i18n (sale de la anterior) | 893 pruebas, typecheck 0, lint limpio, build ✅ |

Ninguna está subida ni tiene PR. `feat/traducciones-contenido` **contiene** el design system.

---

## Requiere una decisión tuya

### 1. `UNIQUE(post_id, locale)` no existe en la base

`docs/database.md:27` y `docs/features/i18n.md:89` lo dan por hecho, pero **ninguna migración lo
crea** (`0021` solo hace `create_index`). Tampoco hay unicidad sobre `slug`.

Hoy está mitigado en el código: el `INSERT` de traducciones lleva su `WHERE NOT EXISTS` en la misma
sentencia, y el slug se desambigua contando. Pero la base no lo impediría por su cuenta.

Añadirlo es una **migración Alembic sobre la base compartida**, que es irreversible: no la ejecuté.
Vive en `bot-whatsapp/backend`.

### 2. Traducciones automáticas ya escritas en producción

Las 23 publicaciones tienen fila `en` generada por Gemini, con slug y embedding. Están auditadas
(sin duplicados, sin títulos sin traducir, sin estructura aplastada), pero **nadie las ha leído una
por una**. Vale la pena revisar al menos los productos que se venden.

Deshacer todo: `DELETE FROM post_translations WHERE locale = 'en';`

---

## Búsqueda

**La búsqueda semántica no está hecha.** Ver `docs/features/busqueda-semantica.md` (roadmap nuevo,
sin empezar). Resumen: el embedding existe, está indexado y lo usan el chatbot y las publicaciones
relacionadas — pero la caja de búsqueda del sitio sigue siendo `ILIKE '%término%'`.

Medido contra la base: `pán` → 0 resultados, `panes` → 0, y `pan` en inglés trae «panela» y
«Pancakes». Además el filtro de idioma es estricto **sin respaldo**, así que una publicación sin
fila `en` es invisible al buscar en inglés.

De `busqueda-relevante-bitacora.md` sigue pendiente:
- Distancia en `/tienda/[handle]`, el último hueco de cercanía del sitio.
- Instrumentar qué se busca: hoy no hay **ningún** dato sobre términos ni sobre búsquedas sin
  resultados.

---

## i18n / traducciones

Ver `docs/features/i18n.md` y su bitácora. Slices 0–4 hechos.

- **`LanguageSwitcher` en la ficha de una publicación.** El slice 4 (URLs localizadas) se hizo
  *antes* de que existiera contenido en inglés. Ahora que cada idioma tiene su propio slug, cambiar
  de idioma en `/suero-natural` debería llevar a `/en/natural-electrolyte-drink`, no al inicio.
  **Es el punto más urgente de esta lista**: es una regresión visible ahora que hay traducciones.
- **Sitemap, RSS y `llms.txt` siguen fijando español** (`PostgresSitemapRepository.ts:18`,
  `rss.xml/route.ts`, `llms.txt/route.ts`). Con 23 traducciones reales ya hay motivo para listarlas.
  Hay que actualizar también `docs/features/seo.md`, donde está escrito por qué hoy solo se lista
  español.
- **Slice 5 — tiendas y sucursales.** `sellers.name`, `sellers.description`, `branches.name` y
  `branches.address` siguen en un solo idioma. Requiere migración Alembic (`seller_translations`,
  `branch_translations`). Hoy hay **una sola tienda**, así que no corre prisa.
- **`post_media.alt` no se traduce** y hoy recibe el título español (`publicar/actions.ts:146`).
  Es texto que leen los lectores de pantalla y los buscadores.
- **`docs/database.md` está desactualizado**: describe 3 tablas, dice que `posts.id` es `uuid`
  cuando es `text`, y no menciona `tags`, `embedding`, `category` ni `seller_id`.

---

## Design system

Ver `docs/features/design-system.md`. Slices 1–7 hechos.

- **Barrido de tipografía.** `Heading` y `Text` existen y están probados, pero solo los consumen las
  páginas de pilares. Quedan ~250 `text-*` escritos a mano en el resto del árbol.
- **Barrido de `rounded-*`.** `Surface` cubre las tarjetas; la cabecera, la paginación y el mapa
  siguen decidiendo su propio radio.
- **`Alert` no lo usa nadie.** El primitivo existe con su `role` por tono y su etiqueta obligatoria,
  pero ninguna pantalla lo consume todavía. Los mensajes de error de `/publicar` son el primer
  candidato natural.
- **Estados de formulario.** `TextField` y `TextArea` quedaron fuera del anillo de foco unificado a
  propósito: ahí el color comunica el estado de validación, no solo el foco. Unificarlos pide
  revisar el sistema de estados de formulario, que es su propio trabajo.
- **Los componentes compartidos siguen en `src/infra/UI/components/`.** `AGENTS.md` dice que su
  sitio es `src/presentation/`; la mudanza está pendiente desde antes de este trabajo.

---

## Deuda transversal encontrada de paso

- **Los tests no se typechequean.** `tsconfig.json` excluye `**/*.test.ts(x)`. Al añadir un campo
  requerido a `CardMappingContext`, los tests siguieron compilando y **pasando por accidente**.
  Un cambio de contrato no falla hasta que alguien ejecuta la suite, y puede pasar en verde por la
  razón equivocada. Merece decidirse a conciencia: incluirlos tiene coste, excluirlos también.
- **`.next/dev/types` se corrompe** cuando se interrumpe el dev server, y entonces `pnpm typecheck`
  falla con ~20 errores que no son del repo. Se arregla borrando la carpeta. Confunde bastante
  cuando aparece por primera vez.
