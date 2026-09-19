import { type NextRequest, NextResponse } from "next/server";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { createPaymentGateway } from "~/infra/payments/factory";
import HandlePaymentWebhookUseCase from "~/use_cases/payment/handlePaymentWebhook/handlePaymentWebhookUseCase";

/**
 * Webhook de Stripe. Único punto del sitio que lee el cuerpo **crudo** de la petición: la firma se
 * calculó sobre esos bytes exactos, así que `request.json()` —que reserializa— la invalidaría.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Falta la firma del webhook" },
      { status: 400 },
    );
  }

  const payload = await request.text();

  try {
    const result = await new HandlePaymentWebhookUseCase(
      createPaymentGateway(),
      createOrderRepository(),
    ).execute({ payload, signature });

    /* Un pedido inexistente o en un estado que ya no admite el cobro no lo arregla un reintento:
       se acusa recibo con 200 para que Stripe no siga insistiendo en algo que nunca va a resolver
       solo. La firma inválida sí es distinta —cae al catch— porque ahí no hay evento de fiar. */
    return NextResponse.json({ received: true, result });
  } catch (error) {
    console.error("Error procesando el webhook de Stripe:", error);
    return NextResponse.json(
      { error: "No se pudo verificar el webhook" },
      { status: 400 },
    );
  }
}
