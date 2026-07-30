# Bitácora — Datos de prueba que no sobreviven a la suite

Append-only. Roadmap en `docs/features/datos-de-prueba-e2e.md`.

---

## Slice 1 — El slug de prueba se marca y se barre *(2026-07-30)*

### Objetivo

Que una corrida de e2e no pueda dejar filas en la base que comparten tres repositorios, aunque el
proceso muera a mitad. El incidente que lo motivó está en
`taxonomia-centralizada-bitacora.md`: tres publicaciones sobrevivieron a una corrida caída, el
golden del backend empezó a fallar por datos ajenos y una prueba de `apps/api` se diagnosticó mal.

### Decisiones y por qué

- **Prefijo `e2e-` en el slug, no sufijo.** Los datos filtrados tenían la forma
  `miel-de-abeja-1785417725068`: barrer por el timestamp final habría borrado también cualquier
  publicación real que terminara en dígitos. Además `LIKE 'e2e-%'` usa `idx_translations_slug` y
  `LIKE '%-123'` no. **Verificado antes de activarlo:** cero publicaciones reales contienen `e2e`
  en el slug.
- **En el slug y no en el título.** El título se ve en pantalla y varios escenarios lo comparan
  literalmente; el slug es identificador, no contenido.
- **`testPost()` deriva el slug con `PostEntity.generateSlug`,** el mismo código que corre al
  publicar. Sin eso, las publicaciones creadas *desde la UI* —donde la app decide el slug— quedarían
  fuera del barrido, que es justo la clase de hueco que dejó datos. Si la regla de slug cambia, la
  prueba la sigue en vez de esperar una URL que ya no existe.
- **El módulo del marcador es puro.** Lo que decide qué se borra de una base compartida merece
  pruebas que corran sin conexión: `testSlug.ts` no importa la base, y su spec de Vitest fija que el
  marcador **distinga** —`mie2e-de-abeja` y `una-receta-e2e-casera` **no** se barren—, no solo que
  coincida.
- **`globalSetup` barre, `globalTeardown` barre y falla.** `afterEach` sigue existiendo: mantiene la
  base limpia *durante* la corrida para que un escenario no vea lo sembrado por otro. Los ganchos
  globales cubren lo que `afterEach` no puede.

### Dos hallazgos del camino

1. **Playwright arranca el `webServer` antes que `globalSetup`.** Lo descubrí simulando una fuga: al
   sembrarla *sin media*, la portada devolvía 500, el servidor nunca quedó listo y **el barrido no
   llegó a correr**. La simulación era irrealista —`seedPost` siempre incluye media— pero el límite
   es real y quedó escrito en el propio `globalSetup`: si un residuo impide que la app levante, hay
   que barrerlo a mano.
2. **Playwright también tomaba los `*.test.ts` de Vitest.** Su `testMatch` por defecto incluye
   `test` y `spec`, y bajo `src/e2e/` ahora conviven pruebas unitarias de los ayudantes. Se acotó a
   `*.spec.ts`, lo que además hace explícita la frontera: `.spec.ts` es navegador, `.test.ts` es
   unitario.

### Un defecto de la app que esto destapó, y que NO se arregla aquí

Una publicación sin media hace que `MediaContent` reviente con
`Cannot read properties of undefined (reading 'url')` y la página responde 500 en vez de degradar.
No se puede llegar ahí por el formulario —exige media— pero sí sembrando directo. Queda anotado; no
es de este slice.

### Archivos tocados

- `src/e2e/testUtils/testSlug.ts` *(nuevo, puro)* + su spec de Vitest *(31 casos)*
- `src/e2e/testUtils/testData.ts` *(nuevo)* — el barrido y el conteo
- `src/e2e/globalSetup.ts`, `src/e2e/globalTeardown.ts` *(nuevos)*
- `playwright.config.ts` — ganchos globales y `testMatch` acotado
- Los 6 specs que siembran + `publishTestPost.ts`, migrados al marcador
- `docs/features/datos-de-prueba-e2e.md` y `src/e2e/testData/testData.feature` *(nuevos)*

### Validación

| | |
|---|---|
| Unitarias del marcador | **31**, incluida la tabla de lo que **no** se barre |
| Suite e2e completa | **27 pasan, 3 saltados, 0 fallan** |

**Probado contra el incidente real**, no solo en teoría:

```
1) Se sembró una fuga con el sembrador real (con media, como las de verdad).
   La siguiente corrida imprimió:
   [e2e] se barrieron 1 publicación(es) ... de una corrida anterior.
   Si esto se repite, alguna corrida está muriendo antes de limpiar.
   -> publicaciones e2e- restantes: 0

2) Mutación: se dejó el barrido sin efecto y se sembró un residuo.
   globalTeardown falló, como debe:
   Error: [e2e] quedaron 1 publicación(es) ... y el barrido no pudo borrarlas.
   Revísalas a mano: SELECT slug FROM post_translations WHERE slug LIKE 'e2e-%'
```

**El círculo cerrado** — que es el criterio que de verdad importaba: se corrió la suite completa y,
**justo después**, `pytest` del backend (**92/92**) y las de integración de `apps/api` (**152/152**).
Ambas verdes: ya no hay datos de prueba con los que tropezar.

### Escrito en recursos compartidos

Las publicaciones de prueba que la propia suite crea y borra, más dos fugas simuladas a propósito
para comprobar el barrido — ambas eliminadas. Estado final: 0 publicaciones `e2e-`, 0 categorías
`e2e_`, 24 posts y 14 productos, como antes de empezar.

### Recap

Marcar el dato de prueba en el slug y barrer en los ganchos globales convierte una limpieza que
dependía de que el test terminara bien en una que no depende de nada. Está probado contra el
incidente que lo motivó —fuga sembrada, fuga barrida— y contra su propio fallo —barrido roto,
teardown en rojo—, y se cierra comprobando que los otros dos repos quedan verdes justo después de
correr la suite. El límite conocido (el `webServer` arranca antes que el barrido) quedó escrito
donde se va a leer.

### Próximos pasos (opciones)

1. **Slice 2** — que la suite deje de publicar como una persona real: usuario de prueba propio y
   barrido por `user_id`, que atrapa cualquier escritura sin depender del nombre.
2. **Arreglar el 500 de la publicación sin media**, que este slice destapó.
3. **Slice 3** — que el pipeline falle si quedan datos de prueba al terminar.
