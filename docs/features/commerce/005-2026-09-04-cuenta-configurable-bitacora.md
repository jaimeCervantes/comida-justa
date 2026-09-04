# Bitácora — La cuenta se configura sola

## Slice 1 — La cuenta se lee de un vistazo (2026-09-04)

### Objetivo

Que quien abre `/cuenta` sepa en el primer vistazo **cuál es su tienda, qué direcciones reparte y
qué le falta por configurar**, sin cambiar el sistema de diseño ni ninguna dirección pública.

### El diagnóstico que se acordó

`/cuenta` montaba cinco `AccountCard` del mismo peso visual repartidas en dos columnas por un
criterio interno —«lo que se enseña» / «lo que se edita»—. Ese corte partía las sucursales en dos
(lista en una columna, alta en la otra) y dejaba las direcciones públicas compitiendo por sitio con
formularios largos. El `h1` decía «Mi cuenta», que es literalmente lo que dice el menú de la
izquierda dos centímetros más allá.

### Decisiones, y por qué

**1. La regla de «qué falta» es dominio puro, no una consulta más.**
`readAccountSetup` (`src/domain/entities/seller/accountSetup.ts`) recibe un retrato —nombre de
tienda, dirección personal, logo, descripción y las coordenadas de cada sucursal— y devuelve los
cinco pasos con su marca. **No cuesta ni una consulta nueva**: los cinco datos salen de lo que la
página ya leía para pintarse. Ponerlo en el dominio hace que el caso interesante —`0,0` no cuenta
como ubicación, porque es el Golfo de Guinea— se compruebe en milisegundos y no montando una
pantalla. Reutiliza `areValidCoordinates`, que ya tomaba esa decisión para el mapa.

**2. El orden de los pasos es fijo, no se reordena al cumplirlos.**
Una lista que se recoloca sola obliga a releerla entera para saber dónde ibas. Con `ACCOUNT_SETUP_ORDER`
el que ayer estaba tercero sigue tercero y solo cambia su marca. Es además el orden de dependencia
real: sin tienda no hay logo que subir.

**3. La lista desaparece cuando no falta nada.**
Cinco marcas verdes permanentes son ruido con forma de logro: ocupan el sitio más valioso de la
pantalla para no pedir nada. `SetupChecklist` devuelve `null` con `setup.complete`.

**4. La cabecera se llevó dos tarjetas por delante, y no fue alcance de más.**
`AccountHeader` pasa a ser la dueña de las dos direcciones públicas. Dejar además `StoreCard` y la
rama «ya reservada» de `UsernameSection` habría pintado **cada dirección dos veces en la misma
pantalla**, que es peor que el problema que veníamos a arreglar. Así que:

- `StoreCard` se borró. Su mensaje «esta tienda no tiene página pública» —el caso de los vendedores
  que creó el chatbot— **se conservó** dentro de la cabecera: se dice, no se calla.
- La rama «ya reservada» de `UsernameSection` se borró **después de comprobar que nunca llegaba a
  verse**: `claimUsername` revalida `/cuenta`, la página vuelve con la dirección puesta y la sección
  entera deja de montarse. Los seis escenarios que buscaban `username-card` la esperaron cinco
  segundos y no apareció. Es el mismo caso que `StoreReadyMessage` en `BecomeSellerForm`, que el
  slice anterior ya había retirado por lo mismo. El **formulario** sigue montándose mientras no haya
  dirección: ahí no es un duplicado, es la acción que falta.
- Con `StoreCard` se fue también el enlace duplicado a la agenda, que ya estaba en `AccountNav`.
  Estaba planificado para el slice 3; llegó gratis aquí.

**5. El `h1` nombra la tienda.**
El único encabezado de nivel 1 de la pantalla se gastaba en repetir lo que dice el menú. Ahora dice
lo único que esta página puede decir y el menú no. Sin tienda abierta sigue siendo «Mi cuenta»,
porque entonces no hay nada más que nombrar.

**6. Los enlaces de la lista llevan al ancla del bloque, no al principio de la página.**
`anchors.ts` existe porque el ancla es un **contrato entre dos archivos** —el que enlaza y el que se
deja enlazar—; escrita dos veces se rompe en silencio (el enlace sigue funcionando, solo que no
lleva a ningún sitio). `AccountCard` lleva `scroll-mt-24` siempre: con el encabezado fijo del sitio,
un salto sin margen deja el título debajo de la barra.

