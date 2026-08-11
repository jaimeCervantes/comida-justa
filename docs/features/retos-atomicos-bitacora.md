# Bitacora de retos atomicos

## 2026-08-10 - Slice 1: Mi primer ciclo de descanso

### Objetivo

Convertir el pilar de descanso en una primera accion pequena y verificable, con progreso privado,
recompensa inmediata y una proyeccion comunitaria voluntaria que no contamina publicaciones.

### Decisiones y rationale

- La definicion curada vive en codigo y la persistencia usa una clave versionada. Evita construir un
  CMS antes de validar que las personas vuelven.
- Progreso y celebracion son tablas separadas. Asi retirar consentimiento no borra lo personal.
- La celebracion se compone fuera de `posts`; busqueda, RSS, carrito y paginacion conservan su
  significado.
- Inicio y final de cada intencion son idempotentes. Un doble envio no compra XP adicional.

### Archivos tocados

- Especificacion: `docs/features/retos-atomicos.md`, `src/e2e/habits/atomicSleepChallenge.feature`.
- Dominio y aplicacion: `src/domain/habits/`, `src/use_cases/habits/`.
- Persistencia: `src/infra/dataAccess/db/schema/habits.ts`, `src/infra/dataAccess/habits/` y migracion
  backend `0033_2026-08-10_add_atomic_habit_challenges.py`.
- Interfaz: ruta de sueno, enlace desde el pilar, tarjeta de inicio, mensaje global e i18n.
- Pruebas: dominio, caso de uso, componente y Playwright con limpieza de la cuenta E2E.

### Comandos clave

- `alembic.exe upgrade head`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts`
- `pnpm run test:e2e:run`

### Validacion

- Vitest: 1229/1229 pruebas pasaron.
- TypeScript y lint: verdes.
- Playwright dirigido: 3/3 pruebas pasaron.
- Playwright completo: 222 pasaron, 3 omitidas y 15 fallaron en especificaciones preexistentes de
  busqueda y `cartFromSearch`; el spec nuevo de habitos permanecio verde.

### Base compartida y reversa

- Se aplico la migracion aditiva `0033_2026_08_10`, que creo `habit_challenge_progress` y
  `habit_celebrations`; no se alteraron filas existentes.
- Reversa tecnica: desde el backend, `alembic.exe downgrade 0032_2026_08_09`. Es destructiva para
  progreso creado despues de la migracion y solo debe ejecutarse tras respaldar o confirmar que esas
  tablas siguen vacias.

### Desviaciones y follow-ups

- El e2e completo revelo fallos ajenos en busqueda/carrito; no se cambiaron para no mezclar alcances.
- Quedaron para slices posteriores la semana real, jardin, otros pilares y liga condicionada.

### Recap

El primer ciclo ya puede iniciarse, completarse una vez, recompensarse con 10 XP y compartirse o
retirarse sin perder progreso; la celebracion publica queda fuera del modelo de publicaciones.

### Proximos pasos (opciones)

- Continuar con la semana local de siete dias y meta 5/7, usando fechas de manana e idempotencia por
  dia. No hay acciones pendientes de la persona usuaria para iniciar ese slice.

## 2026-08-11 - Slice 2: Siete dias y celebracion final

### Objetivo

Convertir la primera repeticion en una ventana real de siete fechas locales, flexible 5/7, donde
faltar no reinicia nada y volver tiene reconocimiento propio.

### Decisiones y rationale

- El ciclo pertenece a la fecha local de la manana y la zona IANA se fija al iniciar. El contrato
  `[inicio, fin)` evita ambiguedad en medianoche y el reloj inyectado vuelve ejecutables los limites.
- `habit_repetitions` impone una fila por reto y fecha. Asi diez XP por ciclo no dependen del doble
  toque ni de volumen.
- Fechas anteriores disponibles pueden registrarse despues; futuras y fuera de ventana se rechazan.
- Cinco repeticiones producen Cosecha y un hito final separado, opcional y revocable. El texto niega
  expresamente que siete dias prueben la formacion de un habito.

### Archivos tocados

- Dominio/use case: reglas de calendario, progreso, regreso, reloj y puertos de persistencia.
- Datos: espejo Drizzle, repositorio PostgreSQL y migracion backend `0034_2026-08-11`.
- Interfaz/i18n: calendario de siete dias, check-ins recuperables y celebracion final bilingue.
- Pruebas: Gherkin slice 2, Vitest y cuarto escenario Playwright con fecha de inicio controlada.

### Comandos clave

- `alembic.exe upgrade head`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts`

### Validacion

- Vitest dirigido: 30/30; completo: 1241/1241 en 127 archivos.
- Playwright de habitos: 4/4.
- Typecheck de producto y pruebas, lint e i18n: verdes.

### Base compartida y reversa

- Se aplico `0034_2026_08_11`: cuatro columnas nullable en progreso, el milestone final y la tabla
  nueva `habit_repetitions`. No se reescribieron filas existentes.
- Playwright creo progreso/repeticiones de la cuenta E2E y los elimino por cascada en `afterEach` y
  teardown.
- Reversa tecnica: `alembic.exe downgrade 0033_2026_08_10`. Elimina repeticiones posteriores a
  `0034`; solo debe usarse tras respaldarlas o confirmar que no hay datos que conservar.

### Desviaciones y follow-ups

