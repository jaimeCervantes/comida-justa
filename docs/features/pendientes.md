# Pendientes

Registro único de lo que queda abierto, para no tener que reconstruirlo leyendo nueve bitácoras.
Cada punto apunta a su roadmap. **Última sesión: 2026-08-07.**

---

## Por dónde retomar

### 1. Una prueba e2e sin verificar — es lo primero

`src/e2e/localProducers/cardControls.spec.ts:98` — *«Entonces el submenú del header sigue quedando
por encima»*. Falló en la última corrida y **no se llegó a comprobar si es real o un falso
positivo**.

```bash
pnpm dev                     # en otra terminal, para calentar .next
npx playwright test src/e2e/localProducers/cardControls.spec.ts --reporter=list
```

**Hipótesis (sin confirmar):** arranque en frío. En esa corrida se había borrado `.next/dev`, y el
test hace `page.goto("/productos")` y espera `stores-map` con **15 s** de margen; compilar esa ruta
más el mapa —que es un import dinámico— se come ese presupuesto sin problema. Los otros dos fallos
de la misma corrida (`about.spec.ts` y `createPost.spec.ts`) resultaron ser exactamente eso: pasaron
en aislamiento sin tocar nada.

**Lo que haría dudar de la hipótesis:** el test va del **submenú del header**, y el Header es uno de
los componentes que se mudaron. Mover archivos no cambia CSS y el barrido de tipografía tocó
`Footer`, no `MobileNav` — pero conviene descartarlo mirando, no razonando.

Si resultara real, el sospechoso es el `z-50` del header contra los z-index que Leaflet inyecta en
sus paneles (está explicado en el comentario del propio test).

### 2. El dev server está apagado

Se detuvo a propósito: tras mudar veinte componentes devolvía **404 en todo**, porque Next mantiene
el manifiesto de rutas en caliente y la mudanza se lo rompió. `.next/dev` también se borró (se
regenera solo). Arráncalo con `pnpm dev`.

---

## Estado de las ramas

Ninguna está subida ni tiene PR. Cada una **contiene** a la anterior.

| Rama | Commits desde `dev` | Qué añade |
| --- | --- | --- |
| `feat/design-system-pilares` | 6 | Slices 3–7 del design system |
| `feat/traducciones-contenido` | 14 | + i18n slices 2–3, el arreglo del cambio de idioma en la ficha, y los 4 slices de búsqueda |
| `feat/mudanza-y-tipografia` | 16 | + la mudanza a `src/presentation/` y el barrido de tipografía |

Validación de la última: **930/930 unitarias**, `typecheck` 0, `lint` limpio, `check:i18n` limpio,
`build` compila. La e2e quedó con el punto 1 pendiente.

---

## Requiere una decisión tuya

### `UNIQUE(post_id, locale)` no existe en la base

`docs/database.md:27` y `docs/features/i18n.md:89` lo dan por hecho, pero **ninguna migración lo
crea**. Tampoco hay unicidad sobre `slug`.

Está mitigado en el código: el `INSERT` de traducciones lleva su `WHERE NOT EXISTS` en la misma
sentencia, y el slug se desambigua contando. La base no lo impediría por su cuenta.

Es una **migración Alembic sobre la base compartida** —irreversible— y vive en
`bot-whatsapp/backend`. No se ejecutó.

### Traducciones automáticas ya escritas en producción

Las 23 publicaciones tienen fila `en` generada por Gemini, con slug y embedding. Están auditadas
—sin duplicados, sin títulos sin traducir, sin estructura aplastada— pero **nadie las ha leído una
por una**. Vale la pena revisar al menos los productos que se venden.

Deshacer todo: `DELETE FROM post_translations WHERE locale = 'en';`

---

## Búsqueda

Los cuatro slices están entregados (`docs/features/busqueda-semantica.md` + bitácora): texto
completo, respaldo de idioma, rescate semántico y medición.

- **Índices** GIN sobre el `tsvector` y HNSW sobre el vector. Con 46 traducciones no hacen falta; es
  lo primero que se notará al crecer. **Requiere Alembic.**
