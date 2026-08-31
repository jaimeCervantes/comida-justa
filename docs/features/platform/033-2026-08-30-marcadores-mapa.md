# Marcadores modernos para el mapa de tiendas

## Alineación

- **Problem:** los marcadores actuales del mapa son emojis (`🏪` para tienda y `📍` para visitante).
  Se ven poco consistentes, dependen del render del sistema operativo y no destacan lo suficiente
  contra los tonos verdes del mapa.
- **Savings:** se reduce la fricción visual al distinguir rápidamente dónde está la persona y dónde
  están las tiendas, especialmente cuando hay varias sucursales cerca.
- **Why:** el mapa existe para decidir a qué tienda acercarse; si los marcadores no se leen de un
  vistazo, la capa más importante del mapa pierde valor.

## Slice 1 - Pines de tienda y visitante con identidad propia

### Alcance

- Reemplazar los emojis de `StoresMapCanvas` por marcadores HTML/CSS propios.
- Usar dos colores claramente distintos al mapa y entre sí:
  - visitante: azul intenso, para "mi ubicación";
  - tienda: magenta/coral intenso, para puntos accionables del comercio.
- Usar siluetas simples y profesionales dentro del pin, no emoji.
- Mantener `divIcon` para evitar los assets por defecto de Leaflet.
- No cambiar lógica de ubicación, encuadre, popups, rutas ni mapas de recorrido GPX.

### Criterios de aceptación

- El mapa de tiendas renderiza un marcador de visitante y uno de tienda con clases semánticas
  distintas.
- Los marcadores no contienen emojis ni dependen del set gráfico del sistema operativo.
- Los colores calculados del marcador de visitante y de tienda son diferentes entre sí y diferentes
  al color verde dominante del mapa.
- Los popups y enlaces existentes siguen funcionando.
- Las pruebas unitarias, typecheck, lint y la E2E scoped de `localProducers` quedan verdes o se
  reporta explícitamente cualquier bloqueo.
