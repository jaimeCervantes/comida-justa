# Bitácora — El descanso circadiano

Append-only. El roadmap y la alineación viven en `docs/features/descanso-circadiano.md`.

## 2026-08-12 — Slices 1 a 4, en una sola corrida

**Objetivo.** Revisar el cuarto pilar —el primero cronológicamente, el último de esta serie— con el
mismo modelo que Alimentación, Movimiento y Mente, y cerrar el círculo recogiendo en Sueño los tres
puentes que los otros pilares llevaban tendiendo hacia acá.

### Decisiones y por qué

**El nombre no cambió, y es el único de los cuatro.** «Del atardecer al amanecer» ya decía lo que la
revisión quería: literalmente el arco circadiano. Cambiarlo por «Ritual del descanso circadiano»
—el nombre del documento fuente— habría sido más técnico y menos memorable, y además es el reto
piloto, el que más celebraciones publicadas acumula. Decisión del usuario.

**Las dos anclas tampoco cambiaron de fondo, porque ya eran las correctas.** «Cerrar la noche» y
«abrir la mañana» son exactamente los ejes 1 y 2 del material nuevo. Lo que les faltaba era el
mecanismo y la dosis: ahora dicen *una hora antes de dormir* y *de 10 a 15 minutos en la primera
hora*, y explican por qué —la luz brillante frena la melatonina; la luz de la mañana programa la de
esta noche—. Es la diferencia entre una instrucción y una instrucción que se entiende.

**Las claves heredadas del piloto se renombraron.** Los cinco pasos vivían como `eveningLight`,
`dinner`, `clothes`, `room` y `movement`: nombres de contenido, no de posición. Con el ritual nuevo
habrían quedado describiendo pasos que ya no existen —`dinner` apuntando a la descarga mental—, así
que pasan a `ritualStep1..5` como en los otros tres pilares. Es la misma limpieza que el usuario
había empezado en `refactor/nombres-del-reto`.

**Los tres puentes viven en Sueño y enlazan de verdad.** Los tres van en la misma dirección: la cena
temprana, el movimiento diurno y el cierre digital **se cobran** en el descanso. Sueño es el que
recibe, así que es donde tiene sentido leerlos juntos. Cada tarjeta se pinta con el color de **su**
pilar —eso es lo que la hace leerse como un puente y no como tres párrafos más— y enlaza con
`pillarHref` y el `Link` de `~/i18n/navigation`, que conservan el idioma; hay una prueba que verifica
los tres `href` en inglés, porque una cadena escrita a mano habría mandado a un lector en inglés a
la versión en español.

**La nota de seguridad nombra los trastornos del sueño.** Igual que Mente nombra el apoyo
profesional: si alguien ronca, deja de respirar mientras duerme o lleva meses sin dormir, ningún
ritual lo arregla. Una página que promete descanso y no dice eso se interpone en el camino al
diagnóstico.

**El catálogo tiene tres categorías, no cuatro.** La fuente tiene tres. Rellenar una cuarta para que
las cuatro páginas se vean simétricas habría sido inventar contenido, y `PillarCatalog` reparte por
número de categorías sin que haya que tocarlo.

**Un detalle que la evidencia añadió.** El ensayo de la descarga mental (polisomnografía, 2018) no
solo midió que escribir antes de dormir ayuda: comparó **lista de pendientes contra lista de
logros**, y la de pendientes adelantó el sueño mientras la de logros lo retrasó. Es una distinción
útil —«escribe algo antes de dormir» manda a media gente a la versión que empeora las cosas—, así
que entró en la copia con su prueba.

### Archivos tocados

- `src/i18n/messages/{es,en}.json`: `atomicSleepChallenge` con identidad, anclas, ritual y seguridad
  nuevos y cinco claves renombradas; `pillarPages.sleep` de 24 a 82 claves.
- `pillarPracticeCopy.ts`: lee `ritualStep1..5` también para Sueño.
- `SuenoPage.tsx` + `SleepSanctuary.tsx`, `SleepMentalUnload.tsx`, `SleepPracticeCatalog.tsx`,
  `SleepPillarBridges.tsx` (nuevos).
- `references.ts`: tres DOIs nuevos con su comentario.
- `SuenoPage.test.tsx` (nuevo), `PillarPages.test.tsx`, y las filas de Sueño en
  `atomicSleepChallenge.{feature,spec.ts}` y `fusion-pilares-habitos.feature`.

### Referencias añadidas, verificadas contra Crossref

| Afirmación | DOI | Publicación |
| --- | --- | --- |
| La luz de una habitación normal antes de dormir retrasa la melatonina en el 99 % de las personas | `10.1210/jc.2010-2098` | J Clin Endocrinol Metab, 2011 |
| El calor del ambiente recorta sueño profundo y REM | `10.1186/1880-6805-31-14` | J Physiol Anthropol, 2012 |
| La lista de pendientes adelanta el sueño; la de logros lo retrasa | `10.1037/xge0000374` | J Exp Psychol Gen, 2018 |

### Validación

`typecheck`, `typecheck:tests`, `lint` (773 archivos) y `check:i18n` en verde. Paridad de catálogos:
1189 claves en cada idioma. `test:run` se cierra al final de esta corrida. La E2E la corre el
usuario.

### Recap

Los cuatro pilares están revisados y el círculo queda cerrado. Sueño conserva su nombre y sus dos
anclas —eran las correctas desde el piloto— y gana el mecanismo detrás de ellas, el costo de la luz
artificial con su contrapeso, el santuario de tres condiciones, la descarga mental de cinco minutos,
un catálogo de tres categorías sobre el componente compartido, y la sección que recoge lo que
Alimentación, Movimiento y Mente aportan al descanso, con enlaces reales a cada uno.

### Próximos pasos (opciones)

1. **Correr la E2E completa** — pendiente del usuario. Es la validación que falta de toda la serie.
   `E2E_PORT=3100 pnpm run test:e2e:run` si el 3000 sigue ocupado; conviene en dos mitades.
2. **Puentes en los otros tres pilares.** Hoy solo Sueño muestra sus conexiones. El componente y la
   forma ya existen; faltaría la copia de las otras nueve.
3. **Enlazar los catálogos con el directorio local**, que los cuatro nombran y ninguno enlaza.
4. **Abrir el PR** de la rama: son diez commits locales sin subir.

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
