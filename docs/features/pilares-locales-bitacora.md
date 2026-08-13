# Bitácora — Cerca de ti: el ritual de cada pilar enlaza con lo local

## Slice 1 — «Cerca de ti» en los cuatro pilares (2026-08-12)

### Objetivo

Que las cuatro páginas de pilar dejen de hablar de lo local en abstracto y muestren, debajo de la
práctica, qué se compra y a quién se le compra cerca — leído de la base y ordenado por cercanía.

### El hallazgo que cambió el tamaño del trabajo

La exploración empezó suponiendo que haría falta modelo nuevo. No: **las cuatro raíces de
`categories` son exactamente los cuatro pilares** (`alimentacion`, `movimiento_y_ejercicio`,
`mente_y_espiritu`, `sueno_y_descanso`), con etiquetas es/en ya sembradas. La taxonomía se diseñó
con los pilares en mente y nadie había cobrado ese diseño. Consecuencia: cero migración, cero modelo
nuevo, y el slice se reduce a mapear pilar → categoría y reusar dos consultas que ya existían.

Se verificó también, contra la base compartida, el estado real que la sección va a encontrarse:

| Categoría raíz | Publicaciones |
|---|---|
| `alimentacion` | 13 `producto` |
| `movimiento_y_ejercicio` | 0 |
| `mente_y_espiritu` | 0 |
| `sueno_y_descanso` | 0 |

Una sola tienda (`Hazlo Sano`) con una sucursal en el ancla. Es lo que convirtió el estado vacío de
caso de borde en la mitad del trabajo.

### Decisiones y por qué

- **El mapeo vive en `HABIT_CHALLENGE_EXPERIENCES`**, no en un registro nuevo. Ya era la tabla por
  pilar que lee `PillarPractice`, y la sección se pinta justo debajo. Tipado como unión cerrada
  (`PillarCategoryKey`) porque **una errata aquí no revienta**: devuelve cero filas, y eso se ve
  idéntico a "todavía no hay nadie registrado cerca", que es el estado legítimo de tres pilares.
- **`queryStores` se generalizó en vez de copiarse.** Añadir `listStoresByCategory` copiando la
  consulta habría sido el segundo bloque casi idéntico que `AGENTS.md` llama fallo de diseño. Ahora
  recibe su fragmento de filtro y el `EXISTS` del directorio de productores salió a
  `producerFilter()`.
- **La sección no filtra por radio, solo ordena por distancia.** El directorio de productores sí
  filtra porque promete proximidad verificada; aquí la promesa es «lo más cercano que hay de este
  pilar» y cada tarjeta enseña su distancia real. Filtrar además por radio habría dejado la sección
  vacía para casi cualquier visitante **mientras las publicaciones del mismo pilar sí salían**
  (`getPostsByCategory` tampoco filtra), y esa incoherencia se lee como un error.
- **Los límites son literales (4 publicaciones, 3 tiendas), no `PAGINATION_PAGE_SIZE`.** Esa
  constante sale del entorno y CI corre sin ningún `.env`: vale 4 allí y 9 en local. Un conteo
  afirmado sobre ella habría fallado siempre en GitHub y nunca en la máquina de quien lo escribió.
- **`data-category` va en la sección, no solo en el enlace de «ver todo».** Ese enlace no existe
  cuando el pilar está vacío —hoy, tres de cuatro—, que es justo donde una errata en el mapeo se
  escondería. Con el atributo, la e2e verifica los cuatro pilares tengan o no contenido.
- **`PILLAR_KEY_BY_CHALLENGE` en `pilaresData`.** El cuarto pilar se llama `mind` en el dominio y
  `mindSpirit` en presentación, y hasta ahora cada página resolvía la equivalencia pasando las dos
  claves a mano. Escrita una vez, un componente que recibe el reto saca su color sin que quien lo
  monte se acuerde de la fila.
- **El envoltorio asíncrono va aparte de la sección que pinta**, como `PillarPractice` /
  `PillarPracticeSection`. El aviso de ubicación entra como nodo ya montado porque lee la ubicación
  por su cuenta. Así `PillarLocalSection` se prueba sin base de datos ni sesión.

### Archivos tocados

**Dominio**
- `src/domain/habits/habitChallengeExperiences.ts` — `PillarCategoryKey` y `categoryKey` en los cuatro.
- `src/domain/habits/habitChallengeExperiences.test.ts` — corrida de escritorio del mapeo.

**Infra**
- `src/infra/dataAccess/sellers/PostgresStoreDirectory.ts` — `listStoresByCategory`, `producerFilter`
  extraído y `queryStores` parametrizado por filtro.

**Ruta y presentación**
- `src/app/[locale]/pilares/pillarLocalData.ts` *(nuevo)*
- `src/app/[locale]/pilares/components/PillarLocal.tsx` *(nuevo, servidor)*
- `src/app/[locale]/pilares/components/PillarLocalSection.tsx` *(nuevo, tonto)*
- `src/app/[locale]/pilares/components/PillarLocalSection.test.tsx` *(nuevo)*
- `src/app/[locale]/pilares/components/pilaresData.ts` — `PILLAR_KEY_BY_CHALLENGE`.
- Las cuatro páginas de pilar montan `<PillarLocal>` tras `<PillarPractice>`.
- `src/i18n/routes.ts` — `categoryHref`.

**Catálogo**
- `src/i18n/messages/{es,en}.json` — namespace `pillarLocal` (22 líneas por catálogo).