- Next dev dejo duplicado parcial en `.next/dev/types/validator.ts` al detener el servidor; se limpio
  el artefacto generado antes de typecheck. No afecto fuentes ni comportamiento.
- La compatibilidad de filas de slice 1 sin zona conserva su XP y pide continuar para fijar la zona,
  en vez de inventar retrospectivamente una fecha local.

### Recap

El reto ya mide siete fechas locales bajo `[inicio, fin)`, permite recuperar check-ins, reconoce el
regreso, completa en 5/7 con 50 XP y conserva privado/revocable el hito final.

### Proximos pasos (opciones)

- Construir el jardin agregado y la reaccion unica sin sumar XP ni emitir alertas intermedias. No hay
  acciones pendientes de la persona usuaria.

## 2026-08-11 - Slice 4: Otros pilares y recordatorios

### Objetivo

Dar una siguiente practica concreta a alimentacion, movimiento y mente/comunidad sin activar todo a
la vez ni prometer recordatorios cuyo destino no se puede probar.

### Decisiones y rationale

- Las cuatro definiciones curadas viven en codigo y comparten progreso/repeticiones. No se creo CMS
  ni una tabla de contenido.
- Un indice parcial de PostgreSQL impone una sola practica activa por cuenta. Cambiar solo mueve la
  bandera; las filas y XP anteriores permanecen.
- Las rutas y metadatos son bilingues y cada pilar enlaza su practica mediante un CTA compartido.
- Hallazgo Telegram: `external_id` se usa para telefono o ids de Telegram, Instagram y Messenger;
  `messages.channel` existe pero no hay vinculacion por canal de la cuenta web. Hay puerto y cliente
  de envio, pero identidad insuficiente. Se deshabilito el opt-in en vez de simular envios.

### Archivos tocados

- Dominio/use case: registro curado, elegibilidad Telegram y onboarding generico.
- Datos: adaptador generico, bandera/indice de activo y migracion `0036_2026-08-11`.
- Interfaz: indice `/habitos`, tres rutas localizadas, paneles de practica y CTAs de pilares.
- Pruebas: siete reglas Vitest y Playwright de cambio descanso a alimentacion/ingles.

### Comandos clave

- `alembic.exe upgrade head`
- `pnpm run test:run`
- `pnpm run typecheck && pnpm run typecheck:tests`
- `pnpm run lint && pnpm run check:i18n`
- `pnpm exec playwright test ... --grep "another pillar"`

### Validacion

- Vitest dirigido: 7/7; completo: 1254/1254 en 130 archivos.
- Playwright dirigido: 1/1.
- Typechecks, lint e i18n: verdes.

### Base compartida y reversa

- Se aplico `0036_2026_08_11`: bandera default false e indice unico parcial por cuenta. No se marco
  activa ninguna fila existente.
- E2E creo dos progresos y una repeticion de la cuenta de suite, comprobo un activo y limpio todo.
- Reversa tecnica: `alembic.exe downgrade 0035_2026_08_11`; quita la garantia de un solo onboarding
  activo y requiere revisar primero cualquier fila activa.

### Desviaciones y follow-ups

- Se retiro el placeholder opcional de `/habitos` porque Next no permite que tenga la misma
  especificidad que el indice real; el `[slug]` nuevo conserva 404 para slugs desconocidos.
- Telegram queda condicionado a modelar y verificar `user + channel + external_id`.

### Recap

Los cuatro pilares ya tienen practicas pequenas y localizadas sobre persistencia comun, exactamente
una queda activa durante onboarding y Telegram comunica honestamente la dependencia de identidad.

### Proximos pasos (opciones)

- Ejecutar la regla de liga y mostrar solo el umbral mientras no haya diez opt-ins semanales activos.
  No hay acciones pendientes de la persona usuaria.

## 2026-08-11 - Slice 5: Liga semanal condicionada

### Objetivo

Volver ejecutable una liga etica sin mostrar una clasificacion desierta ni usar volumen, cuerpo o
popularidad como atajo de competencia.

### Decisiones y rationale

- La elegibilidad cuenta solo opt-ins con al menos una repeticion en la semana UTC actual. Diez es
  umbral inclusivo; nueve sigue condicionado.
- La semana usa `[lunes 00:00 UTC, lunes siguiente)` y cada `cycle_date` distinto vale un punto aunque
  la persona practique varios pilares ese dia.
- El ranking usa `username` reclamado como alias, ordena por constancia y comparte posiciones en
  empates. Sin alias no se acepta opt-in y nunca se sustituye por correo o nombre privado.
- El opt-in es revocable. Con menos de diez se devuelve ranking vacio al presentador y se muestra el
  progreso colectivo, no filas de relleno.

### Archivos tocados

- Dominio/use case: periodo semanal, elegibilidad, score, empates y estado condicionado.
- Datos: puerto/adaptador de liga, espejo Drizzle y migracion `0037_2026-08-11`.
- Interfaz: umbral, opt-in por alias y ranking solo elegible en `/habitos`.
- Pruebas/limpieza: seis reglas Vitest, escenario Playwright condicionado y barrido de opt-ins E2E.

### Comandos clave

- `alembic.exe upgrade head`
- `pnpm run test:run`
- `pnpm run typecheck && pnpm run typecheck:tests`
- `pnpm run lint && pnpm run check:i18n`
- `pnpm exec playwright test ... --grep "weekly league"`

