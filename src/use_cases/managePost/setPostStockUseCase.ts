import { canManagePost } from "~/domain/entities/post/postPermissions";
import {
  availabilityForStock,
  canTrackStock,
  parseStockQuantity,
} from "~/domain/entities/post/stock";
import type IPostAdminRepository from "./ports/IPostAdminRepository";

export interface SetPostStockInput {
  postId: string;
  /** De la sesión. */
  userId: string;
  /** El de su tienda, ya resuelto con `findSellerOfUser`. **Nunca del formulario.** */
  sellerId: string | null;
  /** Tal como se escribió en el campo: validarlo es parte del trabajo, no una precondición. */
  quantity: string;
}

export type SetPostStockError =
  /** No existe, o no es de quien pide. Los dos se ven igual desde fuera. */
  | "not-allowed"
  /** Existe y es suyo, pero no se entrega en piezas: un servicio, un evento, un anuncio. */
  | "not-trackable"
  /** Lo que se escribió no es un número de ejemplares. */
  | "invalid-stock";

export type SetPostStockResult =
  | { stockQuantity: number; error?: undefined }
  | { stockQuantity?: undefined; error: SetPostStockError };

/**
 * Fija cuántas unidades quedan de un producto.
 *
 * Es lo que le faltaba a `posts.is_available`, que sólo sabía decir sí o no: quien vende no tenía
 * dónde anotar cuántas donas le quedaban y se enteraba de que se acabaron cuando ya había
 * prometido una que no tenía.
 *
 * **Escribe dos columnas de una vez, y esa es la decisión central.** `is_available` es la que ya
 * leen el chatbot, el carrito, la búsqueda y el JSON-LD; en un producto con inventario se deriva
 * del número (`availabilityForStock`) y viaja con él en la misma sentencia. Separarlas dejaría
 * abierta la ventana en la que un producto en cero sigue anunciándose.
 *
 * **Autoriza por dos vías** (`canManagePost`): quien publicó, y el dueño de la tienda que lo vende.
 *
 * Devuelve **códigos, no frases**, como `AdvanceOrderUseCase`: la traducción es cosa de quien pinta,
 * que es el único que sabe en qué idioma está mirando la persona.
 */
export default class SetPostStockUseCase {
  constructor(private readonly postRepository: IPostAdminRepository) {}

  async execute({
    postId,
    userId,
    sellerId,
    quantity,
  }: SetPostStockInput): Promise<SetPostStockResult> {
    const post = await this.postRepository.findById(postId);

    /* Una publicación ajena se responde igual que una que no existe: quien lo intenta no debe poder
       averiguar si el id es bueno. */
    if (!post || !canManagePost(post, { userId, sellerId })) {
      return { error: "not-allowed" };
    }

    if (!canTrackStock(post)) return { error: "not-trackable" };

    const parsed = parseStockQuantity(quantity);
    if (parsed.error) return { error: "invalid-stock" };

    await this.postRepository.setStock({
      postId,
      quantity: parsed.quantity,
      isAvailable: availabilityForStock(parsed.quantity),
    });

    return { stockQuantity: parsed.quantity };
  }
}
