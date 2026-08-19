# Bitácora — Presencia, paz y conexión local

Append-only. El roadmap y la alineación viven en `docs/features/wellbeing/010-2026-08-12-presencia-paz-local.md`.

## 2026-08-12 — Slices 1 a 4, en una sola corrida

**Objetivo.** Cerrar la serie de los cuatro pilares. Que Mente y Espíritu deje de ser «manda un
mensaje de presencia» y pase a ser un día con ventanas de silencio, arraigo al aire libre,
conversación de verdad y un gesto hacia la gente de al lado.

### Decisiones y por qué

**La clave del reto no se tocó**: sigue siendo `mind-one-connection-v1`. Tercera vez que se aplica la
misma decisión y por la misma razón: las anclas se validan pero no se persisten, así que reescribir
la práctica entera es catálogo puro. El nombre público pasa a «Presencia, paz y conexión local».

**Las dos anclas son abrir el día sin pantalla y dar presencia a alguien.** Decisión del usuario
entre tres opciones. La segunda es la que tenía trampa: el V2 empuja fuerte hacia lo presencial, pero
exigir cara a cara habría dejado sin poder registrar su día justo a quien vive solo, trabaja en
remoto o está enfermo — **la soledad crónica que este pilar existe para atacar**. La copia resuelve
la tensión enunciando la preferencia y la alternativa en la misma frase: cara a cara y sin
dispositivos de preferencia; si hoy no hay nadie cerca, una llamada o un mensaje sincero cuentan
igual, porque lo que cuenta es escuchar de verdad, no el canal.

**El arraigo al aire libre es el mismo rato que pide Movimiento, y se dice.** Dos pilares que piden
«sal 15 minutos» sin reconocerse compiten por la agenda de la misma persona, y así se abandonan los
dos. La copia lo enuncia explícitamente en el paso 2 y en la sección de arraigo.

**La nota de seguridad creció, y aquí sí importaba.** Este es el pilar donde alguien puede estar
pasándola mal de verdad. La nota anterior hablaba de límites y privacidad; la nueva dice, con todas
sus letras, que si la ansiedad, la tristeza o la soledad se sostienen en el tiempo, **pedir ayuda
profesional también es cuidar la mente, y es lo que corresponde hacer**. Una práctica de bienestar
que no nombra esa puerta se vuelve un obstáculo para cruzarla.

**Las ventanas de silencio no cuentan minutos.** Tres momentos —primera hora, la mesa, última hora—
y ningún «dos horas sin pantalla». Convertir la calma en una métrica es exactamente el problema del
que viene quien lee esta página.

**Un dato que la verificación corrigió.** La nota de la respiración decía «alargar la exhalación más
que la inhalación es lo que baja el pulso». Al buscar la fuente apareció el ensayo de 2024 que probó
justo esa hipótesis —y su réplica—: **la proporción 1:2 no produjo diferencia de HRV frente a 1:1**.
Lo que la evidencia sostiene es bajar las respiraciones por minuto. La nota ahora dice «lo que calma
es respirar despacio; contar es solo la forma de lograrlo», y manda a aflojar el ritmo en vez de
perseguir el 4-7-8 exacto. Se citan los dos estudios: el que sostiene la afirmación y el que acotó
su alcance. Es el segundo dato que se corrige por buscar la fuente en lugar de escribir de memoria
—el primero fue el punto de humo del aceite de aguacate en Alimentación—.

**El catálogo es el tercero sobre `PillarCatalog`.** La extracción hecha en Movimiento se pagó sola:
este pilar solo aportó datos y etiquetas.

### Archivos tocados

- `src/i18n/messages/{es,en}.json`: `atomicChallenges.mindExperience` y su resumen reescritos;
  `pillarPages.mindSpirit` de 13 a 78 claves; `pillars.mindSpirit` renombrado.
- `MenteEspirituPage.tsx` + `MindSilenceWindows.tsx`, `MindGroundingAndBreath.tsx`,
  `MindPracticeCatalog.tsx` (nuevos).
- `references.ts`: cinco DOIs nuevos con su comentario.
- `MenteEspirituPage.test.tsx` (nuevo), `PillarPages.test.tsx`, `HabitChallengePanel.test.tsx`, y
  las filas de Mente en `atomicSleepChallenge.{feature,spec.ts}`, `fusion-pilares-habitos.feature` y
  `cenaRealLocal.feature`.
- `src/e2e/pilares/presenciaPazLocal.feature` (nuevo).

### Referencias añadidas, verificadas contra Crossref

| Afirmación | DOI | Publicación |
| --- | --- | --- |
| Soledad y aislamiento pesan como los factores de riesgo ya establecidos | `10.1177/1745691614568352` | Perspect Psychol Sci, 2015 |
| Una sesión de respiración lenta sube el tono vagal y baja la ansiedad | `10.1038/s41598-021-98736-9` | Scientific Reports, 2021 |
| La proporción 1:2 **no** cambia la HRV frente a 1:1 (acota la afirmación) | `10.1007/s10484-024-09637-2` | Appl Psychophysiol Biofeedback, 2024 |
| Exposición a espacios verdes sobre depresión y ansiedad | `10.1016/j.envres.2023.116303` | Environmental Research, 2023 |

### Validación

`typecheck`, `typecheck:tests`, `lint` (768 archivos) y `check:i18n` en verde. Paridad de catálogos:
1131 claves en `es.json` y 1131 en `en.json`. `test:run` se cierra al final de esta corrida.
`pnpm run test:e2e:run` **no se ejecutó**: el usuario la corre ahora que los cuatro pilares están.

### Recap

Los cuatro pilares están completos y comparten modelo: reto con dos anclas pequeñas sobre su clave
original, costo oculto junto a su contrapeso, una sección que responde «cuánto» o «cuándo» sin
prescribir volumen, una guía específica del pilar y un catálogo de cuatro categorías sobre el mismo
componente compartido. Mente cierra la serie con las ventanas de silencio, el arraigo con
respiración, el catálogo de prácticas y una nota de seguridad que nombra el apoyo profesional.

### Próximos pasos (opciones)

1. **Correr la E2E completa** — pendiente del usuario, ahora que los cuatro pilares están listos. Si
   el puerto 3000 sigue ocupado: `E2E_PORT=3100 pnpm run test:e2e:run`. Conviene correrla en dos
   mitades (`--shard=1/2` y `2/2`).
2. **Revisar Sueño**, el único pilar que no se tocó. Los otros tres ya apuntan a él —la cena
   temprana, la luz de la mañana, la última hora sin pantalla— y su página todavía no lo devuelve.
3. **Enlazar los catálogos con el directorio local**: los tres nombran mercado, gimnasios, estudios y
   proyectos de la zona, y el sitio ya tiene directorio de productores.
4. **Abrir el PR** de la rama cuando quieras; hasta ahora solo hay commits locales.

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
