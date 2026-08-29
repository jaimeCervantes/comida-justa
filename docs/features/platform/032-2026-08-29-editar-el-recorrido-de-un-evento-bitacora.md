# Bitácora — Un evento publicado puede cambiar y quitar su recorrido

## Slice único — El campo del GPX llega a `/editar/[slug]` (2026-08-29)

### El hueco

`/editar/[slug]` **nunca montó el campo del recorrido**. Ni la página lo cargaba ni la acción lo
miraba: se comprobó con un `grep` de `route` en los dos ficheros y no había una sola línea.

Consecuencia: un evento publicado con el GPX equivocado no tenía arreglo. La única salida era borrar
la publicación y rehacerla, y eso cuesta su dirección, sus comentarios y su antigüedad — la ficha
desaparece del listado y vuelve como otra cosa.

Es un hueco anterior al arreglo del 413 (`005-filtro-al-publicar` y el `retomar` del 2026-08-17 lo
listaban como pendiente número 2) y era el más barato de tapar: `RouteFileField` ya existía y
`PostgresRouteRepository.remove` llevaba meses escrito **sin que nadie lo llamara**.

### La decisión que gobierna todo el slice

Al editar, **un campo vacío es ambiguo**: significa tanto «no subí ningún archivo» como «quiero
quedarme sin recorrido», y esas dos cosas le piden lo contrario al servidor.

Se resolvió dándole el significado inocente al vacío —*déjala como está*— y exigiendo un gesto
propio para quitar (`ROUTE_REMOVED`, una cadena que **no es un JSON válido** a propósito, para que
no pueda colarse por descuido y para que quien la reciba tenga que comprobarla antes de interpretar
nada).

Si fuera al revés, un evento perdería su trazo **cada vez que su dueño corrige una coma en el
título**, que es lo que de verdad ocurre casi siempre al editar.

### Decisiones y por qué

1. **`RouteFileField` se promovió a `src/presentation/post/`**, con `git mv` para no perder su
   historia. Lo pide `AGENTS.md`: «un componente bajo el `ui/` de una ruta que una segunda ruta
   empieza a querer es la señal para promoverlo; promuévelo, no importes entre rutas».

2. **Tres estados en el campo, y sólo uno a la vez**: el archivo recién elegido, la ruta que ya
   estaba, o el aviso de que se va a quitar. La pista general sólo sale cuando no hay ninguna, que
   es cuando de verdad hace falta explicar para qué sirve el campo.

3. **Quitar se puede deshacer.** Nada se ha guardado todavía, así que la vuelta es gratis; quitar
   algo sin vuelta atrás es una trampa.

4. **Arrepentirse de un reemplazo devuelve la ruta anterior, no deja la publicación sin ninguna.**
   Es la distinción que más fácil se implementa mal: quien elige el archivo equivocado y lo quita
   está cancelando su cambio, no pidiendo quedarse sin recorrido. Tiene su propia prueba.

5. **Se enseña la forma, no el nombre del archivo.** El `.gpx` no se guarda en ningún sitio —se lee
   en el navegador, se extraen sus puntos y se tira—, así que meses después lo único que se sabe es
   cuánto mide y con cuántos puntos. Se dice eso en vez de inventar un nombre.

6. **`readRouteField` subió al dominio, y `publicar` pasó a usarla.** Había una copia privada en
   `publicar/actions.ts` que distinguía dos casos; editar necesitaba tres. La salida no era
   duplicarla con una rama más: ahora los tres significados del campo viven en un sitio y las dos
   pantallas los entienden igual. `publicar/actions.ts` perdió su helper y dos imports que dejaron
   de usarse.

7. **La ruta se aplica después de guardar la publicación, y su fallo no aborta la edición.** Mismo
   criterio que al publicar: lo demás ya se guardó y es válido sin recorrido, así que devolver un
   error diría que no se guardó nada y sería mentira. Se registra en el servidor.