**7. `ChecklistProgress` es design system; `SetupChecklist` no.**
La pieza genérica —avance escrito, barra, renglones con marca y acción— no sabe nada de tiendas y no
traduce nada, igual que `EmptyState` y `Alert`. La acción de cada renglón llega como `ReactNode`
porque un `Link` de `~/i18n/navigation` necesita el idioma activo y esa carpeta tiene que poder
pintarse fuera del árbol de next-intl. La barra va `aria-hidden` y el número escrito al lado: una
barra es la peor forma de contar cinco cosas para quien no la ve.

**8. Dos correcciones que solo aparecieron al mirar la pantalla.**
Se capturó `/cuenta` en escritorio, móvil (390 px) y sin tienda, y salieron dos cosas que ninguna
prueba iba a ver:
- Sin tienda ni dirección, la cabecera era **una tarjeta con un título dentro y nada más**: un marco
  alrededor del vacío. Ahí se queda en el `h1` pelado y quien manda en la pantalla pasa a ser la
  lista de pendientes, que es justo lo que esa persona necesita.
- Los cinco «Configurar» eran botones **rellenos**, y en columna pesaban más que el «Guardar ficha»
  que sí es la acción principal. Pasaron a contorno (`color="white"` + `border-separator`), sin
  inventar una variante nueva.

### Desviaciones del roadmap

- El `.feature` decía que sin logo se leen **las iniciales «PL»**. Se reutilizó `StoreLogo`, que ya
  existe y cae a **una sola inicial**, en vez de escribir un avatar nuevo o cambiarle el respaldo a
  los otros cuatro sitios donde se usa. El escenario se corrigió a «la inicial "P"». La promesa
  —no hay imagen rota y la fila mide lo mismo— es la misma.
- El enlace duplicado a la agenda estaba planificado para el slice 3 y salió en este, arrastrado por
  la retirada de `StoreCard`.

### Archivos tocados

**Dominio**
- `src/domain/entities/seller/accountSetup.ts` (nuevo) + `.test.ts`

**Design system**
- `src/presentation/design_system/feedback/ChecklistProgress.tsx` (nuevo)

**Ruta `/cuenta`**
- `anchors.ts` (nuevo), `ui/AccountHeader.tsx` (nuevo) + `.test.tsx`, `ui/SetupChecklist.tsx` (nuevo)
  + `.test.tsx`
- `page.tsx` (reparto de columnas y montaje), `ui/AccountCard.tsx` (`id` + `scroll-mt-24`),
  `ui/UsernameSection.tsx` (se queda solo el formulario), `ui/BecomeSellerForm.tsx`,
  `ui/AddBranchForm.tsx`, `ui/StoreProfileForm.tsx` (prop `id`)
- `ui/StoreCard.tsx` (**borrado**)

**Catálogos**
- `src/i18n/messages/es.json`, `en.json`: 20 claves nuevas en `account` (cabecera y los cinco pasos
  con su consejo)

**Pruebas**
- `src/e2e/sellerStore/cuentaConfigurable.feature` (nuevo), `cuentaConfigurable.spec.ts` (nuevo)
- `src/e2e/testUtils/completeStoreSetup.ts` (nuevo)
- `src/e2e/sellerStore/SellerAccountPage.ts` y `ProfilePage.ts`: **cambian de ancla, no de promesa**
  (`store-card` y `username-card` → `account-identity`)
- `src/e2e/compartir/cuentaLayout.spec.ts`: el `h1` ahora nombra la tienda; `storeCardTitle` sale de
  la lista de bloques; y la regla «lo que se comparte va antes que lo que se edita» se reescribió
  como lo que ahora promete la pantalla —las direcciones van **encima de todo**— en vez de como el
  orden de dos títulos concretos, que es lo que se rompía cada vez que un bloque se movía

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest run src/domain/entities/seller/accountSetup.test.ts` | 17/17 |
| `pnpm run test:run` | **2666/2666** en 245 archivos |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` (`biome check .`) | limpio, 1104 archivos |
| `pnpm exec playwright test src/e2e/sellerStore/cuentaConfigurable.spec.ts` | **7/7** |
| `pnpm exec playwright test src/e2e/compartir src/e2e/sellerStore` | **69/69** (primera pasada: 6 fallos, todos por el ancla `username-card`; ver decisión 4) |
| `pnpm exec playwright test src/e2e/compartir` (repetición) | 27/28 — ver «Un fallo que no es de este slice» |

