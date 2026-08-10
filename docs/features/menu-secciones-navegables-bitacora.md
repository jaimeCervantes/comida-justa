# Bitácora: portadas navegables desde el menú principal

## 2026-08-10 - Slice 1: separar destino y exploración

### Objetivo

Hacer que «Comunidad» y «4 Pilares» lleven directamente a sus portadas sin perder los submenús que
permiten explorar publicaciones, productos, secciones y cada pilar.

### Decisiones y racional

- Cada entrada principal quedó como un control dividido real: el texto es un enlace y la flecha es
  un botón independiente. Así no hay un mismo control que unas veces navega y otras despliega.
- «Comunidad» enlaza al inicio porque esa página ya es el feed comunitario. No se creó
  `/comunidad`: una segunda portada sin contenido propio duplicaría el propósito del home.
- «4 Pilares» usa el `href` tipado del catch-all con un `slug` vacío. Esto conserva automáticamente
  `/pilares` en español y `/en/pillars` en inglés.
- El árbol móvil ganó una entrada `section`, distinta de los enlaces y de los paneles puros. Esa
  diferencia deja explícito que el título navega mientras su flecha baja un nivel.
- Las flechas reciben nombres traducidos como «Abrir el submenú de 4 Pilares». Un lector de pantalla
  puede distinguir entrar a la sección de explorar sus destinos.

### Archivos tocados

- **Cabecera:** `src/presentation/chrome/Header/Nav.tsx`, `MobileNav.tsx`, `menuItems.ts`,
  `mobileMenuTree.ts`.
- **Catálogos:** `src/i18n/messages/es.json`, `src/i18n/messages/en.json`.
- **Pruebas:** `src/presentation/chrome/Header/mobileMenuTree.test.ts`,
  `src/e2e/menu/sectionLinks.spec.ts`.
- **Especificación y documentación:** `src/e2e/menu/sectionLinks.feature`,
  `docs/features/menu-secciones-navegables.md`.

### Comandos clave

```bash
pnpm exec vitest run src/presentation/chrome/Header/mobileMenuTree.test.ts
pnpm exec playwright test src/e2e/menu/sectionLinks.spec.ts
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run check:i18n
pnpm run test:e2e:run
pnpm exec biome check <archivos del slice>
git diff --check
```

### Resultados de validación

- La E2E nueva empezó roja: no encontraba ninguno de los enlaces ni botones que todavía no
  existían. Después de implementar, los **10/10 casos** quedaron verdes en escritorio, móvil,
  español e inglés.
- La prueba dirigida del árbol móvil quedó en **8/8 pruebas verdes**.
- `pnpm run test:run`: **1,211/1,211 pruebas verdes**, 124 archivos.
- `pnpm run typecheck`: exit 0. Dos servidores de desarrollo interrumpidos dejaron truncados
  `.next/dev/types/routes.d.ts` y `validator.ts`; se eliminaron únicamente esos artefactos generados
  y la repetición final pasó.
- `pnpm run lint`: exit 0, con una información preexistente por el fragmento redundante de
  `src/app/[locale]/admin/productos/ui/IndexingStatusPanel.tsx`.
- `pnpm run check:i18n`: limpio. Los catálogos `es` y `en` conservan la misma estructura.
- La ejecución dirigida de Biome y `git diff --check`: limpios.
- `pnpm run test:e2e:run`: **incompleto**. Planeó 235 casos y alcanzó el inicio del 143 antes del
  timeout de 15 minutos. Los diez casos nuevos, ejecutados del 109 al 118, pasaron. La corrida llevaba
  15 fallos ajenos al slice, concentrados en búsquedas que devolvían resultados vacíos; también
  volvió a registrar la FK ausente al guardar traducciones.
- La E2E escribió fixtures en la base compartida. Tras el timeout se ejecutó manualmente el teardown
  oficial, que barrió y contó los datos de prueba sin advertencias ni error: quedaron **0
  publicaciones, 0 categorías, 0 sucursales, 0 tiendas y 0 direcciones personales E2E**. No quedó
  nada que deshacer.

### Desviaciones del roadmap

- No cambió el modelo ni se añadió `/comunidad`.
- Los enlaces de las tarjetas del submenú de escritorio incluyen título y descripción en su nombre
  accesible. La prueba busca el título dentro de ese nombre completo en vez de exigir una igualdad
  que no representa el árbol de accesibilidad real.
- La suite E2E global no terminó por duración y fallos de búsqueda ya observados fuera de este slice;
  la cobertura específica sí se ejecutó completa dos veces y quedó verde.

### Seguimiento

- Conviene revisar visualmente que el área del título y la flecha se perciban como un mismo grupo con
  dos acciones, especialmente en móvil.
- Los fallos de búsqueda y la carrera de traducción deben diagnosticarse en tareas separadas; no
  afectan la navegación entregada aquí.

### Recap

«Comunidad» lleva ahora al feed del inicio y «4 Pilares» a la portada de pilares, en el idioma activo
y tanto en escritorio como en móvil. Sus flechas siguen abriendo los mismos submenús mediante botones
independientes y accesibles. La cobertura específica, Vitest, tipos, lint e i18n están verdes; la E2E
global volvió a quedar incompleta por incidencias externas, pero ejecutó y aprobó los diez casos del
slice y dejó la base compartida limpia.

### Próximos pasos (opciones)

1. **Revisión visual:** comprobar en escritorio y teléfono que el título se reconoce como enlace y la
   flecha como acceso al submenú.
2. **Deuda separada:** diagnosticar los resultados vacíos de búsqueda y la FK de traducciones que
   impiden completar la suite global.
