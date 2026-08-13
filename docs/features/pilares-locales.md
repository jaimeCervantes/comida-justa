# Cerca de ti: el ritual de cada pilar enlaza con lo local

Roadmap para que las cuatro páginas de pilar dejen de hablar de lo local **en abstracto** y muestren
a quién de la zona se le puede comprar o con quién se puede ir, leído de la base y ordenado por
cercanía. La bitácora vive en `docs/features/pilares-locales-bitacora.md`.

## Alineación

- **Problem:** los cuatro pilares ya dicen que lo local importa —`cena-real-local` habla del mercado
  y del Km 0, `movimiento-vivo-local` del gimnasio de barrio y la cancha, `presencia-paz-local` del
  encuentro cercano— pero **ese texto no enlaza con nadie**. El sitio tiene tiendas, sucursales
  ubicadas, publicaciones categorizadas y distancias PostGIS ya calculadas, y la pantalla donde se
  pide la acción no los menciona. Quien termina de leer su ritual y quiere actuar tiene que salir a
  buscar por su cuenta en `/productos` o `/negocios-locales`, adivinando qué de todo eso pertenece al
  pilar que acaba de leer.
- **Savings:** el puente ya está pagado por los dos lados y solo falta el tramo de en medio. La
  taxonomía de la base **ya son los cuatro pilares**, así que no hay migración, no hay modelo nuevo
  y no hay consulta nueva de fondo: es mapear pilar → categoría y reusar `getPostsByCategory` y el
  directorio de tiendas, que ya ordenan por cercanía y ya conocen el radio sostenible de 50 km. Para
  quien lee, ahorra la búsqueda entera; para quien vende, convierte cuatro páginas de mucho tráfico
  editorial en la puerta de entrada a su tienda.
- **Why:** los pilares dicen **qué** hacer y `secciones-comunidad.md` dice **quién** está cerca.
  Nunca se habían mirado. Esta es la pieza que convierte a Hazlo Sano de un sitio que explica hábitos
  en uno donde el hábito se practica con la gente del pueblo — y es también lo que le da sentido a
  publicar: hoy los tres pilares que no son Alimentación no tienen una sola publicación, y nadie
  tiene motivo para ser el primero porque no hay dónde aparecer.

## Modelo acordado

- **La taxonomía ya son los cuatro pilares.** Las raíces de `categories` son `alimentacion`,
  `movimiento_y_ejercicio`, `mente_y_espiritu` y `sueno_y_descanso`, con etiquetas es/en en
  `category_translations`. **Cero migración.**
- **El mapeo vive en `HABIT_CHALLENGE_EXPERIENCES`**, que ya es la tabla por pilar que lee
  `PillarPractice`. No se abre un quinto registro; `PILLARS` sigue siendo la estructura editorial.
- **Se muestran publicaciones y tiendas de la base**, no listas curadas a mano. Lo curado ya existe
  y es otra cosa: los catálogos de `PillarCatalog` dicen *qué* comprar, esta sección dice *a quién*.
- **El estado vacío es la mitad del trabajo, no un caso de borde.** Hoy `alimentacion` tiene 13
  publicaciones y los otros tres pilares **cero**. Se aplica el criterio que ya usaron los dos
  directorios en su slice 1: texto arriba, lista debajo, y mientras esté vacía invita a publicar.
  Está verificado que la invitación no es un callejón sin salida — `/publicar` ofrece las cuatro
  raíces y `subCategory` es opcional, así que un gimnasio puede publicarse bajo
  `movimiento_y_ejercicio` hoy mismo.
- **Los límites son literales, nunca `PAGINATION_PAGE_SIZE`.** CI corre sin ningún `.env`, así que
  esa constante vale 4 allí y 9 en local; un bloque que la usara daría conteos distintos en cada
  sitio y su e2e fallaría siempre en GitHub y nunca en la máquina de quien lo escribió.
- **Grupos y profesionales no entran todavía.** Un grupo de corredores, un psicólogo o un grupo de
  apoyo no son `sellers` ni `posts`, y `secciones-comunidad.md` ya decidió que empiezan como lista a
  mano. Van en el slice 2.

## Roadmap

### Slice 1 — «Cerca de ti» en los cuatro pilares

**Alcance**

- `categoryKey` en `HABIT_CHALLENGE_EXPERIENCES`, tipado como unión cerrada.
- `listStoresByCategory` en `PostgresStoreDirectory`, **generalizando `queryStores`** para que reciba
  su fragmento de filtro en vez de copiar la consulta.
- `pillarLocalData.ts` en la ruta de pilares: taxonomía → subárbol → publicaciones + tiendas +
  contexto de ubicación, memorizado con `cache()`.
- `PillarLocalSection.tsx`, montada en las cuatro páginas después de `<PillarPractice />`.
- Namespace `pillarLocal` en `es.json` y `en.json`, con intro por pilar.

**Criterios de aceptación**

- `/pilares/alimentacion` muestra publicaciones reales de su categoría con su distancia, la tienda
  detrás de ellas y un enlace a `/categoria/alimentacion`.
- Los tres pilares sin contenido muestran el estado vacío con la invitación a publicar; ninguno
  esconde la sección ni pinta una lista hueca.
- El orden es por cercanía a quien mira; sin ubicación conocida, desde el ancla de la comunidad.
- `/en/pillars/…` dice lo mismo en inglés y los dos catálogos conservan paridad estructural.
- El ritual, el progreso, los puntos y las celebraciones no cambian en nada.

### Slice 2 — Grupos y profesionales de la zona

**Alcance**

- Lista curada por pilar en datos (como `PILLARS` y `references.ts`), con «propón el tuyo».
- Grupos de caminata y corredores, entrenadores, terapeutas, grupos de apoyo.

**Criterios de aceptación**

- Cada pilar ofrece al menos una forma de acompañamiento aunque no haya negocios registrados.
- **Los grupos de anonimato no se listan por sede.** Publicar un punto de reunión con dirección
  choca con el anonimato que los define: se enlaza al directorio oficial de cada agrupación.

### Slice 3 — El negocio declara su pilar

**Alcance**

- Hoy el pilar de una tienda se deriva de lo que publica; una que aún no publica no aparece en
  ninguna parte. Darle un campo propio es **migración Alembic en el backend Python** sobre la base
  compartida, así que no se hace sin decisión explícita.

## Validación

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm run build`
- `pnpm run test:e2e:run` — **la corre el usuario**, no esta entrega. En dos mitades
  (`--shard=1/2`, `--shard=2/2`): de una sola vez agota la RAM y Chromium deja de arrancar
  (`code=3221225794`). La suite siembra bajo categorías reales y limpia en su `afterAll`.
