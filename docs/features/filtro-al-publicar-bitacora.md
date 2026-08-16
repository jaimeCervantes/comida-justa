# Bitácora — se publica, se revisa, y lo que no cumple se baja

Append-only. Cada entrada narra el **porqué**; el qué ya lo cuenta `git log`.

---

## 2026-08-16 — Slice 1: el interruptor

### Objetivo

Que exista un estado de moderación en `posts` y una pantalla para usarlo. Sin IA todavía: la mitad
aburrida, y la que hay que hacer primero porque sin estado no hay dónde poner un veredicto y sin
panel «oculta» sería otro callejón sin salida.

Antes de esto, quitar algo de la vista significaba **entrar a la base a mano**. Esa era toda la
moderación que tenía el sitio.

### El modelo cambió antes de escribir código, y a mejor

La primera propuesta era un **veto bloqueante**: clasificar antes de guardar y rechazar en el
formulario. El usuario propuso lo contrario —publicar, revisar después, y bajar lo que no cumpla— y
se adoptó, porque gana en algo que el veto no podía resolver:

- **El falso positivo deja de ser un callejón sin salida.** Con veto, el día que el clasificador se
  equivoque con «Perfil Tiroideo Completo» esa persona no puede publicar y no tiene recurso.
  Revisando después, publica, se oculta, y un admin la restituye.
- **El fallo del proveedor deja de ser un agujero.** Con veto había que elegir entre dejar pasar sin
  revisar o dejar el sitio sin poder publicar. Con estado en la base, una caída deja la publicación
  en revisión y aparece en el panel.

El costo lo pagó este slice: la migración de Alembic pasó de ser el slice 2 a ser lo primero, y el
panel dejó de ser «mejora posterior» para volverse requisito.

### Decisiones y por qué

**El tema son los cuatro pilares, no la comida.** De las 27 publicaciones, 10 son anuncios sobre
sueño, ejercicio y un perfil tiroideo. Un clasificador entrenado en «¿esto es comida?» tiraría más
de un tercio del catálogo legítimo. Todavía no hay clasificador, pero la decisión ya está escrita en
el `.feature` con esas publicaciones reales como filas de aceptación.

**Columna en `posts`, no tabla aparte.** El usuario preguntó si convenía sacarlo a otra tabla para
no engordar `posts`. La línea quedó en: **estado actual en la fila, recorrido en su tabla**. El
estado lo tienen que filtrar las ~18 consultas de listado, y con tabla aparte cada una gana un
`LEFT JOIN` más `COALESCE(...,'published')` — y un `JOIN` a secas por descuido borraría el catálogo
entero en silencio. El histórico sí será tabla aparte cuando alguna pantalla pregunte quién bajó
qué; el precedente es la `0039` de pedidos, que separa `customer_orders` de
`customer_order_status_changes`.

**Tres columnas en una sola migración.** `moderation_reason` la usa el slice 2 y se añadió igual:
dos migraciones sobre una base compartida cuando cabe una es peor que llevar una columna vacía unos
días. El estado lleva `CHECK` y el motivo no, a propósito — la lista de motivos va a moverse
conforme se vea qué intenta colarse; la de estados no.

**Sin `moderated_by`.** Ser admin no es un rol en la base, es un correo en `HAZLO_SANO_ADMIN_EMAILS`.
Una FK a `users` guardaría con precisión algo que la aplicación todavía no modela.

**El índice es parcial y va al revés de lo que parece.** El feed pide `= 'published'` y ahí ningún
índice sirve porque casi todas las filas cumplen. Quien se beneficia es el panel, que pide lo raro.
De ahí `WHERE moderation_status <> 'published'`.

**El chatbot se resolvió sin tocar Python.** Se fue a leer su código
(`app/infrastructure/db/repositories/post_product.py` y la función `search_posts_semantic` de la
migración `0024`): consulta `WHERE kind = 'producto' AND is_available`. O sea que **nunca ve los
anuncios** y a los productos los gatea con `is_available`, que el sitio ya sabe escribir. Bajar un
producto le apaga ese interruptor y el bot deja de ofrecerlo de inmediato.

