# Feature: quién produce lo declara al publicar (y luego, quién está cerca)

`/productores-locales` existe desde el slice 1 de `docs/features/secciones-comunidad.md` y su regla
era buena: una tienda entra al directorio el día que publica algo que ella misma hace, sin que nadie
la marque a mano. El problema era que **nadie podía publicar eso**: el selector de procedencia vivía
detrás de `isAdmin`, así que la única persona que podía declarar "esto lo hago yo" era quien
administra el sitio, a mano, publicación por publicación.

Este documento fue el **checkpoint de revisión** del roadmap. Escrito el **2026-08-02** con los
datos de la base a esa fecha; los cinco slices quedaron entregados el **2026-08-03**. La bitácora
de al lado (`productores-locales-bitacora.md`) narra lo que enseñó cada uno.

## Problema / Savings / Why

- **Problema:** no sabemos cuándo una tienda de usuario es productora local. El dato que lo
  decidiría (`origin`) no se le pregunta a quien publica: el selector solo lo ve un admin, así que
  todo lo que publica la comunidad nace con `origin = null` y ninguna tienda puede entrar nunca al
  directorio de productores.
- **Savings:** le quita al admin el trabajo de andar actualizando registros a mano para que el
  directorio tenga a alguien. El dato lo pone quien lo sabe —el vendedor— en el momento en que ya
  está llenando el formulario, y el directorio se llena solo.
- **Why:** para poder mostrar **productores locales cerca de donde está el visitante**. Sin saber
  quién produce, no hay a quién ordenar por cercanía; los dos ejes —quién lo hace y a qué distancia
  está— son la misma promesa: comprarle a quien lo hace, aquí.

## Estado al escribir (2026-08-02)

| | |
|---|---|
| Publicaciones | 24: 14 productos + 10 anuncios |
| Productos con procedencia | **13**, todos `hazlo_sano_*` (10 propio, 3 reventa) |
| Productos con procedencia de la comunidad | **0** (los 4 valores comunitarios no los usa nadie) |
| Productos sin procedencia | **1** (anterior a la regla; los otros 10 `null` son anuncios) |
| Tiendas con dirección pública | **1**, `hazlo-sano` |
| Tiendas listadas en `/productores-locales` | **0** — estructuralmente, no por falta de vendedores |
| Sucursales con coordenadas | **1** (`Restaurante Hazlo Sano`, 18.60054 / −96.68721) |
| Selector de procedencia | visible **solo para admin** (`PublishForm.tsx:152`) |

## Lo que NO cambia (y por qué)

- **La tienda sigue sin declarar qué es.** `origin` describe **la publicación, no al vendedor**
  (ver `src/domain/entities/seller/directory.ts`). La panadería del pueblo hornea su pan y en el
  mismo mostrador revende refrescos: etiquetar la tienda mentiría sobre medio catálogo. Además una
  bandera puesta una vez al abrir la tienda se pudre; la derivada se corrige sola con la siguiente
  publicación.
- **Los dos directorios se siguen solapando.** Productores ⊂ negocios: quien produce también es un
  negocio del pueblo y aparece en las dos listas. No es un bug.
- **`resolveOriginForUser` ya estaba lista.** La defensa de servidor (`origin.ts:75`) se escribió
  justo para el caso de un no-admin mandando un `origin`: filtra los `hazlo_sano_*` y deja pasar el
  resto. Al formulario solo le falta enseñarlos.

## Lo que SÍ cambia: el ámbito se deriva, no se declara

Local o lejano **no es opinión del vendedor, es una distancia**. Mientras los kilómetros sigan
siendo sostenibles —nutrición, medio ambiente, costo, desperdicio— sigue contando como local.

Y hay una asimetría que decide el modelo:

- Si **yo lo hago**, viene de donde yo estoy → las coordenadas de mi sucursal lo contestan solas.
  Preguntárselo al vendedor es invitarlo a equivocarse.
- Si **lo revendo**, el producto viajó desde otra parte → mis coordenadas no dicen nada. Solo yo sé
  de dónde lo traje, así que hay que preguntarlo.

Por eso la allowlist se colapsa de seis valores a cinco, y el eje `ámbito` desaparece del lado del
productor:

| Valor | Quién lo pone | Qué significa |
|---|---|---|
| `hazlo_sano_propio` | admin | lo hace Hazlo Sano |
| `hazlo_sano_reventa` | admin | lo revende Hazlo Sano |
| `productor` | vendedor | lo hace quien lo vende; **local o no lo dice la distancia** |
| `reventa_cercana` | vendedor | lo revende y lo consiguió cerca |
| `reventa_lejana` | vendedor | lo revende y viene de muy lejos |

Se colapsa **ahora** porque hoy sale gratis: ninguna fila usa los cuatro valores comunitarios (las
13 con procedencia son `hazlo_sano_*`), `posts.origin` es `text` validado por la app —no un enum de
BD, así que no hay migración— y el backend Python **no lee la columna** (solo la creó, migración
`0022`). En cuanto el directorio se llene, deja de ser gratis.

### El radio sostenible: 50 km

`SUSTAINABLE_RADIUS_KM = 50`, medido contra el ancla de la comunidad. Cubre Córdoba (~40 km) y
Orizaba (~55 km al límite): la cuenca real de abasto de la zona, entrega el mismo día, sin que la
fruta pierda un día en carretera. Es una constante del dominio con nombre, no un número suelto en
una consulta, justamente para que mover el criterio sea una decisión y no un `sed`.

La base ya lo soporta sin trabajo extra: `branches.location` es `geography(POINT,4326)` de PostGIS,
así que `ST_DWithin(..., 50000)` responde en metros.

### Consecuencia: la insignia deja de mentir

Hoy `ProvenanceBadge` dice **"Local"** para `productor_local` y `reventa_local`. Con el ámbito
derivado, un `productor` no puede afirmar locación sin consultar su distancia, y una tarjeta de
listado no va a arrastrar un `ST_Distance` por fila. Así que la insignia dice lo que sí sabe con el
dato que tiene:

| Valor | Insignia |
|---|---|
| `hazlo_sano_*` | 🌿 Hazlo Sano *(sin cambio)* |
| `productor` | Lo hace quien lo vende |
| `reventa_cercana` | Local |
| `reventa_lejana` | *(sin insignia)* |

Es una insignia más honesta que la de hoy: "lo hace quien lo vende" es la afirmación que el vendedor
respalda, y la locación se resuelve donde importa —el directorio y, después, el orden por cercanía—.

### Dónde vive el cálculo

En **una sola consulta**: el filtro del directorio de productores. Todo lo demás (insignia, reporte
de `/admin/productos`, sitemap) sigue leyendo `origin` a secas.

## Confianza

Se **confía en lo que declare el vendedor** sobre el rol y sobre de dónde trae lo que revende, sin
revisión previa. Es una decisión explícita: la comunidad es chica, el costo de una declaración falsa
es bajo y una cola de aprobación mataría el ahorro que justifica la feature. Lo que **no** se deja a
la declaración es la distancia, porque esa sí la sabe la base.

## Redacción: dos textos para el mismo valor

En la insignia y en el reporte de `/admin/productos`, la procedencia es un **nombre**. En el
formulario es una **pregunta al vendedor**, y "reventa lejana" no es español que alguien use para
hablar de su propio changarro. El catálogo gana una segunda redacción para el selector:

| Valor | Nombre (reporte) | Pregunta (formulario) |
|---|---|---|
| `productor` | Producción propia | Yo lo hago o lo cultivo |
| `reventa_cercana` | Reventa cercana | Se lo compro a alguien de aquí cerca |
| `reventa_lejana` | Reventa lejana | Lo traigo de muy lejos |

Son **tres** opciones para un vendedor —una sola pregunta, no dos— y cinco para el admin.

## Slices

### Slice 1 — el vendedor declara la procedencia de su producto *(entregado)*

**Alcance:**

- `POST_ORIGINS` pasa de seis valores a cinco; el ámbito del productor deja de existir como dato.
- El selector de procedencia deja de ser admin-only: quien publica un **producto** lo ve siempre,
  con **tres** opciones si es vendedor y cinco si es admin.
- La procedencia es **requerida para `kind === "producto"`**, junto a la regla del precio que ya
  vive en `PostValidator.validateKindAndOrigin`. Un **anuncio** no la pregunta.
- `/productores-locales` lista a quien publicó algo con `origin = 'productor'` **y** tiene una
  sucursal dentro de los 50 km del ancla de la comunidad.