8. **Un `route` en algo que no es un evento se ignora.** El campo sólo se pinta en eventos, así que
   lo que llegue ahí en un producto viene de un formulario manipulado.

### Ficheros tocados

- **Promovido:** `src/presentation/post/RouteFileField/` (desde `app/[locale]/publicar/ui/`), con
  `existingRoute`, los tres estados y el deshacer.
- **Dominio:** `src/domain/entities/post/routeFile.ts` — `ROUTE_REMOVED`, `RouteFieldChange`,
  `readRouteField`.
- **Editar:** `page.tsx` (carga la ruta), `ui/EditPostForm.tsx` (monta el campo), `actions.ts`
  (`applyRouteChange` + el error de campo).
- **Publicar:** `actions.ts` (usa la función compartida), `PublishForm.tsx` (import nuevo).
- **Pruebas:** `RouteFileField.test.tsx` (+8), `routeFile.test.ts` (+6),
  `editar/[slug]/actions.test.ts` (+6), `EditPostForm.test.tsx` (fixture),
  `src/e2e/testUtils/seedRoute.ts` (nuevo), `editPublicationTypes.spec.ts` (+1 e2e).
- **Escenarios:** `editPublicationTypes.feature` — los dos `@future` dejan de serlo y entran tres
  más.
- **Catálogo:** cuatro frases nuevas en `publish` (es/en).

### Validación

| comando | resultado |
| --- | --- |
| `pnpm run test:run` | 229 ficheros, **2505 tests en verde** (eran 2485; +20) |
| `pnpm run typecheck` / `typecheck:tests` | limpios |
| `pnpm run lint` | 1042 ficheros, sin hallazgos |
| `pnpm run check:i18n` | limpio |
| `pnpm exec playwright test src/e2e/editPublicationTypes src/e2e/eventos` | **16/16 en verde** |

Los e2e corrieron contra la base compartida; siembran su publicación y su ruta con `testSlug` y las
borran en `afterEach`.

#### Qué prueba de verdad cada capa, dicho sin adornos

- **El e2e nuevo** afirma dos cosas: que el campo **aparece** con la ruta que ya existe, y que una
  edición normal no rompe la fila. Lo segundo también pasaba antes del slice —la acción ni tocaba
  `post_routes`—, así que el valor añadido es lo primero y el viaje completo.
- **Lo que sí sólo puede fallar por este cambio** es la aritmética de los tres gestos, y esa está en
  Vitest: seis casos en la acción (conservar, reemplazar, quitar, roto, tipo equivocado, fallo al
  guardar) y ocho en el componente.
- Reemplazar y quitar **no** van al navegador a propósito: subir un GPX real por Playwright añade
  minutos y no añade certeza sobre una llamada al repositorio que ya está afirmada.

### Recap

Un evento publicado puede ahora cambiar su recorrido, quitarlo, o —lo más importante— conservarlo
sin hacer nada, que es lo que ocurre en casi toda edición. El componente es el mismo que pinta
`/publicar`, promovido a `presentation` como manda el repositorio, y los tres significados del campo
viven en una sola función del dominio que las dos pantallas comparten. Rama
`feat/editar-el-recorrido-de-un-evento`, **sin commit** todavía.

### Próximos pasos (opciones)

1. **El feed que se acaba en silencio** — lo siguiente acordado: en `PostsWithLoadMore`, una petición
   fallida acaba en un `console.error` y el visitante ve que el catálogo «se terminó».
2. **Enseñar el recorrido en el propio campo**, no sólo sus números: un mapa pequeño en `/editar`
   diría de un vistazo si el GPX es el que se cree. Hoy hay que abrir la ficha en otra pestaña.
3. **El `@future` que queda en `editPublicationTypes.feature`**: que cada tipo se abra y se guarde
   sin cambiar de tipo (`@slice-3`).

**Pendiente de tu parte:** nada para cerrar el slice. Si quieres verlo, edita un evento con ruta y
cambia sólo el título — la ficha tiene que seguir dibujando el trazo.
