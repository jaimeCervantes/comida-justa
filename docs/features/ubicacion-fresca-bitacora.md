# Bitácora — ubicación fresca

Registro append-only. El *qué* está en `git log`; aquí va el *por qué*.

---

## 2026-08-05 — Slices 1 a 4, de una sentada

### Objetivo

Que la app deje de pedir la ubicación una sola vez en la vida. El usuario lo puso así: *"el usuario
puede moverse o estar en otro lugar, en su trabajo, en su casa, de vacaciones… En otro estado del
país, y donde quiera debe poder encontrar cosas sanas."*

### Lo que encontró la consulta a la base antes de escribir nada

Esto cambió el tono de todo lo demás. Las cinco ubicaciones que el bot de WhatsApp tiene guardadas
en `users.last_latitude` tenían **2.2, 2.5, 10.2, 10.6 y 137 días**. A una persona real el sitio le
estaba midiendo distancias desde donde estuvo hace cuatro meses y medio, sin decírselo y sin que
tuviera forma de corregirlo.

El resto del inventario, que acotó el alcance visible del slice 4:

- **1 tienda** (`Hazlo Sano`) con **1 sucursal**, y esa sucursal está exactamente en
  `COMMUNITY_ANCHOR` (0.00 km).
- **23 publicaciones**: 10 anuncios (`origin = null`), 10 `hazlo_sano_propio`, 3 `hazlo_sano_reventa`.
- **0 publicaciones con `origin = 'productor'`**. `productor` es un valor válido de la allowlist
  (`origin.ts:17`) pero nadie lo ha usado todavía: `/productores-locales` está vacío hoy **para todo
  el mundo**, no solo para quien mira de lejos. Es un problema de contenido, no de código.

### Decisiones y por qué

**La cookie ahora dice cuándo se escribió.** Era la mitad que faltaba: `hs_location` vivía un año y
no traía fecha, así que no había forma de saber si seguía siendo cierta. Sin ese dato ninguno de los
otros tres slices se puede decidir.

**El formato de dos campos se sigue leyendo, y para siempre.** Esas cookies se escribieron con un
año de vida y no hay forma de alcanzarlas para migrarlas. Se leen con `fixedAt: null`, y sin fecha
significa "vieja", que es exactamente lo que son. La prueba de que funciona es que los 7 specs que
las inyectan siguieron verdes **sin tocarlos**.

**Gana la fuente más fresca, no la cookie por ser cookie.** `users.location_updated_at` se venía
escribiendo desde la migración del bot y **nadie la leía nunca**. Ahora `fresherOf` la compara con
la de la cookie. Esto arregla un fallo silencioso: quien comparte su ubicación con el bot desde otra
ciudad seguía viendo el sitio medido desde su casa. En un empate manda la cookie, que es la que
alguien puso explícitamente en este navegador.

**Permiso primero, posición después.** El permiso lo guarda el navegador por origen, no por sesión:
una vez concedido, `getCurrentPosition` ya no abre el diálogo, y eso es lo que permite preguntar
cuantas veces haga falta sin molestar. Con el permiso en `prompt` o `denied` no se pregunta nada,
porque abrir el diálogo sin que nadie lo pida es lo que lleva a la gente a bloquearlo para siempre.
Si `navigator.permissions` falta o revienta, se trata como `prompt`: nunca se adivina hacia el lado
ruidoso.

**Se descartó `watchPosition`.** Mantiene el GPS activo y provocaría re-renders del servidor durante
la sesión. El par "al montar + al volver a la pestaña" cubre el caso real —te mueves con la pestaña
cerrada o el teléfono en el bolsillo— sin pagar la batería.

**El filtro de 500 m / 6 h no es una optimización, es la feature.** Cada escritura arrastra un
`revalidatePath("/", "layout")`, que invalida el árbol entero de rutas. Sin el filtro, cada carga de
página pagaría un render completo para confirmar que no te has movido. 500 m porque por debajo de
eso `describeDistance` casi nunca cambia el texto que alguien lee.

