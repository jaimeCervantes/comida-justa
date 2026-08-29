# Bitácora — Un comentario lo firma la sesión, no el navegador

## Slice único — El servidor deja de creerle al cliente (2026-08-29)

### El agujero

`addCommentToPost` recibía al autor **como tercer parámetro, desde el navegador**:

```ts
export async function addCommentToPost(postId, commentContent, user: PostUser) {
  return await commentRepo.addComment(postId, commentContent, user);
}
```

`"use server"` convierte eso en un endpoint HTTP público, y `PostgresCommentRepository.addComment`
escribe `user.id` directo en `comments.user_id`. Con el id de otra persona real —que la propia ficha
publica en cada comentario ya escrito— se firmaba un comentario a su nombre. Nada lo comprobaba: en
todo el fichero no aparecía `auth()`.

Es el fallo que no se deshace con un `git revert`. Después del hecho no hay forma de distinguir el
comentario falso del verdadero, y en un sitio cuyo producto es la confianza entre vecinos, eso es lo
único que hay que proteger de verdad.

Estaba señalado desde el `001-2026-08-07-pendientes.md`, hace tres semanas.

### Decisiones y por qué

1. **El parámetro no se ignora: desaparece.** Podría haberse dejado y sobrescrito con la sesión —el
   efecto sería el mismo hoy—, pero entonces la defensa sería una línea que alguien puede borrar sin
   darse cuenta de lo que borra. Quitándolo de la firma, devolverlo obliga a decidir explícitamente
   creerle al cliente. Hay una prueba que afirma exactamente eso: `addCommentToPost.length === 2`.

2. **Una sesión sin `id` es tan poco autor como no tener sesión.** El proveedor puede devolver un
   usuario antes de que la cuenta termine de crearse; sin id no hay a quién atribuirlo.

3. **El formulario sigue mandando a iniciar sesión, y está bien.** Eso es cortesía de interfaz: se
   le ahorra a la persona escribir un comentario que se va a rechazar. No es la defensa, y ahora hay
   una debajo.

4. **Las dos validaciones de contenido no son alcance añadido.**
   `src/e2e/createComments/createDirectCommentTopost.feature` las declara desde el primer día —
   «Validation of empty fields» y «a comment that exceeds 500 characters»— y sólo se cumplían en el
   navegador. `comments.content` es una columna `text`: sin tope en el servidor, no hay tope.
   `COMMENT_MAX_LENGTH = 500` sale de ese escenario, no de un número inventado hoy.

5. **Se recorta antes de contar y se guarda lo recortado.** Si los espacios de los bordes contaran
   para el tope pero no se guardaran, el mensaje de error hablaría de un comentario que nadie
   escribió.

6. **Los mensajes van al catálogo** (`comments.errorSignIn`, `errorEmpty`, `errorTooLong`), no como
   literales: `check:i18n` cubre `src/app`, y una acción que contesta en español fijo se lee igual en
   la ruta en inglés.

### El barrido que faltaba: ¿había más?

Se revisaron **todas** las Server Actions del repositorio buscando la misma forma —identidad
recibida por parámetro—:

```
for f in $(grep -rl '"use server"' src/app --include=*.ts); do
  grep -n "user: PostUser\|userId: string\|user: User" "$f"; done
```

Sin resultados. Era el único. El resto ya leía `auth()` dentro de la acción, que es lo que hace que
este destaque como olvido y no como criterio.

Queda un gemelo muerto: `src/infra/dataAccess/addCommentToPosts/index.ts` (Firestore) tiene la misma
firma y **nadie lo importa**. No se tocó —borrarlo es otra cosa que este slice—, pero es una trampa
puesta para quien lo cablee algún día.

### La e2e que estaba apagada, y por qué encenderla no era limpieza

`createDirectCommentToPost.spec.ts` estaba `.skip`eado **sin ningún motivo escrito**, y apuntaba a un
slug fijo (`verduras-y-semillas-frescas`) que nadie sembraba: sólo podía haber pasado en una máquina
cuya base compartida tuviera esa publicación.

