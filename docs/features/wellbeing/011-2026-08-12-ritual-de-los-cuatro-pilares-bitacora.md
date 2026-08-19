# Bitacora - El ritual de los cuatro pilares

## 2026-08-12 - Slice unico: una practica, cuatro pilares

### Objetivo

Que Alimentacion, Movimiento y Mente/Espiritu practiquen con la misma calidad que Sueño, y que esa
calidad viva en un solo componente en vez de en dos copias que llevaban semanas separandose.

### Decisiones y racional

- **Sueño es la referencia, no la excepcion.** El ritual bueno era el suyo, asi que la fusion se hizo
  hacia el: dos columnas de pasos con el numero al lado del texto, anclas con simbolo grande y su
  eco desvaido de fondo. Los otros tres apretaban cinco pasos en cinco columnas y encabezaban sus
  anclas con `01` y `+1`, que no dicen nada de la conducta que piden.
- **Las diferencias reales de contenido entran como piezas opcionales.** Sueño enuncia su version
  minima antes de las anclas; los otros tres cierran con una nota de preparacion. Son dos vocabularios
  legitimos, no un descuido, y forzarlos a ser identicos habria obligado a reescribir la redaccion.
  El componente los admite como `lead` y `note`; todo lo demas lo comparten.
- **Se retiro el aviso de recordatorios de Telegram de la practica.** Era el unico control muerto de
  la pagina: un boton permanentemente deshabilitado prometiendo algo que la pagina no puede enviar.
  Sigue en el indice de `/habitos`, que es la superficie que anuncia lo que aun no existe, y una
  prueba de la seccion afirma ahora que ningun pilar ofrece un control que no se pueda usar.
- **El antetitulo del ritual dejo de repetir su propio titulo.** Sueño escribia dos veces «El ritual
  que ira creciendo», una como antetitulo y otra como encabezado, y los otros tres repetian ahi el
  antetitulo del hero. Una sola clave nueva compartida (`experienceCommon.ritualEyebrow`) lo resuelve
  para los cuatro.
- **Los simbolos de las anclas son tema, no idioma.** Van en `pillarThemes` y llevan `aria-hidden`:
  no se traducen, no se leen en voz alta y no obligan a tocar el catalogo para cambiar un adorno.
- **La copia de la practica se resuelve fuera del componente.** `PillarPracticeSection` recibe su
  texto ya hecho, asi que se puede probar cada pilar sin montar el contexto de traducciones y las
  pruebas no se rompen cuando alguien mejora una frase.
- **El `key` del panel se extendio a los cuatro.** `useActionState` congela su estado inicial; sin
  esa `key`, un progreso cambiado en otra pantalla se seguia viendo viejo al volver. Sueño ya lo
  hacia y los otros tres no: era una diferencia invisible que producia datos incorrectos.
- **La regla de las dos anclas bajo al dominio.** Estaba en el dominio para Sueño (`nightPrepared &&
  morningLight`) y repetida a mano en la accion de los otros tres. Ahora `evaluateHabitCheckIn` la
  aplica una vez para los cuatro, con nombres que no mienten sobre a quien sirven.
- **Una sola tabla de tema por pilar.** Habia dos modulos con la misma clave mas una constante suelta
  para Sueño, que no cabia en el primero. `text-pillar-X-ink` estaba escrito tres veces por pilar.
  Los consumidores siguen recibiendo solo su parte (`PillarHeroTheme`, `HabitChallengeThemeConfig`),
  para que un hero no pueda alcanzar por accidente las clases del panel.
- **`PillarArticle` arma el hero.** Las cuatro paginas lo montaban con las mismas seis propiedades y
  las mismas clases. Entra el reto y de el salen paleta e identidad; ya no se puede pedir el hero de
  un pilar con el color de otro.
- **Se limpio lo que el slice anterior dejo huerfano:** los imports muertos de la portada y las cinco
  claves `pillarsTeaser*` de las dos catalogos, que ya no tenian componente.

### Archivos tocados

**Practica de pilar (nuevo)**

- `presentation/habits/PillarPracticeSection.tsx` y su prueba, parametrizada por los cuatro pilares.
- `presentation/habits/pillarPracticeCopy.ts`, con las dos lecturas del catalogo.
- `presentation/habits/pillarThemes.ts` y su prueba.
- `presentation/habits/habitChallengeAction.ts`, el contrato entre panel y accion.
- `app/[locale]/pilares/components/PillarPractice.tsx`.
- `app/[locale]/pilares/habitChallengeActions.ts`.

**Retirados**

- `SleepPracticeContent`, `SleepPracticeSection`, `SleepChallengePanel` y sus pruebas.
- `CuratedPracticeSection`, `DeepHabitChallengeExperience`, `DeepHabitPracticeContent` y su prueba.
- `deepHabitChallengeCopy`, `deepHabitChallengeThemes`, `habitChallengeThemes` y su prueba.
- `sleepChallengeActions` y `curatedHabitChallengeActions`.

**Simplificados**

