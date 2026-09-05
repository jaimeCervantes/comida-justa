# El punto de una sucursal se puede comprobar

## Contexto

- **Problema**: el punto que se guardó de una sucursal puede no ser el negocio, y **no hay ninguna
  pantalla donde verlo**. Lo único que se enseña es el enlace que el vendedor pegó, que siempre le
  parece correcto porque es el suyo.
- **Ahorro**: tiendas que creen estar en el mapa y no aparecen en las búsquedas por cercanía del
  chatbot. Es oferta real que el catálogo pierde en silencio, y soporte imposible de diagnosticar
  —«sí aparezco, mira mi enlace»—.
- **Por qué**: la cercanía es el argumento central de la plataforma. Un punto mal puesto no falla
  ruidosamente: falla **no apareciendo**.

## El diagnóstico

`parseCoordinatesFromMapUrl` prueba dos patrones **en orden de confianza**, y su docstring dice por
qué:

| Patrón | Qué es | Riesgo |
| --- | --- | --- |
| `!3d<lat>!4d<lng>` | el **pin del lugar** | ninguno |
| `@<lat>,<lng>` | el **centro del mapa** que se tenía en pantalla al copiar | puede estar a cientos de metros del negocio |

> «Cuando alguien busca su negocio y arrastra un poco el mapa antes de copiar, los dos difieren, y
> el que sirve para que lo encuentren es el pin.» — `coordinates.ts`

Cuando el enlace pegado solo trae `@`, se guarda el encuadre. Y aquí está lo que lo vuelve
invisible: **`BranchList` enlaza a `branch.mapUrl`**, la dirección que el vendedor pegó. Pulsa «Ver
en el mapa», ve su propio enlace, le parece bien — y nunca ve el punto que se guardó. Lo que decide
si aparece en las búsquedas por cercanía es `branches.location` (`ST_DWithin` en
`search_posts_semantic`), y eso no se enseña en ninguna pantalla del sitio.

## Lo que NO se hace, y por qué

- **No se detecta cuál vino del centro del mapa** — pero **no por falta de datos**, y conviene
  dejarlo escrito porque la primera versión de este documento se equivocó al decir que hacía falta
  una migración. No hace falta: `branches.map_url` es un `varchar` **persistido**, así que la
  procedencia se recupera releyéndolo con `parseCoordinatesFromMapUrl` y comparándola contra
  `branches.location` (`geography`) con `metersBetween`, que ya existe en `locationFreshness.ts`.
  Cero columnas nuevas.

  Lo que lo deja fuera de este slice son **los datos reales**. Se miraron las dos únicas sucursales
  de la base:

  | Sucursal | `map_url` | ¿Relegible sin red? |
  | --- | --- | --- |
  | `hazlo-sano` / Restaurante Hazlo Sano | `https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6` | **no**, enlace corto |
  | `panaderia-de-prueba` / Sucursal | `https://maps.google.com/?q=18.62749086091033,…` | sí, patrón `q=` |

  La única escrita por una persona guarda un **enlace corto**, que es justo el que la gente pega
  —lo dice el docstring de `coordinates.ts`— y que no lleva coordenadas dentro: compararla exigiría
  expandirla por red, o sea un salto de red por render. Así que hoy el aviso automático cubriría
  una fila sembrada y ninguna real. Se enseña el punto primero; el aviso se decide cuando haya
  enlaces largos que comparar.
- **No se dibuja un mini-mapa.** Existe `StoresMapCanvas` y sería reutilizable, pero a poco zoom un
  error de 200 m no se distingue: sería un mapa que tranquiliza sin comprobar nada. Abrir el punto
  exacto en Google Maps sí lo delata.
- **No se toca el alta.** Lo que resuelve las coordenadas ya está bien y tiene sus pruebas; lo que
  falta es poder **verlas después**.

## Slice 1 — Comprueba el punto guardado

**Alcance.** Cada sucursal ofrece a su dueño un enlace al punto que la base tiene guardado,
construido con **las coordenadas**, no con el enlace pegado.

- `mapPointUrl(coordinates)` en `coordinates.ts`: función pura que arma
  `https://www.google.com/maps?q=<lat>,<lng>`. Vive junto a `parseCoordinatesFromMapUrl` porque es
  su reverso —una lee coordenadas de una dirección, la otra escribe una dirección desde
  coordenadas— y ese archivo ya conoce el formato de Google.
- `BranchList` lo pinta **solo cuando quien monta la lista lo pide**, igual que hacía el
  `emptyMessage`: es una herramienta de comprobación para quien administra la tienda. A un visitante
  no le sirve de nada, y además el enlace pegado suele llevarle a la ficha del negocio con su
  nombre, que es mejor destino para él.

**Criterios de aceptación**

1. En `/cuenta`, cada sucursal ofrece un enlace al punto guardado, distinto del «Ver en el mapa» que
   ya tenía.
2. Ese enlace lleva a las coordenadas **que la base tiene**, no a las del enlace pegado.
3. En la página pública de la tienda ese enlace no aparece.
4. Se abre en pestaña nueva: quien comprueba su punto no quiere perder la cuenta a medio configurar.
5. Cero cadenas visibles en duro: todo pasa por `es.json` / `en.json`.

## Escenarios

En `src/e2e/sellerStore/cuentaConfigurable.feature`, etiquetados `@punto-sucursal`. Van ahí y no en
un archivo nuevo porque son la misma pantalla y el mismo lector: quien abre «Mi cuenta» a configurar
su tienda.
