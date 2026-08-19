# Feature: Datos de prueba que no sobreviven a la suite

Roadmap para que una corrida de e2e **no pueda** dejar datos en la base que comparten tres
repositorios, aunque el proceso muera a mitad.

Este documento es el **checkpoint de revisión** que reemplaza las pausas paso a paso (ver
"Autonomous delivery mode" en `AGENTS.md`). La bitácora por slice se lleva en
`docs/features/platform/002-2026-07-30-datos-de-prueba-e2e-bitacora.md`.

## Problema / Savings / Why

- **Problema:** la limpieza vive solo en `afterEach`, y `afterEach` no corre si el proceso muere.
  **Ya pasó:** tres publicaciones sembradas por `products.spec.ts` sobrevivieron a una corrida caída
  y se quedaron en la base. Consecuencias medidas, no hipotéticas:
  - el golden de recomendaciones del backend Python empezó a fallar con *"2 productos siguen sin
    indexar"*;
  - una prueba de integración de `apps/api` falló con `16` productos contra `14`, y el fallo se
    diagnosticó **mal** la primera vez (se atribuyó a concurrencia, no a datos filtrados);
  - `/productos` mostró publicaciones de prueba a cualquiera que entrara mientras tanto.
- **Savings:** deja de perderse tiempo diagnosticando fallos ajenos en tres repos, y deja de
  ensuciarse una base compartida que además es la de producción del catálogo.
- **Why:** la suite e2e es la red que protege todo lo demás. Si su propio residuo rompe las pruebas
  de otros repos, la red empieza a costar más de lo que cubre — y la respuesta fácil es dejar de
  correrla.

## Por qué ahora

La feature de taxonomía centralizada acaba de añadir un caso más de escritura (categorías), y el
patrón correcto ya existe y está probado en `src/e2e/adminCatalog/`: prefijo `e2e_`, barrido en
`beforeAll` y aserción de cero en `afterAll`. Falta aplicarlo a las publicaciones, que son las que
de hecho se filtraron.

## Dos problemas, no uno

### 1. El marcador de "esto es de prueba" es implícito

Los slugs llevan un sufijo de timestamp (`miel-de-abeja-del-vecino-1785417725068`), que es lo que
permitió la limpieza manual. Pero es una convención tácita: **un título real que termine en 13
dígitos también encajaría**, y barrer por ese patrón podría borrar contenido de la comunidad.

### 2. La suite publica como un usuario real

`seedPost` usa `findAnyUserId()` y `simulateLogin` sin email usa el primer usuario de la tabla. Las
publicaciones de prueba quedan **atribuidas a una persona real**, que aparece como su autora en la
tarjeta y en el detalle.

## Decisión de modelado

**Un prefijo explícito en el slug, y un barrido que no dependa del final del test.**

```
slug de prueba:  e2e-<lo-que-sea>-<timestamp>
barrido:         DELETE FROM posts WHERE slug LIKE 'e2e-%'
```

- **Prefijo y no sufijo**: `LIKE 'e2e-%'` usa el índice `idx_translations_slug`; `LIKE '%-123'` no.
- **En el slug y no en el título**: el título se ve en pantalla y varias aserciones lo comparan
  literalmente. El slug es identificador, no contenido.
- **Sirve también para lo publicado por la UI**: la app deriva el slug del título, así que un título
  que empieza con el marcador produce un slug que empieza con el marcador.

### Dónde corre el barrido

| Momento | Qué hace | Por qué |
|---|---|---|
| `globalSetup` | Barre lo que quedó de antes | Una corrida no debe heredar la basura de otra |
| `afterEach` (lo que ya existe) | Borra lo suyo | Mantiene la base limpia **durante** la corrida, para que un escenario no vea lo sembrado por otro |
| `globalTeardown` | Barre y **afirma que quedó en cero** | Un residuo deja de pasar inadvertido |

`globalSetup`/`globalTeardown` de Playwright corren aunque un test falle; lo único que se los salta
es matar el proceso, y para eso está el barrido de la siguiente corrida.

### Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Usuario de prueba dedicado y barrer por `user_id` | Es el marcador más fuerte y **resuelve además el problema 2**, pero los escenarios de admin inician sesión con un correo de `HAZLO_SANO_ADMIN_EMAILS`, que es configuración real. Se deja para el slice 2 |
| Una base separada para la e2e | Lo correcto a futuro, pero hoy la suite comprueba justo la integración con los datos reales (14 productos, el catálogo sembrado por Alembic) |
| Transacción por test con rollback | La app abre sus propias conexiones; no comparte transacción con la prueba |
| Barrer por el sufijo de timestamp actual | Es la convención tácita de hoy, y puede coincidir con contenido real |

