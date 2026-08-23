# 022 · Volver a donde estaba tras iniciar sesión — bitácora

## Slice 1 — el viaje de ida y vuelta (2026-08-23)

### Objetivo

Que entrar termine donde empezó. Quien pulsa «Asistiré», «Seguir» o «Iniciar sesión», y quien es
expulsado de una página privada, vuelve a esa misma página y en el mismo idioma.

### Decisiones y por qué

**La causa no era donde parecía.** El síntoma («siempre acabo en `/`») se leía como que faltaba un
`callbackUrl`, pero tres pantallas ya lo construían bien. Lo que había era un callback `redirect`
que devolvía `baseUrl` sin mirar nada. Importa saber que `@auth/core` llama a ese callback desde
`createCallbackUrl` con lo que llega por query o cookie y **guarda el resultado en la cookie
`callback-url`**: no es un filtro de salida, es el sitio donde se decide el destino. Mientras
devolviera la raíz, cualquier arreglo aguas arriba era invisible.

**El segundo corte estaba en la propia pantalla de acceso**, y es el que explica por qué «arreglar
el callback» a solas no bastaba: el flujo pasa dos veces por ahí. La primera con el destino bueno,
la segunda con `window.location.href` —o sea la pantalla de acceso— porque el cliente de next-auth
lo pone por omisión cuando no se le pasa nada. Se valoró resolverlo entero dentro del callback
(desenvolver el `callbackUrl` anidado cuando el destino es la puerta) y se descartó: la pantalla
seguiría mandando un destino equivocado y funcionando por rescate. Se arregló donde estaba mal.

**Una regla, tres módulos pequeños.** `returnPath.ts` decide de qué destino fiarse —del mismo
sitio, y que no sea la propia puerta—; `signInPath.ts` construye la dirección de la puerta con la
vuelta dentro; `redirectToSignIn.ts` expulsa. Separados porque el tercero importa `next/headers` y
eso lo vuelve inservible desde un Client Component, mientras que los dos primeros son puros.

**El idioma viaja dentro de la ruta, no aparte.** `getPathname({ locale, href })` ya devuelve
`/en/orders`, así que no hace falta lógica de prefijos en ninguna pantalla: basta construir con él.
Donde se veía el fallo era en las dos concatenaciones a mano (`${SIGNIN_PATH}?callbackUrl=…`), que
mandaban a la puerta española a quien leía en inglés. Las dos publicaciones de tipo evento tienen
slug propio por idioma —`caminata-a-la-luisa` / `walk-to-la-luisa`—, así que un regreso sin `/en`
no lleva a la versión en español: no lleva a ninguna parte.

**El botón del encabezado dejó de pasar por next-auth.** Está en todas las páginas y no sabe en
cuál, así que necesitaba el `Referer` — que es justo lo que `signIn()` usa por dentro. La
diferencia es a dónde aterriza: `pages.signIn` no lleva prefijo, así que next-auth mandaba siempre
a la pantalla española. Ahora redirige él mismo, con `redirectKeepingLocale`.

**`signOut` tuvo que nombrar su destino.** Usa el `Referer` por omisión igual que `signIn`, y con
el callback ya arreglado eso significaba que cerrar sesión en `/cuenta` te devolvía a `/cuenta` —
que te expulsa a la pantalla de acceso. Se le pasa la portada del idioma activo: mismo
comportamiento que antes, ahora sin cambiar de idioma.

**Fuera los dos `console.log` de los callbacks.** El de `signIn` imprimía el perfil OAuth completo
en los registros; el callback entero sobraba, porque solo devolvía `true`.

### Archivos tocados

**Nuevos, la regla y su construcción**

- `src/infra/auth/returnPath.ts` + `returnPath.test.ts`
- `src/infra/auth/signInPath.ts` + `signInPath.test.ts`
- `src/infra/auth/redirectToSignIn.ts`

**La cadena de NextAuth**

- `src/infra/auth/index.ts` — callback `redirect` con `safeReturnUrl`; fuera el callback `signIn`
- `src/app/[locale]/auth/signin/page.tsx` — pasa a Server Component y lee su `callbackUrl`
- `src/app/[locale]/auth/signin/ui/SignInOptions.tsx` (+ prueba) — lo reenvía a `signIn`
- `src/presentation/auth/auth-buttons/index.tsx` — entrar y salir, con idioma

**Quien manda a entrar**

- Páginas privadas: `publicar`, `cuenta`, `cuenta/agenda`, `pedidos`, `pedido/[id]`, `editar/[slug]`
- Enlaces: `[slug]/ui/PostDetail.tsx`, `pilares/components/PillarPractice.tsx`,
  `pilares/components/PilaresOverviewPage.tsx`, `tienda/[slug]/ui/StoreHeader.tsx`,
  `u/[username]/ui/ProfileHeader.tsx`