### Validacion

- Dominio de liga: 6/6.
- Playwright condicionado: 1/1; la base compartida reporto 0 de 10 y no se renderizo ranking.
- La validacion acumulada final se registra al cierre de esta misma entrega.

### Base compartida y reversa

- Se aplico `0037_2026_08_11`, que creo solo `habit_league_opt_ins`; empezo vacia y no inscribio a
  nadie automaticamente.
- La prueba de umbral fue de lectura y la limpieza incluye cualquier opt-in futuro de la cuenta E2E.
- Reversa tecnica: `alembic.exe downgrade 0036_2026_08_11`; elimina todos los opt-ins y exige respaldo
  si ya hubiera consentimientos reales.

### Desviaciones y follow-ups

- No hay liga en vivo: 0 participantes semanales activos es menor que 10. Las reglas y consultas estan
  listas, pero la UI oculta correctamente toda clasificacion.
- Una operacion futura puede observar el umbral; no debe bajar el minimo ni sembrar participantes.

### Recap

La liga tiene reglas ejecutables, opt-in revocable por alias y score diario topado, pero permanece
honestamente condicionada: la base compartida esta en 0/10 y no muestra ranking.

### Proximos pasos (opciones)

- Observar crecimiento organico del umbral y habilitar automaticamente la vista ya implementada al
  llegar a diez personas semanales activas. No hay acciones pendientes de la persona usuaria.

## 2026-08-11 - Slice 3: Jardin comunitario y apoyo

### Objetivo

Hacer visible la practica colectiva sin convertir salud en popularidad, ni exponer fechas personales,
ni llenar el sitio de avisos por cada repeticion.

### Decisiones y rationale

- El aporte al jardin es un consentimiento agregado, separado de publicar un hito con identidad. Al
  retirarlo desaparecen todos sus conteos, pero el progreso privado permanece.
- Los cuatro colores se calculan desde repeticiones compartidas y definiciones conocidas; claves
  desconocidas no reciben un color inventado.
- `Celebrar` persiste una clave compuesta celebracion/persona y usa intenciones explicitas. Repetir
  agregar o retirar es idempotente y el XP sigue dependiendo solo de fechas distintas.
- Los mensajes globales siguen leyendo hitos primero/final; la actividad diaria solo mueve el jardin.
- No existe modelo real de grupos, por lo que se muestra el estado condicionado en vez de equipos
  vacios.

### Archivos tocados

- Dominio: agregado del jardin y semantica idempotente de reacciones.
- Datos: preferencia en progreso, tabla de reacciones, consultas y migracion `0035_2026-08-11`.
- Interfaz: jardin de cuatro colores, control revocable y reaccion en la tarjeta comunitaria.
- Pruebas: escenarios slice 3, seis reglas de dominio y recorrido Playwright del aporte revocable.

### Comandos clave