**El servidor vuelve a preguntar aunque el cliente ya lo haya decidido.** Lo que llega de un cliente
es una propuesta; lo que hay guardado solo lo sabe con certeza el servidor. El cliente decide para
ahorrarse el viaje, no para tener la última palabra.

**`readVisitorFix` va en `cache()`.** Con el refrescador en el layout hay ahora dos lectores por
petición. Sin esto, cada página pagaría dos veces la sesión y la consulta a `users`.

**El `null` era el problema del slice 3.** `{visitor ? null : <LocationNotice/>}` estaba repetido en
seis páginas, y ese `null` dejaba la sección muda justo cuando ya sabíamos algo: sin control para
corregir una ubicación equivocada, había que borrar la cookie a mano desde las herramientas del
navegador. Ahora `LocationBanner` decide cuál de las dos caras toca, en un solo sitio.

**El banner lee la ubicación en vez de recibirla.** Es lo que evitó enhebrar la fecha por los tres
`data.ts` y las seis páginas solo para pintar un aviso. Se lo permite el `cache()`.

**La antigüedad la formatea `Intl.RelativeTimeFormat`, no el catálogo.** El navegador ya sabe hacer
"hace 2 horas" en los dos idiomas y en los que vengan, con sus plurales y sus casos especiales.
`describeAge` devuelve número y unidad, igual que `describeDistance`: el texto es traducción.

**Se descartó el botón de ubicación en el Header.** Se propuso y el usuario prefirió el chip: aparece
donde la distancia se está mostrando, con el contexto de por qué importa, en lugar de un icono mudo
peleando espacio en una barra que en móvil ya lleva hamburguesa, logo, Publicar, avatar e idioma en
`h-16` más la búsqueda debajo. `Header.tsx` no se tocó.

**El respaldo del slice 4 tira el radio, no el `origin`.** Si no hay productores, no hay
productores: llenar el directorio con negocios que no producen sería mentir sobre lo que la página
promete. Hoy, con 0 publicaciones `productor` en la base, ese respaldo devuelve vacío **a propósito**.

### Archivos tocados

- **Dominio:** `seller/locationFreshness.ts` (nuevo) + test; `seller/proximity.ts` (`anchorFor`) +
  test; `seller/directory.ts` (`outsideRadius`).
- **Infra:** `location/locationCookie.ts` (`serializeFix`/`parseFix`) + test nuevo;
  `location/visitorLocation.ts` (`readVisitorFix`, `cache()`) + test nuevo;
  `location/viewerLocationContext.ts`; `dataAccess/sellers/PostgresStoreDirectory.ts`.
- **Presentación:** `location/actions.ts` (`refreshLocation` + escritor compartido);
  `location/useLocationRefresh.ts`, `LocationRefresher.tsx`, `LocationChip.tsx`,
  `LocationBanner.tsx` (todos nuevos) + tests.
- **App:** `[locale]/layout.tsx` (monta el refrescador); las 6 páginas que pintaban el aviso;
  `directorio/DirectoryPage.tsx` (aviso `nothingNearby`).
- **i18n:** `distance.chipLabel`, `distance.chipAge`, `distance.refresh` en `es.json` y `en.json`.
- **e2e:** `ubicacionFresca/` con `refresh.spec.ts`, `chip.spec.ts`, `farAwayVisitor.spec.ts` y el
  `.feature`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **741 pasados**, 82 archivos |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio (queda 1 `info` preexistente sobre un Fragment en `IndexingStatusPanel`) |
| `pnpm exec playwright test` | **140 pasados**, 0 fallos, 8.5 min |

Los 7 specs que inyectan la cookie de dos campos pasaron **sin modificarse**: es la prueba de la
compatibilidad hacia atrás.

**Se escribió en la base compartida** solo lo que siembran y borran los propios specs (tiendas y
publicaciones con prefijo `e2e-`); `globalTeardown` falla si queda algo. No se tocó ningún registro
real ni se aplicó ninguna migración.

