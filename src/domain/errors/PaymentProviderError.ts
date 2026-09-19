/**
 * La pasarela de pago no pudo verificar o procesar el evento.
 *
 * Cubre tanto una firma de webhook inválida como una respuesta que la pasarela no debió dar: las
 * dos son "no confío en este evento", y quien la dispara decide igual en los dos casos — no
 * procesarlo.
 */
export default class PaymentProviderError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "PaymentProviderError";
    this.cause = cause;
  }
}
