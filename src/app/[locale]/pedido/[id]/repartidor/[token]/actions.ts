"use server";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import ShareCourierLocationUseCase, {
  type ShareCourierLocationError,
} from "~/use_cases/courierTracking/shareCourierLocation/shareCourierLocationUseCase";

export type ShareCourierLocationState = { error?: ShareCourierLocationError };

/**
 * Guarda la posición del repartidor. **Sin sesión**: quien llama no está autenticado por cookie,
 * lo autentica el `orderId`+`token` que viajan en el propio `FormData`, igual que el pedido y el
 * estado viajan en el de `advanceOrder` — la diferencia es que aquí no hay nadie detrás a quien
 * pedirle una sesión.
 */
export async function shareCourierLocation(
  _prevState: ShareCourierLocationState,
  formData: FormData,
): Promise<ShareCourierLocationState> {
  const orderId = String(formData.get("orderId") ?? "");
  const token = String(formData.get("token") ?? "");
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  const result = await new ShareCourierLocationUseCase(
    createOrderRepository(),
  ).execute({ orderId, token, lat, lng });

  return "error" in result ? { error: result.error } : {};
}
