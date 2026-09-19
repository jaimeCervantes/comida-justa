import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import PaymentProviderError from "~/domain/errors/PaymentProviderError";
import StripePaymentGateway from "./StripePaymentGateway";

const WEBHOOK_SECRET = "whsec_test_secret";
const ORDER_ID = "order-1";
const SELLER_ID = "seller-1";

/**
 * Firma un payload como lo haría Stripe de verdad, con su propio helper de pruebas. Así el test
 * verifica la verificación real —crypto incluido— y no una firma inventada a mano.
 */
function sign(payload: string): string {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });
}

function checkoutSessionCompleted(
  metadata: Record<string, string> = {},
): string {
  return JSON.stringify({
    id: "evt_1",
    type: "checkout.session.completed",
    data: { object: { id: "cs_1", metadata } },
  });
}

function build() {
  return new StripePaymentGateway({
    secretKey: "sk_test_dummy",
    webhookSecret: WEBHOOK_SECRET,
  });
}

describe("StripePaymentGateway", () => {
  it("una sesión pagada con sus metadatos trae el pedido y el vendedor", () => {
    const payload = checkoutSessionCompleted({
      orderId: ORDER_ID,
      sellerId: SELLER_ID,
    });

    const event = build().constructWebhookEvent(payload, sign(payload));

    expect(event).toEqual({
      type: "checkout.session.completed",
      orderId: ORDER_ID,
      sellerId: SELLER_ID,
    });
  });

  /* Sin los metadatos —el caso de hoy, porque todavía no existe quien cree la sesión con ellos—
     no hay pedido que marcar, y quien llama lo trata como un evento a ignorar. */
  it("una sesión pagada sin metadatos no trae a quién marcar", () => {
    const payload = checkoutSessionCompleted();

    const event = build().constructWebhookEvent(payload, sign(payload));

    expect(event).toEqual({
      type: "checkout.session.completed",
      orderId: null,
      sellerId: null,
    });
  });

  it("un evento que no es de cobro se devuelve sin pedido ni vendedor", () => {
    const payload = JSON.stringify({
      id: "evt_2",
      type: "account.updated",
      data: { object: { id: "acct_1" } },
    });

    const event = build().constructWebhookEvent(payload, sign(payload));

    expect(event).toEqual({
      type: "account.updated",
      orderId: null,
      sellerId: null,
    });
  });

  it("una firma inválida no se procesa", () => {
    const payload = checkoutSessionCompleted({
      orderId: ORDER_ID,
      sellerId: SELLER_ID,
    });

    expect(() =>
      build().constructWebhookEvent(payload, "t=1,v1=firma-inventada"),
    ).toThrow(PaymentProviderError);
  });

  /* La firma se calcula sobre el payload exacto: uno reserializado por el medio —aunque diga lo
     mismo— ya no coincide, que es justo la garantía que se está comprobando. */
  it("un payload distinto al firmado tampoco pasa", () => {
    const firmado = checkoutSessionCompleted({ orderId: ORDER_ID });
    const alterado = checkoutSessionCompleted({ orderId: "otro-pedido" });

    expect(() =>
      build().constructWebhookEvent(alterado, sign(firmado)),
    ).toThrow(PaymentProviderError);
  });
});
