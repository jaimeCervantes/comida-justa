# El ritual del pilar publica

> Roadmap de slices. Escenarios: `src/e2e/habits/elRitualPublica.feature`.
> Continúa `010-2026-09-06-practicas-como-publicaciones.md`: ahí la práctica del catálogo aprendió a
> publicarse y a recibir apoyo; aquí le toca al ritual de cada pilar, que hasta hoy no llega al feed.

## Hallazgo que origina el roadmap

Hay **dos sistemas paralelos** de practicar, y solo uno publica:

| | Ritual del pilar (`/pilares/<pilar>`) | Práctica del catálogo (`/practicas` → `/habitos`) |
| --- | --- | --- |
| UI | `HabitChallengePanel` vía `PillarPractice` | `MyPractices` + `PracticeEvidenceForm` |
| Datos | `habit_challenge_progress`, `habit_repetitions` | `practices`, `user_practices` |
| Claves | `mind-one-connection-v1` | `mind-real-presence` |
| Salida social | `habit_celebrations` + `habit_celebration_reactions` (el jardín) | post `kind='practica'` → el feed |

Quien completa el ritual de un pilar no aparece en ningún feed: su avance queda en el jardín y en las
celebraciones, que son un objeto social aparte con su **propia tabla de reacciones**, paralela al
`post_reactions` que el slice 4 de `010` volvió genérico. Comprobado contra la base compartida el
2026-09-07: **0 publicaciones de tipo `practica`** en toda la base (418 producto, 10 anuncio, 2
servicio, 2 evento). El feed nunca ha mostrado una práctica fuera del e2e, que limpia lo suyo.

## Alineación

**Problem.** Practicar el ritual de un pilar —lo más cercano al corazón del producto— no produce
ninguna huella social visible. La persona practica, el jardín lo cuenta en agregado, y el feed sigue
enseñando solo cosas que se venden. Además hay dos modelos de reconocimiento social que hay que
mantener por separado: celebraciones con sus reacciones, y publicaciones con las suyas.

**Savings.** Un solo objeto social que mantener (publicación) en vez de dos; el feed deja de ser un
escaparate comercial y empieza a mostrar acciones sanas reales; y quien practica recibe
reconocimiento donde la comunidad ya mira.

**Why.** Hazlo Sano debe sentirse como una red social de cosas sanas. Si una práctica es una
publicación, el ritual del pilar —la práctica más guiada que ofrece el producto— tiene que serlo
también.

## Modelo acordado

- **Cada práctica completada publica.** Marcar el día del ritual crea la publicación: practicar
  **es** el acto social, no solo el hito. Decisión explícita del producto, que se aparta de la regla
  de `010` (donde el check-in era privado y solo la evidencia publicaba).
- **El ruido se resuelve filtrando, no callando.** Publicar a diario llenaría un home sin filtro,
  pero el destino es que cada quien vea las prácticas de las personas que sigue. Mientras no haya
  suficientes cuentas, todo va al home de todo el mundo y el filtrado llega en el slice 5.
- **Una publicación por persona, práctica y día.** Para el ritual, la práctica es el reto del pilar.
  Para el catálogo es cada práctica: *Penumbra total* y *La descarga mental* el mismo martes son dos
  acciones distintas y dan dos publicaciones, aunque para el jardín sigan contando como un solo día
  de descanso. El slug determinista es lo que lo hace cumplir.
- **La publicación es del tipo `practica`**, la misma que ya reconoce la tarjeta, la ficha y el
  apoyo genérico del slice 4. No nace un tipo nuevo.
- **El pilar del reto decide la categoría** del post (`sueno_y_descanso`, `alimentacion`,
  `movimiento_y_ejercicio`, `mente_y_espiritu`), igual que la evidencia del catálogo.
- **Sin filtro de audiencia por ahora.** Va al home para todo el mundo. El filtrado por
  seguidores/amigos, o por afinidad con lo que la persona suele buscar, es trabajo posterior: hoy no
  hay suficientes cuentas para que un feed filtrado tenga algo que enseñar.
- **La evidencia (foto/video) es opcional en el ritual.** El ritual no pide media hoy y obligarla
  convertiría celebrar en un trámite. La publicación nace con texto derivado del reto y del hito.
- **El vínculo repetición ↔ publicación se deriva del slug**, no de una columna nueva:
  `uq_habit_repetitions_local_cycle` ya garantiza una repetición por (persona, reto, día), así que un
  slug determinista con esos tres datos identifica su publicación sin migrar la base compartida.
- **La promesa de privacidad del panel deja de ser cierta y hay que corregirla.** Hoy dice que el
  ritual es privado hasta que decidas compartir; con esto, marcar el día publica. El aviso se cambia
  en el mismo slice: prometer privacidad y publicar es peor que publicar.

