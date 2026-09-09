# Bitácora — Existencias en resultados de búsqueda

## 2026-09-08 — Slice 1: la búsqueda trae y pinta existencias iniciales

### Objetivo

Hacer que un resultado de `/buscar` muestre desde el primer render el inventario guardado en
`posts.stock_quantity`, y que al recargar la misma búsqueda el dato siga visible porque viene de la
consulta inicial, no de estado vivo en el cliente.

### Decisiones y rationale

- Se añadió `stockQuantity` al contrato compartido de publicación. La búsqueda ya hidrataba las
  filas completas de `posts`, pero el objeto que devolvía no publicaba el campo y la tarjeta lo
  recibía como `null`.
- Se conectó `row.stockQuantity` en `PostgresSearchPostRepository.hydrate()`. No hizo falta cambiar
  ranking, paginación ni filtros: el problema estaba en la hidratación final de la página.
- `CardForList` reutiliza `StockRemaining`, el mismo badge que ya usa la ficha de producto. Así la
  tarjeta puede decir cuántas unidades quedan también para visitantes, no sólo llenar el input de
  quien administra.
- El copy se mantuvo tal como vive hoy en el catálogo: “Quedan 8 unidades”. No se cambió a
  “existencias” para no mezclar microcopy con el arreglo de datos.

### Archivos tocados

- Contrato y lectura:
  - `src/domain/entities/post/types.ts`
  - `src/infra/types/Posts.d.ts`
  - `src/infra/dataAccess/searchPosts/PostgresSearchPostRepository.ts`
- UI:
  - `src/presentation/post/CardForList/CardForList.tsx`
  - `src/presentation/post/CardForList/CardForList.test.tsx`
- E2E:
  - `src/e2e/inventory/existenciasEnBusqueda.spec.ts`
- Documentación:
  - `docs/features/search/005-2026-09-08-existencias-en-busqueda-bitacora.md`

### Comandos clave

```bash
pnpm run test:run -- src/presentation/post/CardForList/CardForList.test.tsx
pnpm run typecheck
pnpm exec playwright test src/e2e/inventory/existenciasEnBusqueda.spec.ts --reporter=line
pnpm run test:run
pnpm run lint
```

### Validación

- `pnpm run test:run -- src/presentation/post/CardForList/CardForList.test.tsx`: 1 archivo, 47
  tests pasaron.
- `pnpm run typecheck`: pasó.
- `pnpm exec playwright test src/e2e/inventory/existenciasEnBusqueda.spec.ts --reporter=line`: el
  primer intento se quedó en arranque por el síntoma conocido de JSON generado corrupto en `.next`.
  Se limpió `.next` y se repitió el mismo spec; 23/23 rutas calentadas y 1/1 test pasó.
- `pnpm run test:run`: 275 archivos, 2894 tests pasaron.
- `pnpm run lint`: 1198 archivos revisados, sin fixes.

### Desviaciones del roadmap

El escenario aprobado decía “existencias” en el texto esperado, pero la interfaz existente dice
“unidades”. La prueba se escribió contra el copy actual para no abrir otro frente de contenido.

### Follow-ups

Queda separado el slice 2 del roadmap: probar el flujo completo de editar existencias desde una
tarjeta de búsqueda y confirmar que una búsqueda nueva rehidrata el número recién guardado.

### Recap

La búsqueda ya lleva `stockQuantity` hasta la tarjeta y `CardForList` muestra el badge de unidades
restantes cuando el producto lleva inventario. El caso cubierto siembra un producto con 8 unidades,
lo busca, comprueba el badge, recarga la página y vuelve a comprobar que el número sigue visible.

### Próximos pasos (opciones)

- Implementar el slice 2 para cubrir edición desde la tarjeta de búsqueda y rehidratación posterior.
- Revisar el copy de inventario si el producto quiere decir “existencias” en vez de “unidades” en
  todas las superficies.
- Commit del slice 1 cuando se decida integrar este cambio.
