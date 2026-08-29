# Bitácora — El texto de un comentario, y cuántos caben en un minuto

## Slice único — Normalizar lo que se guarda y acotar cuánto se puede escribir (2026-08-29)

Continúa `030-comentarios-firmados-por-la-sesion`, que cerró quién firma. Esto es lo que se escribe
y con qué frecuencia. La moderación —qué se dice— sigue siendo otro slice.

### Lo que NO hizo falta arreglar

Va primero porque es la mitad del valor de la revisión: se comprobó en el código, no se supuso.

| Amenaza | Por qué ya estaba cerrada |
| --- | --- |
| XSS | El comentario se pinta como `{comment.content}` y React escapa. El único `dangerouslySetInnerHTML` del repo es el JSON-LD, y se verificó que los comentarios **no llegan ahí** — ni a RSS, ni a `llms.txt`, ni al bot. No salen de la ficha. |
| Inyección SQL | Drizzle parametriza. |
| Ids inventados | `post_id` y `user_id` tienen clave foránea (`comments.ts:12-17`). Una publicación o un usuario que no existen los rechaza la base. |

Meter un saneador de HTML habría dado falsa sensación de seguridad y roto texto legítimo: `<3`,
`a > b`. **No se hizo, y queda escrito para que nadie lo "arregle" dos veces.**

### Lo que sí estaba abierto

**1. Texto que se lee distinto de como se guarda.** `U+202E` da la vuelta a lo mostrado sin tocar la
fila: quien lee una recomendación puede estar leyendo una advertencia escrita al revés. Y los
invisibles (`U+200B` y compañía) parten una palabra sin que se note —`e​s​t​a​f​a` se lee «estafa» y no
casa con nada—, que es justo el rodeo que se abre cuando llega la moderación.

**2. No había un solo límite de frecuencia en todo el repositorio.** Se buscó: ni `rateLimit`, ni
`throttle`, ni nada. Con una sesión válida y un bucle, la ficha de cualquiera se llena de miles de
comentarios en un minuto, y limpiarlo después es trabajo manual sobre datos que ya vio todo el
mundo. Es el único de estos arreglos que ataja un abuso **a escala**.

### Decisiones y por qué

1. **La normalización vive en `src/domain/comments/commentText.ts`, no en la acción.** Es una regla
   sobre qué es un comentario, no sobre cómo llega: tiene que valer el día que uno entre por otra
   puerta —una API, el bot—, y hoy nada garantiza que esa puerta se acuerde de normalizar.

2. **`U+200D` y `U+200C` se quedan.** Son de la misma categoría (`Cf`) que los que se quitan y
   también sirven para esquivar, pero el primero es lo que une 👨‍👩‍👧 en un solo emoji y los dos son
   ortografía de verdad en persa y en devanagari. Quitarlos convertiría una familia en tres personas
   sueltas: un daño visible y seguro a cambio de cerrar un rodeo que la moderación puede ver de
   todas formas. **Hay una prueba que lo fija**, para que no se "mejore" por descuido.

3. **Los caracteres van escritos con `\u`, nunca pegados.** La primera versión los llevaba
   literales y `grep` empezó a llamar binario al fichero: nadie puede revisar —ni corregir— una
   clase de caracteres que no ve. La misma regla se aplicó a las pruebas.

4. **El orden de la normalización es la regla, y una prueba lo demostró.** La primera versión
   quitaba los controles **antes** de convertir los finales de línea, y `\r` es `U+000D`, o sea uno
   de ellos: se borraba en vez de convertirse, y dos renglones escritos en Windows se pegaban en
   uno. Lo encontró su prueba, no una revisión.

5. **El recorte va al final y el tope se mide sobre el resultado.** Con 501 invisibles delante de un
   texto corto, contar sobre lo que llegó habría rechazado por largo un comentario que nadie
   escribió largo.

6. **El límite de frecuencia se cuenta contra la base, no en memoria.** Un contador en el proceso se
   vacía en cada despliegue y no existe para la segunda instancia: el tope valdría el doble con dos
   servidores y nada recién desplegado. `countRecentByUser(userId, since)` va por `(user_id,
   created_at)`, que la tabla ya indexa para leer un hilo. Sin dependencias nuevas — no hace falta
   Redis para cinco por minuto.

