# Bitacora: panel de detalle de tienda desde el mapa

## 2026-08-30 - Slice 1: ficha visible al seleccionar una tienda

## Objetivo

Cambiar la interaccion del mapa de `/productos` para que seleccionar una tienda no saque a la persona del catalogo. El click en un marcador ahora abre una ficha del sitio, lateral en desktop y debajo del mapa en movil, con el camino a la pagina completa como accion explicita.

## Decisiones y racional

- La seleccion vive en `StoresMap`, no dentro de Leaflet. Asi el panel queda fuera del mapa y forma parte del layout del sitio.
- `StoresMapCanvas` se queda como adaptador de Leaflet: pinta pines, recibe la seleccion actual y notifica `onStoreSelect`.
- El panel usa el `MappedStore` existente. Para esta slice no se agregaron consultas ni datos comerciales nuevos; eso evita tocar paginacion, orden por cercania o repositorios.
- Se quito el popup de tienda. El popup del visitante se mantiene porque solo informa "aqui estas tu" y no compite con la ficha.
- Los marcadores de tienda reciben mayor `zIndexOffset` que el marcador del visitante. En distancias cortas, el click debe favorecer la tienda porque es la accion explorable.
- Al aparecer el panel en desktop, el mapa puede cambiar de ancho. Se invalida el tamano de Leaflet al cambiar la seleccion para evitar tiles desfasados.

## Archivos tocados

Documentacion:
- `docs/features/platform/034-2026-08-30-panel-detalle-tienda-mapa.md`
- `docs/features/platform/034-2026-08-30-panel-detalle-tienda-mapa-bitacora.md`

Especificacion y pruebas:
- `src/e2e/localProducers/storeMapDetailPanel.feature`
- `src/e2e/localProducers/storeMapDetailPanel.spec.ts`

Interfaz:
- `src/presentation/location/StoreMapDetailPanel.tsx`
- `src/presentation/location/StoresMap.tsx`
- `src/presentation/location/StoresMapCanvas.tsx`
- `src/app/styles/utility-patterns.css`
- `src/i18n/messages/es.json`
- `src/i18n/messages/en.json`

## Comandos clave

- `pnpm exec playwright test src/e2e/localProducers/storeMapDetailPanel.spec.ts`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test:run`

## Validacion

- Prueba e2e nueva antes de implementar: fallo esperado porque no existia `store-map-detail-panel`.
- Prueba e2e durante implementacion: encontro que el pin del visitante podia quedar por encima de una tienda cercana; se ajusto el `zIndexOffset`.
- Vitest: 229 archivos, 2505 tests pasaron.
- Typecheck: paso sin errores.
- Lint: paso sin errores.
- Playwright focal `src/e2e/localProducers/storeMapDetailPanel.spec.ts`: 1/1 paso.

Durante Playwright, la suite sembro una tienda y una publicacion de prueba con prefijo `E2E` y las limpio con los helpers existentes. Tambien se registraron respuestas 412 de imagenes remotas de prueba (`seed.jpg`) y una advertencia LCP ya conocida; no bloquearon la prueba.

## Desviaciones del roadmap

No se agregaron productos recientes al panel, logos, telefonos ni horarios; siguen fuera de alcance para slices posteriores. Se agrego un ajuste tecnico no listado originalmente: recalcular el tamano de Leaflet cuando aparece el panel lateral, porque en desktop el grid cambia el ancho disponible del mapa.

## Follow-ups

- Enriquecer la ficha con publicaciones recientes o categorias principales si el repositorio puede entregarlo sin duplicar consultas costosas.
- Evaluar estado visual de marcador seleccionado cuando haya varias tiendas muy cercanas.
- Revisar foco de teclado y persistencia de seleccion en query string si se vuelve necesario compartir un mapa con tienda abierta.

## Recap

La seleccion de tienda en el mapa de `/productos` ya no navega automaticamente ni depende de un popup de Leaflet. El sitio muestra una ficha externa al mapa con nombre, distancia, cierre y enlace explicito a la pagina publica de la tienda; en desktop se acomoda al lado del mapa y en movil queda debajo.

## Proximos pasos (opciones)

- Opcion A: revisar visualmente `/productos` en desktop y movil para ajustar densidad, ancho o tono del panel.
- Opcion B: implementar la slice 2 para mostrar publicaciones recientes de la tienda dentro de la ficha.
- Opcion C: mejorar accesibilidad avanzada de seleccion, foco y estado compartible del mapa.
