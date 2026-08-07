/**
 * Quita comentarios de un archivo TypeScript/TSX antes de escanear su código.
 *
 * Este repo documenta en español y cita a menudo el código que vino a arreglar —una clase rota, un
 * literal mal puesto—, así que cualquier escáner que mire el texto crudo se tropieza con su propia
 * documentación. Lo usan `checkI18n.ts` (donde un comentario en español es documentación, no
 * interfaz) y `pilaresData.test.ts` (donde el comentario cita las clases podridas como ejemplo).
 */
export function stripComments(source: string): string {
  /* Se vacía el comentario **conservando sus saltos de línea**. Borrarlo entero colapsaba el
     archivo, así que a partir del primer bloque de varias líneas —un JSDoc, por ejemplo— los
     números de línea del reporte dejaban de corresponder con los del archivo, y la marca
     `// i18n-ignore` se comparaba contra la línea equivocada. */
  const blank = (comment: string): string => comment.replace(/[^\n]/g, "");

  return (
    source
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, blank)
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      // También el comentario que va al final de una línea de código, no solo el que la ocupa entera.
      .replace(/\/\/.*$/gm, "")
  );
}
