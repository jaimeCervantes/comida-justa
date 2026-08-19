# Bitacora de fusion de Pilares y Habitos

## 2026-08-11 - Slice 1: Sueno como piloto vertical

### Objetivo

Comprobar que explicacion y practica pueden convivir en `/pilares/sueno` sin perder la experiencia
moderna, el seguimiento semanal ni la privacidad, y sin mantener una segunda pagina publica para el
mismo tema.

### Decisiones y racional

- La practica aparece despues del primer bloque educativo y antes de los procesos, la evidencia y
  las referencias. Asi la accion llega temprano, pero conserva el contexto que la hace comprensible.
- El hero de Habitos se convirtio en una seccion con H2 dentro del articulo. Esto mantiene una sola
  jerarquia principal y evita incrustar otro `<main>` o H1.
- La carga de sesion y progreso vive en `SleepPracticeSection`; la composicion comprobable vive en
  `SleepPracticeContent`. La separacion evita arrastrar autenticacion al entorno DOM de Vitest.
- El panel y las Server Actions se movieron al area de Pilares. Sus claves, casos de uso y datos
  persistidos no cambiaron.
- `/habitos/sueno` y su pathname ingles se eliminaron sin redireccion porque aun no fueron publicados
  en produccion. El indice temporal de Habitos y las superficies comunitarias apuntan ahora a
  `/pilares/sueno`.
- Las E2E se actualizaron como contrato, pero no se ejecutaron: el usuario las correra manualmente al
  terminar el roadmap completo.

### Archivos tocados

**Roadmap y especificacion**

- `docs/features/wellbeing/006-2026-08-12-fusion-pilares-habitos.md`
- `src/e2e/pilares/fusion-pilares-habitos.feature`
- `src/e2e/habits/atomicSleepChallenge.feature`

**Ruta y presentacion de Pilares**

- `src/app/[locale]/pilares/[[...slug]]/page.tsx`
- `src/app/[locale]/pilares/components/SuenoPage.tsx`
- `src/app/[locale]/pilares/components/SleepPracticeSection.tsx`
- `src/app/[locale]/pilares/components/SleepPracticeContent.tsx`
- `src/app/[locale]/pilares/components/SleepChallengePanel.tsx`
- `src/app/[locale]/pilares/sleepChallengeActions.ts`

**Retiro y enlaces de Habitos**

- Se eliminaron `src/app/[locale]/habitos/sueno/page.tsx` y sus modulos locales.
- Se actualizaron el indice y las rutas dinamicas restantes bajo `src/app/[locale]/habitos/`.
- Se actualizaron `PublicHabitCelebrationCard` y `SiteCelebrationMessage`.

**Routing, i18n y SEO**

- `src/i18n/routing.ts`
- `src/i18n/messages/es.json`
- `src/i18n/messages/en.json`
- `src/domain/habits/habitChallengeExperiences.ts`
- `src/domain/seo/sitemap.ts`

**Pruebas**

- `SleepPracticeContent.test.tsx`
- `SleepChallengePanel.test.tsx`
- `habitChallengeExperiences.test.ts`
- `sitemap.test.ts`
- Specs Playwright de retos, metadata y calentamiento de rutas.

### Comandos clave