- `alembic.exe upgrade head`
- `pnpm run test:run`
- `pnpm run typecheck && pnpm run typecheck:tests`
- `pnpm run lint && pnpm run check:i18n`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts`

### Validacion

- Vitest dirigido: 36/36; completo: 1247/1247 en 128 archivos.
- Playwright de habitos: 5/5 antes de agregar la asercion final de reaccion; esa asercion queda en la
  corrida acumulada final.
- Typechecks, lint e i18n: verdes.

### Base compartida y reversa

- Se aplico `0035_2026_08_11`: `garden_sharing_enabled` default false y
  `habit_celebration_reactions`. No se activo a ninguna cuenta existente.
- Las escrituras E2E de progreso, repeticiones, consentimiento y reacciones se eliminaron por las
  cascadas y el teardown.
- Reversa tecnica: `alembic.exe downgrade 0034_2026_08_11`; elimina consentimientos y reacciones, por
  lo que requiere respaldo o confirmacion previa.

### Desviaciones y follow-ups

- No se construyeron grupos: falta una entidad real, membresia y gobernanza.
- La reaccion E2E usa una cuenta autenticada sobre el hito visible; la idempotencia de repetir la
  misma intencion se desk-checkea en dominio y la unicidad vive ademas en PostgreSQL.

### Recap

El inicio ya muestra un jardin anonimo de cuatro colores, cada persona puede aportar o retirar sus
repeticiones y cada celebracion admite una reaccion por cuenta sin alterar XP ni emitir alertas
intermedias.

### Proximos pasos (opciones)

- Publicar las tres practicas curadas restantes y el estado honesto de recordatorios Telegram. No hay
  acciones pendientes de la persona usuaria.

## 2026-08-11 - Cierre acumulado de slices 1 a 5

### Objetivo

Verificar el roadmap completo en conjunto, incluida la indexacion de las nuevas rutas y la limpieza
de toda escritura de navegador sobre la base compartida.

### Decisiones y rationale

- `/habitos` dejo de ser stub, por lo que entro al sitemap junto con los cuatro retos y se retiro de
  la asercion SEO de rutas 404. El spec SEO dirigido quedo verde antes de repetir la suite completa.
- Se mantuvieron condicionados Telegram, grupos y ranking por datos reales: identidad de canal no
  probada, modelo de grupos ausente y liga en 0/10 respectivamente.

### Archivos tocados

- Roadmap, Gherkin y esta bitacora.
- Dominio/use cases/puertos de retos, comunidad, onboarding y liga.
- Adaptadores PostgreSQL, espejo Drizzle y migraciones backend 0034 a 0037.
- Rutas, presentacion, catalogos bilingues, sitemap y limpieza E2E.

### Comandos clave

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm run build`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts`
- `pnpm exec playwright test src/e2e/seo/seo.spec.ts`
- `pnpm run test:e2e:run`

### Validacion

- Vitest: 1259/1259 en 131 archivos.
- Typecheck de producto y pruebas: verdes despues de regenerar los tipos de ruta de Next.
- Build de produccion: verde; compilo y genero 37 paginas estaticas.
- Lint: verde, con un aviso informativo preexistente en `IndexingStatusPanel.tsx`.
- i18n: verde; catalogos `es`/`en` estructuralmente identicos y sin texto espanol nuevo hardcoded.
- Playwright de habitos: 7/7.
- Playwright SEO dirigido: 4/4.
- Playwright completo: 241 pasaron, 3 omitidas, 0 fallaron en 244 escenarios; los siete escenarios de
  habitos permanecieron verdes.

### Base compartida y reversa

- Quedaron aplicadas 0034, 0035, 0036 y 0037. Son aditivas; no se destruyo ni sobrescribio data
  existente y ningun opt-in se activo automaticamente.
- Playwright creo progreso, repeticiones, preferencias, reacciones, sesiones y fixtures propios. Los
  `afterEach` y el teardown los eliminaron; la corrida completa termino verde.
- Reversa escalonada desde el backend: `alembic.exe downgrade 0036_2026_08_11`, luego 0035, 0034 y
  0033 segun lo que se quiera retirar. Cada downgrade elimina tablas/columnas del slice y no debe
  ejecutarse sin respaldo o confirmacion de ausencia de datos reales.

### Desviaciones y follow-ups

- Una primera corrida completa alcanzo 233/244 antes del timeout y detecto el spec SEO obsoleto; se
  corrigio y la segunda termino 241/241 ejecutadas.
- Next dev genero fragmentos temporales corruptos bajo `.next/dev/types` al detener algunos servidores;
  se regeneraron/limpiaron y las fuentes no estuvieron implicadas.

### Recap

Los slices 1 a 5 estan entregados: semana local 5/7, jardin y reacciones sin XP, tres practicas
adicionales, onboarding unico, Telegram condicionado y liga etica condicionada en 0/10, todo verde.

### Proximos pasos (opciones)

- Observar retorno, aportes al jardin y opt-ins semanales antes de habilitar integraciones o grupos.
  No queda ninguna accion tecnica pendiente para este roadmap ni una accion pendiente de la persona
  usuaria.

## 2026-08-11 - Revision final: la idea completa tambien se ve

### Objetivo

Alinear la entrega final con dos decisiones que estaban bien en la conversacion y el roadmap, pero
no del todo en la interfaz: la luz natural al final de la tarde y la identidad cromatica ya acordada
para cada pilar.

### Decisiones y rationale

- La tarde no usa una hora fija: el ritual recomienda luz natural si todavia la hay y recuerda no
  mirar directamente al sol. Asi funciona con temporada y ubicacion distintas.
- El jardin dejo los colores genericos de Tailwind y consume `--pillar-*`: descanso violeta,
  alimentacion naranja, movimiento verde y mente/comunidad ambar. El agregado comunitario ahora
  habla el mismo lenguaje que `/pilares`.
- El roadmap ya no enumera como «fuera» los slices que esta entrega termino.

### Archivos tocados

- Ritual e i18n: `habitos/sueno/page.tsx`, `messages/es.json`, `messages/en.json`.
- Comunidad: `presentation/habits/CommunityHabitGarden.tsx`.
- Especificacion/documentacion: `atomicSleepChallenge.feature`, `retos-atomicos.md`.

### Comandos clave

- `pnpm run test:run`
- `pnpm run typecheck && pnpm run typecheck:tests`
- `pnpm run lint && pnpm run check:i18n`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts src/e2e/seo/seo.spec.ts`

### Validacion

- Vitest: 1259/1259 en 131 archivos.
- Typecheck de producto y pruebas, lint e i18n: verdes; lint conserva un aviso informativo
  preexistente en `IndexingStatusPanel.tsx`.
- Playwright dirigido final: 11/11, siete escenarios de habitos y cuatro de SEO.
- `git diff --check`: verde.

### Base compartida y reversa

- Este ajuste no escribio esquema ni datos. Las migraciones aplicadas siguen en el head
  `0037_2026_08_11` y las limpiezas E2E terminaron sin residuos.

### Desviaciones y follow-ups

- Ninguna desviacion funcional. Telegram, grupos y liga publica conservan sus condiciones medidas.

### Recap

La entrega refleja tambien los matices finales de la idea: el ritual empieza en la luz disponible de
la tarde, continua con la noche y la manana, y el jardin usa la paleta real de los cuatro pilares.

### Proximos pasos (opciones)

- Revisar visualmente el ritual y el jardin con actividad real; despues observar retorno y opt-ins.
  No queda ninguna accion tecnica pendiente ni una accion obligatoria de la persona usuaria.

## 2026-08-11 - Slice 6: Alimentacion con la profundidad de Sueno

### Objetivo

Convertir Una planta mas de un registro generico en un ritual de eleccion real, con la profundidad
semanal, privada y comunitaria ya probada en descanso, sin heredar su narrativa ni su estetica.

