/**
 * Un evento de pago ya verificado, reducido a lo que este sitio necesita saber.
 *
 * `orderId`/`sellerId` vienen `null` cuando el evento no es de cobro confirmado (la pasarela manda
 * muchos tipos de evento al mismo webhook) o cuando no trae los metadatos que la sesión de checkout
 * le puso: en los dos casos no hay nada que marcar como pagado, y quien llama lo ignora igual.
 */
export interface PaymentWebhookEvent {
  /** El tipo tal como lo manda la pasarela, sin traducir: cada proveedor tiene los suyos. */
  type: string;
  orderId: string | null;
  sellerId: string | null;
}

/**
 * Lo que el sitio le pide a una pasarela de pago, sin importar cuál sea.
 *
 * Un solo método hoy porque es lo único que este slice necesita: confirmar que un pedido se cobró.
 * Crear la sesión de checkout y el link de alta de cuenta del vendedor son operaciones del mismo
 * puerto, pero llegan con el slice que las usa — añadirlas antes sería superficie sin quien la
 * llame.
 */
export default interface IPaymentGateway {
  /**
   * Verifica la firma del payload crudo y lo convierte en un evento del dominio.
   *
   * Firma y payload viajan por separado porque la pasarela firma el cuerpo exacto que mandó:
   * pasarlo ya parseado —y por tanto reserializado— invalidaría la firma con solo reordenar una
   * clave. Lanza `PaymentProviderError` si la firma no es válida.
   */
  constructWebhookEvent(
    payload: string,
    signature: string,
  ): PaymentWebhookEvent;
}