- **La tabla de búsquedas.** Hoy la medición va al registro del servidor; el puerto
  `ISearchReporter` ya está para cambiar el destino sin tocar el caso de uso. **Requiere Alembic.**

  Mientras tanto: `grep '\[search\]' | grep 'emptyHanded=true'` responde qué se busca que no
  encontramos, y `grep 'strategy=semantic' | wc -l` dice cuántos embeddings se están pagando.
- **Caché del embedding por término**, si los datos muestran que el rescate es frecuente.
- **Distancia en `/tienda/[handle]`**, el último hueco de cercanía del sitio (viene de
  `busqueda-relevante-bitacora.md`).

---

## i18n / traducciones

Slices 0–4 hechos. Ver `docs/features/i18n.md` y su bitácora.

- **Slice 5 — tiendas y sucursales.** `sellers.name`, `sellers.description`, `branches.name` y
  `branches.address` siguen en un solo idioma. Requiere Alembic (`seller_translations`,
  `branch_translations`). Hoy hay **una sola tienda**, así que no corre prisa.
- **RSS y `llms.txt` siguen en español**, ahora por decisión y no por falta de contenido. Un canal
  RSS declara un solo `language`, así que servir los dos idiomas pide un segundo canal
  (`/en/rss.xml`), no mezclarlos. El sitemap sí lista ya los dos idiomas.
- **`docs/database.md` está desactualizado**: describe 3 tablas, dice que `posts.id` es `uuid`
  cuando es `text`, y no menciona `tags`, `embedding`, `category` ni `seller_id`.

---

## Design system

Slices 1–9 hechos. Ver `docs/features/design-system.md` y su bitácora.

- **221 `text-*` sueltos, deliberadamente.** Los que quedan están en `Button`, `Alert` y las stories
  —donde el tamaño **es** la variante que el primitivo define— y repartidos de uno en uno por rutas
  sin patrón compartido. Convertirlos sin una repetición detrás no gana nada. El barrido atacó lo
  que sí estaba copiado: 21 encabezados legales, la cabecera de esas páginas y el encabezado de
  columna del pie.
- **`rounded-*` en el mapa.** `Surface` cubre tarjetas y paneles y la paginación ya usa tokens;
  queda el mapa.

---

## Deuda transversal

- **Los tests no se typechequean.** `tsconfig.json` excluye `**/*.test.ts(x)`. Mordió **tres veces**
  en la última sesión: al añadir `fallbackLocale` a `CardMappingContext`, al añadir `defaultLocale` a
  `buildSitemap` y al cambiar la firma de `SearchPostsUseCase`. En los dos primeros los tests
  siguieron **pasando por accidente** —`undefined === undefined` daba la respuesta correcta por la
  razón equivocada—.

  **Medido: cuesta 32 errores hoy**, concentrados en `Card.test.tsx` (tipos laxos de `CardProps`),
  `saveSeo.test.ts` y un par de mocks de Vitest. Es acotado y cabe en una sesión. La forma menos
  invasiva es un `tsconfig.test.json` aparte y un script `typecheck:tests`, para no frenar el ciclo
  normal.

- **`.next/dev` se corrompe** cuando se interrumpe el dev server, y entonces `pnpm typecheck` falla
  con ~20 errores que no son del repo. Se arregla borrando la carpeta.

- **La e2e y el dev server compiten por el puerto 3000.** `playwright.config.ts` fija
  `reuseExistingServer: false` a propósito —para no adoptar el servidor de otro proyecto— así que la
  suite no arranca si ya tienes `pnpm dev` levantado. Dos salidas: `E2E_PORT=3100` (que el propio
  config documenta), o un config temporal con `reuseExistingServer: true` cuando el servidor que
  corre es de **este** proyecto. En esta sesión se usó lo segundo y se borró después.

- **La suite e2e completa tarda ~7 min** y roza los límites de ejecución. Partirla en dos mitades
  por carpetas funciona bien. Ojo: **el primer test tras borrar `.next` suele fallar** por compilar
  la ruta en caliente; conviene calentar con `pnpm dev` antes, o repetir el fallo en aislamiento
  antes de darlo por regresión.