- `pnpm run test:run -- "src/domain/habits/habitChallengeExperiences.test.ts" "src/domain/seo/sitemap.test.ts" "src/app/[locale]/pilares/components/SleepPracticeContent.test.tsx" "src/app/[locale]/pilares/components/SleepChallengePanel.test.tsx"`
- `pnpm exec next typegen`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`
- `git diff --check`

### Resultados de validacion

- Pruebas enfocadas: 4 archivos, 35 pruebas aprobadas.
- Suite Vitest completa: 135 archivos, 1,285 pruebas aprobadas y 0 fallos.
- TypeScript: aprobado sin errores.
- Biome: 753 archivos revisados, 0 errores; conserva un aviso informativo preexistente en
  `IndexingStatusPanel.tsx`.
- `git diff --check`: aprobado.
- Playwright E2E: no ejecutado por acuerdo; queda como validacion manual pendiente al final del
  roadmap.
- Recursos compartidos: no se escribieron datos ni se ejecutaron migraciones o fixtures contra la
  base compartida.

### Desviaciones del roadmap

- La decision inicial contemplaba redirects permanentes. Se retiraron del alcance por indicacion del
  usuario al confirmar que estas URL nunca llegaron a produccion.
- Las E2E iban a ejecutarse por slice; se pospusieron todas hasta el final por indicacion del usuario.
- El primer intento unia carga servidor y presentacion en un archivo. El fallo controlado de Vitest
  mostro el acoplamiento con `next-auth` y se separaron ambos limites antes de cerrar el slice.

### Seguimientos

- Aplicar el patron validado a Alimentacion, Movimiento y Mente/Espiritu en el slice 2.
- Consolidar el indice, la practica activa y la liga en `/pilares` durante el slice 3.
- Ejecutar manualmente `pnpm run test:e2e:run` solo cuando los tres slices esten terminados.

### Recap

Sueno ya funciona conceptualmente como una sola experiencia bajo `/pilares/sueno`: primero explica,
luego permite actuar y finalmente profundiza en evidencia y referencias. La antigua pagina de
Habitos fue retirada, mientras las reglas y los datos del reto permanecen intactos. Las validaciones
automaticas no E2E estan verdes y el recorrido de navegador queda documentado para la corrida final.

### Próximos pasos (opciones)

- Continuar con el slice 2 y fusionar Alimentacion, Movimiento y Mente/Espiritu usando este patron.
- Ajustar primero detalles visuales del piloto si la revision manual de `/pilares/sueno` encuentra
  problemas de ritmo o longitud.
- Accion pendiente del usuario al final del roadmap: ejecutar `pnpm run test:e2e:run` y compartir
  cualquier fallo para corregirlo antes del cierre.

## 2026-08-11 - Ajuste visual del hero de Sueno

### Objetivo

Hacer que el titulo y el primer texto de la pagina se perciban como una sola entrada visual, usando
el mismo tratamiento moderno que ya distinguia la cabecera de la practica.

### Decisiones y racional

- Se extrajo `SleepHero` para compartir fondo, textura, espaciado y tipografia entre la cabecera del
  pilar y la cabecera interna del reto.
- El hero superior usa H1 y reune titulo, introduccion e identidad. El hero de la practica usa H2,
  titulo e introduccion, pero ya no repite la identidad.
- `PillarArticle` acepta un slot opcional de cabecera. Los otros tres pilares conservan exactamente
  su encabezado actual hasta sus slices correspondientes.

### Archivos tocados

- Presentacion: `SleepHero.tsx`, `SuenoPage.tsx`, `SleepPracticeContent.tsx`, `PillarArticle.tsx`.
- Pruebas: `SuenoPage.test.tsx`, `fusion-pilares-habitos.feature` y
  `atomicSleepChallenge.spec.ts`.

### Comandos clave

- `pnpm run test:run -- "src/app/[locale]/pilares/components/SuenoPage.test.tsx"`
- `pnpm run test:run -- "src/app/[locale]/pilares/components/SuenoPage.test.tsx" "src/app/[locale]/pilares/components/SleepPracticeContent.test.tsx" "src/app/[locale]/pilares/components/pilaresData.test.ts"`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`

### Resultados de validacion

- Prueba roja inicial: 1 caso fallo porque la cabecera solo tenia `mb-10` y no contenia la
  identidad.
- Pruebas enfocadas finales: 3 archivos, 31 pruebas aprobadas.
- Suite Vitest completa: 136 archivos, 1,288 pruebas aprobadas y 0 fallos.
- TypeScript: aprobado sin errores.
- Biome: 755 archivos revisados, 0 errores y el mismo aviso informativo preexistente.
- Playwright E2E: actualizado, no ejecutado por el acuerdo de reservarlo para el final del roadmap.
- Recursos compartidos: no hubo escrituras ni migraciones.

### Desviaciones del roadmap

- Ninguna de alcance. Es un refinamiento visual del piloto solicitado durante su revision.

### Seguimientos

- Usar la leccion visual al fusionar los otros pilares, sin asumir que todos necesitan el mismo
  gradiente o identidad grafica.
- Confirmar la composicion en movil durante la corrida E2E final.

### Recap