### Decisiones y rationale

- Calendario, check-in, regreso, XP, hitos, consentimiento y jardin ahora salen del mismo panel y
  caso de uso. Compartir estructura evita que cuatro copias diverjan; la configuracion cerrada evita
  que compartir estructura mezcle identidades.
- La preparacion visible, lavada o porcionada se explica antes del check-in pero no se marca. Asi
  reduce friccion sin convertirse en una tercera obligacion oculta.
- La consulta publica discrimina por clave y milestone. Alimentacion proyecta texto, naranja y ruta
  propios tanto en la tarjeta como en el mensaje global.
- Se reutilizo el esquema 0033-0037 sin migracion: ya tenia clave de reto, fecha local, hitos y
  consentimientos suficientes.

### Archivos tocados

- Especificacion/documentacion: roadmap, Gherkin y esta bitacora.
- Dominio/aplicacion/datos: registro cerrado de experiencias, check-in compartido y repositorio
  PostgreSQL acotado por clave de reto.
- Presentacion/i18n: panel promovido a `src/presentation/habits`, experiencia naranja bilingue y
  proyecciones publicas discriminadas.
- Pruebas/E2E: reglas de configuracion, componente compartido, tres recorridos de Alimentacion y
  calentamiento de rutas de habitos.

### Comandos clave

- `pnpm run test:run`
- `pnpm run typecheck && pnpm run typecheck:tests`
- `pnpm run check:i18n`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts --grep "nutrition|another pillar"`

### Validacion

- Vitest: 1263/1263 en 133 archivos.
- Typecheck de producto y pruebas e i18n: verdes.
- Playwright dirigido de Alimentacion/onboarding: 3/3.
- Sleep conserva 6/6 pruebas de componente sobre el panel compartido.

### Base compartida y reversa

- Playwright creo progreso, cinco repeticiones, hitos, consentimiento y sesiones solo para la cuenta
  E2E; `afterEach` y teardown los eliminaron. No hubo migracion ni escritura persistente que revertir.

### Desviaciones y follow-ups

- Se agregaron las rutas de habitos al calentamiento serial porque Next dev devolvia un 404 frio e
  intermitente antes de terminar la primera compilacion. La ruta caliente quedo estable.
- Movimiento seguia intencionalmente como pagina generica durante este slice; se vuelve actual solo
  despues de cerrar Alimentacion en verde.

### Recap

Una planta mas ya es una experiencia naranja completa: senal y minimo verificables, preparacion
recomendada, semana local 5/7, 50 XP topados y celebraciones privadas o publicas con destino propio.

### Proximos pasos (opciones)

- Implementar Dos minutos cuentan sobre la base compartida ya extraida, con senales y celebraciones
  verdes propias. No hay acciones pendientes de la persona usuaria.

## 2026-08-11 - Slice 7: Movimiento con ritual propio

### Objetivo

Hacer que Dos minutos cuentan premie el acto controlable de empezar, con una senal adaptable y un
minimo segun capacidad, sin convertir duracion, distancia o intensidad en ventaja.

### Decisiones y rationale

- El check-in comparte los dos campos cerrados de senal y minimo. La continuacion se explica pero no
  se captura: si no entra al formulario ni a persistencia, no puede comprar XP por accidente.
- La experiencia profunda de ruta se parametrizo con copy y tema, ademas del panel. Alimentacion y
  Movimiento conservan composicion comun sin duplicar una pagina por pilar.
- Los trazos diagonales, verde oficial y lenguaje de inicio distinguen Movimiento; la consulta publica
  conserva clave, milestone, texto y destino propios.
- Se mantuvo el esquema existente porque fecha local, unicidad y final 5/7 ya expresan toda la regla.

### Archivos tocados

- Especificacion/documentacion: roadmap, escenarios slice 7 y bitacora.
- Dominio/presentacion: configuracion cerrada de Movimiento, copy del panel y tema profundo verde.
- Proyeccion publica/i18n: tarjeta, mensaje global, metadata y catalogos bilingues.
- Pruebas/E2E: configuracion, componente, dos recorridos Playwright y calentamiento de la ruta.

### Comandos clave

- `pnpm run test:run`
- `pnpm run typecheck && pnpm run typecheck:tests`
- `pnpm run check:i18n`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts --grep "movement"`

### Validacion

- Vitest: 1265/1265 en 133 archivos.
- Typechecks e i18n: verdes.
- Playwright dirigido de Movimiento: 2/2.
- El componente compartido conserva 6/6 pruebas especificas de Sleep.

### Base compartida y reversa

- Playwright creo progreso, repeticiones, celebracion y sesion de la cuenta E2E; el teardown elimino
  todas las filas. No hubo migracion ni cambio de esquema.

### Desviaciones y follow-ups

- Ninguna desviacion funcional. La quinta etapa del ritual hace explicito que continuar o cerrar es
  una eleccion, pero no agrega estado ni puntos.

### Recap

Dos minutos cuentan ya ofrece senal adaptable, minimo segun capacidad, semana 5/7, celebraciones
verdes y comunidad propia, sin premiar volumen ni alterar la experiencia de descanso.

### Proximos pasos (opciones)

- Implementar Un vinculo consciente con presencia y escucha sin exigir respuesta ajena ni medir
  popularidad. No hay acciones pendientes de la persona usuaria.

