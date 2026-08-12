# Movimiento vivo, local y funcional

Roadmap para que la práctica de Movimiento deje de ser «empieza a moverte dos minutos» y pase a ser
un movimiento que además recupera el trayecto corto, el terreno natural, la fuerza útil y el deporte
del barrio. La bitácora vive en `docs/features/movimiento-vivo-local-bitacora.md`.

## Alineación

- **Problem:** la práctica pedía una señal de inicio y dos minutos de movimiento. Es el mejor primer
  paso posible y por eso se conserva, pero deja fuera lo que de verdad devuelve movimiento a un día:
  el **trayecto corto que hoy se hace en coche o moto** (el mercado, la tienda, la casa de alguien),
  el **terreno natural y la luz del sol** —que es el puente con el Pilar 1—, la **fuerza útil** de
  cargar y sostener, y el **deporte de barrio**, que es el puente con el Pilar 4. La página tampoco
  nombraba el costo de la movilidad motorizada hiperlocal: gasolina, ruido y emisiones en la propia
  calle, y menos pasos espontáneos.
- **Savings:** el mandado se convierte en el bloque de movimiento del día, así que no hay que
  encontrarle hueco a nada nuevo. Se ahorra gasolina y mantenimiento en trayectos que no los
  necesitaban, el barrio recupera calle y vecinos, y la luz de la mañana paga en descanso esa misma
  noche.
- **Why:** Movimiento es el pilar que más se apoya en el entorno: sin senderos, parques, canchas y
  calles caminables no hay práctica que sostener. Nombrarlos lo conecta con el territorio y con la
  gente que vive en él.

## Modelo acordado

- **La clave del reto no cambia.** Sigue siendo `movement-two-minutes-v1`. Como en Alimentación, las
  anclas se validan pero no se persisten, así que reescribirlas es catálogo puro: cero migración,
  cero progreso perdido.
- **El nombre público pasa a «Movimiento vivo, local y funcional».** «Dos minutos cuentan» sobrevive
  dentro de la segunda ancla, que es donde sigue significando algo exacto.
- **Las dos anclas son moverme sin motor y dos minutos que cuentan.** Son los dos actos más pequeños
  y los dos diarios, y el trayecto sin motor es el que carga el ahorro y la calle limpia. El sol y el
  terreno, la fuerza útil y el deporte de barrio son ritual recomendado: suman mucho, pero no son
  requisito para que el día cuente.
- **El gimnasio y los estudios de la zona son parte de la solución, no lo contrario.** Un gimnasio de
  barrio, una clase de baile o un entrenador de la colonia son negocios locales y merecen el mismo
  apoyo que el mercado en Alimentación. La página no opone «entorno» a «gimnasio»: ofrece las dos y
  cuenta las dos.
- **El mínimo es un piso, no un techo.** Moverse más tiempo es mejor y la copia lo dice. Lo que no
  cambia es que **los puntos cuentan días, no volumen**: es la regla que comparten los cuatro pilares
  para que nadie compita por intensidad ni distancia. Se separa explícitamente «te conviene hacer
  más» de «hacer más no te da más puntos».
- **La accesibilidad se enuncia en el ancla, no solo en la nota de seguridad.** «Sin motor» no puede
  leerse como un requisito de caminar: quien usa silla, muletas o no puede salir ese día tiene su
  versión y cuenta igual.
- **El ritual se queda en cinco pasos.** No hace falta abrir nada: `pillarPracticeCopy` ya resuelve
  el número por reto desde el ritual de seis de Alimentación.
- **No se nombran los marcos de hábitos.** Se aplican los principios sin citar autores ni títulos.

## Roadmap

### Slice 1 — El ritual «Movimiento vivo, local y funcional»

**Alcance**

- Reescribir `atomicChallenges.movementExperience` y `atomicChallenges.movement` en `es.json` y
  `en.json`: identidad, título, anclas, checkboxes, nota de preparación, ritual de cinco pasos,
  celebraciones, tarjetas públicas, avisos y metadatos.
- Separar en la copia «hacer más te conviene» de «hacer más no da más puntos».
- Actualizar las afirmaciones de Movimiento en la E2E y las filas de los `.feature` ya entregados.

**Criterios de aceptación**

- `/pilares/movimiento` muestra el reto nuevo, sus dos anclas y el ritual de cinco pasos que abre en
  el trayecto sin motor y cierra en el triple impacto.
- El ancla del trayecto ofrece explícitamente su versión para quien no puede caminar o pedalear.
- Ningún texto sugiere que hacer más sea desaconsejable, y ninguno promete puntos por volumen.
- Los otros tres pilares no se mueven.

### Slice 2 — El costo oculto de la movilidad motorizada hiperlocal

**Alcance**

- Añadir a `pillarPages.movement` el bloque de los tres costos —gasolina y mantenimiento,
  emisiones y ruido en la propia calle, atrofia y pérdida de gasto espontáneo— y su contrapeso: la
  movilidad activa y los espacios naturales y comunitarios de la zona.
- Actualizar el título, el subtítulo y `pillars.movement` para nombrar lo natural, lo local y lo
  comunitario.

**Criterios de aceptación**

- Los tres costos aparecen con su consecuencia, no como lista de sustantivos.
- El contrapeso vive en la misma sección que el costo.

### Slice 3 — La cadencia del día, el pie y el terreno

**Alcance**

- Sección de **cadencia**: qué toca cada 50 minutos, cada día y cada semana, con la frecuencia
  legible de un vistazo. Es el equivalente de la triada de Alimentación: responde «cuánto» sin
  prescribir volumen.
- Sección de **pie y terreno**: calzado de horma ancha, suela flexible y drop cero o bajo; descalzo
  en pasto o tierra; terreno irregular; y la luz solar directa como puente con el Pilar 1.
- Componentes propios bajo `src/app/[locale]/pilares/components/`, con su prueba.

**Criterios de aceptación**

- La cadencia se entiende sin leer el cuerpo del texto.
- El calzado dice qué buscar (horma, suela, drop), no solo «usa calzado cómodo».
- El gimnasio aparece como una opción válida y local dentro de la sesión semanal.

### Slice 4 — El catálogo de formas de movimiento

**Alcance**

- Las cuatro categorías —proximidad y pausas, biomecánica y terreno, fuerza funcional y trabajo de
  campo, resistencia y deporte de comunidad— con sus ejemplos locales, su beneficio fisiológico y
  postural, y su impacto comunitario y ecológico.
- **Extraer el catálogo de Alimentación a un componente compartido** en vez de copiarlo: las dos
  páginas piden la misma tarjeta (título, lista, dos impactos etiquetados). Una segunda copia sería
  un fallo de diseño, no un atajo.

**Criterios de aceptación**

- Cada categoría dice las tres cosas y ninguna tabla desborda a lo ancho en móvil.
- Alimentación y Movimiento comparten un solo componente de catálogo; no queda duplicado.

## Validación

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm run build`
- `pnpm run test:e2e:run` — **la corre el usuario al terminar los cuatro pilares**, no esta entrega.