- Componentes que ahora reciben la puerta hecha: `FollowButton`,
  `PublicHabitCelebrationCard`/`List`

**Especificación**

- `docs/features/platform/022-2026-08-23-volver-tras-entrar.md`
- `src/e2e/entrar/entrar.feature` + `src/e2e/entrar/entrar.spec.ts`

### Comandos y resultados

```
pnpm run test:run          # 2328 pruebas, 2326 en verde antes de tocar las afectadas
pnpm vitest run src/infra/auth src/presentation/follow "src/app/[locale]/auth"
                           # 35 en verde (19 de returnPath, 3 de signInPath, 8 de seguir, 1 pantalla)
pnpm typecheck             # limpio
pnpm exec tsc -p tsconfig.test.json --noEmit
                           # limpio en lo tocado (quedan errores previos ajenos: globSync, managePost)
pnpm run lint              # limpio tras `biome check --write`
```

Comprobación contra la aplicación real (`next dev --port 3120`, base compartida, solo lecturas):

| Ruta | Resultado |
| --- | --- |
| `/pedidos` | 307 → `/auth/signin?callbackUrl=%2Fpedidos` |
| `/en/orders` | 307 → `/en/auth/signin?callbackUrl=%2Fen%2Forders` |
| `/publicar`, `/en/publish`, `/cuenta`, `/en/account` | 307, cada una con su regreso prefijado |
| `/caminata-a-la-luisa` | enlace `…?callbackUrl=%2Fcaminata-a-la-luisa` |
| `/en/walk-to-la-luisa` | enlace `/en/auth/signin?callbackUrl=%2Fen%2Fwalk-to-la-luisa` |
| `/tienda/hazlo-sano`, `/en/store/hazlo-sano` | seguir ofrece la puerta con su regreso |
| `/pilares`, `/en/pillars` | celebrar ofrece la puerta con su regreso |
| `/auth/signin?callbackUrl=https://otro-sitio.com/x` | la pantalla recibe `/`, no el destino ajeno |
| `/en/auth/signin` sin destino | la pantalla recibe `/en`, no `/` |

**Pendiente declarado:** la suite Playwright (`pnpm run test:e2e:run`) no se corrió — la corre el
usuario. El escenario nuevo vive en `src/e2e/entrar/entrar.spec.ts`; para pasarlo solo:

```
pnpm exec playwright test src/e2e/entrar
```

### Desviaciones de la hoja de ruta

Dos, las dos por consecuencia y no por alcance:

1. `signOut` no estaba en el plan. Entró porque el arreglo del callback cambiaba su comportamiento
   sin querer (devolvía a la página privada de la que se acababa de salir).
2. `PublicHabitCelebrationCard` recibía `callbackUrl: "/"` fijo. Se convirtió en un `signInHref`
   que baja desde `PilaresOverviewPage`, o sea que tocó también su lista intermedia y su prueba.

### Recap

El viaje de vuelta funciona de punta a punta salvo el tramo que solo se ve con OAuth real: la
puerta lleva escrito el regreso desde las páginas privadas, desde los enlaces de asistir, seguir y
celebrar, y desde el botón del encabezado; el callback de NextAuth ya no tira ese regreso, y ni él
ni la pantalla aceptan un destino de otro sitio o la propia puerta. El idioma va dentro de las dos
rutas, comprobado en los dos idiomas contra la aplicación levantada. Falta pasar la e2e, que corre
el usuario.

### Próximos pasos (opciones)

1. **Correr la e2e** (`pnpm run test:e2e:run`, o `pnpm exec playwright test src/e2e/entrar` para el
   escenario nuevo) y, si algo se cae, ajustar. *Acción pendiente del usuario.*
2. **Slice 2 — las acciones que expulsan a media faena**: `cuenta/actions.ts`,
   `publicar/actions.ts`, `editar/[slug]/actions.ts`, `orderActions.ts` y `availabilityAction.ts`
   siguen mandando a entrar sin decir a dónde volver. Es el caso de «se me caducó la sesión con el
   formulario abierto», y ahí la pregunta de verdad es si se recupera lo escrito o solo la página.
3. **Comprobar el viaje completo a mano una vez** con una cuenta real de Google: es el único tramo
   que ninguna prueba puede conducir.

## Slice 2 — las acciones que expulsan a media faena (2026-08-23)

### Objetivo

Que un server action que se encuentra sin sesión devuelva a la página del formulario y no a la
portada. La mitad barata de lo planeado: se recupera la página, no lo escrito.

### Decisiones y por qué

