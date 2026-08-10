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
