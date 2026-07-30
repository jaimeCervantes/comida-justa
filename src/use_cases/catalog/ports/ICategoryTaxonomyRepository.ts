import type { CategoryTaxonomySnapshot } from "~/domain/entities/post/taxonomy";
import type { NewCategoryInput } from "~/domain/entities/post/newCategory";

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

  /**
   * Da de alta una categoría con sus etiquetas, en una sola transacción: una categoría sin
   * traducción se vería por su clave, y eso es peor que no haberla creado.
   *
   * A diferencia de la lectura, **sí lanza**: quien la llama está esperando en un formulario y
   * necesita saber si se guardó.
   */
  createCategory(input: NewCategoryInput): Promise<void>;

  /**
   * Activa o desactiva una categoría.
   *
   * Desactivar la saca del selector y de los filtros, pero **no toca las publicaciones que ya la
   * usan**: siguen mostrando su etiqueta. Es la operación reversible frente a borrar, que el FK
   * impide en cuanto haya un producto colgando.
   */
  setCategoryActive(key: string, isActive: boolean): Promise<void>;
}
