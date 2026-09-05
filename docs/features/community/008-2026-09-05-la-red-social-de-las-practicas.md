# La red social de las prácticas

> **Documento de diseño, no roadmap aprobado.** Responde a tres preguntas del usuario (2026-09-05) y
> deja el análisis escrito para implementarlo en otra sesión. Nada de esto está construido.
>
> Depende de `docs/features/wellbeing/027-2026-09-04-base-de-datos-de-practicas.md`, que sí está
> entregado: las 45 prácticas, sus 131 estudios, `user_practices` y el conteo por pilar y día.

## Las tres preguntas

1. ¿Los avances del jardín y de cada integrante van en el inicio o en los pilares?
2. ¿Cómo se buscan miembros para ver su perfil?
3. ¿El perfil debería enseñar sus prácticas y sus avances en los cuatro pilares?

## Lo que ya existe, y que nadie debería reconstruir

Media red social está construida y desconectada de sí misma.

| Pieza | Estado |
|---|---|
| `follows` persona→persona | **Existe** (Alembic 0031), con sus únicos parciales y su CHECK |
| `FollowButton` y `FollowerCount` | **Existen**, y ya están en el perfil |
| `/u/[username]` | **Existe**: cabecera + publicaciones. Nada de prácticas |
| Jardín comunitario | **Existe** en `/pilares`: canteros por pilar, total y pulso semanal |
| Celebraciones públicas | **Existen** en `/pilares`, con reacciones |
| Tabla de aportes al jardín | **Existe**, con alias, aportes y semanas sostenidas |
| `user_practices.sharing_enabled` | **Existe, y no lo lee nadie todavía** |
| Búsqueda | Sólo publicaciones, con facetas por pilar. **No busca personas** |
| Inicio | Héroe + feed de publicaciones. **No menciona la comunidad** |

## La escala real, que es lo que decide el orden

Medido el 2026-09-05:

| | |
|---|---|
| Usuarios | 21 |
| Con alias público | **2** |
| Con alguna repetición | 3 |
| Compartiendo su jardín | 7 |
| En la tabla del jardín | 1 |
| Celebraciones públicas | 8 |
| **Siguiendo a una persona** | **0** |
| Prácticas adoptadas | 1 |

**Ningún usuario sigue a otro, y hay dos alias.** Cualquier función que presuponga una red —un
buscador de miembros, un muro de actividad, sugerencias de a quién seguir— hoy devuelve una pantalla
vacía, y una pantalla vacía no es neutra: enseña que aquí no hay nadie.

## La columna vertebral: privado por omisión

Es la decisión que atraviesa todo lo ya construido y **cualquier función social nueva tiene que
respetarla**, no esquivarla:

- `habit_challenge_progress.garden_sharing_enabled` — nace en `false`
- `habit_league_opt_ins` — aparecer en la tabla es un alta explícita
- `habit_celebrations` — sólo existen si alguien acepta publicar el hito
- `user_practices.sharing_enabled` — nace en `false`
- La tabla del jardín exige alias, y **exige 10 participantes** antes de pintarse

Un directorio de miembros con sus prácticas a la vista invierte eso si no se apoya en esas
banderas. `sharing_enabled` existe precisamente para esto y hoy no lo lee nadie: **es la puerta que
ya está puesta y falta abrir.**

---

## Respuesta 1 — Pilares, no inicio (y el usuario ya lo intuyó)

**El jardín se queda donde está.** Razones, en orden de peso:

1. **Ya está ahí.** Duplicarlo en el inicio son dos sitios enseñando el mismo número, y se
   desincronizan: uno se actualiza y el otro no, o cuentan ventanas distintas. Es exactamente el
   fallo que hubo que arreglar cuando la liga anclaba su lunes en UTC y la práctica en México.
2. **El inicio tiene otro trabajo.** Es el catálogo y la economía local — lo que trae gente desde
   buscadores y lo que sostiene a quien vende. Meterle el jardín le quita sitio a eso para repetir
   algo que está a un clic.
3. **Los pilares ya son el hub de práctica.** La portada de `/pilares` abre y cierra invitando a
   elegir una práctica; el jardín y las celebraciones viven ahí porque ahí tienen sentido.

**Lo que sí haría en el inicio: una línea, no una sección.** Un teaser de una frase con el pulso
semanal —«esta semana N personas practicaron»— enlazando a `/pilares`. Es descubrimiento sin
duplicar: quien no sabe que existe la parte de práctica se entera, y quien la conoce va directo.

**Lo que no haría:** llevar al inicio los avances *de cada integrante*. El inicio lo ve todo el
mundo, incluido quien llega de un buscador, y ahí un listado de personas con su progreso de salud es
otra cosa distinta a una comunidad — es un escaparate de gente.

---

## Respuesta 2 — Buscar miembros: sí, pero es la tercera pieza, no la primera