La pagina de Sueno ahora abre con una sola pieza visual que contiene su H1, su promesa introductoria
y la identidad que refuerza el reto. La practica conserva una segunda cabecera moderna, pero sin
repetir esa identidad ni crear otro encabezado principal.

### Próximos pasos (opciones)

- Continuar con el slice 2 para integrar Alimentacion, Movimiento y Mente/Espiritu.
- Ajustar el ritmo vertical del hero si la revision visual manual detecta exceso de altura en movil.
- Accion pendiente del usuario al final del roadmap: ejecutar `pnpm run test:e2e:run`.

## 2026-08-11 - Slice 2: los cuatro pilares contienen su practica

### Objetivo

Aplicar el patron validado en Sueno a Alimentacion, Movimiento y Mente/Espiritu sin diluir lo que
hace distinta a cada practica: identidad, paleta, senal, minimo, preparacion, seguridad y ritual.

### Decisiones y racional

- `PillarHero` reemplaza al hero exclusivo de Sueno y recibe un tema cerrado. Se comparte la
  estructura, no una paleta unica: Alimentacion conserva naranja, Movimiento verde, Mente/Espiritu
  azul y Sueno violeta.
- `DeepHabitPracticeContent` convierte la experiencia profunda en una seccion embebible. No genera
  otro `<main>` ni H1 y baja senal, minimo y preparacion a H3.
- Cada ritual conserva cinco pasos especificos. En pantallas medianas usa dos columnas y solo pasa a
  cinco columnas en `lg`, para evitar tarjetas demasiado estrechas.
- `CuratedPracticeSection` centraliza sesion, progreso y callback para los tres retos. Los casos de
  uso, repositorios, claves persistidas, puntos y privacidad no cambiaron.
- `pillarHref` se convirtio en la unica construccion compartida de destinos de Pilares. Esto fija que
  ingles traduce `/pilares` a `/pillars`, pero mantiene los slugs estables en español.
- Se retiro la ruta dinamica `habitos/[slug]` sin redirects. La portada `/habitos` sigue temporalmente
  hasta el slice 3, pero todas sus tarjetas ya abren Pilares.

### Archivos tocados

**Pilares y composicion**

- `AlimentacionPage.tsx`, `MovimientoPage.tsx`, `MenteEspirituPage.tsx` y el dispatcher de Pilares.
- `CuratedPracticeSection.tsx` y `curatedHabitChallengeActions.ts`.
- `PillarHero.tsx`, `DeepHabitPracticeContent.tsx` y `DeepHabitChallengeExperience.tsx`.

**Routing y contratos**

- `src/i18n/routes.ts` y `src/i18n/routing.ts`.
- `habitChallengeExperiences.ts` y `sitemap.ts`.
- Indice temporal de Habitos, celebraciones publicas y mensaje comunitario global.
- Se eliminaron `src/app/[locale]/habitos/[slug]/page.tsx`, sus acciones locales y el CTA editorial
  que dejo de tener consumidores.

**Especificacion y pruebas**

- Se detallo y activo `@slice-2` en `fusion-pilares-habitos.feature`.
- Se actualizaron `atomicSleepChallenge.feature`, sus specs Playwright, metadata, sitemap y rutas de
  calentamiento.
- Se agregaron pruebas de destinos, heroes editoriales y rituales embebidos.

### Comandos clave

