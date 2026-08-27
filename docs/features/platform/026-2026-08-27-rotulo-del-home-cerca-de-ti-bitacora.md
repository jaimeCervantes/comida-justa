# Bitácora — El rótulo del home habla de quien mira

## Slice 1 — De un lugar fijo a una distancia real (2026-08-27)

### Lo que se reportó

El usuario lo notó abriendo `/`: el rótulo decía «Tezonapa, Veracruz · 426 publicaciones» a todo el
mundo, y eso debería ser el lugar y las publicaciones **de donde mira quien mira**.

### El diagnóstico: mentía por partida doble

| Mitad | Qué era |
| --- | --- |
| «Tezonapa, Veracruz» | Un **literal escrito a mano dentro del mensaje traducible** (`home.heroEyebrow`). No salía del ancla de la comunidad ni de ningún dato. |
| «426 publicaciones» | El total **global**. El home no filtra por cercanía —está escrito como contrato: «lo que esa página promete es lo último que publicó la comunidad»—, solo añade la distancia a cada tarjeta. |

O sea: ni el lugar ni la cifra tenían que ver con quien miraba.

### Lo que no se pudo hacer, y por qué

La idea completa —lugar de quien mira, con fallback al pueblo más cercano y Tezonapa como último
recurso— pide dos cosas que **no existen en este repo**:

- **Nombre de lugar desde coordenadas.** No hay geocodificador ni clave de API.
  `GoogleMapsUrlResolver` solo expande URLs cortas de Maps.
- **Una lista de pueblos con nombre y coordenadas** para resolver «el más cercano». No hay tabla.
  Lo único parecido es `branches.address`, texto libre: de las dos sucursales, una dice
  «…Tezonapa, Veracruz, México» y la otra «A 3 km del centro de la comunidad (PRUEBA)». Parsear un
  pueblo de ahí es adivinar.

Acordado con el usuario: **empezar por distancia, sin nombre de lugar.** Se puede hoy, sin infra
nueva ni dependencia externa, y no promete precisión que no tenemos.

### El riesgo que decidió el fallback

Hoy **todo** lo publicado está en Tezonapa (comprobado: 426 de 426 dentro de 50 km del ancla). Un
rótulo que dijera «Córdoba · 0 publicaciones» le anunciaría a quien mira desde otro estado que el
sitio está vacío —mientras el feed de abajo le enseña 426—. Así que el cero no se pinta: cuando no
hay nada cerca se vuelve al rótulo de la comunidad, que es cierto y dice de dónde es lo que ve. Es
el «último fallback lo de Tezonapa» que pedía el usuario, activado también por «cerca hay cero».

Las tres caras, comprobadas contra la base real:

| Estado | Rótulo |
| --- | --- |
| Sin ubicación compartida | `Tezonapa, Veracruz · 426 publicaciones` |
| Ubicación a ~8 km | `426 publicaciones cerca · la más cercana a 8 km` |
| Ubicación en CDMX (nada en 50 km) | `Tezonapa, Veracruz · 426 publicaciones` |

### La distancia real, no el límite

La primera versión decía «a menos de 50 km de ti». El usuario lo corrigió sobre la marcha: los
50 km son el límite del radio —un número del sistema— y lo que le sirve a quien mira es **a qué
distancia está lo más cercano**. `summarizeNearby` devuelve las dos cifras en la misma consulta, y
no en dos, porque preguntarlas por separado abriría la puerta a que una diga «hay 8» y la otra mida
contra una novena que entró entre las dos.

El texto lo compone `describeDistance`, el mismo del dominio que ya usa cada tarjeta: decide metros
o kilómetros según el caso —«a 420 m», no «a 0.4 km»— y redondea, porque «1.4832 km» no ayuda a
decidir a nadie y fingir precisión sobre una coordenada de navegador es fingir dos veces. Las frases
salen de `distance.meters`/`distance.kilometers`, que ya existían: el rótulo dice «a 8 km» igual que
lo dice una tienda, sin estrenar una segunda forma de escribir lo mismo.

### El contador es una pregunta aparte, no un total torcido

`summarizeNearby` es un método nuevo del repositorio, no el `total` de un listado. El home sigue siendo
cronológico y sin filtrar: lo que cambia es que ahora se le hace **otra** pregunta —«cuánto de esto
me queda cerca»— en vez de torcer el listado para que su total sirva de dos cosas. Acordado con el
usuario que el rótulo puede hablar de cercanía mientras el feed lista lo último; son dos preguntas
distintas y cada una se responde donde toca.

Dos decisiones del SQL que no son de estilo:

- **Una distancia por publicación, no una por sucursal**: la subconsulta devuelve el `MIN` de sus
  sucursales, así que una tienda con tres cerca cuenta una publicación. Con un `JOIN` a `branches`
  la cifra se multiplicaría por sucursal.
- **`ST_DWithin` filtra y `ST_Distance` mide, en ese orden**: el primero usa el índice espacial de
  `branches.location` para descartar lo lejano sin medirlo, y solo lo que sobrevive paga el cálculo
  exacto que necesita el `MIN`.

La condición de visibilidad es `PUBLISHED_POSTS`, la misma de las otras nueve consultas —
`assertEveryPostQueryFilters` lo exige, así que olvidarla habría roto una prueba en vez de enseñar
lo que un admin bajó.

### `nearby` es requerida, a propósito

Podría ser opcional y ahorrarme tocar los tests. Se dejó requerida para que cada sitio que monte la
portada **diga** si sabe dónde está quien mira: es la prop que decide qué rótulo se pinta, y un
`undefined` por descuido volvería al rótulo viejo en silencio.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Repositorio | `IPostQueryRepository.ts` (+`summarizeNearby`, +`NearbySummary`), `PostgresPostQueryRepository.ts` |
| Ruta | `src/app/[locale]/page.tsx` (pregunta la cifra solo con ubicación) |
| Presentación | `src/app/(home)/HomeHero.tsx` (+ test) |
| Catálogo | `es.json`, `en.json`: `home.heroEyebrowNearby` |

### Comandos y resultados

```
pnpm run validate     # biome + typecheck + typecheck:tests + 2425/2425 en verde
pnpm run check:i18n   # limpio
```

Verificado además contra la base real, que es lo único que las pruebas no cubren: `summarizeNearby`
devuelve 426 desde Tezonapa, 426 con «la más cercana a 8 km» desde 11 km al norte, y 0 sin distancia desde CDMX. Y a ojo en `next dev`, los
tres estados de la tabla de arriba.

### Recap

El rótulo del home dejó de afirmar un lugar fijo y una cifra global. Con ubicación compartida dice
cuánto de lo publicado queda dentro de 50 km y a qué distancia está lo más cercano; sin ella —o sin nada cerca— nombra la
comunidad de la que es lo que se está enseñando. No se inventó un nombre de pueblo que este repo no
tiene forma de saber.

### Próximos pasos (opciones)

1. **Nombre real del lugar**, si algún día se quiere: pide un geocodificador (Nominatim gratis con
   sus límites de uso, o Google de pago) y decidir dónde se cachea. Hoy no compensa: con todo el
   contenido en un solo pueblo, el nombre no añade información que la distancia no dé.
2. **Cuando haya contenido en más de un pueblo**, volver a mirar el fallback: «nada cerca» dejará de
   significar «estás lejos de Tezonapa» y empezará a significar algo más útil.
3. **Cola offline optimista** — sigue pendiente de su conversación de alcance.
