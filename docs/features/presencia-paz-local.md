# Presencia, paz y conexión local

Roadmap del cuarto y último pilar. Que la práctica de Mente y Espíritu deje de ser «manda un mensaje
de presencia» y pase a ser un día con dos ventanas de silencio, un rato de arraigo al aire libre, una
conversación de verdad y un gesto hacia la gente de al lado. La bitácora vive en
`docs/features/presencia-paz-local-bitacora.md`.

## Alineación

- **Problem:** la práctica pedía una pausa lejos del ruido digital y un mensaje genuino. El mensaje
  era el mínimo correcto para empezar, pero deja fuera lo que de verdad sostiene la salud mental: el
  **silencio de la primera y la última hora**, el **arraigo al aire libre**, la **conversación cara a
  cara sin dispositivos** y el **servicio a la gente de al lado**. La página tampoco nombraba el
  costo de la hiperconectividad: saturación, desarraigo del territorio y soledad acompañada.
- **Savings:** las ventanas de silencio no piden tiempo extra, piden que el teléfono no esté; el rato
  al aire libre es el mismo que ya pide Movimiento; y la conversación cae en una comida que ya
  existe. Se recupera sueño profundo, atención y una red de vecinos que sirve cuando algo va mal.
- **Why:** es el pilar que sostiene a los otros tres —sin calma y sin gente cerca, ninguna práctica
  aguanta— y el que más directamente ataca la soledad, que es la enfermedad silenciosa del modelo.

## Modelo acordado

- **La clave del reto no cambia.** Sigue siendo `mind-one-connection-v1`: catálogo puro, cero
  migración, cero progreso perdido. El nombre público pasa a «Presencia, paz y conexión local».
- **Las dos anclas son abrir el día sin pantalla y dar presencia a alguien.** Decisión del usuario.
  La segunda **empuja a lo presencial sin excluir a nadie**: cara a cara de preferencia, y una
  llamada o un mensaje sincero cuentan igual cuando hoy no hay nadie cerca. Exigir presencialidad
  habría dejado sin poder registrar su día justo a quien vive solo — la soledad crónica que este
  pilar existe para atacar. Lo que cuenta es escuchar de verdad, no el canal.
- **El arraigo al aire libre es el mismo rato que pide Movimiento, no una salida más.** Se dice
  explícitamente para que los dos pilares no compitan por la agenda de nadie.
- **Las ventanas de silencio son terreno, no regla.** Primera hora, la mesa y última hora: hacen la
  práctica fácil. Un día que no se puede, no se puede.
- **La nota de seguridad crece.** Este es el pilar donde alguien puede estar pasándola mal de verdad,
  así que la nota dice explícitamente que pedir ayuda profesional también es cuidar la mente.
- **El ritual se queda en cinco pasos** y no se nombran los marcos de hábitos.

## Roadmap

### Slice 1 — El ritual «Presencia, paz y conexión local»

**Alcance**: reescribir `atomicChallenges.mindExperience` y `atomicChallenges.mind` en los dos
idiomas; actualizar la E2E y las filas de Mente en los `.feature` ya entregados.

**Criterios de aceptación**
- El reto, la identidad, las dos anclas y los cinco pasos nuevos aparecen en los dos idiomas.
- El mínimo dice, dentro del ancla, que una llamada o un mensaje cuentan igual cuando no hay nadie
  cerca. Nadie queda sin poder registrar su día.
- La nota de seguridad nombra el apoyo profesional.
- Los otros tres pilares no se mueven.

### Slice 2 — El costo oculto de la hiperconectividad

**Alcance**: saturación mental, desconexión del territorio y soledad acompañada, con su contrapeso
de silencio, presencia y gente cercana; título y `pillars.mindSpirit` al día.

### Slice 3 — Las ventanas de silencio, el arraigo y la respiración

**Alcance**: sección de las tres ventanas (primera hora, la mesa, última hora) —el equivalente de la
cadencia de Movimiento— y sección de arraigo con la respiración 4-7-8 paso a paso y el enlace
explícito al rato al aire libre de Movimiento.

### Slice 4 — El catálogo de prácticas

**Alcance**: higiene digital, arraigo y contemplación, diálogo y gratitud, y servicio comunitario,
sobre el `PillarCatalog` compartido que ya usan Alimentación y Movimiento.

## Validación

- `pnpm run test:run`, `typecheck`, `typecheck:tests`, `lint`, `check:i18n`, `build`
- `pnpm run test:e2e:run` — **la corre el usuario al terminar los cuatro pilares**.
