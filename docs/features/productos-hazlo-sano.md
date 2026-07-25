# Feature: Productos de Hazlo Sano

Roadmap de slices para distinguir y administrar **productos** dentro de las publicaciones,
diferenciando los que vende **Hazlo Sano** (propios o de reventa) de los de la comunidad /
productores locales.

Este documento es el **checkpoint de revisión** que reemplaza las pausas paso a paso
(ver "Autonomous delivery mode" en `AGENTS.md`). La bitácora por slice se lleva en
`docs/features/productos-hazlo-sano-bitacora.md`.

## Problema / Savings / Why

- **Problema:** hoy toda publicación se ve igual; no se puede distinguir un producto de Hazlo
  Sano (propio o reventa) de un anuncio de la comunidad, ni administrarlos aparte.
- **Savings:** se reutiliza todo el pipeline de `Post` (formulario, media, búsqueda, feed,
  paginación) → cero duplicación; se evita construir comercio real que aún no se necesita.
- **Why:** da identidad a "Hazlo Sano" como vendedor y, a la vez, sigue impulsando lo local
  (dando crédito al productor local vía `origin`), que es el propósito del proyecto.

## Decisión de modelado

En lugar de un módulo/tabla de "productos" en paralelo (duplicaría ~90% de `Post`), se extiende
la entidad `Post` con **dos campos ortogonales**:

| Campo    | Tipo               | Default     | Significado |
|----------|--------------------|-------------|-------------|
| `kind`   | `"anuncio" \| "producto"` | `"anuncio"` | Qué es. `producto` **requiere** `price`. |
| `origin` | `text` nullable (allowlist en dominio) | `null` | De dónde/quién viene. `null` = comunidad sin especificar. |

**Por qué dos ejes y no un `kind` plano:** "producto de Hazlo Sano" = `kind = "producto"` **y**
`origin` de tipo `hazlo_sano_*`. Con ejes separados, "todos los productos" es una sola condición
(`kind = "producto"`) y el `origin` es reutilizable (mañana un `anuncio` oficial de Hazlo Sano).

### Vocabulario de `origin` (allowlist en dominio, no enum de BD)

Patrón `{rol}_{ámbito}`. Se guarda como `text` y se valida contra una constante del dominio, así
**agregar un valor futuro = editar la constante, sin migración**.

| Valor                 | Significado                          | ¿Solo admin? |
|-----------------------|--------------------------------------|--------------|
| `hazlo_sano_propio`   | Producción / marca propia de Hazlo Sano | Sí |
| `hazlo_sano_reventa`  | Hazlo Sano compra y revende          | Sí |
| `productor_local`     | Productor local, directo (comunidad) | No |
| `reventa_local`       | Revendedor local                     | No |
| `productor_foraneo`   | Productor foráneo, directo           | No |
| `reventa_foranea`     | Revendedor foráneo                   | No |

### Reglas derivadas

- **Admin gate:** solo un admin puede asignar valores `hazlo_sano_*`. Admin se determina por
  allowlist de correos en env `HAZLO_SANO_ADMIN_EMAILS` (no se introduce un sistema de roles).
  La validación es **en servidor**; la UI solo oculta el control.
- **Badges** (derivados, no se almacenan):
  - `🌿 Hazlo Sano` cuando `origin` empieza con `hazlo_sano_`.
  - `📍 Local` cuando `origin` es `productor_local` o `reventa_local`.

## Slices

### Slice 1 — Marcar y mostrar un producto de Hazlo Sano  *(entregado)*

Alcance end-to-end mínimo con valor.

- Dominio: `kind`/`origin` en tipos + DTO; allowlist de `origin`; `PostValidator`
  (enums válidos, `producto` ⇒ `price` requerido, `hazlo_sano_*` solo admin).
- BD: migración Drizzle → `posts.kind text not null default 'anuncio'`, `posts.origin text`.
  Compatible hacia atrás (posts existentes quedan `anuncio` / `origin = null`).
- Admin gate: helper `isAdmin(email)` contra `HAZLO_SANO_ADMIN_EMAILS`.
- `/publicar`: selector `kind`; selector `origin` visible **solo si eres admin**.
- Badge en detalle/tarjeta según `origin`.

**Criterios de aceptación:**
1. Un admin publica con `kind = producto` + `origin = hazlo_sano_propio` y el detalle muestra el badge `🌿 Hazlo Sano`.
2. Un usuario no-admin no ve el selector de `origin`, y si lo fuerza vía request, el servidor ignora/rechaza `hazlo_sano_*`.
3. Publicar `kind = producto` sin `price` falla con error de validación claro.
4. Publicaciones existentes siguen funcionando como `anuncio` sin badge.

### Slice 2 — Listado de productos  *(entregado)*

- **De momento la página de productos solo muestra productos de Hazlo Sano** (`kind = "producto"`
  y `origin` de tipo `hazlo_sano_*`). El listado general de todos los productos y el filtro por
  `origin` (Local, foráneo, etc.) se evaluará más adelante.
- Reutiliza la paginación/consulta existente añadiendo un `WHERE` (mismo SQL, filtro compuesto).
- Rutas `/productos` y `/productos/page/[page]`; el link "Productos" del header apunta ahí.
- Badge de procedencia en la tarjeta del listado (diferido del Slice 1).

**Criterios de aceptación:**
1. `/productos` lista un producto con `origin` `hazlo_sano_*` y **no** lista productos de la comunidad
   ni anuncios de Hazlo Sano.
2. Cada tarjeta del listado muestra su badge de procedencia.
3. Sin productos de Hazlo Sano, la página muestra un estado vacío en vez del grid.

### Slice 3 — Reportes por `origin`  *(actual)*

- Vista admin en `/admin/productos` con el conteo de **productos** (`kind = "producto"`) agrupado por
  `origin`, más su participación sobre el total. Los anuncios no se cuentan.
- El armado del reporte vive en el dominio (`buildOriginReport`): lista **todos** los `origin` de la
  allowlist aunque estén en cero, más una fila para los que no lo tienen especificado.
- Acceso por el mismo gate del Slice 1 (`isAdmin` contra `HAZLO_SANO_ADMIN_EMAILS`); a un no-admin la
  página le responde 404, no 403.

**Criterios de aceptación:**
1. Un admin ve en `/admin/productos` el conteo de productos por `origin`, con total y participación.
2. Publicar un producto más con un `origin` sube en uno **solo** esa fila.
3. Los `origin` sin productos siguen listados en cero.
4. Un usuario no-admin no ve el reporte.

## Fuera de alcance (por ahora)

Comercio real: stock/inventario, variantes/SKU, carrito, checkout, órdenes. Si se necesita más
adelante, *ahí* se evaluará extraer los productos a su propio modelo, con lo aprendido para entonces.

## Enfoque de pruebas

- Unit (Vitest): `PostValidator` (enums, `producto`⇒`price`, admin gate), helper `isAdmin`.
- Behavior (Playwright): escenarios del Slice 1 en `src/e2e/publishProduct/publishProduct.feature`.
- Integración: persistencia de `kind`/`origin` en PostgreSQL vía el repositorio.
- Los escenarios de slices futuros quedan escritos como esqueleto con tag `@future` (no corren en CI).
