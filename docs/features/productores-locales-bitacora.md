# Bitácora — productores locales

Append-only. Una entrada por slice, con el **porqué**; el qué ya está en `git log`.

## Slice 1 — el vendedor declara el rol, la distancia decide el ámbito (2026-08-02)

### Objetivo

Que `/productores-locales` se llene solo. La regla del directorio era buena desde el slice 1 de
`secciones-comunidad` —entras el día que publicas algo que produces— pero el dato que la dispara no
se le pedía a nadie: el selector de procedencia estaba detrás de `isAdmin`, así que las 24
publicaciones de la comunidad nacieron con `origin = null` y el directorio llevaba 0 tiendas desde
que existe.

### Decisiones y por qué

**1. El ámbito se deriva, no se declara.** La conversación arrancó con "¿debería la tienda decir si
es productor o negocio?" y terminó en otro lado, que es donde tenía que terminar: local o lejano no
es opinión del vendedor, es una distancia. Y hay una asimetría que decide el modelo entero — si lo
**produzco**, viene de donde está mi tienda y mis coordenadas lo contestan solas; si lo **revendo**,
el producto viajó y mis coordenadas no dicen nada, así que solo yo lo sé. De ahí sale que se
pregunte una sola cosa (¿lo haces o lo revendes?, y si revendes, ¿de cerca o de lejos?) y que el
"productor foráneo" deje de existir como declaración.

**2. La allowlist se colapsó de 6 valores a 5.** Se hizo **ahora** porque hoy era gratis y mañana no:
ninguna fila usaba los cuatro valores comunitarios (las 13 con procedencia son `hazlo_sano_*`),
`posts.origin` es `text` validado por la app —no un enum de BD, cero migraciones— y se verificó que
el backend Python **no lee la columna**: solo la creó (`0022_2026-07-23_add_kind_and_origin_to_posts`).
En cuanto el directorio se llene, colapsar deja de ser gratis.

**3. El radio sostenible es 50 km, y vive en el dominio con nombre.** Cubre Córdoba (~40 km) y llega
a Orizaba (~55 km al límite): la cuenca real de abasto desde Tezonapa, ida y vuelta el mismo día.
Ese es el criterio pedido —kilómetros que sigan siendo sostenibles en nutrición, ambiente, costo y
desperdicio—. Está en `proximity.ts` como constante con nombre y no suelto en la consulta, para que
moverlo sea una decisión de negocio y no un `sed`.

**4. La insignia dejó de decir "Local" para un productor.** Fue la consecuencia que destapó el
colapso: si el ámbito se deriva, una tarjeta de listado tendría que arrastrar un `ST_Distance` por
fila para poder afirmar locación. En vez de eso afirma lo que el dato respalda —"🧑‍🌾 Lo hace quien
lo vende"— y la locación se resuelve donde importa: el directorio. Terminó siendo una insignia más
honesta que la anterior. `reventa_cercana` conserva el "📍 Local" porque ahí sí hay una declaración
que lo respalda.

**5. `validateNewPost` se separó de `validate`.** Este fue el hallazgo caro del slice. Poner "un
producto exige procedencia" dentro de `validate` rompió `UpdateOnePostUseCase`: la edición valida
con las mismas reglas pero **no recibe** el `origin` (cambia título, texto, precio y categoría), así
que editar cualquiera de los 13 productos existentes empezó a fallar por un campo que su formulario
ni siquiera muestra. Un error que no se puede corregir desde la pantalla es peor que el hueco que
cierra, así que la exigencia vive en `validateNewPost`, que solo llama quien publica.

**6. La tienda sin sucursal no entra a productores.** No es un efecto colateral, es el incentivo que
se buscaba: sin ubicación no hay distancia que verificar. Completar la tienda pasa a tener una
recompensa visible, y es la misma que hará falta para el orden por cercanía de los slices 3-5.

### Archivos tocados

- **Dominio:** `entities/post/origin.ts` (allowlist de 5, `isProducerOrigin`, `isNearbyResaleOrigin`,
  `originsForUser`), `entities/seller/proximity.ts` (**nuevo**: radio, ancla, predicado),
  `entities/seller/directory.ts` (doc del modelo), `schemas/PostValidator.ts` (`validateNewPost`),
  `entities/post/types.ts` (`IPostValidator`).
- **Use cases:** `createOnePost/createOnePostUseCase.ts` (pasa a `validateNewPost`), `mocks.ts`.
- **Infra:** `dataAccess/sellers/PostgresStoreDirectory.ts` (el `ST_DWithin` del radio),
  `UI/labels/postOriginLabels.ts` (nombre vs pregunta, `originOptionsFor`),
  `UI/components/ProvenanceBadge/ProvenanceBadge.tsx`.
