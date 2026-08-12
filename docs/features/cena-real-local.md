# Cena real, local y al atardecer

Roadmap para que la práctica de Alimentación deje de ser «súmale una planta a lo que ya comes» y
pase a ser una cena completa: temprana, cocinada limpio, armada por proporciones y abastecida cerca.
La bitácora vive en `docs/features/cena-real-local-bitacora.md`.

## Alineación

- **Problem:** el ritual actual pide una planta más en cualquier comida del día. Es fácil de hacer y
  por eso funcionó como primer paso, pero deja fuera las cuatro decisiones que de verdad mueven la
  aguja: **cuándo** se cena (la sincronía circadiana, que es el puente con el Pilar 1), **con qué se
  cocina** (los aceites de semillas refinados), **cómo se arma el plato** (proporciones en vez de
  conteo) y **de dónde viene** (proximidad, temporada, granel). La página tampoco nombra el costo
  oculto de la cadena global: millas alimentarias, empaques de un solo uso y merma en tránsito.
- **Savings:** una sola cena resuelve las cuatro decisiones a la vez. El plato se arma mirándolo, sin
  contar calorías ni pesar nada; el abastecimiento semanal en mercado local reemplaza la compra
  reactiva envasada; y cenar temprano devuelve horas de sueño profundo sin pedir un hábito nuevo en
  otro pilar. Menos basura en casa y dinero que se queda con el productor de la zona.
- **Why:** Alimentación es el pilar que más se conecta con los otros tres y con el ecosistema de
  Hazlo Sano —productores locales, tianguis, comercio justo—. Que la práctica solo dijera «una planta
  más» dejaba ese puente sin construir justo en la pantalla donde se pide la acción.

## Modelo acordado

- **La clave del reto no cambia.** Sigue siendo `nutrition-one-plant-v1`. Los dos checkboxes del
  panel se validan pero **no se persisten** —`recordCycle` solo guarda la fecha del ciclo—, así que
  reescribir las anclas es catálogo puro: cero migración, cero progreso perdido, cero celebración
  huérfana. La clave es un identificador, no una promesa de redacción.
- **El nombre público sí cambia** a «Cena real, local y al atardecer». «Una planta más» sobrevive
  dentro del paso de la triada, como el mínimo vegetal del medio plato. Las celebraciones ya
  publicadas se re-renderizan con el nombre nuevo, porque la copia se resuelve por clave en tiempo
  de lectura.
- **El mínimo que cuenta son dos anclas, como en los cuatro pilares:** cenar al atardecer y servir la
  triada con una planta más. El abastecimiento local, la técnica de cocción y la presencia sin
  pantallas son ritual recomendado, no requisito —viven en la nota de preparación y en los pasos—.
  Nadie pierde su repetición por comprar en el súper.
- **El ancla temporal se enuncia con la caída del sol y su hora:** entre las 6:00 y las 7:30 PM, o al
  menos 2.5 a 3 horas antes de dormir. La regla relativa es la que sobrevive a un turno nocturno.
- **El ritual pasa de cinco pasos a seis.** Es el primer pilar con seis, así que
  `PillarPracticeSection` deja de asumir cinco: recibe la lista y pinta la que le den. Los otros tres
  pilares no se mueven.
- **No se nombran los marcos.** Se aplican los principios —hacerlo obvio, hacerlo fácil, diseño de
  entorno, empezar con el fin en mente, ganar/ganar— sin citar a sus autores ni sus títulos, en
  ningún texto visible. Hoy el catálogo no los menciona; que siga así.
- **La página crece con guía, no con más ritual.** La triada, la cocción limpia y el catálogo de
  ingredientes son secciones del artículo del pilar, debajo de la práctica. La práctica se queda
  corta y accionable.

## Roadmap

### Slice 1 — El ritual «Cena real, local y al atardecer»

**Alcance**

- Reescribir `atomicChallenges.nutritionExperience` en `es.json` y `en.json`: identidad, título del
  reto, anclas, checkboxes, nota de preparación (abastecimiento cercano), celebraciones, tarjetas
  públicas, avisos de comunidad y metadatos.
- Añadir `ritualStep6` y abrir el ritual a un número variable de pasos:
  `pillarPracticeCopy.ts` deja de leer cinco claves fijas y arma la lista por reto.
- Desacoplar el tipo del traductor compartido en `useHabitChallengeCopy.ts`: hoy se deriva del
  espacio de nombres de Alimentación, así que una clave que solo tenga Alimentación rompe a
  Movimiento y a Mente. Pasa a ser la unión explícita de las claves que el panel realmente usa.
- Actualizar las afirmaciones de Alimentación en la E2E existente y la fila desactualizada de
  `fusion-pilares-habitos.feature`.

**Criterios de aceptación**

- `/pilares/alimentacion` muestra el reto «Cena real, local y al atardecer», sus dos anclas nuevas y
  un ritual de **seis** pasos que abre en el abastecimiento y cierra en el triple impacto.
- Los otros tres pilares siguen con cinco pasos y su copia intacta.
- El progreso, los puntos, el jardín y las celebraciones siguen contra `nutrition-one-plant-v1`: una
  cuenta que ya tenía repeticiones las conserva.
- La identidad del hero es «Soy una persona que hace fácil elegir comida real, fresca y de origen
  local», en español y en inglés.
- `es.json` y `en.json` conservan su paridad estructural.

### Slice 2 — El costo oculto de la cadena global

**Alcance**

- Reelaborar el contexto histórico de `pillarPages.nutrition`: la Revolución Verde ya no termina en
  los ultraprocesados, sigue hasta la cadena globalizada.
- Añadir el bloque de los tres costos —transporte y combustible, empaques de un solo uso, merma y
  desperdicio en tránsito— y la solución de proximidad (Km 0) como contrapeso.
- Actualizar el título y el subtítulo del pilar para nombrar lo local, y alinear `pillars.nutrition`
  y las tres viñetas de «Incluye».

**Criterios de aceptación**

- La página nombra las millas alimentarias, los empaques y el desperdicio con su consecuencia, no
  como lista suelta.
- El contrapeso local aparece junto al costo, no en otra sección.
- Las tarjetas del índice de pilares y los metadatos heredan el texto nuevo sin tocarse a mano.

### Slice 3 — La triada del plato y la cocción limpia

**Alcance**

- Sección visual de la triada: 50 % vegetales locales, 25 % proteína regional, 25 % carbohidrato del
  territorio y una porción de grasa sana, con la proporción legible sin leer el texto.
- Sección de cocción limpia: por qué salen los aceites de semillas refinados, qué entra en su lugar
  con su punto de humo y su uso, y los métodos sin grasa añadida.
- Componentes propios bajo `src/app/[locale]/pilares/components/`, con su prueba de componente.

**Criterios de aceptación**

- Las proporciones se entienden de un vistazo y siguen siendo legibles en móvil.
- Cada aceite dice para qué sirve, no solo su nombre.
- Ningún texto visible queda escrito a mano en el TSX (`pnpm run check:i18n` en verde).

### Slice 4 — El catálogo de ingredientes

**Alcance**

- Las cuatro categorías —proteínas, carbohidratos complejos, grasas saludables, aceites y métodos—
  con sus ingredientes de proximidad, su impacto nutritivo y su impacto ecológico y local.
- Presentación que no obligue a hacer scroll horizontal en móvil.

**Criterios de aceptación**

- Cada categoría dice las tres cosas: qué comprar, qué le hace al cuerpo, qué le hace al entorno y a
  la economía de la zona.
- La página no desborda a lo ancho en móvil.

## Validación

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm run test:e2e:run`
