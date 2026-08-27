# Bitácora — Enter y el botón «enviar» del teclado ya buscan

## Slice 1 — El campo entra a un `<form>` de verdad (2026-08-27)

### Lo que se reportó

El usuario lo notó usando el sitio: escribir en el buscador y pulsar Enter no hacía nada.
Tampoco el botón «Buscar»/«Ir» del teclado de un teléfono, que en un `<input type="search">` sin
`<form>` no tiene ningún `submit` al que engancharse.

### La causa

`SearchBar` envolvía el campo en un `<div>`. Sin un `<form>`, no hay evento `submit` que escuchar
—ni el que dispara Enter en un teclado físico ni el que dispara el botón de acción del teclado
virtual—, así que la única forma de llegar a `/buscar` con los resultados completos era hacer clic
en «Ver todos los resultados», al fondo del desplegable.

### La solución: `<form onSubmit>`, no un `keydown` a mano

Escuchar `keydown` y comprobar `key === "Enter"` habría cazado el teclado físico, pero no de forma
confiable el botón del teclado móvil —no todos los teclados virtuales emiten una tecla
interceptable, y es justo la mitad del reporte—. El evento `submit` de un formulario es la forma
nativa que cubre los dos casos con un solo manejador: es el mismo evento que dispara cualquiera de
las dos acciones.

- El `<div>` que envolvía el campo pasó a `<form onSubmit={handleSubmit}>`. El manejador hace
  `preventDefault()` y llama a la misma función que ya usaba el botón «Ver todos los resultados»,
  así que Enter y ese botón navegan exactamente igual — no hay una segunda ruta a mantener.
- Con el campo vacío, Enter no navega a ninguna parte: mismo criterio que ya usa el desplegable
  (`trimmed.length > 0`) para decidir si hay algo que buscar.
- `enterKeyHint="search"` en el `<input>`: en un teléfono, el botón de acción del teclado pasa de
  decir «Ir» genérico a «Buscar», que es lo que realmente hace.
- Se probó `role="search"` en el `<form>` y Biome lo marcó: el elemento nativo `<search>` es el
  reemplazo que pide esa regla, y añadir un elemento nuevo solo para el landmark no valía la pena
  en este slice. Se retiró.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Presentación | `src/presentation/search/SearchBar.tsx` (+ test) |
| Especificación | `src/e2e/chrome/searchSubmit.spec.ts` (nuevo) |

### Comandos y resultados

```
pnpm exec vitest --run src/presentation/search   # 24 en verde, 2 archivos
pnpm run typecheck · lint · check:i18n           # limpios
pnpm exec playwright test src/e2e/chrome/searchSubmit.spec.ts src/e2e/chrome/searchShortcut.spec.ts
  # 5/5 en aislado — la primera corrida combinada dio un falso rojo por procesos huérfanos
  # de un run anterior (ver nota de proceso abajo), no por este cambio
```

### Nota de proceso: procesos huérfanos de Playwright

Corriendo esta sesión aparecieron cinco procesos `node.exe` de servidores `next dev` que
`pnpm exec playwright test` había arrancado y que sobrevivieron a corridas anteriores detenidas a
medias. Con los cinco compitiendo por CPU/memoria, la siguiente corrida combinada dio un rojo en
`searchShortcut.spec.ts` que **no se repitió en aislado** tras matarlos. Vale la pena tenerlo
presente si una corrida futura falla sin motivo aparente: revisar `netstat` antes de desconfiar del
código.

### Recap

El buscador del header ya reacciona a Enter y al botón de acción del teclado del teléfono, con el
mismo destino que ya ofrecía «Ver todos los resultados» — un solo camino, no dos que puedan
desalinearse.

### Próximos pasos (opciones)

1. **Cola offline optimista** — pendiente de la conversación de alcance que se pospuso.
2. **El editor enriquecido** (`docs/features/content/027`) — sigue siendo lo pedido y lo único
   pendiente que arregla algo roto hoy.