**`is_available` tiene dos dueños, y hubo que elegir.** El vendedor lo usa para «se me acabó» y la
moderación para silenciar. Al restituir no hay forma de saber quién lo apagó. Se eligió **encender**:
el caso que se rompe —un producto que ya estaba agotado, se baja y se restituye— vuelve a ofrecerse
sin existencias, que es exactamente lo que pasaba antes de esta feature y el vendedor corrige en un
clic. La alternativa era enseñar «Agotado» en el sitio público sobre algo que nunca se agotó: una
mentira visible, y en todos los casos en vez de en uno raro. Por eso el puerto lleva
`ChatbotVisibility` con tres valores (`silence` | `restore` | `leave`) y no un booleano: en un
anuncio no se escribe nada, porque ahí esa columna no significa nada.

**El aviso vive en la propia publicación.** No hay correo ni notificaciones en el repositorio (se
comprobó: ni SendGrid, ni Resend, ni nada). Montarlo sería otra feature. Así que lo bajado le sigue
siendo visible a su autor —y solo a él y al admin— con el motivo arriba. Es el único mensajero que
tiene el sitio.

**El perfil propio también lo enseña.** No estaba en el alcance escrito y se añadió: si `/u/<yo>` le
escondiera su publicación bajada, el aviso viviría solo en una URL que a lo mejor ya no tiene. De ahí
`publishedOrOwnedBy`, que sin `viewerId` es exactamente el filtro normal.

**El motivo se guarda como código, nunca como texto del modelo.** Lo que ve la persona sale del
catálogo de i18n. Desde el slice 2 esa columna la escribe un clasificador, y lo que un modelo redacta
a partir del contenido de un desconocido no puede acabar siendo texto de la interfaz.

### Archivos tocados

**Backend Python (base compartida)**
- `alembic/versions/0040_2026-08-16_add_post_moderation_status.py` — nueva.

**Dominio**
- `src/domain/entities/post/moderation.ts` + su prueba — estados, motivos, `canBeViewedBy`,
  `applyModerationDecision`, `chatbotVisibilityFor`.

**Caso de uso**
- `src/use_cases/moderatePost/` — `moderatePostUseCase.ts`, su prueba y el puerto.

**Infraestructura**
- `src/infra/dataAccess/db/publishedPosts.ts` + su prueba — el filtro compartido y el guard.
- `src/infra/dataAccess/moderatePost/` — repositorio de Postgres y factory.
- `src/infra/dataAccess/db/schema/posts.ts` — espejo de Drizzle.
- Las nueve superficies de lectura: `posts/PostgresPostQueryRepository.ts`,
  `searchPosts/`, `seo/PostgresSitemapRepository.ts`, `seo/PostgresFeedRepository.ts`,
  `cart/`, `sellers/PostgresStoreDirectory.ts`, `sellers/PostgresNearbyStores.ts`,
  `getOnePostWithPaginatedComments/`.

**Aplicación**
- `src/app/[locale]/admin/moderacion/` — página, acción y `ui/ModerationQueue.tsx` con su prueba.
- `src/app/[locale]/[slug]/page.tsx` + `ui/ModerationNotice.tsx` — el gate y el aviso.
- `src/app/[locale]/u/[username]/` — el perfil pasa el `viewerId`.
- `src/presentation/chrome/Header/UserMenu.tsx`, `src/i18n/routing.ts`, los dos catálogos.

**Especificación**
- `docs/features/filtro-al-publicar.md`, `src/e2e/filtroAlPublicar/` (`.feature`, spec y page object).

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `uv run alembic upgrade head` (backend) | `0039 → 0040`, una sola migración |
| Verificación en la base | 3 columnas creadas; **27/27 publicaciones en `published`**; el `CHECK` rechazó un `'inventado'` de prueba; índice parcial creado |
| `pnpm run test:run` | **1695/1695 en verde**, 166 archivos (antes del slice: 1679 en 164) |
| `pnpm run typecheck` | limpio |
| `pnpm typecheck:tests` | limpio |
| `pnpm run lint` | 847 archivos, sin hallazgos |
| `pnpm run check:i18n` | `es.json` y `en.json` estructuralmente idénticos |
| `pnpm run check:directives` | las directivas siguen siendo la primera sentencia |
| `pnpm run build` | compila en 15,2 s; `/[locale]/admin/moderacion` en el manifiesto |