Hay que correr la e2e con `E2E_PORT=3100` si el 3000 está ocupado, porque `reuseExistingServer` está
en `false` a propósito.

### Desviaciones del roadmap

1. **`LocationBanner` no estaba en el plan.** El plan decía sustituir la rama `null` en cada página;
   al hacerlo se vio que la condición estaba repetida seis veces y que meter el chip exigía enhebrar
   la fecha por tres `data.ts`. Un componente servidor que lee y decide sale más barato y deja la
   decisión en un sitio.
2. **`describeAge` tampoco.** Salió de aplicar la misma regla que `describeDistance`: el dominio
   devuelve número y unidad, el texto es traducción.
3. **La e2e del chip cubre 4 rutas, no 5.** El Gherkin listaba `/categoria/jugos`; se usaron las
   cuatro que ya recorre `locationNotice.spec.ts` para no fijar una clave de categoría que sale de
   la base y puede desactivarse desde `/admin/catalogo`. Las categorías usan el mismo
   `LocationBanner`, así que la cobertura real no cambia.
4. **Dos aserciones e2e se ajustaron tras verlas fallar**, y las dos por el andamio, no por la
   regla: `coordinatesAtKm` usa 111.32 km/grado (elipsoide) y `ST_Distance` mide sobre el elipsoide
   real, así que "40 km" del ayudante son 39.8 km medidos; y Next escribe la cookie percent-encoded,
   así que hay que decodificarla antes de partirla por comas.

### Pendientes

- **`/buscar` sigue sin cercanía.** `PostgresSearchPostRepository:49` ordena solo por
  `created_at DESC`; no recibe `near` ni pinta distancias. Es la única sección que no heredó nada de
  toda esta línea de trabajo.
- **`/tienda/[handle]` tampoco muestra distancia.**
- **Nadie ha publicado como `productor` todavía.** Mientras siga en 0, `/productores-locales` está
  vacío para todos y el slice 4 no se nota en producción. El selector de procedencia ya existe para
  la comunidad (`originsForUser`), así que es cuestión de que alguien lo use.
- **La detección automática no está instrumentada.** No sabemos cuántas veces se dispara ni cuántas
  acaban escribiendo. Sería el dato que confirma que el filtro de 500 m está bien calibrado.

### Recap

La ubicación del visitante dejó de ser un dato que se pide una vez y se cree un año. Ahora lleva
fecha, se compara con la que guardó el bot de WhatsApp y gana la más reciente; se vuelve a detectar
sola al cargar y al volver a la pestaña cuando el permiso ya está concedido, sin abrir nunca un
diálogo que nadie pidió, y sin escribir salvo que te hayas movido más de 500 m o el dato pase de 6 h;
cuando ya se sabe dónde estás hay siempre un chip que lo dice, dice desde cuándo y deja corregirlo; y
"local" se mide desde ti, con un respaldo que evita la página en blanco cuando no hay nadie en tus
50 km. Todo verde: 741 unitarios y 140 e2e, con los 7 specs de la cookie vieja intactos.

### Próximos pasos (opciones)

1. **Llevar la cercanía a `/buscar`**, que es el hueco que queda. Es el mismo patrón que ya está
   resuelto tres veces: columna de distancia + orden, con `near` entrando por el repositorio.
2. **Distancia en `/tienda/[handle]`**, más pequeño y de la misma familia.
3. **Instrumentar el refrescador** para saber cuántas detecciones acaban en escritura y ajustar los
   500 m / 6 h con datos en vez de con criterio.
4. **Dejarlo aquí y mirar el contenido**: mientras no haya publicaciones con `origin = 'productor'`,
   el directorio de productores seguirá vacío por mucha cercanía que se le ponga.

**Pendiente del usuario:** nada bloqueante. La rama es `feat/ubicacion-fresca`, con cuatro commits,
sin subir y sin PR abierto — se abre cuando lo pidas.

---

