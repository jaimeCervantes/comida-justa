import {
  buildCartLines,
  type CartSellerGroup,
  groupBySeller,
} from "~/domain/cart/cart";
import type { CartSelection } from "~/domain/cart/cartSelection";
import type { CartProductRepository } from "~/domain/cart/ports";
import { areValidCoordinates } from "~/domain/entities/seller/coordinates";
import type { Order } from "~/domain/order/order";
import type {
  NewOrder,
  NewOrderLine,
  OrderRepository,
} from "~/domain/order/ports";

export interface PlaceOrderInput {
  selection: readonly CartSelection[];
  buyerId: string;
  locale: string;
  fallbackLocale: string;
  /** Qué tienda se confirma. El resto del carrito se queda donde está. */
  sellerId: string;
  /**
   * La compra de la que este pedido forma parte.
   *
   * **Lo pone quien llama, y es el mismo para todas las tiendas del carrito.** Antes se generaba
   * aquí dentro, uno por ejecución, así que confirmar dos tiendas daba dos checkouts y el campo no
   * hermanaba nada — que era justo para lo que existía.
   */
  checkoutId: string;
  /**
   * A dónde se entrega, si el navegador lo dio a tiempo en el mismo clic de confirmar. De mejor
   * esfuerzo: si falta o no es una coordenada real, el pedido se crea igual, sin destino — nunca se
   * pierde un pedido por no saber a dónde va, eso se sigue arreglando por WhatsApp.
   */
  deliveryLocation?: { lat: number; lng: number } | null;
}

export type PlaceOrderResult =
  | { order: Order; orderedPostIds: string[] }
  | { error: PlaceOrderError };

export type PlaceOrderError =
  /** Ese vendedor no tiene nada en el carrito: la pantalla se quedó vieja o alguien forzó el envío. */
  | "empty-for-seller"
  /** Tiene renglones, pero todos se agotaron entre que se añadieron y ahora. */
  | "nothing-available";

/**
 * Convierte lo que hay en el carrito de **una** tienda en un pedido.
 *
 * Los precios se releen de la base aquí mismo y se **copian** al renglón: es el momento exacto en
 * que el precio deja de ser el de hoy y pasa a ser el del pedido. Confiar en lo que traiga la
 * pantalla dejaría que un formulario armado a mano fijara el precio que quisiera.
 *
 * Lo agotado no entra, igual que no entra en el mensaje de WhatsApp. Y si no queda nada disponible,
 * no se crea un pedido vacío: se devuelve el motivo para poder decirlo.
 *
 * **Un pedido por vendedor**: aunque el carrito lleve varias tiendas, aquí se confirma una. El
 * `checkoutId` que trae la entrada es lo que las vuelve a juntar: viene del carrito, no de aquí.
 */
export default class PlaceOrderUseCase {
  constructor(
    private readonly products: CartProductRepository,
    private readonly orders: OrderRepository,
  ) {}

  async execute({
    selection,
    buyerId,
    locale,
    fallbackLocale,
    sellerId,
    checkoutId,
    deliveryLocation,
  }: PlaceOrderInput): Promise<PlaceOrderResult> {
    const group = await this.findGroup(
      selection,
      locale,
      fallbackLocale,
      sellerId,
    );

    if (!group) return { error: "empty-for-seller" };

    const lines = toOrderLines(group);

    if (lines.length === 0) return { error: "nothing-available" };

    const newOrder: NewOrder = {
      checkoutId,
      sellerId: group.seller.id,
      buyerId,
      lines,
      deliveryLocation: validDestination(deliveryLocation),
    };

    const [order] = await this.orders.createAll([newOrder]);

    /* Qué renglones se llevó el pedido, para que quien llama vacíe justo esos del carrito y deje
       los de las otras tiendas. Sale de los renglones creados y no del grupo: lo agotado sigue en
       el carrito a propósito, porque nadie lo pidió. */
    /* `postId` es nulo en el TIPO porque un renglón leído puede haber perdido su publicación; en
       uno recién creado siempre lo hay. Se filtra en vez de forzarlo: lo que sale de aquí decide
       qué se vacía del carrito, y un `null` colado lo dejaría intacto sin que nadie lo notara. */
    return {
      order,
      orderedPostIds: lines.flatMap((line) =>
        line.postId ? [line.postId] : [],
      ),
    };
  }

  private async findGroup(
    selection: readonly CartSelection[],
    locale: string,
    fallbackLocale: string,
    sellerId: string,
  ): Promise<CartSellerGroup | null> {
    if (selection.length === 0) return null;

    const products = await this.products.findByIds(
      selection.map((line) => line.postId),
      locale,
      fallbackLocale,
    );
    const groups = groupBySeller(buildCartLines(selection, products));

    return groups.find((group) => group.seller.id === sellerId) ?? null;
  }
}

function validDestination(
  location: PlaceOrderInput["deliveryLocation"],
): NewOrder["deliveryLocation"] {
  if (!location) return null;

  return areValidCoordinates({
    latitude: location.lat,
    longitude: location.lng,
  })
    ? location
    : null;
}

/** El precio de hoy se copia al renglón: a partir de aquí, el pedido ya no cambia de importe. */
function toOrderLines(group: CartSellerGroup): NewOrderLine[] {
  return group.lines
    .filter((line) => line.product.isAvailable)
    .map((line) => ({
      postId: line.product.postId,
      title: line.product.title,
      unitPrice: line.product.price,
      quantity: line.quantity,
    }));
}
