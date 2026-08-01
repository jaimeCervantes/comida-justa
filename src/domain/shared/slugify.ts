/**
 * Convierte un texto en un identificador apto para una URL.
 *
 * Vive en `shared` porque lo usan dos cosas que no se conocen entre sí: el slug de una
 * publicación (`PostEntity.generateSlug`) y la dirección de una tienda
 * (`generateSellerHandle`). Son namespaces distintos —`/jugo-verde` vs `/tienda/hazlo-sano`—
 * pero la regla de qué caracteres sobreviven es la misma, y duplicarla significaría que un día
 * dejen de coincidir sin que nadie lo note.
 */
export function slugify(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD") // separa cada letra acentuada en su forma base + el diacrítico
    .replace(/[̀-ͯ]/g, "") // y aquí se va el diacrítico
    .replace(/[^a-z0-9]+/g, "-") // todo lo que no es letra ni número se vuelve un guion
    .replace(/(^-|-$)+/g, ""); // sin guiones sueltos en los extremos
}
