# Existencias en resultados de búsqueda

## Context

### Problem

Las existencias se pueden editar desde una tarjeta y el guardado sí persiste, pero al volver a
buscar o recargar `/buscar` la tarjeta inicial no muestra visualmente ese número. La señal apunta a
que el read model de búsqueda no trae `stock_quantity`, aunque otras superficies de tarjeta ya sepan
mostrarlo cuando el dato llega.

### Savings

Evita la duda de "sí guardó o no guardó" y reduce decisiones de compra con información incompleta.
También evita que quien administra tenga que abrir la ficha del producto sólo para confirmar una
existencia que debería verse desde la lista donde está trabajando.

### Why

La búsqueda es la puerta principal del catálogo. Si el inventario existe pero desaparece justo en los
resultados, el sitio vuelve a comportarse como catálogo estático en el momento más importante:
cuando alguien compara qué puede pedir.

## Roadmap de slices

### Slice 1 — La búsqueda trae y pinta las existencias iniciales

Hacer que los resultados iniciales de `/buscar` incluyan la cantidad guardada de inventario y que la
tarjeta reutilice la misma representación visual de existencias que ya usan ficha, perfil y tienda.
El comportamiento de guardado no cambia: este slice sólo corrige la lectura inicial.

**Criterios de aceptación.** Un producto sembrado con 8 existencias aparece en `/buscar` diciendo
que quedan 8 desde el primer render. Al recargar la misma URL o repetir la búsqueda, el número se
mantiene sin depender de una edición previa en memoria.

### Slice 2 — La edición desde búsqueda rehidrata con el dato recién guardado

Cubrir el flujo completo que disparó el reporte: una persona administradora cambia existencias en
una tarjeta de búsqueda, la acción guarda, y una nueva búsqueda o recarga arranca con ese mismo
número visible.

**Criterios de aceptación.** Después de guardar 12 existencias desde una tarjeta de resultados, una
nueva carga de `/buscar` muestra 12 sin necesitar abrir la ficha ni tocar la tarjeta otra vez.

## Fuera de alcance

- Cambiar la regla de disponibilidad derivada de inventario.
- Cambiar la acción que guarda existencias.
- Crear o ejecutar migraciones de base de datos.
- Rediseñar la tarjeta de producto.

## Validación planeada

```bash
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm exec playwright test src/e2e/inventory/existenciasEnBusqueda.spec.ts --reporter=line
```
