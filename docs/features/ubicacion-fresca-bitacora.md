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