3. **Portada futura:** considerar `/comunidad` solo cuando exista contenido introductorio propio que
   no duplique el feed del inicio.

## 2026-08-10 - Slice 2: el indicador nace del control completo

### Objetivo

Corregir la separación visual detectada en escritorio: acercar la flecha verde a «Comunidad» y «4
Pilares», centrar el triángulo blanco bajo cada conjunto y hacer que ese triángulo toque el submenú.

### Decisiones y racional

- El enlace y el botón siguen siendo controles distintos. Juntarlos visualmente no justifica perder
  la navegación directa ni volver a un botón con dos comportamientos ambiguos.
- Se eliminó el indicador global de Radix porque su posición se calcula desde el `Trigger`, que ahora
  es únicamente la flecha. Por eso apuntaba al extremo derecho y no al centro del conjunto.
- Cada control dibuja su propio triángulo desde un contenedor relativo que abarca título y flecha.
  Su centro depende del conjunto completo y no de la longitud del texto ni del botón aislado.
- El triángulo es un borde CSS anclado al borde superior del viewport. Así no queda una franja entre
  la punta y el panel, en tema claro ni oscuro.
- El espacio visible entre texto y caret se redujo a 4 píxeles. La prueba admite hasta 8 para evitar
  fragilidad por redondeos de subpíxel, pero mide las cajas reales del navegador.
- El menú móvil no cambió: la observación y el problema estaban en la barra de escritorio.

### Archivos tocados

- **Cabecera:** `src/presentation/chrome/Header/Nav.tsx`.
- **Prueba y especificación:** `src/e2e/menu/sectionAlignment.spec.ts`,
  `src/e2e/menu/sectionAlignment.feature`.
- **Documentación:** `docs/features/menu-secciones-navegables.md`,
  `docs/features/menu-secciones-navegables-bitacora.md`.

### Comandos clave

```bash
pnpm exec playwright test src/e2e/menu/sectionAlignment.spec.ts
pnpm exec playwright test src/e2e/menu/sectionAlignment.spec.ts src/e2e/menu/sectionLinks.spec.ts
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run check:i18n
pnpm run test:e2e:run
pnpm exec biome check src/presentation/chrome/Header/Nav.tsx src/e2e/menu/sectionAlignment.spec.ts
git diff --check
```

### Resultados de validación

- La E2E geométrica empezó roja en **2/2 casos** porque aún no existían un indicador por control ni
  una caja propia para medir el título.
- La E2E específica quedó en **2/2 casos verdes** para «Comunidad» y «4 Pilares»: distancia
  título/caret menor o igual a 8 píxeles, desviación del centro menor o igual a 2 y separación con el
  submenú menor o igual a 1.
- La regresión completa del menú quedó en **12/12 casos verdes**, incluidos enlaces, rutas en inglés,
  despliegues, móvil y la nueva geometría.
- `pnpm run test:run`: **1,211/1,211 pruebas verdes**, 124 archivos.
- `pnpm run typecheck`: exit 0.
- `pnpm run lint`: exit 0, con la información preexistente sobre el fragmento redundante de
  `IndexingStatusPanel.tsx`.
- `pnpm run check:i18n`, Biome dirigido y `git diff --check`: limpios.
- `pnpm run test:e2e:run`: **incompleto**. Planeó 237 casos y alcanzó el inicio del 155 antes del
  timeout de 15 minutos. Los doce casos del menú, ejecutados del 109 al 120, pasaron. Los dos fallos
  observados antes del corte fueron el proveedor de Google ausente en `createPost.spec.ts` y una
  carga incremental que no añadió tarjetas en `loadMorePosts.spec.ts`; también hubo mensajes de
  conexión abortada y de la FK de traducciones, ajenos a este ajuste.
- La E2E escribió en la base compartida. Como el timeout impidió el teardown, el barrido oficial
  eliminó **1 publicación y 1 dirección personal E2E**; su conteo posterior quedó en **0
  publicaciones, 0 categorías, 0 sucursales, 0 tiendas y 0 direcciones personales de prueba**. No
  quedó nada que deshacer.

### Desviaciones del roadmap

- No cambió el alcance: solo se tocó escritorio y se conservaron los dos comportamientos del control.
- El indicador dejó de usar el componente global de Radix. Mantenerlo habría hecho imposible
  centrarlo sobre el conjunto sin volver a convertir todo el elemento en un único botón.
- La suite E2E global no terminó por duración e incidencias externas; la cobertura específica se
  ejecutó completa tres veces y la regresión del menú una vez, todas verdes.

### Seguimiento

- La comprobación pendiente es subjetiva: comparar la barra desplegada con la captura original en un
  dispositivo real y confirmar que la cercanía visual esperada coincide con la medida acordada.
- Los fallos de Google, carga incremental, conexión y FK deben permanecer en tareas separadas.

### Recap

En escritorio, «Comunidad» y «4 Pilares» conservan su enlace y su botón independiente, pero ahora se
leen como un solo control: el caret queda junto al título y el triángulo blanco nace del centro del
conjunto y toca el panel abierto. La geometría está protegida por Playwright para ambos elementos; la
regresión del menú, Vitest, tipos, lint e i18n están verdes, y la base compartida quedó limpia tras la
suite global incompleta.

### Próximos pasos (opciones)

1. **Revisión visual final:** abrir ambos submenús en escritorio y confirmar que la composición se ve
   unida también en el dispositivo objetivo.
2. **Ajuste fino:** si se desea aún menos espacio, reducir el único padding izquierdo de 4 píxeles del
   botón y mantener las mismas pruebas geométricas.
3. **Deuda separada:** diagnosticar el proveedor de Google, la carga incremental y la carrera de
   traducciones observados en la suite global.
