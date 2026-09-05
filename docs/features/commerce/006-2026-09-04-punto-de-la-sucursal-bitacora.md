# Bitácora — El punto de una sucursal se puede comprobar

## Slice 1 — Comprueba el punto guardado (2026-09-05)

### Objetivo

Que el dueño de una tienda pueda ver **el punto que la base tiene guardado** de cada sucursal, que
es el que decide si aparece en las búsquedas por cercanía, y que hasta ahora no se enseñaba en
ninguna pantalla del sitio.

### El diagnóstico

`parseCoordinatesFromMapUrl` prueba dos patrones en orden de confianza: `!3d…!4d…` es **el pin del
lugar** y `@…` es **el centro del mapa** que se tenía en pantalla al copiar. Cuando el enlace pegado
solo trae el segundo, se guarda el encuadre, no el negocio — pueden ser cientos de metros.

Y lo que lo volvía invisible: `BranchList` enlazaba a `branch.mapUrl`, la dirección que el vendedor
pegó. Pulsa «Ver en el mapa», ve su propio enlace, le parece bien, y **nunca ve el punto guardado**.

### Una corrección al encuadre, hecha a mitad de camino

La primera versión del roadmap decía que detectar cuál coordenada vino del centro del mapa exigiría
una columna nueva y por tanto una migración. **Es falso, y lo señaló el usuario**: `branches.map_url`
es un `varchar` **persistido**, así que la procedencia se recupera releyéndolo y comparándola contra
`branches.location` (`geography`) con `metersBetween`, que ya existe. Cero columnas nuevas. El
documento quedó corregido.

Lo que sí dejó el aviso fuera de este slice fueron **los datos**. Se miraron en solo lectura las dos
únicas sucursales de la base:

| Sucursal | `map_url` | ¿Relegible sin red? |
| --- | --- | --- |
| `hazlo-sano` / Restaurante Hazlo Sano | `https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6` | **no**, enlace corto |
| `panaderia-de-prueba` / Sucursal | `https://maps.google.com/?q=18.62749086091033,…` | sí, patrón `q=` |

La única escrita por una persona guarda un enlace corto —justo el que la gente pega, como dice el
docstring de `coordinates.ts`— y no lleva coordenadas dentro: compararla exigiría expandirla por
red, o sea un salto de red por render. Así que hoy el aviso cubriría una fila sembrada y ninguna
real. Se enseña el punto primero.

*(De paso: `panaderia-de-prueba` parece resto de pruebas antiguas. No lleva prefijo `e2e-`, así que
el barrido no la toca. No se hizo nada con ella.)*

### Decisiones, y por qué

**1. `mapPointUrl` vive en `coordinates.ts`, junto a su reverso.** Una lee coordenadas de una
dirección, la otra escribe una dirección desde coordenadas; y ese archivo ya es el que conoce el
formato de Google. Hay una prueba que afirma exactamente eso: **lo que escribe, `parseCoordinates
FromMapUrl` lo vuelve a leer igual**.

**2. Devuelve `null` con coordenadas que no valen**, en vez de una dirección que lleva al Golfo de
Guinea. Enseñar `0,0` como «tu punto» sería mentir con seis decimales de precisión.

**3. `?q=lat,lng` y no `?ll=` ni `/@`.** Es la forma que Google documenta para «enseña este punto»,
la que entienden también las aplicaciones de móvil, y la única que deja caer un pin en un sitio sin
nombre — que es justo el caso que se quiere ver cuando el punto está mal.

**4. El enlace es solo para el dueño.** `BranchList` lo pinta cuando quien la monta pasa el rótulo,
igual que ya hacía con `emptyMessage`. La página pública no lo pasa: a un visitante no le sirve
saber dónde cree la base que está la tienda, y el enlace pegado suele llevarle a la ficha del
negocio con su nombre, que es mejor destino para él.

**5. El e2e compara contra PostGIS, no contra una cadena.** `readBranchesByHandle` lee la latitud y
la longitud reales y el escenario arma con ellas el `href` esperado. Es lo que hace que diga algo:
si la lista armara el enlace con el `map_url` pegado —que es lo que hacía antes— las coordenadas no
coincidirían y la prueba lo cazaría. Afirmar una URL literal pasaría igual con el enlace equivocado.

### Lo que la propia suite encontró

El primer intento del escenario del visitante rompió en modo estricto: `getByText("Sucursal
Centro")` encontraba dos nodos porque `seedBranch` repite el nombre dentro de la dirección. Se acotó
al renglón (`branch-item`), que es lo que la guía del repo prefiere sobre un `exact: true` que
alguien olvida.