Con **dos alias y cero seguimientos**, un buscador de miembros devuelve nada y enseña que no hay
nadie. El orden que propongo invierte el problema:

**Primero, que el perfil valga la pena visitarse** (respuesta 3). Hoy un perfil son publicaciones; si
alguien llega, no hay motivo para volver.

**Segundo, que los nombres que ya se ven sean puertas.** Esto es casi gratis y es el descubrimiento
que de verdad funciona a esta escala: el alias de la tabla del jardín, el de una celebración y el de
un comentario deberían **enlazar al perfil**. Nadie busca a alguien que no sabe que existe; se
encuentra a la gente por lo que hizo, no por su nombre.

**Tercero, y sólo entonces, un directorio.** Y probablemente **directorio, no buscador**: con 30
miembros se navega, no se busca. Un `/comunidad` con las personas que aceptaron aparecer, ordenadas
por semanas sostenidas o por actividad reciente, resuelve el mismo problema sin una caja de texto
que casi siempre se usa vacía.

**Si aun así se quiere buscador**, lo natural es una faceta en `/buscar` —que ya tiene facetas por
pilar— y no una ruta nueva. Y sólo debería encontrar a quien aceptó aparecer: buscar por nombre a
alguien que no eligió ser público es lo contrario de la columna vertebral.

---

## Respuesta 3 — El perfil practica: esto es lo que yo haría primero

Es la respuesta más fuerte de las tres. Convierte el perfil en algo que vale la pena visitar, le da
sentido a `sharing_enabled`, y no necesita **ninguna tabla nueva**.

### Qué enseñaría

- **Las prácticas que esa persona lleva** y decidió compartir (`user_practices.sharing_enabled`),
  con el nombre y el ancla, agrupadas por pilar y con el color del pilar.
- **Las semanas sostenidas por pilar**, que salen de `habit_repetitions` y de `countSustainedWeeks`.
- **Desde cuándo** practica cada una (`started_at`), que ya se conserva aunque la haya dejado y
  vuelto.

### La trampa que hay que evitar

**Semanas sostenidas sí; nivel, puntos o ranking personal, no.** El proyecto ya escribió que los
niveles «representan práctica acumulada, **no superioridad personal**», y un perfil público con un
marcador comparable convierte cada visita en una comparación. `countSustainedWeeks` es la métrica
correcta y no es accidental que **nunca baje**: premia volver, que es lo que este producto quiere
premiar por encima de todo.

Por la misma razón, el perfil debería enseñar **qué practica y desde cuándo**, no *cuánto* frente a
otros.

### Lo que hace falta

- Leer `user_practices` filtrando por `sharing_enabled` — el campo está, la consulta no.
- Un control en `/practicas` o en `/habitos` para decidir qué se comparte. Hoy `sharing_enabled` no
  se puede cambiar desde ninguna pantalla: **nace en `false` y ahí se queda**.
- Nada más. Ni migración, ni modelo.

---

## Orden propuesto

| | Slice | Depende de | Por qué en este sitio |
|---|---|---|---|
| A | **El perfil practica** | nada | Hace que exista algo que visitar |
| B | **Decidir qué comparto** | A | `sharing_enabled` sin control es una bandera muerta |
| C | **Los nombres son puertas** | A | Descubrimiento real a esta escala, y cuesta poco |
| D | **El pulso en el inicio** | nada | Una línea; que se sepa que la parte de práctica existe |
| E | **Directorio de comunidad** | A, B, C | Cuando haya gente y hayan elegido aparecer |
| F | **Faceta de personas en la búsqueda** | E | Sólo si el directorio se queda corto |

A y B son un solo entregable en la práctica: enseñar lo compartido sin poder elegir qué compartir no
tiene sentido, y poder elegirlo sin que se vea en ningún sitio, tampoco.

## Preguntas abiertas para quien lo implemente

1. **¿`sharing_enabled` es por práctica o una sola decisión?** La columna es por práctica, que es más
   fino y más trabajo de interfaz. Una sola bandera «mi perfil enseña lo que practico» sería más
   simple de entender y de explicar. La tabla admite las dos; hay que decidirlo.
2. **¿El perfil enseña los cuatro pilares aunque en tres no haya nada?** Enseñar los cuatro con tres
   vacíos dice «te falta»; enseñar sólo los que tienen algo dice «esto es lo tuyo». Lo segundo encaja
   mejor con «elige una práctica», pero lo primero comunica que son cuatro.
3. **¿Seguir a alguien hace algo?** Hoy `follows` existe, el botón está, y **nadie sigue a nadie**.
   Antes de empujar el seguimiento habría que decidir qué produce: ¿un feed?, ¿un aviso cuando
   alguien vuelve tras faltar? Un botón que no cambia nada es peor que no tenerlo.
4. **¿Qué ve quien no ha entrado?** El catálogo de prácticas es público a propósito. ¿Los perfiles
   también? Es una decisión de privacidad, no de producto.
