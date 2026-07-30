import type { CategoryTaxonomySnapshot } from "~/domain/entities/post/taxonomy";

export default interface ICategoryTaxonomyRepository {
  /**
   * El catálogo completo. Se lee entero y de una vez: son 7 nodos y 14 etiquetas, así que traerlo
   * todo cuesta menos que unirse a él en cada consulta.
   *
   * **No lanza.** Si la base no responde o devuelve cero filas, la implementación degrada a una
   * instantánea conocida: una tabla de 14 filas no debe ser capaz de tumbar la portada, y el sitio
   * tiene que poder desplegarse antes de que la migración corra.
   */
  loadSnapshot(): Promise<CategoryTaxonomySnapshot>;
}
