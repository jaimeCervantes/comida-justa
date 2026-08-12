/**
 * Las secciones de comunidad —el jardín y las celebraciones— se pintan enteras cuando tienen la
 * página para ellas, y en versión corta cuando comparten una fila con otra sección. Es una sola
 * decisión de espacio, así que es un solo tipo y no tres uniones iguales repartidas.
 */
export type CommunitySectionVariant = "full" | "compact";
