import type { ReactNode, ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className: string;
  disabled: boolean;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  color: "green" | "orange" | "black" | "white" | "default";
  type?: "button" | "submit" | "reset";
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
  startIcon: ReactNode;
  endIcon: ReactNode;
  isLoading: boolean;
};
