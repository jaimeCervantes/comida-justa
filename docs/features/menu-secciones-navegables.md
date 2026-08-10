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

No hay slices futuros: el cambio queda completo al separar ambos comportamientos en los dos menús.
