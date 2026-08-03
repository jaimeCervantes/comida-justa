export default interface IOrphanPostRepository {
  /**
   * Cuelga de la tienda recién abierta lo que su dueño ya había publicado sin ella.
   *
   * Devuelve cuántas adoptó. Solo toca las de ese usuario que están **sin tienda**: una publicación
   * que ya cuelga de otra no se mueve, porque el `seller_id` de otro no es un hueco que rellenar.
   */
  adoptOrphansOf(userId: string, sellerId: string): Promise<number>;
}
