import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * Un aviso al visitante: algo salió bien, algo pide atención, algo falló.
 *
 * **El `role` depende del tono, no de quien lo usa.** Un error tiene que interrumpir a un lector de
 * pantalla (`role="alert"`, que es `aria-live="assertive"`); un aviso informativo no debe cortar lo
 * que la persona está leyendo (`role="status"`, `aria-live="polite"`). Dejarlo a elección de cada
 * llamada garantiza que tarde o temprano un error pase desapercibido o una confirmación interrumpa
 * a media frase.
 *
 * **El color nunca va solo.** Cada tono lleva su propio texto de etiqueta, porque quien no
 * distingue rojo de verde no puede leer un aviso cuyo único dato es el color del borde. Esa
 * etiqueta la pone quien llama, ya traducida: el design system no lee el catálogo de mensajes.
 */
const alertVariants = cva("flex gap-3 rounded-lg border p-4", {
  variants: {
    tone: {
      info: "border-separator bg-surface-elevation-2 text-text-base",
      success:
        "border-feedback-success/40 bg-feedback-success/10 text-text-base",
      warning:
        "border-feedback-warning/50 bg-feedback-warning/10 text-text-base",
      error: "border-feedback-error/40 bg-feedback-error/10 text-text-base",
    },
  },
  defaultVariants: { tone: "info" },
});

export type AlertTone = NonNullable<VariantProps<typeof alertVariants>["tone"]>;

/** Un error interrumpe; lo demás espera su turno. */
const ROLE_FOR_TONE: Record<AlertTone, "alert" | "status"> = {
  info: "status",
  success: "status",
  warning: "status",
  error: "alert",
};

export type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    /**
     * El nombre del tono, ya traducido («Error», «Listo»…). Se anuncia y se muestra, para que el
     * aviso siga siendo legible sin distinguir el color.
     */
    label: string;
    children?: ReactNode;
  };

export function Alert({
  tone,
  label,
  className,
  children,
  ...moreProps
}: AlertProps) {
  const resolvedTone: AlertTone = tone ?? "info";

  return (
    <div
      role={ROLE_FOR_TONE[resolvedTone]}
      className={cn(alertVariants({ tone }), className)}
      {...moreProps}
    >
      <p className="m-0">
        <strong className="font-semibold">{label}</strong>{" "}
        <span className="text-body">{children}</span>
      </p>
    </div>
  );
}
