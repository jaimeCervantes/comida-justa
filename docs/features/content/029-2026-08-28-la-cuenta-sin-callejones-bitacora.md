# Bitácora — La sección de la cuenta deja de tener callejones sin salida

## Slice 1 — `/habitos` y `/u/[username]` vuelven a la cuenta (2026-08-28)

### Lo que se reportó

«`/u/nombre-de-usuario` y `/habitos` se salen del diseño de `/cuenta`; ¿puedes hacer que tengan el
mismo layout, o al menos que se vea como si aún estuviéramos en la sección de `/cuenta`?».

### El diagnóstico: el menú tenía dos salidas sin retorno

`AccountNav` ofrece cinco destinos. Tres montan la sección; **dos te sacaban de ella sin retorno**:

| Entrada | A dónde lleva | ¿Vuelve? |
| --- | --- | --- |
| Mi cuenta | `/cuenta` | sí |
| Mis pedidos | `/pedidos` | sí |
| Mi agenda | `/cuenta/agenda` | sí |
| **Mis publicaciones** | `/u/[username]` | **no** |
| **Mis hábitos** | `/habitos` | **no** |

Y el propio código lo tenía escrito. El docstring de `AccountNav` decía, textualmente, que
«Publicaciones» no tenía entrada en la unión de `active` porque «lleva a `/u/[username]`, que no
monta este menú», y que «Mis hábitos» no tenía «ningún camino de vuelta desde la cuenta». Eran dos
notas describiendo el mismo agujero.

### Las dos rutas no se arreglan igual, y ese es el fondo del slice

La corrección evidente —montar la sección en las dos— es la que **no vale** para el perfil.

`/u/[username]` es **la página pública que ve cualquiera de ti**: la que compartes, la que Google
indexa, la que lleva su `JsonLd` y su `alternates`. Darle a su dueño una columna de menú de 240 px
que sus visitantes no ven significa que verías tu propio perfil distinto de como lo estás
repartiendo. Puesto como una elección con sus dos costos, el usuario tomó la segunda:

- **`/habitos` → la sección entera.** No es una página que otros vean *de ti*, así que no hay
  paridad que romper. Con sesión, toma el layout de la cuenta y «Mis hábitos» queda marcada.
- **`/u/[username]` → solo el hilo de vuelta.** El perfil no se toca. Encima aparece una barra fina
  —«← Mi cuenta · Mis publicaciones»— y nada más.

### Tres reglas que no se preguntaron, porque solo tienen una respuesta razonable

1. **El hilo es solo para el dueño.** A quien mira el perfil de otra persona, «Mi cuenta» no le
   describe nada de la página que está viendo. La condición ya estaba calculada en la página
   (`isOwner`), que hasta ahora solo servía para ofrecer editar cada publicación.
2. **Sin sesión no hay sección.** `/habitos` es pública y se comparte; a quien llega por un enlace,
   un menú de cinco destinos que lo mandan a identificarse no es navegación, es un muro.
3. **El hilo sobrevive a la paginación.** Perderlo en `/u/[username]/page/2` sería devolver el
   callejón sin salida un desplazamiento más abajo.

### `AccountSection`: cinco copias que eran ocho

El montaje —`<main className={ACCOUNT_PAGE_LAYOUT}>` + `<AccountNav>` + el `Promise.all` de perfil y
vendedor— estaba escrito **cinco veces**: `/cuenta` en sus dos ramas (con y sin tienda), `/pedidos`,
y `/cuenta/agenda` en sus dos ramas. Sumar `/habitos` lo dejaba en seis, con la particularidad de
que esa sexta necesita además la condición «solo con sesión».

Cinco sitios donde desalinear una sección que el 5.15 pide que se vea como **una sola** es
exactamente la duplicación que `AGENTS.md` llama un fallo de diseño. Así que la decisión de layout
se toma ahora en un sitio y las páginas solo dicen de qué página son:

```tsx
<AccountSection active="habits">…</AccountSection>
```

Dos consecuencias que no se ven en el diff:

- **`/pedidos` y `/cuenta/agenda` dejaron de leer el perfil.** Solo lo pedían para pasárselo al
  menú. Ahora `AccountSection` lo lee por su cuenta, y como `findProfileOfUser` y `findSellerOfUser`
  van cacheados por render, `/cuenta` —que sí necesita los dos para su contenido— no paga una
  segunda consulta.
- **`active` sigue siendo obligatoria.** Es una unión (`AccountSectionKey`) y no un `string`: una
  página que se cuelgue de la sección sin estar en la lista quedaría con el menú puesto y ninguna
  entrada marcada, o sea diciendo «estás en la cuenta» sin decir dónde.

### Dónde vive el hilo, y por qué no en la ruta del perfil

