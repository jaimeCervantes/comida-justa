# Feature: se publica, se revisa, y lo que no cumple se baja

Hoy cualquiera con sesión iniciada publica lo que quiera, en vivo y al instante. `createPost`
(`src/app/[locale]/publicar/actions.ts:107`) comprueba que los campos no vengan vacíos y
`PostValidator` valida **forma** —largos mínimos, precio mayor a cero en un producto, media con URL
y tipo—, pero **nada mira de qué habla el texto**. Un "vendo mi Tsuru 2015" entra igual que una
receta, y en el mismo segundo se indexa para el chatbot y se traduce al inglés.

Este documento es el **checkpoint de revisión** del roadmap. Escrito el **2026-08-16** con los datos
de la base a esa fecha. La primera versión proponía un veto **bloqueante** antes de guardar; el
usuario propuso revisar **después de publicar** y bajar lo que no cumpla. Se adoptó su modelo, y la
sección "Por qué se revisa después y no antes" explica qué se gana y qué cuesta.

## Problema / Savings / Why

- **Problema:** el catálogo es la promesa del sitio, y no hay ningún freno que la sostenga. Una sola
  publicación fuera de tema, una promesa de salud falsa o un anuncio de estafa contamina tres cosas
  a la vez: el feed que ve la gente, la búsqueda semántica y **lo que el chatbot le contesta a
  alguien que pregunta por su salud**. Y hoy no hay forma de bajar nada sin entrar a la base a mano.
- **Savings:** quita el riesgo de que nadie vigile el catálogo, y sobre todo evita que una promesa de
  salud peligrosa acabe citada por el bot como si el sitio la respaldara.
- **Why:** sin curaduría esto es un tablón de anuncios. Con ella es un catálogo confiable, que es lo
  único que justifica que alguien le pregunte a este sitio qué comer.

## Estado al escribir (2026-08-16)

| | |
|---|---|
| Publicaciones | **27**: 17 productos + 10 anuncios |
| Con categoría | 15, **todas** bajo `alimentacion` (bebidas 4, platillos 4, panadería 4, untables 1, jugos 1, smothies 1) |
| Sin categoría | 12 |
| Filtro de contenido al publicar y al editar | **ninguno** |
| Estado de moderación en `posts` | **no existe la columna** |
| Forma de bajar algo desde la web | **ninguna**: hoy se hace entrando a la base |
| Infraestructura de correo o notificaciones | **ninguna** (no hay SendGrid, Resend ni nada equivalente) |
| Límite de publicaciones por persona | **ninguno** |
| Quién puede publicar | cualquiera con sesión de Google |
| Consultas del sitio que leen `posts` | **~18**, repartidas en 9 repositorios de `src/infra/dataAccess/` |

## El hallazgo que decide el filtro: el tema son los cuatro pilares, no la comida

De las 27 publicaciones, **10 son anuncios que no van de comida**: "Funciones del Buen Sueño Parte
1", "¿A qué hora deberían irse a dormir los niños y adolescentes?", "10 Minutos de Ejercicio al Día
Pueden Cambiar tu Vida", "Perfil Tiroideo Completo - La Orquesta Hormonal de tu Cuerpo".

El sitio se llama comida justa, pero el dominio que ya está construido son **cuatro pilares** —
`sleep`, `nutrition`, `movement`, `mind-spirit`—. Un clasificador entrenado con la pregunta *"¿esto
es comida saludable?"* rechazaría **más de un tercio del catálogo legítimo que ya existe**,
incluyendo un artículo sobre el sueño de los niños.

Así que la pregunta que se le hace al clasificador es *"¿esto pertenece a alguno de los cuatro
pilares del bienestar?"*, y esas publicaciones reales son las filas de aceptación del Gherkin,
precisamente para que un cambio futuro del prompt no las pueda romper en silencio.

## Por qué se revisa después y no antes

Revisar **antes** de guardar era lo primero que se propuso. Revisar **después**, con la publicación
ya viva y bajándola si no pasa, gana en tres cosas y una de ellas es decisiva:

1. **El falso positivo deja de ser un callejón sin salida.** Es el argumento que decide. Con un veto
   bloqueante, el día que el clasificador se equivoque con "Perfil Tiroideo Completo" esa persona
   simplemente **no puede publicar**, sin recurso ninguno. Revisando después, publica, se oculta, y
   un admin la restituye. En un sitio cuyo catálogo roza lo médico, eso no es un caso raro.
2. **El fallo del proveedor deja de ser un agujero.** Con el veto bloqueante había que elegir entre
   dejar pasar sin revisar (y que nadie se entere) o dejar el sitio sin poder publicar. Con estado en
   la base, una caída de Gemini deja la publicación en revisión y aparece en el panel: ya no hay que
   elegir.
3. **Publicar no se hace más lento.** La revisión corre en `after()`, igual que el embedding y la
   traducción, así que sale del camino crítico. Es además el patrón que este repositorio ya usa.

**Lo que cuesta, y es mucho más que la otra versión:**

- **Exige la columna de estado en `posts` desde el primer día.** "Bajarla de la vista" es, por
  definición, estado persistido. Eso es una **migración de Alembic en el backend Python** sobre la
  base compartida — la acción irreversible de este roadmap, que se aplica contigo.
- **Exige tocar las ~18 consultas** que hoy leen `posts` para que ninguna devuelva lo que no está
  publicado. Es la mitad del trabajo y la parte fácil de olvidar.
- **Exige un panel de admin desde el primer día**, no como mejora posterior: sin él, "oculta" es otro
  callejón sin salida y no habríamos arreglado nada, solo movido el problema.
- **Hay una ventana de segundos** en la que lo publicado está visible para cualquiera. Para una
  comunidad de este tamaño es un costo aceptable; conviene tenerlo escrito y no descubrirlo después.

## El chatbot ya tiene su propio interruptor, y no hace falta tocar Python

El bot es otro proceso que consulta la misma base por su cuenta, así que ocultar algo en el sitio no
lo oculta para él. Se revisó su código
(`app/infrastructure/db/repositories/post_product.py` y la función `search_posts_semantic`, definida
dentro de la migración `0024`) y resulta que el problema es más chico de lo que parecía:

| | |
|---|---|
| Qué consulta el bot | `WHERE p.kind = 'producto' AND p.is_available` |
| Anuncios | **no los ve nunca**: los filtra por `kind`. Un anuncio rechazado no necesita defensa del lado del bot |
| Productos | los gatea con `is_available`, que el sitio **ya sabe escribir** (`setPostAvailabilityUseCase`) |

Así que al rechazar un **producto** se le pone además `is_available = false`, y el bot deja de
ofrecerlo de inmediato **sin una sola línea de Python**. La columna nueva guarda el significado real
—rechazado no es agotado— y `is_available` funciona como el interruptor que el bot ya respeta. El día
que el backend lea el estado de moderación, esa segunda escritura se retira.

Y hay una tercera defensa gratis, que sale del **orden de los trabajos**: la revisión corre
**primero** y el indexado y la traducción **solo si pasó**. Una publicación rechazada nunca llega a
tener embedding, así que tampoco aparece en la búsqueda semántica. De paso deja de pagarse la
traducción de la basura, que hoy se pagaría igual.

## Cómo se entera la persona: no hay correo, así que se lo dice su propia publicación

No existe infraestructura de correo ni de notificaciones en el repositorio. Montarla para esto sería
una feature entera, así que el aviso vive donde la persona ya va a mirar:

- **Su publicación sigue siendo visible para ella**, y solo para ella, con un aviso arriba que dice
  qué norma no cumple y qué corregir. Para todos los demás no existe.
- Editarla y guardar **vuelve a pasar por el filtro**: si ahora cumple, se restituye sola. Ese es el
  camino de salida sin tener que pedirle nada a nadie.
- El motivo se explica con el catálogo de i18n, en su idioma.

Es lo más barato que informa de verdad: acaba de publicar, tiene la URL, y va a volver a mirarla.

## El veredicto es un código, nunca el texto del modelo

El servicio devuelve **una decisión y un motivo de una lista cerrada**, no una explicación
redactada:

| Motivo | Qué frena |
|---|---|
| `off_topic` | no pertenece a ninguno de los cuatro pilares: vendo mi coche, alquilo cuarto, criptomonedas |
| `health_claim` | promesa de salud peligrosa: cura enfermedades, sustituye medicación, adelgaza 10 kg en una semana |
| `spam` | estafa, ganancia fácil, enlaces de afiliado, texto repetido |
| `offensive` | insultos, contenido sexual, discriminación |
| `restricted_product` | alcohol, tabaco, vapeadores, sustancias, armas |

Son **cinco** motivos y no los cuatro que se acordaron porque el cuarto agrupaba dos cosas que no se
parecen: quien intenta publicar un insulto y quien intenta publicar cerveza artesanal no merecen el
mismo mensaje. El segundo no está siendo ofensivo — se equivocó de mercado, y el sitio puede
decírselo sin acusarlo de nada.

Se devuelve un código y no una frase por tres razones, y las tres importan:

1. **Nunca se le pinta a nadie texto que escribió el modelo.** El mensaje sale del catálogo de i18n,
   elegido por el código a partir del motivo. Si se mostrara la prosa de Gemini, el contenido de la
   publicación —que es entrada de un desconocido— podría dictar lo que el sitio le dice al usuario.
   Es la misma clase de defensa que `resolveKeyStrict` con las categorías.
2. **Sale traducido gratis.** El sitio es bilingüe; el motivo es una clave y `es.json`/`en.json` la
   contestan cada uno en su idioma, sin pedirle a Gemini que también traduzca su regaño.
3. **Es verificable.** Un motivo de un `enum` se puede probar con una tabla en el Gherkin; un párrafo
   libre no.

El `responseSchema` de Gemini soporta `enum` sobre un `STRING`, así que la lista cerrada la impone la
petición, igual que `GeminiTranslationService` impone hoy `{title, content}`.

## Los tres estados

| Estado | Qué significa | Quién lo ve |
|---|---|---|
| `published` | pasó la revisión, o un admin la aprobó | todos |
| `in_review` | no se pudo revisar (Gemini cayó), o alguien la denunció | su autor y el admin |
| `rejected` | el clasificador o el admin dijo que no | su autor (con el motivo) y el admin |

Las 27 publicaciones existentes nacen `published` en la migración. No se revisan retroactivamente al
aplicar la columna: eso es un script aparte que se corre cuando el clasificador ya esté afinado, para
no bajar medio catálogo por un prompt de estreno.

## Dónde vive, y por qué no en la Server Action

La revisión se dispara desde la capa de aplicación con `after()`, como el indexado, pero **la regla**
—qué es publicable, qué motivos existen, qué se hace con cada veredicto— vive en el dominio y el caso
de uso.

| Capa | Qué se agrega |
|---|---|
| `src/domain/entities/post/moderation.ts` | los estados, los motivos, y la regla de qué veredicto produce qué estado |
| `src/use_cases/common/ports/IContentModerationService.ts` | el puerto, al lado de `ITranslationService` e `IEmbeddingService` |
| `src/use_cases/moderatePost/` | el caso de uso: pide el veredicto, escribe el estado, y dice si hay que indexar |
| `src/infra/services/GeminiContentModerationService.ts` | el adaptador REST, mismo patrón que `GeminiTranslationService` |
| `src/infra/dataAccess/` | el estado en las ~18 consultas, y el repositorio de moderación |
| `src/app/[locale]/publicar/` y `editar/[slug]/` | disparan la revisión en `after()` |
| `src/app/[locale]/admin/moderacion/` | el panel, con el patrón de `/admin/productos` |

## La edición pasa por el mismo filtro

Si solo se revisa al crear, el filtro dura dos clics: publico "Jugo verde", lo edito a "vendo mi
Tsuru" y queda en vivo — `updateOnePostUseCase` acepta título y contenido nuevos y hasta reindexa
cuando el texto cambia. Las dos puertas se cierran igual, y además es el camino por el que una
publicación rechazada se rescata a sí misma.

