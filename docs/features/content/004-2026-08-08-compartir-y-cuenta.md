# Compartir y Mi cuenta: la dirección deja de ser texto que hay que copiar a mano

## El problema

Un vendedor abre `/cuenta` y ve su dirección pública **como texto enlazado y nada más**:

- `StoreCard.tsx:25-30` pinta `https://…/tienda/hazlo-sano` dentro de un `<Link>`. Para llevarla a
  WhatsApp hay que seleccionarla con el cursor —sobre un enlace, que al arrastrar navega—, copiarla,
  abrir la otra aplicación y pegarla.
- `UsernameSection.tsx:41-48` hace exactamente lo mismo con `/u/jaime-cervantes`.
- No existe **ningún** botón de compartir en el repositorio. `grep -ril "share|compartir"` sobre
  `src/` devuelve metadatos de Open Graph y el `becomeSellerShare` que es solo una frase de ayuda.

Y desde el avatar del encabezado no hay forma de llegar a lo propio:

- `UserMenu.tsx:62-84` ofrece `Mi cuenta`, las dos herramientas de administración y `Cerrar sesión`.
  Para ver su tienda como la ve un cliente, el vendedor tiene que entrar a `/cuenta`, localizar el
  enlace entre los formularios y pulsarlo. Dos navegaciones para llegar a una página que es suya.
- El menú tampoco dice **quién** eres más allá del nombre: no hay `@usuario`, que es la pieza que
  Instagram, TikTok y X ponen justo bajo el nombre en ese mismo menú.

La página, además, no tiene jerarquía: `page.tsx:95-114` reparte cinco secciones en dos columnas,
todas con el mismo peso visual y sin superficie que las separe. `StoreCard` incluso abre con un
`<h1>` propio, de modo que la página tiene dos `h1`.

### Lo que dice la base (consultada el 2026-08-08)

| dato | valor |
| --- | --- |
| usuarios | 21 |
| usuarios con dirección personal | **1** — `jaime-cervantes` (Jaime Cervantes) |
| tiendas | 3 — `hazlo-sano` real, y 2 residuos `e2e-…` de una corrida caída |
| tiendas con dueño (`user_id`) | **1** — `Hazlo Sano`, del mismo `44pZIIJ5w1vSYkDQ6gfb` |
| sucursales | 2 |
| publicaciones | 26 |

El caso "tengo tienda **y** perfil" existe hoy exactamente una vez, y es la misma persona: la tienda
`Hazlo Sano` (`/tienda/hazlo-sano`) y el perfil `/u/jaime-cervantes` cuelgan del mismo usuario. Eso
fija los datos de los escenarios y confirma que el menú tiene que aguantar los cuatro estados: con
las dos cosas, solo tienda, solo perfil, y ninguna de las dos (los otros 20 usuarios).

Los dos `sellers` con prefijo `e2e-` y `user_id = NULL` son basura de una corrida interrumpida. No
los toca este trabajo; quedan anotados como pendiente en el bitácora.

## Lo que ahorra

Compartir la tienda pasa de cinco pasos manuales (seleccionar sin navegar, copiar, cambiar de app,
elegir contacto, pegar) a **un clic**. En móvil, la hoja nativa del sistema pone Instagram, TikTok y
Messenger como destinos reales, que es la única vía que existe para esas dos: **ni Instagram ni
TikTok tienen URL de compartir web**, y por eso las suites de Mercado Libre y Amazon resuelven ese
caso con `navigator.share` y con «copiar enlace» para la biografía.

Del lado del avatar, dos navegaciones menos cada vez que el vendedor quiere verse como lo ven sus
clientes — que es lo que hace antes de repartir el enlace.

## Por qué

Una tienda solo sirve si circula. El sitio ya resuelve tener una dirección estable
(`vendedores-y-tiendas.md`, slices 1 y 4); lo que falta es que salga de la pantalla. Si compartirla
cuesta trabajo, no se comparte, y el catálogo de la comunidad no llega a nadie.

## Decisiones

### Por qué el menú de compartir y no botones sueltos

Seis destinos en fila ocupan el ancho de la tarjeta y compiten con la acción real de la página
(dar de alta la tienda, editar la ficha). Un disparador «Compartir» que despliega es el patrón de
Mercado Libre y de Amazon, y reusa el `@radix-ui/react-dropdown-menu` que el encabezado ya trae:
cero dependencias nuevas.

### Por qué la Web Share nativa va primero y no como respaldo

`navigator.share` existe en el móvil, que es donde se comparte, y ofrece **más** destinos que
cualquier lista propia. Cuando no existe —escritorio, o navegador sin soporte— se despliega el menú.
La detección se hace en el cliente tras montar, no en el servidor: `navigator` no existe durante el
render del servidor y consultarlo en el primer render rompería la hidratación.

### Por qué los enlaces de compartir son dominio y no una constante en el componente

Son reglas puras («X quiere `url` y `text` por separado, Facebook solo lee `u` porque el texto lo
saca de las etiquetas Open Graph, Telegram acepta los dos»). Puestas en el componente no se pueden
probar sin navegador; en `src/domain/sharing/` se prueban con una tabla y las reusa cualquiera.

### Por qué Facebook ignora el texto

`sharer.php` solo acepta `u`. Desde 2017 Facebook **descarta** cualquier `quote` o `description` que
se le pase y compone la publicación con las etiquetas Open Graph de la página destino. Pasarle texto
sería código muerto que aparenta funcionar, así que no se le pasa.

### Por qué el ajuste de `/cuenta` es progresivo