`AccountBackBar` está en `cuenta/ui/` y no en `u/[username]/ui/`, aunque solo lo monte esa ruta. Es
chrome de la cuenta: es la **otra forma** de la misma sección, y el día que la sección cambie de
aspecto sus dos formas tienen que cambiar en el mismo sitio. Es el mismo argumento por el que
`ACCOUNT_PAGE_LAYOUT` vive dentro de `AccountNav` en vez de repetido en cada página.

Recibe la etiqueta de «dónde estás» ya traducida (`current`) en vez de una clave: `AGENTS.md`
prohíbe componer claves en tiempo de ejecución, y una unión de claves para un solo llamador sería
ceremonia. No estrena ninguna clave de catálogo: reusa `nav.myAccount` y `nav.myPublications`.

«Dónde estás» es un `<span>` con `aria-current="page"`, no un enlace: sería un destino que recarga
la página en la que ya estás.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Chrome de la cuenta | `cuenta/ui/AccountSection.tsx` (nuevo), `cuenta/ui/AccountBackBar.tsx` (nuevo), `cuenta/ui/AccountNav.tsx` (+`AccountSectionKey`, «Mis hábitos» marcable) |
| Páginas convertidas | `cuenta/page.tsx`, `pedidos/page.tsx`, `cuenta/agenda/page.tsx` |
| Páginas nuevas en la sección | `habitos/page.tsx`, `u/[username]/page.tsx`, `u/[username]/page/[page]/page.tsx` |
| Pruebas | `AccountSection.test.tsx` y `AccountBackBar.test.tsx` (nuevas), `AccountNav.test.tsx` (+`habits`), `src/e2e/compartir/cuentaLayout.spec.ts` |
| Especificación | `src/e2e/compartir/compartir.feature` (`@slice-5`) |

De paso, `/habitos` perdió su `mx-auto max-w-5xl`: el layout ya da `container-width`, y esa clase es
justo la que `AGENTS.md` desaconseja.

### Comandos y resultados

```
pnpm exec vitest run "src/app/[locale]/cuenta"        # 21/21
pnpm run test:run                                      # 2450/2450
pnpm exec tsc --noEmit                                 # limpio
pnpm run typecheck:tests                               # los 7 de siempre (globSync), ajenos
biome check .                                          # limpio
pnpm exec playwright test src/e2e/compartir/cuentaLayout.spec.ts   # 14/14
```

### Media hora perdida en una caché, y cómo distinguirlo la próxima vez

La primera corrida de la e2e dio **11/14**, con tres fallos que parecían míos: `/cuenta/agenda`,
`/u/[username]` y `/u/[username]/page/1`. Los tres renderizaban un **404**.

Lo que lo delató no fue leer el diff sino la lista de fallos: **`/cuenta/agenda` es un escenario que
este slice no toca** —solo cambió cómo se monta su menú, no si la ruta existe—. Un test ajeno
fallando con la misma firma que los tuyos no es coincidencia: es el entorno.

La causa fue mía, pero de la sesión y no del código: horas antes borré `.next/dev/types` para
esquivar unos tipos generados corruptos, y eso dejó el manifiesto de rutas a medias. Con `.next`
borrada entera, **14/14 sin tocar una línea**.

Regla para la próxima: si un 404 aparece en una ruta que el slice no toca, borra `.next` antes de
leer el diff.

### Recap

La sección de la cuenta ya no tiene salidas sin retorno. `/habitos` toma el layout completo cuando
quien mira ha entrado, con «Mis hábitos» marcada, y sigue siendo pública para quien llega por un
enlace. `/u/[username]` conserva exactamente el aspecto que ven los visitantes —esa era la razón de
no darle el menú— y gana un hilo fino de vuelta que solo ve su dueño, también en las páginas
siguientes. Por debajo, el montaje que estaba escrito cinco veces vive ahora en `AccountSection`, y
cada página se limita a decir de qué página es.

### Próximos pasos (opciones)

1. **`/tienda/[slug]` tiene el mismo problema que el perfil**: es la página pública de tu tienda y
   se llega a ella desde el menú del avatar. Si el hilo funciona en el perfil, ahí cabe igual —y
   `AccountBackBar` ya está parametrizado para eso, solo le falta la etiqueta.
2. **`/cuenta/agenda` lee el vendedor con `createSellerRepository().findByUserId` y no con
   `findSellerOfUser`.** Son la misma consulta, pero solo la segunda va cacheada por render, así
   que esa página la hace dos veces. Cambiarlo es una línea; se dejó fuera por no mezclarlo con
   este slice.
3. **El menú sigue sin poder marcar «Mis publicaciones».** Es correcto hoy —el perfil no lo
   monta— pero si algún día se decide que sí, `AccountSectionKey` es donde se nota.
