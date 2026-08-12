# Bitácora — Cena real, local y al atardecer

Append-only. El roadmap y la alineación viven en `docs/features/cena-real-local.md`.

## 2026-08-12 — Slices 1 a 4, en una sola corrida

**Objetivo.** Que la práctica de Alimentación deje de ser «súmale una planta a lo que ya comes» y
pase a ser una cena completa: temprana, cocinada limpio, armada por proporciones y abastecida cerca.
Los cuatro slices se entregaron seguidos porque así se acordó en el gate de alineación.

### Decisiones y por qué

**La clave del reto no se tocó.** Es la decisión que abarató todo lo demás. Los dos checkboxes del
panel se validan pero **no se persisten**: `recordCycle` guarda `(userId, challengeKey, cycleDate)` y
nada más (`src/infra/dataAccess/habits/PostgresHabitChallengeRepository.ts`). Reescribir las anclas y
la identidad es, por tanto, catálogo puro. Estrenar `nutrition-real-dinner-v1` habría reiniciado la
semana en curso de quien ya practicaba y habría dejado las celebraciones publicadas colgando de una
clave que la lista pública ya no consulta, obligando a mantener dos claves vivas para siempre. La
clave es un identificador, no una promesa de redacción.

**El nombre público sí cambió.** «Una planta más» → «Cena real, local y al atardecer». La copia se
resuelve por clave en tiempo de lectura, así que las celebraciones ya publicadas se re-renderizan con
el nombre nuevo sin migrar una fila. «Una planta más» sobrevive dentro del paso de la triada y en el
bloque de vegetales, que es donde sigue significando algo concreto.

**El mínimo siguen siendo dos anclas, no seis pasos.** Cenar al atardecer y servir la triada. El
abastecimiento en el mercado, la técnica de cocción y la cena sin pantallas son ritual recomendado y
viven en la nota de preparación y en los pasos. Cobrarlos como requisito habría dejado fuera a quien
esa semana solo pudo ir al súper, que es exactamente a quien la práctica quiere alcanzar.

**El ancla temporal se enuncia dos veces: con hora y con regla relativa.** «Entre las 6:00 y las 7:30
PM» dice cuándo empezar hoy; «o al menos 2.5 a 3 horas antes de dormir» es lo que sobrevive a un
turno nocturno o a otra latitud. Una sola de las dos deja fuera a alguien.

**El ritual pasó de cinco pasos a seis, y eso obligó a abrir dos costuras.**

1. `pillarPracticeCopy.ts` leía `ritualStep1..5` a través de un traductor compartido por los tres
   pilares no-Sueño. Los pasos salieron de esa unión de claves a una función propia
   (`experienceRitualSteps`) que los escribe uno por uno y por reto. Sigue sin componer claves en
   tiempo de ejecución —`AGENTS.md` lo prohíbe—, y ahora el catálogo puede decidir cuántos pasos
   tiene cada pilar.
2. `useHabitChallengeCopy.ts` derivaba el tipo del traductor del espacio de nombres de
   **Alimentación**. Funcionaba solo mientras los tres retos fueran idénticos: en cuanto Alimentación
   estrenó `ritualStep6`, Movimiento y Mente dejaron de ser asignables y el error salía ahí, lejos de
   la línea que lo causaba. Ahora es la unión explícita de las claves que el panel realmente lee.

**El costo del viaje va junto a su contrapeso, en la misma sección.** Separar «millas alimentarias,
empaques, desperdicio» de «proximidad y temporada» convertía lo local en una preferencia estética en
vez de en la respuesta a algo que se paga. Hay una prueba que lo fija.

**La triada dibuja la proporción, no solo la escribe.** El ancho de cada bloque *es* su porcentaje.
En móvil los vegetales toman la fila entera y los dos cuartos la comparten, así que la mitad y los
cuartos siguen viéndose sin scroll horizontal. La grasa queda fuera de la barra: es una porción que
se suma, no una fracción que divide, y meterla dentro habría dibujado una regla falsa.

