# Bitácora — Movimiento vivo, local y funcional

Append-only. El roadmap y la alineación viven en `docs/features/movimiento-vivo-local.md`.

## 2026-08-12 — Slices 1 a 4, en una sola corrida

**Objetivo.** Que la práctica de Movimiento deje de ser «empieza a moverte dos minutos» y recupere
además el trayecto corto motorizado, el terreno natural con luz, la fuerza útil y el deporte de
barrio. Segundo pilar de la serie, siguiendo el modelo que dejó Alimentación.

### Decisiones y por qué

**La clave del reto no se tocó**, igual que en Alimentación: sigue siendo `movement-two-minutes-v1`.
Las dos anclas se validan pero no se persisten, así que reescribirlas es catálogo puro. El nombre
público sí pasa a «Movimiento vivo, local y funcional», y «Dos minutos cuentan» sobrevive dentro de
la segunda ancla, que es donde sigue significando algo exacto.

**Las anclas son «moverme sin motor» y «dos minutos que cuentan».** Decisión del usuario entre tres
opciones. Son los dos actos más pequeños y los dos diarios, y el trayecto sin motor es el que carga
el ahorro y la calle limpia —el eje que la versión anterior nunca registraba—. El sol y el terreno,
la fuerza útil y el deporte quedan como ritual recomendado: suman mucho y no son requisito.

**El gimnasio entra como aliado, no como contraejemplo.** Corrección del usuario a mitad del slice, y
es la que más cambió el tono. El borrador de la propuesta contraponía «encerrarse en un gimnasio» al
entorno local; pero un gimnasio de barrio, un estudio de baile o un entrenador de la colonia son
negocios locales exactamente igual que el mercado en Alimentación, y el pilar los apoya. Aparecen en
el paso 4 del ritual, en el bloque semanal de la cadencia y en dos categorías del catálogo, y el
callout del pilar pasó de «no se limita al gimnasio» a «no se limita al gimnasio **ni lo excluye**».

**El mínimo es un piso, no un techo, y eso hubo que decirlo aparte.** «Los puntos no miden volumen»
es una regla de diseño que comparten los cuatro pilares —evita que nadie compita por intensidad—,
pero leída sola suena a «no te molestes en hacer más». Ahora las dos frases van juntas en la copia
(«moverte más tiempo le hace bien a tu cuerpo; los puntos cuentan días, no volumen») y hay una
prueba cuyo único trabajo es que sigan yendo juntas.

**«Sin motor» no puede leerse como un requisito de caminar.** La accesibilidad se enuncia dentro del
ancla, no solo en la nota de seguridad del final: quien usa silla, muletas o bastón, o quien hoy no
puede salir, tiene su versión y cuenta igual. Una regla de accesibilidad que vive solo en la letra
pequeña llega tarde a quien la necesita.

**La cadencia es a Movimiento lo que la triada es a Alimentación.** Responde «cuánto» sin prescribir
volumen: tres bloques por frecuencia —cada 50 minutos, cada día, cada semana— y ni una serie ni un
kilómetro. Lo que decide el resultado es cada cuánto vuelves.

**El catálogo se extrajo a un componente compartido.** Movimiento pedía exactamente la tarjeta que
Alimentación ya tenía (título, lista, dos impactos etiquetados). Copiarla habría sido el segundo
componente casi idéntico que `AGENTS.md` llama fallo de diseño, así que la forma vive ahora en
`PillarCatalog` y cada pilar aporta sus datos y sus etiquetas. Los dos ficheros por pilar quedan
como datos, no como interfaz.

**Los tres criterios del calzado van como lista, no dentro de un párrafo.** Horma ancha, suela
flexible y drop cero o bajo se verifican en la tienda; «usa calzado cómodo» no le sirve a nadie
frente al estante. Y la nota de transición no es un adorno legal: esta sección invita justo al
cambio que más lesiona cuando se hace de golpe.

### Archivos tocados

**Catálogo de idiomas**
- `src/i18n/messages/{es,en}.json`: reescritura de `atomicChallenges.movementExperience` y del
  resumen `atomicChallenges.movement`; `pillarPages.movement` pasa de 9 a 72 claves con el costo
  oculto, la cadencia, el pie y el terreno, y el catálogo; `pillars.movement` renombrado.

**Página del pilar**
- `MovimientoPage.tsx`: sección del costo oculto y montaje de las tres secciones nuevas.
- `MovementDailyCadence.tsx`, `MovementFootAndTerrain.tsx`, `MovementCatalog.tsx` (nuevos).
- `PillarCatalog.tsx` (nuevo, compartido) y `NutritionIngredientCatalog.tsx` reducido a sus datos.
- `references.ts`: cinco DOIs nuevos con su comentario.