**Escrito en la base compartida:** tres columnas, un `CHECK` y un índice sobre `posts`, todo
aditivo. Se deshace con `uv run alembic downgrade 0039_2026_08_16`. Ninguna fila cambió de valor.

### Desviaciones del roadmap

1. **Cinco motivos, no cuatro.** El cuarto acordado agrupaba «ofensivo o ilegal», y ahí caben dos
   cosas que no merecen el mismo mensaje: quien publica un insulto y quien publica cerveza
   artesanal. Se separó `offensive` de `restricted_product`.
2. **`ChatbotVisibility` en vez de un booleano.** Salió al escribir el caso de uso, cuando apareció
   el conflicto de los dos dueños de `is_available`.
3. **El perfil propio enseña lo bajado.** Añadido sobre el alcance escrito, por el hueco de
   descubrimiento.
4. **Un guard que vigila las consultas.** No estaba planeado. El fallo probable de esta feature no
   es escribir mal un filtro, es que dentro de tres meses alguien añada una consulta y no se
   acuerde — y eso no lo ve ni el typecheck ni una prueba de unidad. `publishedPosts.test.ts`
   recorre `src/infra/dataAccess/`, exige que toda lectura de `posts` use el filtro compartido, y
   obliga a **escribir el motivo** para cada excepción. Hoy hay seis, todas justificadas.

### Pendiente declarado

**La e2e no se corrió.** `src/e2e/filtroAlPublicar/filtroAlPublicar.spec.ts` está escrita y
typechequeada, pero la corre el usuario:

```
pnpm run test:e2e:run -- src/e2e/filtroAlPublicar
```

Necesita `HAZLO_SANO_ADMIN_EMAILS` configurado; sin eso los escenarios se saltan solos.

### Recap

`posts` ya tiene estado de moderación y las 27 publicaciones siguen exactamente donde estaban. Un
admin puede entrar a `/admin/moderacion`, bajar cualquier cosa eligiendo uno de cinco motivos y
restituirla, y eso la quita —o la devuelve— de las nueve superficies que leen publicaciones, además
de silenciarla para el chatbot sin tocar el backend Python. Quien la escribió la sigue viendo, en su
ficha y en su perfil, con el motivo explicado en su idioma. Todo esto es **manual**: el interruptor
existe, pero depende de que alguien mire. Eso es justo lo que automatiza el slice 2.

### Próximos pasos (opciones)

1. **Slice 2 — el clasificador.** Lo que faltaba desde el principio: Gemini corriendo en `after()`
   al publicar y al editar, antes que el indexado y la traducción, dejando `rejected` con su motivo
   o `in_review` si no contesta. El puerto, el adaptador y los cinco motivos ya están definidos en
   el roadmap; el aviso y el panel ya existen y no hay que tocarlos.
2. **Slice 3 — la denuncia.** Un botón que devuelva algo vivo a `in_review`. Es lo que atrapa lo que
   el clasificador deje pasar, y ahora ya hay estado donde apoyarlo.
3. **Revisar el catálogo existente.** Un script que pase las 27 por el clasificador y **enseñe** el
   resultado sin escribirlo, para calibrar el prompt antes de dejarlo suelto. Va después del slice 2.

**Pendiente del usuario:** correr la e2e con el comando de arriba.

---

## 2026-08-16 (tarde) — Corrección del slice 1: el interruptor no se podía accionar

La e2e destapó un hueco de diseño, no un fallo de la prueba. La entrada de arriba afirma que un
admin ya podía bajar cualquier cosa desde la web. **No era cierto.** El panel lista lo que
`moderation_status <> 'published'`, o sea la bandeja de lo ya retirado; nada publicado aparecía
ahí, así que no había ninguna pantalla desde la que bajar algo. El estado existía y el interruptor
no tenía manija.

El recorrido real es el inverso del que había supuesto: el admin **navega el sitio**, se topa con
algo que no cumple, y lo baja sin salir de ahí. El panel viene después, para deshacerlo. Así que
`ModerationControls` vive en la ficha (`[slug]/ui/`) y solo se le pinta a quien puede decidir; el
panel se queda como bandeja.

