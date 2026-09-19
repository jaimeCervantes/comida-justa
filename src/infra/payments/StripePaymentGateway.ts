import Stripe from "stripe";
import PaymentProviderError from "~/domain/errors/PaymentProviderError";
import type IPaymentGateway from "~/use_cases/payment/ports/IPaymentGateway";
import type { PaymentWebhookEvent } from "~/use_cases/payment/ports/IPaymentGateway";

/**
 * El único tipo de evento que este slice sabe leer: una sesión de checkout que terminó de
 * cobrarse. Cualquier otro tipo (creación de cuenta Connect, reembolso, etc.) se devuelve con
 * `orderId`/`sellerId` en `null` y quien llama lo ignora — no es un error, es un evento que todavía
 * no le importa a nadie.
 */
const PAID_EVENT_TYPE = "checkout.session.completed";

export type StripePaymentGatewayOptions = {
  secretKey: string;
  webhookSecret: string;
};

/**
 * Adapter de `IPaymentGateway` para Stripe. Es el único punto del sitio que importa el SDK de
 * Stripe: el dominio y los casos de uso solo conocen el puerto.
 */
export default class StripePaymentGateway implements IPaymentGateway {
  private readonly client: Stripe;
  private readonly webhookSecret: string;

  constructor(options: StripePaymentGatewayOptions) {
    this.client = new Stripe(options.secretKey);
    this.webhookSecret = options.webhookSecret;
  }

  constructWebhookEvent(
    payload: string,
    signature: string,
  ): PaymentWebhookEvent {
    let event: Stripe.Event;
    try {
      event = this.client.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (error) {
      throw new PaymentProviderError(
        "La firma del webhook de Stripe no es válida.",
        error,
      );
    }

    if (event.type !== PAID_EVENT_TYPE) {
      return { type: event.type, orderId: null, sellerId: null };
    }

    /* El `orderId`/`sellerId` los pone quien crea la sesión de checkout (slice futuro, bloqueado
       hoy por la cuenta Connect del vendedor). Sin ellos, no hay qué marcar como pagado. */
    const session = event.data.object as Stripe.Checkout.Session;

    return {
      type: event.type,
      orderId: session.metadata?.orderId ?? null,
      sellerId: session.metadata?.sellerId ?? null,
    };
  }
}