## 2026-08-11 - Slice 8: Mente y Comunidad con ritual propio

### Objetivo

Convertir Un vinculo consciente en una practica de presencia controlable por quien la realiza, donde
escuchar incluye dejar espacio y la respuesta ajena nunca decide exito, XP ni reconocimiento.

### Decisiones y rationale

- El check-in pregunta por la pausa y el mensaje genuino con espacio para escuchar. No existe campo
  de respuesta del destinatario, por lo que ausencia y presencia de respuesta cumplen igual.
- La configuracion cerrada completa los cuatro pilares sobre un solo calendario, panel, caso de uso y
  repositorio por clave; el panel generico anterior se elimino para impedir regresar a una pagina sin
  profundidad.
- La atmosfera ambar usa circulos conectados y conserva el token oficial de Mente en las conexiones;
  el jardin no cambio sus colores oficiales.
- Tarjeta y mensaje global discriminan Mente/Comunidad por clave y milestone, sin conteos de
  respuestas ni popularidad. Las reacciones comunitarias siguen sin dar XP.

### Archivos tocados

- Especificacion/documentacion: roadmap completo, Gherkin slice 8 y esta bitacora.
- Dominio/aplicacion/datos: cuarta configuracion cerrada sobre el repositorio compartido, sin esquema
  nuevo.
- Presentacion/i18n: experiencia ambar bilingue, metadata, panel, tarjeta y mensaje global propios.
- Pruebas/E2E: no-respuesta explicita, semana 5/7, proyeccion publica y ruta caliente.

### Comandos clave

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm run build`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts`
- `pnpm run test:e2e:run`

### Validacion

- Vitest: 1267/1267 en 133 archivos.
- Typecheck de producto y pruebas: verdes.
- Lint: verde; conserva un aviso informativo preexistente en `IndexingStatusPanel.tsx`.
- i18n: verde; catalogos estructuralmente identicos y sin texto espanol nuevo hardcoded.
- Build: verde; compilo y genero 37 paginas estaticas.
- Playwright de habitos: 13/13.
- Playwright completo: 247 pasaron, 3 omitidas y 0 fallaron en 250 escenarios.

### Base compartida y reversa

- Las corridas escribieron fixtures etiquetados de usuarios, sesiones, publicaciones, pedidos,
  progreso, repeticiones, celebraciones, reacciones y opt-ins. `afterEach` y global teardown los
  eliminaron y verificaron que no quedaran residuos.
- No hubo migracion ni cambio de esquema. No existe reversa de datos pendiente; el codigo se puede
  retirar sin tocar registros reales.

### Desviaciones y follow-ups

- La primera corrida completa llego a 190/250 sin fallos antes del timeout de 15 minutos; se repitio
  desde cero con margen suficiente y termino 247/247 ejecutadas.
- El servidor de pruebas registro advertencias preexistentes de imagenes fixture y traducciones
  asincronas que intentaron persistir despues de limpiar su post; no fallaron escenarios ni dejaron
  residuos segun teardown.

### Recap

Los cuatro retos ya comparten la mecanica completa sin compartir identidad: Sleep permanece intacto,
Alimentacion es naranja, Movimiento verde y Mente/Comunidad ambar; todos ofrecen semana local 5/7,
XP diario topado, regreso, privacidad, jardin y celebraciones publicas con texto y destino correctos.

### Proximos pasos (opciones)

- Revisar visualmente las cuatro experiencias en movil y escritorio con contenido real, y observar
  retorno a tercera repeticion antes de ampliar recordatorios o grupos. No hay acciones tecnicas ni
  aprobaciones pendientes de la persona usuaria.

## 2026-08-11 - Cierre tecnico: responsabilidades de la interfaz

### Objetivo

Cerrar la adaptacion de los cuatro pilares sin dejar copy, temas, celebraciones y composicion de ruta
mezclados en dos archivos que dificultaban revisar o cambiar una responsabilidad de forma aislada.

### Decisiones y rationale

- El panel conserva estado, calendario y formularios; la resolucion cerrada de traducciones, los temas
  y los hitos con consentimiento viven ahora en modulos dedicados. La separacion mantiene las claves
  tipadas y evita crear un segundo panel.
- La experiencia profunda de Alimentacion, Movimiento y Mente/Comunidad se promovio completa a
  presentacion compartida. La ruta queda limitada a locale, metadata, autenticacion, progreso y
  conexion de la Server Action.
- Sueno sigue siendo un wrapper del panel compartido. No se cambiaron catalogos, selectores, etiquetas,
  rutas, estilos, contratos de accion ni escenarios existentes.

### Archivos tocados

- Panel compartido: `HabitChallengePanel.tsx`, `useHabitChallengeCopy.ts`,
  `habitChallengeThemes.ts` y `HabitChallengeCelebrations.tsx`.
- Experiencia profunda: `DeepHabitChallengeExperience.tsx`, `deepHabitChallengeCopy.ts` y
  `deepHabitChallengeThemes.ts`.
- Frontera de ruta: `src/app/[locale]/habitos/[slug]/page.tsx`.
- Documentacion: esta entrada append-only; roadmap y Gherkin permanecen sin cambios porque no existe
  conducta observable nueva.

