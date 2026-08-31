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

## 2026-08-30 - Slice 2: panel superpuesto sin desplazar contenido

## Objetivo

Corregir la experiencia movil del panel de tienda para que funcione como una hoja inferior superpuesta, parecida al patron de Google Maps: el contenido del catalogo queda atras y no se empuja hacia abajo cuando se selecciona una tienda.

## Decisiones y racional

- El panel deja de vivir en un grid que reservaba espacio. Ahora es `fixed`, por lo que no participa en el flujo del documento.
- En movil se coloca como hoja inferior sobre el viewport. Se usa `z-[60]` para quedar por encima del contenido y de la barra inferior mientras esta abierto.
- En desktop se mantiene como panel lateral, pero tambien flotante: se posiciona a la derecha sin reducir el ancho del mapa.
- No se agrego backdrop. El objetivo era que el contenido siguiera visible atras, no convertir la ficha en un modal bloqueante.
- Se mantiene el mismo contenido de la slice anterior: nombre, distancia, CTA a la tienda y cierre.

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

## Comandos clave

- `pnpm exec playwright test src/e2e/localProducers/storeMapDetailPanel.spec.ts`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test:run`

## Validacion

- Prueba e2e nueva antes de implementar: fallo esperado. En movil la rejilla bajaba de `747.5` a `1011.5` al abrir el panel.
- Playwright focal `src/e2e/localProducers/storeMapDetailPanel.spec.ts`: 2/2 tests pasaron.
- Lint: paso sin errores.
- Typecheck: paso sin errores.
- Vitest: 229 archivos, 2505 tests pasaron.

Durante Playwright, la suite sembro y limpio la tienda/publicacion `E2E` con los helpers existentes. El servidor registro respuestas 412 de imagenes remotas de prueba (`seed.jpg`) y advertencias conocidas de entorno; no bloquearon la validacion.

## Desviaciones del roadmap

Sin desviaciones de alcance. Se mantuvo la ficha fuera de Leaflet, sin cargar datos comerciales nuevos y sin persistir la seleccion en URL.

## Follow-ups

- Ajustar el alto o gestos de la hoja inferior si se agregan productos recientes dentro del panel.
- Evaluar un estado visual de marcador seleccionado para mapas con muchas tiendas cercanas.

## Recap

El panel de tienda ya no desplaza el catalogo. En movil aparece como hoja inferior fija sobre el contenido, y en desktop como panel lateral flotante sin reducir el mapa. La interaccion conserva el cierre, la distancia y el enlace explicito a la tienda completa.

## Proximos pasos (opciones)

- Opcion A: revisar visualmente en un telefono real o emulador y ajustar altura/espaciado de la hoja.
- Opcion B: enriquecer el panel con publicaciones recientes de la tienda.
- Opcion C: trabajar accesibilidad avanzada y seleccion persistente.

## 2026-08-30 - Slice 3: logo y publicaciones recientes en la ficha

## Objetivo

Hacer que la ficha del mapa diga mas sobre la tienda antes de abrir su pagina completa: mostrar el logo junto al nombre y ensenar las ultimas cuatro publicaciones para que la persona pueda decidir sin salir del catalogo.

## Decisiones y racional

- El logo y las publicaciones viajan en `MappedStore`. Asi el panel se abre inmediato al seleccionar un pin y no dispara una consulta tardia por cada click.
- La consulta de tiendas sigue entregando una fila por tienda y conserva la sucursal mas cercana; se agrego un bloque lateral para las cuatro publicaciones mas recientes de esa misma tienda.
- La seleccion de traduccion usa el locale solicitado y cae al locale por defecto. El mapa se comporta igual que las tarjetas: no inventa texto si una traduccion aun no existe.
- El panel muestra una grilla compacta de dos columnas. En movil puede ocupar mas alto, pero sigue fijo sobre el contenido y anclado abajo; por eso la prueba mide el anclaje, no una coordenada rigida.
- Se retiro el texto "Abre la tienda completa para ver todo lo que publica" porque ahora la ficha ya ensena una muestra concreta. El CTA a la tienda queda como accion explicita.

## Archivos tocados

Documentacion:
- `docs/features/platform/034-2026-08-30-panel-detalle-tienda-mapa.md`
- `docs/features/platform/034-2026-08-30-panel-detalle-tienda-mapa-bitacora.md`

Especificacion y pruebas:
- `src/e2e/localProducers/storeMapDetailPanel.feature`
- `src/e2e/localProducers/storeMapDetailPanel.spec.ts`
- `src/e2e/testUtils/seedPost.ts`

Dominio y datos:
- `src/domain/entities/seller/map.ts`
- `src/infra/dataAccess/sellers/PostgresNearbyStores.ts`
- `src/app/[locale]/productos/data.ts`

Interfaz:
- `src/presentation/location/StoreMapDetailPanel.tsx`
- `src/presentation/location/StoresMap.tsx`
- `src/i18n/messages/es.json`
- `src/i18n/messages/en.json`

## Comandos clave

- `pnpm run typecheck`
- `pnpm run test:run`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/localProducers/storeMapDetailPanel.spec.ts`

## Validacion

- Typecheck: paso sin errores.
- Vitest: 229 archivos, 2505 tests pasaron.
- Lint: paso sin errores en 1046 archivos.
- Playwright focal `src/e2e/localProducers/storeMapDetailPanel.spec.ts`: 3/3 tests pasaron.

Durante Playwright, la suite sembro una tienda de prueba, cinco publicaciones y un logo local, y las limpio con los helpers existentes. El primer intento de Playwright no encontro tests por usar backslashes en el path; se repitio con path POSIX. Un segundo intento encontro que la asercion movil media una coordenada fija que ya no aplica al panel enriquecido; se cambio a medir que la ficha queda anclada abajo sin mover la rejilla.

## Desviaciones del roadmap

Sin desviaciones de producto. Se agrego un parametro `createdAt` al helper e2e de publicaciones para probar el orden de "ultimas 4" sin depender del reloj ni del orden accidental de insercion.

## Follow-ups

- Revisar si el panel debe incluir precio o tipo de publicacion en una slice posterior.
- Evaluar un gesto de arrastre/cierre de la hoja movil si el panel sigue creciendo.
- Considerar `loading="eager"` para logos de tiendas cuando se confirme visualmente que suelen ser LCP en esta ficha.

## Recap

La ficha de tienda del mapa ahora se siente mas completa sin convertirse en la pagina de tienda: muestra identidad visual junto al nombre, distancia, una muestra de hasta cuatro publicaciones recientes y mantiene el enlace explicito a la pagina completa. La seleccion sigue fuera de Leaflet y superpuesta al contenido.

## Proximos pasos (opciones)

- Opcion A: revisar visualmente `/productos` en desktop y movil con datos reales para ajustar densidad de tarjetas.
- Opcion B: agregar metadatos compactos a cada publicacion reciente, como precio o categoria, si ayudan a decidir.
- Opcion C: implementar la slice 4 de accesibilidad fina y seleccion persistente.