**Pruebas ajenas tocadas**
- Los seis tests que renderizan páginas de pilar (`AlimentacionPage`, `MenteEspirituPage`,
  `MovimientoPage`, `SuenoPage`, `PillarBridges`, `PillarPages`) ahora mockean también
  `./PillarLocal`. Ya mockeaban `./PillarPractice` por la misma razón: `next-auth` no resuelve en
  Vitest.

**Documentación y especificación**
- `docs/features/pilares-locales.md`, `src/e2e/pilares/pilaresLocales.feature`,
  `src/e2e/pilares/pilaresLocales.spec.ts`.

### Comandos

```
pnpm run test:run
pnpm run typecheck
pnpm run typecheck:tests
pnpm run lint
pnpm run check:i18n
pnpm run build
```

### Resultados de validación

- `test:run` — **146 archivos, 1460 pruebas en verde**. Antes de mockear `./PillarLocal`, seis
  archivos fallaban al cargar con `ERR_MODULE_NOT_FOUND` sobre `next/server` desde `next-auth`.
- `typecheck` y `typecheck:tests` — limpios.
- `lint` (biome) — limpio tras `format`.
- `check:i18n` — sin texto en español escrito a mano en componentes.
- `build` — compila; las rutas de pilar siguen dinámicas, como ya lo eran.
- `test:e2e:run` — **NO ejecutada. Queda pendiente del usuario**, como en
  `movimiento-vivo-local.md`. Se arrancó `--shard=1/2` por error y se cortó a media corrida; se
  verificó después que la base compartida quedó **sin residuos** (0 tiendas `e2e-%`, 0
  publicaciones, 0 categorías `e2e_%`) y se mataron los procesos huérfanos de Chromium y del
  servidor de desarrollo. **La sección local nunca se ha visto correr contra un navegador.**

### Qué escribirá la e2e en la base compartida cuando se corra

La spec siembra **bajo categorías reales**, no bajo una `e2e_`: lo que se prueba es precisamente que
la raíz que le toca a cada pilar sea la correcta, y una categoría inventada no probaría ese mapeo.
Crea dos tiendas (`E2E Gimnasio del Barrio…`, `E2E Gimnasio Lejano…`) con sus sucursales a 2 km y
120 km del ancla, y dos publicaciones en `movimiento_y_ejercicio`. Todo lleva el prefijo `e2e-` y cae
en el `afterAll` vía `deleteTestSellerByHandle`. Si una corrida muere a mitad, esto lo deshace:

```sql
DELETE FROM posts WHERE seller_id IN (SELECT id FROM sellers WHERE slug LIKE 'e2e-%');
DELETE FROM branches WHERE seller_id IN (SELECT id FROM sellers WHERE slug LIKE 'e2e-%');
DELETE FROM sellers WHERE slug LIKE 'e2e-%';
```

### Desviaciones del roadmap

- El escenario `@component` del `.feature` prometía comprobar el encabezado por idioma. No se puede:
  el envoltorio que resuelve la copia es un componente de servidor asíncrono, y estos tests no los
  renderizan (por eso los seis existentes mockean `PillarPractice`). Se cambió por lo que sí se
  afirma —que cada pilar pinta su sección con su color— y el idioma quedó cubierto por la e2e en
  `/en/pillars/…` y por la paridad que ya impone `typecheck` contra `next-intl.d.ts`.
- El encabezado de la lista de tiendas se bajó a `h3`: dos `h2` seguidos rompían el esquema del
  artículo.

### Recap

Los cuatro pilares muestran ahora, justo debajo de su práctica, una sección «Cerca de ti» que lee de
la base lo publicado en la categoría de ese pilar y las tiendas que hay detrás, ordenado por cercanía
a quien mira y con enlace al catálogo completo. Donde todavía no hay nadie —Movimiento, Mente y
Sueño, hoy a cero publicaciones— la sección lo dice e invita a publicar, y esa invitación es real:
`/publicar` ya ofrece las cuatro raíces y la sub-categoría es opcional. No hizo falta migración
porque la taxonomía de la base ya eran los cuatro pilares; el trabajo fue conectar dos mitades que
llevaban meses sin mirarse.

### Próximos pasos (opciones)

1. **Slice 2 — grupos y profesionales.** Lista curada por pilar, con «propón el tuyo». Es lo único
   que puede llenar hoy los tres pilares vacíos sin esperar a que alguien publique. Ojo con los
   grupos de anonimato: se enlaza a su directorio oficial, nunca por sede.
2. **Sembrar contenido real.** Depende de ti: negocios, entrenadores y terapeutas de la zona con su
   ubicación. Es lo que convierte tres estados vacíos en tres secciones útiles.
3. **Slice 3 — que el negocio declare su pilar.** Hoy se deriva de lo que publica, así que una tienda
   que aún no publica no aparece. Es migración Alembic en el backend Python sobre la base
   compartida; no se toca sin decisión explícita.
4. **La sección en la portada `/pilares`.** Quedó fuera a propósito; se decide si vale la pena tras
   ver cómo se comporta con contenido real.

### Pendiente del usuario

- **Correr la e2e** (`pnpm run test:e2e:run -- --shard=1/2` y `2/2`). Es la única validación que
  falta y la única que ve la sección contra un navegador y contra la base de verdad.
- Decidir cuál de las cuatro opciones sigue.
- La lista de negocios, grupos y profesionales reales por pilar, si se elige la 2.