- `useHabitChallengeCopy`: cuatro bloques casi identicos pasan a dos lecturas.
- `atomicSleepChallengeUseCase`: `completeCycle`/`completeCheckIn`/`completeFirstCycle` quedan en una,
  y las cuatro envolturas de celebracion en dos que reciben el hito.
- `PostgresAtomicSleepChallengeRepository`: una sola cache de instancias en vez de dos.
- `readLatestPublicCelebration`: es la lista pidiendo una, no una segunda consulta.
- `habitos/page.tsx`: tres cadenas de `if` paralelas pasan a una.
- `habitPublicThemes`: cadena de `if` a tabla.
- `PillarArticle`, `SuenoPage`, `AlimentacionPage`, `MovimientoPage`, `MenteEspirituPage`.

**Portada**

- `app/(home)/HomeHero.tsx` y su prueba: la portada estrena hero propio, en el naranja del logo, con
  la ubicacion dentro en vez de suelta entre el hero y las tarjetas.

**Idiomas y especificacion**

- `es.json` y `en.json`: una clave nueva, cinco huerfanas retiradas, paridad conservada.
- `docs/features/wellbeing/011-2026-08-12-ritual-de-los-cuatro-pilares.md`.
- `atomicSleepChallenge.spec.ts`: el boton muerto ya no se afirma; se afirma que no vuelve.

### Comandos clave

- `pnpm run lint`
- `pnpm run typecheck` y `pnpm run typecheck:tests`
- `pnpm run check:i18n`
- `pnpm run test:run`
- `pnpm run build`
- `pnpm exec playwright test src/e2e/habits`

### Resultados de validacion

- Vitest: 139 archivos, 1335 pruebas en verde.
- Typecheck de aplicacion y de pruebas: sin errores.
- Biome: 754 archivos, sin errores.
- `check:i18n`: sin castellano escrito a mano en componentes.
- `next build`: correcto.
- Playwright, suite de habitos: 19/19. Antes de arreglar la suite iban 10/19.
- Playwright completo, en dos mitades por RAM: `--shard=1/2` 124 en verde y 2 en
  rojo —los dos arreglados y verdes al repetirlos—, `--shard=2/2` 128 en verde y 3 saltados.
  252 escenarios en verde en total.

### Desviaciones del roadmap

- No se renombraron `AtomicSleepChallengeUseCase`, `AtomicSleepProgress` ni el modulo de dominio
  `atomicSleepChallenge`, que sirven a los cuatro rituales y siguen nombrados por el piloto. Es un
  cambio mecanico y amplio; mezclarlo con este habria enterrado la mejora visible en un diff de
  renombres. Queda como seguimiento.
- La primera corrida de Playwright fallo entera con 404 en todas las rutas `[[...slug]]`. No era el
  codigo: `pnpm run build` habia sobrescrito `.next` mientras un `next dev` seguia vivo, y el
  servidor siguiente arranco sobre artefactos de produccion. Borrar `.next` lo devolvio a la
  normalidad. Anotado porque cuesta media hora descubrirlo dos veces.
- El roadmap no contemplaba arreglar la suite E2E, pero al ejecutarla por primera vez —el roadmap de
  la fusion la habia dejado para el final— aparecieron nueve fallos, ninguno del ritual. Cuatro eran
  de la suite (un ayudante que solo sabia retrasar Sueño, tres escenarios afirmando sobre «la»
  tarjeta de un feed comunitario, dos dando por vacia una comunidad que vive en una base compartida,
  y las URL antiguas pedidas todas desde un contexto que guarda la cookie de idioma) y uno era del
  inicio: desde que la portada pinta las celebraciones, el escenario del primer pintado contaba sus
  `<article>` como si fueran del feed. Van en su propio commit.
- Se retiraron ademas los tres directorios vacios que la fusion dejo bajo `app/[locale]/habitos/`.

### Seguimientos

- Renombrar el caso de uso, el puerto y el tipo de progreso para que no hablen solo de Sueño.
- El slice 3 de la fusion sigue pendiente: retirar `/habitos` y llevar la liga a `/pilares`. Cuando
  ocurra, el aviso de recordatorios se queda sin superficie y habra que decidir si vuelve como
  seccion propia o desaparece hasta que exista el envio.

### Recap

Los cuatro pilares practican con la misma pagina: mismo hero, anclas con el simbolo de su pilar,
mismo panel de seguimiento y un ritual de cinco pasos legible que termina en su nota de seguridad.
Debajo, lo que eran dos componentes de practica, dos acciones de servidor, tres tablas de tema y
cuatro bloques de traduccion es ahora una de cada. No cambio ninguna regla, ningun dato guardado ni
ninguna redaccion visible salvo el antetitulo que se repetia a si mismo.

### Próximos pasos (opciones)

- Continuar el slice 3 de la fusion y retirar `/habitos`.
- Hacer el renombrado pendiente del caso de uso en un commit propio, sin cambios de comportamiento.
- Decidir si los recordatorios se construyen o se retiran del producto; hoy solo viven como aviso.