## Lo que este roadmap NO hace

- **No limita cuántas veces se publica.** Un filtro de contenido no frena a quien publique cien veces
  algo aceptable. Es otra clase de defensa y otra feature.
- **No filtra los comentarios**, que hoy tampoco tienen ninguna revisión. Slice 4.
- **No revisa retroactivamente** lo que ya existe. Script aparte, cuando el prompt esté afinado.
- **No pretende frenar a un adversario decidido.** Esto frena el error honesto y al oportunista, y le
  da al admin un interruptor que hoy no tiene. Contra alguien que insista sirve la denuncia (slice 3).

## Slices

### Slice 1 — el interruptor: estado, panel y todas las lecturas *(entregado 2026-08-16)*

**Sin nada de IA.** Es la mitad aburrida y es la que hay que hacer primero: sin estado no hay dónde
poner un veredicto, y sin panel "oculta" es un callejón sin salida.

**Alcance:**

- Migración de Alembic en el backend Python: columna de estado en `posts`, con `published` por
  omisión para las 27 existentes. **Se aplica contigo.**
- El dominio de los tres estados y sus transiciones.
- Las ~18 consultas de `src/infra/dataAccess/` dejan de devolver lo que no está `published`.
- La publicación sigue visible **para su autor** aunque no esté publicada, con su aviso.
- `/admin/moderacion`: lista lo que no está publicado, y permite aprobar o rechazar a mano.
- Al rechazar un **producto** se escribe también `is_available = false`, para el bot.

**Criterios de aceptación:**

1. Un admin baja "Dona Chocolate Keto" desde la web y desaparece del feed, de la búsqueda, del
   sitemap, del detalle, de la tienda y del carrito — pero su autor la sigue viendo con el aviso.
2. Un producto rechazado deja de existir para el chatbot, verificado contra la consulta real del bot.
3. El admin la restituye y vuelve a aparecer en todo lo anterior.
4. Las 27 publicaciones existentes siguen visibles después de la migración, sin excepción.
5. `/admin/moderacion` es admin-only: un usuario normal recibe 404.

### Slice 2 — el clasificador que decide solo *(entregado 2026-08-16)*

**Alcance:**

- El puerto, el adaptador de Gemini con su `enum` de cinco motivos, y el caso de uso.
- Se dispara en `after()` al publicar y al editar, **antes** que el indexado y la traducción, que solo
  corren si pasó.
- Rechazada → `rejected` + motivo + `is_available = false` si es producto.
- Gemini no contesta → `in_review`, que es donde el panel del slice 1 ya sabe mirar.
- El aviso con el motivo, en los dos idiomas, en la publicación de su autor.
- Cinco claves nuevas en `es.json` y en `en.json`.

**Criterios de aceptación:**

1. Los productos reales ("Dona Chocolate Keto" 35, "Açaí Glow" 75, "Pechuga de pollo asada en
   bistec" 105) siguen publicados tras la revisión.
2. **Los anuncios de los otros pilares también**: "Funciones del Buen Sueño Parte 1" y "10 Minutos de
   Ejercicio al Día" no son comida y deben quedar publicados.
3. "Perfil Tiroideo Completo" y "Suero natural", que rozan lo médico, quedan publicados.
4. "Vendo Nissan Tsuru 2015" queda `rejected` con motivo `off_topic`, fuera de toda lectura, y su
   autor ve por qué.
5. "Té que cura el cáncer en 21 días" queda `rejected` con `health_claim`.
6. Una publicación rechazada que su autor corrige y guarda **se restituye sola**.
7. Si el servicio lanza, queda `in_review` y aparece en el panel.
8. Un producto rechazado nunca llega a tener embedding.

### Slice 3 — que la comunidad denuncie *(entregado 2026-08-16)*

Un botón de "reportar" que devuelve algo vivo a `in_review`. Es lo que atrapa lo que el clasificador
dejó pasar.

### Slice 4 *(opción)* — el mismo filtro en los comentarios

`addCommentToPosts` no tiene ninguna revisión hoy. El puerto ya existiría; es reusarlo en otra puerta.
