# Ubicación fresca: la app vuelve a detectar dónde estás

## El problema

La ubicación del visitante se pide **una sola vez en la vida** y se conserva **un año**.

- `useShareLocation.ts:26` solo corre con un clic explícito. No hay `watchPosition`, ni
  recomprobación, ni `maximumAge`.
- `shareLocation` (`actions.ts:35`) escribe la cookie `hs_location` con
  `maxAge = 60 * 60 * 24 * 365` (`locationCookie.ts:10`).
- En cuanto la cookie existe, `LocationNotice` y `ShareLocationButton` **dejan de renderizarse**
  (`visitor ? null : <LocationNotice/>`). No queda ninguna vía para corregirla: hay que borrar la
  cookie a mano desde las herramientas del navegador.
- `users.location_updated_at` **se escribe** (`actions.ts:64`) y **nunca se lee**. La precedencia es
  "cookie primero, siempre" (`visitorLocation.ts:35`).

Quien se mueve —al trabajo, de viaje, a otro estado— sigue viendo las distancias desde donde estaba
la primera vez, sin señal de que el dato es viejo y sin forma de arreglarlo.

### Lo que dice la base (consultada el 2026-08-05)

Esto no es un riesgo hipotético. Las cinco ubicaciones que el bot de WhatsApp tiene guardadas en
`users.last_latitude` tienen esta antigüedad:

| ubicación | antigüedad |
| --------- | ---------- |
| 1         | 2.2 días   |
| 2         | 2.5 días   |
| 3         | 10.2 días  |
| 4         | 10.6 días  |
| 5         | **137 días** |

Las cinco están por encima de cualquier umbral razonable de frescura. A la última se le miden
distancias desde donde estaba hace cuatro meses y medio.

El resto del inventario, que acota qué es visible y qué no:

- **1 tienda** (`Hazlo Sano`) con **1 sucursal**, y esa sucursal está **exactamente en el ancla**
  (0.00 km de `COMMUNITY_ANCHOR`).
- **23 publicaciones**: 10 anuncios (`origin = null`), 10 `hazlo_sano_propio`, 3 `hazlo_sano_reventa`.
- **0 publicaciones con `origin = 'productor'`** → `/productores-locales` está vacío hoy **para
  todo el mundo**, no solo para quien mira de lejos. Es un problema de contenido, no de código, pero
  fija el alcance visible del slice 4.

## Lo que ahorra

Viajes en falso y compras descartadas por una distancia equivocada. Y el rescate del caso "estoy en
otra ciudad", que hoy no tiene respuesta ninguna.

## Por qué

La cercanía es el argumento entero del sitio: nutrición, transporte, costo y desperdicio
(`proximity.ts:3-14`). Una distancia falsa no es un dato incompleto, es un dato que engaña — y
engaña justo en la decisión que el sitio existe para ayudar a tomar.

## Cómo funciona la re-detección silenciosa

El permiso de geolocalización lo guarda el navegador **por origen, no por sesión**. Una vez
concedido a este dominio, `getCurrentPosition` **ya no vuelve a abrir el diálogo**. Ese hecho es lo
que hace posible todo lo demás: se puede preguntar la posición cuantas veces haga falta sin
molestar a nadie.

El orden es siempre **permiso primero, posición después**:

1. `navigator.permissions.query({ name: "geolocation" })`.
   - `"granted"` → se pide la posición en silencio.
   - `"prompt"` o `"denied"` → **no se llama a `getCurrentPosition`**. Hacerlo abriría el diálogo sin
     que nadie lo pidiera, que es lo que Chrome penaliza y lo que en móvil lleva a la gente a
     bloquear el permiso para siempre. Ahí la única vía sigue siendo el clic.
   - Si `navigator.permissions` no existe o lanza (Safari viejo) → se trata como `"prompt"`. Nunca se
     adivina hacia el lado ruidoso.
2. **Cuándo se dispara:** al montar (una carga completa) y al volver a la pestaña
   (`visibilitychange` → `visible`) si pasaron más de 15 min desde la última comprobación. Lo
   segundo es el caso "cerré la laptop en casa y la abrí en el trabajo": sin eso, una pestaña que
   nunca se recarga conserva la ubicación de ayer.
3. **Con qué opciones:** `{ maximumAge: 300_000, timeout: 8_000, enableHighAccuracy: false }`.
   `maximumAge` deja que el navegador entregue su propia posición cacheada → instantáneo, sin
   encender el GPS. `enableHighAccuracy: false` porque a escala de "¿a cuántos km está esta tienda?"
   la precisión de red basta y cuesta muchísimo menos.
4. **Cuándo se escribe:** solo si se movió **más de 500 m** o el dato guardado tiene **más de 6 h**.
   Sin este filtro, cada carga dispararía una escritura de cookie más un
   `revalidatePath("/", "layout")`, que invalida el árbol entero y provoca un segundo render
   completo. 500 m es el umbral porque por debajo de eso `describeDistance` (`distance.ts:18`) casi
   nunca cambia el texto que ve el usuario.
5. **Qué NO hace:** no pide permiso por su cuenta, no rastrea en segundo plano, no manda nada con el
   permiso denegado, y no escribe si no cambió nada.

