# El descanso circadiano

Roadmap del pilar que cierra el círculo. Sueño ya tenía las dos anclas correctas —cerrar la noche y
abrir la mañana—, así que aquí no se reescribe el mínimo: se reescribe todo lo que lo rodea, y se
recogen los tres puentes que los otros tres pilares llevaban meses tendiendo hacia acá. La bitácora
vive en `docs/features/descanso-circadiano-bitacora.md`.

## Alineación

- **Problem:** la práctica de Sueño es la más antigua del sitio y su copia se quedó en el piloto. Las
  dos anclas siguen siendo las correctas, pero el ritual que las acompañaba —cena, ropa, cuarto,
  movimiento— era una lista de recomendaciones sueltas, sin el mecanismo que las explica. La página
  tampoco nombraba el costo de la luz artificial y la cultura 24/7, ni el santuario del cuarto, ni
  la descarga mental, ni lo que los otros tres pilares aportan al descanso.
- **Savings:** casi todo este pilar consiste en **apagar** cosas: no pide comprar nada ni encontrar
  un hueco nuevo. Bien hecho, devuelve las horas de sueño profundo que ya se estaban pagando en
  cafeína, y baja el recibo de luz.
- **Why:** el descanso es donde se cobra todo lo demás. Es el pilar que recibe de los otros tres, y
  el único desde el que se puede mostrar el sistema completo funcionando.

## Modelo acordado

- **El nombre no cambia.** «Del atardecer al amanecer» es el único de los cuatro cuyo nombre ya
  decía lo que la revisión quiere: literalmente el arco circadiano. Además es el reto piloto, el que
  más celebraciones publicadas acumula. Cambian identidad, ritual y guía; el nombre se queda.
- **Las dos anclas tampoco cambian de fondo,** porque ya eran las correctas: cerrar la noche
  (pantallas fuera y luces bajas) y abrir la mañana (luz natural). Solo se les añade el mecanismo y
  la dosis: una hora antes de dormir, y de 10 a 15 minutos de luz en la primera hora tras despertar.
- **Los cinco pasos del ritual sí se reescriben** siguiendo el arco: anclar con sol, cerrar lo
  digital y atenuar, descargar la mente, entrar al santuario y notar la claridad.
- **Las claves heredadas del piloto se renombran.** Los pasos vivían bajo nombres de contenido
  —`eveningLight`, `dinner`, `clothes`, `room`, `movement`— y el ritual nuevo los habría dejado
  describiendo pasos que ya no existen. Pasan a `ritualStep1..5`, como en los otros tres pilares.
- **Los tres puentes viven en Sueño y enlazan de verdad.** Van en la misma dirección —la cena
  temprana, el movimiento diurno y el cierre digital se cobran en el descanso—, así que Sueño es
  donde tiene sentido leerlos juntos. Cada tarjeta se pinta con el color de **su** pilar y enlaza
  con `pillarHref`, que conserva el idioma.
- **La nota de seguridad nombra los trastornos del sueño.** Igual que Mente nombra el apoyo
  profesional: si alguien ronca, deja de respirar o lleva meses sin dormir, ningún ritual lo
  arregla, y la página tiene que decirlo.
- **El catálogo tiene tres categorías, no cuatro.** La fuente tiene tres. Inventar una cuarta para
  que las cuatro páginas se vean simétricas habría sido rellenar.

## Roadmap

### Slice 1 — El ritual del descanso circadiano
Identidad nueva, anclas con su mecanismo y dosis, cinco pasos nuevos, claves renombradas, nota de
seguridad ampliada.

### Slice 2 — El costo oculto de la luz artificial y la cultura 24/7
Sueño roto, deuda con estimulantes y luz derramada, con su contrapeso de resincronización.

### Slice 3 — El santuario y la descarga mental
Las tres condiciones del cuarto (oscuro, fresco, sin teléfono) y los cinco minutos de libreta.

### Slice 4 — El catálogo y los puentes
Tres categorías de prácticas sobre `PillarCatalog`, y la sección de puentes con los otros tres
pilares.

## Validación

- `pnpm run test:run`, `typecheck`, `typecheck:tests`, `lint`, `check:i18n`
- `pnpm run test:e2e:run` — **la corre el usuario**, no esta entrega.
