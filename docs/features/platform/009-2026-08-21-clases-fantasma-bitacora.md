# Bitácora — Las últimas clases que no existían

> No hay roadmap aparte: es la auditoría de cierre del rediseño v2, y lo que encontró.
> Continúa `docs/features/platform/007-2026-08-21-chrome-v2.md` y `008-2026-08-21-home-v2.md`.

---

## Slice 1 — El plugin que nunca se instaló (2026-08-21)

### Objetivo

Antes de dar por cerrado el rediseño, auditar lo que el sistema afirma de sí mismo: cero paletas
frías, cero `dark:` a mano, todo por token. Y arreglar lo que no se cumpliera.

### Lo que la auditoría midió

| Afirmación del sistema | Medido hoy |
| --- | --- |
| Cero grises crudos de Tailwind (`text-gray-*`, `slate`, `zinc`…) | **0** ✅ |
| Cero `dark:` escritas a mano | **17 coincidencias**, pero 13 son comentarios que las mencionan. Reales: **4** |
| Radios por nombre | 41 `rounded-*` sueltos — ver «lo que no entra» |

### El hallazgo

Dos de esas cuatro `dark:` estaban en la misma cadena, en las dos páginas legales:

```
prose prose-sm sm:prose-base md:prose-lg prose-zinc dark:prose-invert
```

**Ninguna de las seis clases existe.** `@tailwindcss/typography` —el plugin que las emite— no está
en `package.json`, y el CSS publicado no tiene **una sola regla `.prose`** (verificado con `grep`
sobre `.next/static/chunks/*.css`). El cuerpo de las dos páginas se estaba pintando únicamente con
`text-text-support` y los estilos sueltos de cada párrafo.

Es exactamente el hallazgo del slice 13 del design system —«una clase que no existe no falla:
desaparece»— pero al doble: seis clases, dos páginas, y una de ellas (`prose-zinc`) era además la
**última paleta fría del sitio**, escondida detrás de un plugin ausente. Por eso el barrido de
grises del slice 12 la dio por limpia: `prose-zinc` no lleva número, así que ningún
`text-(gray|slate|zinc)-[0-9]` la encontraba.

### Decisiones y por qué

1. **El cuerpo pide la escala, no un plugin.** `text-body leading-relaxed text-text-support` en vez
   de tres tamaños responsivos que no se emitían. Lo que ya funcionaba —los estilos de cada párrafo
   y lista— no se toca.

2. **Una prueba que ata las dos mitades** (`typographyPlugin.test.ts`): falla si alguien vuelve a
   escribir `prose`, **y también** si alguien instala el plugin de verdad — para que en ese caso se
   venga a retirarla en lugar de dejarla mintiendo. Distingue `max-w-prose`, que sí existe y es de
   Tailwind: el primer intento acusaba a `/auth/signin`, que la usa bien.

3. **`LegalSectionHeading` deja de pisar la escala.** Pedía `Heading` y le pasaba
   `text-xl sm:text-2xl` por `className`, así que el tamaño lo decidía el override y no el nivel.

4. **La última pareja clara/oscura a mano se va.** `/auth/signin` tenía
   `text-pw-gray dark:text-pw-white`; es `text-text-support`, que ya cambia con el tema.

### Lo que NO entra, y por qué

**Los 41 `rounded-*` sueltos** (33 `lg`, 5 `sm`, 3 `md`). Parecen convertibles y no lo son: la
escala con nombre del slice 10 **no sobrescribe** la de Tailwind a propósito, así que `rounded-lg`
son 8px y `rounded-card` son 18px. Cambiarlos no es renombrar, es redibujar 41 esquinas sin poder
mirarlas una por una. Queda como slice propio, con revisión visual.

### Archivos tocados

- `src/app/[locale]/condiciones-de-servicio/page.tsx` · `politica-de-privacidad/page.tsx`
- `src/presentation/legal/LegalSectionHeading.tsx`
- `src/app/[locale]/auth/signin/page.tsx`
- `src/presentation/design_system/styling/typographyPlugin.test.ts` (nuevo)

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | 204 archivos, **2201 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (963 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test seo i18n design-system` | **52/52 en verde** |

Comprobado en pantalla, `/condiciones-de-servicio` en **claro y oscuro**: papel cálido, números de
sección con el par verde de marca, cuerpo legible y ni rastro del zinc frío.

### Recap

El sistema afirmaba cero paletas frías y era casi cierto: quedaba una, escondida tras seis clases
que ningún CSS emitía porque el plugin que las define nunca se instaló. Las dos páginas legales
pasan a la escala real, la última pareja `dark:` a mano desaparece, y una prueba impide que
cualquiera de las dos cosas vuelva sin que nadie se entere.

### Próximos pasos (opciones)

1. **Los 41 radios sueltos**, como slice propio con revisión visual: no es un renombrado, es
   redibujar esquinas.
2. **Las pantallas 5.6–5.9** del canvas (pilar, búsqueda, comunidad, acceso). Ojo: la 5.7 propone
   facetas con contadores, que es **UX nueva** y no repintado — v2 la dejó fuera con razón.
3. **El admin**, si se decide meterlo en el alcance del rediseño.