- `pnpm run test:run -- "src/i18n/routes.test.ts" "src/domain/habits/habitChallengeExperiences.test.ts" "src/domain/seo/sitemap.test.ts" "src/infra/UI/metadata/alternates.test.ts" "src/app/[locale]/pilares/components/CuratedPillarPages.test.tsx" "src/presentation/habits/DeepHabitPracticeContent.test.tsx"`
- `pnpm exec next typegen`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run test:run`

### Resultados de validacion

- Pruebas rojas iniciales: 11 fallos esperados en routing, sitemap, heroes y contenido embebido.
- Pruebas enfocadas finales: 8 archivos, 51 pruebas aprobadas.
- Suite Vitest completa: 139 archivos, 1,301 pruebas aprobadas y 0 fallos.
- TypeScript de produccion: aprobado sin errores.
- TypeScript de pruebas y Playwright: aprobado sin errores.
- Biome: 758 archivos revisados, 0 errores; conserva un aviso informativo preexistente en
  `IndexingStatusPanel.tsx`.
- Playwright E2E: actualizado pero no ejecutado por solicitud del usuario; queda listo para su
  corrida manual ahora que los cuatro pilares estan terminados.
- Recursos compartidos: no hubo escrituras, fixtures ni migraciones.

### Desviaciones del roadmap

- Se extrajo un helper tipado de rutas y un hero comun porque cuatro copias habrian creado una
  fuente inmediata de divergencia.
- La metadata canonica permanece en las paginas de Pilares; no se conservaron metadatos propios de
  las rutas de Habitos eliminadas porque nunca se publicaron.
- La portada `/habitos` se conserva hasta el slice 3, tal como estaba planeado, aunque sus detalles
  ya no existen.

### Seguimientos

- Ejecutar manualmente la suite Playwright para validar recorridos reales, callbacks y respuestas
  404 de las ocho URL antiguas.
- En el slice 3, integrar practica activa y liga en `/pilares` y retirar la ultima pagina `/habitos`.

### Recap

Los cuatro detalles de Pilares ya unen explicacion y accion en un mismo documento. Cada uno abre con
un hero propio, presenta su practica antes de las referencias y conserva un ritual concreto de cinco
pasos junto con seguimiento, puntos, privacidad y celebraciones. No quedan paginas publicas de
detalle bajo `/habitos`; solo permanece su indice temporal para el siguiente slice.

### Próximos pasos (opciones)

- Accion del usuario: ejecutar `pnpm run test:e2e:run` ahora que los cuatro pilares estan terminados.
- Continuar con el slice 3 para llevar practica activa y liga al indice `/pilares` y eliminar
  `/habitos` por completo.
- Si la corrida E2E descubre un fallo, corregirlo antes de iniciar la consolidacion del indice.

## 2026-08-11 - Correccion posterior a la corrida E2E manual

### Objetivo

Corregir dos aserciones fragiles descubiertas al ejecutar Playwright contra una base compartida y
con navegacion alternada entre español e ingles.

### Decisiones y racional

- La prueba de privacidad ya no exige que el feed comunitario global este vacio. Localiza la tarjeta
  por el nombre de la cuenta de suite y afirma solo la ausencia o presencia de su propio logro.
- Las reacciones se accionan dentro de esa tarjeta para evitar coincidencias con celebraciones de
  otras personas.
- Los detalles retirados se consultan con `APIRequestContext` y `maxRedirects: 0`. Un redirect real
  queda expuesto como respuesta 3xx, mientras que la cookie de idioma de una navegacion anterior ya
  no puede normalizar la siguiente URL y producir un falso fallo.

### Archivos tocados

**Pruebas E2E**

- `src/e2e/habits/atomicSleepChallenge.spec.ts`.
- `src/e2e/habits/testData.ts`.

### Comandos clave

- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run test:run`

### Resultados de validacion

- TypeScript de pruebas y Playwright: aprobado sin errores.
- Biome: 758 archivos revisados, 0 errores y el aviso informativo preexistente.
- Suite Vitest completa: 139 archivos, 1,301 pruebas aprobadas y 0 fallos.
- Playwright E2E: pendiente de una nueva corrida manual del usuario.
- Recursos compartidos: no hubo escrituras ni eliminaciones durante esta correccion.

### Desviaciones del roadmap

- Ninguna de comportamiento. Solo se hizo explicito el aislamiento que las pruebas debieron tener
  desde el principio.

### Seguimientos

- Confirmar los dos escenarios corregidos mediante una nueva corrida Playwright.

### Recap

Los dos fallos reportados provenian de estado externo a los escenarios: una celebracion real ajena
y la cookie de idioma acumulada dentro del bucle. Las pruebas ahora observan exclusivamente los
datos de la cuenta E2E y verifican los 404 sin seguir redirects.

### Próximos pasos (opciones)

- Accion del usuario: volver a ejecutar `pnpm run test:e2e:run`.
- Si la suite queda verde, continuar con el slice 3 de consolidacion del indice.
- Si aparece otro fallo, compartir el nombre, error y snapshot para aislarlo antes del slice 3.