De paso, dos arreglos que **sí** eran de la prueba:

1. Afirmaba `toHaveCount(0)` sobre el título "Dona Chocolate Keto", y esa publicación **existe de
   verdad en el catálogo y sigue publicada con razón**. La aserción se caía por un acierto del
   código. Ahora afirma sobre el slug sembrado, que lleva el prefijo de `testSlug`.
2. Esperaba `waitForLoadState("networkidle")` tras pulsar, y eso se resolvía con la carga de la
   propia ficha en vez de con la respuesta de la Server Action: la lectura llegaba antes que la
   escritura. Ahora el page object espera al **efecto visible** (el aviso aparece, la fila
   desaparece), que es determinista.

**Validación:** `filtroAlPublicar` 5/5. Regresión en `seo`, `products`, `sellerStore` y
`localProducers`: **104/104** — son las carpetas que más ejercitan las ~18 consultas tocadas. Lint,
`typecheck` y `typecheck:tests` limpios.

**Lección para el slice 2:** el estado no sirve de nada sin algo que lo escriba. En el slice 1 ese
algo era una persona y faltaba dársela; en el slice 2 va a ser el clasificador.

---

## 2026-08-16 (tarde) — Slice 2: el clasificador que decide solo

### Objetivo

Que la revisión deje de depender de que alguien mire. Gemini corre en `after()` al publicar y al
editar, y escribe el estado que el slice 1 dejó preparado.

### La calibración fue antes que el código de producción, y era el riesgo real

El peligro de esta feature nunca fue que fallara el cableado: era **que el prompt tirara catálogo
legítimo**. Así que antes de dejarlo suelto se pasó por el clasificador el catálogo entero contra la
base real:

| | |
|---|---|
| Publicaciones reales juzgadas | **27** |
| Aceptadas | **27** |
| Falsos positivos | **0** |
| Basura inventada juzgada | 6 |
| Rechazadas, cada una con SU motivo exacto | **6** |

Pasaron las tres que más miedo daban: **"Perfil Tiroideo Completo"** (habla de análisis clínicos),
**"Suero natural"** (la palabra suena a medicamento) y **"¿Por Qué Comer Despacio es la Clave para
Bajar de Peso?"** (un titular de adelgazamiento, que es justo la forma de un `health_claim`). El
número está anotado en el `.feature` para que se sepa cuándo se midió.

### Decisiones y por qué

**El prompt habla de los cuatro pilares y lleva anclas.** Las publicaciones reales que no van de
comida están escritas dentro del prompt como ejemplos de lo que SÍ pasa. No es decoración: son las
mismas filas que afirma el `.feature`, así que aflojar el prompt rompe una prueba.

**La respuesta es un `enum`, no texto.** `responseMimeType: "text/x.enum"` con la lista cerrada de
seis valores. Es la petición más barata que se le puede hacer y, sobre todo, hace **imposible** que
el modelo escriba en la interfaz: lo que devuelve es una clave que el sitio traduce con su catálogo.

**Un veredicto desconocido lanza, no se da por bueno.** Si Gemini contestara `politico`, tratarlo
como aceptado sería publicar a ciegas creyendo que se revisó. Lanza, y la publicación queda
`in_review`.

**El orden es la mitad del valor.** La revisión corre **antes** que el indexado y la traducción, y
estos dos solo si pasó. Dos razones: el vector es la puerta del chatbot —indexar antes de juzgar
dejaría lo rechazado encontrable durante la ventana de revisión— y traducir algo que se acaba de
bajar es pagarle a Gemini por un texto que nadie va a leer. Los dos trabajos de después van con
`Promise.allSettled` y no en serie: son independientes, y que la traducción tarde treinta segundos
no puede retrasar el embedding.

**15 s de tiempo límite, no los 30 de la traducción.** Nadie mira un botón —corre en `after()`—
pero sí hay una publicación **en vivo** mientras tanto, y cada segundo de más es un segundo que algo
que no cumple está visible.

**El caso de uso no lanza nunca.** Si el clasificador falla, `in_review`, que es donde el panel del
slice 1 ya sabe mirar. Ésa fue la razón entera de revisar después en vez de antes.

