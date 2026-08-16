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