- **App:** `publicar/PublishForm.tsx` (selector visible a todos en un producto, requerido,
  opciones por rol).
- **i18n:** `es.json` / `en.json` — claves de `origin` renombradas, bloque `originQuestion` nuevo,
  `provenance.producer` nuevo, `publish.origin` reescrito como pregunta.
- **Pruebas:** `origin.test.ts`, `proximity.test.ts` (**nuevo**), `postOriginLabels.test.ts`
  (**nuevo**), `PostValidator.test.ts`, `originReport.test.ts`, `ProvenanceBadge.test.tsx`,
  `CardForList.test.tsx`, `OriginReportTable.test.tsx`, `createOnePostUseCase.test.ts`.
- **e2e:** `localProducers/localProducers.feature` y `.spec.ts` (**nuevos**),
  `testUtils/seedStore.ts` (**nuevo**), `sellerStore.spec.ts`, `products.spec.ts`,
  `directories.spec.ts`, `productsReport.spec.ts`, `PublishProductPage.ts`,
  `publishProduct.feature`, `seo.feature`, `i18n.feature`.

### Comandos

```
pnpm run typecheck
pnpm run test:run
pnpm run lint
pnpm run test:e2e:run
npx biome format --write .   # tras el rename masivo de valores
```

### Validación

- `typecheck`: limpio.
- `test:run`: **624/624** (72 archivos). Antes del slice eran 600.
- `lint`: sin errores (queda 1 `info` preexistente sobre un Fragment en otra pantalla).
- `test:e2e:run`: **100 pasados, 3 saltados, 0 fallos** (6.5 min), contra la base compartida.

La primera corrida del e2e dio **4 fallos**, y valen como nota: los cuatro eran la misma causa, que
la etiqueta del campo pasó de `"Procedencia (Hazlo Sano):"` a `"¿De dónde viene lo que vendes?"` y
dos page objects buscaban el combobox por esa prosa (`getByRole("combobox", { name: /procedencia/i })`).
Se apuntaron a `#origin`: la etiqueta es una pregunta al vendedor y se va a volver a redactar cada
vez que se afine el tono, así que amarrar un selector a ella es amarrarlo a la redacción. El id es
el contrato.

**Escrito en la base compartida:** nada permanente. La corrida siembra tiendas, sucursales y
publicaciones con el prefijo `e2e-` y las borra en el `globalTeardown`; se verificó después con un
conteo directo — 0 tiendas, 0 sucursales y 0 publicaciones de prueba, y las 24 publicaciones reales
con la misma distribución de `origin` que antes del slice (10 anuncios sin origen, 1 producto sin
origen, 10 `hazlo_sano_propio`, 3 `hazlo_sano_reventa`). Ningún valor viejo quedó en la base, que es
lo que hacía gratis el colapso de la allowlist.

### Desvíos del roadmap

El roadmap se reescribió a media revisión, antes de escribir código: la versión aprobada primero
tenía al vendedor declarando las cuatro procedencias comunitarias. Los dos ajustes del usuario
—"foráneo solo si pasa de ciertos km" y "tal vez: lo traigo de muy lejos"— cambiaron el modelo, y
`docs/features/productores-locales.md` quedó reescrito antes de la primera línea de implementación.

### Recap

`/productores-locales` ya no depende de que un admin marque registros a mano: cualquiera que
publique un producto declara si lo hace o lo revende, y su tienda entra al directorio si tiene una
sucursal dentro de los 50 km del ancla de la comunidad. La allowlist quedó en cinco valores, la
insignia afirma solo lo que el dato respalda, y editar lo ya publicado sigue funcionando porque la
exigencia de procedencia solo aplica a lo nuevo. Falta que alguien pueda **corregir** una
procedencia mal declarada: el formulario de edición sigue sin el campo.

### Próximos pasos (opciones)

1. **Slice 2 — corregir la procedencia** (`EditPostForm` con el mismo selector y las mismas reglas
   de rol). Es el más corto y cierra el único camino sin retorno que dejó este slice.
2. **Slice 3 — la distancia en el producto** (metros / km). El bot ya guarda
   `users.last_latitude`, y `AddBranchForm` ya sabe pedir el permiso al navegador: se reusa, no se
   inventa.
3. **Slice 4 — orden por cercanía en la búsqueda**, con la red de seguridad de mostrar lo lejano
   cuando no hay nada cerca.

**Pendiente del usuario:** qué se le enseña a un visitante anónimo que niega el permiso de
ubicación (bloquea el slice 3, no los demás).
