# La búsqueda entiende palabras a medias

## Context

### Problem

La caja de búsqueda del header busca mientras se escribe, pero solo reconoce palabras completas:
«prote» no encuentra «Proteína», «galle» no encuentra «Galletas» y «barra de prot» no encuentra
ninguna barra de proteína. El rescate semántico tampoco ayuda, porque un pedazo de palabra casi no
tiene sentido que comparar.

Medido en la base el 2026-10-17, sobre 90 días: 214 de 1498 búsquedas quedaron sin resultados.

- **76 no eran búsquedas fallidas.** Llegaban en ráfagas de segundos («pan» 11 → 8 → 0 → 11): alguien
  picando el pilar o «solo disponibles» sobre una búsqueda que sí tenía resultados. El registro
  guarda el término sin los filtros, así que esos ceros parecían búsquedas que fallaron. Por eso
  «pan», «suero» y «proteina» salían entre las más vacías, aunque hoy dan 29, 4 y 85 resultados.
- **Las 138 restantes son casi todas palabras a medias** («amorasan» 13, «prote» 7, «pla», «smo»,
  «galle», «wil», «barra de prot») y unos pocos errores de dedo («plta», «cookes and cream»).

### Savings

Quien busca encuentra el producto antes de terminar de escribir, en vez de irse con «no hay
resultados» de algo que sí existe. Y la medición vuelve a contar solo a quien de verdad se fue sin
nada, así que las decisiones sobre la búsqueda salen de datos limpios.

### Why

La búsqueda es la puerta principal del catálogo. Cada búsqueda vacía de algo que existe es una venta
que se pierde en el primer paso.

## Roadmap de slices

### Slice 1 — Palabras a medias, y los filtros fuera de la medición

La búsqueda sigue en tres tiempos, con uno nuevo en medio:

1. **Palabras completas**, como hoy. Lo que ya encuentra no cambia ni de orden.
2. **Si eso no encontró nada, cada palabra también como inicio de palabra** («prote» → `prot:*`).
   Usa los mismos índices y el mismo orden por relevancia. Cuenta como búsqueda de texto: las
   facetas enseñan sus números.
3. **Si tampoco, el rescate semántico**, como hoy.

Además:

- **Un pilar vacío es una respuesta, no un fallo.** Si la palabra existe fuera del pilar elegido,
  no se rescata nada. «pan» en el pilar Mente da cero, y las facetas dicen dónde sí hay pan.
- **Las búsquedas con un pilar o «solo disponibles» puestos no se registran.** Ese registro mide qué
  escribe la gente y si se fue con las manos vacías. Picar un filtro no es escribir otra búsqueda.
  Guardar los filtros también sería mejor, pero pide una migración en el backend.

**Criterios de aceptación.**

- «prote», «galle» y «barra de prot» encuentran primero un título cuyas palabras empiezan con lo
  escrito.
- Una palabra completa sigue sin traer las que solo empiezan igual.
- «pan» en el pilar Mente no enseña ningún resultado, y esa búsqueda no se registra.

## Fuera de alcance

- **Errores de dedo** («plta», «cookes and cream»). Necesitan la extensión `pg_trgm`, que no está
  instalada: es una migración en el backend.
- **Guardar los filtros en `searches`.** También es una migración en el backend.
- Cambiar el rescate semántico o su umbral.

## Validación planeada

```bash
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm exec playwright test src/e2e/palabrasAMedias --reporter=line
```
