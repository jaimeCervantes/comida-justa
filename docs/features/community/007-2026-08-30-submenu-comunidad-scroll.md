# Scroll interno del submenú de Comunidad

## Alineación

- **Problem:** el submenú de Comunidad en escritorio ya es más alto que el viewport y oculta el enlace
  final a `/nosotros`; crecerá más cuando entren nuevas categorías.
- **Savings:** se evita frustración al navegar, se reduce el riesgo de enlaces inaccesibles y se deja
  preparada una superficie que puede crecer sin volver a tocar la cabecera.
- **Why:** Comunidad es la puerta principal a lo publicado por la gente; su menú debe seguir siendo
  completo y alcanzable aunque el catálogo de categorías aumente.

## Slice 1 - Submenú completo con scroll interno

### Alcance

- Limitar la altura visible del desplegable de Comunidad en escritorio según el viewport.
- Agregar scroll vertical interno al panel completo, no a una subsección aislada.
- Mantener visibles y navegables las entradas actuales, incluido `Nosotros`.
- Dar al scroll una apariencia discreta y consistente con la superficie clara del menú.
- Preservar la geometría actual del control: título, flecha, triángulo y panel siguen alineados.

### Criterios de aceptación

- Al abrir Comunidad en escritorio, el panel no rebasa el viewport visible.
- El panel tiene overflow vertical desplazable cuando su contenido no cabe.
- El enlace `Nosotros` se puede alcanzar desplazando el contenido interno del submenú.
- El cambio no afecta el submenú de 4 Pilares ni el menú móvil.
- Las pruebas de menú, typecheck y lint quedan verdes o se reporta explícitamente cualquier bloqueo.

## Slice 2 - Nosotros como enlace principal del submenú

### Alcance

- Mover `Nosotros` al primer bloque del submenú de Comunidad en escritorio.
- Mantenerlo junto a `Publicaciones`, `Productos y servicios` y `Eventos`.
- Eliminar el bloque final separado que dejaba `Nosotros` aislado visualmente.
- Preservar el scroll interno agregado en el slice 1.

### Criterios de aceptación

- Al abrir Comunidad en escritorio, `Nosotros` aparece antes del encabezado `Por categoría`.
- `Nosotros` comparte el mismo grupo visual que `Publicaciones`, `Productos y servicios` y
  `Eventos`.
- El submenú sigue teniendo scroll interno cuando su contenido no cabe.
- Las pruebas de menú, typecheck y lint quedan verdes o se reporta explícitamente cualquier bloqueo.
