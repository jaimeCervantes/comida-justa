# Bitácora — La búsqueda entiende palabras a medias

## 2026-10-17 — Slice 1: palabras a medias, y los filtros fuera de la medición

### Objetivo

Que la búsqueda del sitio encuentre lo que se empezó a escribir («prote», «galle», «barra de prot»),
y que el registro de búsquedas deje de contar como fallido picar un pilar vacío.

### La investigación (solo lectura en la base)

- En 90 días, 214 de 1498 búsquedas quedaron sin resultados.
- **76 eran filtros, no fallos.** Llegaban en ráfagas de segundos sobre el mismo término («pan»
  11 → 8 → 0 → 11), y dentro de los dos minutos había una búsqueda igual con resultados. `searches`
  guarda el término pero no los filtros. «pan», «suero» y «proteina» dan hoy 29, 4 y 85.
- **Las 138 restantes son casi todas palabras a medias:** «amorasan» 13, «prote» 7, «amo» 5,
  «pla» 5, «smo» 4, «galle» 3, «barra de prot», «wil», «electro». Unos pocos son errores de dedo
  («plta», «cookes and cream»).
- `pg_trgm`, `unaccent` y `fuzzystrmatch` están disponibles pero no instalados.

### Decisiones y por qué

- **Un paso nuevo entre las palabras completas y el sentido, no un cambio de las completas.** Como
  inicio, «pan» también trae «panela», así que abrirlo siempre cambiaría el orden de lo que ya
  funciona. Solo entra cuando las completas dan cero, y no cuesta ninguna llamada al proveedor.
- **`to_tsquery` con `:*` sobre los mismos documentos.** Mismo orden por relevancia, mismos índices
  parciales y mismos filtros. El diccionario normaliza el inicio igual que el texto («prote» →
  `prot`) y descarta las vacías («de»). Como `to_tsquery` tiene sintaxis propia, solo le llegan
  letras y números: lo parte `prefixWords` en el dominio y el repositorio lo vuelve a comprobar.
- **Sin doblar acentos ni ñ, a diferencia de `searchWords` (difusión).** Aquí compara el
  diccionario, que ya quita los acentos de las vocales. Doblar la ñ haría que «piña» dejara de
  encontrar «Piña».
- **Se ignoran las palabras de una letra:** «pan d» empezaría a traer cualquier palabra con «d».
- **Cuenta como búsqueda de texto** (`strategy: "text"`), con sus propias cuentas por pilar. El
  `CHECK` de `searches.strategy` no admite otro valor, y tampoco hace falta.
- **Un pilar vacío es una respuesta.** Si la palabra existe fuera del pilar elegido, no se rescata
  nada: cero resultados y las facetas dicen dónde sí. Antes se intentaba el rescate semántico.
- **Con un pilar o «solo disponibles» puestos, no se registra.** Tampoco cuando encuentra algo:
  picar un filtro no es escribir otra búsqueda. Guardar los filtros sería mejor, pero pide una
  migración en el backend.

### Archivos tocados

- Dominio: `src/domain/search/prefixWords.ts` y su prueba (nuevos).
- Casos de uso: `ISearchPostRepository` (`searchByPrefix`, `countByCategoryByPrefix`) y
  `SearchPostsUseCase` (el paso nuevo, el pilar vacío y la medición), con sus pruebas.
- Infra: `PostgresSearchPostRepository`. La pregunta (`TextQuestion`) puede ser de palabras completas
  o de inicios, y `rankedMatches` y las cuentas sirven a las dos.
- E2E: `src/e2e/palabrasAMedias/` (`.feature` y `.spec.ts`). Roadmap:
  `006-2026-10-17-palabras-a-medias.md`.

### Comandos clave

```sh
pnpm run test:run && pnpm run typecheck && pnpm run lint && pnpm run check:directives
# El caso de uso contra la base real, sin registro (solo SELECT):
node --env-file=.env.development node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json <scratchpad>/prefix-check.mts
pnpm exec playwright test src/e2e/palabrasAMedias --reporter=line
```

### Resultados

- **Vitest:** 336 archivos, 3546 pruebas en verde. Nuevas: 13 de `prefixWords`, y 6 del paso nuevo
  más 4 de la medición con filtros en el caso de uso.
- **Typecheck, lint y directivas** limpios.
- **El caso de uso en la base real:** «prote» 95 (primero «Proteína de Soya Aislada»), «galle» 26,
  «barra de prot» 14, «amorasan» 12, «wil» 19, «electro» 8, «cookies and crea» 4. «pan» sigue en 29
  por palabra completa y en el mismo orden. «plta» sigue en 0.
- **Playwright:** los 6 escenarios del slice, 6 de 6.
- **Los e2e de búsqueda que ya existían:** 49 de 49 en cuatro tramos (13, 12, 12 y 12). Son
  `busquedaRelevante`, `busquedaFacetada`, `busquedaEntreIdiomas`, `listadosCompactos`,
  `searchShortcut`, `searchSubmit`, `existenciasEnBusqueda` y `cartFromSearch`, e incluyen los 6
  nuevos.

### Desviaciones

- **El cuarto tramo se cortó la primera vez.** Claude Code lo detuvo porque la máquina se quedó
  sin memoria; no fue un fallo de las pruebas. Quedó vivo su `next dev --port 3000` (el de
  Playwright, no el del usuario) y se cerró a mano. Repetido al día siguiente: 12 de 12.
- **El pilar Mente no se pudo probar desde el script:** `unstable_cache` no corre fuera de Next.
  Lo cubre el e2e.
- **«Y esa búsqueda no queda registrada» se prueba en Vitest, no en Playwright:** `searches` no
  lleva marcador de corrida, y en la base compartida buscan «pan» personas de verdad.

### Escrito en recursos compartidos

- **Base compartida:** las dos publicaciones sembradas con marca `E2E`, que borra `afterAll`, más lo
  que sembraron los e2e existentes, que también se limpian solos. El corte del cuarto tramo pudo
  dejar residuos con marca `E2E`; el barrido de `globalTeardown` de la corrida siguiente los quitó.
- **`searches`:** las búsquedas sin filtro de las corridas de e2e quedan registradas, igual que
  antes de este slice.
- Las lecturas de la investigación y el script del caso de uso solo hicieron `SELECT`, con
  `SET default_transaction_read_only = on` en las primeras.

### Recap

La búsqueda del sitio encuentra lo que se empezó a escribir. Primero busca las palabras completas,
como siempre; si no hay nada, cada palabra como inicio; y al final, por sentido. «prote» pasó de 0
a 95 resultados, y «pan» sigue igual. Un pilar vacío ya no dispara rescates, y las búsquedas con
filtros ya no ensucian la medición: un cero en `searches` vuelve a significar que alguien se fue
sin encontrar nada.

### Próximos pasos (opciones)

1. **Errores de dedo** («plta», «cookes and cream»): `pg_trgm` es una migración en `hazlo-sano-bot`.
   Si se quiere, se escribe ahí el archivo y aplicarla queda del lado del usuario.
2. **Guardar los filtros en `searches`:** otra migración pequeña en el backend, para medir también
   qué pilares se usan.
3. Del usuario: probar el header con «prote», «galle» o «barra de prot».
4. Subir la rama y llevarla a `dev`.