**Primero se midió cada cuánto pasa, y por eso la mitad cara se descartó.** La configuración no
toca `session.maxAge`, así que corren los valores por omisión de `@auth/core` (`lib/init.js:38,76`):
**30 días de inactividad**, y `updateAge: 24 h` empuja otros 30 en cuanto alguien vuelve. En la base
hay 89 filas en `sessions`, 18 vivas repartidas entre 12 personas, y las más recientes expiran a 29
días y 23 horas. Para que a alguien le caduque con el formulario abierto hacen falta las dos cosas
a la vez: dejar la pestaña abierta y no volver en un mes. Guardar el borrador se paga por los
motivos frecuentes —cerrar la pestaña, el botón de atrás, un envío fallido—, no por este; queda
como función aparte, con su propia alineación (dónde vive el borrador, cuándo se descarta, qué pasa
con las fotos ya subidas). Hoy no hay una sola escritura a `localStorage` en `src/`.

**El origen se lee del `Referer` y no se nombra acción por acción.** Tres de las diez llamadas no
tienen una página que nombrar: `setAvailability` se dispara desde la ficha **y** desde cualquier
tarjeta de listado —lo dice su propio comentario—, `advanceOrder` desde la lista y desde el detalle,
y `updatePost` no ha leído todavía su `slug` cuando comprueba la sesión. Nombrar la página en las
otras siete y tirar de `Referer` en tres habría dejado dos reglas para una sola pregunta, y la
diferencia se notaría justo donde más duele: quien marca agotado desde un listado volvería a la
ficha, que no es donde estaba. Una sola regla: **se vuelve a la página que envió el formulario**.

**`redirectToSignInFrom` va síncrona y `never`, con el origen ya resuelto.** La versión `async` que
leyera el `Referer` por dentro obligaba a cada acción a repetir `return` y `!` sobre el `userId`
recién comprobado: TypeScript no estrecha tipos después de un `await` aunque su tipo sea
`Promise<never>` — el mismo motivo que ya documentaba `redirectKeepingLocale`. Con la firma
síncrona, `pnpm typecheck` pasa sin tocar una sola de las diez comprobaciones que había debajo.

### Archivos tocados

- `src/infra/auth/redirectToSignIn.ts` — `redirectToSignInFrom` y `refererPath` exportados;
  `redirectToSignInFromReferer` pasa a componerlos
- `src/infra/auth/redirectToSignIn.test.ts` (nuevo, 8 pruebas)
- Diez llamadas en cinco acciones: `cuenta/actions.ts` (5), `editar/[slug]/actions.ts`,
  `publicar/actions.ts`, `orders/orderActions.ts` (2), `post/availabilityAction.ts`
- `src/e2e/entrar/entrar.feature` — el escenario del slice 2 deja de ser `@future` y pasa a
  `@component`, con el dato de los 30 días escrito al lado

### Comandos y resultados

```
pnpm vitest run src/infra/auth   # 34 en verde (8 nuevas de redirectToSignIn)
pnpm run test:run                # 2340 pruebas, 2339 en verde
pnpm typecheck                   # limpio, sin `!` añadidos en ninguna acción
pnpm run lint                    # limpio
```

El único rojo es `PublishForm.validation.test.tsx`, que agota los 5 s en la suite completa y pasa
sola en 9,3 s (`pnpm vitest run "src/app/[locale]/publicar"`, 90/90). Falla igual antes de este
slice y no toca nada de sesión: es la lentitud del entorno bajo carga, no una regresión.

### Desviaciones de la hoja de ruta

Ninguna en alcance. La hoja de ruta dejaba abierta la pregunta «volver al formulario con lo escrito
o solo a la página»; se contestó con el dato de los 30 días y se entregó la segunda.

### Recap

Las diez salidas a la pantalla de acceso —seis páginas privadas del slice 1 y diez llamadas de
acción en este— dicen ya a dónde volver, y ninguna pierde el idioma. Lo que no se recupera es lo
escrito en el formulario, y es una decisión medida: la sesión dura 30 días y se renueva sola, así
que el caso es de manual. La e2e sigue pendiente de correr.

### Próximos pasos (opciones)

1. **Correr la e2e** (`pnpm exec playwright test src/e2e/entrar`, o la suite completa). *Acción
   pendiente del usuario.*
2. **Comprobar el viaje completo a mano** con una cuenta real de Google: es el único tramo que
   ninguna prueba puede conducir.
3. **Borrador que sobrevive** en `/publicar` (500 líneas de formulario por pasos), si antes se mide
   cuánta gente lo abandona a medias. Función aparte, no apéndice de esta.
4. **Limpiar las sesiones caducadas**: 71 de las 89 filas de `sessions` ya expiraron y nadie las
   borra. No molesta a nadie hoy; conviene saberlo antes de que la tabla crezca.