### Archivos tocados

**Dominio**
- `domain/entities/seller/coordinates.ts`: `mapPointUrl` + `.test.ts`

**Presentación compartida**
- `presentation/directory/BranchList/BranchList.tsx`: prop `checkPointLabel` y el enlace + `.test.tsx`

**Ruta `/cuenta`**
- `ui/BranchesCard.tsx`: pasa el rótulo

**Catálogos**
- `account.branchCheckPoint` en `es` y `en`

**Pruebas y documentación**
- `e2e/sellerStore/puntoDeLaSucursal.spec.ts` (nuevo)
- `e2e/sellerStore/cuentaConfigurable.feature`: tres escenarios `@punto-sucursal`
- `docs/features/commerce/006-2026-09-04-punto-de-la-sucursal.md` (nuevo)
- `AGENTS.md` y el skill: la regla de shards, afinada dos veces (ver abajo)

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **2716/2716** en 249 archivos |
| `pnpm run typecheck` y `typecheck:tests` | limpios |
| `pnpm run lint` | limpio |
| `playwright src/e2e/sellerStore/puntoDeLaSucursal.spec.ts` | **3/3** |
| `playwright src/e2e/{sellerStore,compartir}` **en 5 tramos** | **79/79** (16+16+16+16+15) |

**Escrito en la base compartida**: tiendas, sucursales, direcciones personales y publicaciones con
prefijo `e2e-`, borradas por los `afterEach` y por el barrido. Se auditó la base en solo lectura dos
veces durante esta entrega: `hazlo-sano` intacta con sus 432 publicaciones, cero residuo `e2e-`.

### Dos lecciones de operación que costaron horas

**1. El número de tramos sale del recuento, no es fijo.** Tres tramos bastaban con 73 escenarios y
se pasaron del límite con 79 —cada tramo paga además ~40 s de arranque que no se reparten—. La regla
pasa a ser: contar con `--list` y dividir para ~15 por tramo.

**2. Hay que borrar `.next` antes de cada tramo.** Dos servidores de desarrollo consecutivos
compartiendo esa carpeta la dejan a medias, y **el síntoma engaña**: rutas que existen —`/cuenta`,
`/u/<username>`, `/tienda/<handle>`— empiezan a responder 404 cayendo al catch-all `[slug]`, y la
prueba informa «no encuentro tal elemento» cuando lo que pasa es que la página no se compiló. Se
diagnosticó como fallo del código **tres veces** antes de aislarlo. La comprobación fue limpia: el
primer tramo tras limpiar pasa siempre y el siguiente cae; limpiando antes de cada uno, 79/79.

Las dos quedan escritas en `AGENTS.md` y en el skill.

*(Aparte: una corrida se quedó colgada 21,8 h porque la máquina durmió con ella abierta. Su
resultado no se tomó por válido.)*

### Recap

Cada sucursal ofrece ahora a su dueño dos enlaces distintos a propósito: «Ver en el mapa» abre lo
que él pegó, y «Comprueba el punto guardado» abre lo que la base tiene —armado desde `coordinates`,
no desde el `map_url`—. Que coincidan o no es precisamente lo que se viene a comprobar, y hasta hoy
solo se veía el primero, que siempre parece correcto porque es el suyo. La función que lo arma vive
junto a la que lee, con una prueba que afirma que una es el reverso de la otra. El aviso automático
de «esto vino del centro del mapa» se dejó fuera con el motivo escrito: es posible sin migración
—como se señaló y se corrigió— pero hoy no alcanzaría a ninguna fila escrita por una persona.

### Próximos pasos (opciones)

1. **Rellenar los enlaces cortos guardados.** Un script de una vez que expanda los
   `maps.app.goo.gl` y escriba el enlace largo en `map_url`. Eso haría releíbles todas las filas y
   desbloquearía el aviso automático del punto 2. **Es una escritura sobre datos reales de la base
   compartida**, así que no se hace sin confirmación explícita.
2. **Avisar cuando el punto guardado y el del enlace disten mucho.** Una vez existan enlaces largos
   que comparar. Sin migración: `parseCoordinatesFromMapUrl` + `metersBetween`, las dos ya escritas.
3. **Traducir los textos de reserva de `ImageVideoUploader`.** Sigue con `⏳ Subiendo...` en duro
   para los dos llamadores que no le pasan los suyos.
4. **Mirar `/pedidos` y `/cuenta/agenda`** con los mismos ojos que `/cuenta`: son las otras dos
   pantallas de la sección y no se han tocado.

**Pendiente de tu lado**: elegir. La rama es `feat/punto-de-la-sucursal`, sin empujar.
