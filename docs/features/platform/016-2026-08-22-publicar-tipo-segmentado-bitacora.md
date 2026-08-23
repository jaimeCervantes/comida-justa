# Bitácora — «¿Qué publicas?» en píldoras

> Fuente: `Hazlo Sano — Sistema de diseño v2`, sección **5.3 · publicar**, el control del tipo.
> Continúa [015 — el título y el precio](015-2026-08-22-publicar-titulo-y-precio-bitacora.md).

---

## Slice 4 — El último control del 5.3 (2026-08-22)

### Por qué píldoras y no un desplegable

Cuatro opciones no se esconden detrás de un clic. Y esta no es una opción cualquiera: es la
**primera decisión del formulario** y la que decide qué campos aparecen después —precio, fecha,
duración, procedencia—, así que verlas todas ahorra el «a ver qué sale si elijo esto».

**Por dentro son radios de verdad, no botones con `aria-pressed`.** Un grupo de botones habría
quedado igual y habría perdido tres cosas que aquí vienen gratis:

- las flechas del teclado navegan entre opciones;
- el `<fieldset>`/`<legend>` hace que un lector de pantalla anuncie «¿qué publicas?, 2 de 4»;
- el valor viaja en el `FormData` sin que nadie lo copie a un campo oculto.

El radio se esconde con `sr-only` —no con `display:none`, que lo sacaría del árbol de accesibilidad
y del foco— y la píldora se pinta con `peer-checked`. El anillo de foco se escribe a mano en vez de
usar la utilidad `focus-ring`, porque aquélla está atada al `:focus-visible` **del propio elemento**
y aquí quien recibe el foco es el hermano; los valores son los mismos tokens.

`SegmentedField` vive en el design system y no en `/publicar`: la forma «elige una de pocas» volverá
a aparecer —el filtro de tipo del buscador es exactamente esto.

### El orden no es el del dominio

`POST_KINDS` empieza por `anuncio` porque es el que cae por omisión. El 5.3 empieza por producto,
evento y servicio y deja el anuncio al final, y se sigue: es la misma decisión que se tomó al quitar
los enlaces de contenido de la portada. El anuncio es el cajón de lo que no es ninguno de los otros
tres, y ponerlo primero invitaría a elegirlo sin mirar el resto.

Lo que **sí** sale del dominio es la lista: una prueba comprueba que están los cuatro y solo los
cuatro, así que sumar un tipo en `POST_KINDS` sin ofrecerlo aquí se pone rojo en vez de dejar un
tipo que existe y no se puede elegir.

### Un solo sitio que sabe elegir el tipo

Cambiar un `<select>` por radios tocaba **seis** consumidores: dos ayudantes de Vitest, tres page
objects y dos specs. Ahora hay uno para cada mundo —`chooseKind` en `publishFormHarness` y
`choosePublishKind` en `testUtils`—, los dos derivados de `publishKindTestId`. La próxima vez que
esta forma cambie tocará uno.

`choosePublishKind` reintenta hasta que la píldora se declara elegida, por lo mismo que
`selectWhenHydrated` del slice anterior: es un control de React servido desde el servidor, y un clic
antes de la hidratación no avisa a nadie.

### Lo que salió a la luz de paso

Correr los directorios que tocan `/publicar` destapó **cuatro escenarios rotos desde el slice 1** —el
del asistente— que nunca se habían ejecutado: `unifiedCatalog` (dos) y `eventos` (dos). Todos por lo
mismo: afirmaban `toBeVisible()` sobre campos que ahora viven en otro paso. La corrección no relaja
la aserción, cambia **dónde se mira**: se abre el paso del campo y se comprueba allí. «No se
pregunta» sigue siendo `toHaveCount(0)`, que no depende de ningún paso.

`UnifiedCatalogPage.fill` no cruzaba el asistente en absoluto y su `submit()` buscaba un botón que
solo existe en el último paso. Ahora cruza, y decide si toca precio con `publishShowsPrice` —la
regla del formulario— en vez de con una lista propia.

### Por qué no se vio antes

**`tsconfig.json` excluye `**/*.spec.ts` y `**/*.test.ts(x)`.** `typecheck` y `lint` dan verde con un
identificador sin importar dentro de un spec; dos de ellos reventaron en la e2e con
`ReferenceError: choosePublishKind is not defined`. Lo que sí cubre `tsc` son los page objects, que
por eso fallaron al compilar y se arreglaron antes de correr nada. Es un argumento más para que la
lógica viva en el page object y el spec solo afirme.

### Archivos tocados

**Nuevos**
- `design_system/forms/SegmentedField.tsx`
- `publicar/publishKinds.ts` · `publishKinds.test.ts`
- `src/e2e/testUtils/choosePublishKind.ts`
- `src/e2e/publicar/tipoSegmentado.feature` · `tipoSegmentado.spec.ts`

**Modificados**
- `publicar/PublishForm.tsx` — el `Select` pasa a `SegmentedField`
- `publicar/publishFormHarness.ts` — `chooseKind`
- `publicar/PublishForm.test.tsx` · `PublishForm.validation.test.tsx` · `tituloYPrecio.test.tsx`
- `src/e2e/{createPost,publishProduct,unifiedCatalog}/…Page.ts`
- `src/e2e/{adminCatalog,unifiedCatalog,validacionFormularios,eventos}/….spec.ts`

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/app/[locale]/publicar"` | **90 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (998 archivos) |
| `publicar`, `createPost`, `publishProduct`, `filtroAlPublicar`, `dimensionesMedia` | **28 en verde**, 1 saltada |
| `unifiedCatalog` | **7/7** |
| `eventos` | **12/12** |
| `pilares`, `serviceBooking`, `multimedia`, `adminCatalog`, `createSession`, `about`, `home` | en verde en la misma tanda |

### Recap

El tipo se elige viendo las cuatro opciones, con radios de verdad y su navegación de teclado. Quién
sabe elegirlo es un archivo por mundo, no seis. Y de paso quedaron verdes cuatro escenarios que el
asistente había roto en silencio porque nadie los había vuelto a correr.

Con esto, la pantalla 5.3 del canvas está entera: asistente, vista previa, checklist, contador,
moneda y tipo segmentado.

### Próximos pasos (opciones)

1. **Seguir con el resto de secciones del canvas.**
2. **Adoptar en la hidratación lo que ya esté elegido** en `kind`/`category`, y cerrar la limitación
   anotada en la bitácora 014.
3. **Reusar `SegmentedField` en el filtro de tipo del buscador**, que es la misma forma.
