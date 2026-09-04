# La cuenta se configura sola: `/cuenta` deja de ser un muro de formularios

## Contexto

- **Problema**: quien abre `/cuenta` ve cinco tarjetas del mismo peso visual repartidas en dos
  columnas por un criterio interno («lo que se enseña» / «lo que se edita»). No sabe cuál es su
  tienda de un vistazo, qué ya configuró, ni qué le falta para que sus clientes la encuentren. La
  lista de sucursales y su alta están a media pantalla de distancia; en el teléfono, a tres tarjetas
  de desplazamiento.
- **Ahorro**: menos altas abandonadas a medias, menos tiendas sin logo ni ubicación —que son
  justamente las que el chatbot **no puede recomendar por cercanía**— y menos preguntas de «¿dónde
  configuro esto?».
- **Por qué**: la tienda es el activo del vendedor dentro de la plataforma. Una tienda a medio
  configurar no aparece en las búsquedas con ubicación, así que el catálogo pierde oferta real
  aunque el vendedor ya se haya dado de alta.

## El diagnóstico, con el archivo y el renglón

| # | Fricción | Dónde |
| --- | --- | --- |
| 1 | **Las sucursales están partidas en dos.** «Tus sucursales» en la columna izquierda y «Agrega una sucursal» en la derecha: la misma tarea, media pantalla en medio. | `cuenta/page.tsx:113-128` |
| 2 | **Nada dice qué falta.** Ni logo, ni nombre de tienda como encabezado, ni señal de «te falta reservar tu dirección / poner ubicación / subir logo». | `cuenta/page.tsx:107` |
| 3 | **El alta de sucursal siempre desplegada**: cuatro campos y un botón de geolocalización dominando la pantalla aunque ya tengas tres sucursales. | `cuenta/ui/AddBranchForm.tsx` |
| 4 | **Sin tienda, dos decisiones sin relación al mismo nivel** («Vende lo que haces» junto a «Tu dirección personal») y un **«Cancelar» que expulsa a `/`** en medio del alta. | `cuenta/page.tsx:88-101`, `BecomeSellerForm.tsx:113` |
| 5 | **Destinos duplicados**: la agenda se enlaza dentro de `StoreCard` *y* en el menú lateral. | `cuenta/ui/StoreCard.tsx:43-54` |
| 6 | **Cadena en duro en español**: `"Ver en el mapa"` dentro de `BranchList`, que además se pinta en la página pública. | `presentation/directory/BranchList/BranchList.tsx:37` |

## Lo que NO se toca

- **El sistema de diseño se conserva**: los mismos tokens semánticos, `Surface`, `Button`,
  `TextField`, `Heading` y `AccountCard`. Nada de `dark:` sueltas ni de radios a mano.
- **`AccountNav` y `AccountSection` se quedan como están.** El menú de la sección y su layout
  (`ACCOUNT_PAGE_LAYOUT`) ya resolvieron su problema en
  `docs/features/content/029-2026-08-28-la-cuenta-sin-callejones.md`; este roadmap trabaja **dentro**
  del hueco de contenido, no alrededor.
- **Ninguna dirección pública cambia.** `/tienda/<handle>` y `/u/<username>` son enlaces ya
  repartidos.

## Slices

### Slice 1 — La cuenta se lee de un vistazo

**Alcance.** Sustituir el `h1` pelado por una **cabecera de identidad** y añadir **una lista de lo
que falta configurar**.

- `AccountHeader`: el logo de la tienda (o sus iniciales si no lo ha subido), el nombre de la tienda
  como `h1`, y **sus direcciones públicas con su botón de repartir** — la de la tienda y la personal,
  una debajo de otra.
- `SetupChecklist`: cinco pasos en orden fijo, cada pendiente con su enlace al sitio donde se
  resuelve. Desaparece entera cuando no falta nada.
- La regla de «qué falta» vive en el dominio (`accountSetup.ts`) como función pura: la página solo
  le pasa un retrato de lo que ya lee.

**Lo que se retira, y por qué no es alcance de más.** La cabecera pasa a ser la dueña de las dos
direcciones públicas. Dejar además `StoreCard` y la rama «ya reservada» de `UsernameSection`
pintaría cada dirección **dos veces en la misma pantalla**, que es peor que el problema que venimos a
arreglar. Así que las dos se van de la página con la cabecera. `UsernameSection` **sí se queda
cuando todavía no hay dirección reservada**: ahí no es un duplicado, es la acción pendiente.

**Criterios de aceptación**

1. Con tienda, la cabecera muestra el nombre de la tienda como único `h1` de la página, y sus dos
   direcciones públicas en camino corto (`/tienda/…`, `/u/…`), cada una con su disparador de
   compartir.
2. Sin logo, la cabecera muestra las iniciales del nombre de la tienda en vez de una imagen rota.
3. La lista de pendientes enumera los cinco pasos en orden fijo, marca los cumplidos y ofrece enlace
   solo en los que faltan.
4. Con los cinco pasos cumplidos, la lista no se pinta.
5. Ninguna dirección pública aparece dos veces en la página.
6. Cero cadenas visibles en duro: todo pasa por `es.json` / `en.json`.

### Slice 2 — Las sucursales, en un solo bloque

Lista y alta dentro de la misma tarjeta. Con al menos una sucursal, el formulario arranca plegado
detrás de un botón «Agregar sucursal». Cada sucursal dice si tiene ubicación en el mapa o no —que es
la diferencia entre aparecer o no en las búsquedas por cercanía—. Se arregla de paso el
`"Ver en el mapa"` en duro de `BranchList`.

### Slice 3 — La ficha se edita sin muro

Los campos de `StoreProfileForm` agrupados por sentido (identidad / contacto / imagen), con la vista
previa del logo que **ya** tiene la tienda y no solo el del que acaba de subir. El enlace duplicado a
la agenda sale de `StoreCard`.

### Slice 4 — Abrir tienda deja de ser una bifurcación

La rama sin vendedor se convierte en un paso único y claro; la dirección personal baja a paso
secundario y el «Cancelar» que expulsa a `/` desaparece.

## Escenarios

`src/e2e/sellerStore/cuentaConfigurable.feature`, etiquetados por slice. Solo los de `@slice-1`
están detallados y cableados a pruebas ejecutables; los demás llevan `@future` y se quedan en
esqueleto a propósito, para no escribir un detalle que el primer slice va a corregir.