7. **Cinco por minuto y por persona.** Son doce segundos por comentario contando lo que se tarda en
   pensarlo: generoso para quien escribe, ridículo para un script. La ventana se mueve, así que
   nadie queda callado para siempre al llegar a cinco.

8. **No se consulta la frecuencia de quien no tiene sesión.** Preguntarle a la base por alguien que
   no ha entrado es una consulta que ningún visitante debería poder provocar. Hay prueba.

### Ficheros tocados

- **Dominio (nuevo):** `src/domain/comments/commentText.ts` + su prueba (11 casos).
- **Acción:** `src/app/[locale]/[slug]/data-access/actions.ts` — aplica la normalización y el tope
  de frecuencia.
- **Repositorio:** `src/infra/dataAccess/comments/PostgresCommentRepository.ts` —
  `countRecentByUser`.
- **Constantes:** `src/infra/constants/index.ts` — `COMMENT_RATE_LIMIT_PER_MINUTE`.
- **Catálogo:** `es.json`, `en.json` — `comments.errorTooFast`.
- **Pruebas:** `src/app/[locale]/[slug]/data-access/actions.test.ts` (+9 casos),
  `src/domain/comments/commentText.test.ts` (nuevo).
- **Escenarios:** `src/e2e/createComments/createDirectCommentTopost.feature`.

### Validación

| comando | resultado |
| --- | --- |
| `pnpm run test:run` | 229 ficheros, **2485 tests en verde** (eran 2467; +18) |
| `pnpm run typecheck` / `typecheck:tests` | limpios |
| `pnpm run lint` | 1041 ficheros, sin hallazgos |
| `pnpm run check:i18n` | limpio |
| `pnpm exec playwright test src/e2e/createComments` | **2/2 en verde** |

Los e2e corrieron contra la base compartida; siembran y borran lo suyo en `afterEach`.

### Lo que este slice NO cubre, dicho claro

- **El límite es por persona, no por IP.** Quien tenga cien cuentas puede escribir quinientos
  comentarios por minuto. Cerrar eso es otra conversación —verificación de cuentas— y no se resuelve
  en la capa del comentario.
- **La ventana se cuenta hacia atrás desde ahora**, así que en el peor caso caben diez comentarios
  en dos segundos si caen a caballo entre dos minutos. Es el compromiso normal de una ventana
  deslizante simple, y a esta escala no compensa nada más caro.
- **Nada de esto juzga el contenido.** Un comentario de spam perfectamente formado, a razón de
  cuatro por minuto, entra sin problema. Eso es moderación.

### Recap

Un comentario se guarda ahora en su forma canónica y sin lo que hace leer una cosa distinta de la
guardada, y una persona no puede escribir más de cinco por minuto. Se dejó escrito qué **no** hacía
falta tocar —XSS, SQL, ids— con la comprobación al lado, para que no se pague dos veces. Con esto los
dos primeros de los tres huecos de comentarios del `001-pendientes.md` quedan cerrados; falta el
tercero.

### Próximos pasos (opciones)

1. **Moderación de comentarios** — el hueco que queda: sin estado, sin panel, sin aviso al autor,
   sin denuncia. El clasificador ya es reutilizable, y el texto ya llega normalizado, que era medio
   requisito.
2. **Un contador en el formulario**, como el del título al publicar: hoy quien escriba 600
   caracteres se entera al enviar.
3. **Borrar el gemelo muerto de Firestore** (`src/infra/dataAccess/addCommentToPosts/`), que
   conserva la firma insegura anterior sin que nadie lo use.
4. **Actualizar el inventario** `docs/features/planning/005-2026-08-17-retomar.md`, de hace doce
   días.

**Pendiente de tu parte:** nada para cerrar el slice. Si quieres verlo, pega un comentario con un
salto de línea repetido cuarenta veces y mira que la ficha no se estire.
