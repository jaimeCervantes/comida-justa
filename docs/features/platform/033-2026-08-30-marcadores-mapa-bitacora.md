# Bitacora: marcadores modernos del mapa

## Objetivo

Modernizar los marcadores del mapa de productos cercanos para que la ubicacion del visitante y las tiendas se distingan rapido, con iconos profesionales y colores que contrastan con el mapa base.

## Decisiones y racional

- Mantener Leaflet `divIcon` para no tocar la logica de coordenadas, bounds, popups ni navegacion existente.
- Sustituir los emojis por SVG inline controlados por CSS. Esto evita variaciones por sistema operativo y deja una apariencia consistente.
- Usar azul para la ubicacion del visitante y magenta para tiendas. Ambos colores se separan del verde dominante del mapa y mantienen buena lectura sobre el fondo.
- Centralizar la forma visual en `utility-patterns.css` para que el componente solo declare la semantica del marcador.

## Archivos tocados

Documentacion:
- `docs/features/platform/033-2026-08-30-marcadores-mapa.md`
- `docs/features/platform/033-2026-08-30-marcadores-mapa-bitacora.md`

Especificacion y pruebas:
- `src/e2e/localProducers/mapMarkers.feature`
- `src/e2e/localProducers/mapMarkers.spec.ts`

Interfaz:
- `src/presentation/location/StoresMapCanvas.tsx`
- `src/app/styles/utility-patterns.css`

## Comandos clave

- `pnpm exec playwright test src/e2e/localProducers/mapMarkers.spec.ts`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm exec biome check --write src\e2e\localProducers\mapMarkers.spec.ts`
- `pnpm exec playwright test src/e2e/localProducers`

## Validacion

- Prueba e2e nueva antes de implementar: fallo esperado porque `.map-marker--store` aun no existia.
- Prueba e2e nueva despues de implementar: 1/1 paso.
- Vitest: 229 archivos, 2505 tests pasaron.
- Typecheck: paso sin errores.
- Lint: paso despues de formatear `mapMarkers.spec.ts` con Biome.
- Playwright scoped `src/e2e/localProducers`: 25/25 tests pasaron.

Durante Playwright, el servidor registro respuestas 412 de imagenes remotas de prueba (`seed.jpg`) y una advertencia de LCP ya existente; no bloquearon la suite. La suite `localProducers` creo datos de prueba en la base compartida y los limpio mediante los helpers de la suite y el teardown global.

## Desviaciones del roadmap

Sin desviaciones de alcance. No se modifico `RouteMapCanvas`, rutas GPX, popups ni reglas de filtrado.

## Follow-ups

- Considerar una leyenda compacta del mapa si se agregan mas tipos de marcador.
- Si aparecen clusters o densidad alta de tiendas, evaluar marcadores agrupados en una slice separada.

## Recap

El mapa de productos cercanos ahora usa marcadores SVG consistentes: tiendas en magenta y ubicacion del visitante en azul, con forma de pin, sombra y anclaje estable. La mejora quedo limitada a la capa visual de `StoresMapCanvas`, sin cambios de comportamiento.

## Proximos pasos (opciones)

- Revisar visualmente en `/productos` con datos locales y ajustar tono o tamano si se quiere mas contraste.
- Extender el mismo lenguaje visual a otros mapas de la aplicacion en una tarea separada.
