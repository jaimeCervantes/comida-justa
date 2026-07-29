import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../styling/merge-class-names";

export const fieldHelperClassName = cva(
  "m-0 text-sm mt-1.5 flex items-center gap-1",
  {
    variants: {
      tone: {
        neutral: "text-text-support",
        error: "text-feedback-error",
        success: "text-feedback-success",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type FieldHelperProps = ComponentPropsWithRef<"p"> &
  VariantProps<typeof fieldHelperClassName>;

export function FieldHelper({
  tone,
  className,
  children,
  ...props
}: FieldHelperProps) {
  if (!children) return null;
  return (
    <p className={cn(fieldHelperClassName({ tone }), className)} {...props}>
      {children}
    </p>
  );
}