**La edición pasa por el mismo filtro**, y no solo por simetría: es el **camino de salida**. Una
publicación bajada que su autor corrige se restituye sola, sin depender del admin.

### Archivos tocados

- `src/use_cases/common/ports/IContentModerationService.ts` — el puerto.
- `src/domain/errors/ModerationProviderError.ts`.
- `src/infra/services/GeminiContentModerationService.ts` + su prueba — el prompt y el `enum`.
- `src/infra/services/factory.ts`, `src/infra/dataAccess/moderatePost/factory.ts`.
- `src/use_cases/moderatePost/reviewPostContentUseCase.ts` + su prueba.
- `src/app/[locale]/publicar/actions.ts` y `editar/[slug]/actions.ts` — el orden de los `after()`.
- `src/e2e/filtroAlPublicar/clasificador.spec.ts`, `.feature` (slice 2 deja de ser `@future`).

### Comandos y resultados

| Comando | Resultado |
|---|---|
| Calibración contra la base real | **27/27 aceptadas, 0 falsos positivos; 6/6 basuras rechazadas con su motivo** |
| `pnpm run test:run` | **1720/1720**, 168 archivos (antes del slice: 1695 en 166) |
| `pnpm run test:e2e:run -- src/e2e/filtroAlPublicar` | **7/7** |
| `typecheck`, `typecheck:tests`, `lint`, `check:i18n`, `check:directives` | limpios |

**Escrito en la base compartida:** nada permanente. La calibración solo leyó; la e2e creó y borró
sus propias publicaciones (`afterEach`).

### Desviaciones

1. **La e2e no prueba si el prompt acierta.** Eso lo mide la calibración, con 33 llamadas reales;
   la e2e prueba el **cableado**, que es lo que la calibración no puede ver. Duplicarlo habría
   hecho la suite lenta y flaky por una API de terceros.
2. **Dos aserciones mías estaban mal y el código tenía razón**, y las dos enseñan algo: el
   formulario publica `anuncio` por omisión, así que a lo rechazado no se le toca `is_available`
   —el bot solo mira productos—; y la fila de `post_translations` nace con la publicación, así que
   lo que tiene que faltar es el `embedding`, no la fila.

### Recap

El filtro ya funciona solo. Se publica, se responde al instante como siempre, y unos segundos
después Gemini juzga el texto: lo que pertenece a los cuatro pilares se queda publicado y recibe su
vector y su traducción; lo que no, se baja con su motivo, se silencia para el chatbot si es
producto, y **no llega a tener embedding**. Si Gemini no contesta, la publicación queda en revisión
y aparece en el panel. Su autor lo ve todo desde su propia publicación, en su idioma, y puede
corregirla para restituirla sin pedirle nada a nadie. Medido contra el catálogo real: 0 falsos
positivos en 27.

### Próximos pasos (opciones)

1. **Slice 3 — la denuncia.** Un botón que devuelva algo vivo a `in_review`. Es lo que atrapa lo que
   el clasificador deje pasar, y ahora es la única pieza que falta para cerrar el círculo.
2. **Slice 4 — los comentarios**, que hoy siguen sin ninguna revisión. El puerto ya existe; es
   reusarlo en otra puerta.
3. **Un límite de publicaciones por persona.** El filtro no frena a quien publique cien veces algo
   aceptable, y esa es la otra forma de ensuciar el catálogo.

**Pendiente del usuario:** correr el resto de la e2e por lotes (`orders`, `unifiedCatalog`,
`busqueda*`, `habits`, `menu`), que no se tocó en este slice pero comparte las consultas del 1.

---

## 2026-08-16 (noche) — La e2e completa, por lotes

Cierra el pendiente declarado en las dos entradas anteriores. **308 pruebas, todas verdes**, corridas
en seis lotes por el problema de RAM ya conocido.

| Lote | Carpetas | Resultado |
|---|---|---|
| — | `seo`, `products`, `sellerStore`, `localProducers` | 104/104 |
| — | `filtroAlPublicar` | 7/7 |
| 1 | `orders` | 32/32 |
| 2 | `habits`, `pilares` | 30/32 → **32/32 al repetir** |
| 3 | `menu`, `compartir` | 38/38 |
| 4 | `ubicacionFresca`, `busquedaRelevante` | 32/32 |
| 5 | `multimedia`, `unifiedCatalog`, `i18n`, `busquedaEntreIdiomas` | 22/34 → **34/34 al repetir** |
| 6 | las catorce carpetas restantes | 28/28 |

