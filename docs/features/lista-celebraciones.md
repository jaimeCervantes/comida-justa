# Lista de celebraciones publicas

Roadmap para que el inicio refleje varios logros compartidos de los cuatro pilares en vez de
reemplazarlos visualmente por el mas reciente. La especificacion vive en
`src/e2e/habits/publicCelebrationList.feature` y la bitacora en
`docs/features/lista-celebraciones-bitacora.md`.

## Alineacion

- **Problem:** cada hito se persiste por persona, ritual y milestone, pero el inicio consulta
  `limit(1)`. Al practicar y compartir varios pilares, solo queda visible el ultimo.
- **Savings:** se elimina la percepcion de que los logros anteriores se perdieron y se reconoce la
  practica multipilar sin obligar a buscar cada reto por separado.
- **Why:** el jardin y los rituales representan cuatro dimensiones complementarias; la actividad
  comunitaria debe mostrar esa diversidad, no reducirla a un unico evento.

## Modelo acordado

- El inicio muestra como maximo las ocho celebraciones publicas mas recientes.
- El orden es `published_at DESC, id DESC`, estable incluso cuando dos hitos comparten timestamp.
- Cada hito compartido ocupa una tarjeta independiente y conserva identidad, enlace y reaccion de su
  pilar.
- Los hitos retirados no aparecen y retirar uno no oculta los demas.
- Las reacciones y su estado para la persona visitante se calculan por celebracion.
- La tarjeta sigue delante del feed de publicaciones y la lista usa una columna movil y dos en
  escritorio.
- El mensaje global superior sigue mostrando solo el ultimo logro no descartado. No es una bandeja
  personal y no se modifica en este feature.
- La paginacion, `Cargar mas` y la bandeja para personas seguidas quedan fuera del primer slice.

## Roadmap

### Slice 1 - Ocho celebraciones recientes en el inicio

**Alcance**

- Pluralizar el puerto y la consulta publica para devolver hasta ocho celebraciones.
- Resolver conteos y reaccion de la persona visitante para cada resultado sin consultas por tarjeta.
- Mantener una consulta singular reutilizable para el mensaje global, derivada del mismo contrato.
- Crear una lista semantica con titulo traducido y tarjetas multipilar en orden estable.
- Actualizar la prueba E2E existente para que afirme la celebracion de la cuenta de suite sin asumir
  que la comunidad global esta vacia.
- Cubrir cuatro pilares, limite, orden, retiro y reacciones independientes.

**Criterios de aceptacion**

- Compartir Sueño, Alimentacion, Movimiento y Mente/Espiritu produce cuatro tarjetas visibles.
- Cada tarjeta usa el texto, color y destino de su pilar.
- Las tarjetas aparecen de la mas reciente a la mas antigua.
- Con nueve hitos publicos solo aparecen los ocho mas recientes.
- Retirar un hito elimina solo su tarjeta.
- Celebrar un hito no cambia el contador ni el boton de los otros.
- Una persona sin sesion puede leer la lista y recibe el enlace de acceso en cada reaccion.
- El mensaje global conserva su comportamiento singular.

### Slice 2 - Compartir progreso heredado

**Alcance**

- Determinar si un hito se puede publicar desde las repeticiones persistidas del ritual, que son la
  fuente usada por calendario, puntos y nivel.
- Permitir el primer hito desde una repeticion y el hito final desde cinco, aunque los marcadores
  historicos `first_cycle_completed_at` o `final_completed_at` esten vacios.
- Mantener el consentimiento explicito: reparar elegibilidad no publica ningun logro automaticamente.
- Aplicar la misma regla a Sueño, Alimentacion, Movimiento y Mente/Espiritu.

**Criterios de aceptacion**

- Un progreso heredado de Alimentacion con una repeticion puede publicar su primer hito.
- Un progreso heredado con cinco repeticiones puede publicar el hito final.
- Cero repeticiones no permite publicar ningun hito.
- Una repeticion no permite publicar el hito final.
- Volver a compartir un hito retirado lo reactiva sin duplicarlo.

### Slice 3 - Historial paginado

@future

**Alcance**

- Incorporar cursor estable y `Cargar mas` cuando exista evidencia de que ocho hitos no bastan para
  el recorrido comunitario.

**Criterios de aceptacion**

- Cargar una pagina posterior no duplica ni salta celebraciones aunque se publique un hito nuevo.

## Validacion

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `git diff --check`
- El usuario ejecuta manualmente `pnpm run test:e2e:run`.