## 2026-08-08 — Slice 5: corregir la ubicación se nota

### Objetivo

Cerrar los dos fallos que dejaban el trabajo anterior sin efecto visible: el botón de corregir se
quedaba cargando para siempre y, en el home, las tarjetas seguían midiendo desde donde ya no
estabas. Los dos se leen igual desde fuera —"aprieto y no pasa nada"—, y esa lectura es la peor
posible: le enseña a la gente que el control no sirve, justo el control que los slices 2 a 4
existían para darle.

### Lo que estaba pasando, y por qué no se había visto

**El botón.** `useShareLocation` encendía `locating` a mano y nadie lo apagaba. `isPending` se apaga
solo al cerrar la transición; `locating` no. El fallo llevaba ahí desde el principio y no se notó
porque los dos primeros consumidores **desaparecen al corregir**: `LocationNotice` se vuelve chip y
`ShareLocationButton` se vuelve distancia, y con ellos se iba el estado colgado. `LocationChip`, del
slice 3, es el primero que sobrevive a su propia corrección, así que fue el primero en enseñarlo: la
ruedita girando sobre una antigüedad que ya decía "hace unos segundos".

**El feed.** `PostsWithLoadMore` hace `useState(initialPosts)`, y `useState` solo mira su valor
inicial. La revalidación llegaba entera y correcta —el chip lo demuestra— pero el componente la
ignoraba. Dos consecuencias, y la primera es la que más gente veía:

1. Quien entraba al home con el permiso ya concedido y sin cookie **nunca veía distancias**. El
   primer render sale sin ubicación, el refrescador la escribe, `revalidatePath` repinta… y el feed
   se queda con la copia sin distancias hasta que alguien recargue a mano.
2. Quien corregía su ubicación desde el chip veía cambiar el chip y nada más.

### Decisiones y por qué

1. **`finally { setState("idle") }`, y el `catch` no cae en `failed`.** `failed` significa "dijiste
   que no" y saca una copia que se lo reprocha ("No compartiste tu ubicación"), que es exactamente
   lo contrario de lo que pasó cuando el que falló fue el servidor. Y no se relanza: lo que se cayó
   fue una corrección de ubicación, y tumbar la página por eso le cuesta a quien mira mucho más que
   la distancia desactualizada que se queda en pantalla.
2. **Una `key`, no un `useEffect` que sincronice.** Cuando cambia desde dónde se mide no hay nada
   que salvar: la primera página y las que trajo el scroll están mal por igual. `key` es la forma
   que React tiene de decir "esta ya no es la misma lista", y empezar de nuevo es la respuesta
   correcta, no un apaño. Un efecto que copiara `initialPosts` al estado tendría que decidir además
   qué hacer con las páginas acumuladas, y esa decisión es justo la que la `key` no necesita tomar.
3. **La `key` son las coordenadas, no la fecha del dato.** Con la misma ubicación el valor no
   cambia, así que una revalidación por cualquier otro motivo —alguien marcando agotado su
   producto— no le tira al lector las páginas que llevaba cargadas. Si dependiera de `fixedAt`,
   cada re-detección silenciosa reiniciaría el feed sin que nada se hubiera movido.
4. **`measuredFrom` en `src/app/(home)/` y no en el dominio.** Es el contrato de un componente
   concreto ("si me montas, dame esta `key`"), no una regla de negocio sobre coordenadas. Y no puede
   vivir dentro de `PostsWithLoadMore.tsx`: todo lo que exporta un módulo `"use client"` es una
   referencia de cliente, así que la página no podría llamarlo.
5. **Solo el home.** Se revisaron las seis secciones que el usuario nombró: `/productos`,
   `/categoria/[key]`, `/negocios-locales`, `/productores-locales` y la ficha pintan sus tarjetas
   desde componentes de servidor, sin estado. `grep useState src/app` lo confirma: la única lista en
   estado del proyecto es esta. El home es la única sección con scroll infinito, y por tanto la
   única con una copia de cliente que mantener al día.