### Un fallo que no es de este slice

`cuentaLayout.spec.ts › Y el hilo sobrevive a la paginación del perfil` falla, y **no lo rompió este
trabajo**: se comprobó guardando el slice en un `git stash` y corriendo el mismo escenario contra el
árbol base, donde falla exactamente igual.

Lo que pasa es que `/u/<username>/page/1` responde **404** —«Esta página se cosechó ya»—, así que la
barra de vuelta nunca llega a pintarse; el escenario informa «no encuentro `account-back-bar`»
cuando el problema real es que la página no existe. El perfil pagina sobre las publicaciones de la
cuenta de la suite, y el escenario da por hecho que hay al menos una. Es una prueba acoplada a un
dato que no siembra ella misma —justo el patrón que `AGENTS.md` llama frágil—.

Queda anotado como pendiente aparte, no se arregla aquí: tocarlo dentro de este slice mezclaría dos
cambios sin relación en el mismo commit.

**Nota de operación**: dos corridas de Playwright se interrumpieron a medias durante este slice. Sus
`afterEach` no llegaron a correr y el residuo en la base compartida hizo fallar 7 escenarios de
`src/e2e/compartir` en la siguiente pasada —incluidos cuatro de `compartirPublico`, que no tocan la
cuenta—. El `globalTeardown` barrió el residuo y esos siete volvieron a pasar. Si vuelve a verse un
fallo raro en esa área, mirar primero si quedó una corrida a medias (y un `next dev` huérfano
ocupando el puerto 3000).

**Escrito en la base compartida**: las corridas de Playwright crean tiendas con prefijo `e2e-`,
direcciones personales `e2e-…` y sus sucursales, y las borran en `afterEach`
(`deleteTestSellerByHandle`, `releaseUsername`, `deleteSession`). No queda nada que deshacer a mano.

### Recap

`/cuenta` ya no abre con un muro de cinco formularios iguales: abre con una cabecera que dice cuál
es tu tienda y las dos direcciones que repartes, y debajo una lista de cinco pasos que se marca sola
y desaparece cuando no falta nada. La regla de qué falta vive en el dominio y no cuesta ninguna
consulta nueva; la pieza que la pinta es genérica y vive en el design system. Se retiraron dos
tarjetas que habrían duplicado cada dirección, y con ellas un enlace duplicado a la agenda. Las dos
columnas de abajo pasaron a ser dos temas —la tienda y sus sucursales— en vez del corte «se enseña /
se edita», que era lo que partía las sucursales en dos. Todo lo demás del sistema de diseño está
intacto: ni un token nuevo, ni una `dark:` suelta.

### Próximos pasos (opciones)

1. **Slice 2 — Las sucursales, en un solo bloque.** Lista y alta en la misma tarjeta, el formulario
   plegado detrás de un botón cuando ya hay al menos una, y cada sucursal diciendo si el mapa la
   encuentra. Arregla de paso el `"Ver en el mapa"` en duro de `BranchList`, que se pinta también en
   la página pública. Es lo que más queda por juntar después de este slice.
2. **Slice 3 — La ficha sin muro.** Campos agrupados por sentido y vista previa del logo que la
   tienda **ya** tiene (hoy solo se ve el que acabas de subir). El enlace duplicado a la agenda ya
   salió aquí, así que el slice queda más corto de lo planificado.
3. **Slice 4 — Abrir tienda deja de ser una bifurcación.** Quitar el «Cancelar» que expulsa a `/` y
   dejar el alta como paso único.
4. **Añadir la agenda como sexto paso de la lista.** Se dejó fuera a propósito porque es la única
   que pediría una consulta más (`findWeeklyHours`). Si te interesa que se reclame, es un cambio de
   media hora.
5. **Arreglar el escenario preexistente de la paginación del perfil.** Que siembre su propia
   publicación en vez de dar por hecho que la cuenta de la suite tiene alguna. Es pequeño y va en su
   propio commit, sin mezclarse con el rediseño.

**Pendiente de tu lado**: decidir cuál de las cuatro va ahora. La rama es `feat/cuenta-configurable`
y no se ha empujado.
