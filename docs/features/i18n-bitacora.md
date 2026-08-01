# Bitácora — Traducciones (i18n)

Registro append-only. Narra el **por qué**; el qué está en `git log`.

---

## Slice 0 — La fundación (2026-08-01)

### Objetivo

Montar de una sola vez las piezas que hacen **verificable** el resto de la feature, antes de tocar
~95 archivos de interfaz: el tipado del catálogo, un catálogo por idioma, la resolución de locale y
—lo que más pesaba— la navegación que conserva el idioma. Sin URLs nuevas: `pathnames` sigue siendo
del slice 4.

### El cambio de orden, y por qué

Se pidió **priorizar las rutas localizadas** aceptando que el contenido siguiera sin traducir,
porque traducirlo con Gemini tiene costo. Al revisarlo, ese costo resultó marginal: son **24
publicaciones**, un backfill de una corrida. Retirada esa razón, se conservó el orden que
`docs/features/i18n.md` ya justificaba (interfaz → contenido → URL), que además termina justo donde
se quería llegar. Adelantar el slice 4 habría dejado direcciones en inglés sirviendo interfaz y
contenido en español —la fachada que el documento advierte— y trabajo a rehacer.

Lo que sí cambió fue **separar este slice 0**, juntando piezas que estaban repartidas entre el 1 y
el 4. La que se movió de sitio es la migración de navegación: estaba en el slice 4, y se adelantó
porque **no cambia ninguna URL** y porque arregla un bug que ya existía. Dejarla donde estaba
habría obligado a tocar dos veces los mismos archivos que el slice 1 va a reescribir.

### Decisiones y por qué

**El bug que se arregló no era hipotético.** `src/i18n/navigation.ts` existía desde antes con los
wrappers escritos, y **cero archivos lo importaban**: los 25 `next/link` mandaban `href="/productos"`
sin prefijo, así que un visitante en `/en` que tocara el menú volvía al español sin ningún aviso. El
escenario de Playwright afirma exactamente eso.

**`redirect` obligó a un helper propio.** El `redirect` de next-intl sí prefija el idioma, pero
next-intl lo tipa como `void` y no como `never`. Al migrarlo, TypeScript dejó de entender que
después de un `redirect` no se sigue ejecutando y aparecieron 10 errores derivados —`session` posible
`null`, funciones "sin return"— en código que estaba bien. Se resolvió con
`src/i18n/redirectKeepingLocale.ts`, tipado `never` gracias a un `throw` final.

Ese helper es **síncrono y recibe el locale**, en vez de resolverlo dentro con `getLocale()`. La
razón es una limitación real del análisis de flujo de TypeScript: **no estrecha tipos después de un
`await`**, ni aunque el tipo sea `Promise<never>`. Un helper `async` habría dejado los mismos 10
errores que venía a evitar. Se probaron las dos formas; solo la síncrona funciona.

**El `LanguageSwitcher` se simplificó de paso.** Armaba la ruta destino con cirugía de strings
(`pathname.replace("/es", "/en")`), que se rompe con cualquier ruta que contenga el código de idioma
en otra posición. Con `usePathname` del wrapper —que devuelve la ruta sin prefijo— cambiar de idioma
es `router.replace(pathname, { locale })`. La reescritura completa que pide el slice 4 (traducir
también el slug) sigue pendiente; esto es la mitad barata.

**Un idioma desconocido responde 404, no español.** El escenario que se había escrito en el
`.feature` decía lo contrario —caer al español— y se corrigió antes de implementarlo: servir la
misma página bajo `/fr/…` es contenido duplicado, justo lo que `docs/features/seo.md` evita. Lo que
sí se garantiza es que la **resolución** del idioma no reviente antes de llegar al 404; por eso
`request.ts` usa `resolveLocale` con respaldo y el layout usa `hasLocale` + `notFound()`.

**Los 15 archivos que no llevan `setRequestLocale`, y por qué.** Se aplicó a 22 páginas y al layout
raíz. Quedaron fuera, a propósito: los 6 stubs del menú (solo llaman `notFound()`, nunca renderizan),
`auth/signin` (es Client Component y `setRequestLocale` es de servidor), `not-found.tsx` (Next no le
pasa `params`) y 3 layouts de paso (`return children`).