### Comandos clave

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts`
- `git diff --check`

### Validacion

- Vitest dirigido: 4/4; suite completa: 1267/1267 en 133 archivos.
- Typecheck de producto y pruebas: verdes.
- Lint: verde, con el aviso informativo preexistente en `IndexingStatusPanel.tsx`.
- i18n: verde; no hay texto espanol nuevo escrito a mano en componentes.
- Playwright de habitos: 13/13.
- `git diff --check`: verde.

### Base compartida y reversa

- No hubo cambios de esquema ni escrituras de producto. Playwright creo solo fixtures etiquetados y
  el teardown de la suite elimino sus usuarios, sesiones y datos de habitos.
- La reversa es solo de codigo de presentacion; no requiere migracion ni correccion de datos.

### Desviaciones y follow-ups

- No se agregaron pruebas ni escenarios especulativos: los escenarios existentes verificaron que la
  extraccion conserva el comportamiento de los cuatro pilares.
- Todos los archivos extraidos quedan por debajo de 350 lineas; el panel bajo de 888 a 332 y la ruta
  de 413 a 81.

### Recap

Los cuatro retos conservan exactamente sus rutas, metadata, copy, formularios, celebraciones y
estetica, pero la interfaz ya separa orquestacion, traducciones, temas, hitos y composicion profunda en
unidades pequenas con una sola responsabilidad dominante.

### Próximos pasos (opciones)

- Revisar visualmente cuando exista una necesidad de producto; no queda accion tecnica ni aprobacion
  pendiente por este cierre de mantenibilidad.

## 2026-08-11 - Auditoria final de produccion

### Objetivo

Verificar despues del refactor que Next.js puede compilar la aplicacion completa y generar las rutas
localizadas de los cuatro retos sin depender solo de pruebas aisladas o del typecheck.

### Decisiones y rationale

- Se ejecuto el build real de produccion porque valida conjuntamente los limites Server/Client, la
  carga de catalogos, la metadata y el arbol de rutas que las pruebas unitarias no ensamblan completo.

### Archivos tocados

- Documentacion: esta entrada append-only.

### Comandos clave

- `pnpm run build`
- `git diff --check`

### Validacion

- Next.js 16.2.1 compilo correctamente, paso TypeScript y genero 37 paginas estaticas.
- El manifiesto incluye `/[locale]/habitos`, `/[locale]/habitos/[slug]` y
  `/[locale]/habitos/sueno`.
- No hubo escrituras en base de datos, cambios de esquema ni servicios externos involucrados.

### Desviaciones y follow-ups

- No hubo desviaciones; esta auditoria no modifica conducta ni alcance.

### Recap

La adaptacion y su refactor quedan validados tambien como build integrado de produccion, con las rutas
de habitos presentes y sin pendientes tecnicos conocidos.

### Próximos pasos (opciones)

- No queda ninguna accion tecnica obligatoria. La observacion visual movil con contenido real puede
  hacerse mas adelante como seguimiento de producto, no como bloqueo de esta entrega.

## 2026-08-11 - Slice 9: una invitacion clara y textos cotidianos

### Objetivo

Hacer que la invitacion a empezar sea facil de encontrar en cada pilar y que las practicas expliquen
que hacer sin exponer vocabulario de implementacion.

### Decisiones y rationale

- Sueno se tomo como referencia de orden: la invitacion aparece antes de las fuentes. Los cuatro
  pilares usan ahora `AtomicChallengeCta`, en lugar de conservar una variante exclusiva para Sueno.
- El componente centra solo el boton; titulo y explicacion mantienen la lectura natural de la caja.
- Se eliminaron del contenido y metadata «atomico/atomic», «onboarding», `external_id` y las
  explicaciones sobre puertos o vinculaciones. Los nombres internos de modulos y claves permanecen
  porque no son visibles y cambiarlos no aportaria valor a la persona usuaria.
- Telegram sigue deshabilitado, pero ahora se informa directamente que los recordatorios estaran
  disponibles mas adelante.
- No cambiaron articulos, referencias cientificas, seguridad, privacidad, XP ni la meta 5 de 7.

### Archivos tocados

- Presentacion compartida: `src/presentation/habits/AtomicChallengeCta.tsx`.
- Pilares: `AlimentacionPage.tsx`, `MovimientoPage.tsx`, `MenteEspirituPage.tsx` y `SuenoPage.tsx`.
- Catalogos: `src/i18n/messages/es.json` y `src/i18n/messages/en.json`.
- Especificacion y pruebas: `src/e2e/habits/atomicSleepChallenge.feature`,
  `atomicSleepChallenge.spec.ts` y `src/e2e/seo/pageMetadata.spec.ts`.
- Documentacion: roadmap y esta entrada append-only.

### Comandos clave

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm exec playwright test src/e2e/habits/atomicSleepChallenge.spec.ts --grep "every pillar centers|habit pages use plain"`
- `pnpm exec playwright test src/e2e/seo/pageMetadata.spec.ts --grep "lenguaje interno"`
- `pnpm run build`
- `git diff --check`

### Validacion

- Vitest: 1267/1267 en 133 archivos.
- Typecheck de producto y pruebas: verdes.
- Lint: verde en 749 archivos, con el aviso informativo preexistente de
  `IndexingStatusPanel.tsx`.
