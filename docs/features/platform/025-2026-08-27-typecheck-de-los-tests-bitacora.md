# Bitácora — Los tests vuelven a typechequear

> Cierra la tarea que el roadmap arrastraba desde el slice 9 del design system
> (`001-2026-07-28-design-system-bitacora.md`): «Typechequear los tests», medida entonces en 32
> errores y llegada a este slice con 16.

## Slice 1 — De 16 errores a 0, y un barrido que nunca excluyó nada (2026-08-27)

### Por qué importaba, aunque nada estuviera rojo

`pnpm typecheck:tests` no lo corre ni el hook de pre-commit (`validate` = biome + typecheck +
test:run) ni CI (el único workflow es Playwright, deshabilitado por defecto). O sea: 16 errores que
no bloqueaban nada y que por eso llevaban meses creciendo.

El propio `tsconfig.test.json` ya explica para qué existe: los tests que Vitest transpila sin
comprobar tipos **siguen pasando con la firma vieja**, y eso ya mordió antes —al añadir
`fallbackLocale` y `defaultLocale`, los tests siguieron verdes «por accidente, porque
`undefined === undefined` daba la respuesta correcta por la razón equivocada»—. Un comprobador que
nadie corre no protege de eso.

### El hallazgo: `ignore` no es una opción de `node:fs`

Tres archivos usaban `globSync(..., { ignore: [...] })`. **`ignore` es la opción del paquete npm
`glob`, no la de Node**, que se llama `exclude`. Node la descartaba en silencio, así que
`radiusScale.test.ts` llevaba tiempo barriendo también los `*.test.tsx` y `*.stories.tsx` — justo
los que decía excluir. Nadie lo vio porque el barrido seguía pasando: da la casualidad de que
ningún test ni story usaba un `rounded-*` numerado dentro de un `className`.

Los tipos al día lo destaparon: con `@types/node@24`, `exclude` está declarado y `ignore` no, así
que el compilador rechazó lo que Node venía tragándose.

### Las cuatro causas, y qué se hizo con cada una

| Causa | Archivos | Arreglo |
| --- | --- | --- |
| `globSync` no existía en los tipos | `radiusScale`, `typographyPlugin`, `imagePriority` | `@types/node` de `^20` a `^24` — el runtime **ya era** Node 24, los tipos eran los desfasados |
| `ignore` en vez de `exclude` | `radiusScale` (×2) | La opción que Node sí lee. El barrido ahora excluye de verdad |
| `it.each` con unión de tuplas | `publicationPillars.pillarForCategory`, `redirectToSignIn` (×2) | Genérico explícito (`it.each<[string \| null, string]>`), el patrón que este repo ya usa en `NearbyBar.test.tsx`. En `redirectToSignIn` sustituye a un `as const` que era justo lo que producía la unión |
| Fixtures de antes de servicios y eventos | `managePost`, `EditPostForm` (×4) | `managePost`: faltaban `startsAt`/`endsAt`/`durationMinutes`, en `null` porque es un producto. `EditPostForm`: los cuatro fixtures se anotan con `EditablePostValues` en vez de dejar que `typeof EVENT_POST` congelara los valores de *ese* evento |
| Doble de `fetch` sin parámetros | `PostsWithLoadMore` | El doble declara el `_url` que recibe; sin él, `mock.calls[0]` era una tupla vacía y el caso no podía leer la dirección que afirma |

### Lo que no se tocó

`@types/node@24` trae 26.4.0 como disponible; se subió a `^24` y no más, que es la que corresponde
al Node 24 que corre el proyecto. Poner los tipos por delante del runtime reintroduce el mismo
desfase al revés.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Dependencias | `package.json`, `pnpm-lock.yaml` (`@types/node` `^20` → `^24`) |
| Tests | `radiusScale.test.ts`, `publicationPillars.pillarForCategory.test.ts`, `redirectToSignIn.test.ts`, `managePost.test.ts`, `EditPostForm.test.tsx`, `PostsWithLoadMore.test.tsx` |

### Comandos y resultados

```
pnpm run typecheck:tests   # 16 errores → 0
pnpm run typecheck         # limpio
pnpm run lint              # limpio
pnpm run check:i18n        # limpio
pnpm run test:run          # 2422/2422 en verde, 224 archivos
```

Ningún test cambió lo que afirma: los seis siguen midiendo lo mismo, ahora con el tipo que
describe su contrato real.

### Recap

`pnpm typecheck:tests` vuelve a pasar limpio después de meses de deuda acumulada, y en el camino
apareció lo que la deuda escondía: un barrido de tres archivos que decía excluir tests y stories y
nunca lo hizo, porque usaba la opción de otro paquete. Los tipos de Node estaban dos versiones por
detrás del runtime, y esa distancia era la que tapaba el error.

### Próximos pasos (opciones)

1. **Cola offline optimista** — pendiente de la conversación de alcance que se pospuso.
2. **Las 75 vulnerabilidades de dependencias** que GitHub reporta en cada push (2 críticas, 34
   altas). Nadie las ha mirado todavía.

## Slice 2 — `typecheck:tests` entra a `validate` (2026-08-27)

Dejar los tests fuera del comprobador es lo que permitió que la deuda del slice 1 creciera hasta 32
errores sin que nadie se enterara. Arreglarlos sin cerrar esa puerta habría sido arreglar el
síntoma: en unas semanas vuelven.

`validate` —lo que corre el hook de pre-commit— pasa a incluirlo:

```
biome check . && pnpm run typecheck && pnpm run typecheck:tests && pnpm run test:run
```

**Cuesta 19s medidos**, no los ~40s que estimó el slice 1 sin medirlos. Sobre los ~140s que ya
tardan las pruebas, es un 13% más por commit a cambio de que un cambio de firma deje de pasar
inadvertido hasta que alguien lee el test.

Sigue siendo un script aparte —`pnpm typecheck:tests`— para poder correr el ciclo rápido sin él
cuando conviene; lo que cambia es que el commit ya no lo omite. La cabecera de
`tsconfig.test.json`, que decía que vivía fuera del ciclo, queda corregida.

### Validación

```
pnpm run validate   # biome + typecheck + typecheck:tests + 2422/2422, todo en verde
```

### Recap

La comprobación que nadie corría ahora corre sola en cada commit. Los 16 errores del slice 1 no
pueden volver por el mismo camino: llegar a 32 exigió meses de nadie mirando, y eso deja de ser
posible.