### El hallazgo: el prerenderizado sigue bloqueado, y no es por i18n

`pnpm run build` lista **todas** las rutas como `ƒ` (dinámicas) incluso después de poner
`setRequestLocale` y `generateStaticParams`. La causa es
`src/infra/UI/components/Header/Header.tsx`: llama `await auth()`, el `Header` vive en el layout de
`[locale]`, y leer la sesión es leer cookies. Con eso, hasta `/nosotros` y las dos legales —HTML
fijo— se renderizan en cada petición.

Es anterior a esta feature y **ortogonal** a las traducciones. `setRequestLocale` hacía falta de
todos modos (sin él no se prerenderizaría nada ni aunque se arreglara el Header), pero por sí solo
no cambia el resultado. Arreglarlo es mover la lectura de sesión al cliente, y eso cambia el
comportamiento visible de los botones de sesión: merece su propio slice. **Queda como pendiente
explícito, y el criterio de aceptación del slice se corrigió para no dar por hecho algo que no lo
está.**

### Archivos tocados

- **Fundación i18n:** `src/i18n/routing.ts` (+`resolveLocale`, `AppLocale`), `request.ts`,
  `next-intl.d.ts` (nuevo), `redirectKeepingLocale.ts` (nuevo), `messages/{es,en}.json` (nuevos,
  fusionando los 4 namespaces), `routing.test.ts` (nuevo). Se borró `src/i18n/locales/`.
- **Páginas:** 22 páginas y `[locale]/layout.tsx` (+`setRequestLocale`, `generateStaticParams`,
  `NextIntlClientProvider`, `hasLocale`+`notFound`).
- **Navegación:** 24 archivos migrados de `next/link`; 12 de `next/navigation`. El único que se
  queda con `next/link` es `src/app/not-found.tsx`, que vive fuera de `[locale]`.
- **Pruebas:** `src/e2e/i18n/{i18n.feature,i18n.spec.ts,LocalePage.ts}` (nuevos),
  `src/infra/test-utils/renderWithIntl.tsx` (nuevo), 5 suites apuntadas a él, `vitest.config.mjs`.
- **Normas:** `AGENTS.md` (sección i18n nueva + ubicación de componentes),
  `.agents/skills/nextjs-bdd-feature/SKILL.md` (ubicación de componentes + rama por feature).

### Comandos y resultados

| Comando | Resultado |
|---|---|
| `pnpm run lint` | 415 archivos, sin hallazgos |
| `pnpm run typecheck` | limpio |
| `pnpm run test:run` | **479 pasan / 53 suites** (antes: 451 y **5 suites que ni cargaban**) |
| `pnpm run build` | compila; 31 páginas generadas, todas `ƒ` (ver el hallazgo) |
| `pnpm run test:e2e:run` | **63 pasan, 3 skipped**, 5.2 min |

Dos arreglos de infraestructura de pruebas salieron de aquí: `vitest.config.mjs` necesitó
`server.deps.inline: ["next-intl"]` porque next-intl es ESM y hace `import … from "next/navigation"`
sin extensión, que Node no resuelve dentro del árbol anidado de pnpm; y `SearchBar.test.tsx` mockeaba
`next/navigation` entero, lo que dejaba a next-intl sin las piezas que usa por dentro — ahora mockea
el wrapper, que es lo que el componente importa.

`unifiedCatalog.spec.ts`, la única prueba que dependía del inglés y que el plan marcaba como riesgo,
pasa sin tocarla.

### Desviaciones respecto al roadmap

- Se creó el slice 0, que el documento original no tenía (ver arriba).
- El criterio de aceptación 4 se reescribió: prometía prerenderizado y solo se puede prometer la
  condición necesaria.
- El escenario del idioma desconocido cambió de "cae al español" a "404 limpio".
- Se adelantó media reescritura del `LanguageSwitcher` que el plan situaba en el slice 4.

### Pendientes que deja

- **El `Header` bloquea el prerenderizado de todo el sitio.** Es el más valioso y no es i18n.
- `src/infra/UI/components/` sigue sin mudarse a `src/presentation/` (norma nueva en `AGENTS.md`).
- `pnpm run check:i18n` (el grep de literales en español) es del slice 1, no existe todavía.