- i18n: catalogos estructuralmente iguales y sin texto espanol nuevo escrito a mano.
- Playwright de los escenarios nuevos: 2/2 para orden, centrado y copy; 1/1 para metadata.
- Build de Next.js 16.2.1: compilacion y TypeScript verdes, 37 paginas generadas.

### Base compartida y reversa

- Los Playwright enfocados crearon solo la sesion y fixtures etiquetados de la cuenta E2E; sus
  `afterEach` y el teardown los eliminaron. No hubo cambios de esquema ni datos de producto.
- La suite E2E completa se inicio pero se detuvo por solicitud de la persona usuaria antes de obtener
  resultados. Se finalizaron todos los procesos Playwright/Next asociados y los puertos 3000 y 3100
  quedaron libres.
- La reversa es solo de componentes, catalogos y pruebas; no requiere migracion ni correccion de datos.

### Desviaciones y follow-ups

- La suite E2E completa queda deliberadamente sin validar en esta slice. No se reintentara sin una
  nueva solicitud; los tres escenarios directamente afectados si quedaron verdes de forma aislada.
- Al cerrarse un servidor de Playwright, `.next/dev/types` quedo truncado. Se elimino unicamente ese
  artefacto generado y el typecheck/build posteriores lo regeneraron correctamente.

### Recap

Los cuatro pilares muestran el mismo CTA compartido, con el boton centrado antes de las referencias.
El indice, las experiencias y su metadata hablan ahora de acciones concretas y reservan los detalles
tecnicos para la documentacion, sin modificar las reglas de los retos.

### Próximos pasos (opciones)

- Revisar visualmente el ritmo del CTA en movil cuando se retome trabajo de producto. La suite E2E
  completa queda pendiente solo porque fue detenida por solicitud expresa; no hay procesos activos ni
  acciones sobre base de datos pendientes.

## 2026-08-11 - Slice 10: Mente y Espiritu comparte ruta y color con su pilar

### Objetivo

Hacer que Un vinculo consciente sea una continuacion reconocible del pilar Mente y Espiritu tanto en
su direccion como en su identidad visual.

### Decisiones y rationale

- La ruta canonica es `/habitos/mente-espiritu` y en ingles `/en/habits/mind-spirit`. No se conserva
  alias de la direccion anterior porque la funcionalidad todavia no se ha publicado.
- El rotulo visible cambia de Mente y Comunidad a Mente y Espiritu para que indice, metadata y pilar
  nombren el mismo concepto.
- Hero, panel, botones y celebraciones usan los tokens `pillar-mind-spirit-*`; se eliminaron las
  clases ambar escritas a mano. Asi un cambio futuro de paleta se propaga desde el design system.
- La tarjeta publica y el aviso global comparten ahora `habitPublicThemes`, evitando que una de las
  dos superficies vuelva a divergir.
- El `challengeKey` persistido no cambia; no hay migracion ni transformacion de progreso.

### Archivos tocados

- Dominio y rutas: `curatedChallenges.ts`, `habitChallengeExperiences.ts`, `routing.ts`, sitemap,
  paginas, acciones, CTA del pilar y calentamiento E2E.
- Presentacion: `deepHabitChallengeThemes.ts`, `habitChallengeThemes.ts`,
  `habitPublicThemes.ts`, panel, celebraciones, tarjeta publica y aviso global.
- Catalogos: `src/i18n/messages/es.json` y `src/i18n/messages/en.json`.
- Pruebas y especificacion: pruebas de dominio/sitemap/temas, Gherkin y Playwright actualizado.
- Documentacion: roadmap y esta entrada append-only.

### Comandos clave

- `pnpm run test:run -- src/domain/habits/curatedChallenges.test.ts src/domain/habits/habitChallengeExperiences.test.ts src/presentation/habits/habitChallengeThemes.test.ts src/domain/seo/sitemap.test.ts`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm run build`
- `git diff --check`

### Validacion

- Pruebas dirigidas: 36/36 en 4 archivos.
- Vitest completo: 1271/1271 en 134 archivos.
- Typecheck de producto y pruebas: verdes.
- Lint: verde en 751 archivos, con el aviso informativo preexistente de
  `IndexingStatusPanel.tsx`.
- i18n: catalogos estructuralmente iguales y sin texto espanol escrito a mano.
- Build de Next.js 16.2.1: compilacion y TypeScript verdes, 37 paginas generadas.
- Playwright no se ejecuto por instruccion expresa de detener las E2E; sus expectativas si quedaron
  actualizadas a las rutas nuevas.

### Base compartida y reversa

- Esta slice no leyo ni escribio fixtures en la base compartida y no cambia el esquema.
- La reversa consiste en codigo, catalogos y rutas no publicadas; no requiere corregir datos.

### Desviaciones y follow-ups

- Un primer intento de commit disparo el hook completo, que incluye Playwright. Se detuvo el servidor
  creado por el hook y, por solicitud de la persona usuaria, los commits de esta entrega se crean con
  `--no-verify`; las validaciones no-E2E se ejecutaron manualmente antes de ello.

### Recap

Un vinculo consciente vive ahora bajo Mente y Espiritu en ambos idiomas y todas sus superficies usan
la misma paleta azul definida por el pilar, sin modificar progreso ni datos persistidos.

### Próximos pasos (opciones)

- No queda accion funcional pendiente. Playwright completo permanece sin ejecutar por instruccion
  expresa; puede retomarse en otro momento sin necesidad de cambios de datos o migraciones.