## Slices

### Slice 1 — El slug de prueba se marca y se barre *(el que resuelve el incidente)*

- `testSlug(nombre)` en `src/e2e/testUtils/`, que produce `e2e-<nombre>-<timestamp>`.
- Los 9 specs que siembran pasan a usarlo; se conservan sus `afterEach`.
- `globalSetup` barre antes de empezar; `globalTeardown` barre y **falla si queda algo**.
- El barrido cubre `posts` (con sus traducciones y media por cascada) y las categorías `e2e_`.

**Criterios de aceptación:**
1. Tras matar la suite a mitad, la siguiente corrida arranca con la base limpia.
2. `globalTeardown` falla si queda una publicación con el prefijo.
3. Ninguna publicación real coincide con el patrón (se comprueba contra la base antes de barrer).
4. Los 27 escenarios actuales siguen verdes.
5. `pytest` del backend y las pruebas de integración de `apps/api` siguen verdes después de correr
   la suite completa — que es lo que se rompió.

### Slice 2 — La suite deja de publicar como una persona real *(futuro)*

- Usuario de prueba propio (`e2e@…`), creado si no existe, y `seedPost`/`simulateLogin` lo usan por
  defecto.
- El barrido pasa a ser por `user_id`, que atrapa cualquier escritura sin depender del nombre.
- Los escenarios de admin siguen necesitando un correo de la allowlist: se decide entonces si el
  usuario de prueba entra en `HAZLO_SANO_ADMIN_EMAILS` del entorno de pruebas.

**Criterios de aceptación:**
1. Ninguna publicación de prueba queda atribuida a un usuario real.
2. El barrido por `user_id` deja la base en cero sin depender del slug.

### Slice 2 (adelanto parcial) — Cuentas de prueba propias *(2026-08-14)*

Lo hizo caer el slice 5 de `pedidos.md`: el escenario "el vendedor no ve a quién más le compré"
necesita **dos personas a la vez** —quien compra y quien vende— y con una sola cuenta no comprueba
nada. Así que la suite sí crea una cuenta, aunque solo para eso.

- Se reconocen por el correo: `pw.%@example.com`. El dominio `example.com` está **reservado por la
  RFC 2606**, así que el patrón no puede alcanzar a nadie real. La cuenta fija de la suite es
  `pw.…@gmail.com` y se queda fuera a propósito: es real y no se borra.
- El barrido las borra **las últimas** —`sellers.user_id` y `sessions.user_id` las referencian— y
  `globalTeardown` las cuenta, así que una cuenta huérfana falla la corrida en vez de quedarse.
- Sigue sin cumplirse el resto del slice 2: `seedPost` y el `simulateLogin` por omisión siguen
  publicando y entrando con una cuenta real.

**De paso, un agujero del barrido:** `customer_orders.seller_id` apunta a `sellers` desde la
migración `0032`, y el barrido borraba las tiendas de prueba **sin borrar antes sus pedidos**. Una
corrida que muriera dejando una tienda con pedidos hacía fallar el `DELETE FROM sellers` de la
siguiente por el FK, y con él el `globalSetup` entero. Solo `deleteTestSellerByHandle` lo hacía bien.

### Slice 3 — Que el CI lo note *(futuro)*

- Una comprobación que falle si la base tiene datos de prueba al terminar el pipeline.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El barrido borra contenido real | El prefijo es explícito y se verifica contra la base que ninguna publicación real lo lleva, antes de activarlo |
| `globalTeardown` deja la suite en rojo por un residuo ajeno | Es el objetivo: un residuo debe verse. El mensaje dice qué quedó y cómo borrarlo |
| Los specs que comparan el título literalmente | El marcador va en el slug, no en el título |

## Enfoque de pruebas

- **Unit (Vitest):** `testSlug` y el predicado del barrido — que reconozca lo de prueba y **no**
  reconozca un slug real.
- **Integración:** el barrido contra la base, sembrando y comprobando que borra lo suyo y solo lo
  suyo.
- **Behavior (Playwright):** la suite completa sigue verde, y `globalTeardown` falla a propósito
  cuando se le deja un residuo.