### Recap

La fundación está puesta y verde: hay un catálogo por idioma atado al compilador —una clave que
falte en `en.json` ya rompe `pnpm typecheck`—, `resolveLocale()` como único lugar donde un segmento
de ruta se convierte en idioma, `setRequestLocale` en las 22 páginas que renderizan, y la navegación
migrada por completo a los wrappers, con lo que se arregló un bug real: hasta hoy, un visitante en
inglés que tocara el menú volvía al español. Ninguna URL cambió. Lo que **no** se logró, y queda
escrito como pendiente en vez de disimulado, es el prerenderizado: lo bloquea el `await auth()` del
`Header`, un problema anterior y ajeno a las traducciones.

### Próximos pasos (opciones)

1. **Slice 1 — la interfaz habla los dos idiomas.** Es el orden acordado y el grueso del trabajo:
   sacar el español del TSX a los catálogos, empezando por header/footer/nav y siguiendo por el
   detalle de publicación, `/publicar`, tienda y perfil, `/cuenta`, pilares y `/nosotros`. Incluye
   el `check:i18n`. Conviene commitear por zona, no en un commit gigante.
2. **Desviarse un slice a arreglar el `Header`.** Devuelve el prerenderizado a todo el sitio, que es
   rendimiento real y medible, pero toca la UI de sesión y no es i18n. Es la única razón sensata
   para no seguir con el 1.
3. **Saltar al slice 2** (que el contenido deje de asumir `es`) si interesa más ver una publicación
   traducida que el marco traducido. Se puede, pero deja el marco en español un rato más.

**Nada pendiente del usuario para continuar.** El trabajo va en la rama `feat/i18n`, sin commitear
todavía al momento de escribir esto.

---

## Corrección al slice 0 — el prerenderizado no lo bloqueaba el `Header` (2026-08-01)

Este registro es append-only, así que la entrada de arriba se queda como se escribió. **Lo que dice
sobre el `Header` es falso** y lo corrige esto.

Se afirmó que `await auth()` en `Header.tsx` era lo que forzaba a todas las rutas a renderizarse por
petición. Al ir a arreglarlo se midió, y no es cierto:

1. Sin el `await auth()` del `Header`: todas las rutas siguen `ƒ`.
2. Sin el `<Header />` entero en el layout: siguen `ƒ`.
3. Una página sonda **vacía** bajo `[locale]` —sin `params`, sin next-intl, solo un `<p>`— también
   sale `ƒ`. La causa está en el árbol del layout, no en las páginas ni en la sesión.
4. Con el layout reducido a `html`/`body` + `setRequestLocale`, Next **sí** intenta prerenderizar, y
   entonces asoma un segundo problema, distinto y sin diagnosticar: un error de prerenderizado en
   `/en/condiciones-de-servicio`.
5. `/nosotros` con `export const dynamic = "force-static"` prerenderiza hoy (`●`, ambos locales) con
   el `Header` puesto. El opt-in por página ya funciona.

### La decisión, y por qué no se arregló

De (5) sale un camino corto: `force-static` en las páginas de contenido fijo. Pero una página
`force-static` hornea en el HTML el header de **sesión cerrada**, así que ese camino arrastra mover
la sesión al cliente (`useSession` + `SessionProvider`), y con ello un parpadeo de ~200ms para quien
tiene sesión y exponer `isAdmin` como campo de la sesión —`HAZLO_SANO_ADMIN_EMAILS` es variable de
servidor y no puede viajar al navegador—.

Se midió el premio: **~8 páginas de contenido fijo y bajo tráfico** (`/nosotros`, 2 legales, 5
pilares). Las de tráfico real —home, `/productos`, detalle, tiendas, perfiles— leen de la base y
deben seguir dinámicas o servirían contenido viejo. No paga el parpadeo para los vendedores, que son
justo quienes usan la sesión. **Se dejó pendiente y se pasó al slice 1.**

La lección que vale guardar: el diagnóstico se dio por bueno sin medirlo, porque `auth()` en un
layout *parecía* explicación suficiente. Tres builds lo desmintieron.