### Los 14 fallos que no eran fallos

Ninguno sobrevivió a repetirse, y ninguno tocaba código de esta feature.

**Lote 2 (2 fallos)**: contadores de rituales en `atomicSleepChallenge`. `habits` no lee `posts`.
19/19 al repetir el spec solo.

**Lote 5 (12 fallos)**, agrupados en tres specs, que es lo que hizo sospechar de verdad. La hipótesis
era razonable y **resultó falsa**: como el slice 2 hace que editar dispare una revisión, y el texto
que siembra la suite es relleno genérico ("Publicación de prueba para el listado de productos"),
parecía que Gemini estaba bajando las publicaciones sembradas al editarlas y dejando al resto del
escenario sin nada que mirar. Se comprobó corriendo `editarMedia` sola: **4/4**. Y
`busquedaEntreIdiomas` + `unifiedCatalog` juntas: **14/14**.

Entre esas 14 pasó **"its embedding lands after the response, and the chatbot can find it"**, que es
la prueba directa de que reordenar los `after()` —revisar primero, indexar después— no rompió el
indexado que ya existía.

Así que los 12 son interferencia entre carpetas en el mismo proceso, la misma flakiness en frío que
ya está anotada. Se deja escrito para no volver a sospechar del clasificador la próxima vez.

### Recap

La suite entera está verde con la moderación dentro. Las ~18 consultas que el slice 1 tocó no
rompieron ninguna pantalla —búsqueda, tienda, directorio, carrito, sitemap y feed pasaron todas— y el
reordenado del slice 2 no le quitó el vector a nada que deba tenerlo.

### Próximos pasos (opciones)

Sin cambios respecto a la entrada anterior: slice 3 (la denuncia), slice 4 (los comentarios), o el
límite de publicaciones por persona. Ya no queda nada pendiente del usuario.

---

## 2026-08-16 (noche) — Slice 3: que la comunidad denuncie

### Objetivo

Cerrar el círculo. El clasificador acierta con lo evidente, pero lo que deje pasar no lo ve nadie:
el admin tendría que toparse con ello navegando, y nadie navega su propio catálogo buscando
problemas. Quien sí se topa es la comunidad.

### El roadmap tenía un agujero, y se corrigió antes de escribir código

El roadmap decía: *"un botón de reportar que devuelve algo vivo a `in_review`"*. Literalmente eso
significa que **una sola denuncia oculta una publicación**, o sea que cualquier visitante podría
vaciar el catálogo denunciando una publicación tras otra. Se le planteó al usuario y eligió que
**denunciar avise sin ocultar**.

El argumento es la asimetría del daño: una denuncia falsa que oculta le quita la venta a un vendedor
real **en el acto**; una legítima esperando a que el admin la mire cuesta unas horas de una
publicación mala arriba — y esa ya pasó por el clasificador, así que no es de las evidentes.

La regla vive como función (`statusAfterReport`) y no como comentario, para que se pueda probar y
para que quien quiera cambiarla tenga que venir a discutirla.

### Decisiones y por qué

**Tabla, no columna.** Hace falta saber **cuántas** y **de quién**. Una bandera `is_reported` no
distingue una denuncia de doce ni impide que la misma persona la levante cien veces.

**`UNIQUE(post_id, user_id)` es lo que hace que el número signifique algo.** Sin él, "5 denuncias"
podría ser una persona pulsando cinco veces, y el dato que el admin usa para priorizar sería ruido.
Es también la razón por la que denunciar exige sesión, con su costo aceptado: quien ve algo grave y
no tiene cuenta no puede avisar.

**`ON CONFLICT DO NOTHING` en vez de comprobar-y-luego-insertar.** Deja que la base resuelva la
duplicación y evita la carrera en la que dos pulsaciones simultáneas de la misma persona pasan las
dos la comprobación. `rowCount` distingue "se guardó" de "ya estaba", y **ya estaba no es un error**:
quien vuelve a pulsar quiere saber que su aviso está, no leer que algo falló.