## Decisiones tomadas antes de escribir código

- **Nada de `watchPosition`.** Mantiene el GPS activo y provocaría re-renders del servidor durante
  la sesión. El par "al cargar + al volver a la pestaña" cubre el caso real (te mueves con la
  pestaña cerrada o el teléfono en el bolsillo) sin pagar la batería.
- **Nada de botón de ubicación en el Header.** Se consideró y se descartó: el chip del slice 3
  aparece exactamente donde la distancia se está mostrando, con el contexto de por qué importa,
  en lugar de un icono mudo peleando espacio en una barra que en móvil ya lleva hamburguesa, logo,
  Publicar, avatar e idioma en `h-16` más la búsqueda debajo. `Header.tsx` no se toca.
- **Nada de React context ni `localStorage`.** Se conserva el diseño server-first que la bitácora de
  `productores-locales` justifica en sus líneas 395-398: meter la ubicación en un context volvería
  cliente al componente de tarjeta compartido, y con él a media pantalla de listados.

## Slices

### Slice 1 — La ubicación tiene edad, y la fuente más fresca gana

Sin fecha no se puede decidir nada de lo demás.

- `src/domain/entities/seller/locationFreshness.ts` (nuevo, dominio puro): `STALE_AFTER_MS` (6 h),
  `SIGNIFICANT_MOVE_METERS` (500), `RECHECK_AFTER_MS` (15 min), `metersBetween` (haversine),
  `isStale`, `needsRefresh`.
- `locationCookie.ts`: el valor pasa de `lat,lng` a `lat,lng,ts`. **Parseo legacy obligatorio**: una
  cookie de dos campos se acepta con `fixedAt: null`. Hay cookies de un año en navegadores reales y
  7 specs de Playwright que la escriben con dos campos.
- `visitorLocation.ts`: `readVisitorFix()` lee las **dos** fuentes y devuelve **la más fresca**, no
  la primera. Por fin se lee `location_updated_at`.
- `viewerLocationContext.ts`: `ViewerLocationContext` gana `fix`.

**Aceptación:** una cookie de hace 10 min gana sobre una columna de hace 2 días; una columna de hace
1 h gana sobre una cookie de hace 137 días; una cookie legacy sin fecha sigue funcionando y sigue
ganando cuando no hay columna.

### Slice 2 — Se vuelve a detectar sola

- `refreshLocation` en `actions.ts`, con escritura **condicional** y `revalidatePath` **solo cuando
  escribió**. `shareLocation` se refactoriza para compartir el escritor.
- `useLocationRefresh.ts` (hook cliente): el gate de permiso, las opciones, el `visibilitychange`.
- `LocationRefresher.tsx` (`"use client"`, no pinta nada), montado una vez en
  `src/app/[locale]/layout.tsx` con el `fix` que le pasa el servidor.

**Aceptación:** con el permiso ya concedido y sin tocar nada, entrar al sitio desde un sitio nuevo
actualiza las distancias. Con el permiso en `prompt` o `denied`, no se abre ningún diálogo.

### Slice 3 — Siempre se puede corregir a mano

- `LocationChip.tsx` (nuevo) sustituye la rama `null` en `page.tsx`, `productos/`, `categoria/[key]/`
  y `directorio/DirectoryPage.tsx`: "Distancias desde tu ubicación · hace 2 h" + botón "Actualizar".
- Claves nuevas en el namespace `distance` de `es.json` **y** `en.json`.

**Aceptación:** con ubicación conocida hay siempre un control visible para corregirla, y dice desde
cuándo es el dato.

### Slice 4 — El radio de "local" se mide desde ti

- `anchorFor(visitor)` en `proximity.ts` → `visitor ?? COMMUNITY_ANCHOR`. Es el parámetro que el
  propio comentario de `proximity.ts:24-25` anticipa.
- `PostgresStoreDirectory.listStores` usa `anchorFor(near)` en el `ST_DWithin`.
- **Respaldo:** si con el filtro de radio el total es 0 y había `near`, se repite la consulta sin la
  mitad del radio (la mitad del `origin = 'productor'` se conserva: si no hay productores, no hay
  productores) y se marca `outsideRadius`.
- `DirectoryPage.tsx` pinta `distance.nothingNearby` cuando `outsideRadius`.

**Aceptación:** un visitante a 1000 km no ve una página en blanco, ve lo que hay con el aviso de que
queda lejos. Un visitante local no nota ninguna diferencia.

## Validación

```
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run test:e2e:run
```

**Regresión primero:** los 7 specs que inyectan la cookie con `"lat,lng"` (`distance.spec.ts:51`,
`nearbyFirst.spec.ts:28`, `directoryNearby.spec.ts:53`, `locationNotice.spec.ts:88`,
`storesMap.spec.ts:35`, `postStoreMap.spec.ts:83`, `cardControls.spec.ts:102`) tienen que seguir
verdes **sin tocarlos**. Es la prueba de que el formato viejo se sigue leyendo.

Los e2e nuevos usan `context.grantPermissions(["geolocation"])` + `setGeolocation`, que la suite
actual nunca usó: hasta ahora el viaje navegador → server action → cookie no se ejercitaba en
ningún sitio.