**El catálogo son tarjetas y no una tabla.** La fuente es una tabla de cuatro columnas; trasladarla
tal cual habría desbordado la página a lo ancho justo en el teléfono, que es donde se consulta al
comprar. Cada categoría lleva sus ingredientes, su impacto en el cuerpo y su impacto en el entorno en
la misma tarjeta: es una sola decisión de compra, y separar lo ecológico lo volvía opcional.

**No se nombran los marcos de hábitos.** Se aplicaron los principios —hacerlo obvio, hacerlo fácil,
diseño de entorno, empezar con el fin en mente, ganar/ganar— sin citar autores ni títulos. Se
verificó que el catálogo no los mencionaba antes (0 coincidencias en `es.json` y `en.json`) y no se
introdujo ninguna.

**Desviación respecto de la propuesta V1:** el aceite de coco salió. La V1 lo listaba con su
justificación (triglicéridos de cadena media); la V2 lo omite y deja aguacate, oliva extra virgen y
los métodos sin grasa añadida. Se siguió la V2, que es la especificación vigente.

### Archivos tocados

**Catálogo de idiomas**
- `src/i18n/messages/es.json`, `src/i18n/messages/en.json`: reescritura completa de
  `atomicChallenges.nutritionExperience` (+ `ritualStep6`), de `atomicChallenges.nutrition`, y de
  `pillarPages.nutrition` y `pillars.nutrition`, con 47 claves nuevas para el costo oculto, la
  triada, la cocción limpia y el catálogo de ingredientes.

**Copia de la práctica y panel**
- `src/presentation/habits/pillarPracticeCopy.ts`: pasos del ritual por reto.
- `src/presentation/habits/useHabitChallengeCopy.ts`: unión explícita de claves del panel.
- `src/domain/habits/habitChallenge.ts`: el comentario de las dos anclas nombraba la práctica vieja.

**Página del pilar**
- `src/app/[locale]/pilares/components/AlimentacionPage.tsx`: sección del costo oculto y montaje de
  las tres secciones nuevas, después de la práctica.
- `NutritionPlateTriad.tsx`, `NutritionCleanCooking.tsx`, `NutritionIngredientCatalog.tsx` (nuevos).

**Especificaciones**
- `src/e2e/pilares/cenaRealLocal.feature` (nuevo): los cuatro slices.
- `src/e2e/habits/atomicSleepChallenge.feature`, `src/e2e/pilares/fusion-pilares-habitos.feature`:
  las filas de Alimentación describían una copia que ya no existe; se actualizaron en vez de
  dejarlas mintiendo. La columna `pasos` entró en la tabla de la fusión porque «cinco pasos» dejó de
  valer para los cuatro.

**Pruebas**
- `src/presentation/habits/pillarPracticeCopy.test.ts` (nuevo): cuenta de pasos por pilar en los dos
  idiomas y anclas de Alimentación, contra el catálogo real.
- `src/app/[locale]/pilares/components/AlimentacionPage.test.tsx` (nuevo): costo oculto, triada,
  cocción y catálogo.
- `PillarPracticeSection.test.tsx`: la sección pinta los pasos que le den, no cinco.
- `HabitChallengePanel.test.tsx`, `PillarPages.test.tsx`, `atomicSleepChallenge.spec.ts`: copia nueva
  y cuenta de pasos por pilar.

### Comandos