Las Server Actions (`actions.ts`) y los formularios ya están probados por siete escenarios de
`sellerStore.feature`. Envolver las secciones en `Surface` y arreglar la jerarquía de encabezados
no toca ninguno de esos caminos, así que la suite existente sigue siendo la red de seguridad.

## Los slices

### Slice 1 — Compartir la tienda y el perfil desde Mi cuenta

**Alcance.** Un componente de compartir, reusable, junto a cada una de las dos direcciones de
`/cuenta`.

- `src/domain/sharing/shareTargets.ts`: función pura `shareTargetLink(network, { url, text })` para
  `whatsapp`, `facebook`, `x`, `telegram` y `email`, con sus pruebas de tabla.
- `src/presentation/sharing/ShareMenu/ShareMenu.tsx`: cliente. Si hay `navigator.share`, un botón
  que abre la hoja nativa; si no, el desplegable de Radix con los cinco destinos y «Copiar enlace».
- «Copiar enlace» usa `navigator.clipboard` y confirma en el sitio («¡Copiado!») durante unos
  segundos, sin `alert` ni recarga.
- Se monta en `StoreCard` y en `UsernameSection`.

**Criterios de aceptación.**

1. Con tienda dada de alta, `/cuenta` ofrece compartir junto a la dirección de la tienda, y el
   destino de WhatsApp lleva la dirección absoluta ya codificada.
2. Con dirección personal reservada, ofrece lo mismo junto al perfil.
3. «Copiar enlace» deja la dirección absoluta en el portapapeles y lo confirma en pantalla.
4. Cada destino arma la URL que le corresponde (tabla del escenario de la corrida de escritorio).
5. Ninguna cadena visible está escrita en el componente: todas salen de `es.json` / `en.json`.

### Slice 2 — El menú del avatar lleva a mi tienda y a mi perfil

**Alcance.** `Header` resuelve la tienda y el perfil de la sesión y se los pasa a `UserMenu`.

- Bloque de identidad arriba (avatar grande, nombre, `@usuario`), al estilo de Instagram y Facebook.
- `Mi tienda` → `/tienda/<handle>` y `Mi perfil` → `/u/<username>`, **cada uno solo si existe**.
- Lo mismo en `MobileNav`, que hoy solo enlaza a `/cuenta`.
- Sin consulta extra por render: se resuelve junto a la sesión que `Header` ya pide.

**Criterios de aceptación.**

1. Con tienda y perfil, el menú muestra las dos entradas y llevan a la dirección pública correcta.
2. Sin ninguna de las dos, el menú queda como hoy y no aparece ninguna entrada vacía.
3. El `@usuario` aparece bajo el nombre solo si la dirección está reservada.
4. El menú móvil ofrece los mismos destinos.

### Slice 3 — La UX de Mi cuenta, ordenada

**Alcance.** Jerarquía y superficie, sin tocar Server Actions ni formularios.

- Cada sección en un `Surface` (`raised`, borde sutil), con un solo `h1` en la página.
- Orden por lo que se necesita primero: identidad y direcciones arriba, ficha y sucursales después.
- Estado vacío explícito cuando no hay tienda o no hay dirección personal.

**Criterios de aceptación.**

1. La página tiene exactamente un `h1` y las secciones cuelgan de `h2`.
2. Los siete escenarios de `sellerStore.feature` siguen verdes sin editarlos.

### Slice 4 — Compartir desde las páginas públicas

**Alcance.** Reuso de `ShareMenu` allí donde comparte **el comprador**, no el vendedor.

- `/tienda/[slug]` (`StoreHeader`), `/u/[username]` (`ProfileHeader`) y la ficha de la publicación
  (`PostDetail`, junto al botón de pedir).
- Las tarjetas de cualquier listado (`CardForList`), con una variante `icon` del menú.
- **Sin sesión.** Si compartir exigiera cuenta, la mitad de las veces que alguien quiere repartir un
  enlace no podría.

**Criterios de aceptación.**

1. Un visitante sin sesión puede compartir tienda, perfil, ficha y tarjeta.
2. El texto va en la voz de quien mira («esta tienda»), no en la del dueño («mi tienda»), que es la
   que usa `/cuenta`.
3. La dirección repartida es siempre absoluta, incluso si la tarjeta trae un camino relativo.
4. En una tarjeta basta el icono, y su nombre accesible sigue siendo «Compartir» completo.

### Ajuste posterior — las direcciones de `/cuenta`

Lo pidió el usuario al ver el slice 1 funcionando, y los tres problemas eran reales:

- **La dirección absoluta partía el renglón.** `https://hazlosano.com/tienda/hazlo-sano` empujaba al
  botón fuera de la tarjeta. Ahora se lee el camino (`/tienda/hazlo-sano`) y lo que se comparte
  sigue siendo la absoluta: se acorta lo que se lee, no lo que se copia.
- **El enlace no se separaba del botón.** Los dos viven en `PublicAddressRow`, con el enlace a la
  izquierda y el botón a la derecha del mismo renglón.
- **Se abre en pestaña nueva.** Quien pulsa está comprobando cómo se ve su página antes de
  repartirla, no navegando: perder la cuenta a medio configurar es justo lo que no quiere.

## Pendientes que este trabajo no resuelve

- Los dos `sellers` `e2e-…` huérfanos en la base, residuo de una corrida caída.
- 20 de los 21 usuarios no tienen dirección personal: el menú del slice 2 les enseñará solo
  `Mi cuenta`, que es lo correcto, pero el embudo de reserva sigue sin trabajarse.