### Archivos tocados

**El botón**

- `src/presentation/location/useShareLocation.ts` — `try/catch/finally` alrededor de la acción.
- `src/presentation/location/LocationChip.test.tsx` — dos casos nuevos (guarda / revienta) y
  `stubGeolocation` extraído.

**El feed**

- `src/app/(home)/measuredFrom.ts` (nuevo) y su prueba.
- `src/app/(home)/PostsWithLoadMore.tsx` — docstring que declara el contrato de la `key`.
- `src/app/(home)/PostsWithLoadMore.test.tsx` (nuevo) — primera cobertura del feed.
- `src/app/[locale]/page.tsx` — `key={measuredFrom(visitor)}`.

**Especificación y documentación**

- `src/e2e/ubicacionFresca/ubicacionFresca.feature` — cuatro escenarios `@slice-5`.
- `src/e2e/ubicacionFresca/homeCards.spec.ts` (nuevo).
- `docs/features/ubicacion-fresca.md` — el slice 5 y por qué solo afecta al home.

### Validación

```
pnpm run test:run        → 102 archivos, 975 pruebas, todo verde
pnpm run typecheck       → 0
pnpm run typecheck:tests → 0
pnpm run lint            → 0
```

La prueba de la `key` se comprobó al revés antes de darla por buena: quitando el `key` del
componente falla con `expected [ 'a 2 km', 'a 2.5 km' ] to deeply equal [ 'a 39.8 km' ]`, que es
literalmente el fallo del que se quejó el usuario.

**Playwright no se corrió**: el usuario pidió correr las e2e a mano al final. `homeCards.spec.ts`
está sin ejecutar.

### Desviaciones del roadmap

Este slice no estaba en el roadmap: sale de dos fallos reportados sobre lo ya entregado. Se numera
como slice 5 porque no es un parche suelto sino la parte del slice 3 que faltaba —el control existía
pero no acusaba recibo—, y así queda con sus escenarios en el mismo `.feature`.

### Pendientes

- **La insignia "Agotado" tampoco se actualiza en el feed del home**, y por el mismo motivo:
  `availabilityAction` revalida el layout a propósito ("ese listado tiene que reflejarlo al instante
  o parecerá que el botón no hizo nada") y el feed lo ignora. La `key` no lo cubre, porque la
  ubicación no cambió. El arreglo natural es que `PostsWithLoadMore` guarde en estado **solo las
  páginas que pidió él** y deje la primera siempre del servidor; hace falta decidir antes qué se
  hace con los duplicados si el servidor mete una publicación nueva al principio.
- Sigue todo lo de la entrada anterior: `/buscar` sin cercanía, `/tienda/[handle]` sin distancia,
  cero publicaciones con `origin = 'productor'`, y la detección automática sin instrumentar.

### Recap

Corregir la ubicación ya se nota. El botón vuelve a estar disponible tanto si el servidor guardó
como si reventó, y en el home las tarjetas se corrigen con él en vez de quedarse midiendo desde
donde el lector ya no está —incluido el caso más común de todos, entrar con el permiso concedido y
ver las distancias aparecer solas sin recargar—. Las demás secciones ya lo hacían: pintan desde
componentes de servidor y no guardan copia. 975 unitarias verdes; la e2e nueva queda pendiente de
ejecutar.

### Próximos pasos (opciones)

1. **Cerrar el "Agotado" del feed** con el cambio de "solo las páginas que pidió el cliente". Es el
   último sitio donde una revalidación se pierde, y el mismo archivo.
2. **Llevar la cercanía a `/buscar`**, que sigue siendo el hueco grande de esta línea de trabajo.
3. **Distancia en `/tienda/[handle]`**, pequeño y de la misma familia.
4. **Instrumentar el refrescador** para calibrar los 500 m / 6 h con datos.

**Pendiente del usuario:** correr `pnpm run test:e2e:run` cuando quiera; `homeCards.spec.ts` no se ha
ejecutado nunca.