- La insignia se ajusta a lo que cada valor puede afirmar (tabla de arriba).
- Las publicaciones ya existentes no se tocan: el producto sin procedencia sigue sin insignia.

**Criterios de aceptación:**

1. Un vendedor publica declarando "Yo lo hago o lo cultivo" y su tienda aparece en
   `/productores-locales` sin que nadie toque la base — y sigue apareciendo en `/negocios-locales`.
2. Una tienda **sin sucursal** que publica lo mismo **no** entra a productores: sin ubicación no hay
   distancia que verificar. Es el incentivo para completar la tienda.
3. Una tienda a más de 50 km del ancla tampoco entra, aunque publique como `productor`.
4. Un vendedor no puede declarar `hazlo_sano_*`: no se le ofrece, y si fuerza el request, el
   servidor lo descarta y el producto se rechaza por quedarse sin procedencia.
5. Un producto sin procedencia no se publica; un anuncio se publica sin que se le pregunte.
6. El texto del selector es la pregunta del vendedor; el del reporte sigue siendo el nombre.

**Fuera de alcance a propósito:** corregir la procedencia de algo ya publicado. `EditPostForm` no
tiene el campo (ni lo tenía para el admin), así que el hueco no lo abre este slice. Va al slice 2.

### Slice 2 — corregir la procedencia de lo ya publicado *(entregado)*

El mismo selector en `EditPostForm`, con las mismas reglas de rol. Es lo que vuelve reversible una
declaración equivocada y lo que deja al admin arreglar una falsa sin entrar a la base. También es
por donde el único producto viejo sin procedencia puede ponerse al día.

### Slice 3 — la distancia en el producto *(entregado)*

Mostrar a qué distancia está lo que se está viendo: **metros por debajo de 1 km, kilómetros por
encima**. La base ya lo soporta: `branches.location` es un `geography(POINT,4326)` de PostGIS y
`ST_Distance` sobre `geography` devuelve **metros** sin más trabajo.

La ubicación del visitante ya está medio resuelta y conviene dejarlo escrito:

- **El bot ya la guarda.** `users.last_latitude`, `users.last_longitude` y `location_updated_at`
  existen desde la migración `69113f019ca5` del backend, y el espejo Drizzle del web ya las declara
  (`auth.ts:19`). Para quien haya hablado con el bot de WhatsApp, la ubicación está en la base sin
  pedir nada.
- **El web ya sabe pedirla.** `AddBranchForm.tsx:34` usa `navigator.geolocation.getCurrentPosition`
  con su estado de "localizando / listo / falló". Es el mismo componente que hay que reusar para el
  visitante, no uno nuevo.
- Queda abierto qué se enseña a un visitante anónimo que niega el permiso, y qué pasa con lo
  publicado por alguien **sin tienda**: hoy no tiene ubicación de ninguna clase.

### Slice 4 — buscar por cercanía, con red de seguridad *(entregado)*

El listado y la búsqueda ordenan por distancia. Y la regla que pidió el usuario: **si no hay nada
cerca, no se devuelve una página vacía** — se muestra lo lejano, diciendo que está lejos. Un
directorio vacío es peor que uno honesto.

### Slice 5 — mapa de tiendas al buscar un producto *(entregado)*

Un mapa que sitúe las tiendas que venden lo buscado, para decidir por cercanía viéndolo en vez de
leyendo una cifra.

## Pendiente del usuario

- Nada bloquea el slice 1.
- **Resuelto:** quien niega el permiso ve el catálogo por fecha descendente, como siempre, y una
  línea que lo dice. No se le insiste.
- El ancla de la comunidad se fijó en las coordenadas de la sucursal existente (18.60054 / −96.68721).
  Cuando el sitio sirva a más de un pueblo, deja de ser una constante y pasa a ser un parámetro.

## Enfoque de pruebas

- **Unit (Vitest):** qué procedencias se le ofrecen a cada rol (corrida de escritorio sobre los seis
  valores × 2 roles) y la regla de "un producto exige procedencia" en `PostValidator`.
- **Component (Vitest):** el formulario pinta el selector para un no-admin y lo esconde en un
  anuncio; las etiquetas son las de la pregunta, no las del badge.
- **Behavior (Playwright):** un vendedor publica declarando que lo hace él, y su tienda aparece en
  `/productores-locales` sin intervención de nadie.
