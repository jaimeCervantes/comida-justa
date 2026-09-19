import type IPaymentGateway from "~/use_cases/payment/ports/IPaymentGateway";
import StripePaymentGateway from "./StripePaymentGateway";

let instance: IPaymentGateway | null = null;

/**
 * La pasarela de pago del sitio. Se leen `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` aquí y no en
 * el constructor, para que el adapter siga siendo testeable sin variables de entorno — mismo
 * patrón que `createTranslationService()` en `src/infra/services/factory.ts`.
 */
export function createPaymentGateway(): IPaymentGateway {
  if (instance) return instance;
  instance = new StripePaymentGateway({
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  });
  return instance;
}
