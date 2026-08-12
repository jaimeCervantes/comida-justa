# El ritual de los cuatro pilares

Roadmap para que Alimentacion, Movimiento y Mente/Espiritu practiquen con la misma calidad que Sueño,
y para que esa calidad viva en un solo componente en vez de en dos copias que se separan solas. La
bitacora del slice vive en `docs/features/ritual-de-los-cuatro-pilares-bitacora.md`.

## Alineacion

- **Problem:** la practica de Sueño y la de los otros tres pilares eran dos componentes distintos que
  hacian lo mismo. Cada mejora se quedaba en uno: Sueño tenia anclas con simbolo, una version minima
  enunciada y un ritual de dos columnas legible; los otros tres mostraban `01` y `+1`, apretaban los
  cinco pasos en cinco columnas y cerraban con un boton de recordatorios permanentemente
  deshabilitado. La misma division se repetia debajo: dos Server Actions casi identicas, dos tablas
  de tema con la misma clave y cuatro bloques de traduccion copiados.
- **Savings:** una mejora del ritual llega a los cuatro pilares a la vez; un pilar nuevo se agrega
  con una fila de tema y una de catalogo, no con un componente propio. Se retira el unico control
  muerto de la practica, que prometia recordatorios que la pagina no puede enviar.
- **Why:** los cuatro pilares son el modelo de salud de Hazlo Sano. Que tres se vean como el borrador
  del cuarto contradice ese mensaje justo en la pantalla donde se pide la accion.

## Modelo acordado

- Una sola practica para los cuatro pilares. Las diferencias reales de contenido entran como piezas
  opcionales, no como componentes distintos: Sueño abre enunciando su version minima; los otros tres
  cierran sus anclas con una nota de preparacion.
- El ritual de Sueño es la referencia: dos columnas, el numero al lado del paso y su nota de
  seguridad al final. Los otros tres adoptan esa forma.
- Cada ancla lleva el simbolo de su pilar, no un ordinal. El simbolo es decoracion (`aria-hidden`) y
  vive en el tema, no en el catalogo: no es idioma.
- El aviso de recordatorios de Telegram desaparece de la practica. Sigue en el indice de `/habitos`,
  que es donde se anuncia lo que aun no existe.
- Las reglas, los datos guardados, los puntos, las celebraciones y la privacidad no cambian. Es una
  fusion de presentacion y de codigo, no de comportamiento.
- La copia visible no se reescribe: se reordena. La unica clave nueva es un antetitulo compartido
  para el bloque de ritual, que hoy repite palabra por palabra el titulo que lleva debajo.

## Roadmap

### Slice unico - Una practica, cuatro pilares

**Alcance**

- Reunir `SleepPracticeContent` y `DeepHabitPracticeContent` en un solo `PillarPracticeSection` que
  recibe su copia ya resuelta y no lee el catalogo.
- Reunir `SleepPracticeSection` y `CuratedPracticeSection` en un solo `PillarPractice` que resuelve
  sesion, progreso y retorno de autenticacion para el reto que le pasen.
- Reunir `manageAtomicSleepChallenge` y `manageCuratedHabitChallenge` en `manageHabitChallenge`.
- Reunir `deepHabitChallengeThemes`, `habitChallengeThemes` y la constante suelta de Sueño en una
  tabla `pillarThemes` con los cuatro pilares.
- Colapsar los cuatro bloques repetidos de `useHabitChallengeCopy` y los tres de la copia de la
  practica.
- Mover al dominio la regla de las dos anclas, que estaba en el dominio para Sueño y repetida a mano
  en la accion de los otros tres.
- Que `PillarArticle` arme el hero del pilar, que las cuatro paginas montaban identico.
- Retirar el bloque de recordatorios de la practica y su afirmacion en la E2E.

**Criterios de aceptacion**

- Los cuatro pilares muestran anclas con simbolo, un ritual de cinco pasos en dos columnas y su nota
  de seguridad.
- Ningun pilar ofrece un control que no se pueda usar.
- El progreso, los puntos, las celebraciones, el jardin y la privacidad siguen funcionando igual en
  los cuatro.
- Volver a un pilar muestra el progreso guardado sin pulsar nada, tambien en los tres que antes no
  remontaban su panel.
- Una persona sin sesion vuelve a su pilar despues de autenticarse, en español y en ingles.
- `es.json` y `en.json` conservan su paridad estructural.

## Validacion

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm run build`
- `pnpm run test:e2e:run`
