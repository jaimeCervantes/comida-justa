# Bitácora — Cada pilar enseña su práctica

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.10 · /pilares**.

---

## Slice 1 — «Leer más» con destino (2026-08-23)

### Las tres anotaciones del 5.10, revisadas

| Anotación | Estado |
| --- | --- |
| «Cada tarjeta lleva su práctica» | **faltaba** — es este slice |
| «El jardín cuenta repeticiones, no días… con la nota de privacidad a la vista» | ya estaba (`CommunityHabitGarden`) |
| «La celebración es del hito, no del texto libre» | ya estaba (`PublicHabitCelebrationList`) |

El canvas nombra `buildCommunityGarden` por su nombre, así que las dos últimas se dibujaron
mirando lo que ya existía. La primera no.

### Qué faltaba

La tarjeta de cada pilar decía número, título, subtítulo, descripción y «Leer más →». Cuatro
conceptos, y ninguna cosa que hacer: el enlace no prometía nada concreto. Ahora lleva delante el
nombre de su ritual —«Del atardecer al amanecer»— bajo el rótulo *práctica*, y entonces «Leer más»
tiene destino.

### El nombre vive bajo la clave del reto, no la del pilar

`atomicChallenges.<reto>.title` es donde están esos nombres, y el reto y el pilar **no se llaman
igual** en el cuarto: `mind` frente a `mindSpirit`. La equivalencia ya existía en
`PILLAR_KEY_BY_CHALLENGE`, escrita precisamente para que nadie volviera a emparejarlas a mano.

Hacía falta el camino de vuelta, y **se deriva de ella** en vez de escribirse otra vez: una segunda
tabla en el otro sentido sería la copia que la primera vino a evitar. `pilaresData.test.ts` recorre
los cuatro de ida y vuelta, comprueba que no sobra ni falta ninguno, y afirma explícitamente el par
que no se llama igual.

### Lo que afirma la e2e

Que **lo que promete la tarjeta es lo que hay dentro**: se lee el nombre anunciado en la portada, se
entra a ese pilar y se comprueba que aparece. Si el emparejamiento estuviera cruzado, la tarjeta
anunciaría la práctica de otro y esto se pondría rojo.

No copia ningún nombre: esos textos se afinan, y una prueba que los transcribe se cae en cada
retoque de redacción.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/app/[locale]/pilares"` | **138 en verde** (3 nuevas de la equivalencia) |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (1002 archivos) |
| `pnpm exec playwright test src/e2e/pilares` | **13/13** |

### Recap

La portada dejó de ser un índice de conceptos: cada pilar dice qué se hace con él, y la prueba
garantiza que lo que anuncia es lo que se encuentra al entrar.

### Próximos pasos (opciones)

1. **El botón «Elegir mi práctica» del héroe**, que el canvas pone junto a «Meta 5 de 7 días · leer
   no pide cuenta» — es la salida directa a la práctica sin pasar por el artículo.
2. **5.11 · /nosotros**.
3. **5.15 · /cuenta**.
