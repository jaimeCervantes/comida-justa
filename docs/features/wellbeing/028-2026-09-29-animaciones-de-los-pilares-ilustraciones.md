# Ilustraciones de las animaciones de los pilares

> Acompaña al roadmap `028-2026-09-29-animaciones-de-los-pilares.md`. Aquí vive **cómo se hacen**
> las ilustraciones, para que las animaciones de cada pilar (slices 3–6) salgan con el mismo estilo
> y los mismos personajes.

## Por qué ilustraciones generadas

El usuario pidió un acabado «de agencia internacional de diseño», con personajes e imágenes que no
parezcan de PowerPoint. Con vectores escritos a mano el techo quedó a la vista: por mucho pulido que
reciban, las figuras geométricas siguen pareciendo de presentación. La calidad de estudio sale de
ilustraciones de verdad; el trabajo del código es la dirección de arte y el movimiento.

## Dirección de arte

- **3D suave de arcilla**, la misma estética del logo (el corazón rojo con hojas). Elegido por el
  usuario frente a «3D cinematográfico tipo Pixar» y «2D editorial».
- **México y Latinoamérica**: milpa, adobe, rebozo, mercado, barrio.
- **Sin texto** en la imagen: ni letras, ni números, ni carteles. Los subtítulos van fuera del cuadro
  y en dos idiomas; un texto pintado no se traduce.
- **Lo importante en el 70 % central**: en un teléfono el escenario es 4:3 y recorta los lados.
- **La mascota solo abre y cierra.** El logo va como referencia de estilo en todas las indicaciones,
  y el modelo tiende a meter al corazón en cualquier escena. En las intermedias hay que prohibirlo
  explícitamente («do not include the heart mascot…»), o aparece.

## Personajes

Se generan primero en una hoja (`cast`), y esa hoja va como referencia en cada escena donde salen:

| Personaje | Rasgos |
|---|---|
| Ana | ~30 años, piel morena clara, pelo negro largo, suéter coral, pantalón azul marino |
| Leo | ~35 años, piel morena oscura, pelo corto, camiseta verde azulado, jeans |
| Abuela Rosa | ~70 años, pelo cano en chongo, blusa terracota, rebozo a rayas, falda café |
| Tomás | ~8 años, pelo rizado, camiseta mostaza, short azul, tenis rojos |

## Proceso

1. **Indicaciones** en `scripts/animations/pillars-overview.manifest.json`: la dirección de arte
   común (`style`), el logo como referencia de todas y una entrada por ilustración. La hoja de
   personajes es la primera; las escenas la citan como `cast.jpg`. Una escena puede citar a otra
   (el amanecer en el cuarto usa el cuarto de noche para que sea el mismo).
2. **Generación** con Gemini 3 Pro Image (`gemini-3-pro-image`, 2K, 16:9):
   `node scripts/animations/generate-illustrations.mjs scripts/animations/pillars-overview.manifest.json <carpeta> [ids]`.
   Usa `GEMINI_API_KEY` y **tiene costo**: ~0,13 USD por imagen con la tarifa publicada en 2025.
   Primero la hoja (`cast`), luego las escenas, y al final las que dependen de otra escena.
3. **Revisión a ojo**, una por una: personajes correctos, sin texto, sin mascota fuera de lugar.
   Las que fallan se regeneran con la instrucción que faltaba (no se retocan).
4. **Preparación para la web**:
   `node scripts/animations/prepare-illustrations.mjs <carpeta>` escribe
   `public/animations/pilares/<id>-{960,1440,1920}.webp` (el proyecto sirve las imágenes sin
   optimizar, así que los anchos se preparan aquí).
5. **Escena** en `src/presentation/habits/animations/overviewScenes.ts`: una ilustración por
   subtítulo, su movimiento de cámara y sus efectos (brasas, estrellas, polvo, rayos, ondas, vapor,
   resplandores), anclados con coordenadas medidas sobre la ilustración en %. Para medirlas sirve
   superponer una cuadrícula al 10 % a una copia reducida.

## Lo que costó la animación de los cuatro pilares

18 ilustraciones más 3 regeneraciones (dos escenas con la mascota colada y una con Tomás donde
tocaba Leo): 21 imágenes, ≈ 2,8 USD. Pesan 3,6 MB entre los 51 archivos WebP; en un teléfono se
descargan los de 960 px, ~36 KB cada uno (los de 1920 px, ~100 KB).