**Especificaciones y pruebas**
- `src/e2e/pilares/movimientoVivoLocal.feature` (nuevo).
- `MovimientoPage.test.tsx` (nuevo), `PillarPages.test.tsx`, y las filas de Movimiento en
  `atomicSleepChallenge.{feature,spec.ts}`, `concurrentHabitRituals.feature`,
  `fusion-pilares-habitos.feature` y `cenaRealLocal.feature`.

### Referencias añadidas, verificadas contra Crossref

| Afirmación | DOI | Publicación |
| --- | --- | --- |
| Interrumpir la silla baja glucosa e insulina posprandiales | `10.2337/dc11-1931` | Diabetes Care, 2012 |
| Un par de minutos de sentadillas cada media hora basta | `10.1152/japplphysiol.00796.2020` | J Appl Physiol, 2021 |
| El gasto espontáneo de energía pesa más de lo que parece | `10.1053/beem.2002.0227` | Best Pract Res Clin Endocrinol Metab, 2002 |
| La luz exterior diaria adelanta el sueño y baja la somnolencia | `10.1073/pnas.2301608120` | PNAS, 2023 |
| Seis meses de calzado minimalista aumentan la fuerza del pie | `10.1038/s41598-021-98070-0` | Scientific Reports, 2021 |

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` | verde |
| `pnpm run typecheck:tests` | verde |
| `pnpm run lint` | verde, 764 archivos |
| `pnpm run check:i18n` | verde |
| `pnpm run test:run` | ver el cierre de esta entrada |
| Paridad de catálogos | `es.json` y `en.json` con las mismas 1068 claves |
| `pnpm run test:e2e:run` | **no ejecutada**: el usuario la corre al terminar los cuatro pilares |

### Recap

Movimiento es ahora una práctica de día entero con dos anclas pequeñas: un trayecto sin motor y dos
minutos de pie por cada 50 de silla, sobre la misma clave `movement-two-minutes-v1`. La página la
rodea con el costo de motorizar dos cuadras y su contrapeso, una cadencia de tres frecuencias que
dice cada cuánto en vez de cuánto, el pie y el terreno con tres criterios verificables de calzado, y
un catálogo de cuatro formas que dice qué le hace cada una al cuerpo y al barrio. El gimnasio y los
estudios de la zona cuentan como movimiento local. Sueño y Mente/Espíritu siguen intactos.

### Próximos pasos (opciones)

1. **El pilar 4, Mente y Espíritu**, con el mismo modelo. Es el único que queda para cerrar la serie.
2. **Revisar Sueño** a la luz de los dos pilares nuevos: la crononutrición y la luz exterior ya
   apuntan a él desde Alimentación y Movimiento, y su página todavía no las devuelve.
3. **Enlazar el catálogo con el directorio local.** Movimiento nombra gimnasios y estudios de la
   zona, y Alimentación nombra el mercado; el sitio ya tiene directorio de productores y no se toca
   desde ninguno de los dos.
4. **Pendiente del usuario:** correr `pnpm run test:e2e:run` al cerrar los cuatro pilares. Si el
   puerto 3000 está ocupado, `E2E_PORT=3100 pnpm run test:e2e:run`.

## 2026-08-12 — Adenda: los puentes con los otros tres pilares

Sueño estrenó la sección de puentes y las otras tres páginas la pedían igual, así que la forma se
extrajo a `PillarBridges` —el mismo reparto que `PillarCatalog`— y cada pilar aporta solo sus datos.
`SleepPillarBridges` pasó de pintar la tarjeta a solo describirla.

**El encuadre cambió al escribir las nueve conexiones que faltaban.** En Sueño los tres puentes
apuntan hacia dentro: es el pilar que recibe. Al escribir los de los otros tres apareció algo que no
estaba en el material y que es lo más útil que se les puede decir a quien los lee: **varios puentes
son el mismo acto contado dos veces.**

- El trayecto a pie al mercado es el ancla «moverme sin motor» de Movimiento **y** el
  «abastecerte cerca» de Alimentación. Un solo viaje, dos pilares.
- La cena sin dispositivos es la cena de Alimentación **y** la ventana de silencio «en la mesa» de
  Mente.
- El rato al aire libre es el de Movimiento **y** el arraigo de Mente —esto ya estaba dicho en
  Mente; ahora se dice desde los dos lados.

Por eso el intro de los tres pilares nuevos abre con «no son tres tareas más», y el de Sueño se
reencuadró igual. Los cuatro pilares piden alrededor de cinco actos, no ocho; que la página lo diga
es la diferencia entre un sistema y una lista de deberes.

**Cada tarjeta se pinta con el color de su destino**, no con el del pilar que se lee: es lo que la
hace verse como un puente. `PillarBridges.test.tsx` recorre las cuatro páginas y comprueba destino,
color e idioma; lo que puede romperse no es la tarjeta sino que un pilar enlace mal por copiar el
bloque de otro, o que se quede sin sección.

**Validación:** `typecheck`, `typecheck:tests`, `lint` (778 archivos) y `check:i18n` en verde;
paridad de catálogos en 1216 claves. La E2E sigue pendiente del usuario.