## Slices

### Slice 1 — Completar el ritual crea la publicación en el feed

**Alcance.**

- Al marcar el día del ritual (`intent=complete` en `manageHabitChallenge`), nace una publicación
  `kind='practica'` de esa persona.
- Título y contenido salen del copy del reto; la categoría, de `experience.categoryKey`, que ya
  existe por pilar.
- La publicación aparece en el home como cualquier otra, con su apoyo genérico y sus comentarios.
- Sin media obligatoria, sin precio, sin teléfono, sin carrito ni agenda: se lee como práctica.
- Volver a marcar el mismo día se reconoce como `duplicate` y no publica otra vez.
- El aviso de privacidad del panel se corrige para decir que marcar el día publica.

**Criterios de aceptación.**

1. Quien marca el día de un ritual ve su publicación en el home.
2. La publicación dice de qué pilar y de qué ritual es, y quién la hizo.
3. Volver a marcar el mismo día deja una sola publicación, no dos.
4. La publicación acepta apoyo y comentarios como cualquier otra.
5. El panel ya no promete que el ritual es privado hasta compartir.

### Slice 2 — Practicar publica por los dos caminos, y con portada

**Alcance.**

- Marcar una práctica del catálogo (`markPracticeDone`, que sirve a `/practicas` y a `/habitos`)
  publica igual que marcar el día del ritual.
- **La unidad de publicación es la práctica y el día**, no el pilar y el día: dos prácticas distintas
  del mismo pilar el mismo día dan dos publicaciones. Es la diferencia deliberada con
  `habit_repetitions`, cuya unidad sigue siendo pilar y día para el jardín.
- La deduplicación vive en el slug determinista: si ya existe, no se publica de nuevo.
- Toda publicación de práctica sin evidencia estrena **portada del pilar** —dibujada con los tokens
  del design system, no un archivo— en lugar del recuadro «Publicación sin imagen».

**Criterios de aceptación.**

1. Marcar una práctica desde `/practicas` deja una publicación en el home.
2. Dos prácticas distintas del mismo pilar el mismo día dan dos publicaciones.
3. Marcar dos veces la misma práctica el mismo día deja una sola.
4. Publicar evidencia sigue dando una publicación, no dos.
5. Una práctica sin foto se ve con la portada de su pilar, en tarjeta y en ficha.
6. Un producto sin foto conserva el recuadro de siempre: la portada es solo de prácticas.

### Slice 3 — Evidencia opcional al marcar

**Alcance.**

- Ofrecer foto o video **opcional** al marcar el día, tanto en el panel del ritual como en la
  práctica del catálogo, reutilizando `PostMediaField`.
- Con evidencia, la publicación la usa de portada; sin ella, conserva la del pilar.
- Hoy la foto es obligatoria en el formulario de evidencia de `/habitos`; ese camino se reconcilia
  con este para no tener dos formas de publicar lo mismo.

**Criterios de aceptación.**

- Marcar sin foto sigue publicando, con la portada del pilar.
- Marcar con foto publica esa foto como evidencia.
- No hay dos publicaciones por una misma práctica con evidencia.

### Slice 4 — Poder retirar una publicación de práctica

**Alcance.**

- Quien publicó puede retirar la publicación de un día sin tocar su avance.
- Hoy **no existe ninguna capacidad de borrar ni esconder un post**: hay que crearla, y decidir si es
  borrado real o retirada reversible. Es el hueco más afilado que dejan los slices 1 y 2, porque se
  publica todos los días y por dos caminos.

**Criterios de aceptación.**

- Retirar la publicación la quita del feed.
- El progreso del ritual y el conteo del jardín no cambian al retirarla.

### Slice 5 — Una sola tabla de reacciones

**Alcance.**

- Las reacciones de celebración (`habit_celebration_reactions`) pasan al `post_reactions` genérico.
- El jardín y las celebraciones enseñan el apoyo de la publicación, no un contador propio.
- Requiere migración de datos en `bot-whatsapp` (Alembic), no aquí.

**Criterios de aceptación.**

- Un solo contador de apoyo por celebración, el de su publicación.
- Nadie pierde el apoyo que ya había recibido.

### Slice 6 — El feed empieza a elegir a quién enseñar

**Alcance.**

- Filtrado por seguidores/amigos y/o afinidad con lo que la persona suele buscar.
- Depende de que existan suficientes cuentas y de un modelo de seguimiento.

## Fuera de alcance inicial

- Borrar o migrar las celebraciones existentes.
- Cualquier filtro de audiencia en el home.
- Moderación nueva más allá de la que ya corre para publicaciones.
