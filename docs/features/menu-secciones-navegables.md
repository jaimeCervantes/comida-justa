# Portadas navegables desde el menú principal

## Alineación

- **Problem:** «Comunidad» y «4 Pilares» parecen destinos principales, pero hoy el clic solo abre
  su desplegable. Esto impide llegar directamente a la portada de pilares y deja ambiguo dónde
  comienza la comunidad.
- **Savings:** se ahorran clics y frustración al convertir cada título en una puerta predecible, sin
  perder el acceso rápido a sus destinos específicos.
- **Why:** la navegación principal debe llevar a los puntos de entrada canónicos del sitio y, a la
  vez, permitir explorar su jerarquía.

## Modelo acordado

Cada sección se presenta como un control dividido: el título es un enlace y la flecha adyacente abre
el submenú. «4 Pilares» lleva a `/pilares`; «Comunidad» lleva al inicio `/`, que ya es el feed de
publicaciones de la comunidad. No se crea `/comunidad` mientras no exista contenido propio que
justifique otra portada. El mismo modelo se aplica en escritorio y móvil y conserva el idioma activo.

## Roadmap

### Slice 1 - Separar destino y exploración

**Alcance**

- Convertir los títulos «Comunidad» y «4 Pilares» del menú principal en enlaces a sus portadas.
- Mantener una flecha accesible e independiente para abrir cada submenú.
- Aplicar la misma semántica en escritorio y móvil.
- Conservar las entradas y destinos actuales de ambos submenús.
- Conservar el idioma activo al navegar.

**Criterios de aceptación**

- Desde otra página, «4 Pilares» lleva a `/pilares` en español y a `/en/pillars` en inglés.
- Desde otra página, «Comunidad» lleva a `/` en español y a `/en` en inglés.
- La flecha de cada sección abre su submenú sin cambiar la dirección actual.
- Los submenús siguen ofreciendo los cuatro pilares y los destinos visibles de Comunidad.
- Los enlaces y las flechas tienen nombres accesibles que distinguen navegar de desplegar.

### Slice 2 - Unir visualmente el control y su submenú

**Alcance**

- Ajustar únicamente el menú de escritorio; el menú móvil conserva su distribución actual.
- Acercar la flecha verde al título sin volver a mezclar sus acciones.
- Centrar el triángulo blanco bajo el conjunto formado por título y flecha verde.
- Unir visualmente el triángulo blanco con el borde superior del submenú.

**Criterios de aceptación**

- Entre el final del título y el inicio de la flecha verde hay como máximo 8 píxeles.
- El centro horizontal del triángulo blanco difiere como máximo 2 píxeles del centro del control
  completo.
- El triángulo blanco toca el borde superior del submenú, con una separación máxima de 1 píxel.
- «Comunidad» y «4 Pilares» conservan sus enlaces, botones accesibles y destinos actuales.

No hay slices futuros: la navegación queda completa al corregir la cohesión visual detectada en uso.
