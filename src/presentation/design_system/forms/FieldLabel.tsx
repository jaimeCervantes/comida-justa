import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

export type FieldLabelProps = ComponentPropsWithRef<"label"> & {
  suffix?: ReactNode;
  required?: boolean;
};

export function FieldLabel({
  suffix,
  required,
  children,
  className,
  ...props
}: FieldLabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: componente genérico del design system; quien lo usa pasa `htmlFor` vía props.
    <label
      className={cn(
        "block text-sm font-medium text-text-base mb-1.5",
        className,
      )}
      {...props}
    >
      {children}
      {/* `aria-hidden` porque quien usa lector de pantalla ya oye «obligatorio» del atributo
          `required` del control: el asterisco sería la misma información dicha dos veces. Lo que
          significa lo explica la leyenda de `ValidatedForm`, para quien lo ve. */}
      {required ? (
        <span aria-hidden="true" className="text-feedback-error ml-1">
          *
        </span>
      ) : null}
      {suffix ? (
        <span className="font-normal text-text-support ml-1">
          {" · "}
          {suffix}
        </span>
      ) : null}
    </label>
  );
}