Encenderlo no era higiene, era la verificación de este cambio. Todas las pruebas unitarias de aquí
simulan `auth()`, así que **ninguna demostraba que una persona con sesión de verdad todavía puede
comentar**. Un arreglo de seguridad que rompe en silencio el camino honrado es peor resultado que el
agujero que cerró.

Al encenderlo apareció justo eso: el comentario se guardaba a nombre de **«Healthy Food»** y la
prueba esperaba **«Jaime Cervantes»**. No era un fallo del código — era el código haciendo lo
correcto: firmar con la cuenta de la sesión. Lo que estaba mal era la afirmación, escrita a mano
contra `dummyDbUser`, un fixture anterior a que la suite pasara a entrar con la cuenta `pw.`. Se
sustituyó por `findSuiteUserName()`, que lee la misma fila que `simulateLogin` usa para entrar. Un
nombre escrito a mano en un spec vuelve a envejecer igual; leído de la fuente, no.

### Ficheros tocados

- **La acción:** `src/app/[locale]/[slug]/data-access/actions.ts`.
- **El formulario:** `src/app/[locale]/[slug]/addComments/AddCommentForm.tsx` — deja de mandar la
  identidad.
- **Constante:** `src/infra/constants/index.ts` — `COMMENT_MAX_LENGTH`.
- **Catálogo:** `src/i18n/messages/es.json`, `en.json` — tres mensajes nuevos.
- **Pruebas:** `src/app/[locale]/[slug]/data-access/actions.test.ts` (nuevo, 13 casos),
  `src/e2e/createComments/createDirectCommentToPost.spec.ts` (encendido y re-sembrado),
  `src/e2e/testUtils/suiteAccount.ts` (`findSuiteUserName`).
- **Escenarios:** `src/e2e/createComments/createDirectCommentTopost.feature`.

### Validación

| comando | resultado |
| --- | --- |
| `pnpm run test:run` | 228 ficheros, **2467 tests en verde** (eran 2457; +10) |
| `pnpm run typecheck` / `typecheck:tests` | limpios |
| `pnpm run lint` | 1039 ficheros, sin hallazgos |
| `pnpm run check:i18n` | sin español escrito a mano en componentes |
| `pnpm exec playwright test src/e2e/createComments` | **2/2 en verde** (antes: 1 saltado) |

Los e2e corrieron contra la base compartida: siembran su publicación con `testSlug`, sus comentarios
y su sesión, y los borran en `afterEach`. No quedó nada que deshacer a mano.

### Recap

La acción que escribe un comentario ya no acepta un autor: lo lee de `auth()`, rechaza sin sesión, y
valida vacío y tope de 500 caracteres donde no se puede esquivar. Se comprobó que ninguna otra Server
Action del repositorio tenía la misma forma. La e2e de comentarios pasó de saltada a dos escenarios
verdes, uno de ellos afirmando que el nombre bajo el comentario es el de la sesión — que es el
cambio entero, visto desde fuera.

### Próximos pasos (opciones)

1. **Moderación de comentarios.** Es el tercero de los tres huecos del `001-pendientes.md` y el
   único que queda: no hay estado de moderación, ni panel, ni aviso al autor, ni denuncia. El
   clasificador ya es reutilizable.
2. **Borrar el gemelo muerto de Firestore** (`src/infra/dataAccess/addCommentToPosts/`), que
   conserva la firma insegura sin que nadie lo use.
3. **Un contador en el formulario**, como el del título y la descripción al publicar: hoy quien
   escriba 600 caracteres se entera al enviar.
4. **Actualizar el inventario** `docs/features/planning/005-2026-08-17-retomar.md`, que tiene doce
   días y ya no refleja lo hecho.

**Pendiente de tu parte:** nada para cerrar este slice. Si quieres comprobarlo a mano, comenta desde
dos cuentas distintas y mira que cada comentario lleve el nombre correcto.