**Decidir borra las denuncias.** Sin esto, una publicación denunciada por error se quedaría en la
bandeja para siempre: el admin la aprobaría, seguiría teniendo su denuncia y volvería a aparecer al
recargar. Aprobar significa "esto está bien", que es exactamente la respuesta al aviso.

**La bandeja mezcla las dos cosas** —lo no publicado y lo publicado denunciado— porque piden lo
mismo: que una persona decida. Ordena **primero por número de denuncias**: varias personas avisando
de lo mismo es la señal más fuerte que produce este sistema, y enterrarla bajo lo que el clasificador
dejó pendiente sería desperdiciarla.

**El badge de estado dice la verdad.** Una publicada que llegó por denuncias sigue diciendo
"Publicada". Decir "En revisión" sobre algo que cualquiera puede ver sería mentir en la única
pantalla donde el admin decide. Obligó a añadir el tercer estado al badge, que hasta ahora solo
distinguía dos.

**Dos redacciones para un mismo código.** El panel dice «No trata de descanso, alimentación…»
—el nombre que lee quien modera— y a quien denuncia se le pregunta «No tiene que ver con salud ni
bienestar». Mismo valor, dos voces, igual que hizo `origin` con el selector del vendedor y el reporte.

### Archivos tocados

- **Backend**: `alembic/versions/0041_2026-08-16_add_post_reports.py`.
- **Dominio**: `moderation.ts` — `PostReport`, `canBeReportedBy`, `statusAfterReport`.
- **Caso de uso**: `reportPostUseCase.ts` + su prueba.
- **Infra**: `PostgresModerationRepository` (bandeja, `saveReport`, borrado al decidir), espejo
  Drizzle, factory.
- **App**: `[slug]/reportActions.ts`, `[slug]/ui/ReportPostForm.tsx`, la ficha, el panel y su cola.
- **Especificación**: `denuncia.spec.ts`, `.feature`, los dos catálogos.

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `uv run alembic upgrade head` | `0040 → 0041`; tabla, UNIQUE, dos FKs e índice verificados; 27 publicaciones intactas |
| `pnpm run test:run` | **1739/1739**, 169 archivos (antes del slice: 1720 en 168) |
| `pnpm run test:e2e:run -- src/e2e/filtroAlPublicar/denuncia.spec.ts` | **5/5** |
| `typecheck`, `typecheck:tests`, `lint`, `check:i18n`, `check:directives` | limpios |

**Escrito en la base compartida:** una tabla nueva, vacía. Se deshace con
`uv run alembic downgrade 0040_2026_08_16`. Ninguna fila de `posts` cambió.

### Desviaciones

1. **Denunciar no oculta**, contra lo que decía el roadmap. Explicado arriba; lo decidió el usuario.
2. **Tres fallos de e2e que eran míos, no del código.** `simulateLogin` sin correo entra con la
   **misma cuenta que siembra las publicaciones**, así que mi denunciante era el autor y el botón
   —correctamente— no se pintaba. El escenario necesita dos identidades: ahora el denunciante entra
   con la cuenta de admin, y hay un `skip` si resultara ser la misma que la de la suite.

### Recap

El círculo está cerrado. El clasificador atrapa lo evidente al publicar y al editar; lo que se le
escapa lo puede señalar cualquiera con cuenta, una vez por publicación, y eso **no oculta nada**:
solo hace que aparezca en el panel, ordenada por cuánta gente avisó, con su estado real. El admin
decide, y al decidir las denuncias se cierran. Nadie puede tumbar el catálogo, y nada se queda sin
que alguien pueda avisar.

### Próximos pasos (opciones)

1. **Slice 4 — los comentarios**, que siguen sin ninguna revisión. El puerto del clasificador ya
   existe; es reusarlo en otra puerta.
2. **Un límite de publicaciones por persona.** El filtro no frena a quien publique cien veces algo
   aceptable, y esa es la otra forma de ensuciar el catálogo.
3. **Mirar el dato dentro de unas semanas.** Cuántas denuncias llegan y cuántas resultan ciertas dice
   si hace falta un umbral automático o si con el panel basta. Hoy sería adivinar.

**Pendiente del usuario:** nada.
