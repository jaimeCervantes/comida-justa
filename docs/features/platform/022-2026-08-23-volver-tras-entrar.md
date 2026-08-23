# 022 · Volver a donde estaba tras iniciar sesión

## Contexto

- **Problem:** entrar te deja en la portada. Da igual desde dónde lo pidieras —«Asistiré» en un
  evento, «Seguir» en una tienda, el botón del encabezado, o una página privada como `/pedidos` que
  te expulsó por no tener sesión—: al volver de Google apareces en `/`, sin la acción hecha y sin
  rastro de dónde estabas. En inglés es peor: además pierdes el idioma.
- **Savings:** se recupera la acción que motivó el registro, que hoy se abandona; y desaparece la
  única razón por la que alguien tiene que volver a buscar a mano la publicación que estaba viendo.
- **Why:** el registro solo vale si termina en la acción que lo provocó. Es la pieza que convierte
  «me pidieron entrar» en «hice lo que venía a hacer».

## Diagnóstico

La cadena se corta en tres sitios distintos, y por eso el `?callbackUrl=` que ya construyen tres
pantallas no llega a ninguna parte.

1. **`src/infra/auth/index.ts` — el callback `redirect` devolvía `baseUrl` siempre.**
   `@auth/core` lo llama desde `createCallbackUrl` con el destino que llega por query o por cookie,
   y **guarda el resultado en la cookie `callback-url`**. Devolver la raíz reescribía cualquier
   destino como `/` antes de salir hacia el proveedor. Es la causa principal: mientras esto esté,
   ningún arreglo aguas arriba se nota.

2. **`src/app/[locale]/auth/signin/page.tsx` — la pantalla ignoraba su propio `callbackUrl`.**
   Llamaba `signIn(provider.id)` sin opciones, y el cliente de next-auth rellena por omisión
   `redirectTo = window.location.href`, o sea la propia pantalla de acceso. El destino que traía en
   la URL moría ahí.

3. **Quien manda a entrar no decía a dónde volver.** Quince sitios hacen
   `redirectKeepingLocale(SIGNIN_PATH, locale)` sin `callbackUrl`, y el botón del encabezado pasaba
   por `signIn()` de next-auth, que aterriza en `/auth/signin` sin prefijo: un visitante en inglés
   cambiaba de idioma al entrar.

## Modelo

Una regla, en un solo módulo, y tres formas de usarla.

- `src/infra/auth/returnPath.ts` — **de qué destino se puede fiar uno**: ruta interna, del mismo
  sitio, que no sea la propia pantalla de acceso. Función pura, con prueba unitaria.
- `src/infra/auth/signInPath.ts` — **construir la dirección de la pantalla de acceso** con su
  `callbackUrl`, en el idioma activo. Sustituye las cuatro concatenaciones a mano.
- `src/infra/auth/redirectToSignIn.ts` — **expulsar a entrar diciendo a dónde volver**, para las
  páginas privadas y para el botón del encabezado (que toma el origen del `Referer`).

El idioma va dentro de la ruta, no aparte: `getPathname({ locale, href })` ya devuelve `/en/orders`
para el inglés, así que el destino viaja prefijado y la vuelta respeta el idioma sin lógica extra.

## Slices

### Slice 1 — el viaje de ida y vuelta (este)

Alcance:

- El callback `redirect` conserva el destino cuando es de este sitio, y corta el bucle a la propia
  pantalla de acceso. Fuera los dos `console.log` de los callbacks (uno imprimía el perfil OAuth
  completo en los registros).
- `/auth/signin` pasa a Server Component: lee su `callbackUrl`, lo valida y se lo entrega al
  cliente, que lo reenvía a `signIn(provider, { callbackUrl })`.
- Las páginas privadas (`/publicar`, `/cuenta`, `/cuenta/agenda`, `/pedidos`, `/pedido/[id]`,
  `/editar/[slug]`) dicen a dónde volver.
- El botón «Iniciar sesión» del encabezado lleva a la pantalla de acceso **del idioma activo** con
  la página actual como destino.
- Los enlaces de «Seguir», «Asistiré» y «Celebrar» usan el mismo constructor: pantalla de acceso
  prefijada y destino prefijado.

Criterios de aceptación:

- Desde `/pedidos` sin sesión se llega a `/auth/signin?callbackUrl=%2Fpedidos`; desde `/en/orders`,
  a `/en/auth/signin?callbackUrl=%2Fen%2Forders`.
- La ficha del evento `caminata-a-la-luisa` ofrece entrar con ese mismo destino, y su versión
  inglesa `walk-to-la-luisa` con el suyo, prefijado.
- Un `callbackUrl` a otro sitio, o a la propia pantalla de acceso, se descarta y se cae a la raíz.
- La pantalla de acceso reenvía a `signIn` el destino que recibió, no la URL de la pantalla.

### Slice 2 — las acciones que expulsan a media faena (`@future`)

Los server actions (`cuenta/actions.ts`, `publicar/actions.ts`, `editar/[slug]/actions.ts`,
`orderActions.ts`, `availabilityAction.ts`) redirigen a entrar cuando la sesión caducó con el
formulario abierto. Ahí el destino no es una ruta estática sino el formulario que se estaba
enviando, y merece su propia decisión (volver al formulario con lo escrito, o volver a la página).
No se mezcla con el slice 1.

## Pruebas

| Qué | Dónde | Por qué ahí |
| --- | --- | --- |
| La regla del destino de fiar | `src/infra/auth/returnPath.test.ts` | Función pura: tabla de casos, incluido `//otro-sitio.com` |
| La pantalla reenvía su destino | `src/app/[locale]/auth/signin/ui/SignInOptions.test.tsx` | El último salto es una llamada del cliente a next-auth, no una navegación |
| Los enlaces llevan destino y prefijo | `src/e2e/entrar/entrar.spec.ts` | Es lo único observable de punta a punta: el ida y vuelta de OAuth no se puede conducir en la suite |

La suite e2e no puede completar el viaje: `simulateLogin` inyecta la cookie de sesión directamente
porque no hay forma de conducir el consentimiento de Google. Lo que sí se afirma de punta a punta es
que **la puerta lleva escrito el regreso** — y el tramo que la suite no ve queda cubierto por la
prueba unitaria del callback y la de componente de la pantalla.
