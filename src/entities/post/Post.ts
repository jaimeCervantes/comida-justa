export default class PostEntity {
  createFilePath(type: string, fileName: string, sourceDir = "posts"): string {
    return `${sourceDir}/${type}/${fileName}`;
  }

  generateSlug(title: string) {
    const slug = title
      .toLowerCase()
      .normalize("NFD") // Normal Form Decomposition, convierte un character en dos o más, por ejemplo, su forma base y su acento
      .replace(/[\u0300-\u036f]/g, "") // Remueve los acentos de las letras (diacríticos)
      .replace(/[^a-z0-9]+/g, "-") // Remueve los carácteres que no sean letras o números, (incluyendo acentos)
      .replace(/(^-|-$)+/g, ""); // Remueve los guiones al inicio y al final

    return slug;
  }
}