```
pnpm run typecheck
pnpm run typecheck:tests
pnpm run lint
pnpm run check:i18n
pnpm run test:run
pnpm run build
pnpm run test:e2e:run
```

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run typecheck` | verde |
| `pnpm run typecheck:tests` | verde |
| `pnpm run lint` | verde, 759 archivos |
| `pnpm run check:i18n` | verde, sin literales en español en componentes |
| `pnpm run test:run` | **141 archivos / 1365 pruebas**, todas en verde (base antes del cambio: 139 / 1335) |
| `pnpm run build` | verde |
| Paridad de catálogos | 1005 claves en `es.json` y 1005 en `en.json`, cero diferencias |
| `pnpm run test:e2e:run` | **no ejecutada** |

**La E2E queda pendiente del usuario, por decisión suya.** Se lanzó `--shard=1/2` y se detuvo antes de
producir resultado; no se afirma nada sobre ella. Al detenerla se vio que el puerto 3000 ya estaba
ocupado por un servidor previo ajeno a la suite, y `playwright.config.ts` tiene
`reuseExistingServer: false` a propósito: con 3000 tomado la corrida no arranca. La salida es
`E2E_PORT=3100 pnpm run test:e2e:run`, o liberar el puerto antes.

Como la corrida se interrumpió a media ejecución contra la base compartida, puede haber quedado
datos de la suite sin barrer. `globalSetup` los limpia al inicio de la siguiente corrida —está para
exactamente eso—, así que no hace falta ninguna acción manual.

Las afirmaciones de Alimentación en `atomicSleepChallenge.spec.ts` se actualizaron a la copia nueva
y se les puso `.first()` donde el texto aparece dos veces a propósito (la hora de la cena vive en el
ancla y en el segundo paso; el abastecimiento, en la nota y en el primer paso). Sin eso el modo
estricto de Playwright habría fallado por ambigüedad en vez de por la ausencia que la prueba vigila.

### Recap

La práctica de Alimentación es ahora una cena completa: dos anclas —cenar al atardecer y servir la
triada local— y un ritual de seis pasos que abre en el mercado y cierra en el triple impacto, todo
sobre la misma clave `nutrition-one-plant-v1`, sin migración y sin progreso perdido. La página la
rodea con el costo oculto de la cadena global y su contrapeso de proximidad, la triada dibujada por
proporciones, la cocción limpia con el uso y el punto de humo de cada aceite, y un catálogo de cuatro
categorías que dice qué comprar, qué le hace al cuerpo y qué le hace al entorno. Los otros tres
pilares no se movieron: siguen con sus cinco pasos y su copia intacta.

### Adenda — las referencias, y un número que estaba mal

Se buscaron y se verificaron contra Crossref las fuentes de las tres afirmaciones nuevas. Las cinco
entran en `NUTRITION_REFERENCES` con un comentario que dice cuál sostiene qué:

| Afirmación | DOI | Publicación |
| --- | --- | --- |
| La tolerancia a la glucosa cae por la tarde-noche por el sistema circadiano endógeno | `10.1073/pnas.1418955112` | PNAS, 2015 |
| El efecto se explica sobre todo por la respuesta de la célula beta | `10.1111/dom.13391` | Diabetes Obes Metab, 2018 |
| Los aceites ricos en poliinsaturados generan aldehídos al calentarse, y pasan al alimento | `10.1038/s41598-019-39767-1` | Scientific Reports, 2019 |
| PUFA ≫ MUFA ≫ saturados en producción de aldehídos al freír | `10.3389/fnut.2021.711640` | Frontiers in Nutrition, 2022 |
| Punto de humo del aceite de aguacate | `10.1016/b978-1-893997-97-4.50008-5` | Woolf et al., *Gourmet and Health-Promoting Specialty Oils*, 2009 |

**Buscar la fuente corrigió el dato.** La copia decía «aceite de aguacate prensado en frío — punto
de humo cercano a los 270 °C», y esas dos mitades no van juntas: los 271 °C son del **refinado**; el
**sin refinar** humea a 250 °C. Es la confusión que repite media internet, y en una página que
recomienda justo el prensado en frío mandaba a alguien a calentar veinte grados por encima de donde
su aceite empieza a degradarse. Ahora la copia da las dos cifras y dice cuál es cuál, y la prueba de
componente fija las dos para que no vuelvan a mezclarse.

No se encontró medición revisada por pares del punto de humo fuera de esa fuente: las cifras que
circulan en blogs y fichas comerciales salen todas de ahí. Se cita el original.

### Próximos pasos (opciones)

1. **Llevar la crononutrición al pilar de Sueño.** La cena temprana es hoy el puente más explícito
   entre los pilares 1 y 2, y el ritual de Sueño todavía no lo menciona.
3. **Un enlace del catálogo al directorio de productores locales.** El pilar dice «mercado o pequeño
   productor» y el sitio ya tiene ese directorio; hoy no se tocan.
4. **Commits.** El árbol lleva también el refactor de nombres sin confirmar de
   `refactor/nombres-del-reto`, entrelazado con estos slices en varios archivos. **Pendiente del
   usuario:** decidir si se separan en dos commits o va todo junto.

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
